package item

import (
	"testing"
)

func TestService_Create(t *testing.T) {
	s := NewService()

	req := CreateRequest{
		Name:        "Test Item",
		Description: "A test item",
	}

	item := s.Create(req)

	if item.ID == "" {
		t.Error("expected ID to be set")
	}
	if item.Name != "Test Item" {
		t.Errorf("expected Name 'Test Item', got %q", item.Name)
	}
	if item.Status != "active" {
		t.Errorf("expected default Status 'active', got %q", item.Status)
	}
}

func TestService_Get(t *testing.T) {
	s := NewService()

	created := s.Create(CreateRequest{Name: "Test"})

	item, found := s.Get(created.ID)
	if !found {
		t.Fatal("expected to find item")
	}
	if item.Name != "Test" {
		t.Errorf("expected Name 'Test', got %q", item.Name)
	}

	_, found = s.Get("nonexistent")
	if found {
		t.Error("expected not to find nonexistent item")
	}
}

func TestService_List(t *testing.T) {
	s := NewService()

	s.Create(CreateRequest{Name: "Item 1"})
	s.Create(CreateRequest{Name: "Item 2"})

	items := s.List()
	if len(items) != 2 {
		t.Errorf("expected 2 items, got %d", len(items))
	}
}

func TestService_Update(t *testing.T) {
	s := NewService()

	created := s.Create(CreateRequest{Name: "Original"})

	newName := "Updated"
	updated, found := s.Update(created.ID, UpdateRequest{Name: &newName})

	if !found {
		t.Fatal("expected to find item for update")
	}
	if updated.Name != "Updated" {
		t.Errorf("expected Name 'Updated', got %q", updated.Name)
	}

	_, found = s.Update("nonexistent", UpdateRequest{Name: &newName})
	if found {
		t.Error("expected not to find nonexistent item")
	}
}

func TestService_Delete(t *testing.T) {
	s := NewService()

	created := s.Create(CreateRequest{Name: "ToDelete"})

	if !s.Delete(created.ID) {
		t.Error("expected delete to succeed")
	}

	_, found := s.Get(created.ID)
	if found {
		t.Error("expected item to be deleted")
	}

	if s.Delete("nonexistent") {
		t.Error("expected delete of nonexistent item to fail")
	}
}
