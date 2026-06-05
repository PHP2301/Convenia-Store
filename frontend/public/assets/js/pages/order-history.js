import {
  db,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "../core/api-client.js";

// Map ID chi nhánh sang tên tiếng Việt
const storeNames = {
  ngt: "Nguyễn Gia Trí",
  nvt: "Nguyễn Văn Thương",
  dbp: "Điện Biên Phủ",
  nhc: "Nguyễn Hữu Cảnh",
};

// 3. HÀM HIỂN THỊ LỊCH SỬ REALTIME
function initRealtimeHistory() {
  const historyContent = document.getElementById("history-content");
  if (!historyContent) return;

  const q = query(collection(db, "inventory_logs"), orderBy("timestamp", "desc"));

  onSnapshot(
    q,
    (snapshot) => {
      historyContent.innerHTML = "";

      if (snapshot.empty) {
        historyContent.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu lịch sử.</td></tr>`;
        return;
      }

      snapshot.forEach((doc) => {
        const log = doc.data();
        const timeStr = log.timestamp ? log.timestamp.toDate().toLocaleString("vi-VN") : "Đang chờ...";
        const isNhap = log.type === "Nhập kho";
        const isXoa = log.type === "Xóa sản phẩm";

        // Chọn màu sắc dựa trên hành động
        let color = "#2e7d32"; // Mặc định xanh (Nhập)
        if (log.type === "Xuất kho") color = "#c62828"; // Đỏ
        if (isXoa) color = "#666"; // Xám cho hành động xóa

        const qtyPrefix = isNhap ? "+" : isXoa ? "" : "-";

        historyContent.innerHTML += `
                <tr>
                    <td>${timeStr}</td>
                    <td><strong>${log.productName}</strong></td>
                    <td class="branch-tag">${storeNames[log.branch] || log.branch}</td>
                    <td style="font-weight:bold; color: ${color}">
                        ${isXoa ? "---" : qtyPrefix + log.quantity}
                    </td>
                    <td><span class="type-badge ${isNhap ? "type-nhap" : "type-xuat"}">${log.type}</span></td>
                    <td><i class="fas fa-user-circle"></i> ${log.userName || "Admin"}</td>
                </tr>
            `;
      });
    },
    (error) => {
      console.error("Lỗi Realtime:", error);
    },
  );
}

// 4. HÀM GHI LOG (Dùng nếu cần gọi trực tiếp từ file này)
export async function logActivity(productName, qty, type, userName) {
  try {
    const branch = localStorage.getItem("selected_store") || "ngt";
    await addDoc(collection(db, "inventory_logs"), {
      productName: productName,
      quantity: qty,
      type: type,
      userName: userName,
      branch: branch,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Lỗi ghi log:", e);
  }
}

// Chạy khi trang sẵn sàng
document.addEventListener("DOMContentLoaded", initRealtimeHistory);
// Tìm hàm render bảng lịch sử của bạn
function renderHistory(data) {
  const list = document.getElementById("history-list"); // Hoặc ID bạn đang dùng
  list.innerHTML = "";

  data.forEach((item) => {
    list.innerHTML += `
            <tr>
                <td data-label="THỜI GIAN">${item.time}</td>
                <td data-label="SỰ KIỆN">${item.event}</td>
                <td data-label="CHI TIẾT">${item.details}</td>
                <td data-label="NGƯỜI THỰC HIỆN">${item.adminName}</td>
            </tr>
        `;
  });
}
