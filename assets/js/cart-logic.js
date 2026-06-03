import {
  initializeApp, getApps, getApp,
  getFirestore, collection, addDoc, doc, getDoc, updateDoc,
  getAuth, onAuthStateChanged
} from "./api-client.js";

const firebaseConfig = {
  apiKey: "AIzaSyCmDCaoZC1B1cvb3vpGeLrxQjNYvrHfHHg",
  authDomain: "circlek-db.firebaseapp.com",
  projectId: "circlek-db",
  storageBucket: "circlek-db.firebasestorage.app",
  messagingSenderId: "515751444593",
  appId: "1:515751444593:web:453df449a3b86f09f09bd0",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize EmailJS
emailjs.init("utKMKTgKkf6gww2x1");
const SERVICE_ID = "service_t02hi6m";
const TEMP_OTP = "template_haxy54r";

onAuthStateChanged(auth, (user) => {
  if (user) {
    renderCart(user.uid);
  } else {
    document.getElementById("cart-list").innerHTML =
      `<p style="text-align:center; padding:20px;">Vui lòng <a href="indexlogin.html">đăng nhập</a> để xem giỏ hàng.</p>`;
  }
});

async function renderCart(uid) {
  const listContainer = document.getElementById("cart-list");
  const cartRef = doc(db, "carts", uid);
  const cartSnap = await getDoc(cartRef);

  if (!cartSnap.exists() || cartSnap.data().items.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center; padding:40px;">
            <i class="fas fa-shopping-cart" style="font-size: 50px; color: #ccc; margin-bottom: 10px;"></i>
            <p>Giỏ hàng của bạn đang trống.</p>
        </div>`;
    updateTotals(0);
    return;
  }

  const items = cartSnap.data().items;
  let html = "";
  let totalAll = 0;

  items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const subTotal = item.price * qty;
    totalAll += subTotal;

    html += `
            <div class="cart-item">
                <img src="${item.imageUrl || "img/default.png"}" alt="${item.name}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span class="item-price">${Number(item.price).toLocaleString()}đ</span>
                </div>
                <div class="item-qty">
                    <button onclick="updateQty('${index}', -1)">-</button>
                    <span>${qty}</span>
                    <button onclick="updateQty('${index}', 1)">+</button>
                </div>
                <div class="item-total-price">
                    <b>${subTotal.toLocaleString()}đ</b>
                </div>
                <i class="fas fa-trash-alt btn-remove" onclick="removeItem('${index}')"></i>
            </div>`;
  });

  listContainer.innerHTML = html;
  updateTotals(totalAll);
}

function updateTotals(total) {
  document.getElementById("subtotal").innerText = total.toLocaleString() + "đ";
  document.getElementById("final-total").innerText = total.toLocaleString() + "đ";
}

window.updateQty = async (index, change) => {
  const user = auth.currentUser;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  let items = cartSnap.data().items;

  let newQty = (items[index].quantity || 1) + change;
  if (newQty < 1) return;

  items[index].quantity = newQty;
  await updateDoc(cartRef, { items: items });
  renderCart(user.uid);
};

window.removeItem = async (index) => {
  if (!confirm("Bạn có chắc muốn xóa món này?")) return;
  const user = auth.currentUser;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  let items = cartSnap.data().items;

  items.splice(index, 1);
  await updateDoc(cartRef, { items: items });
  renderCart(user.uid);
};

// --- LOGIC THANH TOÁN VIETQR ---
const btnVietQR = document.getElementById("btn-vietqr-action");

if (btnVietQR) {
  btnVietQR.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Vui lòng đăng nhập để tiến hành thanh toán!");
      window.location.href = "indexlogin.html";
      return;
    }

    const statusLabel = document.getElementById("checkout-status");
    statusLabel.style.display = "block";
    btnVietQR.disabled = true;

    try {
      // 1. KIỂM TRA THÔNG TIN HỒ SƠ NGƯỜI DÙNG
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        alert("Bạn cần cập nhật thông tin cá nhân (Họ tên, SĐT) trước khi thanh toán!");
        window.location.href = "indexprofile.html";
        return;
      }

      const userData = userSnap.data();
      if (!userData.fullname || !userData.phone || !userData.address) {
        alert("Thông tin nhận hàng còn thiếu (Họ tên, SĐT hoặc Địa chỉ). Vui lòng cập nhật hồ sơ!");
        window.location.href = "indexprofile.html";
        return;
      }

      // 2. Lấy dữ liệu giỏ hàng hiện tại
      const cartRef = doc(db, "carts", user.uid);
      const cartSnap = await getDoc(cartRef);

      if (!cartSnap.exists() || cartSnap.data().items.length === 0) {
        alert("Giỏ hàng của bạn đang trống!");
        statusLabel.style.display = "none";
        btnVietQR.disabled = false;
        return;
      }

      const cartData = cartSnap.data();
      const total = cartData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // --- FIDO2 MFA STEP-UP (Chỉ áp dụng cho đơn hàng >= 1.000.000đ) ---
      if (total >= 1000000) {
        if (userData.has_fido && userData.fido_credential_id) {
          statusLabel.innerText = "Đang yêu cầu xác thực sinh trắc học (FIDO2) trên thiết bị...";
          try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            const credentialIdBuffer = base64urlToBuffer(userData.fido_credential_id);
            await navigator.credentials.get({
              publicKey: {
                challenge: challenge,
                rpId: window.location.hostname,
                timeout: 60000,
                userVerification: "required",
                allowCredentials: [{ type: "public-key", id: credentialIdBuffer }]
              }
            });
          } catch (fidoErr) {
            console.error("Lỗi xác thực sinh trắc học:", fidoErr);
            alert("Xác thực vân tay/khuôn mặt thất bại hoặc bị hủy. Giao dịch bị khóa!");
            statusLabel.style.display = "none";
            btnVietQR.disabled = false;
            return;
          }
        } else {
          alert("Đơn hàng từ 1.000.000đ trở lên yêu cầu Xác thực đa yếu tố cấp cao (MFA Step-up). Vui lòng vào trang Hồ sơ để liên kết thiết bị bảo mật (FIDO2) trước!");
          window.location.href = "indexprofile.html";
          return;
        }
      }

      // 3. Tạo mã đơn và hiển thị QR VietQR
      const orderId = "CK" + Date.now().toString().slice(-6);
      const qrUrl = `https://img.vietqr.io/image/VCB-1034870787-compact.png?amount=${total}&addInfo=${orderId}&accountName=PHAM%20HUU%20PHUOC`;

      document.getElementById("vietqrImage").src = qrUrl;
      document.getElementById("vietqrTotal").innerText = total.toLocaleString() + "đ";
      document.getElementById("vietqrMemo").innerText = orderId;

      statusLabel.style.display = "none";
      document.getElementById("vietqrPaymentModal").style.display = "flex";

      // 4. Tự động xác nhận sau 10 giây (giả lập thanh toán thành công)
      const autoConfirmTimer = setTimeout(async () => {
        await finalizeOrder(user, userData, cartData, cartRef, orderId, total);
      }, 10000);

      // 5. Nút "Tôi đã chuyển khoản thành công" → xác nhận ngay
      document.getElementById("btnConfirmVietQR").onclick = async () => {
        clearTimeout(autoConfirmTimer);
        await finalizeOrder(user, userData, cartData, cartRef, orderId, total);
      };

      // 6. Nút hủy
      document.getElementById("btnCancelVietQR").onclick = () => {
        clearTimeout(autoConfirmTimer);
        document.getElementById("vietqrPaymentModal").style.display = "none";
        btnVietQR.disabled = false;
      };

    } catch (error) {
      console.error("Lỗi thanh toán:", error);
      alert("Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại!");
      statusLabel.style.display = "none";
      btnVietQR.disabled = false;
    }
  });
}

// Hàm hoàn tất đơn hàng (dùng chung cho auto-confirm và manual confirm)
async function finalizeOrder(user, userData, cartData, cartRef, orderId, total) {
  document.getElementById("vietqrPaymentModal").style.display = "none";
  const newOrder = {
    userId: user.uid,
    userName: userData.fullname,
    userPhone: userData.phone,
    orderId: orderId,
    items: cartData.items,
    totalAmount: total,
    date: new Date().toISOString(),
    status: "Hoàn tất",
  };
  await addDoc(collection(db, "orders"), newOrder);
  await updateDoc(cartRef, { items: [] });
  alert(`🎉 Thanh toán thành công! Mã đơn: ${orderId}`);
  window.location.href = "indexprofile.html";
}

// --- HÀM HIỂN THỊ VÀ XỬ LÝ MODAL EMAIL OTP KHI THANH TOÁN ---
function showCheckoutEmailOTPModal(correctOTP, email) {
  return new Promise((resolve) => {
    const modal = document.getElementById("checkoutTfaModal");
    const cancelBtn = document.getElementById("btnCancelCheckout2FA");
    const verifyBtn = document.getElementById("btnVerifyCheckout2FA");
    const hiddenInput = document.getElementById("checkoutOTPInput");
    const fields = document.querySelectorAll(".checkout-otp-field");

    // Reset các ô nhập
    fields.forEach(f => f.value = "");
    hiddenInput.value = "";
    modal.style.display = "flex";
    fields[0].focus();

    const handleInput = (e, index) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
      if (e.target.value.length >= 1 && index < fields.length - 1) {
        fields[index + 1].focus();
      }
      let code = "";
      fields.forEach((f) => (code += f.value));
      hiddenInput.value = code;
    };

    const handleKeyDown = (e, index) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        fields[index - 1].focus();
      }
    };

    const listeners = [];
    fields.forEach((field, index) => {
      const inputHandler = (e) => handleInput(e, index);
      const keyHandler = (e) => handleKeyDown(e, index);
      field.addEventListener("input", inputHandler);
      field.addEventListener("keydown", keyHandler);
      listeners.push({ field, inputHandler, keyHandler });
    });

    const cleanup = () => {
      listeners.forEach(({ field, inputHandler, keyHandler }) => {
        field.removeEventListener("input", inputHandler);
        field.removeEventListener("keydown", keyHandler);
      });
      modal.style.display = "none";
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    verifyBtn.onclick = () => {
      const code = hiddenInput.value;
      if (code.length !== 6) {
        alert("Vui lòng nhập đủ 6 chữ số!");
        return;
      }

      if (code === correctOTP) {
        cleanup();
        resolve(true);
      } else {
        alert("Mã OTP từ Email không chính xác! Vui lòng kiểm tra lại.");
      }
    };
  });
}

function base64urlToBuffer(base64url) {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

