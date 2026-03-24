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
const rePasswordInput = document.getElementById("reAuthPassword");
const btnToggleAuth = document.getElementById("btnToggleAuth");
const notificationBox = document.getElementById("notificationBox");
const notificationText = document.getElementById("notificationText");
const btnMainAction = document.getElementById("btnMainAction");
const container = document.querySelector(".main-container");

let isLoginStage = true;
let generatedOTP = "";
let isOTPRegisterStep = false;
let forgotStep = 1; // 1: Email, 2: OTP, 3: Password

// --- HÀM THÔNG BÁO ---
function showNotify(message, type) {
  notificationText.innerText = message;
  notificationBox.className = "notification-popup show " + (type === "success" ? "success" : "error");
  setTimeout(() => notificationBox.classList.remove("show"), 3000);
}

// --- XỬ LÝ NHẢY Ô OTP (QUAN TRỌNG) ---
function setupOTPAutoTab(fieldClass, hiddenInputId) {
  const fields = document.querySelectorAll("." + fieldClass);
  const hiddenInput = document.getElementById(hiddenInputId);

  fields.forEach((field, index) => {
    field.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value.length >= 1 && index < fields.length - 1) {
        fields[index + 1].focus();
      }
      let code = "";
      fields.forEach((f) => (code += f.value));
      if (hiddenInput) hiddenInput.value = code;
    });

    field.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        fields[index - 1].focus();
      }
    });
  });
}

// Khởi tạo nhảy ô
setupOTPAutoTab("reg-otp", "regOTPInput");
setupOTPAutoTab("f-otp", "forgotOTPInput");

// --- ĐIỀU KHIỂN UI ---
function checkHash() {
  const hash = window.location.hash;
  isLoginStage = hash !== "#register";

  if (!isLoginStage) {
    container.classList.add("register-mode");
    document.getElementById("authTitle").innerText = "Đăng ký";
    btnMainAction.innerText = "ĐĂNG KÝ";
    document.getElementById("rePasswordGroup").style.display = "block";
    document.getElementById("formOptions").style.visibility = "hidden";
  } else {
    container.classList.remove("register-mode");
    document.getElementById("authTitle").innerText = "Đăng nhập";
    btnMainAction.innerText = "ĐĂNG NHẬP NGAY";
    document.getElementById("rePasswordGroup").style.display = "none";
    document.getElementById("formOptions").style.visibility = "visible";
    document.getElementById("registerOTPSection").style.display = "none";
  }
}

window.addEventListener("DOMContentLoaded", checkHash);
window.addEventListener("hashchange", checkHash);

btnToggleAuth.addEventListener("click", () => {
  window.location.hash = isLoginStage ? "register" : "";
});

// --- XỬ LÝ QUÊN MẬT KHẨU ---
window.handleForgotAction = async function () {
  const email = document.getElementById("forgotEmail").value.trim();
  const btn = document.getElementById("btnForgotAction");

  if (forgotStep === 1) {
    if (!email) return showNotify("Vui lòng nhập Email!", "error");
    btn.innerText = "ĐANG GỬI...";
    btn.disabled = true;

    try {
      generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      await emailjs.send(SERVICE_ID, TEMP_FORGOT, { to_email: email, otp_code: generatedOTP });
      showNotify("Mã khôi phục đã gửi!", "success");
      document.getElementById("stepEmail").style.display = "none";
      document.getElementById("stepOTP").style.display = "block";
      btn.innerText = "XÁC NHẬN OTP";
      forgotStep = 2;
    } catch (err) {
      showNotify("Lỗi gửi mail!", "error");
    }
    btn.disabled = false;
  } else if (forgotStep === 2) {
    const userOTP = document.getElementById("forgotOTPInput").value;
    if (userOTP === generatedOTP) {
      showNotify("Xác thực đúng!", "success");
      document.getElementById("stepOTP").style.display = "none";
      document.getElementById("resetPasswordSection").style.display = "block";
      btn.innerText = "XÁC NHẬN ĐỔI MẬT KHẨU";
      forgotStep = 3;
    } else {
      showNotify("Mã OTP không đúng!", "error");
    }
  } else if (forgotStep === 3) {
    const p1 = document.getElementById("newPassword").value;
    const p2 = document.getElementById("confirmNewPassword").value;
    if (p1.length < 6) return showNotify("Mật khẩu ít nhất 6 ký tự!", "error");
    if (p1 !== p2) return showNotify("Mật khẩu không khớp!", "error");

    btn.innerText = "ĐANG XỬ LÝ...";
    try {
      await sendPasswordResetEmail(auth, email);
      showNotify("Thành công! Kiểm tra email để đổi mật khẩu.", "success");
      setTimeout(() => {
        location.reload();
      }, 2500);
    } catch (err) {
      showNotify(err.message, "error");
    }
  }
};

window.toggleForgot = function (show) {
  document.getElementById("authContent").style.display = show ? "none" : "flex";
  document.getElementById("forgotSection").style.display = show ? "block" : "none";
  forgotStep = 1;
};

// --- FORM ĐĂNG KÝ / ĐĂNG NHẬP ---
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (isLoginStage) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showNotify("Đăng nhập thành công!", "success");
      setTimeout(() => {
        location.href = "index.html";
      }, 1500);
    } catch (err) {
      showNotify("Sai tài khoản hoặc mật khẩu!", "error");
    }
  } else {
    if (!isOTPRegisterStep) {
      if (password !== rePasswordInput.value) return showNotify("Mật khẩu không khớp!", "error");
      btnMainAction.innerText = "ĐANG KIỂM TRA...";
      try {
        // Kiểm tra email tồn tại chưa bằng cách tạo thử và xóa ngay
        const userCredential = await createUserWithEmailAndPassword(auth, email, "check_temp_123");
        await userCredential.user.delete();

        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        await emailjs.send(SERVICE_ID, TEMP_REGISTER, { to_email: email, otp_code: generatedOTP });
        showNotify("Đã gửi mã xác thực!", "success");
        document.getElementById("registerOTPSection").style.display = "block";
        isOTPRegisterStep = true;
        btnMainAction.innerText = "XÁC NHẬN ĐĂNG KÝ";
      } catch (err) {
        showNotify(err.code === "auth/email-already-in-use" ? "Email đã tồn tại!" : "Lỗi hệ thống!", "error");
      }
    } else {
      const userOTP = document.getElementById("regOTPInput").value;
      if (userOTP === generatedOTP) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          showNotify("Đăng ký thành công!", "success");
          setTimeout(() => {
            window.location.hash = "";
            location.reload();
          }, 1500);
        } catch (err) {
          showNotify(err.message, "error");
        }
      } else {
        showNotify("OTP không đúng!", "error");
      }
    }
  }
});
