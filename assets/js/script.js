import {
  initializeApp,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  getAuth,
  onAuthStateChanged,
  signOut
} from "./api-client.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCmDCaoZC1B1cvb3vpGeLrxQjNYvrHfHHg",
  authDomain: "circlek-db.firebaseapp.com",
  projectId: "circlek-db",
  storageBucket: "circlek-db.firebasestorage.app", // Đã cập nhật cho chuẩn Storage
  messagingSenderId: "515751444593",
  appId: "1:515751444593:web:453df449a3b86f09f09bd0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 2. XỬ LÝ ĐĂNG NHẬP & HIỂN THỊ TÊN KHÁCH HÀNG ---
onAuthStateChanged(auth, async (user) => {
  const btnLogin = document.getElementById("login-btn");
  const userProfile = document.getElementById("user-profile-header");
  const userInitial = document.getElementById("user-initial");
  const userNameText = document.getElementById("user-name-text");
  const adminLink = document.getElementById("admin-link");

  if (user) {
    // A. Hiển thị thông tin User
    if (btnLogin) btnLogin.style.display = "none";
    if (userProfile) userProfile.style.display = "flex";

    // Lấy tên hiển thị: Ưu tiên displayName -> Email cắt bỏ phần @
    const displayName = user.displayName || user.email.split("@")[0];

    if (userNameText) userNameText.innerText = displayName;
    if (userInitial) userInitial.innerText = displayName.charAt(0).toUpperCase();

    // B. Kiểm tra quyền Admin trong Firestore
    try {
      const subDoc = await getDoc(doc(db, "subscribers", user.uid));
      if (subDoc.exists() && subDoc.data().role === "admin") {
        if (adminLink) {
          adminLink.style.display = "flex";
          adminLink.style.color = "#df2027"; // Highlight màu đỏ cho admin
        }
      }
    } catch (error) {
      console.error("Lỗi phân quyền:", error);
    }
  } else {
    // C. Trạng thái chưa đăng nhập
    if (btnLogin) btnLogin.style.display = "flex";
    if (userProfile) userProfile.style.display = "none";
    if (adminLink) adminLink.style.display = "none";
  }
});

// Xử lý Đăng xuất (Dùng event delegation để tránh lỗi khi element chưa load)
document.addEventListener("click", async (e) => {
  const logoutBtn = e.target.closest("#btn-logout-header");
  if (logoutBtn) {
    e.preventDefault();
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      try {
        await signOut(auth);
        window.location.href = "index.html"; // Chuyển về trang chủ sau khi logout
      } catch (error) {
        console.error("Lỗi đăng xuất:", error);
      }
    }
  }
});

// --- 3. LƯU EMAIL KHÁCH HÀNG (SUBSCRIBERS) ---
async function saveToFirebase() {
  const emailInput = document.getElementById("customerEmail");
  if (!emailInput) return;

  const emailValue = emailInput.value.trim();
  if (!emailValue) return alert("Vui lòng nhập email!");

  try {
    // Nếu user đã login, dùng UID làm ID document để quản lý role
    if (auth.currentUser) {
      await setDoc(
        doc(db, "subscribers", auth.currentUser.uid),
        {
          email: emailValue,
          role: "user",
          timestamp: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      // Nếu chưa login thì lưu bình thường
      await addDoc(collection(db, "subscribers"), {
        email: emailValue,
        role: "guest",
        timestamp: serverTimestamp(),
      });
    }
    alert("Đăng ký thành công!");
    emailInput.value = "";
  } catch (e) {
    console.error(e);
    alert("Lỗi lưu dữ liệu!");
  }
}
window.saveToFirebase = saveToFirebase;

// --- 4. SLIDESHOW BANNER ---
let slideIndex = 1;
function showSlides(n) {
  const slides = document.querySelectorAll(".slide");
  if (slides.length === 0) return;
  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;
  slides.forEach((s) => s.classList.remove("active"));
  slides[slideIndex - 1].classList.add("active");

  // Cập nhật trạng thái active của các dots
  const dots = document.querySelectorAll(".slider-dots .dot");
  if (dots.length > 0) {
    dots.forEach((d) => d.classList.remove("active"));
    if (dots[slideIndex - 1]) {
      dots[slideIndex - 1].classList.add("active");
    }
  }
}

window.currentSlide = function(n) {
  slideIndex = n;
  showSlides(slideIndex);
};

setInterval(() => {
  slideIndex++;
  showSlides(slideIndex);
}, 5000);

// --- 5. TÌM KIẾM CỬA HÀNG & GPS ---
function filterStores(keyword) {
  const cards = document.querySelectorAll(".store-card");
  cards.forEach((card) => {
    const isMatch = card.innerText.toLowerCase().includes(keyword.toLowerCase());
    card.style.display = isMatch ? "block" : "none";
  });
}

const inputStore = document.getElementById("store-search-input");
if (inputStore) {
  inputStore.addEventListener("input", (e) => filterStores(e.target.value));
}

// Tính khoảng cách (Công thức Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

window.getMyLocation = function (storeLat, storeLon, storeName) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, storeLat, storeLon);
        alert(`Khoảng cách đến ${storeName} là ${dist} km.`);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${storeLat},${storeLon}`, "_blank");
      },
      () => alert("Vui lòng cho phép truy cập vị trí!"),
    );
  }
};

// Khởi tạo khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
  showSlides(slideIndex);
});
document.querySelectorAll(".dropdown-subs a").forEach((link) => {
  link.addEventListener("click", function (e) {
    window.location.href = this.getAttribute("href");
  });
});
// Hàm này dùng để lấy số lượng món từ Firebase và hiện lên icon
async function syncCartBadge(user) {
  const cartBadge = document.getElementById("cart-count");
  if (!cartBadge) return; // Nếu trang đó không có icon giỏ hàng thì thôi

  try {
    const cartRef = doc(db, "carts", user.uid);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      const items = cartSnap.data().items || [];
      // Tính tổng số lượng (hoặc chỉ tính số loại món tùy)
      const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      cartBadge.innerText = totalQty;
    } else {
      cartBadge.innerText = "0";
    }
  } catch (error) {
    console.error("Lỗi đồng bộ Badge:", error);
  }
}

// LẮNG NGHE TRẠNG THÁI ĐĂNG NHẬP
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Mỗi khi chuyển trang, nếu đã đăng nhập thì tự đi lấy số lượng giỏ hàng
    syncCartBadge(user);
  } else {
    const cartBadge = document.getElementById("cart-count");
    if (cartBadge) cartBadge.innerText = "0";
  }
});
// Map ID cửa hàng sang Tên hiển thị (Phải khớp với ID trong file Profile của )
const storeMapping = {
  ngt: "Nguyễn Gia Trí",
  nvt: "Nguyễn Văn Thương",
  dbp: "Điện Biên Phủ",
  nhc: "Nguyễn Hữu Cảnh",
};

onAuthStateChanged(auth, async (user) => {
  const storeDisplayName = document.getElementById("display-store-name");

  if (user) {
    try {
      // 1. Truy cập vào Profile của người dùng
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // 2. Lấy ID store từ field 'nearestStore' mà  đã lưu
        const storeId = data.nearestStore || "ngt";

        // 3. Lưu ID này vào localStorage để hàm loadProducts dùng để lọc sản phẩm
        localStorage.setItem("selected_store", storeId);

        // 4. Hiển thị tên tiếng Việt lên Header
        if (storeDisplayName) {
          storeDisplayName.innerText = storeMapping[storeId] || "Nguyễn Gia Trí";
        }
      }
    } catch (error) {
      console.error("Lỗi đồng bộ Store:", error);
    }
  } else {
    // Nếu khách chưa đăng nhập, mặc định chọn 1 kho
    localStorage.setItem("selected_store", "ngt");
    if (storeDisplayName) storeDisplayName.innerText = "Nguyễn Gia Trí";
  }

  // Cuối cùng, gọi hàm load sản phẩm (đã có sẵn của )
  if (typeof loadProducts === "function") {
    loadProducts();
  }
  loadFlashSaleProducts();
});
// Thêm đoạn này vào cuối file js/script.js
window.filterCategories = function () {
  const searchValue = document.getElementById("category-search").value.toLowerCase();
  const cards = document.querySelectorAll(".card-link");

  cards.forEach((card) => {
    // Lấy từ khóa từ data-name và tiêu đề h3
    const keywords = card.getAttribute("data-name") ? card.getAttribute("data-name").toLowerCase() : "";
    const title = card.querySelector("h3").innerText.toLowerCase();

    if (keywords.includes(searchValue) || title.includes(searchValue)) {
      card.style.display = "block"; // Hiện lại
    } else {
      card.style.display = "none"; // Ẩn đi
    }
  });
};

// --- 6. HÀM ĐẾM NGƯỢC THỜI GIAN FLASH SALE ---
async function startCountdown() {
  const hoursEl = document.getElementById("hours");
  const minutesEl = document.getElementById("minutes");
  const secondsEl = document.getElementById("seconds");

  if (!hoursEl || !minutesEl || !secondsEl) return;

  const flashSaleRef = doc(db, "settings", "flash_sale");
  let targetTime;

  try {
    const docSnap = await getDoc(flashSaleRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      targetTime = parseInt(data.endTime);
      // Nếu thời gian cũ đã qua, reset lại chu kỳ mới 3 tiếng
      if (Date.now() > targetTime) {
        targetTime = Date.now() + 3 * 60 * 60 * 1000;
        await setDoc(flashSaleRef, { endTime: targetTime });
      }
    } else {
      // Thiết lập ban đầu nếu chưa có trong Database
      targetTime = Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000; // 2 giờ 45 phút từ hiện tại
      await setDoc(flashSaleRef, { endTime: targetTime });
    }
  } catch (err) {
    console.error("Lỗi khi kết nối bộ đếm ngược DB, fallback sang cục bộ:", err);
    targetTime = Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000;
  }

  function updateTimer() {
    const timeLeft = targetTime - Date.now();
    if (timeLeft <= 0) {
      hoursEl.innerText = "00";
      minutesEl.innerText = "00";
      secondsEl.innerText = "00";
      return;
    }

    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    hoursEl.innerText = String(hours).padStart(2, "0");
    minutesEl.innerText = String(minutes).padStart(2, "0");
    secondsEl.innerText = String(seconds).padStart(2, "0");
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// --- 7. TẢI SẢN PHẨM KHUYẾN MÃI FLASH SALE TỪ DATABASE ---
async function loadFlashSaleProducts() {
  const container = document.getElementById("flash-sale-products");
  if (!container) return;

  const currentBranch = localStorage.getItem("selected_store") || "ngt";

  try {
    const colRef = collection(db, "inventory");
    const q = query(colRef, where("branch", "==", currentBranch));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ccc; padding: 20px 0;">Không tìm thấy sản phẩm khuyến mãi tại chi nhánh này.</p>`;
      return;
    }

    // Chuyển snap thành mảng và lọc các sản phẩm có giá trị thực tế
    const products = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.price && data.price > 0 && data.price < 100000) {
        products.push({ id: doc.id, ...data });
      }
    });

    if (products.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ccc; padding: 20px 0;">Không tìm thấy sản phẩm phù hợp khuyến mãi.</p>`;
      return;
    }

    // Chọn tối đa 4 sản phẩm
    const saleProducts = products.slice(0, 4);
    container.innerHTML = "";

    saleProducts.forEach((p, idx) => {
      // Giảm giá 20%
      const discount = 20;
      const salePrice = Math.round((p.price * (1 - discount / 100)) / 1000) * 1000;
      const originalPrice = p.price;
      const img = p.imageUrl || "../assets/img/default.png";
      const name = p.name || "Sản phẩm khuyến mãi";

      // Chỉ số ngẫu nhiên / tính toán thanh tiến trình
      const soldCount = 10 + (idx * 7) % 15;
      const totalStock = 30;
      const progressWidth = (soldCount / totalStock) * 100;
      
      container.innerHTML += `
        <div class="flash-product-card">
          <span class="discount-badge">-${discount}%</span>
          <div class="product-img-wrapper">
            <img src="${img}" alt="${name}" />
          </div>
          <h3>${name}</h3>
          <div class="product-pricing">
            <span class="sale-price">${Number(salePrice).toLocaleString()}đ</span>
            <span class="old-price">${Number(originalPrice).toLocaleString()}đ</span>
          </div>
          <div class="stock-progress">
            <div class="progress-bar" style="width: ${progressWidth}%;"></div>
            <span class="progress-text">${soldCount >= 20 ? "Sắp cháy hàng" : `Đã bán ${soldCount}`}</span>
          </div>
          <button class="btn-buy-flash" onclick="handleAddToCart(this, '${p.id}', '${name}', ${salePrice}, '${img}')">
            Mua ngay
          </button>
        </div>
      `;
    });
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm Flash Sale:", error);
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red; padding: 20px 0;">Không thể tải sản phẩm khuyến mãi. Vui lòng thử lại sau.</p>`;
  }
}

// Khởi chạy các bộ đếm ngược và tải sản phẩm khi load trang
startCountdown();
loadFlashSaleProducts();
