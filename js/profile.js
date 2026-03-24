import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Cấu hình Firebase (Giữ nguyên của Phước)
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

// 1. Kiểm tra đăng nhập và Tải dữ liệu cũ
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("display-email").innerText = user.email;
    document.getElementById("big-initial").innerText = user.email.charAt(0).toUpperCase();

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById("profile-fullname").value = data.fullname || "";
      document.getElementById("profile-dob").value = data.dob || "";
      document.getElementById("profile-phone").value = data.phone || "";
      document.getElementById("profile-address").value = data.address || "";
    }
  } else {
    // Nếu thoát trang mà chưa login thì về trang đăng nhập
    window.location.href = "indexlogin.html";
  }
});

// 2. Xử lý nút Lưu thông tin
document.getElementById("btn-save-info").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  const userData = {
    fullname: document.getElementById("profile-fullname").value.trim(),
    dob: document.getElementById("profile-dob").value,
    phone: document.getElementById("profile-phone").value.trim(),
    address: document.getElementById("profile-address").value.trim(),
    email: user.email,
    updatedAt: new Date(),
  };

  try {
    await setDoc(doc(db, "users", user.uid), userData);
    alert("Thông tin của bạn đã được cập nhật!");
  } catch (error) {
    alert("Lỗi: " + error.message);
  }
});
