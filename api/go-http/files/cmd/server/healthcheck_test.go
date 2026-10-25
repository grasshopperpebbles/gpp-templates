package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHealthURL(t *testing.T) {
	tests := []struct {
		addr string
		want string
	}{
		{":8080", "http://127.0.0.1:8080/health"},
		{":9000", "http://127.0.0.1:9000/health"},
		{"0.0.0.0:8080", "http://127.0.0.1:8080/health"},
		{"[::]:8080", "http://127.0.0.1:8080/health"},
		{"127.0.0.1:3000", "http://127.0.0.1:3000/health"},
		{"localhost:3000", "http://localhost:3000/health"},
		{"[::1]:3000", "http://[::1]:3000/health"},
	}
	for _, tt := range tests {
		got, err := healthURL(tt.addr)
		if err != nil {
			t.Errorf("healthURL(%q) error: %v", tt.addr, err)
			continue
		}
		if got != tt.want {
			t.Errorf("healthURL(%q) = %q, want %q", tt.addr, got, tt.want)
		}
	}

	for _, bad := range []string{"8080", "", "host:"} {
		if _, err := healthURL(bad); err == nil {
			t.Errorf("healthURL(%q) = nil error, want one", bad)
		}
	}
}

func TestProbe(t *testing.T) {
	ok := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/health" {
			http.NotFound(w, r)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer ok.Close()
	if err := probe(ok.URL + "/health"); err != nil {
		t.Errorf("probe of healthy server: %v", err)
	}

	bad := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer bad.Close()
	if err := probe(bad.URL + "/health"); err == nil || !strings.Contains(err.Error(), "503") {
		t.Errorf("probe of 503 server = %v, want a 503 error", err)
	}

	addr := bad.Listener.Addr().String()
	bad.Close()
	if err := probe("http://" + addr + "/health"); err == nil {
		t.Error("probe of closed port = nil, want an error")
	}
}
