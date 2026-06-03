import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
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

// Kiểm tra quyền Admin và 2FA
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "indexlogin.html";
    return;
  }
  
  try {
    const userDocSnap = await getDoc(doc(db, "users", user.uid));
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.tfa_secret) {
        const isVerified = sessionStorage.getItem("tfa_verified_" + user.uid) === "true" ||
                           localStorage.getItem("tfa_verified_" + user.uid) === "true";
        if (!isVerified) {
          // Chưa xác thực 2FA, đăng xuất và quay lại trang login
          await auth.signOut();
          window.location.href = "indexlogin.html";
        }
      }
    }
  } catch (err) {
    console.error("Lỗi xác thực 2FA:", err);
  }
});

// 1. TỰ ĐỘNG TẠO MÃ PID
async function updateAutoPID() {
  if (currentEditId) return;
  try {
    const snap = await getDocs(collection(db, "inventory"));
    const nextPID = `PID${(snap.size + 1).toString().padStart(3, "0")}`;
    document.getElementById("p-id").value = nextPID;
  } catch (e) {
    console.error(e);
  }
}

// 2. NÉN ẢNH
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
      };
    };
  });
}

// 3. ĐỊNH DẠNG GIÁ
if (priceInput) {
  priceInput.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "");
    e.target.value = val !== "" ? Number(val).toLocaleString("en-US") : "";
  });
}

// 4. ĐÓNG MỞ MODAL
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

// 5. MỞ MODAL SỬA
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

// 6. XỬ LÝ XÓA VỚI TÊN SẢN PHẨM
window.deleteProduct = function (docId, productName) {
  Swal.fire({
    title: "Xác nhận xóa?",
    html: `Bạn có chắc muốn xóa sản phẩm <br><b style="color:#df2027">${productName}</b>?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#df2027",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Vâng, xóa nó!",
    cancelButtonText: "Hủy bỏ",
    reverseButtons: true,
  }).then((result) => {
    if (result.isConfirmed) {
      executeDelete(docId);
    }
  });
};

async function executeDelete(id) {
  try {
    await deleteDoc(doc(db, "inventory", id));
    Swal.fire({
      title: "Đã xóa!",
      text: "Sản phẩm đã biến mất khỏi kho.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
    loadInventory();
  } catch (error) {
    Swal.fire("Lỗi!", "Không thể xóa sản phẩm này.", "error");
  }
}

// 7. LOAD DỮ LIỆU (Cập nhật data-label và căn chỉnh nút)
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

      row.innerHTML = `
        <td data-label="ID">${item.pid}</td>
        <td data-label="Hình ảnh" style="text-align:center">
            <img src="${item.imageUrl || "img/default.png"}" style="width:45px;height:45px;object-fit:cover;border-radius:6px;">
        </td>
        <td data-label="Sản phẩm"><strong>${item.name}</strong></td>
        <td data-label="Loại">${item.type}</td>
        <td data-label="Tồn kho" style="font-weight:bold" class="stock-cell">${item.stock} ${item.unit}</td>
        <td data-label="Giá bán" class="price-cell">${Number(item.price || 0).toLocaleString()}đ</td>
        <td data-label="Đơn vị">${item.unit}</td>
        <td data-label="Hành động">
            <div class="action-buttons">
                <button onclick="openEditModal('${docId}', ${JSON.stringify(item).replace(/"/g, "&quot;")})" 
                        class="btn-edit-row" title="Sửa">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct('${docId}', '${item.name.replace(/'/g, "\\'")}')" 
                        class="btn-delete-row" title="Xóa">
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

// 8. XỬ LÝ LƯU (THÊM & SỬA)
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
      await addDoc(collection(db, "inventory_logs"), {
        productName: pName,
        quantity: newStock,
        type: "Nhập kho",
        branch: branch,
        userName: user.email,
        timestamp: serverTimestamp(),
      });
    }

    Swal.fire("Thành công", "Dữ liệu kho đã được cập nhật!", "success");
    modal.style.display = "none";
    productForm.reset();
    loadInventory();
  } catch (error) {
    Swal.fire("Lỗi", error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "LƯU VÀO KHO";
  }
};

branchFilter.onchange = loadInventory;
document.addEventListener("DOMContentLoaded", loadInventory);

// ĐÓNG MODAL BẰNG ESC VÀ CLICK NGOÀI
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.style.display === "block") {
    modal.style.display = "none";
    productForm.reset();
  }
});

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    productForm.reset();
  }
};
