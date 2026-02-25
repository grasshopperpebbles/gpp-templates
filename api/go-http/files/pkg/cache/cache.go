package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
	"github.com/redis/go-redis/v9"
)

// Cache provides caching functionality with Redis (optional) or in-memory fallback.
// Install Redis support: go get github.com/redis/go-redis/v9
//
// Usage:
//     import "{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/pkg/cache"
//
//     // Set a value (TTL in seconds)
//     cache.Set("user:123", userData, 3600)
//
//     // Get a value
//     user, found := cache.Get("user:123")
//
//     // Delete a value
//     cache.Delete("user:123")
//
//     // Delete all keys matching pattern (supports * wildcard)
//     cache.DeletePattern("user:*")        // All user keys
//     cache.DeletePattern("product:*")     // All product keys

var (
	defaultCache Cache
	once         sync.Once
)

// Cache interface for cache operations
type Cache interface {
	Get(ctx context.Context, key string) (interface{}, bool)
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration)
	Delete(ctx context.Context, key string)
	DeletePattern(ctx context.Context, pattern string)
	Exists(ctx context.Context, key string) bool
	Clear(ctx context.Context)
	Close() error
}

// InMemoryCache is a simple in-memory cache for development/testing
type InMemoryCache struct {
	cache *cache.Cache
	mu    sync.RWMutex
}

// NewInMemoryCache creates a new in-memory cache instance
func NewInMemoryCache() *InMemoryCache {
	return &InMemoryCache{
		cache: cache.New(5*time.Minute, 10*time.Minute),
	}
}

func (c *InMemoryCache) Get(ctx context.Context, key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.cache.Get(key)
}

func (c *InMemoryCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache.Set(key, value, ttl)
}

func (c *InMemoryCache) Delete(ctx context.Context, key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache.Delete(key)
}

func (c *InMemoryCache) DeletePattern(ctx context.Context, pattern string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Simple wildcard support for in-memory cache
	if strings.Contains(pattern, "*") {
		parts := strings.Split(pattern, "*")
		prefix := parts[0]
		suffix := ""
		if len(parts) > 1 {
			suffix = parts[1]
		}

		// Get all items from the cache
		items := c.cache.Items()

		// Delete matching keys
		for key := range items {
			if strings.HasPrefix(key, prefix) && (suffix == "" || strings.HasSuffix(key, suffix)) {
				c.cache.Delete(key)
			}
		}
	} else {
		// Exact match
		c.cache.Delete(pattern)
	}
}

func (c *InMemoryCache) Exists(ctx context.Context, key string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	_, found := c.cache.Get(key)
	return found
}

func (c *InMemoryCache) Clear(ctx context.Context) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache.Flush()
}

func (c *InMemoryCache) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.cache.Flush()
	return nil
}

// RedisCache is a Redis-backed cache for production
type RedisCache struct {
	client *redis.Client
	logger *slog.Logger
}

// NewRedisCache creates a new Redis cache instance
func NewRedisCache(url string, logger *slog.Logger) (*RedisCache, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("invalid redis url: %w", err)
	}

	client := redis.NewClient(opts)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	return &RedisCache{
		client: client,
		logger: logger,
	}, nil
}

func (c *RedisCache) Get(ctx context.Context, key string) (interface{}, bool) {
	val, err := c.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, false
	}
	if err != nil {
		c.logger.Error("redis get error", "error", err, "key", key)
		return nil, false
	}

	// Try to unmarshal as JSON
	var result interface{}
	if err := json.Unmarshal([]byte(val), &result); err != nil {
		// If not JSON, return as string
		return val, true
	}
	return result, true
}

func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) {
	var val string
	switch v := value.(type) {
	case string:
		val = v
	default:
		bytes, err := json.Marshal(value)
		if err != nil {
			c.logger.Error("cache set marshal error", "error", err, "key", key)
			return
		}
		val = string(bytes)
	}

	if err := c.client.Set(ctx, key, val, ttl).Err(); err != nil {
		c.logger.Error("redis set error", "error", err, "key", key)
	}
}

func (c *RedisCache) Delete(ctx context.Context, key string) {
	if err := c.client.Del(ctx, key).Err(); err != nil {
		c.logger.Error("redis delete error", "error", err, "key", key)
	}
}

func (c *RedisCache) DeletePattern(ctx context.Context, pattern string) {
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	iter := c.client.Scan(ctx, 0, pattern, 0).Iterator()
	deletedCount := 0
	keysToDelete := []string{}

	for iter.Next(ctx) {
		keysToDelete = append(keysToDelete, iter.Val())
	}

	if err := iter.Err(); err != nil {
		c.logger.Error("redis scan error", "error", err, "pattern", pattern)
		return
	}

	if len(keysToDelete) > 0 {
		if err := c.client.Del(ctx, keysToDelete...).Err(); err != nil {
			c.logger.Error("redis delete pattern error", "error", err, "pattern", pattern)
			return
		}
		deletedCount = len(keysToDelete)
		c.logger.Debug("deleted cache keys", "count", deletedCount, "pattern", pattern)
	}
}

func (c *RedisCache) Exists(ctx context.Context, key string) bool {
	exists, err := c.client.Exists(ctx, key).Result()
	if err != nil {
		c.logger.Error("redis exists error", "error", err, "key", key)
		return false
	}
	return exists > 0
}

func (c *RedisCache) Clear(ctx context.Context) {
	if err := c.client.FlushDB(ctx).Err(); err != nil {
		c.logger.Error("redis clear error", "error", err)
	}
}

func (c *RedisCache) Close() error {
	return c.client.Close()
}

// CreateCache creates appropriate cache backend based on configuration
func CreateCache(redisURL string, logger *slog.Logger) (Cache, error) {
	// If Redis URL is set and not default, try to use Redis
	if redisURL != "" && redisURL != "redis://localhost:6379/0" {
		redisCache, err := NewRedisCache(redisURL, logger)
		if err != nil {
			logger.Warn("Redis not available, using in-memory cache", "error", err)
			return NewInMemoryCache(), nil
		}
		return redisCache, nil
	}

	// Default to in-memory cache
	return NewInMemoryCache(), nil
}

// Init initializes the default cache instance
func Init(redisURL string, logger *slog.Logger) error {
	var err error
	once.Do(func() {
		defaultCache, err = CreateCache(redisURL, logger)
	})
	return err
}

// Get gets a value from the default cache
func Get(ctx context.Context, key string) (interface{}, bool) {
	if defaultCache == nil {
		panic("cache not initialized: call cache.Init() first")
	}
	return defaultCache.Get(ctx, key)
}

// Set sets a value in the default cache
func Set(ctx context.Context, key string, value interface{}, ttl time.Duration) {
	if defaultCache == nil {
		panic("cache not initialized: call cache.Init() first")
	}
	defaultCache.Set(ctx, key, value, ttl)
}

// Delete deletes a key from the default cache
func Delete(ctx context.Context, key string) {
	if defaultCache == nil {
		panic("cache not initialized: call cache.Init() first")
	}
	defaultCache.Delete(ctx, key)
}

// DeletePattern deletes all keys matching pattern from the default cache
func DeletePattern(ctx context.Context, pattern string) {
	if defaultCache == nil {
		panic("cache not initialized: call cache.Init() first")
	}
	defaultCache.DeletePattern(ctx, pattern)
}

// Exists checks if a key exists in the default cache
func Exists(ctx context.Context, key string) bool {
	if defaultCache == nil {
		panic("cache not initialized: call cache.Init() first")
	}
	return defaultCache.Exists(ctx, key)
}

// Clear clears all keys from the default cache
func Clear(ctx context.Context) {
	if defaultCache == nil {
		panic("cache not initialized: call cache.Init() first")
	}
	defaultCache.Clear(ctx)
}

// Close closes the default cache connection
func Close() error {
	if defaultCache == nil {
		return nil
	}
	return defaultCache.Close()
}

