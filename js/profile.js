import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

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
    const emailDisplay = document.getElementById("display-email");
    const initialDisplay = document.getElementById("big-initial");

    if (emailDisplay) emailDisplay.innerText = user.email;
    if (initialDisplay) initialDisplay.innerText = user.email.charAt(0).toUpperCase();

    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("profile-fullname").value = data.fullname || "";
      document.getElementById("profile-phone").value = data.phone || "";
      document.getElementById("profile-address").value = data.address || "";
      if (data.nearestStore) document.getElementById("nearest-store-select").value = data.nearestStore;
    }
  } else {
    window.location.href = "indexlogin.html";
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
        <div class="bill-item-card" style="border: 1px solid #eee; padding: 15px; border-radius: 10px; margin-bottom: 15px; background: #fafafa; text-align: left;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
                <span style="font-weight: bold; color: #df2027;">Mã đơn: ${bill.orderId}</span>
                <span style="font-size: 12px; color: #888;">${dateStr}</span>
            </div>
            <div style="margin: 10px 0;">
                ${bill.items.map((item) => `<div style="font-size: 14px;">• ${item.name} x${item.quantity}</div>`).join("")}
            </div>
            <div style="text-align: right; font-weight: bold; border-top: 1px solid #eee; padding-top: 5px;">
                Tổng: <span style="color: #df2027;">${Number(bill.totalAmount).toLocaleString()}đ</span>
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

      // Tải dữ liệu từ Firebase nếu chưa có
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
