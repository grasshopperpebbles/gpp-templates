-- Items for the example CRUD endpoints (internal/item).
CREATE TABLE IF NOT EXISTS items (
    id          UUID        PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT        NOT NULL DEFAULT '',
    status      TEXT        NOT NULL DEFAULT 'active',
    metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- List returns items oldest first.
CREATE INDEX IF NOT EXISTS items_created_at_id_idx ON items (created_at, id);
