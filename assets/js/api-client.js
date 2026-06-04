// api-client.js - Database client connecting to Supabase (PostgreSQL) and Render (FastAPI)

const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:8000"
  : "https://convenia-website.onrender.com";

// --- CLIENT INSTANCES ---
export const db = { db: "postgres" };
export const storage = {};

// --- STATE MANAGEMENT ---
let authStateListeners = [];

function triggerAuthStateChange(user) {
  authStateListeners.forEach((cb) => cb(user));
}

// Custom helper to fetch JSON
async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || `HTTP Error ${response.status}`);
  }
  return response.json();
}

// --- DEPRECATED/COMPATIBILITY APP LAYERS ---
export function initializeApp() {
  return { name: "[FastAPI App]" };
}
export function getApps() {
  return [];
}
export function getApp() {
  return initializeApp();
}

// --- DATABASE ACCESS ---

// --- CLIENT AUTH SESSION ---
export const auth = {
  get currentUser() {
    try {
      const userStr = localStorage.getItem("current_user");
      if (!userStr || userStr === "undefined" || userStr === "null") return null;
      const user = JSON.parse(userStr);
      if (!user || !user.uid || !user.email) return null;
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.fullname || user.email.split("@")[0],
      };
    } catch (e) {
      console.error("Error parsing current_user from localStorage:", e);
      return null;
    }
  }
};

export function getAuth() {
  return auth;
}

export function onAuthStateChanged(authInstance, callback) {
  authStateListeners.push(callback);
  // Trigger immediately with current user
  callback(auth.currentUser);
  return () => {
    authStateListeners = authStateListeners.filter((cb) => cb !== callback);
  };
}

export async function signInWithEmailAndPassword(authInstance, email, password) {
  const userData = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("current_user", JSON.stringify(userData));
  triggerAuthStateChange(auth.currentUser);
  return {
    user: auth.currentUser,
  };
}

export async function createUserWithEmailAndPassword(authInstance, email, password) {
  const userData = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // Do not automatically sign in to match registration flow which requires OTP
  return {
    user: {
      uid: userData.uid,
      email: userData.email,
      delete: async () => {
        await apiFetch(`/api/auth/profile/${userData.uid}`, {
          method: "DELETE",
        });
        return true;
      }
    },
  };
}

export async function signOut(authInstance) {
  localStorage.removeItem("current_user");
  // Clean FIDO state or session verification if needed
  triggerAuthStateChange(null);
  return true;
}

export async function sendPasswordResetEmail(authInstance, email) {
  // Mock sending email - emailjs is used on client side anyway
  console.log("Mock password reset sent to:", email);
  return true;
}

// --- DATABASE SDK INTERFACE ---
export function getDatabase() {
  return { db: "postgres" };
}

export function doc(db, collectionName, id) {
  return { type: "doc", collection: collectionName, id };
}

export function collection(db, collectionName) {
  return { type: "collection", collection: collectionName };
}

export function query(colRef, ...filters) {
  return { type: "query", colRef, filters };
}

export function where(field, op, value) {
  return { type: "where", field, op, value };
}

export function orderBy(field, direction = "asc") {
  return { type: "orderBy", field, direction };
}

export function onSnapshot(queryRef, onNext, onError) {
  // Initial fetch
  getDocs(queryRef).then(onNext).catch(onError);
  
  // Set up polling every 3 seconds to simulate database realtime updates
  const intervalId = setInterval(() => {
    getDocs(queryRef).then(onNext).catch(onError);
  }, 3000);
  
  // Return unsubscribe function
  return () => clearInterval(intervalId);
}

export const serverTimestamp = () => new Date().toISOString();

export async function getDoc(docRef) {
  if (docRef.collection === "users") {
    try {
      const data = await apiFetch(`/api/auth/profile/${docRef.id}`);
      return {
        exists: () => true,
        data: () => ({
          uid: data.uid,
          email: data.email,
          fullname: data.fullname,
          dob: data.dob,
          phone: data.phone,
          address: data.address,
          nearestStore: data.nearest_store,
          role: data.role,
          fido_credential_id: data.fido_credential_id,
          fido_password: data.fido_password,
          has_fido: data.has_fido,
          tfa_secret: data.tfa_secret,
        }),
      };
    } catch (e) {
      return {
        exists: () => false,
        data: () => null,
      };
    }
  } else if (docRef.collection === "carts") {
    try {
      const data = await apiFetch(`/api/carts/${docRef.id}`);
      return {
        exists: () => true,
        data: () => ({
          items: data.items || []
        })
      };
    } catch (e) {
      return {
        exists: () => false,
        data: () => null,
      };
    }
  } else if (docRef.collection === "inventory" || docRef.collection === "products") {
    try {
      const p = await apiFetch(`/api/products/${docRef.id}`);
      return {
        exists: () => true,
        data: () => ({
          id: p.id,
          pid: p.pid,
          name: p.name,
          type: p.type,
          stock: p.stock,
          price: p.price,
          unit: p.unit,
          branch: p.branch,
          imageUrl: p.image_url,
          isFlashSale: p.is_flash_sale || false,
          discountPercent: p.discount_percent !== undefined ? p.discount_percent : 20,
        })
      };
    } catch (e) {
      return {
        exists: () => false,
        data: () => null,
      };
    }
  } else if (docRef.collection === "settings") {
    try {
      const data = await apiFetch(`/api/settings/${docRef.id}`);
      if (data.exists) {
        let val = data.value;
        try {
          val = JSON.parse(data.value);
        } catch (err) {}
        return {
          exists: () => true,
          data: () => val
        };
      } else {
        return {
          exists: () => false,
          data: () => null
        };
      }
    } catch (e) {
      return {
        exists: () => false,
        data: () => null,
      };
    }
  }
  return {
    exists: () => false,
    data: () => null,
  };
}

export async function setDoc(docRef, data, options = {}) {
  if (docRef.collection === "users") {
    // Check if it's a FIDO link
    if (data.fido_credential_id) {
      await apiFetch("/api/auth/fido-register", {
        method: "POST",
        body: JSON.stringify({
          uid: docRef.id,
          fido_credential_id: data.fido_credential_id,
          fido_password: data.fido_password,
        }),
      });
    } else {
      // Standard update
      const updateData = {
        fullname: data.fullname,
        dob: data.dob,
        phone: data.phone,
        address: data.address,
        nearest_store: data.nearestStore,
        tfa_secret: data.tfa_secret,
      };
      await apiFetch(`/api/auth/profile/${docRef.id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
    }
    // Update local storage current_user if active user is updated
    const current = auth.currentUser;
    if (current && current.uid === docRef.id) {
      const freshProfile = await apiFetch(`/api/auth/profile/${docRef.id}`);
      localStorage.setItem("current_user", JSON.stringify(freshProfile));
      triggerAuthStateChange(auth.currentUser);
    }
    return true;
  } else if (docRef.collection === "carts") {
    await apiFetch(`/api/carts/${docRef.id}`, {
      method: "POST",
      body: JSON.stringify({ items: data.items || [] }),
    });
    return true;
  } else if (docRef.collection === "subscribers") {
    await apiFetch("/api/subscribers", {
      method: "POST",
      body: JSON.stringify({
        uid: docRef.id,
        email: data.email,
      }),
    });
    return true;
  } else if (docRef.collection === "orders") {
    // Map client SDK add/set order to FastAPI
    const orderData = {
      id: docRef.id,
      user_id: data.userId,
      order_id: data.orderId,
      total_amount: data.totalAmount,
      status: data.status || "Hoàn tất",
      items: (data.items || []).map((item) => ({
        product_name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image_url: item.imageUrl,
      })),
    };
    await apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    return true;
  } else if (docRef.collection === "settings") {
    await apiFetch(`/api/settings/${docRef.id}`, {
      method: "POST",
      body: JSON.stringify({ value: JSON.stringify(data) }),
    });
    return true;
  } else if (docRef.collection === "inventory" || docRef.collection === "products") {
    // Map camelCase/snake_case to snake_case for Pydantic schema
    const productData = {
      pid: data.pid,
      name: data.name,
      type: data.type,
      stock: parseInt(data.stock) || 0,
      price: parseFloat(data.price) || 0,
      unit: data.unit,
      branch: data.branch,
      image_url: data.imageUrl !== undefined ? data.imageUrl : (data.image_url || ""),
      is_flash_sale: data.isFlashSale !== undefined ? data.isFlashSale : (data.is_flash_sale || false),
      discount_percent: data.discountPercent !== undefined ? parseInt(data.discountPercent) : (data.discount_percent !== undefined ? parseInt(data.discount_percent) : 20),
    };
    await apiFetch(`/api/products/${docRef.id}`, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
    return true;
  }
  return false;
}

export async function updateDoc(docRef, data) {
  return setDoc(docRef, data, { merge: true });
}

export async function deleteDoc(docRef) {
  if (docRef.collection === "inventory" || docRef.collection === "products") {
    await apiFetch(`/api/products/${docRef.id}`, {
      method: "DELETE",
    });
    return true;
  }
  return false;
}

export async function addDoc(colRef, data) {
  if (colRef.collection === "orders") {
    const orderId = data.orderId || `CK${Math.floor(100000 + Math.random() * 900000)}`;
    const mockRef = { collection: "orders", id: uuidv4() };
    await setDoc(mockRef, data);
    return mockRef;
  } else if (colRef.collection === "inventory_logs") {
    await apiFetch("/api/inventory-logs", {
      method: "POST",
      body: JSON.stringify({
        productName: data.productName,
        quantity: parseInt(data.quantity) || 0,
        type: data.type,
        userName: data.userName,
        branch: data.branch,
      }),
    });
    return { collection: "inventory_logs", id: "mock_log_id" };
  } else if (colRef.collection === "inventory" || colRef.collection === "products") {
    const docId = uuidv4();
    const productData = {
      id: docId,
      pid: data.pid,
      name: data.name,
      type: data.type,
      stock: parseInt(data.stock) || 0,
      price: parseFloat(data.price) || 0,
      unit: data.unit,
      branch: data.branch,
      image_url: data.imageUrl !== undefined ? data.imageUrl : (data.image_url || ""),
      is_flash_sale: data.isFlashSale !== undefined ? data.isFlashSale : (data.is_flash_sale || false),
      discount_percent: data.discountPercent !== undefined ? parseInt(data.discountPercent) : (data.discount_percent !== undefined ? parseInt(data.discount_percent) : 20),
    };
    await apiFetch("/api/products", {
      method: "POST",
      body: JSON.stringify(productData),
    });
    return { collection: colRef.collection, id: docId };
  }
  return null;
}

// Fetch products or orders
export async function getDocs(q) {
  const collectionName = q.type === "query" ? q.colRef.collection : q.collection;
  
  if (collectionName === "inventory" || collectionName === "products") {
    let branch = "ngt";
    let type = "all";
    
    if (q.type === "query" && q.filters) {
      q.filters.forEach((filter) => {
        if (filter.field === "branch") {
          branch = filter.value;
        } else if (filter.field === "type") {
          type = filter.value;
        }
      });
    }
    
    const products = await apiFetch(`/api/products?branch=${branch}&type=${type}`);
    const docs = products.map((p) => ({
      id: p.id,
      data: () => ({
        id: p.id,
        pid: p.pid,
        name: p.name,
        type: p.type,
        stock: p.stock,
        price: p.price,
        unit: p.unit,
        branch: p.branch,
        imageUrl: p.image_url,
        isFlashSale: p.is_flash_sale || false,
        discountPercent: p.discount_percent !== undefined ? p.discount_percent : 20,
      }),
    }));
    
    if (q.type === "query" && q.filters) {
      q.filters.forEach((filter) => {
        if (filter.field !== "branch" && filter.field !== "type") {
          docs = docs.filter((docObj) => {
            const data = docObj.data();
            const val = data[filter.field];
            if (filter.op === "==") return val === filter.value;
            if (filter.op === ">") return val > filter.value;
            if (filter.op === "<") return val < filter.value;
            return true;
          });
        }
      });
    }
    
    return {
      empty: docs.length === 0,
      docs,
      forEach: (cb) => docs.forEach(cb),
    };
  } else if (collectionName === "orders") {
    let userId = "";
    if (q.type === "query" && q.filters) {
      q.filters.forEach((filter) => {
        if (filter.field === "userId") {
          userId = filter.value;
        }
      });
    }
    
    if (!userId) {
      return { empty: true, docs: [], forEach: () => {} };
    }
    
    const orders = await apiFetch(`/api/orders?user_id=${userId}`);
    const docs = orders.map((o) => ({
      id: o.id,
      data: () => ({
        id: o.id,
        userId: o.user_id,
        orderId: o.order_id,
        totalAmount: o.total_amount,
        status: o.status,
        date: o.order_date,
        items: o.items.map((item) => ({
          name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.image_url,
        })),
      }),
    }));
    
    return {
      empty: docs.length === 0,
      docs,
      forEach: (cb) => docs.forEach(cb),
    };
  } else if (collectionName === "users") {
    // Auth FIDO2 login queries users collection by fido_credential_id
    let fidoCredentialId = "";
    if (q.type === "query" && q.filters) {
      q.filters.forEach((filter) => {
        if (filter.field === "fido_credential_id") {
          fidoCredentialId = filter.value;
        }
      });
    }
    
    if (!fidoCredentialId) {
      return { empty: true, docs: [], forEach: () => {} };
    }
    
    try {
      const user = await apiFetch("/api/auth/fido-login", {
        method: "POST",
        body: JSON.stringify({ fido_credential_id: fidoCredentialId }),
      });
      const docObj = {
        id: user.uid,
        data: () => ({
          uid: user.uid,
          email: user.email,
          fido_password: user.fido_password,
          role: user.role,
          nearestStore: user.nearest_store,
        }),
      };
      return {
        empty: false,
        docs: [docObj],
        forEach: (cb) => [docObj].forEach(cb),
      };
    } catch (e) {
      return {
        empty: true,
        docs: [],
        forEach: () => {},
      };
    }
  } else if (collectionName === "inventory_logs") {
    try {
      const logs = await apiFetch("/api/inventory-logs");
      const docs = logs.map((log) => ({
        id: "log_id_" + Math.random(),
        data: () => ({
          productName: log.productName,
          quantity: log.quantity,
          type: log.type,
          userName: log.userName,
          branch: log.branch,
          timestamp: log.timestamp ? { toDate: () => new Date(log.timestamp) } : null,
        }),
      }));
      return {
        empty: docs.length === 0,
        docs,
        forEach: (cb) => docs.forEach(cb),
      };
    } catch (e) {
      return {
        empty: true,
        docs: [],
        forEach: () => {},
      };
    }
  }
  
  return {
    empty: true,
    docs: [],
    forEach: () => {},
  };
}

// Simple Helper for UUID generation on order client
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- STORAGE ACCESS ---
export function getStorage() {
  return storage;
}

export function ref(storageInstance, path) {
  return { type: "storage_ref", path };
}

export async function uploadBytes(storageRef, fileBlob) {
  const formData = new FormData();
  formData.append("file", fileBlob, "product.jpg");
  
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Lỗi tải ảnh lên máy chủ FastAPI!");
  }
  
  const data = await response.json();
  return {
    ref: {
      downloadUrl: data.imageUrl,
    },
  };
}

export async function getDownloadURL(refObj) {
  return refObj.downloadUrl;
}

export async function deleteObject(storageRef) {
  console.log("Mock delete object from storage:", storageRef.path);
  return true;
}
