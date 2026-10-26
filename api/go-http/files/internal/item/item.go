package item

import (
	"context"
	"errors"
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
)

// ErrNotFound is returned by a Store when no item has the given ID. The HTTP
// layer turns it into a 404; any other error is a 5xx.
var ErrNotFound = errors.New("item not found")

// Item represents a generic item entity
type Item struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Status      string            `json:"status"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// CreateRequest is the request body for creating an item
type CreateRequest struct {
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Status      string            `json:"status,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// UpdateRequest is the request body for updating an item
type UpdateRequest struct {
	Name        *string           `json:"name,omitempty"`
	Description *string           `json:"description,omitempty"`
	Status      *string           `json:"status,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
}

// DefaultStatus is the status of an item created without one.
const DefaultStatus = "active"

// Store is the persistence seam the HTTP layer depends on. Service keeps items
// in memory; a database-backed type only has to satisfy this interface and be
// passed to api.NewServer in cmd/server/main.go.
//
// Every method takes the request context, so a client that goes away or a
// timeout cancels the work. Get, Update and Delete return ErrNotFound for an
// unknown ID. Implementations return copies, so callers can encode or modify
// them without sharing memory with the store.
type Store interface {
	List(ctx context.Context) ([]Item, error)
	Get(ctx context.Context, id string) (Item, error)
	Create(ctx context.Context, req CreateRequest) (Item, error)
	Update(ctx context.Context, id string, req UpdateRequest) (Item, error)
	Delete(ctx context.Context, id string) error
}

var _ Store = (*Service)(nil)

// Service is an in-memory Store. Data is lost on restart.
type Service struct {
	mu    sync.RWMutex
	items map[string]*Item
}

// NewService creates a new item service
func NewService() *Service {
	return &Service{
		items: make(map[string]*Item),
	}
}

// clone returns a copy of it that shares no memory with the stored item.
func clone(it *Item) Item {
	c := *it
	c.Metadata = cloneMap(it.Metadata)
	return c
}

func cloneMap(m map[string]string) map[string]string {
	if m == nil {
		return nil
	}
	c := make(map[string]string, len(m))
	for k, v := range m {
		c[k] = v
	}
	return c
}

// Create creates a new item
func (s *Service) Create(_ context.Context, req CreateRequest) (Item, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	status := req.Status
	if status == "" {
		status = DefaultStatus
	}

	item := &Item{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Status:      status,
		Metadata:    cloneMap(req.Metadata),
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	s.items[item.ID] = item
	return clone(item), nil
}

// Get retrieves an item by ID
func (s *Service) Get(_ context.Context, id string) (Item, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, found := s.items[id]
	if !found {
		return Item{}, ErrNotFound
	}
	return clone(item), nil
}

// List returns all items, oldest first
func (s *Service) List(_ context.Context) ([]Item, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	items := make([]Item, 0, len(s.items))
	for _, item := range s.items {
		items = append(items, clone(item))
	}
	sort.Slice(items, func(i, j int) bool {
		if items[i].CreatedAt.Equal(items[j].CreatedAt) {
			return items[i].ID < items[j].ID
		}
		return items[i].CreatedAt.Before(items[j].CreatedAt)
	})
	return items, nil
}

// Update updates an existing item
func (s *Service) Update(_ context.Context, id string, req UpdateRequest) (Item, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, found := s.items[id]
	if !found {
		return Item{}, ErrNotFound
	}

	if req.Name != nil {
		item.Name = *req.Name
	}
	if req.Description != nil {
		item.Description = *req.Description
	}
	if req.Status != nil {
		item.Status = *req.Status
	}
	if req.Metadata != nil {
		item.Metadata = cloneMap(req.Metadata)
	}
	item.UpdatedAt = time.Now()

	return clone(item), nil
}

// Delete removes an item by ID
func (s *Service) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, found := s.items[id]; !found {
		return ErrNotFound
	}

	delete(s.items, id)
	return nil
}
