import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from "./api-client.js";

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
let forgotStep = 1;
let forgotUserHas2FA = false;
let forgotUser2FASecret = "";

// --- HÀM THÔNG BÁO ---
function showNotify(message, type) {
  notificationText.innerText = message;
  notificationBox.className = "notification-popup show " + (type === "success" ? "success" : "error");
  setTimeout(() => notificationBox.classList.remove("show"), 3000);
}

// --- HÀM KIỂM TRA QUYỀN VÀ ĐIỀU HƯỚNG ---
async function handleUserRoleAndRedirect(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.role === "admin") {
        showNotify("Chào Admin! Đang vào hệ thống quản lý...", "success");
        setTimeout(() => {
          location.href = "admin.html"; // Chuyển đến trang quản lý
        }, 1500);
      } else {
        showNotify("Đăng nhập thành công!", "success");
        setTimeout(() => {
          location.href = "index.html"; // Chuyển về trang chủ
        }, 1500);
      }
    } else {
      showNotify("Đăng nhập thành công! (Chưa phân quyền)", "success");
      setTimeout(() => {
        location.href = "index.html";
      }, 1500);
    }
  } catch (err) {
    showNotify("Lỗi xác thực quyền: " + err.message, "error");
  }
}

// --- XỬ LÝ NHẢY Ô OTP ---
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
    const btnFido = document.getElementById("btnFidoLogin");
    if (btnFido) btnFido.style.display = "none";
  } else {
    container.classList.remove("register-mode");
    document.getElementById("authTitle").innerText = "Đăng nhập";
    btnMainAction.innerText = "ĐĂNG NHẬP NGAY";
    document.getElementById("rePasswordGroup").style.display = "none";
    document.getElementById("formOptions").style.visibility = "visible";
    document.getElementById("registerOTPSection").style.display = "none";
    const btnFido = document.getElementById("btnFidoLogin");
    if (btnFido) btnFido.style.display = "flex";
  }
}

window.addEventListener("DOMContentLoaded", checkHash);
window.addEventListener("hashchange", checkHash);

btnToggleAuth.addEventListener("click", () => {
  window.location.hash = isLoginStage ? "register" : "";
  isOTPRegisterStep = false;
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
      // KIỂM TRA XEM TÀI KHOẢN CÓ KÍCH HOẠT 2FA KHÔNG
      const q = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      forgotUserHas2FA = false;
      forgotUser2FASecret = "";
      querySnapshot.forEach((doc) => {
        if (doc.data().tfa_secret) {
          forgotUserHas2FA = true;
          forgotUser2FASecret = doc.data().tfa_secret;
        }
      });

      generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      await emailjs.send(SERVICE_ID, TEMP_FORGOT, { to_email: email, otp_code: generatedOTP });
      showNotify("Mã khôi phục đã gửi!", "success");
      document.getElementById("stepEmail").style.display = "none";
      document.getElementById("stepOTP").style.display = "block";
      btn.innerText = "XÁC NHẬN OTP";
      forgotStep = 2;
    } catch (err) {
      console.error(err);
      showNotify("Lỗi gửi mail hoặc tìm tài khoản!", "error");
    }
    btn.disabled = false;
  } else if (forgotStep === 2) {
    const userOTP = document.getElementById("forgotOTPInput").value;
    if (userOTP === generatedOTP) {
      showNotify("Xác thực Email đúng!", "success");
      document.getElementById("stepOTP").style.display = "none";
      
      if (forgotUserHas2FA) {
        document.getElementById("stepForgotTFA").style.display = "block";
        btn.innerText = "XÁC NHẬN 2FA";
        forgotStep = 2.5;
      } else {
        document.getElementById("resetPasswordSection").style.display = "block";
        btn.innerText = "XÁC NHẬN ĐỔI MẬT KHẨU";
        forgotStep = 3;
      }
    } else {
      showNotify("Mã OTP không đúng!", "error");
    }
  } else if (forgotStep === 2.5) {
    const tfaCode = document.getElementById("forgotTfaOTPInput").value;
    if (tfaCode.length !== 6) {
      showNotify("Vui lòng nhập đủ 6 chữ số 2FA!", "error");
      return;
    }

    const totp = new OTPAuth.TOTP({
      issuer: "CircleK",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(forgotUser2FASecret)
    });

    const delta = totp.validate({
      token: tfaCode,
      window: 6
    });

    if (delta !== null) {
      showNotify("Xác thực 2FA thành công!", "success");
      document.getElementById("stepForgotTFA").style.display = "none";
      document.getElementById("resetPasswordSection").style.display = "block";
      btn.innerText = "XÁC NHẬN ĐỔI MẬT KHẨU";
      forgotStep = 3;
    } else {
      showNotify("Mã 2FA không chính xác! (Nhận được: " + tfaCode + ")", "error");
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
        location.href = "indexlogin.html";
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
  if (show) {
    document.getElementById("stepEmail").style.display = "block";
    document.getElementById("stepOTP").style.display = "none";
    const stepTFA = document.getElementById("stepForgotTFA");
    if (stepTFA) stepTFA.style.display = "none";
    document.getElementById("resetPasswordSection").style.display = "none";
    document.getElementById("btnForgotAction").innerText = "GỬI MÃ OTP";
    document.getElementById("forgotEmail").value = "";
    document.getElementById("forgotOTPInput").value = "";
    const tfaInput = document.getElementById("forgotTfaOTPInput");
    if (tfaInput) tfaInput.value = "";
    document.querySelectorAll(".f-otp").forEach(f => f.value = "");
    document.querySelectorAll(".f-tfa-otp").forEach(f => f.value = "");
  }
};

// --- XỬ LÝ 2FA XÁC THỰC 2 LỚP ---
function generateBase32Secret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}



async function handle2FAFlow(userId, email) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    // Tự động bỏ qua OTP nếu thiết bị đã được Ghi nhớ từ trước
    const isAlreadyVerified = sessionStorage.getItem("tfa_verified_" + userId) === "true" ||
                              localStorage.getItem("tfa_verified_" + userId) === "true";
    if (isAlreadyVerified) {
      handleUserRoleAndRedirect(userId);
      return;
    }

    const modal = document.getElementById("tfaModal");
    const setupSection = document.getElementById("tfaSetupSection");
    const verifySection = document.getElementById("tfaVerifySection");
    const qrImage = document.getElementById("tfaQrImage");
    const secretKeySpan = document.getElementById("tfaSecretKey");
    const verifyBtn = document.getElementById("btnVerify2FA");
    const cancelBtn = document.getElementById("btnCancel2FA");
    const tfaFields = document.querySelectorAll(".tfa-otp-field");
    const tfaHiddenInput = document.getElementById("tfaOTPInput");

    tfaFields.forEach(f => f.value = "");
    tfaHiddenInput.value = "";

    let isFirstTimeSetup = false;
    let secret = "";

    if (userDoc.exists() && userDoc.data().tfa_secret) {
      secret = userDoc.data().tfa_secret;
      setupSection.style.display = "none";
    } else {
      isFirstTimeSetup = true;
      secret = generateBase32Secret();
      
      const totp = new OTPAuth.TOTP({
        issuer: "CircleK",
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });
      
      const otpauthUri = totp.toString();
      qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`;
      secretKeySpan.innerText = secret;
      setupSection.style.display = "block";
    }

    modal.style.display = "flex";

    cancelBtn.onclick = () => {
      modal.style.display = "none";
      signOut(auth); // Log out if cancelled
      btnMainAction.innerText = "ĐĂNG NHẬP NGAY";
      showNotify("Đã hủy xác thực 2 lớp.", "error");
    };

    const resetBtn = document.getElementById("btnReset2FA");
    if (resetBtn) {
      resetBtn.onclick = () => {
        isFirstTimeSetup = true;
        secret = generateBase32Secret();
        
        const totp = new OTPAuth.TOTP({
          issuer: "CircleK",
          label: email,
          algorithm: "SHA1",
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret)
        });
        
        const otpauthUri = totp.toString();
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUri)}`;
        secretKeySpan.innerText = secret;
        setupSection.style.display = "block";
        showNotify("Đã tạo mã QR mới, hãy quét lại!", "success");
      };
    }
    
    verifyBtn.onclick = async () => {
      const code = tfaHiddenInput.value;
      if (code.length !== 6) {
        showNotify("Vui lòng nhập đủ 6 chữ số!", "error");
        return;
      }

      const totp = new OTPAuth.TOTP({
        issuer: "CircleK",
        label: email,
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });

      const delta = totp.validate({
        token: code,
        window: 6
      });

      if (delta !== null) {
        if (isFirstTimeSetup) {
          await setDoc(doc(db, "users", userId), { tfa_secret: secret }, { merge: true });
        }
        
        // Kiểm tra nút Ghi nhớ
        const rememberCheck = document.getElementById("rememberMeCheck");
        if (rememberCheck && rememberCheck.checked) {
          localStorage.setItem("tfa_verified_" + userId, "true");
        } else {
          sessionStorage.setItem("tfa_verified_" + userId, "true");
        }
        
        modal.style.display = "none";
        handleUserRoleAndRedirect(userId);
      } else {
        showNotify("Mã xác thực không chính xác! (Nhận được: " + code + ")", "error");
      }
    };

  } catch (err) {
    showNotify("Lỗi xác thực 2 lớp: " + err.message, "error");
    btnMainAction.innerText = "ĐĂNG NHẬP NGAY";
  }
}

// --- FORM ĐĂNG KÝ / ĐĂNG NHẬP ---
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (isLoginStage) {
    btnMainAction.innerText = "ĐANG XÁC THỰC...";
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handle2FAFlow(userCredential.user.uid, email);
    } catch (err) {
      showNotify("Sai tài khoản hoặc mật khẩu!", "error");
      btnMainAction.innerText = "ĐĂNG NHẬP NGAY";
    }
  } else {
    if (!isOTPRegisterStep) {
      if (password !== rePasswordInput.value) return showNotify("Mật khẩu không khớp!", "error");
      btnMainAction.innerText = "ĐANG KIỂM TRA...";
      try {
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
        btnMainAction.innerText = "ĐĂNG KÝ";
      }
    } else {
      const userOTP = document.getElementById("regOTPInput").value;
      if (userOTP === generatedOTP) {
        btnMainAction.innerText = "ĐANG TẠO TÀI KHOẢN...";
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);

          await setDoc(doc(db, "users", userCredential.user.uid), {
            email: email,
            role: "customer",
            createdAt: serverTimestamp(),
          });

          showNotify("Đăng ký thành công!", "success");
          setTimeout(() => {
            // SỬA TẠI ĐÂY: Quay về trạng thái login của file indexlogin.html
            window.location.hash = "";
            location.reload();
          }, 1500);
        } catch (err) {
          showNotify(err.message, "error");
          btnMainAction.innerText = "XÁC NHẬN ĐĂNG KÝ";
        }
      } else {
        showNotify("OTP không đúng!", "error");
      }
    }
  }
});

// --- AUTO-TAB LOGIC CHO 2FA ---
function setupOTPAutoTabGeneral(selector, hiddenInputId) {
  const fields = document.querySelectorAll(selector);
  const hiddenInput = document.getElementById(hiddenInputId);

  if (!fields.length || !hiddenInput) return;

  fields.forEach((field, index) => {
    field.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value.length >= 1 && index < fields.length - 1) {
        fields[index + 1].focus();
      }
      let code = "";
      fields.forEach((f) => (code += f.value));
      hiddenInput.value = code;
    });

    field.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        fields[index - 1].focus();
      }
    });
  });
}

// Chạy ngay khi file module được tải
setupOTPAutoTabGeneral(".tfa-otp-field", "tfaOTPInput");
setupOTPAutoTabGeneral(".f-tfa-otp", "forgotTfaOTPInput");

// --- FIDO2 / WEBAUTHN PASSWORDLESS LOGIN ---
function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function loginWithFIDO() {
  const btnFido = document.getElementById("btnFidoLogin");
  if (!btnFido) return;
  btnFido.disabled = true;
  const originalText = btnFido.innerHTML;
  btnFido.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ĐANG XÁC THỰC...`;

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        rpId: window.location.hostname,
        timeout: 60000,
        userVerification: "required"
      }
    });

    const credentialId = bufferToBase64url(assertion.rawId);

    // Tìm user tương ứng với credentialId trong cơ sở dữ liệu
    const q = query(collection(db, "users"), where("fido_credential_id", "==", credentialId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      showNotify("Chưa liên kết thiết bị! Hãy đăng nhập bằng mật khẩu trước.", "error");
      btnFido.disabled = false;
      btnFido.innerHTML = originalText;
      return;
    }

    let email = "";
    let fidoPassword = "";
    querySnapshot.forEach((doc) => {
      email = doc.data().email;
      fidoPassword = doc.data().fido_password;
    });

    // Đăng nhập bằng fidoPassword đặc chế
    const userCredential = await signInWithEmailAndPassword(auth, email, fidoPassword);
    
    // Tự động đánh dấu đã xác thực 2FA vì FIDO2 chính là hình thức xác thực 2 lớp cấp cao nhất
    const rememberCheck = document.getElementById("rememberMeCheck");
    if (rememberCheck && rememberCheck.checked) {
      localStorage.setItem("tfa_verified_" + userCredential.user.uid, "true");
    } else {
      sessionStorage.setItem("tfa_verified_" + userCredential.user.uid, "true");
    }
    
    // Bỏ qua nhập OTP 2FA và điều hướng vào trang chính
    handleUserRoleAndRedirect(userCredential.user.uid);
    
  } catch (err) {
    console.error("Lỗi FIDO Login:", err);
    showNotify("Xác thực vân tay/khuôn mặt thất bại hoặc bị hủy!", "error");
  } finally {
    btnFido.disabled = false;
    btnFido.innerHTML = originalText;
  }
}

document.getElementById("btnFidoLogin")?.addEventListener("click", loginWithFIDO);


