import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);

async function loadProducts() {
  const productList = document.getElementById("product-list");
  const title = document.getElementById("category-title");

  if (!productList) return;

  // Xác định loại dựa trên tên file html
  let category = "";
  let isAll = false;
  const path = window.location.pathname;

  if (path.includes("food.html")) {
    category = "Thức ăn";
    if (title) title.innerText = "DANH MỤC THỨC ĂN";
  } else if (path.includes("drink.html")) {
    category = "Thức uống";
    if (title) title.innerText = "DANH MỤC THỨC UỐNG";
  } else if (path.includes("menu.html") || path === "/" || path.includes("index.html")) {
    isAll = true;
    if (title) title.innerText = "THỨC ĂN & THỨC UỐNG TỔNG HỢP";
  }

  try {
    let q;
    // Gộp logic truy vấn: Nếu là trang menu tổng hợp thì lấy hết, nếu không thì lọc theo 'type'
    if (isAll) {
      q = query(collection(db, "inventory"));
    } else {
      q = query(collection(db, "inventory"), where("type", "==", category));
    }

    const snap = await getDocs(q);
    productList.innerHTML = "";

    if (snap.empty) {
      productList.innerHTML = `<p style='text-align:center; grid-column: 1/-1; padding: 50px;'>
                                Hiện chưa có sản phẩm nào trong mục ${category || "này"}.
                               </p>`;
      return;
    }

    snap.forEach((doc) => {
      const data = doc.data();
      const imgUrl = data.imageUrl || "https://via.placeholder.com/200x180?text=No+Image";

      // Chuyển đổi giá sang định dạng VNĐ, nếu không có giá thì để "Liên hệ"
      const priceDisplay = data.price ? `${Number(data.price).toLocaleString()}đ` : "Liên hệ";

      // Render: Đã loại bỏ dòng <span class="stock-info">
      productList.innerHTML += `
            <div class="product-item">
                <span class="pid-label">Mã: ${data.pid || "N/A"}</span>
                <div class="img-container">
                    <img src="${imgUrl}" alt="${data.name}">
                </div>
                <h3>${data.name}</h3>
                <p class="price-tag">${priceDisplay}</p>
                <button class="btn-add-cart" onclick="event.stopPropagation(); alert('Đã thêm ${data.name} vào giỏ!')">
                    Thêm vào giỏ
                </button>
            </div>
        `;
    });
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm:", error);
    productList.innerHTML = "<p>Đã xảy ra lỗi khi kết nối dữ liệu.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadProducts);
