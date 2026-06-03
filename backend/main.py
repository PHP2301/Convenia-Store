from fastapi import FastAPI, HTTPException, status, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
import logging
from datetime import datetime
import os

from backend.database import execute_query, init_db_pool

# Initialize logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/register")
def register(data: UserRegister):
    # Check if email already exists
    existing = execute_query("SELECT uid FROM users WHERE email = %s", (data.email,), fetch=True)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email đã tồn tại!")
    
    uid = str(uuid.uuid4())
    execute_query(
        "INSERT INTO users (uid, email, password, role) VALUES (%s, %s, %s, 'user')",
        (uid, data.email, data.password)
    )
    return {"uid": uid, "email": data.email, "role": "user"}

@app.post("/api/auth/login")
def login(data: UserLogin):
    user = execute_query(
        "SELECT uid, email, fullname, dob, phone, address, nearest_store, role, has_fido, tfa_secret FROM users WHERE email = %s AND (password = %s OR fido_password = %s)",
        (data.email, data.password, data.password),
        fetch=True
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sai tài khoản hoặc mật khẩu!")
    return user[0]

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
        raise HTTPException(status_code=400, detail="Không có thông tin thay đổi!")
        
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
            "SELECT id, pid, name, type, stock, price, unit, branch, image_url FROM products WHERE branch = %s ORDER BY name ASC",
            (branch,),
            fetch=True
        )
    else:
        # Match type filter case-insensitively or normally
        products = execute_query(
            "SELECT id, pid, name, type, stock, price, unit, branch, image_url FROM products WHERE branch = %s AND LOWER(type) = LOWER(%s) ORDER BY name ASC",
            (branch, type),
            fetch=True
        )
    
    # Format numeric price to float
    for p in products:
        p['price'] = float(p['price'])
    return products

@app.post("/api/products")
def create_product(data: ProductSchema):
    prod_id = data.id or str(uuid.uuid4())
    execute_query(
        "INSERT INTO products (id, pid, name, type, stock, price, unit, branch, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (prod_id, data.pid, data.name, data.type, data.stock, data.price, data.unit, data.branch, data.image_url)
    )
    return {"status": "success", "id": prod_id}

@app.put("/api/products/{prod_id}")
def update_product(prod_id: str, data: ProductSchema):
    execute_query(
        "UPDATE products SET pid = %s, name = %s, type = %s, stock = %s, price = %s, unit = %s, branch = %s, image_url = %s WHERE id = %s",
        (data.pid, data.name, data.type, data.stock, data.price, data.unit, data.branch, data.image_url, prod_id)
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
