import {
  db,
  auth,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onAuthStateChanged
} from "../core/api-client.js";

// Bảng tra cứu tên cửa hàng hiển thị lên Header cho đẹp
const storeNames = {
  ngt: "Nguyễn Gia Trí",
  nvt: "Nguyễn Văn Thương",
  dbp: "Điện Biên Phủ",
  nhc: "Nguyễn Hữu Cảnh",
};

// 1. TỰ ĐỘNG XÁC ĐỊNH CHI NHÁNH DỰA TRÊN TRƯỜNG nearestStore TRONG PROFILE
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let savedStoreId = "ngt";
      if (userSnap.exists()) {
        const userData = userSnap.data();
        savedStoreId = userData.nearestStore || "ngt";
      }

      localStorage.setItem("selected_store", savedStoreId);
      console.log("Hệ thống nhận diện cửa hàng từ Profile:", savedStoreId);

      // Hiển thị tên cửa hàng lên Header (nếu có element id này)
      const storeLabel = document.getElementById("display-store-name");
      if (storeLabel) storeLabel.innerText = storeNames[savedStoreId] || "Nguyễn Gia Trí";
    } catch (err) {
      console.error("Lỗi lấy Profile:", err);
      localStorage.setItem("selected_store", "ngt");
      const storeLabel = document.getElementById("display-store-name");
      if (storeLabel) storeLabel.innerText = "Nguyễn Gia Trí";
    }
  } else {
    // Nếu chưa đăng nhập, mặc định là chi nhánh Nguyễn Gia Trí
    localStorage.setItem("selected_store", "ngt");
    const storeLabel = document.getElementById("display-store-name");
    if (storeLabel) storeLabel.innerText = "Nguyễn Gia Trí";
  }
  // Load sản phẩm sau khi đã biết chi nhánh
  loadProducts();
});

async function loadProducts() {
  const productList = document.getElementById("product-list");
  if (!productList) return;

  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory = urlParams.get("type") || "all";

  // Lấy chi nhánh từ LocalStorage
  const currentBranch = localStorage.getItem("selected_store") || "ngt";

  const title = document.getElementById("category-title");
  if (title) title.innerText = activeCategory === "all" ? "TẤT CẢ MENU" : activeCategory.toUpperCase();

  productList.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Đang quét sản phẩm tại chi nhánh ${storeNames[currentBranch] || currentBranch}...</p>`;

  try {
    const colRef = collection(db, "inventory");
    let q;

    // Lọc theo chi nhánh VÀ loại sản phẩm
    if (activeCategory === "all") {
      q = query(colRef, where("branch", "==", currentBranch));
    } else {
      q = query(colRef, where("branch", "==", currentBranch), where("type", "==", activeCategory));
    }

    const snap = await getDocs(q);
    productList.innerHTML = "";

    if (snap.empty) {
      productList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px;">Chi nhánh này hiện chưa có sản phẩm thuộc mục này.</p>`;
      return;
    }

    snap.forEach((doc) => {
      const data = doc.data();
      const productId = doc.id;
      const price = data.price || 0;
      const name = data.name || "Sản phẩm";
      const img = data.imageUrl || "img/default.png";

      productList.innerHTML += `
                <div class="product-item">
                    <span class="pid-label">${data.type}</span>
                    <div class="img-container">
                        <img src="${img}" alt="${name}">
                    </div>
                    <h3>${name}</h3>
                    <p class="price-tag">${Number(price).toLocaleString()}đ</p>
                    <button class="btn-add-cart" 
                        onclick="handleAddToCart(this, '${productId}', '${name}', ${price}, '${img}')">
                        Thêm vào giỏ
                    </button>
                </div>`;
    });
  } catch (error) {
    console.error("Lỗi kết nối API:", error);
    productList.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối với máy chủ API.</p>`;
  }
}

// LOGIC GIỎ HÀNG (GIỮ NGUYÊN NHƯNG ĐÃ ĐẢM BẢO CHẠY GLOBAL)
window.handleAddToCart = async (btn, id, name, price, imageUrl) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Bạn ơi, bạn cần đăng nhập để mua hàng nhé!");
    window.location.href = "login.html";
    return;
  }

  if (typeof animateToCart === "function") animateToCart(btn);

  const cartRef = doc(db, "carts", user.uid);

  try {
    const cartSnap = await getDoc(cartRef);
    let items = [];

    if (cartSnap.exists()) {
      items = cartSnap.data().items || [];
      const existingItem = items.find((item) => item.id === id);

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        items.push({ id, name, price, imageUrl, quantity: 1 });
      }
      await updateDoc(cartRef, { items: items });
    } else {
      items = [{ id, name, price, imageUrl, quantity: 1 }];
      await setDoc(cartRef, { items: items });
    }

    // Gọi hàm cập nhật con số giỏ hàng
    updateCartBadge(items.length);
  } catch (error) {
    console.error("Lỗi thêm giỏ hàng:", error);
  }
};

function updateCartBadge(count) {
  const badge = document.getElementById("cart-count");
  if (badge) badge.innerText = count;
}

function animateToCart(btn) {
  const cartIcon = document.getElementById("cart-icon");
  if (!cartIcon) return;
  const btnRect = btn.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();
  const ball = document.createElement("div");
  ball.style.cssText = `position: fixed; z-index: 9999; top: ${btnRect.top}px; left: ${btnRect.left}px; width: 20px; height: 20px; background: #df2027; border-radius: 50%; transition: all 0.7s ease-in-out;`;
  document.body.appendChild(ball);
  setTimeout(() => {
    ball.style.top = cartRect.top + 10 + "px";
    ball.style.left = cartRect.left + 10 + "px";
    ball.style.transform = "scale(0.1)";
    ball.style.opacity = "0";
  }, 50);
  setTimeout(() => ball.remove(), 700);
}
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
window.searchGlobal = function () {
  const input = document.getElementById("menu-search").value.toLowerCase();
  const products = document.querySelectorAll(".product-item");
  const productList = document.getElementById("product-list");

  // Biến đếm số sản phẩm thực sự đang hiện
  let hasVisibleProduct = false;

  products.forEach((product) => {
    const nameTag = product.querySelector("h3");
    if (!nameTag) return;

    const name = nameTag.innerText.toLowerCase();

    if (name.includes(input)) {
      product.style.display = "block"; // Hiện sản phẩm
      hasVisibleProduct = true; // Đánh dấu là đã tìm thấy ít nhất 1 món
    } else {
      product.style.display = "none"; // Ẩn sản phẩm không khớp
    }
  });

  // Xử lý dòng thông báo "Không tìm thấy"
  let oldMsg = document.getElementById("no-results");

  if (hasVisibleProduct || input === "") {
    // Nếu tìm thấy HOẶC ô tìm kiếm trống -> Xóa dòng thông báo lỗi
    if (oldMsg) oldMsg.remove();
  } else {
    // Nếu KHÔNG tìm thấy món nào VÀ chưa có thông báo lỗi trên màn hình -> Tạo mới
    if (!oldMsg) {
      const msg = document.createElement("p");
      msg.id = "no-results";
      msg.style.cssText = "grid-column: 1/-1; text-align: center; padding: 20px; color: #666; font-style: italic;";
      msg.innerText = `Không tìm thấy sản phẩm nào khớp với "${input}"`;
      productList.appendChild(msg);
    } else {
      // Nếu đã có thông báo rồi thì chỉ cần cập nhật lại nội dung chữ gõ vào
      oldMsg.innerText = `Không tìm thấy sản phẩm nào khớp với "${input}"`;
    }
  }
};
