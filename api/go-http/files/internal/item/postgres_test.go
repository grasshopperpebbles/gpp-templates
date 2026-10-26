package item

import (
	"context"
	"errors"
	"testing"
	"time"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/db/dbtest"
)

// The tests in this file skip unless TEST_DATABASE_URL is set (see dbtest).

func TestPostgresStore(t *testing.T) {
	dbtest.URL(t)
	runStoreContract(t, func(t *testing.T) Store {
		return NewPostgresStore(dbtest.NewMigratedPool(t), 0)
	})
}

func TestPostgresStoreNotFoundIDs(t *testing.T) {
	s := NewPostgresStore(dbtest.NewMigratedPool(t), 0)
	ctx := context.Background()
	created, err := s.Create(ctx, CreateRequest{Name: "x"})
	if err != nil {
		t.Fatal(err)
	}
	name := "y"
	// Not UUIDs, or not in canonical lower-case form: never a row, never a 500.
	for _, id := range []string{"abc", "'; DROP TABLE items; --", "{" + created.ID + "}", "urn:uuid:" + created.ID} {
		if _, err := s.Get(ctx, id); !errors.Is(err, ErrNotFound) {
			t.Errorf("Get(%q) = %v, want ErrNotFound", id, err)
		}
		if _, err := s.Update(ctx, id, UpdateRequest{Name: &name}); !errors.Is(err, ErrNotFound) {
			t.Errorf("Update(%q) = %v, want ErrNotFound", id, err)
		}
		if err := s.Delete(ctx, id); !errors.Is(err, ErrNotFound) {
			t.Errorf("Delete(%q) = %v, want ErrNotFound", id, err)
		}
	}
	if got, err := s.Get(ctx, created.ID); err != nil || got.Name != "x" {
		t.Errorf("item changed by not-found calls: %+v, %v", got, err)
	}
}

func TestPostgresStoreTimeouts(t *testing.T) {
	pool := dbtest.NewMigratedPool(t)

	// A store timeout shorter than any round trip: every call times out.
	s := NewPostgresStore(pool, time.Nanosecond)
	ctx := context.Background()
	if _, err := s.List(ctx); !errors.Is(err, context.DeadlineExceeded) {
		t.Errorf("List with 1ns timeout = %v, want DeadlineExceeded", err)
	}
	if _, err := s.Create(ctx, CreateRequest{Name: "x"}); !errors.Is(err, context.DeadlineExceeded) {
		t.Errorf("Create with 1ns timeout = %v, want DeadlineExceeded", err)
	}
	if err := s.Ping(ctx); err == nil {
		t.Error("Ping with 1ns timeout succeeded")
	}

	// The caller's context still applies under a generous store timeout.
	s = NewPostgresStore(pool, time.Minute)
	canceled, cancel := context.WithCancel(ctx)
	cancel()
	if _, err := s.Get(canceled, "00000000-0000-0000-0000-000000000001"); !errors.Is(err, context.Canceled) {
		t.Errorf("Get with canceled context = %v, want context.Canceled", err)
	}
	if err := s.Ping(ctx); err != nil {
		t.Errorf("Ping: %v", err)
	}
}

func TestPostgresStoreClosedPool(t *testing.T) {
	pool := dbtest.NewMigratedPool(t)
	s := NewPostgresStore(pool, 0)
	pool.Close()
	ctx := context.Background()
	if _, err := s.List(ctx); err == nil || errors.Is(err, ErrNotFound) {
		t.Errorf("List on closed pool = %v, want a non-not-found error", err)
	}
	if err := s.Ping(ctx); err == nil {
		t.Error("Ping on closed pool succeeded")
	}
}
