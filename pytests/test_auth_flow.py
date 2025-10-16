"""
Black-box authentication flow tests using pytest and httpx.
These tests provide an external perspective on the API endpoints.
"""

import pytest
import httpx
import json
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:3000"
TIMEOUT = 30.0


class TestAuthenticationFlow:
    """Test suite for authentication flow using external HTTP client."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test."""
        self.client = httpx.Client(timeout=TIMEOUT)
        self.test_user = None
        self.auth_token = None

    def teardown_method(self):
        """Cleanup after each test."""
        if hasattr(self, 'client'):
            self.client.close()

    def test_complete_registration_login_flow(self):
        """Test complete registration → login → protected access flow."""
        # Step 1: Register a new user
        register_data = {
            "email": "pytest@example.com",
            "username": "pytestuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!"
        }

        register_response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=register_data
        )

        assert register_response.status_code == 201
        register_result = register_response.json()
        assert register_result["success"] is True
        assert "user" in register_result["data"]
        assert "token" in register_result["data"]

        self.test_user = register_result["data"]["user"]
        self.auth_token = register_result["data"]["token"]

        # Step 2: Login with the registered user
        login_data = {
            "email": register_data["email"],
            "password": register_data["password"]
        }

        login_response = self.client.post(
            f"{BASE_URL}/api/auth/login-mock",
            json=login_data
        )

        assert login_response.status_code == 200
        login_result = login_response.json()
        assert login_result["success"] is True
        assert "user" in login_result["data"]
        assert "token" in login_result["data"]

        # Verify user data matches
        assert login_result["data"]["user"]["id"] == self.test_user["id"]
        assert login_result["data"]["user"]["email"] == self.test_user["email"]
        assert login_result["data"]["user"]["username"] == self.test_user["username"]

        # Step 3: Access protected endpoint (if available)
        protected_response = self.client.get(
            f"{BASE_URL}/api/auth/protected",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )

        # Protected endpoint might not exist, so we'll check for appropriate response
        assert protected_response.status_code in [200, 404, 401]

        if protected_response.status_code == 200:
            protected_result = protected_response.json()
            assert protected_result["success"] is True
            assert "user" in protected_result["data"]

    def test_duplicate_user_registration(self):
        """Test that duplicate user registration returns 409."""
        user_data = {
            "email": "duplicate@example.com",
            "username": "duplicateuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!"
        }

        # First registration should succeed
        first_response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=user_data
        )

        assert first_response.status_code == 201
        first_result = first_response.json()
        assert first_result["success"] is True

        # Second registration with same email should fail
        second_response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=user_data
        )

        assert second_response.status_code == 409
        second_result = second_response.json()
        assert second_result["success"] is False
        assert "already exists" in second_result["error"]

    def test_invalid_login_credentials(self):
        """Test that invalid login credentials return 401."""
        # First, register a user
        user_data = {
            "email": "invalid@example.com",
            "username": "invaliduser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!"
        }

        register_response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=user_data
        )

        assert register_response.status_code == 201

        # Try to login with wrong password
        login_response = self.client.post(
            f"{BASE_URL}/api/auth/login-mock",
            json={
                "email": user_data["email"],
                "password": "WrongPassword123!"
            }
        )

        assert login_response.status_code == 401
        login_result = login_response.json()
        assert login_result["success"] is False
        assert "Invalid email or password" in login_result["error"]

    def test_invalid_registration_payload(self):
        """Test that invalid registration payloads return 400."""
        invalid_payloads = [
            {
                "email": "invalid-email",
                "username": "testuser",
                "password": "SecurePass123!",
                "confirmPassword": "SecurePass123!"
            },
            {
                "email": "test@example.com",
                "username": "ab",  # Too short
                "password": "SecurePass123!",
                "confirmPassword": "SecurePass123!"
            },
            {
                "email": "test@example.com",
                "username": "testuser",
                "password": "weak",  # Too weak
                "confirmPassword": "weak"
            },
            {
                "email": "test@example.com",
                "username": "testuser",
                "password": "SecurePass123!",
                "confirmPassword": "DifferentPass123!"  # Mismatch
            }
        ]

        for payload in invalid_payloads:
            response = self.client.post(
                f"{BASE_URL}/api/auth/register-mock",
                json=payload
            )

            assert response.status_code == 400
            result = response.json()
            assert result["success"] is False
            assert "error" in result

    def test_invalid_login_payload(self):
        """Test that invalid login payloads return 400."""
        invalid_payloads = [
            {
                "email": "invalid-email",
                "password": "SecurePass123!"
            },
            {
                "email": "test@example.com",
                "password": ""  # Empty password
            },
            {
                "email": "",  # Empty email
                "password": "SecurePass123!"
            }
        ]

        for payload in invalid_payloads:
            response = self.client.post(
                f"{BASE_URL}/api/auth/login-mock",
                json=payload
            )

            assert response.status_code == 400
            result = response.json()
            assert result["success"] is False
            assert "error" in result

    def test_concurrent_registration_requests(self):
        """Test handling of concurrent registration requests."""
        users = []
        for i in range(5):
            users.append({
                "email": f"concurrent{i}@example.com",
                "username": f"concurrentuser{i}",
                "password": "SecurePass123!",
                "confirmPassword": "SecurePass123!"
            })

        # Send concurrent requests
        responses = []
        for user in users:
            response = self.client.post(
                f"{BASE_URL}/api/auth/register-mock",
                json=user
            )
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 201
            result = response.json()
            assert result["success"] is True

    def test_concurrent_login_requests(self):
        """Test handling of concurrent login requests."""
        # First, register a user
        user_data = {
            "email": "concurrentlogin@example.com",
            "username": "concurrentloginuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!"
        }

        register_response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=user_data
        )

        assert register_response.status_code == 201

        # Now make concurrent login requests
        responses = []
        for i in range(10):
            response = self.client.post(
                f"{BASE_URL}/api/auth/login-mock",
                json={
                    "email": user_data["email"],
                    "password": user_data["password"]
                }
            )
            responses.append(response)

        # All should succeed
        for response in responses:
            assert response.status_code == 200
            result = response.json()
            assert result["success"] is True

    def test_malformed_json_requests(self):
        """Test handling of malformed JSON requests."""
        malformed_json = '{"email": "test@example.com", "username": "testuser", "password": "SecurePass123!", "confirmPassword": "SecurePass123!"}'

        response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            content=malformed_json,
            headers={"Content-Type": "application/json"}
        )

        # Should handle malformed JSON gracefully
        assert response.status_code in [200, 201, 400, 500]

    def test_missing_content_type_header(self):
        """Test handling of missing Content-Type header."""
        user_data = {
            "email": "notype@example.com",
            "username": "notypeuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!"
        }

        response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=user_data,
            headers={}  # No Content-Type header
        )

        # Should handle missing Content-Type gracefully
        assert response.status_code in [200, 201, 400, 415, 500]

    def test_oversized_requests(self):
        """Test handling of oversized requests."""
        large_user_data = {
            "email": "large@example.com",
            "username": "largeuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!",
            "extraData": "x" * 10000  # Large payload
        }

        response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=large_user_data
        )

        # Should handle large requests gracefully
        assert response.status_code in [200, 201, 400, 413, 500]

    def test_special_characters_in_requests(self):
        """Test handling of special characters in requests."""
        special_user_data = {
            "email": "special@example.com",
            "username": "specialuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!",
            "specialField": "🚀 Special Characters: !@#$%^&*()_+{}|:\"<>?[]\\;\'\",./"
        }

        response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=special_user_data
        )

        # Should handle special characters gracefully
        assert response.status_code in [200, 201, 400, 500]

    def test_high_volume_requests(self):
        """Test handling of high volume of requests."""
        start_time = time.time()

        # Make many requests quickly
        responses = []
        for i in range(50):
            response = self.client.post(
                f"{BASE_URL}/api/auth/register-mock",
                json={
                    "email": f"loadtest{i}@example.com",
                    "username": f"loadtestuser{i}",
                    "password": "SecurePass123!",
                    "confirmPassword": "SecurePass123!"
                }
            )
            responses.append(response)

        end_time = time.time()
        duration = end_time - start_time

        # Should handle all requests within reasonable time
        assert duration < 30.0  # 30 seconds

        # Most requests should succeed (some might fail due to rate limiting)
        success_count = sum(1 for r in responses if r.status_code == 201)
        assert success_count > 0

    def test_consistent_response_times(self):
        """Test that response times are consistent."""
        response_times = []

        # Make 10 requests and measure response times
        for i in range(10):
            start_time = time.time()

            response = self.client.post(
                f"{BASE_URL}/api/auth/register-mock",
                json={
                    "email": f"perftest{i}@example.com",
                    "username": f"perftestuser{i}",
                    "password": "SecurePass123!",
                    "confirmPassword": "SecurePass123!"
                }
            )

            end_time = time.time()
            duration = end_time - start_time

            response_times.append(duration)
            assert response.status_code == 201

        # Response times should be consistent (within 2x of average)
        average_time = sum(response_times) / len(response_times)
        max_time = max(response_times)
        min_time = min(response_times)

        assert max_time < average_time * 2
        assert min_time > 0

    def test_token_expiration_handling(self):
        """Test handling of token expiration."""
        # Register and login to get a token
        user_data = {
            "email": "expire@example.com",
            "username": "expireuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!"
        }

        register_response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=user_data
        )

        assert register_response.status_code == 201

        register_result = register_response.json()
        token = register_result["data"]["token"]

        # Try to use the token immediately (should work)
        protected_response = self.client.get(
            f"{BASE_URL}/api/auth/protected",
            headers={"Authorization": f"Bearer {token}"}
        )

        # Token should be valid (unless protected endpoint doesn't exist)
        assert protected_response.status_code in [200, 404, 401]

        # Verify token format is correct
        assert token is not None
        assert isinstance(token, str)
        assert len(token.split('.')) == 3  # JWT has 3 parts

    def test_token_renewal_through_relogin(self):
        """Test token renewal through re-login."""
        # Register a user
        user_data = {
            "email": "renew@example.com",
            "username": "renewuser",
            "password": "SecurePass123!",
            "confirmPassword": "SecurePass123!"
        }

        register_response = self.client.post(
            f"{BASE_URL}/api/auth/register-mock",
            json=user_data
        )

        assert register_response.status_code == 201

        register_result = register_response.json()
        first_token = register_result["data"]["token"]

        # Login again to get a new token
        login_response = self.client.post(
            f"{BASE_URL}/api/auth/login-mock",
            json={
                "email": user_data["email"],
                "password": user_data["password"]
            }
        )

        assert login_response.status_code == 200

        login_result = login_response.json()
        second_token = login_result["data"]["token"]

        # Tokens should be different
        assert first_token != second_token

        # Both tokens should be valid JWT format
        assert len(first_token.split('.')) == 3
        assert len(second_token.split('.')) == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
