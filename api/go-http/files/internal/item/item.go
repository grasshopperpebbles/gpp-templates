package item

import (
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

// Service provides item CRUD operations
// In production, replace with database-backed implementation
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

// Create creates a new item
func (s *Service) Create(req CreateRequest) *Item {
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
	return item
}

// Get retrieves an item by ID
func (s *Service) Get(id string) (*Item, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, found := s.items[id]
	return item, found
}

// List returns all items
func (s *Service) List() []*Item {
	s.mu.RLock()
	defer s.mu.RUnlock()

	items := make([]*Item, 0, len(s.items))
	for _, item := range s.items {
		items = append(items, item)
	}
	return items
}

// Update updates an existing item
func (s *Service) Update(id string, req UpdateRequest) (*Item, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	item, found := s.items[id]
	if !found {
		return nil, false
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

	return item, true
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
