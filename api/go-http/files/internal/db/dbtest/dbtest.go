// Package dbtest gives tests a migrated Postgres pool in a schema of its own.
// Tests that use it skip unless TEST_DATABASE_URL is set, e.g.
//
//	docker run -d --name pg-test -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:16-alpine
//	TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/postgres go test -race ./...
package dbtest

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log/slog"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/db"
)

// EnvVar names the connection string the database tests use.
const EnvVar = "TEST_DATABASE_URL"

// URL returns TEST_DATABASE_URL, or skips the test when it is unset.
func URL(t testing.TB) string {
	t.Helper()
	url := os.Getenv(EnvVar)
	if url == "" {
		t.Skip(EnvVar + " not set; skipping Postgres test")
	}
	return url
}

// NewPool returns a pool whose search_path is a fresh, empty schema, so tests
// (and packages run in parallel) never see each other's tables. The schema is
// dropped when the test ends. The pool is not migrated; see NewMigratedPool.
func NewPool(t testing.TB) *pgxpool.Pool {
	t.Helper()
	url := URL(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		t.Fatal(err)
	}
	schema := "test_" + hex.EncodeToString(b)

	admin, err := pgx.Connect(ctx, url)
	if err != nil {
		t.Fatalf("connect to %s: %v", EnvVar, err)
	}
	defer admin.Close(ctx)
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+schema); err != nil {
		t.Fatalf("create schema: %v", err)
	}

	cfg, err := pgxpool.ParseConfig(url)
	if err != nil {
		t.Fatal(err)
	}
	cfg.ConnConfig.RuntimeParams["search_path"] = schema
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() {
		pool.Close()
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		conn, err := pgx.Connect(ctx, url)
		if err != nil {
			t.Errorf("drop schema %s: %v", schema, err)
			return
		}
		defer conn.Close(ctx)
		if _, err := conn.Exec(ctx, "DROP SCHEMA "+schema+" CASCADE"); err != nil {
			t.Errorf("drop schema %s: %v", schema, err)
		}
	})
	return pool
}

// NewMigratedPool is NewPool with the embedded migrations applied.
func NewMigratedPool(t testing.TB) *pgxpool.Pool {
	t.Helper()
	pool := NewPool(t)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if _, err := db.Migrate(ctx, pool); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return pool
}

// Logger discards log output.
func Logger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }
