package main

import (
	"fmt"
	"net"
	"net/http"
	"time"
)

// healthURL turns a listen address (SERVER_ADDR, e.g. ":8080") into the URL the
// container healthcheck probes. Wildcard hosts map to 127.0.0.1.
func healthURL(addr string) (string, error) {
	host, port, err := net.SplitHostPort(addr)
	if err != nil {
		return "", fmt.Errorf("SERVER_ADDR %q: %w", addr, err)
	}
	if port == "" {
		return "", fmt.Errorf("SERVER_ADDR %q has no port", addr)
	}
	switch host {
	case "", "0.0.0.0", "::":
		host = "127.0.0.1"
	}
	return "http://" + net.JoinHostPort(host, port) + "/health", nil
}

// probe GETs url and fails unless it answers 200 within a couple of seconds.
func probe(url string) error {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s returned %d", url, resp.StatusCode)
	}
	return nil
}
