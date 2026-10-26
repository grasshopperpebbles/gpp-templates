package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/item"
)

// maxBodyBytes caps JSON request bodies; larger bodies get 413.
const maxBodyBytes = 1 << 20

// Timeouts used when Config leaves them zero.
const (
	defaultReadHeaderTimeout = 5 * time.Second
	defaultReadTimeout       = 10 * time.Second
	defaultWriteTimeout      = 30 * time.Second
	defaultIdleTimeout       = 60 * time.Second
)

// errInvalidJSON is the only decode error clients see; decoder details stay in
// the server log.
const errInvalidJSON = "invalid JSON body"

// Config holds server configuration
type Config struct {
	// Items is the item store: item.NewService() (memory) or
	// a database-backed item.Store, chosen in cmd/server/main.go.
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
	s := &Server{
		items:  cfg.Items,
		logger: logger,
		config: cfg,
	}
	// Built once here so Start and Shutdown, which run on different
	// goroutines, only read s.server and never race on assigning it.
	s.server = &http.Server{
		Handler:           s.Routes(),
		ReadHeaderTimeout: defaultReadHeaderTimeout,
		ReadTimeout:       orDefault(cfg.ReadTimeout, defaultReadTimeout),
		WriteTimeout:      orDefault(cfg.WriteTimeout, defaultWriteTimeout),
		IdleTimeout:       defaultIdleTimeout,
		ErrorLog:          slog.NewLogLogger(logger.Handler(), slog.LevelWarn),
	}
	return s
}

func orDefault(d, def time.Duration) time.Duration {
	if d > 0 {
		return d
	}
	return def
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

// Start listens on addr and serves until Shutdown, then returns
// http.ErrServerClosed. Safe to call Shutdown concurrently, even before Start
// has begun listening (Start then returns http.ErrServerClosed at once).
func (s *Server) Start(addr string) error {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	return s.server.Serve(ln)
}

// Shutdown gracefully shuts down the server.
func (s *Server) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
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
	items, err := s.items.List(r.Context())
	if err != nil {
		s.storeError(w, r, err)
		return
	}
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

	created, err := s.items.Create(r.Context(), req)
	if err != nil {
		s.storeError(w, r, err)
		return
	}
	s.jsonResponse(w, created, http.StatusCreated)
}

func (s *Server) handleGetItem(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		s.jsonError(w, "id is required", http.StatusBadRequest)
		return
	}

	it, err := s.items.Get(r.Context(), id)
	if err != nil {
		s.storeError(w, r, err)
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

	updated, err := s.items.Update(r.Context(), id, req)
	if err != nil {
		s.storeError(w, r, err)
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

	if err := s.items.Delete(r.Context(), id); err != nil {
		s.storeError(w, r, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper methods

// decodeJSON reads exactly one JSON object from the body into dst, rejecting
// unknown fields and trailing data. On failure it writes a 400 with a fixed
// message (or 413 for a body over maxBodyBytes) and returns false.
func (s *Server) decodeJSON(w http.ResponseWriter, r *http.Request, dst interface{}) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	err := dec.Decode(dst)
	if err == nil {
		// Anything after the object, even another valid object, is an error.
		if _, tokErr := dec.Token(); !errors.Is(tokErr, io.EOF) {
			err = errors.New("trailing data after JSON object")
			if tokErr != nil {
				err = tokErr
			}
		}
	}
	if err == nil {
		return true
	}

	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		s.jsonError(w, "request body too large", http.StatusRequestEntityTooLarge)
		return false
	}
	s.logger.Debug("rejected JSON body", "path", r.URL.Path, "error", err)
	s.jsonError(w, errInvalidJSON, http.StatusBadRequest)
	return false
}

func (s *Server) jsonResponse(w http.ResponseWriter, data interface{}, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// storeError answers a failed store call: 404 for item.ErrNotFound, 503 when
// the store timed out, 500 otherwise. Store details stay in the server log.
func (s *Server) storeError(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, item.ErrNotFound):
		s.jsonError(w, "item not found", http.StatusNotFound)
	case errors.Is(err, context.DeadlineExceeded):
		s.logger.Error("store timeout", "method", r.Method, "path", r.URL.Path, "error", err)
		s.jsonError(w, "service unavailable", http.StatusServiceUnavailable)
	case errors.Is(err, context.Canceled) && r.Context().Err() != nil:
		// The client went away; nobody reads this response.
		s.logger.Debug("request canceled", "method", r.Method, "path", r.URL.Path)
		s.jsonError(w, "request canceled", http.StatusServiceUnavailable)
	default:
		s.logger.Error("store error", "method", r.Method, "path", r.URL.Path, "error", err)
		s.jsonError(w, "internal server error", http.StatusInternalServerError)
	}
}

func (s *Server) jsonError(w http.ResponseWriter, message string, status int) {
	s.jsonResponse(w, map[string]string{"error": message}, status)
}
