package config

import (
	"log/slog"
	"reflect"
	"testing"
	"time"
)

func TestLoadDefaults(t *testing.T) {
	for _, k := range []string{"SERVER_ADDR", "SERVER_READ_TIMEOUT", "SERVER_WRITE_TIMEOUT", "LOG_LEVEL", "LOG_FORMAT", "CORS_ORIGINS", "DATABASE_URL", "DATABASE_QUERY_TIMEOUT", "REDIS_URL"} {
		t.Setenv(k, "")
	}
	cfg := Load()
	want := Config{
		ServerAddr:   ":8080",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		LogLevel:     slog.LevelInfo,
		LogFormat:    "json",

		DatabaseQueryTimeout: 5 * time.Second,
	}
	if !reflect.DeepEqual(cfg, want) {
		t.Errorf("Load() = %+v, want %+v", cfg, want)
	}
}

func TestLoadFromEnv(t *testing.T) {
	tests := []struct {
		key, value string
		check      func(Config) bool
	}{
		{"SERVER_ADDR", ":9090", func(c Config) bool { return c.ServerAddr == ":9090" }},
		{"SERVER_READ_TIMEOUT", "2s", func(c Config) bool { return c.ReadTimeout == 2*time.Second }},
		{"SERVER_READ_TIMEOUT", "bogus", func(c Config) bool { return c.ReadTimeout == 10*time.Second }},
		{"LOG_LEVEL", "debug", func(c Config) bool { return c.LogLevel == slog.LevelDebug }},
		{"LOG_LEVEL", "loud", func(c Config) bool { return c.LogLevel == slog.LevelInfo }},
		{"CORS_ORIGINS", " http://a.test , ,http://b.test", func(c Config) bool {
			return reflect.DeepEqual(c.CORSOrigins, []string{"http://a.test", "http://b.test"})
		}},
		{"DATABASE_URL", "postgresql://u:p@db:5432/app", func(c Config) bool { return c.DatabaseURL == "postgresql://u:p@db:5432/app" }},
		{"DATABASE_QUERY_TIMEOUT", "750ms", func(c Config) bool { return c.DatabaseQueryTimeout == 750*time.Millisecond }},
		{"REDIS_URL", "redis://cache:6379/0", func(c Config) bool { return c.RedisURL == "redis://cache:6379/0" }},
	}
	for _, tt := range tests {
		t.Run(tt.key+"="+tt.value, func(t *testing.T) {
			t.Setenv(tt.key, tt.value)
			if cfg := Load(); !tt.check(cfg) {
				t.Errorf("Load() with %s=%q = %+v", tt.key, tt.value, cfg)
			}
		})
	}
}
