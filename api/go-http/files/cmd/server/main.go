package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/api"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/db"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/item"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/pkg/cache"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/pkg/config"
)

func main() {
	healthcheck := flag.Bool("healthcheck", false, "probe /health on SERVER_ADDR and exit 0 if healthy (container HEALTHCHECK)")
	flag.Parse()

	cfg := config.Load()

	if *healthcheck {
		url, err := healthURL(cfg.ServerAddr)
		if err == nil {
			err = probe(url)
		}
		if err != nil {
			fmt.Fprintln(os.Stderr, "healthcheck:", err)
			os.Exit(1)
		}
		os.Exit(0)
	}

	// Initialize structured logging

	var handler slog.Handler
	if cfg.LogFormat == "json" {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel})
	} else {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel})
	}
	logger := slog.New(handler)
	slog.SetDefault(logger)

	logger.Info("starting server",
		"addr", cfg.ServerAddr,
		"database_url_set", cfg.DatabaseURL != "",
		"redis_url_set", cfg.RedisURL != "",
	)

	// Cache: Redis when REDIS_URL is set and reachable, in-memory otherwise.
	if err := cache.Init(cfg.RedisURL, logger); err != nil {
		logger.Error("cache init failed", "error", err)
		os.Exit(1)
	}
	defer cache.Close()

	// Item store: Postgres when DATABASE_URL is set, memory otherwise.
	items, pool, err := openItemStore(cfg, logger)
	if err != nil {
		logger.Error("database setup failed", "error", err)
		cache.Close()
		os.Exit(1)
	}

	// Create API server
	server := api.NewServer(api.Config{
		Items:        items,
		Logger:       logger,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		CORSOrigins:  cfg.CORSOrigins,
	})

	// Start server in goroutine
	go func() {
		if err := server.Start(cfg.ServerAddr); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	logger.Info("server started", "addr", cfg.ServerAddr)

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("shutting down...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error("shutdown error", "error", err)
	}
	// After Shutdown: in-flight requests have finished with the pool.
	if pool != nil {
		pool.Close()
	}

	logger.Info("server stopped")
}

// Startup limits for the database: compose starts the API once Postgres is
// healthy, so these only matter when it is slow or down.
const (
	dbConnectTimeout = 30 * time.Second
	dbMigrateTimeout = 60 * time.Second
)

// openItemStore returns the Postgres store (and its pool, which the caller
// closes on shutdown) when DATABASE_URL is set, after applying the embedded
// migrations. With DATABASE_URL unset it returns the in-memory store and a nil
// pool. A set but unreachable DATABASE_URL is an error, not a silent fallback
// to memory, so data is never written where it would be lost.
func openItemStore(cfg config.Config, logger *slog.Logger) (item.Store, *pgxpool.Pool, error) {
	if cfg.DatabaseURL == "" {
		logger.Warn("DATABASE_URL not set: items are kept in memory and lost on restart")
		return item.NewService(), nil, nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), dbConnectTimeout)
	defer cancel()
	pool, err := db.Connect(ctx, cfg.DatabaseURL, logger)
	if err != nil {
		return nil, nil, err
	}

	mctx, mcancel := context.WithTimeout(context.Background(), dbMigrateTimeout)
	defer mcancel()
	applied, err := db.Migrate(mctx, pool)
	if err != nil {
		pool.Close()
		return nil, nil, err
	}
	logger.Info("using Postgres item store",
		"host", pool.Config().ConnConfig.Host,
		"database", pool.Config().ConnConfig.Database,
		"migrations_applied", applied,
	)
	return item.NewPostgresStore(pool, cfg.DatabaseQueryTimeout), pool, nil
}
