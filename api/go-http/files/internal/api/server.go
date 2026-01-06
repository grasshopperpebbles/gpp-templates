package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/item"
)

// Config holds server configuration
type Config struct {
	ItemService  *item.Service
	Logger       *slog.Logger
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// Server handles HTTP requests
type Server struct {
	items  *item.Service
	logger *slog.Logger
	server *http.Server
	config Config
}

// NewServer creates a new API server
func NewServer(cfg Config) *Server {
	return &Server{
		items:  cfg.ItemService,
		logger: cfg.Logger,
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

		// CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Wrap response writer to capture status
		wrapped := &responseWriter{ResponseWriter: w, status: 200}

		next.ServeHTTP(wrapped, r)

		s.logger.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.status,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
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
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.jsonError(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

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
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.jsonError(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
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

func (s *Server) jsonResponse(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func (s *Server) jsonError(w http.ResponseWriter, message string, status int) {
	s.jsonResponse(w, map[string]string{"error": message}, status)
}
