package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/item"
)

// maxBodyBytes caps JSON request bodies; larger bodies get 413.
const maxBodyBytes = 1 << 20

// Config holds server configuration
type Config struct {
	// Items is the item store. item.NewService() is in memory; swap in a
	// database-backed item.Store here.
	Items        item.Store
	Logger       *slog.Logger
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	// CORSOrigins lists the allowed browser origins. Empty or "*" allows any.
	CORSOrigins []string
}

// Server handles HTTP requests
type Server struct {
	items  item.Store
	logger *slog.Logger
	server *http.Server
	config Config
}

// NewServer creates a new API server
func NewServer(cfg Config) *Server {
	logger := cfg.Logger
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}
	return &Server{
		items:  cfg.Items,
		logger: logger,
		config: cfg,
	}
}

// Routes returns the HTTP handler with all routes configured
func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()

	// Health endpoints
	mux.HandleFunc("GET /health", s.handleHealth)
	mux.HandleFunc("GET /api/v1/health", s.handleHealth)

	// Item CRUD endpoints
	mux.HandleFunc("GET /api/v1/items", s.handleListItems)
	mux.HandleFunc("POST /api/v1/items", s.handleCreateItem)
	mux.HandleFunc("GET /api/v1/items/{id}", s.handleGetItem)
	mux.HandleFunc("PUT /api/v1/items/{id}", s.handleUpdateItem)
	mux.HandleFunc("DELETE /api/v1/items/{id}", s.handleDeleteItem)

	return s.withMiddleware(mux)
}

// Start starts the HTTP server
func (s *Server) Start(addr string) error {
	s.server = &http.Server{
		Addr:         addr,
		Handler:      s.Routes(),
		ReadTimeout:  s.config.ReadTimeout,
		WriteTimeout: s.config.WriteTimeout,
		IdleTimeout:  60 * time.Second,
	}

	return s.server.ListenAndServe()
}

// Shutdown gracefully shuts down the server
func (s *Server) Shutdown(ctx context.Context) error {
	if s.server != nil {
		return s.server.Shutdown(ctx)
	}
	return nil
}

// Middleware

func (s *Server) withMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		s.setCORSHeaders(w, r)

		// Preflight: answer before routing so every path accepts OPTIONS.
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Wrap response writer to capture status
		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		s.logger.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.status,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}

// setCORSHeaders allows any origin when CORSOrigins is empty or contains "*";
// otherwise it echoes the request's Origin only when it is listed.
func (s *Server) setCORSHeaders(w http.ResponseWriter, r *http.Request) {
	h := w.Header()
	origin := r.Header.Get("Origin")
	allowAll := len(s.config.CORSOrigins) == 0
	allowed := false
	for _, o := range s.config.CORSOrigins {
		if o == "*" {
			allowAll = true
		}
		if origin != "" && o == origin {
			allowed = true
		}
	}

	switch {
	case allowAll:
		h.Set("Access-Control-Allow-Origin", "*")
	case allowed:
		h.Set("Access-Control-Allow-Origin", origin)
		h.Add("Vary", "Origin")
	default:
		h.Add("Vary", "Origin")
		return
	}
	h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	h.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// Handlers

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	s.jsonResponse(w, map[string]interface{}{
		"status":  "ok",
		"service": "{{PLATFORM_SLUG}}",
	}, http.StatusOK)
}

func (s *Server) handleListItems(w http.ResponseWriter, r *http.Request) {
	items := s.items.List()
	s.jsonResponse(w, map[string]interface{}{
		"items": items,
		"count": len(items),
	}, http.StatusOK)
}

func (s *Server) handleCreateItem(w http.ResponseWriter, r *http.Request) {
	var req item.CreateRequest
	if !s.decodeJSON(w, r, &req) {
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		s.jsonError(w, "name is required", http.StatusBadRequest)
		return
	}

	created := s.items.Create(req)
	s.jsonResponse(w, created, http.StatusCreated)
}

func (s *Server) handleGetItem(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		s.jsonError(w, "id is required", http.StatusBadRequest)
		return
	}

	it, found := s.items.Get(id)
	if !found {
		s.jsonError(w, "item not found", http.StatusNotFound)
		return
	}

	s.jsonResponse(w, it, http.StatusOK)
}

func (s *Server) handleUpdateItem(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		s.jsonError(w, "id is required", http.StatusBadRequest)
		return
	}

	var req item.UpdateRequest
	if !s.decodeJSON(w, r, &req) {
		return
	}

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			s.jsonError(w, "name must not be empty", http.StatusBadRequest)
			return
		}
		req.Name = &name
	}

	updated, found := s.items.Update(id, req)
	if !found {
		s.jsonError(w, "item not found", http.StatusNotFound)
		return
	}

	s.jsonResponse(w, updated, http.StatusOK)
}

func (s *Server) handleDeleteItem(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		s.jsonError(w, "id is required", http.StatusBadRequest)
		return
	}

	if !s.items.Delete(id) {
		s.jsonError(w, "item not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper methods

// decodeJSON reads one JSON object from the body into dst. On failure it writes
// a 400 (or 413 for an oversized body) and returns false.
func (s *Server) decodeJSON(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			s.jsonError(w, "request body too large", http.StatusRequestEntityTooLarge)
			return false
		}
		s.jsonError(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return false
	}
	return true
}

func (s *Server) jsonResponse(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (s *Server) jsonError(w http.ResponseWriter, message string, status int) {
	s.jsonResponse(w, map[string]string{"error": message}, status)
}
