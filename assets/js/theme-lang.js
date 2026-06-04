// theme-lang.js - Quản lý sáng/tối và đa ngôn ngữ đồng bộ Database PostgreSQL

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : "https://convenia-website.onrender.com";

// --- COOKIE HELPERS ---
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Lấy ID định danh cho cấu hình
function getPrefsId() {
  const userStr = localStorage.getItem("current_user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.uid) return user.uid;
    } catch (e) {}
  }
  
  // Nếu chưa đăng nhập, sử dụng guest_id lưu trong Cookie
  let guestId = getCookie("guest_id");
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substring(2, 15);
    setCookie("guest_id", guestId);
  }
  return guestId;
}

// --- DICTIONARY ---
const translations = {
  vi: {
    // Header & Common
    "hệ thống ck go": "Hệ thống CK GO",
    "thức ăn & thức uống": "Thức ăn & Thức uống",
    "thức ăn": "Thức ăn",
    "thức uống": "Thức uống",
    "tất cả menu": "Tất cả Menu",
    "đăng nhập": "Đăng nhập",
    "đăng xuất": "Đăng xuất",
    "thông tin cá nhân": "Thông tin cá nhân",
    "quản lý kho": "Quản lý kho",
    "cửa hàng": "Cửa hàng",
    "đang xác định...": "Đang xác định...",
    "giỏ hàng": "Giỏ hàng",
    "tìm sản phẩm...": "Tìm sản phẩm...",
    "tài khoản": "Tài khoản",
    
    // Home
    "dịch vụ tiện ích": "Dịch vụ tiện ích",
    "ck go tự hào cung cấp các dịch vụ tiện ích đa dạng và chất lượng nhất": "CK GO tự hào cung cấp các dịch vụ tiện ích đa dạng và chất lượng nhất",
    "sản phẩm nổi bật": "Sản phẩm nổi bật",
    "đăng ký nhận tin khuyến mãi": "Đăng ký nhận tin khuyến mãi",
    "nhập email của bạn...": "Nhập email của bạn...",
    "đăng ký": "Đăng ký",
    "phòng chăm sóc khách hàng": "Phòng Chăm sóc khách hàng",
    "địa chỉ": "Địa chỉ",
    "ngày cấp": "Ngày cấp",
    "nơi cấp": "Nơi cấp",
    "ưu đãi đặc biệt": "Ưu đãi đặc biệt",
    "flash sale chớp nhoáng": "FLASH SALE CHỚP NHOÁNG",
    "kết thúc trong": "Kết thúc trong",
    "đang tải sản phẩm khuyến mãi từ hệ thống...": "Đang tải sản phẩm khuyến mãi từ hệ thống...",
    "gửi": "Gửi",
    "hệ thống cửa hàng": "HỆ THỐNG CỬA HÀNG",
    "sản phẩm & dịch vụ": "SẢN PHẨM & DỊCH VỤ",
    "giới thiệu": "Giới Thiệu",
    "cơ hội nghề nghiệp": "Cơ Hội Nghề Nghiệp",
    "tin tức & sự kiện": "Tin Tức & Sự Kiện",
    "liên hệ": "Liên Hệ",
    "điều khoản sử dụng": "Điều Khoản Sử Dụng",
    "chính sách": "Chính Sách",
    "hóa đơn đỏ": "Hóa Đơn Đỏ",
    "ck convenience store vietnam - chuỗi cửa hàng tiện lợi - mở cửa 24/7": "CK Convenience Store Vietnam - Chuỗi cửa hàng tiện lợi - Mở cửa 24/7",
    "công ty tnhh bán lẻ ck việt nam - giấy cnđkdn: 0306182043": "CÔNG TY TNHH BÁN LẺ CK VIỆT NAM - Giấy CNĐKDN: 0306182043",
    "ngày cấp: 10/11/2008. nơi cấp: sở kế hoạch - đầu tư tp. hồ chí minh": "Ngày cấp: 10/11/2008. Nơi cấp: Sở Kế hoạch - Đầu tư Tp. Hồ Chí Minh",
    "địa chỉ: 160 bùi thị xuân, phường bến thành, quận 1, thành phố hồ chí minh, việt nam.": "Địa chỉ: 160 Bùi Thị Xuân, Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh, Việt Nam.",
    "phòng chăm sóc khách hàng: 1900.3110": "Phòng Chăm sóc khách hàng: 1900.3110",
    "email: info@ckstores.com.vn": "Email: info@ckstores.com.vn",
    
    // Menu & Filter
    "bộ lọc sản phẩm": "Bộ lọc sản phẩm",
    "chọn chi nhánh": "Chọn chi nhánh",
    "tất cả chi nhánh": "Tất cả chi nhánh",
    "chi nhánh": "Chi nhánh",
    "mức giá": "Mức giá",
    "tất cả mức giá": "Tất cả mức giá",
    "dưới 15.000đ": "Dưới 15.000đ",
    "15.000đ - 30.000đ": "15.000đ - 30.000đ",
    "trên 30.000đ": "Trên 30.000đ",
    "sắp xếp": "Sắp xếp",
    "mặc định": "Mặc định",
    "giá tăng dần": "Giá tăng dần",
    "giá giảm dần": "Giá giảm dần",
    "còn lại": "Còn lại",
    "phần": "phần",
    "cái": "cái",
    "lon": "lon",
    "chai": "chai",
    "ly": "ly",
    "mua ngay": "Mua ngay",
    "hết hàng": "Hết hàng",
    "thêm vào giỏ hàng": "Thêm vào giỏ hàng",
    
    // Cart page
    "giỏ hàng của bạn": "Giỏ hàng của bạn",
    "tổng tiền": "Tổng tiền",
    "tiến hành thanh toán": "Tiến hành thanh toán",
    "thông tin giao hàng": "Thông tin giao hàng",
    "họ và tên": "Họ và tên",
    "số điện thoại": "Số điện thoại",
    "địa chỉ nhận hàng": "Địa chỉ nhận hàng",
    "chọn phương thức thanh toán": "Chọn phương thức thanh toán",
    "thanh toán khi nhận hàng (cod)": "Thanh toán khi nhận hàng (COD)",
    "chuyển khoản ngân hàng qua vietqr": "Chuyển khoản ngân hàng qua VietQR",
    "hoàn tất thanh toán": "Hoàn tất thanh toán",
    "giỏ hàng trống": "Giỏ hàng của bạn đang trống",
    "quay lại mua sắm": "Quay lại mua sắm",
    "tiếp tục mua hàng": "Tiếp tục mua hàng",
    "đang tải giỏ hàng...": "Đang tải giỏ hàng...",
    "tóm tắt đơn hàng": "Tóm tắt đơn hàng",
    "tạm tính": "Tạm tính",
    "phí vận chuyển": "Phí vận chuyển",
    "miễn phí": "Miễn phí",
    "tổng cộng": "Tổng cộng",
    "thanh toán với vietqr": "THANH TOÁN VỚI VIETQR",
    "thanh toán với vie tqr": "THANH TOÁN VỚI VIETQR",
    "đang xử lý đơn hàng...": "Đang xử lý đơn hàng...",
    "xác thực thanh toán (email otp)": "Xác thực thanh toán (Email OTP)",
    "nhập mã otp 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch": "Nhập mã OTP 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch",
    "nhập mã otp 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch:": "Nhập mã OTP 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch:",
    "xác nhận thanh toán": "Xác nhận thanh toán",
    "thanh toán chuyển khoản vietqr": "Thanh toán chuyển khoản VietQR",
    "vui lòng quét mã qr dưới đây bằng app ngân hàng để thanh toán": "Vui lòng quét mã QR dưới đây bằng app Ngân hàng để thanh toán",
    "vui lòng quét mã qr dưới đây bằng app ngân hàng để thanh toán:": "Vui lòng quét mã QR dưới đây bằng app Ngân hàng để thanh toán:",
    
    // Stores
    "tìm kiếm cửa hàng": "Tìm kiếm cửa hàng",
    "nhập tên đường, quận...": "Nhập tên đường, quận...",
    "đóng cửa": "Đóng cửa",
    "mở cửa 24/7": "Mở cửa 24/7",
    "khoảng cách": "Khoảng cách",
    "đường đi": "Đường đi",
    "chọn làm cửa hàng mặc định": "Chọn làm cửa hàng mặc định",
    "cửa hàng mặc định": "Cửa hàng mặc định",
    "tính khoảng cách từ vị trí của tôi": "Tính khoảng cách từ vị trí của tôi",
    "chỉ đường đi": "Chỉ đường đi",
    
    // Profile
    "quản lý thông tin tài khoản": "Quản lý thông tin tài khoản",
    "email đăng nhập": "Email đăng nhập",
    "ngày sinh": "Ngày sinh",
    "cửa hàng gần nhất": "Cửa hàng gần nhất",
    "lịch sử đơn hàng": "Lịch sử đơn hàng",
    "xác thực hai yếu tố (2fa)": "Xác thực hai yếu tố (2FA)",
    "thiết lập fido2 / passkey": "Thiết lập FIDO2 / Passkey",
    "lưu thay đổi": "Lưu thay đổi",
    "kích hoạt 2fa": "Kích hoạt 2FA",
    "hủy kích hoạt 2fa": "Hủy kích hoạt 2FA",
    "đăng ký passkey mới": "Đăng ký Passkey mới",
    "bạn chưa có đơn hàng nào.": "Bạn chưa có đơn hàng nào.",
    "hồ sơ thành viên ck go": "Hồ sơ thành viên CK GO",
    "nhập họ tên": "Nhập họ tên",
    "nhập số điện thoại": "Nhập số điện thoại",
    "cửa hàng ck go gần nhất": "Cửa hàng CK GO gần nhất",
    "nhấn nút để tìm store...": "Nhấn nút để tìm store...",
    "-- chọn chi nhánh --": "-- Chọn chi nhánh --",
    "địa chỉ nhận hàng chi tiết": "Địa chỉ nhận hàng chi tiết",
    "số nhà, tên đường...": "Số nhà, tên đường...",
    "xác thực sinh trắc học (fido2)": "Xác thực sinh trắc học (FIDO2)",
    "đăng ký thiết bị an toàn (windows hello / touch id) để đăng nhập và thanh toán nhanh không cần mật khẩu.": "Đăng ký thiết bị an toàn (Windows Hello / Touch ID) để đăng nhập và thanh toán nhanh không cần mật khẩu.",
    "đăng ký thiết bị bảo mật": "Đăng ký thiết bị bảo mật",
    "xem lịch sử mua hàng": "Xem lịch sử mua hàng",
    
    // History
    "chi tiết đơn hàng": "Chi tiết đơn hàng",
    "mã đơn hàng": "Mã đơn hàng",
    "trạng thái": "Trạng thái",
    "thời gian": "Thời gian",
    "thành tiền": "Thành tiền",
    
    // Login & Auth
    "tên đăng nhập / email": "Tên đăng nhập / Email",
    "mật khẩu": "Mật khẩu",
    "ít nhất 6 ký tự (chữ & số)": "Ít nhất 6 ký tự (chữ & số)",
    "nhập lại mật khẩu": "Nhập lại mật khẩu",
    "mật khẩu không trùng khớp!": "Mật khẩu không trùng khớp!",
    "có ít nhất 1 chữ cái (a-z)": "Có ít nhất 1 chữ cái (a-z)",
    "có ít nhất 1 chữ số (0-9)": "Có ít nhất 1 chữ số (0-9)",
    "độ dài tối thiểu 6 ký tự": "Độ dài tối thiểu 6 ký tự",
    "ghi nhớ": "Ghi nhớ",
    "quên mật khẩu?": "Quên mật khẩu?",
    "đăng nhập ngay": "Đăng nhập ngay",
    "đăng nhập bằng thiết bị an toàn": "Đăng nhập bằng thiết bị an toàn",
    "quay lại đăng nhập": "Quay lại đăng nhập",
    "khôi phục mật khẩu": "Khôi phục mật khẩu",
    "email đăng ký": "Email đăng ký",
    "nhập email của bạn": "Nhập email của bạn",
    "nhập mã otp đã gửi đến email": "Nhập mã OTP đã gửi đến Email",
    "nhập mã xác thực 2fa từ ứng dụng authenticator": "Nhập mã xác thực 2FA từ ứng dụng Authenticator",
    "mật khẩu mới": "Mật khẩu mới",
    "xác nhận mật khẩu mới": "Xác nhận mật khẩu mới",
    "nhập lại mật khẩu mới": "Nhập lại mật khẩu mới",
    "gửi mã otp": "GỬI MÃ OTP",
    "chào mừng!": "Chào mừng!",
    "khám phá thế giới tiện lợi tại ck go.": "Khám phá thế giới tiện lợi tại CK GO.",
    "bạn chưa có tài khoản?": "Bạn chưa có tài khoản?",
    "đăng ký ngay": "ĐĂNG KÝ NGAY",
    "xác thực 2 lớp (2fa)": "Xác thực 2 lớp (2FA)",
    "quét mã qr bằng ứng dụng google authenticator để kích hoạt 2fa.": "Quét mã QR bằng ứng dụng Google Authenticator để kích hoạt 2FA.",
    "hoặc nhập mã tay": "Hoặc nhập mã tay",
    "nhập mã xác thực 6 chữ số từ ứng dụng trên điện thoại của bạn": "Nhập mã xác thực 6 chữ số từ ứng dụng trên điện thoại của bạn",
    "xác nhận đăng nhập": "Xác nhận đăng nhập",
    "thiết lập lại 2fa (quét mã qr mới)": "Thiết lập lại 2FA (Quét mã QR mới)",

    // Admin
    "quản lý kho ck go": "Quản lý kho CK GO",
    "bảng quản trị kho": "Bảng quản trị kho",
    "thống kê kho": "Thống kê kho",
    "tổng số sản phẩm": "Tổng số sản phẩm",
    "hết hàng / sắp hết": "Hết hàng / sắp hết",
    "lịch sử cập nhật": "Lịch sử cập nhật",
    "thêm sản phẩm mới": "Thêm sản phẩm mới",
    "tên sản phẩm": "Tên sản phẩm",
    "số lượng": "Số lượng",
    "đơn vị": "Đơn vị",
    "hành động": "Hành động",
    "nhập kho": "Nhập kho",
    "xuất kho": "Xuất kho",
    "người thực hiện": "Người thực hiện",
    "tải ảnh": "Tải ảnh",
    "lưu sản phẩm": "Lưu sản phẩm",
    "về trang chủ": "Về trang chủ",
    "hủy": "Hủy",
    "lịch sử nhập xuất": "Lịch sử nhập xuất",
    "thoát": "Thoát",
    "quản lý tồn kho - bình thạnh": "Quản lý Tồn kho - Bình Thạnh",
    "xin chào": "Xin chào",
    "chọn chi nhánh quản lý": "Chọn chi nhánh quản lý",
    "hình ảnh": "Hình ảnh",
    "loại": "Loại",
    "tồn kho": "Tồn kho",
    "giá bán": "Giá bán",
    "mã sản phẩm (tự động)": "Mã sản phẩm (Tự động)",
    "chọn loại sản phẩm": "Chọn loại sản phẩm",
    "giá bán (vnđ)": "Giá bán (VNĐ)",
    "số lượng tồn": "Số lượng tồn",
    "số lượng hiện có": "Số lượng hiện có",
    "hình ảnh sản phẩm (từ máy)": "Hình ảnh sản phẩm (Từ máy)",
    "lưu vào kho": "LƯU VÀO KHO",
    "quay lại web": "Quay lại Web",
    "lịch sử nhập/xuất kho realtime": "Lịch sử Nhập/Xuất Kho Realtime",
    "dữ liệu được cập nhật tự động khi có biến động kho": "Dữ liệu được cập nhật tự động khi có biến động kho",

    // Dynamic Products & Messages
    "đang quét sản phẩm tại chi nhánh...": "Đang quét sản phẩm tại chi nhánh...",
    "chi nhánh này hiện chưa có sản phẩm thuộc mục này.": "Chi nhánh này hiện chưa có sản phẩm thuộc mục này.",
    "lỗi tải dữ liệu. vui lòng kiểm tra kết nối với máy chủ api.": "Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối với máy chủ API.",
    "thêm vào giỏ": "Thêm vào giỏ",
    "bạn ơi, bạn cần đăng nhập để mua hàng nhé!": "Bạn ơi, bạn cần đăng nhập để mua hàng nhé!",
    "không tìm thấy sản phẩm nào khớp với": "Không tìm thấy sản phẩm nào khớp với"
  },
  en: {
    // Header & Common
    "hệ thống ck go": "CK GO Stores",
    "thức ăn & thức uống": "Food & Drinks",
    "thức ăn": "Food",
    "thức uống": "Drinks",
    "tất cả menu": "Full Menu",
    "đăng nhập": "Log In",
    "đăng xuất": "Log Out",
    "thông tin cá nhân": "My Profile",
    "quản lý kho": "Admin",
    "cửa hàng": "Store",
    "đang xác định...": "Locating...",
    "giỏ hàng": "Cart",
    "tìm sản phẩm...": "Search products...",
    "tài khoản": "Account",
    
    // Home
    "dịch vụ tiện ích": "Convenience Services",
    "ck go tự hào cung cấp các dịch vụ tiện ích đa dạng và chất lượng nhất": "CK GO is proud to provide the most diverse and high-quality services",
    "sản phẩm nổi bật": "Featured Products",
    "đăng ký nhận tin khuyến mãi": "Subscribe to Newsletter",
    "nhập email của bạn...": "Enter your email...",
    "đăng ký": "Subscribe",
    "phòng chăm sóc khách hàng": "Customer Care",
    "địa chỉ": "Address",
    "ngày cấp": "Issue Date",
    "nơi cấp": "Issued By",
    "ưu đãi đặc biệt": "Special Offers",
    "flash sale chớp nhoáng": "FLASH SALE",
    "kết thúc trong": "Ends in",
    "đang tải sản phẩm khuyến mãi từ hệ thống...": "Loading promo products from system...",
    "gửi": "Send",
    "hệ thống cửa hàng": "STORE LOCATOR",
    "sản phẩm & dịch vụ": "PRODUCTS & SERVICES",
    "giới thiệu": "About Us",
    "cơ hội nghề nghiệp": "Careers",
    "tin tức & sự kiện": "News & Events",
    "liên hệ": "Contact Us",
    "điều khoản sử dụng": "Terms of Use",
    "chính sách": "Privacy Policy",
    "hóa đơn đỏ": "E-Invoice",
    "ck convenience store vietnam - chuỗi cửa hàng tiện lợi - mở cửa 24/7": "CK Convenience Store Vietnam - Convenience Store Chain - Open 24/7",
    "công ty tnhh bán lẻ ck việt nam - giấy cnđkdn: 0306182043": "CK VIETNAM RETAIL CO., LTD - Business Registration No: 0306182043",
    "ngày cấp: 10/11/2008. nơi cấp: sở kế hoạch - đầu tư tp. hồ chí minh": "Issued on: 10/11/2008. Issued by: HCMC Department of Planning and Investment",
    "địa chỉ: 160 bùi thị xuân, phường bến thành, quận 1, thành phố hồ chí minh, việt nam.": "Address: 160 Bui Thi Xuan, Ben Thanh Ward, District 1, Ho Chi Minh City, Vietnam.",
    "phòng chăm sóc khách hàng: 1900.3110": "Customer Support: 1900.3110",
    "email: info@ckstores.com.vn": "Email: info@ckstores.com.vn",
    
    // Menu & Filter
    "bộ lọc sản phẩm": "Product Filters",
    "chọn chi nhánh": "Select Branch",
    "tất cả chi nhánh": "All Branches",
    "chi nhánh": "Branch",
    "mức giá": "Price Range",
    "tất cả mức giá": "All Prices",
    "dưới 15.000đ": "Under 15,000 VND",
    "15.000đ - 30.000đ": "15,000 - 30,000 VND",
    "trên 30.000đ": "Over 30,000 VND",
    "sắp xếp": "Sort By",
    "mặc định": "Default",
    "giá tăng dần": "Price: Low to High",
    "giá giảm dần": "Price: High to Low",
    "còn lại": "In Stock",
    "phần": "portion",
    "cái": "pcs",
    "lon": "can",
    "chai": "bottle",
    "ly": "cup",
    "mua ngay": "Buy Now",
    "hết hàng": "Out of Stock",
    "thêm vào giỏ hàng": "Add to Cart",
    
    // Cart page
    "giỏ hàng của bạn": "Your Shopping Cart",
    "tổng tiền": "Total Amount",
    "tiến hành thanh toán": "Proceed to Checkout",
    "thông tin giao hàng": "Shipping Information",
    "họ và tên": "Full Name",
    "số điện thoại": "Phone Number",
    "địa chỉ nhận hàng": "Shipping Address",
    "chọn phương thức thanh toán": "Select Payment Method",
    "thanh toán khi nhận hàng (cod)": "Cash on Delivery (COD)",
    "chuyển khoản ngân hàng qua vietqr": "Bank Transfer (VietQR)",
    "hoàn tất thanh toán": "Place Order",
    "giỏ hàng trống": "Your cart is empty",
    "quay lại mua sắm": "Continue Shopping",
    "tiếp tục mua hàng": "Continue Shopping",
    "đang tải giỏ hàng...": "Loading cart...",
    "tóm tắt đơn hàng": "Order Summary",
    "tạm tính": "Subtotal",
    "phí vận chuyển": "Shipping Fee",
    "miễn phí": "Free",
    "tổng cộng": "Total",
    "thanh toán với vietqr": "PAY WITH VIETQR",
    "thanh toán với vie tqr": "PAY WITH VIETQR",
    "đang xử lý đơn hàng...": "Processing order...",
    "xác thực thanh toán (email otp)": "Payment Verification (Email OTP)",
    "nhập mã otp 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch": "Enter the 6-digit OTP sent to your email to confirm the transaction",
    "nhập mã otp 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch:": "Enter the 6-digit OTP sent to your email to confirm the transaction:",
    "xác nhận thanh toán": "Confirm Payment",
    "thanh toán chuyển khoản vietqr": "VietQR Bank Transfer Payment",
    "vui lòng quét mã qr dưới đây bằng app ngân hàng để thanh toán": "Please scan the QR code below with your banking app to pay",
    "vui lòng quét mã qr dưới đây bằng app ngân hàng để thanh toán:": "Please scan the QR code below with your banking app to pay:",
    
    // Stores
    "tìm kiếm cửa hàng": "Find Stores",
    "nhập tên đường, quận...": "Enter street or district...",
    "đóng cửa": "Closed",
    "mở cửa 24/7": "Open 24/7",
    "khoảng cách": "Distance",
    "đường đi": "Directions",
    "chọn làm cửa hàng mặc định": "Set as Default",
    "cửa hàng mặc định": "Default Store",
    "tính khoảng cách từ vị trí của tôi": "Calculate distance from my location",
    "chỉ đường đi": "Get Directions",
    
    // Profile
    "quản lý thông tin tài khoản": "Manage Profile",
    "email đăng nhập": "Login Email",
    "ngày sinh": "Date of Birth",
    "cửa hàng gần nhất": "Nearest Store",
    "lịch sử đơn hàng": "Order History",
    "xác thực hai yếu tố (2fa)": "Two-Factor Auth (2FA)",
    "thiết lập fido2 / passkey": "FIDO2 / Passkey Setup",
    "lưu thay đổi": "Save Changes",
    "kích hoạt 2fa": "Enable 2FA",
    "hủy kích hoạt 2fa": "Disable 2FA",
    "đăng ký passkey mới": "Register Passkey",
    "bạn chưa có đơn hàng nào.": "You have no order history.",
    "hồ sơ thành viên ck go": "CK GO Member Profile",
    "nhập họ tên": "Enter full name",
    "nhập số điện thoại": "Enter phone number",
    "cửa hàng ck go gần nhất": "Nearest CK GO Store",
    "nhấn nút để tìm store...": "Click button to find stores...",
    "-- chọn chi nhánh --": "-- Select branch --",
    "địa chỉ nhận hàng chi tiết": "Detailed shipping address",
    "số nhà, tên đường...": "House number, street name...",
    "xác thực sinh trắc học (fido2)": "Biometric Verification (FIDO2)",
    "đăng ký thiết bị an toàn (windows hello / touch id) để đăng nhập và thanh toán nhanh không cần mật khẩu.": "Register secure device (Windows Hello / Touch ID) for passwordless login and checkout.",
    "đăng ký thiết bị bảo mật": "Register Security Device",
    "xem lịch sử mua hàng": "View Order History",
    
    // History
    "chi tiết đơn hàng": "Order Details",
    "mã đơn hàng": "Order ID",
    "trạng thái": "Status",
    "thời gian": "Date",
    "thành tiền": "Total Amount",
    
    // Login & Auth
    "tên đăng nhập / email": "Username / Email",
    "mật khẩu": "Password",
    "ít nhất 6 ký tự (chữ & số)": "At least 6 characters (letters & numbers)",
    "nhập lại mật khẩu": "Confirm Password",
    "mật khẩu không trùng khớp!": "Passwords do not match!",
    "có ít nhất 1 chữ cái (a-z)": "At least 1 letter (a-z)",
    "có ít nhất 1 chữ số (0-9)": "At least 1 number (0-9)",
    "độ dài tối thiểu 6 ký tự": "Minimum length 6 characters",
    "ghi nhớ": "Remember Me",
    "quên mật khẩu?": "Forgot Password?",
    "đăng nhập ngay": "Log In Now",
    "đăng nhập bằng thiết bị an toàn": "Log In with Secure Device",
    "quay lại đăng nhập": "Back to Login",
    "khôi phục mật khẩu": "Reset Password",
    "email đăng ký": "Registered Email",
    "nhập email của bạn": "Enter your email",
    "nhập mã otp đã gửi đến email": "Enter the OTP sent to your Email",
    "nhập mã xác thực 2fa từ ứng dụng authenticator": "Enter the 2FA code from Authenticator app",
    "mật khẩu mới": "New Password",
    "xác nhận mật khẩu mới": "Confirm New Password",
    "nhập lại mật khẩu mới": "Confirm your new password",
    "gửi mã otp": "SEND OTP CODE",
    "chào mừng!": "Welcome!",
    "khám phá thế giới tiện lợi tại ck go.": "Discover the convenience at CK GO.",
    "bạn chưa có tài khoản?": "Don't have an account?",
    "đăng ký ngay": "REGISTER NOW",
    "xác thực 2 lớp (2fa)": "Two-Factor Authentication (2FA)",
    "quét mã qr bằng ứng dụng google authenticator để kích hoạt 2fa.": "Scan the QR code with Google Authenticator app to enable 2FA.",
    "hoặc nhập mã tay": "Or enter code manually",
    "nhập mã xác thực 6 chữ số từ ứng dụng trên điện thoại của bạn": "Enter the 6-digit verification code from your mobile app",
    "xác nhận đăng nhập": "Confirm Login",
    "thiết lập lại 2fa (quét mã qr mới)": "Reset 2FA (Scan new QR code)",

    // Admin
    "quản lý kho ck go": "CK GO Inventory Admin",
    "bảng quản trị kho": "Inventory Panel",
    "thống kê kho": "Stock Summary",
    "tổng số sản phẩm": "Total Products",
    "hết hàng / sắp hết": "Out / Low of Stock",
    "lịch sử cập nhật": "Stock Logs",
    "thêm sản phẩm mới": "Add Product",
    "tên sản phẩm": "Product Name",
    "số lượng": "Quantity",
    "đơn vị": "Unit",
    "hành động": "Action",
    "nhập kho": "Restock",
    "xuất kho": "Dispatch",
    "người thực hiện": "Staff",
    "tải ảnh": "Upload Image",
    "lưu sản phẩm": "Save",
    "về trang chủ": "Go to Homepage",
    "hủy": "Cancel",
    "lịch sử nhập xuất": "Inventory Log",
    "thoát": "Exit",
    "quản lý tồn kho - bình thạnh": "Inventory Management - Binh Thanh",
    "xin chào": "Hello",
    "chọn chi nhánh quản lý": "Select Managed Branch",
    "hình ảnh": "Image",
    "loại": "Type",
    "tồn kho": "Stock",
    "giá bán": "Price",
    "mã sản phẩm (tự động)": "Product ID (Auto)",
    "chọn loại sản phẩm": "Select Product Type",
    "giá bán (vnđ)": "Price (VND)",
    "số lượng tồn": "Stock Quantity",
    "số lượng hiện có": "Available Quantity",
    "hình ảnh sản phẩm (từ máy)": "Product Image (From Device)",
    "lưu vào kho": "SAVE TO INVENTORY",
    "quay lại web": "Back to Website",
    "lịch sử nhập/xuất kho realtime": "Realtime Inventory Logs",
    "dữ liệu được cập nhật tự động khi có biến động kho": "Data is automatically updated when inventory changes",

    // Dynamic Products & Messages
    "đang quét sản phẩm tại chi nhánh...": "Scanning products at branch...",
    "chi nhánh này hiện chưa có sản phẩm thuộc mục này.": "No products available in this category at this branch.",
    "lỗi tải dữ liệu. vui lòng kiểm tra kết nối với máy chủ api.": "Error loading data. Please check your connection to the API server.",
    "thêm vào giỏ": "Add to Cart",
    "bạn ơi, bạn cần đăng nhập để mua hàng nhé!": "Please log in to make purchases!",
    "không tìm thấy sản phẩm nào khớp với": "No products found matching"
  },
  ko: {
    // Header & Common
    "hệ thống ck go": "CK GO 매장 안내",
    "thức ăn & thức uống": "음식 & 음료",
    "thức ăn": "음식",
    "thức uống": "음료",
    "tất cả menu": "전체 메뉴",
    "đăng nhập": "로그인",
    "đăng xuất": "로그아웃",
    "thông tin cá nhân": "내 프로필",
    "quản lý kho": "재고 관리",
    "cửa hàng": "매장",
    "đang xác định...": "위치 확인 중...",
    "giỏ hàng": "장바구니",
    "tìm sản phẩm...": "상품 검색...",
    "tài khoản": "계정",
    
    // Home
    "dịch vụ tiện ích": "편의 서비스",
    "ck go tự hào cung cấp các dịch vụ tiện ích đa dạng và chất lượng nhất": "CK GO는 우수한 편의 서비스를 제공하기 위해 최선을 다하고 있습니다",
    "sản phẩm nổi bật": "추천 상품",
    "đăng ký nhận tin khuyến mãi": "뉴스레터 구독",
    "nhập email của bạn...": "이메일을 입력하세요...",
    "đăng ký": "구독하기",
    "phòng chăm sóc khách hàng": "고객지원팀",
    "địa chỉ": "주소",
    "ngày cấp": "등록일",
    "nơi cấp": "등록기관",
    "ưu đãi đặc biệt": "스페셜 혜택",
    "flash sale chớp nhoáng": "번개 플래시 세일",
    "kết thúc trong": "남은 시간",
    "đang tải sản phẩm khuyến mãi từ hệ thống...": "프로모션 상품을 불러오는 중...",
    "gửi": "전송",
    "hệ thống cửa hàng": "매장 찾기",
    "sản phẩm & dịch vụ": "상품 및 서비스",
    "giới thiệu": "회사 소개",
    "cơ hội nghề nghiệp": "채용 정보",
    "tin tức & sự kiện": "뉴스 및 이벤트",
    "liên hệ": "문의하기",
    "điều khoản sử dụng": "이용 약관",
    "chính sách": "개인정보 처리방침",
    "hóa đơn đỏ": "전자 세금계산서",
    "ck convenience store vietnam - chuỗi cửa hàng tiện lợi - mở cửa 24/7": "CK 베트남 편의점 - 24/7 영업 편의점 체인",
    "công ty tnhh bán lẻ ck việt nam - giấy cnđkdn: 0306182043": "CK 베트남 소매 유한회사 - 사업자 등록 번호: 0306182043",
    "ngày cấp: 10/11/2008. nơi cấp: sở kế hoạch - đầu tư tp. hồ chí minh": "발급일: 2008년 11월 10일. 발급기관: 호치민 기획투자국",
    "địa chỉ: 160 bùi thị xuân, phường bến thành, quận 1, thành phố hồ chí minh, việt nam.": "주소: 베트남 호치민시 1군 벤탄동 부이티쑤언 160",
    "phòng chăm sóc khách hàng: 1900.3110": "고객 센터: 1900.3110",
    "email: info@ckstores.com.vn": "이메일: info@ckstores.com.vn",
    
    // Menu & Filter
    "bộ lọc sản phẩm": "상품 필터",
    "chọn chi nhánh": "지점 선택",
    "tất cả chi nhánh": "전체 지점",
    "chi nhánh": "지점",
    "mức giá": "가격 범위",
    "tất cả mức giá": "전체 가격",
    "dưới 15.000đ": "15,000 VND 이하",
    "15.000đ - 30.000đ": "15,000 - 30,000 VND",
    "trên 30.000đ": "30,000 VND 이상",
    "sắp xếp": "정렬 기준",
    "mặc định": "기본",
    "giá tăng dần": "가격 낮은 순",
    "giá giảm dần": "가격 높은 순",
    "còn lại": "재고 수량",
    "phần": "인분",
    "cái": "개",
    "lon": "캔",
    "chai": "병",
    "ly": "컵",
    "mua ngay": "바로 구매",
    "hết hàng": "품절",
    "thêm vào giỏ hàng": "장바구니 담기",
    
    // Cart page
    "giỏ hàng của bạn": "내 장바구니",
    "tổng tiền": "결제 금액",
    "tiến hành thanh toán": "결제하기",
    "thông tin giao hàng": "배송 정보",
    "họ và tên": "성함",
    "số điện thoại": "연락처",
    "địa chỉ nhận hàng": "배송 주소",
    "chọn phương thức thanh toán": "결제수단 선택",
    "thanh toán khi nhận hàng (cod)": "만나서 결제 (COD)",
    "chuyển khoản ngân hàng qua vietqr": "VietQR 계좌 이체",
    "hoàn tất thanh toán": "주문 완료하기",
    "giỏ hàng trống": "장바구니가 비어 있습니다",
    "quay lại mua sắm": "쇼핑 계속하기",
    "tiếp tục mua hàng": "쇼핑 계속하기",
    "đang tải giỏ hàng...": "장바구니를 불러오는 중...",
    "tóm tắt đơn hàng": "주문 요약",
    "tạm tính": "소계",
    "phí vận chuyển": "배송비",
    "miễn phí": "무료",
    "tổng cộng": "합계",
    "thanh toán với vietqr": "VIETQR로 결제",
    "thanh toán với vie tqr": "VIETQR로 결제",
    "đang xử lý đơn hàng...": "주문 처리 중...",
    "xác thực thanh toán (email otp)": "결제 인증 (이메일 OTP)",
    "nhập mã otp 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch": "거래를 승인하기 위해 이메일로 전송된 6자리 OTP를 입력하세요",
    "nhập mã otp 6 chữ số đã được gửi đến email của bạn để xác nhận giao dịch:": "거래를 승인하기 위해 이메일로 전송된 6자리 OTP를 입력하세요:",
    "xác nhận thanh toán": "결제 확인",
    "thanh toán chuyển khoản vietqr": "VietQR 계좌 이체 결제",
    "vui lòng quét mã qr dưới đây bằng app ngân hàng để thanh toán": "은행 앱으로 아래 QR 코드를 스캔하여 결제해 주세요",
    "vui lòng quét mã qr dưới đây bằng app ngân hàng để thanh toán:": "은행 앱으로 아래 QR 코드를 스캔하여 결제해 주세요:",
    
    // Stores
    "tìm kiếm cửa hàng": "매장 찾기",
    "nhập tên đường, quận...": "도로명, 지역명 입력...",
    "đóng cửa": "영업 종료",
    "mở cửa 24/7": "24시간 영업",
    "khoảng cách": "거리",
    "đường đi": "길찾기",
    "chọn làm cửa hàng mặc định": "기본 매장으로 설정",
    "cửa hàng mặc định": "기본 매장",
    "tính khoảng cách từ vị trí của tôi": "내 위치에서 거리 계산",
    "chỉ đường đi": "길찾기",
    
    // Profile
    "quản lý thông tin tài khoản": "회원 정보 관리",
    "email đăng nhập": "이메일 계정",
    "ngày sinh": "생년월일",
    "cửa hàng gần nhất": "가장 가까운 매장",
    "lịch sử đơn hàng": "주문 내역",
    "xác thực hai yếu tố (2fa)": "2단계 인증 (2FA)",
    "thiết lập fido2 / passkey": "FIDO2 / 패스키 설정",
    "lưu thay đổi": "설정 저장",
    "kích hoạt 2fa": "2FA 활성화",
    "hủy kích hoạt 2fa": "2FA 비활성화",
    "đăng ký passkey mới": "새 패스키 등록",
    "bạn chưa có đơn hàng nào.": "주문 내역이 없습니다.",
    "hồ sơ thành viên ck go": "CK GO 회원 프로필",
    "nhập họ tên": "성함을 입력하세요",
    "nhập số điện thoại": "전화번호를 입력하세요",
    "cửa hàng ck go gần nhất": "가장 가까운 CK GO 매장",
    "nhấn nút để tìm store...": "버튼을 클릭하여 매장을 찾으세요...",
    "-- chọn chi nhánh --": "-- 지점 선택 --",
    "địa chỉ nhận hàng chi tiết": "상세 배송 주소",
    "số nhà, tên đường...": "건물 번호, 도로명...",
    "xác thực sinh trắc học (fido2)": "생체 인증 (FIDO2)",
    "đăng ký thiết bị an toàn (windows hello / touch id) để đăng nhập và thanh toán nhanh không cần mật khẩu.": "비밀번호 없이 로그인 및 빠른 결제를 위해 보안 기기(Windows Hello / Touch ID)를 등록하세요.",
    "đăng ký thiết bị bảo mật": "보안 기기 등록",
    "xem lịch sử mua hàng": "주문 내역 보기",
    
    // History
    "chi tiết đơn hàng": "주문 상세 내역",
    "mã đơn hàng": "주문 번호",
    "trạng thái": "상태",
    "thời gian": "날짜",
    "thành tiền": "결제 금액",
    
    // Login & Auth
    "tên đăng nhập / email": "사용자 이름 / 이메일",
    "mật khẩu": "비밀번호",
    "ít nhất 6 ký tự (chữ & số)": "최소 6자 (문자 및 숫자)",
    "nhập lại mật khẩu": "비밀번호 확인",
    "mật khẩu không trùng khớp!": "비밀번호가 일치하지 않습니다!",
    "có ít nhất 1 chữ cái (a-z)": "최소 1개 문자 포함 (a-z)",
    "có ít nhất 1 chữ số (0-9)": "최소 1개 숫자 포함 (0-9)",
    "độ dài tối thiểu 6 ký tự": "최소 6자 이상",
    "ghi nhớ": "자동 로그인",
    "quên mật khẩu?": "비밀번호를 잊으셨나요?",
    "đăng nhập ngay": "지금 로그인",
    "đăng nhập bằng thiết bị an toàn": "보안 기기로 로그인",
    "quay lại đăng nhập": "로그인으로 돌아가기",
    "khôi phục mật khẩu": "비밀번호 재설정",
    "email đăng ký": "등록된 이메일",
    "nhập email của bạn": "이메일을 입력하세요",
    "nhập mã otp đã gửi đến email": "이메일로 전송된 OTP를 입력하세요",
    "nhập mã xác thực 2fa từ ứng dụng authenticator": "인증기 앱의 2FA 코드를 입력하세요",
    "mật khẩu mới": "새 비밀번호",
    "xác nhận mật khẩu mới": "새 비밀번호 확인",
    "nhập lại mật khẩu mới": "새 비밀번호를 다시 입력하세요",
    "gửi mã otp": "OTP 코드 전송",
    "chào mừng!": "환영합니다!",
    "khám phá thế giới tiện lợi tại ck go.": "CK GO에서 편리한 세상을 경험해보세요.",
    "bạn chưa có tài khoản?": "계정이 없으신가요?",
    "đăng ký ngay": "지금 가입하기",
    "xác thực 2 lớp (2fa)": "2단계 인증 (2FA)",
    "quét mã qr bằng ứng dụng google authenticator để kích hoạt 2fa.": "2FA를 활성화하려면 Google Authenticator 앱으로 QR 코드를 스캔하세요.",
    "hoặc nhập mã tay": "또는 수동으로 코드 입력",
    "nhập mã xác thực 6 chữ số từ ứng dụng trên điện thoại của bạn": "모바일 앱의 6자리 인증 코드를 입력하세요",
    "xác nhận đăng nhập": "로그인 확인",
    "thiết lập lại 2fa (quét mã qr mới)": "2FA 재설정 (새 QR 코드 스캔)",

    // Admin
    "quản lý kho ck go": "CK GO 재고 관리",
    "bảng quản trị kho": "재고 관리 대시보드",
    "thống kê kho": "재고 현황 요약",
    "tổng số sản phẩm": "총 상품 수",
    "hết hàng / sắp hết": "품절 / 재고 부족",
    "lịch sử cập nhật": "재고 변동 로그",
    "thêm sản phẩm mới": "새 상품 등록",
    "tên sản phẩm": "商品名",
    "số lượng": "수량",
    "đơn vị": "단위",
    "hành động": "작업",
    "nhập kho": "입고",
    "xuất kho": "출고",
    "người thực hiện": "담당자",
    "tải ảnh": "이미지 업로드",
    "lưu sản phẩm": "저장하기",
    "về trang chủ": "홈페이지로 이동",
    "hủy": "취소",
    "lịch sử nhập xuất": "입출고 내역",
    "thoát": "나가기",
    "quản lý tồn kho - bình thạnh": "재고 관리 - 빈탄점",
    "xin chào": "안녕하세요",
    "chọn chi nhánh quản lý": "관리할 지점 선택",
    "hình ảnh": "이미지",
    "loại": "분류",
    "tồn kho": "재고",
    "giá bán": "판매가",
    "mã sản phẩm (tự động)": "상품 ID (자동)",
    "chọn loại sản phẩm": "상품 분류 선택",
    "giá bán (vnđ)": "판매가 (VND)",
    "số lượng tồn": "재고 수량",
    "số lượng hiện có": "현재 수량",
    "hình ảnh sản phẩm (từ máy)": "상품 이미지 (기기에서 선택)",
    "lưu vào kho": "재고에 저장",
    "quay lại web": "웹사이트로 돌아가기",
    "lịch sử nhập/xuất kho realtime": "실시간 입출고 내역",
    "dữ liệu được cập nhật tự động khi có biến động kho": "재고 변동 시 데이터가 자동으로 업데이트됩니다",

    // Dynamic Products & Messages
    "đang quét sản phẩm tại chi nhánh...": "지점 상품 검색 중...",
    "chi nhánh này hiện chưa có sản phẩm thuộc mục này.": "이 지점의 해당 분류에 상품이 없습니다.",
    "lỗi tải dữ liệu. vui lòng kiểm tra kết nối với máy chủ api.": "데이터 로드 오류. API 서버와의 연결을 확인하세요.",
    "thêm vào giỏ": "장바구니 담기",
    "bạn ơi, bạn cần đăng nhập để mua hàng nhé!": "구매하려면 로그인해 주세요!",
    "không tìm thấy sản phẩm nào khớp với": "일치하는 상품을 찾을 수 없습니다"
  }
};

let currentLang = "vi";
let currentTheme = "light";

// --- DỊCH TRANG DYNAMIC ---
function translatePage(lang) {
  // Tạm dừng observer để tránh vòng lặp vô hạn
  observer.disconnect();

  const elements = document.querySelectorAll("span, a, h1, h2, h3, h4, p, label, button, input, th, td");
  elements.forEach((el) => {
    if (el.id === "display-store-name" || el.hasAttribute("data-no-translate")) return;
    // 1. Dịch placeholder của input
    if (el.tagName === "INPUT" && el.placeholder) {
      let orig = el.getAttribute("data-orig-placeholder");
      if (!orig) {
        orig = el.placeholder;
        el.setAttribute("data-orig-placeholder", orig);
      }
      const key = orig.trim().toLowerCase();
      if (translations[lang] && translations[lang][key]) {
        el.placeholder = translations[lang][key];
      } else {
        el.placeholder = orig;
      }
    }
    
    // 2. Dịch văn bản trực tiếp
    if (el.children.length === 0 || (el.children.length === 1 && el.querySelector("i"))) {
      let textNode = null;
      let icon = el.querySelector("i");
      
      // Tìm node text chính xác
      for (let node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          textNode = node;
          break;
        }
      }
      
      if (textNode) {
        let orig = el.getAttribute("data-orig-text");
        if (!orig) {
          orig = textNode.textContent.trim();
          el.setAttribute("data-orig-text", orig);
        }
        
        const key = orig.trim().replace(/\s+/g, ' ').toLowerCase();
        let lookupKey = key;
        let suffix = "";
        if (key.endsWith(":")) {
          lookupKey = key.slice(0, -1).trim();
          suffix = ":";
        }
        
        if (translations[lang] && translations[lang][lookupKey]) {
          textNode.textContent = translations[lang][lookupKey] + suffix;
        } else {
          textNode.textContent = orig;
        }
      }
    }
  });

  // Re-observe
  observer.observe(document.body, { childList: true, subtree: true });
}

// --- MUTATION OBSERVER CHO CÁC SẢN PHẨM LOAD CHẬM ---
const observer = new MutationObserver((mutations) => {
  let shouldTranslate = false;
  for (let mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldTranslate = true;
      break;
    }
  }
  if (shouldTranslate) {
    translatePage(currentLang);
  }
});

// --- LẤY/GHI THÔNG TIN DATABASE ---
async function fetchSetting(key, defaultValue) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/settings/${key}`);
    if (res.ok) {
      const data = await res.json();
      if (data.exists && data.value) {
        return JSON.parse(data.value);
      }
    }
  } catch (e) {
    console.error("Lỗi tải cài đặt từ Database:", e);
  }
  return defaultValue;
}

async function saveSetting(key, value) {
  try {
    await fetch(`${API_BASE_URL}/api/settings/${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: JSON.stringify(value) })
    });
  } catch (e) {
    console.error("Lỗi lưu cấu hình vào Database:", e);
  }
}

// --- KHỞI TẠO CẤU HÌNH ---
async function initThemeAndLang() {
  const prefsId = getPrefsId();
  
  // Tải đồng thời từ cơ sở dữ liệu
  const [dbTheme, dbLang] = await Promise.all([
    fetchSetting(`theme_${prefsId}`, "light"),
    fetchSetting(`lang_${prefsId}`, "vi")
  ]);

  currentTheme = dbTheme;
  currentLang = dbLang;

  // Áp dụng Theme
  if (currentTheme === "dark") {
    document.documentElement.classList.add("dark-theme");
    document.body.classList.add("dark-theme");
  } else {
    document.documentElement.classList.remove("dark-theme");
    document.body.classList.remove("dark-theme");
  }

  // Áp dụng Language
  translatePage(currentLang);

  // Chèn bộ điều khiển vào Header
  injectControls();
}

// --- CHÈN BỘ ĐIỀU KHIỂN DƯỚI DẠNG CHÈN ĐỘNG ---
function injectControls() {
  // Tìm thanh điều hướng
  let parent = document.querySelector(".main-nav");
  let isAdmin = false;
  let isFixed = false;

  if (!parent) {
    // Nếu là trang admin
    parent = document.querySelector(".top-bar > div");
    isAdmin = true;
  }

  if (!parent) {
    // Tạo một vùng cố định ở góc trên bên phải đối với các trang không có navigation bar
    const fixedContainer = document.createElement("div");
    fixedContainer.style.position = "fixed";
    fixedContainer.style.top = "20px";
    fixedContainer.style.right = "25px";
    fixedContainer.style.zIndex = "100000";
    fixedContainer.style.background = currentTheme === 'dark' ? '#1e293b' : '#ffffff';
    fixedContainer.style.padding = "6px 12px";
    fixedContainer.style.borderRadius = "30px";
    fixedContainer.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
    fixedContainer.style.border = "1px solid #00b4d8";
    fixedContainer.className = "theme-lang-fixed-container";
    document.body.appendChild(fixedContainer);
    parent = fixedContainer;
    isFixed = true;
  }

  // Kiểm tra xem đã chèn chưa
  if (document.getElementById("theme-toggle-btn")) return;

  const container = document.createElement("div");
  container.className = "theme-lang-container";
  container.innerHTML = `
    <button id="theme-toggle-btn" class="header-control-btn" title="Toggle Theme">
      <i class="fas ${currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
    </button>
    <div class="lang-selector">
      <button id="lang-btn" class="header-control-btn lang-btn" title="Change Language">
        <i class="fas fa-globe"></i>
        <span id="lang-current-label">${currentLang.toUpperCase()}</span>
      </button>
      <div class="lang-dropdown" id="lang-dropdown">
        <a href="#" data-lang="vi">Tiếng Việt</a>
        <a href="#" data-lang="en">English</a>
        <a href="#" data-lang="ko">한국어</a>
      </div>
    </div>
  `;

  if (isFixed) {
    // Đưa các nút trực tiếp vào fixed container
    parent.appendChild(container);
  } else if (isAdmin) {
    // Chèn vào đầu nhóm điều khiển của admin bar
    parent.insertBefore(container, parent.firstChild);
  } else {
    // Chèn vào cuối main-nav
    parent.appendChild(container);
  }

  // Gắn sự kiện nút Theme
  const themeBtn = document.getElementById("theme-toggle-btn");
  themeBtn.addEventListener("click", async () => {
    const prefsId = getPrefsId();
    if (currentTheme === "light") {
      currentTheme = "dark";
      document.documentElement.classList.add("dark-theme");
      document.body.classList.add("dark-theme");
      themeBtn.querySelector("i").className = "fas fa-sun";
      if (isFixed) {
        parent.style.background = "#1e293b";
      }
    } else {
      currentTheme = "light";
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.remove("dark-theme");
      themeBtn.querySelector("i").className = "fas fa-moon";
      if (isFixed) {
        parent.style.background = "#ffffff";
      }
    }
    await saveSetting(`theme_${prefsId}`, currentTheme);
  });

  // Gắn sự kiện ngôn ngữ
  const langBtn = document.getElementById("lang-btn");
  const langDropdown = document.getElementById("lang-dropdown");

  langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    langDropdown.classList.remove("show");
  });

  langDropdown.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const selected = link.getAttribute("data-lang");
      currentLang = selected;
      document.getElementById("lang-current-label").innerText = selected.toUpperCase();
      translatePage(selected);
      
      const prefsId = getPrefsId();
      await saveSetting(`lang_${prefsId}`, selected);
    });
  });
}

// Khởi chạy
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeAndLang);
} else {
  initThemeAndLang();
}
