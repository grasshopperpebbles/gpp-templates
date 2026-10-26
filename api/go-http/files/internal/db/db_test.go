package db_test

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"sync"
	"testing"
	"time"

	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/db"
	"{{PROJECT_SLUG}}/apps/{{PLATFORM_SLUG}}/internal/db/dbtest"
)

func TestMigrationsEmbedded(t *testing.T) {
	ms, err := db.Migrations()
	if err != nil {
		t.Fatal(err)
	}
	if len(ms) == 0 || ms[0].Version != "0001_create_items" {
		t.Fatalf("migrations = %+v, want 0001_create_items first", ms)
	}
	for i := 1; i < len(ms); i++ {
		if ms[i-1].Version >= ms[i].Version {
			t.Errorf("migrations out of order: %s before %s", ms[i-1].Version, ms[i].Version)
		}
	}
}

func TestConnectBadURL(t *testing.T) {
	_, err := db.Connect(context.Background(), "postgres://u:s3cret@host:notaport/db", dbtest.Logger())
	if err == nil {
		t.Fatal("Connect with a bad URL succeeded")
	}
	if strings.Contains(err.Error(), "s3cret") {
		t.Errorf("error leaks the password: %v", err)
	}
}

func TestConnectGivesUpWithContext(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 1500*time.Millisecond)
	defer cancel()
	start := time.Now()
	// Port 1 on loopback: nothing listens, so every ping fails fast.
	_, err := db.Connect(ctx, "postgres://u:s3cret@127.0.0.1:1/db?connect_timeout=1", dbtest.Logger())
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("Connect error = %v, want context.DeadlineExceeded", err)
	}
	if strings.Contains(err.Error(), "s3cret") {
		t.Errorf("error leaks the password: %v", err)
	}
	if d := time.Since(start); d > 5*time.Second {
		t.Errorf("Connect took %v after its context expired", d)
	}
}

func TestConnect(t *testing.T) {
	url := dbtest.URL(t)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := db.Connect(ctx, url, dbtest.Logger())
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	var one int
	if err := pool.QueryRow(ctx, "SELECT 1").Scan(&one); err != nil || one != 1 {
		t.Fatalf("SELECT 1 = %d, %v", one, err)
	}
}

func TestMigrate(t *testing.T) {
	pool := dbtest.NewPool(t)
	ctx := context.Background()

	all, _ := db.Migrations()
	var want []string
	for _, m := range all {
		want = append(want, m.Version)
	}

	applied, err := db.Migrate(ctx, pool)
	if err != nil {
		t.Fatalf("first Migrate: %v", err)
	}
	if !reflect.DeepEqual(applied, want) {
		t.Errorf("first Migrate applied %v, want %v", applied, want)
	}

	applied, err = db.Migrate(ctx, pool)
	if err != nil || len(applied) != 0 {
		t.Errorf("second Migrate = %v, %v; want nothing applied", applied, err)
	}

	var n int
	if err := pool.QueryRow(ctx, "SELECT count(*) FROM schema_migrations").Scan(&n); err != nil || n != len(want) {
		t.Errorf("schema_migrations rows = %d, %v; want %d", n, err, len(want))
	}
	if _, err := pool.Exec(ctx, "INSERT INTO items (id, name) VALUES (gen_random_uuid(), 'x')"); err != nil {
		t.Errorf("items table not usable after migrate: %v", err)
	}
}

// TestMigrateConcurrent starts several migrators at once, as several API
// replicas would; the advisory lock lets exactly one apply each migration.
func TestMigrateConcurrent(t *testing.T) {
	pool := dbtest.NewPool(t)
	ctx := context.Background()

	var (
		wg    sync.WaitGroup
		mu    sync.Mutex
		total int
	)
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			applied, err := db.Migrate(ctx, pool)
			if err != nil {
				t.Errorf("Migrate: %v", err)
				return
			}
			mu.Lock()
			total += len(applied)
			mu.Unlock()
		}()
	}
	wg.Wait()

	all, _ := db.Migrations()
	if total != len(all) {
		t.Errorf("migrations applied %d times in total, want %d", total, len(all))
	}
}
