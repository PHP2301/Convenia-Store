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
    
    // Stores
    "tìm kiếm cửa hàng": "Tìm kiếm cửa hàng",
    "nhập tên đường, quận...": "Nhập tên đường, quận...",
    "đóng cửa": "Đóng cửa",
    "mở cửa 24/7": "Mở cửa 24/7",
    "khoảng cách": "Khoảng cách",
    "đường đi": "Đường đi",
    "chọn làm cửa hàng mặc định": "Chọn làm cửa hàng mặc định",
    "cửa hàng mặc định": "Cửa hàng mặc định",
    
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
    
    // History
    "chi tiết đơn hàng": "Chi tiết đơn hàng",
    "mã đơn hàng": "Mã đơn hàng",
    "trạng thái": "Trạng thái",
    "thời gian": "Thời gian",
    "thành tiền": "Thành tiền",
    
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
    "hủy": "Hủy"
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
    
    // Stores
    "tìm kiếm cửa hàng": "Find Stores",
    "nhập tên đường, quận...": "Enter street or district...",
    "đóng cửa": "Closed",
    "mở cửa 24/7": "Open 24/7",
    "khoảng cách": "Distance",
    "đường đi": "Directions",
    "chọn làm cửa hàng mặc định": "Set as Default",
    "cửa hàng mặc định": "Default Store",
    
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
    
    // History
    "chi tiết đơn hàng": "Order Details",
    "mã đơn hàng": "Order ID",
    "trạng thái": "Status",
    "thời gian": "Date",
    "thành tiền": "Total Amount",
    
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
    "hủy": "Cancel"
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
    
    // Stores
    "tìm kiếm cửa hàng": "매장 찾기",
    "nhập tên đường, quận...": "도로명, 지역명 입력...",
    "đóng cửa": "영업 종료",
    "mở cửa 24/7": "24시간 영업",
    "khoảng cách": "거리",
    "đường đi": "길찾기",
    "chọn làm cửa hàng mặc định": "기본 매장으로 설정",
    "cửa hàng mặc định": "기본 매장",
    
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
    
    // History
    "chi tiết đơn hàng": "주문 상세 내역",
    "mã đơn hàng": "주문 번호",
    "trạng thái": "상태",
    "thời gian": "날짜",
    "thành tiền": "결제 금액",
    
    // Admin
    "quản lý kho ck go": "CK GO 재고 관리",
    "bảng quản trị kho": "재고 관리 대시보드",
    "thống kê kho": "재고 현황 요약",
    "tổng số sản phẩm": "총 상품 수",
    "hết hàng / sắp hết": "품절 / 재고 부족",
    "lịch sử cập nhật": "재고 변동 로그",
    "thêm sản phẩm mới": "새 상품 등록",
    "tên sản phẩm": "상품명",
    "số lượng": "수량",
    "đơn vị": "단위",
    "hành động": "작업",
    "nhập kho": "입고",
    "xuất kho": "출고",
    "người thực hiện": "담당자",
    "tải ảnh": "이미지 업로드",
    "lưu sản phẩm": "저장하기",
    "về trang chủ": "홈페이지로 이동",
    "hủy": "취소"
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
