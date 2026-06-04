from fastapi import FastAPI, HTTPException, status, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime
import os
import bcrypt

from backend.database import execute_query, init_db_pool

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    if hashed_password.startswith("$2a$") or hashed_password.startswith("$2b$"):
        try:
            pwd_bytes = plain_password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(pwd_bytes, hashed_bytes)
        except Exception:
            return False
    return plain_password == hashed_password

app = FastAPI(title="Circle K Backend API", version="1.0.0")

# Enable CORS for frontend local server (Live Server runs on port 5500 or 5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db_pool()
    # Create site_settings table if it doesn't exist
    execute_query(
        "CREATE TABLE IF NOT EXISTS site_settings (key VARCHAR(255) PRIMARY KEY, value TEXT NOT NULL)"
    )
    # Ensure products schema supports flash sale fields
    try:
        execute_query("ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flash_sale BOOLEAN DEFAULT FALSE")
        execute_query("ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 20")
        logger.info("Products database schema verified successfully.")
    except Exception as e:
        logger.error(f"Error checking/updating products schema: {e}")

    # Migrate passwords to bcrypt if they are plaintext
    try:
        all_users = execute_query("SELECT uid, password, fido_password FROM users", fetch=True)
        if all_users:
            for u in all_users:
                pwd = u["password"]
                if pwd and not (pwd.startswith("$2a$") or pwd.startswith("$2b$")):
                    hashed = hash_password(pwd)
                    execute_query("UPDATE users SET password = %s WHERE uid = %s", (hashed, u["uid"]))
                
                fido_pwd = u["fido_password"]
                if fido_pwd and not (fido_pwd.startswith("$2a$") or fido_pwd.startswith("$2b$")):
                    hashed_fido = hash_password(fido_pwd)
                    execute_query("UPDATE users SET fido_password = %s WHERE uid = %s", (hashed_fido, u["uid"]))
            logger.info("Passwords migration completed successfully.")
    except Exception as e:
        logger.error(f"Error during password migration: {e}")


# --- PYDANTIC SCHEMAS ---

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    fullname: Optional[str] = None
    dob: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    nearest_store: Optional[str] = None
    tfa_secret: Optional[str] = None

class CartUpdate(BaseModel):
    items: List[Dict[str, Any]]

class FidoRegister(BaseModel):
    uid: str
    fido_credential_id: str
    fido_password: str

class FidoLogin(BaseModel):
    fido_credential_id: str

class ProductSchema(BaseModel):
    id: Optional[str] = None
    pid: str
    name: str
    type: str
    stock: int
    price: float
    unit: str
    branch: str
    image_url: str
    is_flash_sale: Optional[bool] = False
    discount_percent: Optional[int] = 20

class OrderItemSchema(BaseModel):
    product_name: str
    price: float
    quantity: int
    image_url: str

class OrderCreateSchema(BaseModel):
    id: Optional[str] = None
    user_id: str
    order_id: str
    total_amount: float
    status: str = "Hoàn tất"
    items: List[OrderItemSchema]

class SubscriberSchema(BaseModel):
    uid: Optional[str] = None
    email: str

class InventoryLogSchema(BaseModel):
    productName: str
    quantity: int
    type: str
    userName: str
    branch: str

class SettingSchema(BaseModel):
    value: str

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/register")
def register(data: UserRegister):
    # Check if email already exists
    existing = execute_query("SELECT uid FROM users WHERE email = %s", (data.email,), fetch=True)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email đã tồn tại!")
    
    uid = str(uuid.uuid4())
    hashed_pwd = hash_password(data.password)
    execute_query(
        "INSERT INTO users (uid, email, password, role) VALUES (%s, %s, %s, 'user')",
        (uid, data.email, hashed_pwd)
    )
    return {"uid": uid, "email": data.email, "role": "user"}

@app.post("/api/auth/login")
def login(data: UserLogin):
    user = execute_query(
        "SELECT uid, email, fullname, dob, phone, address, nearest_store, role, has_fido, tfa_secret, password, fido_password FROM users WHERE email = %s",
        (data.email,),
        fetch=True
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai tài khoản hoặc mật khẩu!")
        
    user_data = user[0]
    stored_password = user_data.get("password")
    stored_fido_password = user_data.get("fido_password")
    
    is_valid = False
    if stored_password and verify_password(data.password, stored_password):
        is_valid = True
    elif stored_fido_password and verify_password(data.password, stored_fido_password):
        is_valid = True
        
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai tài khoản hoặc mật khẩu!")
        
    # Return user data without password fields
    return {
        "uid": user_data["uid"],
        "email": user_data["email"],
        "fullname": user_data["fullname"],
        "dob": user_data["dob"],
        "phone": user_data["phone"],
        "address": user_data["address"],
        "nearest_store": user_data["nearest_store"],
        "role": user_data["role"],
        "has_fido": user_data["has_fido"],
        "tfa_secret": user_data["tfa_secret"]
    }


@app.get("/api/auth/profile/{uid}")
def get_profile(uid: str):
    user = execute_query(
        "SELECT uid, email, fullname, dob, phone, address, nearest_store, role, has_fido, tfa_secret, fido_credential_id FROM users WHERE uid = %s",
        (uid,),
        fetch=True
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng!")
    return user[0]

@app.delete("/api/auth/profile/{uid}")
def delete_profile(uid: str):
    execute_query("DELETE FROM users WHERE uid = %s", (uid,))
    return {"status": "success", "message": "Xóa người dùng thành công!"}

@app.put("/api/auth/profile/{uid}")
def update_profile(uid: str, data: ProfileUpdate):
    # Dynamically build update query
    updates = []
    params = []
    
    if data.fullname is not None:
        updates.append("fullname = %s")
        params.append(data.fullname)
    if data.dob is not None:
        updates.append("dob = %s")
        params.append(data.dob)
    if data.phone is not None:
        updates.append("phone = %s")
        params.append(data.phone)
    if data.address is not None:
        updates.append("address = %s")
        params.append(data.address)
    if data.nearest_store is not None:
        updates.append("nearest_store = %s")
        params.append(data.nearest_store)
    if data.tfa_secret is not None:
        updates.append("tfa_secret = %s")
        params.append(data.tfa_secret)
        
    if not updates:
        return {"status": "success", "message": "Không có thông tin thay đổi!"}
        
    params.append(uid)
    query_str = f"UPDATE users SET {', '.join(updates)} WHERE uid = %s"
    execute_query(query_str, tuple(params))
    
    return {"status": "success", "message": "Cập nhật hồ sơ thành công!"}

@app.post("/api/auth/fido-register")
def fido_register(data: FidoRegister):
    execute_query(
        "UPDATE users SET fido_credential_id = %s, fido_password = %s, has_fido = TRUE WHERE uid = %s",
        (data.fido_credential_id, data.fido_password, data.uid)
    )
    return {"status": "success", "message": "Liên kết thiết bị bảo mật FIDO2 thành công!"}

@app.post("/api/auth/fido-login")
def fido_login(data: FidoLogin):
    user = execute_query(
        "SELECT uid, email, fullname, dob, phone, address, nearest_store, role, has_fido, tfa_secret, fido_password FROM users WHERE fido_credential_id = %s",
        (data.fido_credential_id,),
        fetch=True
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiết bị FIDO2 chưa được liên kết!")
    return user[0]

# --- PRODUCTS ENDPOINTS ---

@app.get("/api/products", response_model=List[ProductSchema])
def get_products(branch: str = "ngt", type: str = "all"):
    if type == "all":
        products = execute_query(
            "SELECT id, pid, name, type, stock, price, unit, branch, image_url, is_flash_sale, discount_percent FROM products WHERE branch = %s ORDER BY name ASC",
            (branch,),
            fetch=True
        )
    else:
        # Match type filter case-insensitively or normally
        products = execute_query(
            "SELECT id, pid, name, type, stock, price, unit, branch, image_url, is_flash_sale, discount_percent FROM products WHERE branch = %s AND LOWER(type) = LOWER(%s) ORDER BY name ASC",
            (branch, type),
            fetch=True
        )
    
    # Format numeric price to float
    for p in products:
        p['price'] = float(p['price'])
        p['is_flash_sale'] = bool(p['is_flash_sale'])
        p['discount_percent'] = int(p['discount_percent']) if p['discount_percent'] is not None else 20
    return products

@app.get("/api/products/{prod_id}", response_model=ProductSchema)
def get_product(prod_id: str):
    product = execute_query(
        "SELECT id, pid, name, type, stock, price, unit, branch, image_url, is_flash_sale, discount_percent FROM products WHERE id = %s",
        (prod_id,),
        fetch=True
    )
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm!")
    p = product[0]
    p['price'] = float(p['price'])
    p['is_flash_sale'] = bool(p['is_flash_sale'])
    p['discount_percent'] = int(p['discount_percent']) if p['discount_percent'] is not None else 20
    return p

@app.post("/api/products")
def create_product(data: ProductSchema):
    prod_id = data.id or str(uuid.uuid4())
    execute_query(
        "INSERT INTO products (id, pid, name, type, stock, price, unit, branch, image_url, is_flash_sale, discount_percent) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (prod_id, data.pid, data.name, data.type, data.stock, data.price, data.unit, data.branch, data.image_url, data.is_flash_sale, data.discount_percent)
    )
    return {"status": "success", "id": prod_id}

@app.post("/api/products/clear-flash-sale")
def clear_flash_sale():
    execute_query("UPDATE products SET is_flash_sale = FALSE")
    return {"status": "success", "message": "Đã xóa tất cả sản phẩm khỏi Flash Sale"}

@app.put("/api/products/{prod_id}")
def update_product(prod_id: str, data: ProductSchema):
    execute_query(
        "UPDATE products SET pid = %s, name = %s, type = %s, stock = %s, price = %s, unit = %s, branch = %s, image_url = %s, is_flash_sale = %s, discount_percent = %s WHERE id = %s",
        (data.pid, data.name, data.type, data.stock, data.price, data.unit, data.branch, data.image_url, data.is_flash_sale, data.discount_percent, prod_id)
    )
    return {"status": "success"}

@app.delete("/api/products/{prod_id}")
def delete_product(prod_id: str):
    execute_query("DELETE FROM products WHERE id = %s", (prod_id,))
    return {"status": "success"}

# --- ORDERS ENDPOINTS ---

@app.post("/api/orders")
def create_order(data: OrderCreateSchema):
    order_uuid = data.id or str(uuid.uuid4())
    order_date_str = datetime.utcnow().isoformat() + "Z"
    
    # 1. Insert order record
    execute_query(
        "INSERT INTO orders (id, user_id, order_id, total_amount, status, order_date) VALUES (%s, %s, %s, %s, %s, %s)",
        (order_uuid, data.user_id, data.order_id, data.total_amount, data.status, order_date_str)
    )
    
    # 2. Insert items
    for item in data.items:
        execute_query(
            "INSERT INTO order_items (order_id, product_name, price, quantity, image_url) VALUES (%s, %s, %s, %s, %s)",
            (order_uuid, item.product_name, item.price, item.quantity, item.image_url)
        )
        
    return {"status": "success", "id": order_uuid}

@app.get("/api/orders")
def get_orders(user_id: str):
    orders = execute_query(
        "SELECT id, user_id, order_id, total_amount, status, order_date FROM orders WHERE user_id = %s ORDER BY order_date DESC",
        (user_id,),
        fetch=True
    )
    
    result = []
    for order in orders:
        order['total_amount'] = float(order['total_amount'])
        # Get items for this order
        items = execute_query(
            "SELECT id, product_name, price, quantity, image_url FROM order_items WHERE order_id = %s",
            (order['id'],),
            fetch=True
        )
        for item in items:
            item['price'] = float(item['price'])
        order['items'] = items
        result.append(order)
        
    return result

# --- SUBSCRIBERS ENDPOINT ---

@app.post("/api/subscribers")
def subscribe(data: SubscriberSchema):
    # Mock subscriber table or update user's subscriber status
    if data.uid:
        execute_query(
            "UPDATE users SET role = 'user' WHERE uid = %s",
            (data.uid,)
        )
    return {"status": "success", "message": "Đăng ký nhận tin thành công!"}

# --- INVENTORY LOGS ENDPOINTS ---

@app.post("/api/inventory-logs")
def create_inventory_log(data: InventoryLogSchema):
    execute_query(
        "INSERT INTO inventory_logs (product_name, quantity, type, user_name, branch) VALUES (%s, %s, %s, %s, %s)",
        (data.productName, data.quantity, data.type, data.userName, data.branch)
    )
    return {"status": "success"}

@app.get("/api/inventory-logs")
def get_inventory_logs():
    logs = execute_query(
        "SELECT id, product_name, quantity, type, user_name, branch, timestamp FROM inventory_logs ORDER BY timestamp DESC",
        fetch=True
    )
    # Convert types if needed
    result = []
    for log in logs:
        result.append({
            "productName": log["product_name"],
            "quantity": log["quantity"],
            "type": log["type"],
            "userName": log["user_name"],
            "branch": log["branch"],
            # Return timestamp as ISO format or format it
            "timestamp": log["timestamp"].isoformat() if log["timestamp"] else None
        })
    return result

@app.get("/api/carts/{user_id}")
def get_cart(user_id: str):
    import json
    cart = execute_query(
        "SELECT items FROM carts WHERE user_id = %s",
        (user_id,),
        fetch=True
    )
    if not cart:
        execute_query(
            "INSERT INTO carts (user_id, items) VALUES (%s, '[]'::jsonb) ON CONFLICT (user_id) DO NOTHING",
            (user_id,)
        )
        return {"items": []}
    
    items_data = cart[0]["items"]
    if isinstance(items_data, str):
        return {"items": json.loads(items_data)}
    return {"items": items_data}

@app.post("/api/carts/{user_id}")
def update_cart(user_id: str, data: CartUpdate):
    import json
    items_json = json.dumps(data.items)
    execute_query(
        "INSERT INTO carts (user_id, items) VALUES (%s, %s::jsonb) ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items",
        (user_id, items_json)
    )
    return {"status": "success", "message": "Giỏ hàng được cập nhật thành công!"}

# --- SETTINGS ENDPOINTS ---

@app.get("/api/settings/{key}")
def get_setting(key: str):
    row = execute_query(
        "SELECT value FROM site_settings WHERE key = %s",
        (key,),
        fetch=True
    )
    if not row:
        return {"exists": False, "key": key, "value": None}
    return {"exists": True, "key": key, "value": row[0]["value"]}

@app.post("/api/settings/{key}")
def set_setting(key: str, data: SettingSchema):
    execute_query(
        "INSERT INTO site_settings (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        (key, data.value)
    )
    return {"status": "success"}

# --- FILE UPLOAD ENDPOINT ---

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Create directory if not exists
        base_dir = os.path.dirname(os.path.dirname(__file__))
        upload_dir = os.path.join(base_dir, "assets", "img", "products")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate a safe filename
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        filename = f"{int(datetime.utcnow().timestamp())}_ck{ext}"
        file_path = os.path.join(upload_dir, filename)
        
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # Return the relative path for frontend reference
        return {"imageUrl": f"../assets/img/products/{filename}"}
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên máy chủ!")
