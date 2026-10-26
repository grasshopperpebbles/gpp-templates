package main

import (
	"io"
	"log/slog"
	"strings"
	"testing"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/item"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/pkg/config"
)

func TestOpenItemStore(t *testing.T) {
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))

	store, pool, err := openItemStore(config.Config{}, logger)
	if err != nil || pool != nil {
		t.Fatalf("no DATABASE_URL: pool %v, err %v; want memory store", pool, err)
	}
	if _, ok := store.(*item.Service); !ok {
		t.Errorf("no DATABASE_URL: store is %T, want *item.Service", store)
	}

	// A set but unusable DATABASE_URL fails startup instead of using memory.
	_, pool, err = openItemStore(config.Config{DatabaseURL: "postgres://u:s3cret@host:notaport/db"}, logger)
	if err == nil || pool != nil {
		t.Fatalf("bad DATABASE_URL: pool %v, err %v; want an error", pool, err)
	}
	if strings.Contains(err.Error(), "s3cret") {
		t.Errorf("error leaks the password: %v", err)
	}
}
