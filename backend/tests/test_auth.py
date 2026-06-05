from fastapi.testclient import TestClient
from backend.main import app
from backend.auth_utils import create_access_token, verify_token
import time
import pytest

def test_jwt_token_creation_and_verification():
    uid = "test-uid-123"
    role = "user"
    token = create_access_token(uid, role)
    assert token is not None
    
    payload = verify_token(token)
    assert payload["sub"] == uid
    assert payload["role"] == role

def test_register_login_flow():
    with TestClient(app) as c:
        email = f"test_{int(time.time())}@convenia.com"
        password = "SecurePassword123"
        
        # Check registration
        register_response = c.post("/api/auth/register", json={"email": email, "password": password})
        assert register_response.status_code == 200
        uid = register_response.json()["uid"]
        
        # Test login with correct password
        login_response = c.post("/api/auth/login", json={"email": email, "password": password})
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()
        assert "access_token" in login_response.cookies
        assert "refresh_token" in login_response.cookies
        
        # Clean up user
        cleanup_res = c.delete(f"/api/auth/profile/{uid}")
        assert cleanup_res.status_code == 200
