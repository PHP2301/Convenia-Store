import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
}

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
