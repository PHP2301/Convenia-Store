import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCmDCaoZC1B1cvb3vpGeLrxQjNYvrHfHHg",
  authDomain: "circlek-db.firebaseapp.com",
  projectId: "circlek-db",
  storageBucket: "circlek-db.firebasestorage.app",
  messagingSenderId: "515751444593",
  appId: "1:515751444593:web:453df449a3b86f09f09bd0",
  measurementId: "G-W9RMHWTWXJ",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Hàm lưu dữ liệu Email
async function saveToFirebase() {
  const emailInput = document.getElementById("customerEmail");
  if (!emailInput) return; // Bảo vệ nếu không tìm thấy ô nhập

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
    alert("Cảm ơn! Email của bạn đã được lưu vào Firebase.");
    emailInput.value = "";
  } catch (e) {
    console.error("Lỗi: ", e);
    alert("Có lỗi xảy ra, vui lòng thử lại.");
  }
}

// 3. XỬ LÝ SLIDESHOW BANNER
let slideIndex = 1;

function showSlides(n) {
  const slides = document.querySelectorAll(".slide");
  const dots = document.querySelectorAll(".dot");

  if (slides.length === 0) return; // Nếu chưa có slide thì thoát

  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;

  // Xóa class active của tất cả slide và dots
  slides.forEach((slide) => slide.classList.remove("active"));
  dots.forEach((dot) => dot.classList.remove("active"));

  // Hiển thị slide và dot tương ứng
  slides[slideIndex - 1].classList.add("active");
  if (dots[slideIndex - 1]) {
    dots[slideIndex - 1].classList.add("active");
  }
}

// Hàm cho các chấm khi nhấn (onclick)
function currentSlide(n) {
  showSlides((slideIndex = n));
}

// Tự động chuyển sau mỗi 5 giây
let slideInterval = setInterval(() => {
  slideIndex++;
  showSlides(slideIndex);
}, 5000);

// 4. Đưa các hàm ra Window (Vì dùng type="module" nên cần bước này để HTML nhận diện onclick)
window.saveToFirebase = saveToFirebase;
window.currentSlide = currentSlide;

// Khởi tạo slide đầu tiên khi trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
  showSlides(slideIndex);
});
