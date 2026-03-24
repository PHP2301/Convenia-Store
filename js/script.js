import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
// THÊM: Import thêm Auth để kiểm tra trạng thái đăng nhập
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Cấu hình Firebase (Giữ nguyên của Phước)
const firebaseConfig = {
  apiKey: "AIzaSyCmDCaoZC1B1cvb3vpGeLrxQjNYvrHfHHg",
  authDomain: "circlek-db.firebaseapp.com",
  projectId: "circlek-db",
  storageBucket: "circlek-db.firebasestorage.app",
  messagingSenderId: "515751444593",
  appId: "1:515751444593:web:453df449a3b86f09f09bd0",
  measurementId: "G-W9RMHWTWXJ",
};

// Khởi tạo
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Khởi tạo Auth

// --- 2. XỬ LÝ TRẠNG THÁI ĐĂNG NHẬP (MỚI THÊM) ---
onAuthStateChanged(auth, (user) => {
  const btnLogin = document.getElementById("btn-login-nav");
  const userProfile = document.getElementById("user-profile-header");
  const userInitial = document.getElementById("user-initial");

  if (user) {
    // Nếu đã đăng nhập: Ẩn nút "Đăng nhập", hiện Avatar tròn
    if (btnLogin) btnLogin.style.display = "none";
    if (userProfile) userProfile.style.display = "flex";

    // Lấy chữ cái đầu của Email hiển thị lên Avatar
    if (userInitial) {
      userInitial.innerText = user.email.charAt(0).toUpperCase();
    }
  } else {
    // Nếu chưa đăng nhập: Hiện lại nút "Đăng nhập"
    if (btnLogin) btnLogin.style.display = "block";
    if (userProfile) userProfile.style.display = "none";
  }
});

// --- 3. HÀM LƯU DỮ LIỆU EMAIL (FIRESTORE) ---
async function saveToFirebase() {
  const emailInput = document.getElementById("customerEmail");
  if (!emailInput) return;

  const emailValue = emailInput.value.trim();
  if (!emailValue) {
    alert("Vui lòng nhập email!");
    return;
  }

  try {
    const docRef = await addDoc(collection(db, "subscribers"), {
      email: emailValue,
      timestamp: new Date(),
    });
    console.log("Thành công với ID: ", docRef.id);
    alert("Cảm ơn! Email đã được lưu.");
    emailInput.value = "";
  } catch (e) {
    console.error("Lỗi: ", e);
    alert("Có lỗi xảy ra, vui lòng thử lại.");
  }
}

// --- 4. XỬ LÝ SLIDESHOW BANNER ---
let slideIndex = 1;

function showSlides(n) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");

  if (slides.length === 0) return;

  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;

  slides.forEach((slide) => slide.classList.remove("active"));
  dots.forEach((dot) => dot.classList.remove("active"));

  if (slides[slideIndex - 1]) slides[slideIndex - 1].classList.add("active");
  if (dots[slideIndex - 1]) dots[slideIndex - 1].classList.add("active");
}

function currentSlide(n) {
  showSlides((slideIndex = n));
}

// Tự động chuyển slide
let slideInterval = setInterval(() => {
  slideIndex++;
  showSlides(slideIndex);
}, 5000);

// --- 5. EXPORT RA WINDOW ---
window.saveToFirebase = saveToFirebase;
window.currentSlide = currentSlide;

document.addEventListener("DOMContentLoaded", () => {
  showSlides(slideIndex);
});
