import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// THAY THẾ ĐOẠN NÀY BẰNG CONFIG CỦA BẠN
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

// Hàm lưu dữ liệu
async function saveToFirebase() {
  const emailInput = document.getElementById("customerEmail");
  const emailValue = emailInput.value;

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
    emailInput.value = ""; // Xóa trống ô nhập sau khi gửi
  } catch (e) {
    console.error("Lỗi: ", e);
    alert("Có lỗi xảy ra, vui lòng thử lại.");
  }
}

// Đẩy hàm ra window để HTML nhận diện được
window.saveToFirebase = saveToFirebase;
