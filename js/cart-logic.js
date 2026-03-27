import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    renderCart(user.uid);
  } else {
    document.getElementById("cart-list").innerHTML =
      `<p style="text-align:center; padding:20px;">Vui lòng <a href="indexlogin.html">đăng nhập</a> để xem giỏ hàng.</p>`;
  }
});

async function renderCart(uid) {
  const listContainer = document.getElementById("cart-list");
  const cartRef = doc(db, "carts", uid);
  const cartSnap = await getDoc(cartRef);

  if (!cartSnap.exists() || cartSnap.data().items.length === 0) {
    listContainer.innerHTML = `<div style="text-align:center; padding:40px;">
            <i class="fas fa-shopping-cart" style="font-size: 50px; color: #ccc; margin-bottom: 10px;"></i>
            <p>Giỏ hàng của bạn đang trống.</p>
        </div>`;
    updateTotals(0);
    return;
  }

  const items = cartSnap.data().items;
  let html = "";
  let totalAll = 0;

  items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const subTotal = item.price * qty;
    totalAll += subTotal;

    html += `
            <div class="cart-item">
                <img src="${item.imageUrl || "img/default.png"}" alt="${item.name}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <span class="item-price">${Number(item.price).toLocaleString()}đ</span>
                </div>
                <div class="item-qty">
                    <button onclick="updateQty('${index}', -1)">-</button>
                    <span>${qty}</span>
                    <button onclick="updateQty('${index}', 1)">+</button>
                </div>
                <div class="item-total-price">
                    <b>${subTotal.toLocaleString()}đ</b>
                </div>
                <i class="fas fa-trash-alt btn-remove" onclick="removeItem('${index}')"></i>
            </div>`;
  });

  listContainer.innerHTML = html;
  updateTotals(totalAll);
}

function updateTotals(total) {
  document.getElementById("subtotal").innerText = total.toLocaleString() + "đ";
  document.getElementById("final-total").innerText = total.toLocaleString() + "đ";
}

// Hàm cập nhật số lượng
window.updateQty = async (index, change) => {
  const user = auth.currentUser;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  let items = cartSnap.data().items;

  let newQty = (items[index].quantity || 1) + change;
  if (newQty < 1) return; // Không cho giảm dưới 1

  items[index].quantity = newQty;
  await updateDoc(cartRef, { items: items });
  renderCart(user.uid); // Vẽ lại giỏ hàng
};

// Hàm xóa sản phẩm
window.removeItem = async (index) => {
  if (!confirm("Bạn có chắc muốn xóa món này?")) return;
  const user = auth.currentUser;
  const cartRef = doc(db, "carts", user.uid);
  const cartSnap = await getDoc(cartRef);
  let items = cartSnap.data().items;

  items.splice(index, 1);
  await updateDoc(cartRef, { items: items });
  renderCart(user.uid);
};
