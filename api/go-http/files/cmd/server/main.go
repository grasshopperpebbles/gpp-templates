package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/api"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/item"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/pkg/cache"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/pkg/config"
)

func main() {
	// Initialize structured logging
	cfg := config.Load()

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

	// Item store. The starter keeps items in memory. To use Postgres, open
	// cfg.DatabaseURL here (database/sql + pgx, or sqlx/GORM), implement
	// item.Store on top of it, and pass that instead.
	var items item.Store = item.NewService()

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

	logger.Info("server stopped")
}
