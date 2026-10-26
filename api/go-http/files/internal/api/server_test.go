package api

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/item"
)

// newTestHandler returns the full handler (routes + middleware) over a fresh
// in-memory store, plus the store so tests can seed it.
func newTestHandler(t *testing.T, origins ...string) (http.Handler, *item.Service) {
	t.Helper()
	store := item.NewService()
	srv := NewServer(Config{Items: store, CORSOrigins: origins})
	return srv.Routes(), store
}

// mustCreate adds an item straight to the store.
func mustCreate(t *testing.T, store item.Store, name string) item.Item {
	t.Helper()
	it, err := store.Create(context.Background(), item.CreateRequest{Name: name})
	if err != nil {
		t.Fatal(err)
	}
	return it
}

// count returns how many items the store holds.
func count(t *testing.T, store item.Store) int {
	t.Helper()
	items, err := store.List(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	return len(items)
}

// do sends a request through h and returns the recorded response.
func do(t *testing.T, h http.Handler, method, path, body string, headers ...string) *httptest.ResponseRecorder {
	t.Helper()
	var req *http.Request
	if body == "" {
		req = httptest.NewRequest(method, path, nil)
	} else {
		req = httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
	}
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

// decode unmarshals the JSON body into a generic map and checks Content-Type.
func decode(t *testing.T, rec *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json (body %q)", ct, rec.Body.String())
	}
	var out map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("invalid JSON body %q: %v", rec.Body.String(), err)
	}
	return out
}

func TestHealth(t *testing.T) {
	h, _ := newTestHandler(t)

	for _, path := range []string{"/health", "/api/v1/health"} {
		t.Run(path, func(t *testing.T) {
			rec := do(t, h, http.MethodGet, path, "")
			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want 200", rec.Code)
			}
			body := decode(t, rec)
			if body["status"] != "ok" {
				t.Errorf("status field = %v, want ok", body["status"])
			}
			if _, ok := body["service"]; !ok {
				t.Error("missing service field")
			}
		})
	}
}

// pingStore is an in-memory store whose Ping returns err.
type pingStore struct {
	*item.Service
	err error
}

func (p pingStore) Ping(context.Context) error { return p.err }

func TestReady(t *testing.T) {
	tests := []struct {
		name         string
		store        item.Store
		wantStatus   int
		wantDatabase string
	}{
		{"memory store", item.NewService(), http.StatusOK, "memory"},
		{"database up", pingStore{item.NewService(), nil}, http.StatusOK, "ok"},
		{"database down", pingStore{item.NewService(), errors.New("dial tcp: connection refused")}, http.StatusServiceUnavailable, "unavailable"},
	}
	for _, tt := range tests {
		for _, path := range []string{"/ready", "/api/v1/ready"} {
			t.Run(tt.name+" "+path, func(t *testing.T) {
				h := NewServer(Config{Items: tt.store}).Routes()
				rec := do(t, h, http.MethodGet, path, "")
				if rec.Code != tt.wantStatus {
					t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
				}
				body := decode(t, rec)
				if body["database"] != tt.wantDatabase {
					t.Errorf("database = %v, want %q", body["database"], tt.wantDatabase)
				}
				if strings.Contains(rec.Body.String(), "refused") {
					t.Errorf("body leaks the ping error: %s", rec.Body.String())
				}
			})
		}
	}

	// /health is liveness only: still 200 with the database down.
	h := NewServer(Config{Items: pingStore{item.NewService(), errors.New("down")}}).Routes()
	if rec := do(t, h, http.MethodGet, "/health", ""); rec.Code != http.StatusOK {
		t.Errorf("/health with database down = %d, want 200", rec.Code)
	}
}

func TestCreateItem(t *testing.T) {
	tests := []struct {
		name            string
		body            string
		wantStatus      int
		wantError       string
		wantName        string
		wantStatusField string
	}{
		{name: "valid", body: `{"name":"Widget","description":"d"}`, wantStatus: http.StatusCreated, wantName: "Widget", wantStatusField: "active"},
		{name: "explicit status", body: `{"name":"Widget","status":"draft"}`, wantStatus: http.StatusCreated, wantName: "Widget", wantStatusField: "draft"},
		{name: "name is trimmed", body: `{"name":"  Widget  "}`, wantStatus: http.StatusCreated, wantName: "Widget", wantStatusField: "active"},
		{name: "missing name", body: `{"description":"x"}`, wantStatus: http.StatusBadRequest, wantError: "name is required"},
		{name: "blank name", body: `{"name":"   "}`, wantStatus: http.StatusBadRequest, wantError: "name is required"},
		{name: "malformed JSON", body: `{"name":`, wantStatus: http.StatusBadRequest, wantError: "invalid JSON body"},
		{name: "wrong type", body: `{"name":42}`, wantStatus: http.StatusBadRequest, wantError: "invalid JSON body"},
		{name: "unknown field", body: `{"name":"Widget","colour":"red"}`, wantStatus: http.StatusBadRequest, wantError: "invalid JSON body"},
		{name: "trailing data", body: `{"name":"Widget"} {"name":"again"}`, wantStatus: http.StatusBadRequest, wantError: "invalid JSON body"},
		{name: "trailing garbage", body: `{"name":"Widget"}x`, wantStatus: http.StatusBadRequest, wantError: "invalid JSON body"},
		{name: "empty body", body: ``, wantStatus: http.StatusBadRequest, wantError: "invalid JSON body"},
		{name: "too large", body: `{"name":"` + strings.Repeat("a", maxBodyBytes) + `"}`, wantStatus: http.StatusRequestEntityTooLarge, wantError: "too large"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h, store := newTestHandler(t)
			rec := do(t, h, http.MethodPost, "/api/v1/items", tt.body)
			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d (body %q)", rec.Code, tt.wantStatus, rec.Body.String())
			}
			body := decode(t, rec)

			if tt.wantError != "" {
				msg, _ := body["error"].(string)
				if !strings.Contains(msg, tt.wantError) {
					t.Errorf("error = %q, want it to contain %q", msg, tt.wantError)
				}
				if n := count(t, store); n != 0 {
					t.Errorf("store has %d items after a rejected create, want 0", n)
				}
				return
			}

			for _, field := range []string{"id", "name", "status", "created_at", "updated_at"} {
				if _, ok := body[field]; !ok {
					t.Errorf("response missing %q: %v", field, body)
				}
			}
			if body["name"] != tt.wantName {
				t.Errorf("name = %v, want %q", body["name"], tt.wantName)
			}
			if body["status"] != tt.wantStatusField {
				t.Errorf("status = %v, want %q", body["status"], tt.wantStatusField)
			}
			if _, err := store.Get(context.Background(), body["id"].(string)); err != nil {
				t.Error("created item not in store")
			}
		})
	}
}

func TestListItems(t *testing.T) {
	h, store := newTestHandler(t)

	rec := do(t, h, http.MethodGet, "/api/v1/items", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got := strings.TrimSpace(rec.Body.String()); got != `{"count":0,"items":[]}` {
		t.Errorf("empty list body = %s, want items as [] not null", got)
	}

	first := mustCreate(t, store, "first")
	mustCreate(t, store, "second")

	rec = do(t, h, http.MethodGet, "/api/v1/items", "")
	body := decode(t, rec)
	if body["count"] != float64(2) {
		t.Errorf("count = %v, want 2", body["count"])
	}
	items, ok := body["items"].([]interface{})
	if !ok || len(items) != 2 {
		t.Fatalf("items = %v, want 2 entries", body["items"])
	}
	if items[0].(map[string]interface{})["id"] != first.ID {
		t.Error("items not ordered oldest first")
	}
}

func TestItemByID(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		missing    bool // use an unknown id
		body       string
		wantStatus int
		wantName   string
	}{
		{name: "get", method: http.MethodGet, wantStatus: http.StatusOK, wantName: "original"},
		{name: "get unknown", method: http.MethodGet, missing: true, wantStatus: http.StatusNotFound},
		{name: "update name", method: http.MethodPut, body: `{"name":"renamed"}`, wantStatus: http.StatusOK, wantName: "renamed"},
		{name: "update other field keeps name", method: http.MethodPut, body: `{"status":"archived"}`, wantStatus: http.StatusOK, wantName: "original"},
		{name: "update blank name", method: http.MethodPut, body: `{"name":" "}`, wantStatus: http.StatusBadRequest},
		{name: "update malformed", method: http.MethodPut, body: `nope`, wantStatus: http.StatusBadRequest},
		{name: "update unknown", method: http.MethodPut, missing: true, body: `{"name":"x"}`, wantStatus: http.StatusNotFound},
		{name: "delete", method: http.MethodDelete, wantStatus: http.StatusNoContent},
		{name: "delete unknown", method: http.MethodDelete, missing: true, wantStatus: http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h, store := newTestHandler(t)
			created := mustCreate(t, store, "original")
			id := created.ID
			if tt.missing {
				id = "does-not-exist"
			}

			rec := do(t, h, tt.method, "/api/v1/items/"+id, tt.body)
			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d (body %q)", rec.Code, tt.wantStatus, rec.Body.String())
			}

			switch {
			case rec.Code == http.StatusNoContent:
				if rec.Body.Len() != 0 {
					t.Errorf("204 body = %q, want empty", rec.Body.String())
				}
				if _, err := store.Get(context.Background(), created.ID); !errors.Is(err, item.ErrNotFound) {
					t.Error("item still in store after delete")
				}
			case rec.Code >= 400:
				if body := decode(t, rec); body["error"] == nil || body["error"] == "" {
					t.Errorf("error response without error message: %v", body)
				}
				if got, _ := store.Get(context.Background(), created.ID); got.Name != "original" {
					t.Errorf("failed request changed the item: name = %q", got.Name)
				}
			default:
				body := decode(t, rec)
				if body["id"] != created.ID || body["name"] != tt.wantName {
					t.Errorf("body = %v, want id %s name %q", body, created.ID, tt.wantName)
				}
			}
		})
	}
}

func TestRouting(t *testing.T) {
	h, _ := newTestHandler(t)
	tests := []struct {
		method, path string
		wantStatus   int
	}{
		{http.MethodGet, "/nope", http.StatusNotFound},
		{http.MethodPatch, "/api/v1/items", http.StatusMethodNotAllowed},
		{http.MethodPost, "/health", http.StatusMethodNotAllowed},
	}
	for _, tt := range tests {
		t.Run(tt.method+" "+tt.path, func(t *testing.T) {
			if rec := do(t, h, tt.method, tt.path, ""); rec.Code != tt.wantStatus {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
		})
	}
}

func TestCORS(t *testing.T) {
	tests := []struct {
		name       string
		origins    []string
		method     string
		origin     string
		wantStatus int
		wantACAO   string
	}{
		{name: "default allows any", method: http.MethodGet, origin: "http://a.test", wantStatus: http.StatusOK, wantACAO: "*"},
		{name: "wildcard entry", origins: []string{"*"}, method: http.MethodGet, origin: "http://a.test", wantStatus: http.StatusOK, wantACAO: "*"},
		{name: "listed origin echoed", origins: []string{"http://a.test", "http://b.test"}, method: http.MethodGet, origin: "http://b.test", wantStatus: http.StatusOK, wantACAO: "http://b.test"},
		{name: "unlisted origin gets no header", origins: []string{"http://a.test"}, method: http.MethodGet, origin: "http://evil.test", wantStatus: http.StatusOK, wantACAO: ""},
		{name: "preflight", origins: []string{"http://a.test"}, method: http.MethodOptions, origin: "http://a.test", wantStatus: http.StatusNoContent, wantACAO: "http://a.test"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h, _ := newTestHandler(t, tt.origins...)
			rec := do(t, h, tt.method, "/api/v1/items", "",
				"Origin", tt.origin, "Access-Control-Request-Method", "POST")
			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if got := rec.Header().Get("Access-Control-Allow-Origin"); got != tt.wantACAO {
				t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, tt.wantACAO)
			}
			hasMethods := rec.Header().Get("Access-Control-Allow-Methods") != ""
			if hasMethods != (tt.wantACAO != "") {
				t.Errorf("Access-Control-Allow-Methods present = %v, want %v", hasMethods, tt.wantACAO != "")
			}
		})
	}
}

// TestConcurrentRequests exercises the store under parallel writes and reads;
// run with -race to catch shared-memory bugs.
func TestConcurrentRequests(t *testing.T) {
	h, store := newTestHandler(t)
	seed := mustCreate(t, store, "seed")

	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(3)
		go func() { defer wg.Done(); do(t, h, http.MethodPost, "/api/v1/items", `{"name":"n"}`) }()
		go func() { defer wg.Done(); do(t, h, http.MethodPut, "/api/v1/items/"+seed.ID, `{"metadata":{"k":"v"}}`) }()
		go func() { defer wg.Done(); do(t, h, http.MethodGet, "/api/v1/items", "") }()
	}
	wg.Wait()

	if n := count(t, store); n != 21 {
		t.Errorf("store has %d items, want 21", n)
	}
}

// failingStore fails every call with err, to check how handlers map store errors.
type failingStore struct{ err error }

func (f failingStore) List(context.Context) ([]item.Item, error)      { return nil, f.err }
func (f failingStore) Get(context.Context, string) (item.Item, error) { return item.Item{}, f.err }
func (f failingStore) Create(context.Context, item.CreateRequest) (item.Item, error) {
	return item.Item{}, f.err
}
func (f failingStore) Update(context.Context, string, item.UpdateRequest) (item.Item, error) {
	return item.Item{}, f.err
}
func (f failingStore) Delete(context.Context, string) error { return f.err }

// TestStoreErrors checks store failures become 404/503/500 with a fixed
// message, never the store's error text.
func TestStoreErrors(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantError  string
	}{
		{"not found", item.ErrNotFound, http.StatusNotFound, "item not found"},
		{"wrapped not found", fmt.Errorf("get: %w", item.ErrNotFound), http.StatusNotFound, "item not found"},
		{"timeout", fmt.Errorf("query: %w", context.DeadlineExceeded), http.StatusServiceUnavailable, "service unavailable"},
		{"other", errors.New("pq: password=secret connection refused"), http.StatusInternalServerError, "internal server error"},
	}
	requests := []struct{ method, path, body string }{
		{http.MethodGet, "/api/v1/items", ""},
		{http.MethodPost, "/api/v1/items", `{"name":"x"}`},
		{http.MethodGet, "/api/v1/items/abc", ""},
		{http.MethodPut, "/api/v1/items/abc", `{"name":"x"}`},
		{http.MethodDelete, "/api/v1/items/abc", ""},
	}
	for _, tt := range tests {
		for _, rq := range requests {
			t.Run(tt.name+" "+rq.method+" "+rq.path, func(t *testing.T) {
				h := NewServer(Config{Items: failingStore{tt.err}}).Routes()
				rec := do(t, h, rq.method, rq.path, rq.body)
				if rec.Code != tt.wantStatus {
					t.Fatalf("status = %d, want %d (body %q)", rec.Code, tt.wantStatus, rec.Body.String())
				}
				if got := decode(t, rec)["error"]; got != tt.wantError {
					t.Errorf("error = %q, want %q", got, tt.wantError)
				}
			})
		}
	}
}

// TestServerOverHTTP runs the handler on a real listener, as the container does.
func TestServerOverHTTP(t *testing.T) {
	h, _ := newTestHandler(t)
	ts := httptest.NewServer(h)
	defer ts.Close()

	resp, err := http.Post(ts.URL+"/api/v1/items", "application/json", strings.NewReader(`{"name":"over the wire"}`))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
	var got item.Item
	if err := json.NewDecoder(resp.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.ID == "" || got.Name != "over the wire" || got.CreatedAt.IsZero() {
		t.Errorf("decoded item = %+v", got)
	}
}

// TestDecodeErrorsAreStable checks that bad bodies get a fixed message, never
// the decoder's error text (which leaks field names and offsets).
func TestDecodeErrorsAreStable(t *testing.T) {
	bodies := map[string]string{
		"malformed":     `{"name":`,
		"wrong type":    `{"name":42}`,
		"unknown field": `{"name":"x","secret_field":1}`,
		"trailing data": `{"name":"x"}{}`,
	}
	for name, b := range bodies {
		t.Run(name, func(t *testing.T) {
			h, store := newTestHandler(t)
			for _, method := range []string{http.MethodPost, http.MethodPut} {
				path := "/api/v1/items"
				if method == http.MethodPut {
					path += "/" + mustCreate(t, store, "seed").ID
				}
				rec := do(t, h, method, path, b)
				if rec.Code != http.StatusBadRequest {
					t.Fatalf("%s status = %d, want 400 (body %q)", method, rec.Code, rec.Body.String())
				}
				if got := decode(t, rec)["error"]; got != "invalid JSON body" {
					t.Errorf("%s error = %q, want %q", method, got, "invalid JSON body")
				}
			}
		})
	}
}

// TestServerTimeouts checks NewServer builds the http.Server with timeouts,
// including ReadHeaderTimeout (slowloris), and defaults zero values.
func TestServerTimeouts(t *testing.T) {
	s := NewServer(Config{Items: item.NewService()})
	if s.server == nil {
		t.Fatal("NewServer did not build the http.Server")
	}
	for name, d := range map[string]time.Duration{
		"ReadHeaderTimeout": s.server.ReadHeaderTimeout,
		"ReadTimeout":       s.server.ReadTimeout,
		"WriteTimeout":      s.server.WriteTimeout,
		"IdleTimeout":       s.server.IdleTimeout,
	} {
		if d <= 0 {
			t.Errorf("%s = %v, want > 0", name, d)
		}
	}

	s = NewServer(Config{Items: item.NewService(), ReadTimeout: 3 * time.Second, WriteTimeout: 4 * time.Second})
	if s.server.ReadTimeout != 3*time.Second || s.server.WriteTimeout != 4*time.Second {
		t.Errorf("configured timeouts not applied: read %v write %v", s.server.ReadTimeout, s.server.WriteTimeout)
	}
}

// freeAddr returns a loopback address with a port that was free a moment ago.
func freeAddr(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := ln.Addr().String()
	ln.Close()
	return addr
}

// TestStartShutdown serves real requests, then shuts down while Start runs on
// another goroutine, as main does. Run with -race.
func TestStartShutdown(t *testing.T) {
	s := NewServer(Config{Items: item.NewService()})
	addr := freeAddr(t)

	errc := make(chan error, 1)
	go func() { errc <- s.Start(addr) }()

	var resp *http.Response
	var err error
	for deadline := time.Now().Add(5 * time.Second); time.Now().Before(deadline); time.Sleep(20 * time.Millisecond) {
		if resp, err = http.Get("http://" + addr + "/health"); err == nil {
			break
		}
	}
	if err != nil {
		t.Fatalf("server never came up: %v", err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("/health status = %d, want 200", resp.StatusCode)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := s.Shutdown(ctx); err != nil {
		t.Fatalf("Shutdown: %v", err)
	}
	select {
	case err := <-errc:
		if !errors.Is(err, http.ErrServerClosed) {
			t.Fatalf("Start returned %v, want http.ErrServerClosed", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Start did not return after Shutdown")
	}
}

// TestShutdownRacesStart calls Shutdown at the same moment Start begins: the
// race detector flags any unsynchronised access to the http.Server.
func TestShutdownRacesStart(t *testing.T) {
	for i := 0; i < 20; i++ {
		s := NewServer(Config{Items: item.NewService()})
		errc := make(chan error, 1)
		go func() { errc <- s.Start("127.0.0.1:0") }()

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		if err := s.Shutdown(ctx); err != nil {
			t.Fatalf("Shutdown: %v", err)
		}
		cancel()
		select {
		case err := <-errc:
			if err != nil && !errors.Is(err, http.ErrServerClosed) {
				t.Fatalf("Start returned %v", err)
			}
		case <-time.After(5 * time.Second):
			t.Fatal("Start kept running after Shutdown")
		}
	}
}
