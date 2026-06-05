from fastapi.testclient import TestClient
from backend.main import app
from backend.auth_utils import create_access_token
import uuid
import pytest

def test_products_endpoint():
    with TestClient(app) as c:
        # Create an admin access token to call protected endpoints
        admin_token = create_access_token(uid="admin-uid", role="admin")
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test creation
        pid = f"test-p-{uuid.uuid4()}"[0:8]  # short UUID for test pid
        product_data = {
            "pid": pid,
            "name": "Sản phẩm test",
            "type": "Nước uống",
            "stock": 100,
            "price": 15000.0,
            "unit": "Chai",
            "branch": "ngt",
            "image_url": "http://example.com/image.jpg",
            "is_flash_sale": True,
            "discount_percent": 15
        }
        
        # Create without token should fail (401)
        res_fail = c.post("/api/products", json=product_data)
        assert res_fail.status_code == 401
        
        # Create with admin token should succeed
        res_success = c.post("/api/products", json=product_data, headers=headers)
        assert res_success.status_code == 200
        prod_id = res_success.json()["id"]
        
        # Retrieve product
        res_get = c.get(f"/api/products/{prod_id}")
        assert res_get.status_code == 200
        assert res_get.json()["name"] == "Sản phẩm test"
        
        # Update product
        product_data["name"] = "Sản phẩm test cập nhật"
        res_put = c.put(f"/api/products/{prod_id}", json=product_data, headers=headers)
        assert res_put.status_code == 200
        
        # Delete product
        res_delete = c.delete(f"/api/products/{prod_id}", headers=headers)
        assert res_delete.status_code == 200
