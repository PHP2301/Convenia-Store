# 🏪 Convenia - Hệ thống Web Cửa hàng Tiện lợi & Tính năng Bảo mật Nâng cao (FIDO2 & 2FA)

Dự án phát triển giao diện web mua sắm Convenia (tên ban đầu lấy ví dụ là Convenia Store Việt Nam) kết hợp hệ thống xác thực bảo mật đa yếu tố nâng cao. Dự án sử dụng PostgreSQL và FastAPI làm nền tảng lưu trữ và quản lý, tích hợp đăng nhập không mật khẩu (Passwordless) và xác thực giao dịch qua FIDO2/WebAuthn.

---

## 🚀 Các Tính Năng Bảo Mật Nổi Bật

### 1. Đăng Nhập "Chạm" Không Mật Khẩu (Passwordless Login - FIDO2)

- Cho phép người dùng đăng nhập nhanh chóng bằng **Windows Hello** hoặc **Touch ID** trên thiết bị mà không cần nhập Email và Mật khẩu rườm rà.
- Sử dụng tiêu chuẩn WebAuthn bảo mật bậc nhất, lưu trữ khóa an toàn trực tiếp trên phần cứng của thiết bị (TPM hoặc Secure Enclave).

### 2. Xác Thực Đa Yếu Tố (MFA Step-up) Khi Thanh Toán

- Khi khách hàng thực hiện hành động nhạy cảm là **"Xác nhận thanh toán đơn hàng"**, hệ thống yêu cầu quét vân tay hoặc khuôn mặt bằng FIDO2 trên thiết bị để hoàn tất giao dịch thay vì OTP SMS truyền thống.
- Ngăn chặn triệt để việc tài khoản bị kẻ gian sử dụng số dư hoặc mua sắm trái phép khi lỡ lộ mật khẩu.

### 3. Xác Thực Hai Lớp (2FA - TOTP) Bằng Google Authenticator

- Khi người dùng đăng nhập bằng mật khẩu thường hoặc thực hiện các thao tác khôi phục tài khoản, hệ thống sẽ yêu cầu nhập mã OTP động 6 chữ số từ ứng dụng Google Authenticator hoặc Microsoft Authenticator.
- Tự động đồng bộ và hỗ trợ lệch múi giờ thiết bị (Time-drift window).

### 4. Ghi Nhớ Thiết Bị (Remember Me)

- Hỗ trợ bỏ qua bước nhập OTP 2FA cho các lần đăng nhập tiếp theo trên cùng trình duyệt nếu người dùng tích chọn "Ghi nhớ".

### 5. Cơ Sở Dữ Liệu Quan Hệ Hiện Đại

- Chuyển đổi toàn diện dữ liệu cũ sang hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL/Supabase hỗ trợ các cột số tiền cực lớn và quan hệ ràng buộc chặt chẽ.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
Convenia-Store/
├── backend/                    # Mã nguồn Backend FastAPI (Python)
│   ├── main.py                 # File chạy ứng dụng FastAPI & định nghĩa API
│   ├── database.py             # Quản lý Connection Pool kết nối PostgreSQL
│   ├── config.py               # Các biến cấu hình PostgreSQL
│   └── requirements.txt        # Các thư viện phụ thuộc Python
├── data/                       # Dữ liệu di trú cơ sở dữ liệu
│   └── convenia_db_migration.sql # Dump cơ sở dữ liệu PostgreSQL đầy đủ
├── assets/                     # Tài nguyên tĩnh của hệ thống
│   ├── css/                    # Các file stylesheet
│   ├── js/                     # Logic xử lý client-side
│   │   ├── api-client.js       # API Client gọi FastAPI thay thế Firebase SDK
│   │   ├── auth.js             # Logic đăng nhập, đăng ký, 2FA, FIDO2
│   │   ├── profile.js          # Logic cập nhật hồ sơ & cấu hình FIDO2
│   │   ├── cart-logic.js       # Quản lý giỏ hàng & xác thực thanh toán FIDO2
│   │   └── admin.js            # Trang quản trị sản phẩm và kho hàng
│   └── img/                    # Hình ảnh sản phẩm, banner quảng cáo
├── html/                       # Giao diện các trang chức năng
│   ├── index.html              # Trang chủ mua sắm
│   ├── indexlogin.html         # Trang đăng ký / đăng nhập / 2FA
│   ├── indexprofile.html       # Trang thông tin tài khoản & cấu hình FIDO2
│   ├── cart.html               # Trang giỏ hàng
│   ├── history.html            # Trang lịch sử đơn hàng
│   └── admin.html              # Trang quản lý dành cho Admin
├── index.html                  # File chuyển hướng tự động ở thư mục gốc (cho Vercel)
├── Procfile                    # File định cấu hình chạy Uvicorn trên hosting cloud
└── README.md                   # Tài liệu hướng dẫn sử dụng dự án
```

---

## 🛠️ Hướng Dẫn Cài Đặt Và Chạy Local

### 1. Thiết lập Cơ sở dữ liệu PostgreSQL

1. Mở PostgreSQL client (hoặc pgAdmin / psql) của bạn.
2. Tạo một cơ sở dữ liệu mới (ví dụ: `convenia`).
3. Thực thi nội dung tệp SQL di trú tại [data/convenia_db_migration.sql](data/convenia_db_migration.sql) để tạo bảng và nhập toàn bộ dữ liệu mẫu ban đầu:
   ```bash
   psql -U postgres -d convenia -f data/convenia_db_migration.sql
   ```

### 2. Thiết lập và Khởi chạy FastAPI Backend (Python)

1. Cài đặt Python 3.8+ (nếu máy tính của bạn chưa có).
2. Tạo môi trường ảo và cài đặt các thư viện cần thiết trong thư mục dự án:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Cấu hình biến môi trường kết nối database trong Command Prompt hoặc PowerShell (mặc định sẽ là localhost, user `postgres`, pass `123456`, db `postgres` nếu không cấu hình):
   ```powershell
   $env:DB_PASSWORD="your_postgres_password"
   $env:DB_NAME="convenia"
   ```
4. Khởi chạy FastAPI API server:
   ```bash
   uvicorn backend.main:app --reload
   ```
   API docs tự động sẽ có tại: `http://localhost:8000/docs`.

### 3. Chạy Trang Web Giao Diện (Frontend)

- Sử dụng tiện ích **Live Server** trên VS Code để chạy thư mục dự án.
- Đảm bảo môi trường chạy ở địa chỉ mặc định `http://localhost:5500` hoặc `http://127.0.0.1:5500` để các tính năng WebAuthn FIDO2 sinh trắc học và CORS hoạt động chính xác.

---

## 🌐 Hướng Dẫn Deploy Lên Cloud (Online Miễn Phí)

Hệ thống được thiết kế tối ưu hóa để triển khai trực tuyến hoàn toàn miễn phí trên các dịch vụ đám mây tốt nhất hiện nay:

### 1. Database Cloud (Supabase)

1. Tạo tài khoản miễn phí trên [Supabase.com](https://supabase.com/).
2. Tạo một dự án mới (chọn khu vực Singapore để có độ trễ tốt nhất).
3. Vào mục **SQL Editor** của dự án -> Chọn **New Query** -> Dán toàn bộ nội dung trong tệp [convenia_db_migration.sql](data/convenia_db_migration.sql) rồi nhấn **Run** để thiết lập cấu trúc bảng và nhập dữ liệu.
4. Truy cập **Project Settings** -> **Database** -> Nhấp nút **Connect** ở góc trên bên phải -> Chọn tab **Transaction** (sử dụng cổng `6543`) và sao chép chuỗi kết nối **URI**.

### 2. Backend Cloud (Render)

1. Tạo tài khoản và đăng nhập trên [Render.com](https://render.com/) bằng GitHub.
2. Tạo mới một **Web Service** -> Chọn kết nối với repository GitHub của dự án này.
3. Cấu hình thông tin dịch vụ:
   - **Language:** Chọn `Python`
   - **Region:** Chọn `Singapore (Southeast Asia)`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Vào mục **Environment** -> Chọn **Add Environment Variable** để cấu hình database:
   - **Key:** `DATABASE_URL`
   - **Value:** Điền chuỗi kết nối **Transaction Pooler** đã copy từ Supabase (lưu ý thay thế mật khẩu của bạn vào; mã hóa các ký tự đặc biệt ví dụ `@` đổi thành `%40`).
5. Click **Deploy Web Service** và lấy đường dẫn URL API chạy online (dạng: `https://convenia-website.onrender.com`).

### 3. Frontend Cloud (Vercel)

1. Tạo tài khoản trên [Vercel.com](https://vercel.com/) và import repository GitHub của bạn vào.
2. Vercel sẽ tự động phát hiện ứng dụng web tĩnh của bạn và triển khai chỉ trong vài giây.
3. Mọi cập nhật code đẩy lên GitHub sẽ được tự động đồng bộ và deploy lại trên Vercel.

---

## 📝 Bản Quyền và Phát Triển

Dự án được xây dựng và phát triển trên nền tảng HTML5, CSS3, Javascript ES6, FastAPI (Python) và PostgreSQL.
