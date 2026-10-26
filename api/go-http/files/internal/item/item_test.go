package item

import (
	"context"
	"errors"
	"reflect"
	"sync"
	"testing"
	"time"
)

func TestService(t *testing.T) {
	runStoreContract(t, func(t *testing.T) Store { return NewService() })
}

// runStoreContract checks the behaviour every Store must have. The in-memory
// Service runs it always; PostgresStore runs it when TEST_DATABASE_URL is set.
func runStoreContract(t *testing.T, newStore func(t *testing.T) Store) {
	ctx := context.Background()
	str := func(s string) *string { return &s }

	t.Run("create sets defaults", func(t *testing.T) {
		s := newStore(t)
		it, err := s.Create(ctx, CreateRequest{Name: "Test Item", Description: "A test item"})
		if err != nil {
			t.Fatal(err)
		}
		if it.ID == "" {
			t.Error("expected ID to be set")
		}
		if it.Name != "Test Item" || it.Description != "A test item" {
			t.Errorf("name/description = %q/%q", it.Name, it.Description)
		}
		if it.Status != DefaultStatus {
			t.Errorf("default status = %q, want %q", it.Status, DefaultStatus)
		}
		if it.CreatedAt.IsZero() || !it.CreatedAt.Equal(it.UpdatedAt) {
			t.Errorf("created_at %v, updated_at %v: want equal and set", it.CreatedAt, it.UpdatedAt)
		}
		if it.Metadata != nil {
			t.Errorf("metadata = %v, want nil when none given", it.Metadata)
		}
	})

	t.Run("create keeps status and metadata", func(t *testing.T) {
		s := newStore(t)
		md := map[string]string{"k": "v", "unicode": "é ✓"}
		it, err := s.Create(ctx, CreateRequest{Name: "x", Status: "draft", Metadata: md})
		if err != nil {
			t.Fatal(err)
		}
		md["k"] = "changed by caller"
		got, err := s.Get(ctx, it.ID)
		if err != nil {
			t.Fatal(err)
		}
		if got.Status != "draft" {
			t.Errorf("status = %q, want draft", got.Status)
		}
		if want := map[string]string{"k": "v", "unicode": "é ✓"}; !reflect.DeepEqual(got.Metadata, want) {
			t.Errorf("metadata = %v, want %v", got.Metadata, want)
		}
	})

	t.Run("get", func(t *testing.T) {
		s := newStore(t)
		created, _ := s.Create(ctx, CreateRequest{Name: "Test"})
		got, err := s.Get(ctx, created.ID)
		if err != nil {
			t.Fatalf("Get: %v", err)
		}
		if got.ID != created.ID || got.Name != "Test" || !got.CreatedAt.Equal(created.CreatedAt) {
			t.Errorf("Get = %+v, want %+v", got, created)
		}
		for _, id := range []string{"nonexistent", "", "00000000-0000-0000-0000-000000000000"} {
			if _, err := s.Get(ctx, id); !errors.Is(err, ErrNotFound) {
				t.Errorf("Get(%q) error = %v, want ErrNotFound", id, err)
			}
		}
	})

	t.Run("list oldest first", func(t *testing.T) {
		s := newStore(t)
		if items, err := s.List(ctx); err != nil || items == nil || len(items) != 0 {
			t.Fatalf("empty List = %v, %v; want [] (not nil)", items, err)
		}
		var ids []string
		for _, name := range []string{"Item 1", "Item 2", "Item 3"} {
			it, err := s.Create(ctx, CreateRequest{Name: name})
			if err != nil {
				t.Fatal(err)
			}
			ids = append(ids, it.ID)
			time.Sleep(2 * time.Millisecond) // distinct created_at
		}
		items, err := s.List(ctx)
		if err != nil {
			t.Fatal(err)
		}
		var got []string
		for _, it := range items {
			got = append(got, it.ID)
		}
		if !reflect.DeepEqual(got, ids) {
			t.Errorf("List order = %v, want %v", got, ids)
		}
	})

	t.Run("update", func(t *testing.T) {
		s := newStore(t)
		created, _ := s.Create(ctx, CreateRequest{Name: "Original", Description: "d", Metadata: map[string]string{"a": "1"}})
		time.Sleep(2 * time.Millisecond)

		updated, err := s.Update(ctx, created.ID, UpdateRequest{Name: str("Updated")})
		if err != nil {
			t.Fatalf("Update: %v", err)
		}
		if updated.Name != "Updated" || updated.Description != "d" || updated.Status != DefaultStatus {
			t.Errorf("partial update = %+v; want only name changed", updated)
		}
		if !reflect.DeepEqual(updated.Metadata, map[string]string{"a": "1"}) {
			t.Errorf("metadata = %v, want unchanged", updated.Metadata)
		}
		if !updated.UpdatedAt.After(created.UpdatedAt) || !updated.CreatedAt.Equal(created.CreatedAt) {
			t.Errorf("timestamps: created %v→%v, updated %v→%v", created.CreatedAt, updated.CreatedAt, created.UpdatedAt, updated.UpdatedAt)
		}

		updated, err = s.Update(ctx, created.ID, UpdateRequest{
			Description: str(""), Status: str("archived"), Metadata: map[string]string{"b": "2"},
		})
		if err != nil {
			t.Fatal(err)
		}
		if updated.Name != "Updated" || updated.Description != "" || updated.Status != "archived" ||
			!reflect.DeepEqual(updated.Metadata, map[string]string{"b": "2"}) {
			t.Errorf("second update = %+v", updated)
		}
		if got, _ := s.Get(ctx, created.ID); !reflect.DeepEqual(got, updated) {
			t.Errorf("Get after update = %+v, want %+v", got, updated)
		}

		if _, err := s.Update(ctx, "nonexistent", UpdateRequest{Name: str("x")}); !errors.Is(err, ErrNotFound) {
			t.Errorf("Update unknown error = %v, want ErrNotFound", err)
		}
	})

	t.Run("delete", func(t *testing.T) {
		s := newStore(t)
		created, _ := s.Create(ctx, CreateRequest{Name: "ToDelete"})
		keep, _ := s.Create(ctx, CreateRequest{Name: "Keep"})

		if err := s.Delete(ctx, created.ID); err != nil {
			t.Fatalf("Delete: %v", err)
		}
		if _, err := s.Get(ctx, created.ID); !errors.Is(err, ErrNotFound) {
			t.Errorf("Get after delete error = %v, want ErrNotFound", err)
		}
		if err := s.Delete(ctx, created.ID); !errors.Is(err, ErrNotFound) {
			t.Errorf("second Delete error = %v, want ErrNotFound", err)
		}
		if err := s.Delete(ctx, "nonexistent"); !errors.Is(err, ErrNotFound) {
			t.Errorf("Delete unknown error = %v, want ErrNotFound", err)
		}
		if items, _ := s.List(ctx); len(items) != 1 || items[0].ID != keep.ID {
			t.Errorf("List after delete = %v, want only %s", items, keep.ID)
		}
	})

	t.Run("returns copies", func(t *testing.T) {
		s := newStore(t)
		created, _ := s.Create(ctx, CreateRequest{Name: "x", Metadata: map[string]string{"k": "v"}})
		created.Metadata["k"] = "mutated"
		got, _ := s.Get(ctx, created.ID)
		got.Metadata["k"] = "mutated again"
		if again, _ := s.Get(ctx, created.ID); again.Metadata["k"] != "v" {
			t.Errorf("store shares memory with callers: metadata = %v", again.Metadata)
		}
	})

	t.Run("concurrent use", func(t *testing.T) {
		s := newStore(t)
		seed, _ := s.Create(ctx, CreateRequest{Name: "seed"})
		var wg sync.WaitGroup
		errc := make(chan error, 60)
		for i := 0; i < 20; i++ {
			wg.Add(3)
			go func() { defer wg.Done(); _, err := s.Create(ctx, CreateRequest{Name: "n"}); errc <- err }()
			go func() {
				defer wg.Done()
				_, err := s.Update(ctx, seed.ID, UpdateRequest{Metadata: map[string]string{"k": "v"}})
				errc <- err
			}()
			go func() { defer wg.Done(); _, err := s.List(ctx); errc <- err }()
		}
		wg.Wait()
		close(errc)
		for err := range errc {
			if err != nil {
				t.Fatal(err)
			}
		}
		if items, _ := s.List(ctx); len(items) != 21 {
			t.Errorf("store has %d items, want 21", len(items))
		}
	})
}
