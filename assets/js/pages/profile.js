import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from "../core/api-client.js";

const stores = [
  { id: "ngt", name: "Nguyễn Gia Trí", lat: 10.801943, lng: 106.711524 },
  { id: "nvt", name: "Nguyễn Văn Thương", lat: 10.803522, lng: 106.710123 },
  { id: "dbp", name: "Điện Biên Phủ", lat: 10.799821, lng: 106.70521 },
  { id: "nhc", name: "Nguyễn Hữu Cảnh", lat: 10.791234, lng: 106.708567 },
];

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 1. Tải dữ liệu người dùng khi trang load
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Kiểm tra 2FA
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.tfa_secret) {
          const isVerified = sessionStorage.getItem("tfa_verified_" + user.uid) === "true" ||
                             localStorage.getItem("tfa_verified_" + user.uid) === "true";
          if (!isVerified) {
            await signOut(auth);
            window.location.href = "login.html";
            return;
          }
        }
        document.getElementById("profile-fullname").value = data.fullname || "";
        document.getElementById("profile-phone").value = data.phone || "";
        document.getElementById("profile-address").value = data.address || "";
        if (data.nearestStore) document.getElementById("nearest-store-select").value = data.nearestStore;

        // Hiển thị trạng thái FIDO2
        if (data.has_fido) {
          const statusText = document.getElementById("fido-status-text");
          if (statusText) {
            statusText.style.display = "block";
            statusText.innerText = "Thiết bị này đã kích hoạt FIDO2 thành công!";
            statusText.style.color = "#28a745";
          }
        }

        // Hiển thị nút vào trang admin nếu có quyền admin
        if (data.role === "admin") {
          const adminBtn = document.getElementById("admin-panel-btn");
          if (adminBtn) adminBtn.style.display = "flex";
        }
      }
    } catch (err) {
      console.error("Lỗi xác thực 2FA:", err);
    }

    const emailDisplay = document.getElementById("display-email");
    const initialDisplay = document.getElementById("big-initial");

    if (emailDisplay) emailDisplay.innerText = user.email;
    if (initialDisplay) initialDisplay.innerText = user.email.charAt(0).toUpperCase();

  } else {
    window.location.href = "login.html";
  }
});

// 2. Hàm hiển thị lịch sử hóa đơn
async function displayOrderHistory(uid) {
  const listContainer = document.getElementById("bill-history-list");
  if (!listContainer) return;

  try {
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    let html = "";

    if (querySnapshot.empty) {
      listContainer.innerHTML = "<p style='text-align:center; padding: 20px;'>Bạn chưa có giao dịch nào.</p>";
      return;
    }

    querySnapshot.forEach((doc) => {
      const bill = doc.data();
      const dateStr = new Date(bill.date).toLocaleString("vi-VN");
      html += `
        <div class="bill-item-card">
            <div class="bill-header">
                <span class="bill-id">Mã đơn: ${bill.orderId}</span>
                <span class="bill-date">${dateStr}</span>
            </div>
            <div class="bill-items">
                ${bill.items.map((item) => `
                    <div class="bill-item-row">
                        <span class="bill-item-name">${item.name}</span>
                        <span class="bill-item-qty">x${item.quantity}</span>
                    </div>
                `).join("")}
            </div>
            <div class="bill-footer">
                <span>Tổng:</span>
                <span class="bill-total">${Number(bill.totalAmount).toLocaleString()}đ</span>
            </div>
        </div>`;
    });
    listContainer.innerHTML = html;
  } catch (error) {
    console.error("Lỗi tải lịch sử:", error);
    listContainer.innerHTML = "<p>Không thể tải lịch sử lúc này.</p>";
  }
}

// 3. Xử lý sự kiện nút bấm Lịch sử (Đã gộp và tối ưu cho Mobile)
const btnShowHistory = document.getElementById("btn-show-history");
const historyAside = document.getElementById("history-aside");
const arrowIcon = document.getElementById("arrow-icon");

if (btnShowHistory && historyAside) {
  btnShowHistory.addEventListener("click", async (e) => {
    e.preventDefault(); // Tránh lỗi submit form trên Mobile

    const isHidden = window.getComputedStyle(historyAside).display === "none";

    if (isHidden) {
      // Hiện khung lịch sử
      historyAside.style.setProperty("display", "block", "important");
      if (arrowIcon) arrowIcon.className = "fas fa-chevron-left";

      // Cuộn xuống vùng lịch sử trên điện thoại
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          historyAside.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }

      // Tải dữ liệu từ cơ sở dữ liệu nếu chưa có
      const listContainer = document.getElementById("bill-history-list");
      if (listContainer && (listContainer.innerHTML.includes("Đang tải") || listContainer.innerHTML === "")) {
        const user = auth.currentUser;
        if (user) await displayOrderHistory(user.uid);
      }
    } else {
      // Ẩn khung lịch sử
      historyAside.style.display = "none";
      if (arrowIcon) arrowIcon.className = "fas fa-chevron-right";
    }
  });
}

// 4. Các sự kiện khác
// Lấy vị trí hiện tại
document.getElementById("btn-get-location")?.addEventListener("click", () => {
  const display = document.getElementById("user-location-display");
  if (display) display.value = "Đang quét...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let min = Infinity,
          closest = null;
        stores.forEach((s) => {
          const d = getDistance(pos.coords.latitude, pos.coords.longitude, s.lat, s.lng);
          if (d < min) {
            min = d;
            closest = s;
          }
        });
        if (closest) {
          document.getElementById("nearest-store-select").value = closest.id;
          display.value = `Gần nhất: ${closest.name} (${min.toFixed(2)} km)`;
        }
      },
      () => {
        alert("Không thể lấy vị trí. Vui lòng bật định vị!");
        display.value = "";
      },
    );
  }
});

// Lưu thông tin hồ sơ
document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const btnSave = document.getElementById("btn-save-info");
  if (btnSave) {
    btnSave.innerText = "ĐANG LƯU...";
    btnSave.disabled = true;
  }

  const data = {
    fullname: document.getElementById("profile-fullname").value,
    phone: document.getElementById("profile-phone").value,
    nearestStore: document.getElementById("nearest-store-select").value,
    address: document.getElementById("profile-address").value,
    updatedAt: new Date(),
  };

  try {
    await setDoc(doc(db, "users", user.uid), data, { merge: true });
    localStorage.setItem("selected_store", data.nearestStore);
    alert("Đã lưu hồ sơ thành công!");
  } catch (err) {
    alert("Lỗi khi lưu: " + err.message);
  } finally {
    if (btnSave) {
      btnSave.innerText = "LƯU THÔNG TIN";
      btnSave.disabled = false;
    }
  }
});

// Đăng xuất
document.getElementById("btn-logout")?.addEventListener("click", () => {
  if (confirm("Xác nhận đăng xuất?")) {
    signOut(auth).then(() => (window.location.href = "index.html"));
  }
});

// --- FIDO2 WEBAUTHN REGISTRATION ---
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

async function registerFIDO() {
  const user = auth.currentUser;
  if (!user) return alert("Vui lòng đăng nhập!");

  if (!window.PublicKeyCredential) {
    alert("Trình duyệt hoặc ứng dụng hiện tại (ví dụ: Zalo, Facebook, Messenger) không hỗ trợ FIDO2/WebAuthn. Vui lòng nhấn vào nút ba chấm ở góc trên cùng bên phải màn hình rồi chọn 'Mở bằng Safari' (trên iPhone) hoặc 'Mở bằng Chrome' (trên Android) để thực hiện!");
    return;
  }

  try {
    const statusText = document.getElementById("fido-status-text");
    if (statusText) {
      statusText.style.display = "block";
      statusText.innerText = "Đang kích hoạt khóa bảo mật...";
      statusText.style.color = "#888";
    }

    // 1. Tạo challenge ngẫu nhiên
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // 2. Tạo User ID dưới dạng ArrayBuffer từ UID
    const userIdBuffer = new TextEncoder().encode(user.uid);

    const registrationOptions = {
      publicKey: {
        challenge: challenge,
        rp: {
          name: "Circle K",
          id: window.location.hostname
        },
        user: {
          id: userIdBuffer,
          name: user.email,
          displayName: user.email
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 } // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          userVerification: "required",
          residentKey: "required"
        }
      }
    };

    const credential = await navigator.credentials.create(registrationOptions);
    const credentialId = bufferToBase64url(credential.rawId);

    // Yêu cầu nhập mật khẩu để xác minh danh tính và lưu lại phục vụ đăng nhập không mật khẩu
    const confirmPassword = prompt("Nhập mật khẩu hiện tại của bạn để liên kết thiết bị bảo mật này:");
    if (!confirmPassword) {
      if (statusText) {
        statusText.innerText = "Liên kết thất bại: Bạn chưa xác nhận mật khẩu.";
        statusText.style.color = "#df2027";
      }
      return;
    }

    if (statusText) {
      statusText.innerText = "Đang kiểm tra mật khẩu...";
    }

    try {
      // Xác minh mật khẩu nhập vào bằng cách thử sign in lại
      await signInWithEmailAndPassword(auth, user.email, confirmPassword);
    } catch (passErr) {
      alert("Xác nhận mật khẩu thất bại! Vui lòng điền đúng mật khẩu tài khoản của bạn.");
      if (statusText) {
        statusText.innerText = "Liên kết thất bại: Sai mật khẩu xác nhận.";
        statusText.style.color = "#df2027";
      }
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      fido_credential_id: credentialId,
      fido_password: confirmPassword, // Lưu mật khẩu thật của user để sign in sau này
      has_fido: true
    }, { merge: true });

    if (statusText) {
      statusText.innerText = "Thiết bị này đã kích hoạt FIDO2 thành công!";
      statusText.style.color = "#28a745";
    }
    alert("Đã kết nối thiết bị bảo mật (FIDO2) thành công!");
  } catch (err) {
    console.error("Lỗi FIDO2:", err);
    const statusText = document.getElementById("fido-status-text");
    if (statusText) {
      if (err.name === "NotAllowedError") {
        statusText.innerText = "Thao tác bị hủy hoặc trình duyệt không được cấp quyền sinh trắc học.";
      } else {
        statusText.innerText = "Lỗi kích hoạt: " + err.message;
      }
      statusText.style.color = "#df2027";
    }
    alert("Kích hoạt sinh trắc học thất bại. Vui lòng đảm bảo bạn đang sử dụng trình duyệt Safari hoặc Chrome gốc và thiết bị đã bật bảo mật!");
  }
}

document.getElementById("btn-register-fido")?.addEventListener("click", registerFIDO);
