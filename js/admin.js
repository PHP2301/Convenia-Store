import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

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
const storage = getStorage(app);

const modal = document.getElementById("product-modal");
const openModalBtn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close-btn");
const productForm = document.getElementById("add-product-form");
const inventoryList = document.getElementById("inventory-list");
const branchFilter = document.getElementById("branch-filter");
const modalTitle = document.querySelector(".modal-content h3");
const priceInput = document.getElementById("p-price");

let currentEditId = null;

// --- 1. HÀM TỰ ĐỘNG TẠO MÃ PID ---
async function updateAutoPID() {
  if (currentEditId) return;
  try {
    const snap = await getDocs(collection(db, "inventory"));
    const count = snap.size;
    const nextPID = `PID${(count + 1).toString().padStart(3, "0")}`;
    document.getElementById("p-id").value = nextPID;
  } catch (e) {
    console.error("Lỗi PID:", e);
  }
}

// --- 2. HÀM NÉN ẢNH ---
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
      };
    };
  });
}

// --- 3. ĐỊNH DẠNG GIÁ TIỀN KHI GÕ ---
if (priceInput) {
  priceInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    if (value !== "") {
      e.target.value = Number(value).toLocaleString("en-US");
    } else {
      e.target.value = "";
    }
  });
}

// --- 4. ĐÓNG MỞ MODAL ---
if (openModalBtn) {
  openModalBtn.onclick = () => {
    currentEditId = null;
    modalTitle.innerHTML = '<i class="fas fa-cart-plus"></i> THÊM SẢN PHẨM';
    productForm.reset();
    updateAutoPID();
    modal.style.display = "block";
  };
}

if (closeBtn) {
  closeBtn.onclick = () => {
    modal.style.display = "none";
    productForm.reset();
  };
}

// Đóng khi click ra ngoài hoặc nhấn Esc
window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    productForm.reset();
  }
};

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.style.display === "block") {
    modal.style.display = "none";
    productForm.reset();
  }
});

// --- 5. HÀM ĐỔ DỮ LIỆU ĐỂ SỬA ---
window.openEditModal = (docId, data) => {
  currentEditId = docId;
  modalTitle.innerHTML = '<i class="fas fa-edit"></i> CHỈNH SỬA SẢN PHẨM';

  document.getElementById("p-id").value = data.pid;
  document.getElementById("p-name").value = data.name;
  document.getElementById("p-type").value = data.type;
  document.getElementById("p-stock").value = data.stock;
  document.getElementById("p-unit").value = data.unit;

  // Định dạng lại giá tiền có dấu phẩy khi hiển thị trong modal sửa
  if (data.price) {
    priceInput.value = Number(data.price).toLocaleString("en-US");
  } else {
    priceInput.value = 0;
  }

  modal.style.display = "block";
};

// --- 6. HÀM XỬ LÝ XÓA ---
window.deleteProduct = async (docId, imageUrl) => {
  if (confirm("Xóa sản phẩm này?")) {
    try {
      await deleteDoc(doc(db, "inventory", docId));
      if (imageUrl && imageUrl.includes("firebase")) {
        try {
          await deleteObject(ref(storage, imageUrl));
        } catch (e) {}
      }
      alert("Đã xóa thành công!");
      loadInventory();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  }
};

// --- 7. LOAD DỮ LIỆU ---
async function loadInventory() {
  const selectedBranch = branchFilter.value;
  inventoryList.innerHTML = `<tr><td colspan="8" style="text-align:center">Đang tải...</td></tr>`;
  try {
    const q = query(collection(db, "inventory"), where("branch", "==", selectedBranch));
    const snap = await getDocs(q);
    inventoryList.innerHTML = "";

    snap.forEach((docSnap) => {
      const item = docSnap.data();
      const docId = docSnap.id;
      const imgUrl = item.imageUrl || "https://via.placeholder.com/50";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.pid}</td>
        <td style="text-align:center"><img src="${imgUrl}" style="width:45px;height:45px;object-fit:cover;border-radius:4px;"></td>
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td class="stock-cell">${item.stock}</td>
        <td class="price-cell">${Number(item.price || 0).toLocaleString()}đ</td>
        <td>${item.unit}</td>
        <td>
            <div class="action-buttons">
                <button class="btn-edit-row" onclick="openEditModal('${docId}', ${JSON.stringify(item).replace(/"/g, "&quot;")})" style="background:#4CAF50; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-row" onclick="deleteProduct('${docId}', '${item.imageUrl || ""}')" style="background:#ff4d4d; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer; margin-left:5px;"><i class="fas fa-trash"></i></button>
            </div>
        </td>
      `;
      inventoryList.appendChild(row);
    });
  } catch (e) {
    console.error(e);
  }
}

// --- 8. XỬ LÝ LƯU (THÊM & SỬA) ---
productForm.onsubmit = async (e) => {
  e.preventDefault();
  const submitBtn = productForm.querySelector(".btn-save");
  const file = document.getElementById("p-image").files[0];

  submitBtn.disabled = true;
  submitBtn.innerText = "ĐANG XỬ LÝ...";

  try {
    let imageUrl = "";
    if (file) {
      const compressedFile = await compressImage(file);
      const storageRef = ref(storage, `products/${Date.now()}_ck.jpg`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // LẤY GIÁ TRỊ GIÁ TIỀN: Xóa bỏ dấu phẩy trước khi chuyển thành Number
    const rawPrice = priceInput.value.replace(/,/g, "");
    const priceValue = Number(rawPrice) || 0;

    const productData = {
      pid: document.getElementById("p-id").value,
      name: document.getElementById("p-name").value.trim(),
      type: document.getElementById("p-type").value,
      stock: Number(document.getElementById("p-stock").value),
      price: priceValue, // Lưu con số "sạch" vào kho
      unit: document.getElementById("p-unit").value,
      branch: branchFilter.value,
      updatedAt: serverTimestamp(),
    };

    if (imageUrl) productData.imageUrl = imageUrl;

    if (currentEditId) {
      await updateDoc(doc(db, "inventory", currentEditId), productData);
      alert("Cập nhật thành công!");
    } else {
      productData.createdAt = serverTimestamp();
      await addDoc(collection(db, "inventory"), productData);
      alert("Thêm vào kho thành công!");
    }

    modal.style.display = "none";
    productForm.reset();
    loadInventory();
  } catch (error) {
    alert("Lỗi: " + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "LƯU VÀO KHO";
  }
};

branchFilter.onchange = loadInventory;
document.addEventListener("DOMContentLoaded", loadInventory);
