.PHONY: build run test clean docker-build docker-run dev lint fmt help

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOTEST=$(GOCMD) test
GOCLEAN=$(GOCMD) clean
BINARY_NAME=server
BINARY_PATH=./cmd/server

# Build the application
build:
	$(GOBUILD) -o $(BINARY_NAME) $(BINARY_PATH)

# Build for Linux (Docker)
build-linux:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -a -installsuffix cgo -o $(BINARY_NAME) $(BINARY_PATH)

# Run the application
run:
	$(GOCMD) run $(BINARY_PATH)

# Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	air -c .air.toml

# Run tests
test:
	$(GOTEST) -v ./...

# Run tests with coverage
test-coverage:
	$(GOTEST) -cover -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

# Clean build files
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html

# Get dependencies
deps:
	$(GOCMD) mod download
	$(GOCMD) mod tidy

# Lint (requires golangci-lint)
lint:
	golangci-lint run

# Build Docker image
docker-build:
	docker build -t {{PLATFORM_SLUG}}:latest .

# Run Docker container
docker-run:
	docker run -p 8080:8080 {{PLATFORM_SLUG}}:latest

# Development setup
setup:
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "Done! Run 'make dev' for hot reload development."

# Format code
fmt:
	$(GOCMD) fmt ./...

# Help
help:
	@echo "Available targets:"
	@echo "  build         - Build the application"
	@echo "  build-linux   - Build for Linux/Docker"
	@echo "  run           - Run the application"
	@echo "  dev           - Run with hot reload (requires air)"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  clean         - Clean build files"
	@echo "  deps          - Get dependencies"
	@echo "  lint          - Run linter"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  setup         - Install development tools"
	@echo "  fmt           - Format code"
