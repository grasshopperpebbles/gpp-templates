package item

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DefaultQueryTimeout bounds each PostgresStore call when no timeout is given.
const DefaultQueryTimeout = 5 * time.Second

// PostgresStore is a Store on the items table (internal/db/migrations).
type PostgresStore struct {
	pool    *pgxpool.Pool
	timeout time.Duration
}

var (
	_ Store  = (*PostgresStore)(nil)
	_ Pinger = (*PostgresStore)(nil)
)

// NewPostgresStore returns a Store on pool. Each call runs under the caller's
// context and at most timeout (DefaultQueryTimeout when zero or negative).
// The caller owns the pool and closes it on shutdown.
func NewPostgresStore(pool *pgxpool.Pool, timeout time.Duration) *PostgresStore {
	if timeout <= 0 {
		timeout = DefaultQueryTimeout
	}
	return &PostgresStore{pool: pool, timeout: timeout}
}

const itemColumns = "id::text, name, description, status, metadata, created_at, updated_at"

func scanItem(row pgx.Row) (Item, error) {
	var it Item
	var md map[string]string
	if err := row.Scan(&it.ID, &it.Name, &it.Description, &it.Status, &md, &it.CreatedAt, &it.UpdatedAt); err != nil {
		return Item{}, err
	}
	if len(md) > 0 { // same as the in-memory store: no metadata is nil, not {}
		it.Metadata = md
	}
	return it, nil
}

// parseID returns id in canonical form, or ErrNotFound when it is not a
// UUID (it can't name a row, and Postgres would reject it as a uuid).
func parseID(id string) (string, error) {
	u, err := uuid.Parse(id)
	if err != nil || u.String() != id {
		return "", ErrNotFound
	}
	return id, nil
}

// Ping checks the database answers within the store's timeout.
func (s *PostgresStore) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()
	return s.pool.Ping(ctx)
}

// List returns all items, oldest first.
func (s *PostgresStore) List(ctx context.Context) ([]Item, error) {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	rows, err := s.pool.Query(ctx, "SELECT "+itemColumns+" FROM items ORDER BY created_at, id")
	if err != nil {
		return nil, fmt.Errorf("list items: %w", err)
	}
	items, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (Item, error) { return scanItem(row) })
	if err != nil {
		return nil, fmt.Errorf("list items: %w", err)
	}
	if items == nil {
		items = []Item{}
	}
	return items, nil
}

// Get returns the item with id, or ErrNotFound.
func (s *PostgresStore) Get(ctx context.Context, id string) (Item, error) {
	id, err := parseID(id)
	if err != nil {
		return Item{}, err
	}
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	it, err := scanItem(s.pool.QueryRow(ctx, "SELECT "+itemColumns+" FROM items WHERE id = $1", id))
	if errors.Is(err, pgx.ErrNoRows) {
		return Item{}, ErrNotFound
	}
	if err != nil {
		return Item{}, fmt.Errorf("get item: %w", err)
	}
	return it, nil
}

// Create inserts a new item; status defaults to DefaultStatus.
func (s *PostgresStore) Create(ctx context.Context, req CreateRequest) (Item, error) {
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	status := req.Status
	if status == "" {
		status = DefaultStatus
	}
	md := req.Metadata
	if md == nil {
		md = map[string]string{}
	}

	it, err := scanItem(s.pool.QueryRow(ctx,
		`INSERT INTO items (id, name, description, status, metadata)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING `+itemColumns,
		uuid.New().String(), req.Name, req.Description, status, md,
	))
	if err != nil {
		return Item{}, fmt.Errorf("create item: %w", err)
	}
	return it, nil
}

// Update changes the fields set in req (nil fields are kept) and bumps
// updated_at. It returns ErrNotFound for an unknown id.
func (s *PostgresStore) Update(ctx context.Context, id string, req UpdateRequest) (Item, error) {
	id, err := parseID(id)
	if err != nil {
		return Item{}, err
	}
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	// An untyped nil sends SQL NULL, so COALESCE keeps the current value.
	var md any
	if req.Metadata != nil {
		md = req.Metadata
	}

	it, err := scanItem(s.pool.QueryRow(ctx,
		`UPDATE items SET
		   name        = COALESCE($2, name),
		   description = COALESCE($3, description),
		   status      = COALESCE($4, status),
		   metadata    = COALESCE($5::jsonb, metadata),
		   updated_at  = now()
		 WHERE id = $1
		 RETURNING `+itemColumns,
		id, req.Name, req.Description, req.Status, md,
	))
	if errors.Is(err, pgx.ErrNoRows) {
		return Item{}, ErrNotFound
	}
	if err != nil {
		return Item{}, fmt.Errorf("update item: %w", err)
	}
	return it, nil
}

// Delete removes the item with id, or returns ErrNotFound.
func (s *PostgresStore) Delete(ctx context.Context, id string) error {
	id, err := parseID(id)
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(ctx, s.timeout)
	defer cancel()

	tag, err := s.pool.Exec(ctx, "DELETE FROM items WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete item: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
