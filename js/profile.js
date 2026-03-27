import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// --- DANH SÁCH TỌA ĐỘ CÁC CHI NHÁNH ---
const stores = [
  { id: "ngt", name: "Nguyễn Gia Trí", lat: 10.801943, lng: 106.711524 },
  { id: "nvt", name: "Nguyễn Văn Thương", lat: 10.803522, lng: 106.710123 },
  { id: "dbp", name: "Điện Biên Phủ", lat: 10.799821, lng: 106.70521 },
  { id: "nhc", name: "Nguyễn Hữu Cảnh", lat: 10.791234, lng: 106.708567 },
];

// Hàm tính khoảng cách (Công thức Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 1. Kiểm tra đăng nhập và Tải dữ liệu
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("display-email").innerText = user.email;
    document.getElementById("big-initial").innerText = user.email.charAt(0).toUpperCase();

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("profile-fullname").value = data.fullname || "";
      document.getElementById("profile-phone").value = data.phone || "";
      document.getElementById("profile-address").value = data.address || "";
      if (data.nearestStore) {
        document.getElementById("nearest-store-select").value = data.nearestStore;
      }
    }
  } else {
    window.location.href = "indexlogin.html";
  }
});

// 2. Xử lý Định vị (Geolocation)
document.getElementById("btn-get-location").addEventListener("click", () => {
  const display = document.getElementById("user-location-display");
  display.value = "Đang xác định vị trí...";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const uLat = position.coords.latitude;
        const uLng = position.coords.longitude;

        let minDistance = Infinity;
        let closestStore = null;

        stores.forEach((store) => {
          const dist = getDistance(uLat, uLng, store.lat, store.lng);
          if (dist < minDistance) {
            minDistance = dist;
            closestStore = store;
          }
        });

        if (closestStore) {
          document.getElementById("nearest-store-select").value = closestStore.id;
          display.value = `Gần nhất: ${closestStore.name} (${minDistance.toFixed(2)} km)`;
        }
      },
      () => {
        display.value = "";
        alert("Lỗi: Vui lòng cho phép truy cập vị trí!");
      },
    );
  } else {
    alert("Trình duyệt không hỗ trợ định vị!");
  }
});

// 3. Xử lý nút Lưu thông tin
document.getElementById("profile-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // Chống load lại trang
  const user = auth.currentUser;
  if (!user) return;

  const btnSave = document.getElementById("btn-save-info");
  btnSave.innerText = "ĐANG LƯU...";
  btnSave.disabled = true;

  const userData = {
    fullname: document.getElementById("profile-fullname").value.trim(),
    phone: document.getElementById("profile-phone").value.trim(),
    nearestStore: document.getElementById("nearest-store-select").value,
    address: document.getElementById("profile-address").value.trim(),
    email: user.email,
    updatedAt: new Date(),
  };

  try {
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    alert("Thông tin hồ sơ đã được lưu thành công!");
  } catch (error) {
    alert("Lỗi: " + error.message);
  } finally {
    btnSave.innerText = "LƯU THÔNG TIN";
    btnSave.disabled = false;
  }
});

// 4. Xử lý Đăng xuất
document.getElementById("btn-logout").addEventListener("click", () => {
  if (confirm("Bạn có muốn đăng xuất?")) {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    });
  }
});
