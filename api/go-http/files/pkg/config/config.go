package config

import (
	"log/slog"
	"os"
	"time"
)

// Config holds application configuration
type Config struct {
	ServerAddr   string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
	LogLevel     slog.Level
	LogFormat    string
	DatabaseURL  string
}

// Load reads configuration from environment variables
func Load() Config {
	return Config{
		ServerAddr:   getEnv("SERVER_ADDR", ":8080"),
		ReadTimeout:  getDuration("SERVER_READ_TIMEOUT", 10*time.Second),
		WriteTimeout: getDuration("SERVER_WRITE_TIMEOUT", 30*time.Second),
		LogLevel:     getLogLevel("LOG_LEVEL", slog.LevelInfo),
		LogFormat:    getEnv("LOG_FORMAT", "json"),
		DatabaseURL:  getEnv("DATABASE_URL", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if d, err := time.ParseDuration(value); err == nil {
			return d
		}
	}
	return defaultValue
}

func getLogLevel(key string, defaultValue slog.Level) slog.Level {
	value := os.Getenv(key)
	switch value {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return defaultValue
	}
}
