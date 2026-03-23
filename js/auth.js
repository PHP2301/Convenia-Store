import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCmDCaoZC1B1cvb3vpGeLrxQjNYvrHfHHg",
  authDomain: "circlek-db.firebaseapp.com",
  projectId: "circlek-db",
  storageBucket: "circlek-db.firebasestorage.app",
  messagingSenderId: "515751444593",
  appId: "1:515751444593:web:453df449a3b86f09f09bd0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 2. Cấu hình EmailJS
emailjs.init("utKMKTgKkf6gww2x1");
const SERVICE_ID = "service_t02hi6m";
const TEMP_REGISTER = "template_xvkbgmc";
const TEMP_FORGOT = "template_haxy54r";

// 3. Khai báo Elements
const authForm = document.getElementById("authForm");
const emailInput = document.getElementById("authEmail");
const passwordInput = document.getElementById("authPassword");
const btnToggleAuth = document.getElementById("btnToggleAuth");
const notificationBox = document.getElementById("notificationBox");
const notificationIcon = document.getElementById("notificationIcon");
const notificationText = document.getElementById("notificationText");
const btnMainAction = document.getElementById("btnMainAction");
const container = document.querySelector(".main-container");

let isLoginStage = true;
let generatedOTP = "";
let isOTPRegisterStep = false;

// --- HÀM THÔNG BÁO ---
function showNotify(message, type) {
  notificationText.innerText = message;
  notificationBox.className = "notification-popup";
  if (type === "success") {
    notificationBox.classList.add("success", "show");
    notificationIcon.className = "fas fa-check-circle";
  } else {
    notificationBox.classList.add("error", "show");
    notificationIcon.className = "fas fa-exclamation-circle";
  }
  setTimeout(() => notificationBox.classList.remove("show"), 3000);
}

// --- XỬ LÝ GIAO DIỆN (UI) ---
function renderRegisterUI() {
  container.classList.add("register-mode");
  const formLogo = document.getElementById("formLogo");
  if (formLogo) formLogo.style.display = "block";

  document.getElementById("authTitle").innerText = "Đăng ký";
  btnMainAction.innerText = "ĐĂNG KÝ";
  emailInput.placeholder = "Nhận mã xác thực qua email này";
  document.getElementById("formOptions").style.visibility = "hidden";

  const btnBack = document.getElementById("btnBackToLogin");
  if (btnBack) btnBack.style.display = "block";
}

function renderLoginUI() {
  container.classList.remove("register-mode");
  const formLogo = document.getElementById("formLogo");
  if (formLogo) formLogo.style.display = "none";

  document.getElementById("authTitle").innerText = "Đăng nhập";
  btnMainAction.innerText = "ĐĂNG NHẬP NGAY";
  emailInput.placeholder = "example@gmail.com";
  document.getElementById("formOptions").style.visibility = "visible";

  const btnBack = document.getElementById("btnBackToLogin");
  if (btnBack) btnBack.style.display = "none";

  document.getElementById("registerOTPSection").style.display = "none";
}

function checkHash() {
  const hash = window.location.hash;
  isLoginStage = hash !== "#register";
  if (!isLoginStage) renderRegisterUI();
  else renderLoginUI();
  isOTPRegisterStep = false;
}

window.addEventListener("DOMContentLoaded", checkHash);

// Bấm nút chuyển đổi tab
btnToggleAuth.addEventListener("click", () => {
  const forgotSection = document.getElementById("forgotSection");
  if (forgotSection.style.display === "block") {
    toggleForgot(false);
    window.location.hash = "";
  } else {
    window.location.hash = isLoginStage ? "register" : "";
  }
  checkHash();
});

window.switchToLogin = function () {
  window.location.hash = "";
  checkHash();
};

// --- QUÊN MẬT KHẨU ---
window.toggleForgot = function (show) {
  document.getElementById("authContent").style.display = show ? "none" : "flex";
  document.getElementById("forgotSection").style.display = show ? "block" : "none";
};

window.sendOTP = async function (event) {
  const email = document.getElementById("forgotEmail").value.trim();
  if (!email) return showNotify("Vui lòng nhập Email!", "error");
  const btn = event.target;
  btn.innerText = "ĐANG GỬI...";
  btn.disabled = true;

  try {
    await sendPasswordResetEmail(auth, email);
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    await emailjs.send(SERVICE_ID, TEMP_FORGOT, { to_email: email, otp_code: generatedOTP });
    showNotify("Mã khôi phục đã gửi!", "success");
    document.getElementById("stepEmail").style.display = "none";
    document.getElementById("stepOTP").style.display = "block";
  } catch (error) {
    showNotify(error.code === "auth/user-not-found" ? "Email chưa đăng ký!" : "Lỗi hệ thống!", "error");
  } finally {
    btn.innerText = "GỬI MÃ OTP";
    btn.disabled = false;
  }
};

window.verifyOTP = function () {
  const input = document.getElementById("otpInput").value.trim();
  if (input === generatedOTP) showNotify("Xác nhận thành công!", "success");
  else showNotify("Mã OTP sai!", "error");
};

// --- SUBMIT FORM CHÍNH ---
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (isLoginStage) {
    // Luồng đăng nhập giữ nguyên...
  } else {
    // LUỒNG ĐĂNG KÝ
    if (!isOTPRegisterStep) {
      // BƯỚC 1: NHẤN ĐĂNG KÝ LẦN ĐẦU -> GỬI MÃ VÀ HIỆN 6 Ô
      btnMainAction.innerText = "ĐANG GỬI MÃ...";
      btnMainAction.disabled = true;

      generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        await emailjs.send(SERVICE_ID, TEMP_REGISTER, { to_email: email, otp_code: generatedOTP });

        showNotify("Mã xác thực đã gửi!", "success");

        // CHỈ HIỆN OTP KHI ĐÃ GỬI THÀNH CÔNG
        document.getElementById("registerOTPSection").style.display = "block";

        btnMainAction.innerText = "XÁC NHẬN ĐĂNG KÝ";
        btnMainAction.disabled = false;
        isOTPRegisterStep = true;
      } catch (err) {
        showNotify("Lỗi gửi mail!", "error");
        btnMainAction.innerText = "ĐĂNG KÝ";
        btnMainAction.disabled = false;
      }
    } else {
      // BƯỚC 2: NHẬP OTP XONG NHẤN LẦN NỮA ĐỂ TẠO ACC
      const userOTP = document.getElementById("regOTPInput").value.trim();
      if (userOTP === generatedOTP) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          showNotify("Đăng ký thành công!", "success");
          authForm.reset();
          // Reset giao diện về mặc định
          setTimeout(() => {
            window.location.hash = "";
            checkHash();
          }, 1500);
        } catch (error) {
          showNotify("Lỗi: " + error.message, "error");
        }
      } else {
        showNotify("Mã OTP không đúng!", "error");
      }
    }
  }
});
