.PHONY: build build-linux run dev test test-docker test-coverage vet clean deps lint docker-build docker-run setup fmt help

# Go parameters
GOCMD=go
BINARY_NAME=server
BINARY_PATH=./cmd/server
IMAGE={{PLATFORM_SLUG}}:latest
# Toolchain image for running Go without a local install (keep in step with go.mod / Dockerfile)
GO_IMAGE=golang:1.26

# Build the application
build:
	$(GOCMD) build -o $(BINARY_NAME) $(BINARY_PATH)

# Static Linux binary, as the Dockerfile builds it
build-linux:
	CGO_ENABLED=0 GOOS=linux $(GOCMD) build -trimpath -ldflags="-s -w" -o $(BINARY_NAME) $(BINARY_PATH)

# Run the application on the host (GPP projects run it in Docker: see README)
run:
	$(GOCMD) run $(BINARY_PATH)

# Run with hot reload (requires air: go install github.com/air-verse/air@latest)
dev:
	air -c .air.toml

# Run tests with the race detector (needs cgo / a C compiler on the host)
test:
	$(GOCMD) vet ./...
	$(GOCMD) test -race ./...

# Run vet + race tests in a Go container: no local Go needed
test-docker:
	docker run --rm -v "$(CURDIR)":/src -w /src $(GO_IMAGE) sh -c 'go vet ./... && go test -race ./...'

# Run tests with coverage
test-coverage:
	$(GOCMD) test -cover -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

vet:
	$(GOCMD) vet ./...

# Clean build files
clean:
	$(GOCMD) clean
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html

# Get dependencies
deps:
	$(GOCMD) mod download
	$(GOCMD) mod tidy

# Lint (requires golangci-lint)
lint:
	golangci-lint run

# Build the image on its own (in GPP projects the root docker-compose.yml builds it)
docker-build:
	docker build -t $(IMAGE) .

# Run the image on its own, without the database/Redis from the root compose
docker-run:
	docker run --rm -p 8080:8080 $(if $(wildcard .env),--env-file .env) $(IMAGE)

# Development setup
setup:
	@echo "Installing development tools..."
	go install github.com/air-verse/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Done! Run 'make dev' for hot reload development."

# Format code
fmt:
	$(GOCMD) fmt ./...

# Help
help:
	@echo "Available targets:"
	@echo "  build         - Build the application"
	@echo "  build-linux   - Build a static Linux binary"
	@echo "  run           - Run the application on the host"
	@echo "  dev           - Run with hot reload (requires air)"
	@echo "  test          - go vet + go test -race ./..."
	@echo "  test-docker   - Same, inside $(GO_IMAGE) (no local Go needed)"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  clean         - Clean build files"
	@echo "  deps          - Get dependencies"
	@echo "  lint          - Run linter"
	@echo "  docker-build  - Build the Docker image on its own"
	@echo "  docker-run    - Run the image on its own (no DB/Redis)"
	@echo "  setup         - Install development tools"
	@echo "  fmt           - Format code"
