#!/usr/bin/env python3
"""
Smoke Test Script for GPP FastAPI Template

This script verifies that the FastAPI application is working correctly after
scaffolding and startup. Run after `docker compose up -d` to validate the setup.

Usage:
    python scripts/smoke_test.py [--base-url http://localhost:8000]

Exit Codes:
    0 - All tests passed
    1 - One or more tests failed
"""

import argparse
import sys
import time
from typing import Optional

try:
    import requests
except ImportError:
    print("Error: 'requests' package is required. Install with: pip install requests")
    sys.exit(1)


class SmokeTest:
    def __init__(self, base_url: str, admin_email: str = "admin@example.com", admin_password: str = "changeme"):
        self.base_url = base_url.rstrip("/")
        self.admin_email = admin_email
        self.admin_password = admin_password
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.passed = 0
        self.failed = 0

    def log(self, status: str, message: str):
        icon = "✓" if status == "PASS" else "✗" if status == "FAIL" else "•"
        print(f"  {icon} {message}")

    def test(self, name: str, condition: bool, fail_message: str = ""):
        if condition:
            self.log("PASS", name)
            self.passed += 1
        else:
            self.log("FAIL", f"{name}: {fail_message}" if fail_message else name)
            self.failed += 1
        return condition

    def wait_for_api(self, timeout: int = 60, interval: int = 2) -> bool:
        """Wait for the API to become available."""
        print(f"\nWaiting for API at {self.base_url}...")
        start = time.time()
        while time.time() - start < timeout:
            try:
                response = requests.get(f"{self.base_url}/api/v1/health", timeout=5)
                if response.status_code == 200:
                    print(f"  API ready after {int(time.time() - start)}s")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(interval)
        print(f"  API not ready after {timeout}s")
        return False

    def test_health(self) -> bool:
        """Test health endpoint."""
        print("\n1. Health Check")
        try:
            response = requests.get(f"{self.base_url}/api/v1/health", timeout=10)
            self.test("GET /api/v1/health returns 200", response.status_code == 200, f"got {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                self.test("Response contains 'ok: true'", data.get("ok") is True, f"got {data}")
                return True
        except requests.exceptions.RequestException as e:
            self.test("Health endpoint accessible", False, str(e))
        return False

    def test_auth_login_invalid(self) -> bool:
        """Test login with invalid credentials."""
        print("\n2. Authentication - Invalid Credentials")
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/auth/login",
                json={"email": "nonexistent@example.com", "password": "wrongpassword"},
                timeout=10
            )
            self.test(
                "Invalid credentials return 401",
                response.status_code == 401,
                f"got {response.status_code}"
            )
            return response.status_code == 401
        except requests.exceptions.RequestException as e:
            self.test("Login endpoint accessible", False, str(e))
        return False

    def test_auth_login_valid(self) -> bool:
        """Test login with valid credentials."""
        print("\n3. Authentication - Valid Credentials")
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/auth/login",
                json={"email": self.admin_email, "password": self.admin_password},
                timeout=10
            )

            if response.status_code == 401:
                self.log("SKIP", f"Admin user not seeded (set ADMIN_EMAIL and ADMIN_PASSWORD)")
                return False

            self.test(
                "Valid credentials return 200",
                response.status_code == 200,
                f"got {response.status_code}: {response.text[:200]}"
            )

            if response.status_code == 200:
                data = response.json()
                self.test("Response contains access_token", "access_token" in data, f"got keys: {list(data.keys())}")
                self.test("Response contains refresh_token", "refresh_token" in data, f"got keys: {list(data.keys())}")
                self.test("Response contains token_type", data.get("token_type") == "bearer", f"got {data.get('token_type')}")

                self.access_token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                return True
        except requests.exceptions.RequestException as e:
            self.test("Login endpoint accessible", False, str(e))
        return False

    def test_protected_endpoints(self) -> bool:
        """Test protected endpoints with and without token."""
        print("\n4. Protected Endpoints")

        if not self.access_token:
            self.log("SKIP", "No access token available (admin not seeded)")
            return False

        # Test without token
        try:
            response = requests.get(f"{self.base_url}/api/v1/auth/me", timeout=10)
            self.test(
                "GET /api/v1/auth/me without token returns 403",
                response.status_code == 403,
                f"got {response.status_code}"
            )
        except requests.exceptions.RequestException as e:
            self.test("Protected endpoint accessible", False, str(e))

        # Test with valid token
        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = requests.get(f"{self.base_url}/api/v1/auth/me", headers=headers, timeout=10)
            self.test(
                "GET /api/v1/auth/me with valid token returns 200",
                response.status_code == 200,
                f"got {response.status_code}"
            )

            if response.status_code == 200:
                data = response.json()
                self.test("Response contains user id", "id" in data, f"got keys: {list(data.keys())}")
                self.test("Response contains email", "email" in data, f"got keys: {list(data.keys())}")
                self.test("Email matches admin email", data.get("email") == self.admin_email, f"got {data.get('email')}")
        except requests.exceptions.RequestException as e:
            self.test("Protected endpoint with token", False, str(e))

        # Test with invalid token
        try:
            headers = {"Authorization": "Bearer invalid_token_here"}
            response = requests.get(f"{self.base_url}/api/v1/auth/me", headers=headers, timeout=10)
            self.test(
                "GET /api/v1/auth/me with invalid token returns 401",
                response.status_code == 401,
                f"got {response.status_code}"
            )
        except requests.exceptions.RequestException as e:
            self.test("Invalid token rejection", False, str(e))

        return True

    def test_token_refresh(self) -> bool:
        """Test token refresh endpoint."""
        print("\n5. Token Refresh")

        if not self.refresh_token:
            self.log("SKIP", "No refresh token available (admin not seeded)")
            return False

        try:
            response = requests.post(
                f"{self.base_url}/api/v1/auth/refresh",
                json={"refresh_token": self.refresh_token},
                timeout=10
            )
            self.test(
                "POST /api/v1/auth/refresh returns 200",
                response.status_code == 200,
                f"got {response.status_code}"
            )

            if response.status_code == 200:
                data = response.json()
                self.test("Response contains new access_token", "access_token" in data, f"got keys: {list(data.keys())}")
        except requests.exceptions.RequestException as e:
            self.test("Refresh endpoint accessible", False, str(e))

        # Test with invalid refresh token
        try:
            response = requests.post(
                f"{self.base_url}/api/v1/auth/refresh",
                json={"refresh_token": "invalid_refresh_token"},
                timeout=10
            )
            self.test(
                "Invalid refresh token returns 401",
                response.status_code == 401,
                f"got {response.status_code}"
            )
        except requests.exceptions.RequestException as e:
            self.test("Invalid refresh token rejection", False, str(e))

        return True

    def run(self) -> bool:
        """Run all smoke tests."""
        print("=" * 60)
        print("GPP FastAPI Template - Smoke Test")
        print("=" * 60)
        print(f"Base URL: {self.base_url}")
        print(f"Admin Email: {self.admin_email}")

        # Wait for API to be ready
        if not self.wait_for_api():
            print("\nFATAL: API not available. Is the server running?")
            print("  Run: docker compose up -d")
            return False

        # Run tests
        self.test_health()
        self.test_auth_login_invalid()
        self.test_auth_login_valid()
        self.test_protected_endpoints()
        self.test_token_refresh()

        # Summary
        print("\n" + "=" * 60)
        print(f"Results: {self.passed} passed, {self.failed} failed")
        print("=" * 60)

        return self.failed == 0


def main():
    parser = argparse.ArgumentParser(description="Smoke test for GPP FastAPI template")
    parser.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--admin-email", default="admin@example.com", help="Admin email for auth tests")
    parser.add_argument("--admin-password", default="changeme", help="Admin password for auth tests")
    args = parser.parse_args()

    tester = SmokeTest(args.base_url, args.admin_email, args.admin_password)
    success = tester.run()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
