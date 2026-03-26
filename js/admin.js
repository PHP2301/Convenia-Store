import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCmDCaoZC1B1cvb3vpGeLrxQjNYvrHfHHg",
  authDomain: "circlek-db.firebaseapp.com",
  projectId: "circlek-db",
  storageBucket: "circlek-db.appspot.com",
  messagingSenderId: "515751444593",
  appId: "1:515751444593:web:453df449a3b86f09f09bd0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const modal = document.getElementById("product-modal");
const openModalBtn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close-btn");
const productForm = document.getElementById("add-product-form");
const inventoryList = document.getElementById("inventory-list");
const branchFilter = document.getElementById("branch-filter");

// --- 2. HÀM NÉN ẢNH (GIÚP TẢI LÊN SIÊU NHANH) ---
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500; // Giới hạn chiều rộng ảnh để giảm dung lượng
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Xuất ra file JPEG chất lượng 0.7 (nhẹ hơn 10-20 lần file gốc)
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
      };
    };
  });
}

// Đóng mở Modal
if (openModalBtn) openModalBtn.onclick = () => (modal.style.display = "block");
if (closeBtn) closeBtn.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target == modal) modal.style.display = "none";
};

// --- 3. LOAD DỮ LIỆU ---
async function loadInventory() {
  const selectedBranch = branchFilter.value;
  inventoryList.innerHTML = `<tr><td colspan="7" style="text-align:center">Đang tải dữ liệu...</td></tr>`;
  try {
    const q = query(collection(db, "inventory"), where("branch", "==", selectedBranch));
    const snap = await getDocs(q);
    inventoryList.innerHTML = "";
    if (snap.empty) {
      inventoryList.innerHTML = `<tr><td colspan="7" style="text-align:center">Chi nhánh trống.</td></tr>`;
      return;
    }
    snap.forEach((doc) => {
      const item = doc.data();
      const imgUrl = item.imageUrl || "https://via.placeholder.com/50";
      inventoryList.innerHTML += `
                <tr>
                    <td>${item.pid}</td>
                    <td style="text-align:center"><img src="${imgUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"></td>
                    <td>${item.name}</td>
                    <td>${item.type}</td>
                    <td>${item.stock}</td>
                    <td>${item.unit}</td>
                    <td><button class="btn-in">Nhập</button> <button class="btn-out">Xuất</button></td>
                </tr>`;
    });
  } catch (e) {
    console.error(e);
  }
}

// --- 4. XỬ LÝ LƯU (FIX LỖI TREO VÀ MẠNG CHẬM) ---
productForm.onsubmit = async (e) => {
  e.preventDefault();
  const submitBtn = productForm.querySelector(".btn-save");
  const file = document.getElementById("p-image").files[0];

  submitBtn.innerText = "Đang nén & tải lên...";
  submitBtn.disabled = true;

  try {
    let imageUrl = "";

    if (file) {
      // BƯỚC 1: NÉN ẢNH
      const compressedFile = await compressImage(file);
      const storageRef = ref(storage, `products/${Date.now()}_ck.jpg`);
      const metadata = { contentType: "image/jpeg" };

      // BƯỚC 2: TẢI LÊN VỚI TIMEOUT 15 GIÂY
      const uploadPromise = uploadBytes(storageRef, compressedFile, metadata);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Mạng quá chậm, hệ thống sẽ lưu thông tin trước!")), 15000),
      );

      try {
        const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (uploadError) {
        console.warn("Bỏ qua ảnh do lỗi mạng:", uploadError.message);
        alert(uploadError.message);
        // Không 'throw' ở đây để code tiếp tục lưu phần chữ vào Firestore
      }
    }

    // BƯỚC 3: LƯU VÀO FIRESTORE (Luôn thực hiện)
    await addDoc(collection(db, "inventory"), {
      pid: document.getElementById("p-id").value.trim(),
      name: document.getElementById("p-name").value.trim(),
      type: document.getElementById("p-type").value,
      stock: Number(document.getElementById("p-stock").value),
      unit: document.getElementById("p-unit").value.trim(),
      imageUrl: imageUrl, // Sẽ có link nếu up được, hoặc để trống nếu mạng lỗi
      branch: branchFilter.value,
      createdAt: serverTimestamp(),
    });

    alert("Đã lưu dữ liệu thành công!");
    modal.style.display = "none";
    productForm.reset();
    loadInventory();
  } catch (error) {
    console.error("Lỗi:", error);
    alert("Lỗi: " + error.message);
  } finally {
    submitBtn.innerText = "LƯU VÀO KHO";
    submitBtn.disabled = false;
  }
};

branchFilter.onchange = loadInventory;
document.addEventListener("DOMContentLoaded", loadInventory);
