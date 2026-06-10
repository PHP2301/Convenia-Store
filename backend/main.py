from fastapi import FastAPI, HTTPException, status, Query, UploadFile, File, Response, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime
import os
import bcrypt
import time
import hashlib
from collections import defaultdict
from contextlib import asynccontextmanager

from backend.database import execute_query, init_db_pool
from backend.auth_utils import create_access_token, create_refresh_token, verify_token, require_admin

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    # Use standard SHA-256 hash representation
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    # Fallback checking for older bcrypt records
    if hashed_password.startswith("$2a$") or hashed_password.startswith("$2b$"):
        try:
            pwd_bytes = plain_password.encode('utf-8')
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(pwd_bytes, hashed_bytes)
        except Exception:
            pass
    # Verify via SHA-256
    sha_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return sha_hash == hashed_password

@asynccontextmanager
async def lifespan(app: FastAPI):
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

    # Migrate passwords to SHA-256 if they are plaintext
    try:
        all_users = execute_query("SELECT uid, password, fido_password FROM users", fetch=True)
        if all_users:
            for u in all_users:
                pwd = u["password"]
                if pwd and not (pwd.startswith("$2a$") or pwd.startswith("$2b$")) and len(pwd) != 64:
                    hashed = hash_password(pwd)
                    execute_query("UPDATE users SET password = %s WHERE uid = %s", (hashed, u["uid"]))
                
                fido_pwd = u["fido_password"]
                if fido_pwd and not (fido_pwd.startswith("$2a$") or fido_pwd.startswith("$2b$")) and len(fido_pwd) != 64:
                    hashed_fido = hash_password(fido_pwd)
                    execute_query("UPDATE users SET fido_password = %s WHERE uid = %s", (hashed_fido, u["uid"]))
            logger.info("Passwords migration completed successfully.")
    except Exception as e:
        logger.error(f"Error during password migration: {e}")
    yield

# App initialization and routing
app = FastAPI(title="Convenia Store Việt Nam Backend API", version="1.0.0", lifespan=lifespan)

# Enable CORS for frontend local server and production domain
origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173", # Vite local
    "http://127.0.0.1:5173",
    "https://convenia-website.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for rate limiting: ip_address -> list of timestamps
rate_limit_store = defaultdict(list)

def is_rate_limited(ip: str, limit: int, window: int) -> bool:
    now = time.time()
    # Keep only timestamps within the window
    rate_limit_store[ip] = [t for t in rate_limit_store[ip] if now - t < window]
    if len(rate_limit_store[ip]) >= limit:
        return True
    rate_limit_store[ip].append(now)
    return False

# Rate Limiting Middleware
@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    # Only rate limit API requests
    if request.url.path.startswith("/api"):
        # Try to get the real client IP behind reverse proxies (Vercel, Render, Cloudflare)
        x_forwarded_for = request.headers.get("x-forwarded-for")
        x_real_ip = request.headers.get("x-real-ip")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        elif x_real_ip:
            client_ip = x_real_ip.strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        # Bypass rate limiting for localhost to allow local development & testing
        if client_ip in ("127.0.0.1", "localhost", "::1"):
            response = await call_next(request)
            return response
            
        limit = 100     # Default API rate limit: 100 requests/min
        window = 60
        
        if request.url.path == "/api/auth/login":
            limit = 15   # Increase login limit to 15 requests/min for testing safety
        elif request.url.path == "/api/upload":
            limit = 10  # Upload limit: 10 requests/min
            
        if is_rate_limited(client_ip, limit, window):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Bạn đã gửi quá nhiều yêu cầu! Vui lòng thử lại sau."}
            )
            
    response = await call_next(request)
    return response

# Security Headers Middleware (CSP, Clickjacking, XSS Protection)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; "
        "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; "
        "img-src 'self' data: https://www.circlek.com.vn https://images.unsplash.com; "
        "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000;"
    )
    response.headers["Content-Security-Policy"] = csp
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response

# Lifespan events configured on app initialization


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
    has_fido: Optional[bool] = None
    fido_credential_id: Optional[str] = None

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

# --- ROOT ENDPOINT ---
@app.get("/")
def read_root():
    return {"status": "online", "message": "Convenia API is running"}

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
def login(data: UserLogin, response: Response):
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
        
    # Generate Tokens
    access_token = create_access_token(user_data["uid"], user_data["role"])
    refresh_token = create_refresh_token(user_data["uid"])
    
    # Set Cookies (Lưu ở Cookie bảo mật chống XSS)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=300,  # 5 phút
        samesite="lax",
        secure=False  # Cấu hình True nếu deploy HTTPS
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=604800,  # 7 ngày
        samesite="lax",
        secure=False
    )
    
    # Return user data with access_token (để lưu localStorage dự phòng theo yêu cầu)
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
        "tfa_secret": None,
        "access_token": access_token
    }

@app.post("/api/auth/refresh")
def refresh_token(request: Request, response: Response):
    # Lấy refresh token từ cookie
    r_token = request.cookies.get("refresh_token")
    if not r_token:
        raise HTTPException(status_code=401, detail="Không tìm thấy refresh token!")
    try:
        payload = verify_token(r_token)
        uid = payload.get("sub")
        
        user = execute_query("SELECT role FROM users WHERE uid = %s", (uid,), fetch=True)
        if not user:
            raise HTTPException(status_code=401, detail="User không tồn tại!")
        role = user[0]["role"]
        
        new_access = create_access_token(uid, role)
        response.set_cookie(
            key="access_token",
            value=new_access,
            httponly=True,
            max_age=300,
            samesite="lax",
            secure=False
        )
        return {"access_token": new_access}
    except Exception:
        raise HTTPException(status_code=401, detail="Refresh token không hợp lệ hoặc đã hết hạn!")

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"status": "success", "message": "Đăng xuất thành công!"}


@app.get("/api/auth/profile/{uid}")
def get_profile(uid: str):
    user = execute_query(
        "SELECT uid, email, fullname, dob, phone, address, nearest_store, role, has_fido, tfa_secret, fido_credential_id FROM users WHERE uid = %s",
        (uid,),
        fetch=True
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng!")
    user_data = dict(user[0])
    user_data["tfa_secret"] = None
    return user_data

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
    if data.has_fido is not None:
        updates.append("has_fido = %s")
        params.append(data.has_fido)
    if data.fido_credential_id is not None:
        updates.append("fido_credential_id = %s")
        params.append(data.fido_credential_id)
        
    if not updates:
        return {"status": "success", "message": "Không có thông tin thay đổi!"}
        
    params.append(uid)
    query_str = f"UPDATE users SET {', '.join(updates)} WHERE uid = %s"
    execute_query(query_str, tuple(params))
    
    return {"status": "success", "message": "Cập nhật hồ sơ thành công!"}

@app.post("/api/auth/fido-register")
def fido_register(data: FidoRegister):
    hashed_password = hash_password(data.fido_password)
    execute_query(
        "UPDATE users SET fido_credential_id = %s, fido_password = %s, has_fido = TRUE WHERE uid = %s",
        (data.fido_credential_id, hashed_password, data.uid)
    )
    return {"status": "success", "message": "Liên kết thiết bị bảo mật FIDO2 thành công!"}

@app.post("/api/auth/fido-login")
def fido_login(data: FidoLogin, response: Response):
    user = execute_query(
        "SELECT uid, email, fullname, dob, phone, address, nearest_store, role, has_fido, tfa_secret, fido_password FROM users WHERE fido_credential_id = %s",
        (data.fido_credential_id,),
        fetch=True
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiết bị FIDO2 chưa được liên kết!")
    
    user_data = user[0]
    
    # Generate tokens
    access_token = create_access_token(user_data["uid"], user_data["role"])
    refresh_token = create_refresh_token(user_data["uid"])
    
    # Set cookies
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=300,  # 5 minutes
        samesite="lax",
        secure=False
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=604800,  # 7 days
        samesite="lax",
        secure=False
    )
    
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
        "tfa_secret": None,
        "access_token": access_token
    }

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
def create_product(data: ProductSchema, admin: dict = Depends(require_admin)):
    prod_id = data.id or str(uuid.uuid4())
    execute_query(
        "INSERT INTO products (id, pid, name, type, stock, price, unit, branch, image_url, is_flash_sale, discount_percent) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (prod_id, data.pid, data.name, data.type, data.stock, data.price, data.unit, data.branch, data.image_url, data.is_flash_sale, data.discount_percent)
    )
    return {"status": "success", "id": prod_id}

@app.post("/api/products/clear-flash-sale")
def clear_flash_sale(admin: dict = Depends(require_admin)):
    execute_query("UPDATE products SET is_flash_sale = FALSE")
    return {"status": "success", "message": "Đã xóa tất cả sản phẩm khỏi Flash Sale"}

@app.put("/api/products/{prod_id}")
def update_product(prod_id: str, data: ProductSchema, admin: dict = Depends(require_admin)):
    execute_query(
        "UPDATE products SET pid = %s, name = %s, type = %s, stock = %s, price = %s, unit = %s, branch = %s, image_url = %s, is_flash_sale = %s, discount_percent = %s WHERE id = %s",
        (data.pid, data.name, data.type, data.stock, data.price, data.unit, data.branch, data.image_url, data.is_flash_sale, data.discount_percent, prod_id)
    )
    return {"status": "success"}

@app.delete("/api/products/{prod_id}")
def delete_product(prod_id: str, admin: dict = Depends(require_admin)):
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
def get_inventory_logs(admin: dict = Depends(require_admin)):
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
        base_dir = os.path.dirname(os.path.dirname(__file__))
        
        # 1. Path in raw assets folder
        old_assets_dir = os.path.join(base_dir, "assets", "img", "products")
        os.makedirs(old_assets_dir, exist_ok=True)
        
        # 2. Path in React public assets folder
        new_assets_dir = os.path.join(base_dir, "frontend", "public", "assets", "img", "products")
        os.makedirs(new_assets_dir, exist_ok=True)
        
        # Generate a safe filename
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        filename = f"{int(datetime.utcnow().timestamp())}_ck{ext}"
        
        content = await file.read()
        
        # Save to both locations
        with open(os.path.join(old_assets_dir, filename), "wb") as f1:
            f1.write(content)
            
        with open(os.path.join(new_assets_dir, filename), "wb") as f2:
            f2.write(content)
            
        # Return web-accessible path starting with /assets
        return {"imageUrl": f"/assets/img/products/{filename}"}
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tải ảnh lên máy chủ!")
