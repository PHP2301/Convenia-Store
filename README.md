# 🏪 Circle K Clone - Hệ thống Web và Tính năng Bảo mật Nâng cao (FIDO2 & 2FA)

Dự án phát triển giao diện web mua sắm Circle K kết hợp hệ thống xác thực bảo mật đa yếu tố nâng cao. Dự án sử dụng Firebase làm nền tảng lưu trữ và quản lý, tích hợp đăng nhập không mật khẩu (Passwordless) và xác thực giao dịch qua FIDO2/WebAuthn.

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

### 5. Di Cư Cơ Sở Dữ Liệu (Firebase sang PostgreSQL)
- Bộ công cụ di trú SQL giúp chuyển đổi hoàn toàn dữ liệu Firebase cũ sang hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL phục vụ mở rộng hệ thống.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
CircleK-Website/
├── backend/                    # Mã nguồn Backend FastAPI (Python)
│   ├── main.py                 # File chạy ứng dụng FastAPI & định nghĩa API
│   ├── database.py             # Quản lý Connection Pool kết nối PostgreSQL
│   ├── config.py               # Các biến cấu hình PostgreSQL
│   └── requirements.txt        # Các thư viện phụ thuộc Python
├── data/                       # Dữ liệu di trú cơ sở dữ liệu
│   └── circlek_db_migration.sql # Dump cơ sở dữ liệu PostgreSQL đầy đủ
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
└── README.md                   # Tài liệu hướng dẫn sử dụng dự án
```

---

## 🛠️ Hướng Dẫn Cài Đặt Và Chạy Local

### 1. Thiết lập Cơ sở dữ liệu PostgreSQL
1. Mở PostgreSQL client (hoặc pgAdmin / psql) của bạn.
2. Tạo một cơ sở dữ liệu mới (ví dụ: `circlek`).
3. Thực thi nội dung tệp SQL di trú tại [data/circlek_db_migration.sql](file:///c:/Users/ACER/Documents/CK/CircleK-Website/data/circlek_db_migration.sql) để tạo bảng và nhập toàn bộ dữ liệu mẫu ban đầu:
   ```bash
   psql -U postgres -d circlek -f data/circlek_db_migration.sql
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
   $env:DB_NAME="circlek"
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

## 📝 Bản Quyền và Phát Triển
Dự án được xây dựng và phát triển trên nền tảng HTML5, CSS3, Javascript ES6, FastAPI (Python) và PostgreSQL.
