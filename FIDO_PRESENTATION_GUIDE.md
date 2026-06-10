# HƯỚNG DẪN THUYẾT TRÌNH BẢO VỆ ĐỀ TÀI (ĐẠT ĐIỂM A/A+)
## Đề tài: Tích Hợp Xác Thực FIDO2/WebAuthn Vào Website Convenia Store

Tài liệu này hướng dẫn chi tiết cách thiết lập Slide, kịch bản Demo trực quan, các từ khóa ghi điểm và các câu hỏi phản biện thường gặp từ hội đồng chấm thi để giúp bạn đạt điểm tối đa.

---

## 1. Dàn Ý Slide Thuyết Trình (6 - 8 Slides)

### Slide 1: Giới thiệu đề tài & Thành viên
*   **Tiêu đề:** *"Xây dựng Website bán lẻ Convenia Store tích hợp chuẩn xác thực không mật khẩu FIDO2/WebAuthn"*
*   **Người thực hiện:** [Tên của bạn]

### Slide 2: Đặt vấn đề (Problem Statement)
*   **Thực trạng mật khẩu:** Dễ bị lộ, bị Brute-force (dò đoán), và đặc biệt dễ bị đánh cắp bởi các trang web giả mạo (**Phishing**).
*   **Hạn chế của OTP SMS/Google Authenticator (TOTP):** Dù có lớp bảo mật thứ 2, người dùng vẫn bị hacker lừa nhập mã OTP vào các trang web giả mạo (Man-in-the-Middle Phishing) để chiếm đoạt phiên.
*   **Yêu cầu đặt ra:** Cần một cơ chế xác thực mạnh mẽ hơn, thân thiện hơn $\rightarrow$ Loại bỏ việc truyền/lưu trữ mật khẩu tĩnh.

### Slide 3: Giải pháp: Công nghệ FIDO2 & WebAuthn
*   **FIDO2 là gì:** Tiêu chuẩn xác thực mở toàn cầu chống Phishing.
*   **Cơ chế cốt lõi:**
    *   Sử dụng mật mã học khóa bất đối xứng (**Public/Private Key**).
    *   Ràng buộc tên miền (**Origin-binding**): Chỉ ký số cho trang web chính chủ, ngăn chặn 100% Phishing.
    *   Bảo mật phần cứng: Khóa bí mật nằm trong chip bảo mật của thiết bị (TPM của PC, Secure Enclave của iOS/Macbook).

### Slide 4: Kiến trúc hệ thống (Architecture)
*(Sử dụng sơ đồ Sequence Diagram trong file FIDO_MFA_GUIDE.md)*
*   Làm rõ cách Frontend giao tiếp với Trình duyệt thông qua API WebAuthn.
*   Cách Backend FastAPI (Python) lưu trữ `fido_credential_id` kết hợp băm mật khẩu bằng **SHA-256**.

### Slide 5: Hiện thực mã nguồn (Code Implementation)
*   **Frontend (React):** Chụp màn hình đoạn mã gọi API `navigator.credentials.create()` (Đăng ký thiết bị) và `navigator.credentials.get()` (Đăng nhập nhanh).
*   **Backend (FastAPI):** Show endpoint `/api/auth/fido-register` và `/api/auth/fido-login`.

### Slide 6: Đánh giá & Hướng phát triển
*   **Điểm mạnh:** Đăng nhập không mật khẩu siêu tốc (dưới 2 giây), độ an toàn phần cứng cao nhất hiện nay.
*   **Điểm yếu & Hướng giải quyết:** Tấn công lấy trộm session cookie (Session Hijacking) $\rightarrow$ Cần triển khai các biện pháp bảo mật Http-Only Cookie nghiêm ngặt để khóa session.

---

## 2. Kịch Bản Demo Trực Quan (2 Phút)

Hãy làm theo đúng 3 bước sau để tạo hiệu ứng thuyết phục tốt nhất:

1.  **Đăng nhập mật khẩu truyền thống:** Đăng nhập vào hệ thống bình thường bằng Email + Mật khẩu.
2.  **Liên kết sinh trắc học:**
    *   Vào trang cá nhân (Profile). Bấm **Liên kết thiết bị bảo mật**.
    *   **Điểm nhấn:** Hộp thoại **Windows Security (hoặc Touch ID / Face ID)** hiện ra trên trình duyệt. Quét vân tay hoặc nhập PIN thiết bị để hoàn tất liên kết khóa.
3.  **Đăng nhập nhanh không mật khẩu:**
    *   Đăng xuất tài khoản.
    *   Ở trang Đăng nhập, nhập Email và bấm **Đăng nhập với vân tay / FIDO2**.
    *   Quét vân tay $\rightarrow$ Hệ thống đăng nhập thành công ngay lập tức mà không cần nhập mật khẩu.

---

## 3. Các Từ Khóa "Đắt Giá" Để Ghi Điểm

*   **Origin Binding (Ràng buộc nguồn gốc):** Ngăn chặn Phishing tuyệt đối vì trình duyệt chỉ thực hiện ký số khi đúng domain nguồn gốc.
*   **Hardware-backed Credentials (Thông tin xác thực dựa trên phần cứng):** Khóa riêng tư được bảo vệ trong chip bảo mật vật lý (TPM, Secure Enclave). Dữ liệu sinh trắc học không bao giờ được gửi lên Server.
*   **Asymmetric Cryptography (Mật mã học bất đối xứng):** Xác thực bằng cặp khóa công khai - bí mật, giải quyết triệt để vấn đề rò rỉ dữ liệu mật khẩu tĩnh của Server.

---

## 4. Bộ Câu Hỏi Phản Biện & Câu Trả Lời Xuất Sắc

### Q1: Tại sao chạy trên localhost (HTTP) vẫn sử dụng được FIDO2 mà không báo lỗi HTTPS?
*   **Trả lời:** Theo chính sách bảo mật tiêu chuẩn của các trình duyệt hiện đại (Chrome, Edge, Safari), `localhost` được cấu hình mặc định là một "Secure Origin" (nguồn an toàn đặc cách) để hỗ trợ các nhà phát triển thử nghiệm API WebAuthn mà không cần chứng chỉ SSL. Khi triển khai thực tế trên Internet (Production), bắt buộc hệ thống phải có HTTPS.

### Q2: Sự khác biệt lớn nhất giữa FIDO2 và TOTP (Google Authenticator) là gì?
*   **Trả lời:** TOTP dựa trên thuật toán mã hóa đối xứng (cả Server và Client cùng chia sẻ một Secret Key chung). Nếu hacker tạo trang web giả mạo dụ người dùng nhập OTP, họ có thể lấy OTP đó đăng nhập ngay lập tức. FIDO2 sử dụng mã hóa bất đối xứng kết hợp **Origin Binding** của trình duyệt, không có khóa chung được truyền qua mạng và trình duyệt sẽ từ chối ký số nếu phát hiện tên miền giả mạo.

### Q3: Nếu người dùng bị mất thiết bị đã đăng ký FIDO2 thì làm thế nào để đăng nhập?
*   **Trả lời:** Đây là luồng khôi phục tài khoản (Account Recovery). Hệ thống của chúng em vẫn duy trì cơ chế đăng nhập truyền thống bằng email, mật khẩu băm SHA-256 làm phương án dự phòng. Khi đăng nhập thành công bằng luồng dự phòng này (kết hợp xác thực email/SMS), người dùng có thể xóa thiết bị cũ đã mất và liên kết với thiết bị mới trong trang Profile.

### Q4: Em đã xử lý mã hóa mật khẩu ở Backend như thế nào để đảm bảo an toàn?
*   **Trả lời:** Hệ thống sử dụng thuật toán băm một chiều **SHA-256** chuẩn mật mã học cho các tài khoản mới. Đồng thời, Backend hỗ trợ cơ chế phát hiện tự động và tương thích ngược với các tài khoản cũ đã được băm bằng **bcrypt** để đảm bảo dữ liệu người dùng không bị gián đoạn hay xung đột.
