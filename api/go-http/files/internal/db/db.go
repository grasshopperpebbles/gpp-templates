// Package db opens the Postgres pool and applies the embedded schema
// migrations. It is used only when DATABASE_URL is set.
package db

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"log/slog"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

// migrationLockID is the pg_advisory_lock key held while migrating, so two
// instances starting at once do not apply the same migration twice.
const migrationLockID int64 = 0x6770705f676f // "gpp_go"

// Connect opens a pool for databaseURL and waits until Postgres answers a ping,
// retrying every retryInterval until ctx is done (Postgres may still be
// starting). Errors never include the URL, which holds the password.
func Connect(ctx context.Context, databaseURL string, logger *slog.Logger) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		// pgx's parse errors can echo the URL; keep them out of logs.
		return nil, errors.New("DATABASE_URL is not a valid Postgres connection string")
	}
	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	const retryInterval = time.Second
	for attempt := 1; ; attempt++ {
		pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		err = pool.Ping(pingCtx)
		cancel()
		if err == nil {
			return pool, nil
		}
		logger.Warn("database not reachable yet", "attempt", attempt,
			"host", cfg.ConnConfig.Host, "database", cfg.ConnConfig.Database, "error", err)
		select {
		case <-ctx.Done():
			pool.Close()
			return nil, fmt.Errorf("connect to %s/%s: %w (last error: %v)",
				cfg.ConnConfig.Host, cfg.ConnConfig.Database, ctx.Err(), err)
		case <-time.After(retryInterval):
		}
	}
}

// Migration is one embedded SQL file. Version is its file name without
// ".sql"; files apply in lexical order, so name them 0001_..., 0002_....
type Migration struct {
	Version string
	SQL     string
}

// Migrations returns the embedded migrations in the order they apply.
func Migrations() ([]Migration, error) {
	names, err := fs.Glob(migrationFiles, "migrations/*.sql")
	if err != nil {
		return nil, err
	}
	sort.Strings(names)
	out := make([]Migration, 0, len(names))
	for _, name := range names {
		b, err := migrationFiles.ReadFile(name)
		if err != nil {
			return nil, err
		}
		version := strings.TrimSuffix(strings.TrimPrefix(name, "migrations/"), ".sql")
		out = append(out, Migration{Version: version, SQL: string(b)})
	}
	return out, nil
}

// Migrate applies the embedded migrations that are not yet recorded in the
// schema_migrations table, each in its own transaction, and returns the
// versions it applied. Safe to run on every start and from several instances
// at once (an advisory lock serialises them).
func Migrate(ctx context.Context, pool *pgxpool.Pool) ([]string, error) {
	migrations, err := Migrations()
	if err != nil {
		return nil, fmt.Errorf("read migrations: %w", err)
	}

	conn, err := pool.Acquire(ctx)
	if err != nil {
		return nil, fmt.Errorf("acquire connection: %w", err)
	}
	defer conn.Release()

	if _, err := conn.Exec(ctx, "SELECT pg_advisory_lock($1)", migrationLockID); err != nil {
		return nil, fmt.Errorf("take migration lock: %w", err)
	}
	defer func() {
		// Use a fresh context: ctx may be done, and the lock must not outlive us.
		unlockCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if _, err := conn.Exec(unlockCtx, "SELECT pg_advisory_unlock($1)", migrationLockID); err != nil {
			// Closing the connection releases the lock.
			conn.Conn().Close(unlockCtx)
		}
	}()

	if _, err := conn.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		version    TEXT        PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`); err != nil {
		return nil, fmt.Errorf("create schema_migrations: %w", err)
	}

	var applied []string
	for _, m := range migrations {
		var done bool
		if err := conn.QueryRow(ctx,
			"SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)", m.Version,
		).Scan(&done); err != nil {
			return applied, fmt.Errorf("check migration %s: %w", m.Version, err)
		}
		if done {
			continue
		}
		err := pgx.BeginFunc(ctx, conn, func(tx pgx.Tx) error {
			if _, err := tx.Exec(ctx, m.SQL); err != nil {
				return err
			}
			_, err := tx.Exec(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", m.Version)
			return err
		})
		if err != nil {
			return applied, fmt.Errorf("apply migration %s: %w", m.Version, err)
		}
		applied = append(applied, m.Version)
	}
	return applied, nil
}
