package item

import (
	"sort"
	"sync"
	"time"

	"github.com/google/uuid"
)

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

// Store is the persistence seam the HTTP layer depends on. Service is the
// in-memory implementation; a database-backed type (for example one built on
// DATABASE_URL with database/sql or pgx) only has to satisfy this interface
// and be passed to api.NewServer in cmd/server/main.go.
//
// Implementations return copies, so callers can encode or modify them without
// holding the store's lock.
type Store interface {
	List() []Item
	Get(id string) (Item, bool)
	Create(req CreateRequest) Item
	Update(id string, req UpdateRequest) (Item, bool)
	Delete(id string) bool
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
	if it.Metadata != nil {
		c.Metadata = make(map[string]string, len(it.Metadata))
		for k, v := range it.Metadata {
			c.Metadata[k] = v
		}
	}
	return c
}

// Create creates a new item
func (s *Service) Create(req CreateRequest) Item {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	status := req.Status
	if status == "" {
		status = "active"
	}

	item := &Item{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Status:      status,
		Metadata:    req.Metadata,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	s.items[item.ID] = item
	return clone(item)
}

// Get retrieves an item by ID
func (s *Service) Get(id string) (Item, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, found := s.items[id]
	if !found {
		return Item{}, false
	}
	return clone(item), true
}

// List returns all items, oldest first
func (s *Service) List() []Item {
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
	return items
}

// Update updates an existing item
func (s *Service) Update(id string, req UpdateRequest) (Item, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, found := s.items[id]
	if !found {
		return Item{}, false
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
		item.Metadata = req.Metadata
	}
	item.UpdatedAt = time.Now()

	return clone(item), true
}

// Delete removes an item by ID
func (s *Service) Delete(id string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, found := s.items[id]; !found {
		return false
	}

	delete(s.items, id)
	return true
}
