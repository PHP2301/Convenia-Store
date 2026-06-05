import {
  db,
  storage,
  auth,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  onAuthStateChanged
} from "../core/api-client.js";

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
    window.location.href = "login.html";
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
          window.location.href = "login.html";
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

// --- QUẢN LÝ FLASH SALE TIMER SETTING ---
async function loadFlashSaleTimerSetting() {
  const timerInput = document.getElementById("flash-timer-input");
  const timerDisplay = document.getElementById("db-timer-value");
  if (!timerInput || !timerDisplay) return;

  try {
    const docRef = doc(db, "settings", "flash_sale");
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().endTime) {
      const endTime = parseInt(snap.data().endTime);
      const date = new Date(endTime);
      
      const tzoffset = date.getTimezoneOffset() * 60000; 
      const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
      
      timerInput.value = localISOTime;
      timerDisplay.innerText = date.toLocaleString("vi-VN");
    } else {
      timerDisplay.innerText = "Chưa thiết lập";
    }
  } catch (err) {
    console.error("Lỗi khi load cấu hình bộ đếm:", err);
    timerDisplay.innerText = "Lỗi khi tải";
  }
}

// Bind button save
document.addEventListener("DOMContentLoaded", () => {
  const saveTimerBtn = document.getElementById("btn-save-flash-timer");
  if (saveTimerBtn) {
    saveTimerBtn.onclick = async () => {
      const timerInput = document.getElementById("flash-timer-input");
      if (!timerInput || !timerInput.value) {
        Swal.fire("Lỗi", "Vui lòng chọn ngày giờ kết thúc hợp lệ!", "error");
        return;
      }
      
      saveTimerBtn.disabled = true;
      saveTimerBtn.innerText = "ĐANG LƯU...";
      
      try {
        const selectedTime = new Date(timerInput.value).getTime();
        await setDoc(doc(db, "settings", "flash_sale"), { endTime: selectedTime });
        
        Swal.fire("Thành công", "Đã cập nhật thời gian kết thúc Flash Sale!", "success");
        loadFlashSaleTimerSetting();
      } catch (err) {
        console.error(err);
        Swal.fire("Lỗi", "Không thể lưu cấu hình: " + err.message, "error");
      } finally {
        saveTimerBtn.disabled = false;
        saveTimerBtn.innerText = "LƯU THỜI GIAN";
      }
    };
  }
});

// --- QUẢN LÝ TABS ---
window.switchTab = function(tabName) {
  const invSection = document.getElementById("inventory-section");
  const flashSection = document.getElementById("flash-sale-section");
  const navInv = document.getElementById("nav-inventory");
  const navFlash = document.getElementById("nav-nav-flash-sale") || document.getElementById("nav-flash-sale");
  const pageTitle = document.getElementById("page-title");

  if (tabName === "inventory") {
    invSection.style.display = "block";
    flashSection.style.display = "none";
    if (navInv) navInv.classList.add("active");
    if (navFlash) navFlash.classList.remove("active");
    pageTitle.innerHTML = '<i class="fas fa-warehouse"></i> Quản lý Tồn kho - Bình Thạnh';
    loadInventory();
  } else if (tabName === "flash-sale") {
    invSection.style.display = "none";
    flashSection.style.display = "block";
    if (navInv) navInv.classList.remove("active");
    if (navFlash) navFlash.classList.add("active");
    pageTitle.innerHTML = '<i class="fas fa-bolt" style="color: #ffb800;"></i> Quản lý Flash Sale - Bình Thạnh';
    // Đồng bộ chi nhánh
    document.getElementById("flash-branch-filter").value = branchFilter.value;
    loadFlashSaleInventory();
    loadFlashSaleTimerSetting();
  }
};

// --- QUẢN LÝ FLASH SALE LOGIC ---
const flashSaleModal = document.getElementById("flash-sale-modal");
const openFlashSaleModalBtn = document.getElementById("openFlashSaleModalBtn");
const closeFlashBtn = document.getElementById("closeFlashBtn");
const addFlashSaleForm = document.getElementById("add-flash-sale-form");
const flashSaleList = document.getElementById("flash-sale-list");
const flashBranchFilter = document.getElementById("flash-branch-filter");

// Load danh sách sản phẩm trong Flash Sale
async function loadFlashSaleInventory() {
  const selectedBranch = flashBranchFilter.value;
  flashSaleList.innerHTML = `<tr><td colspan="7" style="text-align:center">Đang quét sản phẩm Flash Sale...</td></tr>`;
  try {
    const q = query(
      collection(db, "inventory"), 
      where("branch", "==", selectedBranch),
      where("isFlashSale", "==", true)
    );
    const snap = await getDocs(q);
    flashSaleList.innerHTML = "";

    if (snap.empty) {
      flashSaleList.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted); padding: 20px 0;">Không có sản phẩm nào trong chương trình Flash Sale của chi nhánh này.</td></tr>`;
      return;
    }

    snap.forEach((docSnap) => {
      const item = docSnap.data();
      const docId = docSnap.id;
      const discount = item.discountPercent || 20;
      const salePrice = Math.round((item.price * (1 - discount / 100)) / 1000) * 1000;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td data-label="ID">${item.pid}</td>
        <td data-label="Hình ảnh" style="text-align:center">
            <img src="${item.imageUrl || "img/default.png"}" style="width:45px;height:45px;object-fit:cover;border-radius:6px;">
        </td>
        <td data-label="Sản phẩm"><strong>${item.name}</strong></td>
        <td data-label="Giá gốc" class="price-cell">${Number(item.price || 0).toLocaleString()}đ</td>
        <td data-label="% Giảm giá">
            <input type="number" id="discount-input-${docId}" value="${discount}" min="1" max="99" 
                   style="width: 70px; text-align: center; padding: 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-card); color: var(--text-main); font-weight: bold;" />
        </td>
        <td data-label="Giá khuyến mãi" style="font-weight:bold; color: #ff9100">${Number(salePrice).toLocaleString()}đ</td>
        <td data-label="Hành động">
            <div class="action-buttons">
                <button onclick="window.updateFlashSaleDiscount('${docId}')" 
                        class="btn-edit-row" title="Lưu phần trăm giảm giá" style="background-color: rgba(255, 184, 0, 0.1); color: #ffb800;">
                    <i class="fas fa-save"></i>
                </button>
                <button onclick="window.removeProductFromFlashSale('${docId}', '${item.name.replace(/'/g, "\\'")}')" 
                        class="btn-delete-row" title="Xóa khỏi Flash Sale">
                    <i class="fas fa-times-circle"></i>
                </button>
            </div>
        </td>`;
      flashSaleList.appendChild(row);
    });
  } catch (e) {
    console.error("Lỗi khi load danh sách Flash Sale:", e);
    flashSaleList.innerHTML = `<tr><td colspan="7" style="text-align:center; color: red;">Lỗi tải dữ liệu.</td></tr>`;
  }
}
window.loadFlashSaleInventory = loadFlashSaleInventory;

// Cập nhật chi nhánh thay đổi bên Tab Flash Sale
flashBranchFilter.onchange = () => {
  // Sync ngược lại tab inventory
  branchFilter.value = flashBranchFilter.value;
  loadFlashSaleInventory();
};

// Cập nhật % giảm giá
window.updateFlashSaleDiscount = async function(docId) {
  const discountInput = document.getElementById(`discount-input-${docId}`);
  const newDiscount = Number(discountInput.value);
  if (isNaN(newDiscount) || newDiscount < 1 || newDiscount > 99) {
    Swal.fire("Lỗi", "Vui lòng nhập phần trăm giảm giá từ 1 đến 99%", "error");
    return;
  }

  try {
    await updateDoc(doc(db, "inventory", docId), {
      discountPercent: newDiscount,
      updatedAt: serverTimestamp()
    });
    Swal.fire({
      title: "Đã cập nhật!",
      text: "Đã cập nhật mức giảm giá mới.",
      icon: "success",
      timer: 1000,
      showConfirmButton: false
    });
    loadFlashSaleInventory();
  } catch (error) {
    Swal.fire("Lỗi", "Không thể cập nhật giảm giá.", "error");
  }
};

// Xóa sản phẩm khỏi chương trình Flash Sale
window.removeProductFromFlashSale = function(docId, productName) {
  Swal.fire({
    title: "Xác nhận xóa khỏi Flash Sale?",
    html: `Bạn muốn xóa sản phẩm <br><b style="color:#ff9100">${productName}</b> khỏi chương trình Flash Sale?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#df2027",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Xóa khỏi Flash Sale",
    cancelButtonText: "Hủy",
    reverseButtons: true
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, "inventory", docId), {
          isFlashSale: false,
          updatedAt: serverTimestamp()
        });
        Swal.fire({
          title: "Đã xóa!",
          text: "Đã loại bỏ sản phẩm khỏi Flash Sale.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        loadFlashSaleInventory();
      } catch (err) {
        Swal.fire("Lỗi", "Không thể thực hiện yêu cầu.", "error");
      }
    }
  });
};

// Mở modal thêm sản phẩm vào Flash Sale
if (openFlashSaleModalBtn) {
  openFlashSaleModalBtn.onclick = async () => {
    const selectedBranch = flashBranchFilter.value;
    const selectEl = document.getElementById("flash-product-select");
    selectEl.innerHTML = `<option value="">Đang tải sản phẩm...</option>`;
    
    try {
      // Query tất cả sản phẩm của chi nhánh
      const q = query(collection(db, "inventory"), where("branch", "==", selectedBranch));
      const snap = await getDocs(q);
      selectEl.innerHTML = "";

      let count = 0;
      snap.forEach((docSnap) => {
        const item = docSnap.data();
        // Lọc các sản phẩm chưa tham gia Flash Sale
        if (!item.isFlashSale) {
          const opt = document.createElement("option");
          opt.value = docSnap.id;
          opt.textContent = `${item.pid} - ${item.name} (${Number(item.price || 0).toLocaleString()}đ)`;
          selectEl.appendChild(opt);
          count++;
        }
      });

      if (count === 0) {
        selectEl.innerHTML = `<option value="">Tất cả sản phẩm đã có trong Flash Sale!</option>`;
      }
      
      flashSaleModal.style.display = "block";
    } catch (e) {
      console.error(e);
      selectEl.innerHTML = `<option value="">Lỗi tải danh sách sản phẩm.</option>`;
    }
  };
}

// Đóng modal Flash Sale
if (closeFlashBtn) {
  closeFlashBtn.onclick = () => {
    flashSaleModal.style.display = "none";
    addFlashSaleForm.reset();
  };
}

// Xử lý submit thêm sản phẩm vào Flash Sale
if (addFlashSaleForm) {
  addFlashSaleForm.onsubmit = async (e) => {
    e.preventDefault();
    const productId = document.getElementById("flash-product-select").value;
    const discount = Number(document.getElementById("flash-discount-input").value);

    if (!productId) {
      Swal.fire("Lỗi", "Vui lòng chọn một sản phẩm.", "error");
      return;
    }
    if (isNaN(discount) || discount < 1 || discount > 99) {
      Swal.fire("Lỗi", "Mức giảm giá phải từ 1 đến 99%", "error");
      return;
    }

    const submitBtn = addFlashSaleForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.innerText = "ĐANG THÊM...";

    try {
      await updateDoc(doc(db, "inventory", productId), {
        isFlashSale: true,
        discountPercent: discount,
        updatedAt: serverTimestamp()
      });

      Swal.fire("Thành công", "Đã thêm sản phẩm vào chương trình Flash Sale!", "success");
      flashSaleModal.style.display = "none";
      addFlashSaleForm.reset();
      loadFlashSaleInventory();
    } catch (error) {
      Swal.fire("Lỗi", error.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "THÊM VÀO FLASH SALE";
    }
  };
}

// ĐÓNG MODAL BẰNG ESC VÀ CLICK NGOÀI
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (modal.style.display === "block") {
      modal.style.display = "none";
      productForm.reset();
    }
    if (flashSaleModal && flashSaleModal.style.display === "block") {
      flashSaleModal.style.display = "none";
      addFlashSaleForm.reset();
    }
  }
});

window.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    productForm.reset();
  }
  if (e.target === flashSaleModal) {
    flashSaleModal.style.display = "none";
    addFlashSaleForm.reset();
  }
};
