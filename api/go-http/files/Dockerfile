# syntax=docker/dockerfile:1

# Build stage. Keep the Go minor version in step with the `go` line in go.mod.
FROM golang:1.26-alpine AS builder

WORKDIR /src

# Dependencies first so they cache across source changes. go.sum is committed
# and verified; the build fails if a module does not match it.
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .

# Static, stripped binary (no cgo, so no libc dependency in the runtime image).
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# Runtime stage
FROM alpine:3.22

# ca-certificates for outbound TLS, tzdata for time zones. busybox wget (part
# of alpine) runs the healthcheck.
RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -H -u 10001 -g '' appuser

WORKDIR /app
COPY --from=builder /out/server /app/server

# Numeric UID so orchestrators can verify runAsNonRoot.
USER 10001:10001

ENV SERVER_ADDR=:8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1

CMD ["/app/server"]
