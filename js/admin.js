import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
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
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
const auth = getAuth(app);

const modal = document.getElementById("product-modal");
const openModalBtn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close-btn");
const productForm = document.getElementById("add-product-form");
const inventoryList = document.getElementById("inventory-list");
const branchFilter = document.getElementById("branch-filter");
const modalTitle = document.querySelector(".modal-content h3");
const priceInput = document.getElementById("p-price");

let currentEditId = null;

// Kiểm tra quyền Admin (Chỉ Phước mới vào được)
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "indexlogin.html";
  }
});

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

// --- 3. ĐỊNH DẠNG GIÁ TIỀN ---
if (priceInput) {
  priceInput.addEventListener("input", function (e) {
    let value = e.target.value.replace(/\D/g, "");
    e.target.value = value !== "" ? Number(value).toLocaleString("en-US") : "";
  });
}

// --- 4. ĐÓNG MỞ MODAL ---
if (openModalBtn) {
  openModalBtn.onclick = () => {
    currentEditId = null;
    modalTitle.innerHTML = '<i class="fas fa-cart-plus"></i> THÊM SẢN PHẨM MỚI';
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

// --- 5. HÀM ĐỔ DỮ LIỆU ĐỂ SỬA ---
window.openEditModal = (docId, data) => {
  currentEditId = docId;
  modalTitle.innerHTML = '<i class="fas fa-edit"></i> CHỈNH SỬA SẢN PHẨM';
  document.getElementById("p-id").value = data.pid;
  document.getElementById("p-name").value = data.name;
  document.getElementById("p-type").value = data.type;
  document.getElementById("p-stock").value = data.stock;
  document.getElementById("p-unit").value = data.unit;
  priceInput.value = data.price ? Number(data.price).toLocaleString("en-US") : 0;
  modal.style.display = "block";
};

// --- 6. HÀM XỬ LÝ XÓA ---
window.deleteProduct = async (docId, imageUrl, pName) => {
  if (confirm(`Bạn có chắc muốn xóa [${pName}] khỏi kho không?`)) {
    try {
      await deleteDoc(doc(db, "inventory", docId));
      if (imageUrl && imageUrl.includes("firebase")) {
        try {
          await deleteObject(ref(storage, imageUrl));
        } catch (e) {}
      }

      // Ghi log hành động xóa
      await addDoc(collection(db, "inventory_logs"), {
        productName: pName,
        quantity: 0,
        type: "Xóa sản phẩm",
        branch: branchFilter.value,
        userName: auth.currentUser.email,
        timestamp: serverTimestamp(),
      });

      alert("Đã xóa và ghi lịch sử!");
      loadInventory();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  }
};

// --- 7. LOAD DỮ LIỆU ---
async function loadInventory() {
  const selectedBranch = branchFilter.value;
  inventoryList.innerHTML = `<tr><td colspan="8" style="text-align:center">Đang quét kho...</td></tr>`;
  try {
    const q = query(collection(db, "inventory"), where("branch", "==", selectedBranch));
    const snap = await getDocs(q);
    inventoryList.innerHTML = "";
    snap.forEach((docSnap) => {
      const item = docSnap.data();
      const docId = docSnap.id;
      const row = document.createElement("tr");
      // Tìm trong hàm loadInventory, đoạn render các nút hành động:
      row.innerHTML = `
    <td>${item.pid}</td>
    <td style="text-align:center"><img src="${item.imageUrl || ""}" style="width:40px;height:40px;border-radius:4px;"></td>
    <td>${item.name}</td>
    <td>${item.type}</td>
    <td style="font-weight:bold">${item.stock}</td>
    <td>${Number(item.price || 0).toLocaleString()}đ</td>
    <td>${item.unit}</td>
    <td>
        <div class="action-buttons">
            <button onclick="openEditModal('${docId}', ${JSON.stringify(item).replace(/"/g, "&quot;")})" 
                    class="btn-edit-row" title="Chỉnh sửa">
                <i class="fas fa-edit"></i>
            </div>
            
            <button onclick="deleteProduct('${docId}', '${item.imageUrl}', '${item.name}')" 
                    class="btn-delete-row" title="Xóa sản phẩm">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    </td>`;
      inventoryList.appendChild(row);
    });
  } catch (e) {
    console.error(e);
  }
}

// --- 8. XỬ LÝ LƯU (THÊM & SỬA) + GHI LOG REALTIME ---
productForm.onsubmit = async (e) => {
  e.preventDefault();
  const submitBtn = productForm.querySelector(".btn-save");
  const file = document.getElementById("p-image").files[0];
  const user = auth.currentUser;

  submitBtn.disabled = true;
  submitBtn.innerText = "ĐANG LƯU...";

  try {
    let oldStock = 0;
    if (currentEditId) {
      const oldDoc = await getDoc(doc(db, "inventory", currentEditId));
      if (oldDoc.exists()) oldStock = oldDoc.data().stock || 0;
    }

    let imageUrl = "";
    if (file) {
      const compressedFile = await compressImage(file);
      const storageRef = ref(storage, `products/${Date.now()}_ck.jpg`);
      const snapshot = await uploadBytes(storageRef, compressedFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const newStock = Number(document.getElementById("p-stock").value);
    const pName = document.getElementById("p-name").value.trim();
    const branch = branchFilter.value;

    const productData = {
      pid: document.getElementById("p-id").value,
      name: pName,
      type: document.getElementById("p-type").value,
      stock: newStock,
      price: Number(priceInput.value.replace(/,/g, "")) || 0,
      unit: document.getElementById("p-unit").value,
      branch: branch,
      updatedAt: serverTimestamp(),
    };
    if (imageUrl) productData.imageUrl = imageUrl;

    if (currentEditId) {
      await updateDoc(doc(db, "inventory", currentEditId), productData);
      // Ghi log nếu có thay đổi số lượng
      if (newStock !== oldStock) {
        const diff = newStock - oldStock;
        await addDoc(collection(db, "inventory_logs"), {
          productName: pName,
          quantity: Math.abs(diff),
          type: diff > 0 ? "Nhập kho" : "Xuất kho",
          branch: branch,
          userName: user.email,
          timestamp: serverTimestamp(),
        });
      }
    } else {
      productData.createdAt = serverTimestamp();
      await addDoc(collection(db, "inventory"), productData);
      // Ghi log nhập mới
      await addDoc(collection(db, "inventory_logs"), {
        productName: pName,
        quantity: newStock,
        type: "Nhập kho",
        branch: branch,
        userName: user.email,
        timestamp: serverTimestamp(),
      });
    }

    alert("Thao tác thành công!");
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
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Kiểm tra nếu Modal đang hiển thị thì mới thực hiện đóng
    const modal = document.getElementById("product-modal");
    if (modal && modal.style.display === "block") {
      modal.style.display = "none";

      // Nếu có form bên trong thì reset luôn cho sạch dữ liệu
      const productForm = document.getElementById("add-product-form");
      if (productForm) productForm.reset();

      console.log("Đã đóng Modal bằng phím Esc");
    }
  }
});
window.onclick = (e) => {
  const modal = document.getElementById("product-modal");
  if (e.target === modal) {
    modal.style.display = "none";
    document.getElementById("add-product-form").reset();
  }
};
