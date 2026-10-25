package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

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
		{name: "malformed JSON", body: `{"name":`, wantStatus: http.StatusBadRequest, wantError: "invalid request body"},
		{name: "wrong type", body: `{"name":42}`, wantStatus: http.StatusBadRequest, wantError: "invalid request body"},
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
				if n := len(store.List()); n != 0 {
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
			if _, found := store.Get(body["id"].(string)); !found {
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

	first := store.Create(item.CreateRequest{Name: "first"})
	store.Create(item.CreateRequest{Name: "second"})

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
			created := store.Create(item.CreateRequest{Name: "original"})
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
				if _, found := store.Get(created.ID); found {
					t.Error("item still in store after delete")
				}
			case rec.Code >= 400:
				if body := decode(t, rec); body["error"] == nil || body["error"] == "" {
					t.Errorf("error response without error message: %v", body)
				}
				if got, _ := store.Get(created.ID); got.Name != "original" {
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
	seed := store.Create(item.CreateRequest{Name: "seed"})

	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(3)
		go func() { defer wg.Done(); do(t, h, http.MethodPost, "/api/v1/items", `{"name":"n"}`) }()
		go func() { defer wg.Done(); do(t, h, http.MethodPut, "/api/v1/items/"+seed.ID, `{"metadata":{"k":"v"}}`) }()
		go func() { defer wg.Done(); do(t, h, http.MethodGet, "/api/v1/items", "") }()
	}
	wg.Wait()

	if n := len(store.List()); n != 21 {
		t.Errorf("store has %d items, want 21", n)
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
