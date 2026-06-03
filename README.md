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
- Bộ công cụ chạy bằng Node.js giúp xuất và di chuyển dữ liệu người dùng/đơn hàng từ Firebase Firestore sang hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL phục vụ mở rộng hệ thống.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
CircleK-Website/
├── assets/                     # Tài nguyên tĩnh của hệ thống
│   ├── css/                    # Các file stylesheet (stylelogin, cart, profile...)
│   ├── js/                     # Logic xử lý client-side
│   │   ├── auth.js             # Logic đăng nhập, đăng ký, 2FA, FIDO2
│   │   ├── profile.js          # Logic cập nhật hồ sơ & đăng ký thiết bị bảo mật
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
├── package.json                # Cấu hình dự án Node.js để di cư dữ liệu
├── import.js                   # Script di cư dữ liệu sang PostgreSQL
├── .env                        # Biến môi trường kết nối database PostgreSQL
└── README.md                   # Tài liệu hướng dẫn sử dụng dự án
```

---

## 🛠️ Hướng Dẫn Cài Đặt Và Chạy Local

### 1. Chạy Trang Web Giao Diện
- Bạn có thể chạy trực tiếp bằng cách mở file `index.html` ở thư mục gốc thông qua **Live Server** trên VS Code.
- Đảm bảo môi trường chạy ở địa chỉ `http://localhost:5500` hoặc triển khai trực tiếp lên hosting hỗ trợ HTTPS (như **Vercel**, **Netlify**) để kiểm thử được tính năng bảo mật sinh trắc học FIDO2.

### 2. Chạy Script Di Cư Database (Node.js & PostgreSQL)
Để chạy script nhập dữ liệu từ Firebase JSON sang PostgreSQL:
1. Cài đặt các thư viện cần thiết:
   ```bash
   npm install
   ```
2. Cấu hình các thông số kết nối PostgreSQL trong file `.env`:
   ```env
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres
   PGPASSWORD=your_password
   PGDATABASE=your_database
   ```
3. Khởi chạy quá trình import:
   ```bash
   npm run import
   ```

---

## 📝 Bản Quyền và Phát Triển
Dự án được xây dựng và phát triển trên nền tảng HTML5, CSS3, Javascript ES6 và Firebase SDK v10.
