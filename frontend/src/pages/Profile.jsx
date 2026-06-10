import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useThemeLang } from "../context/ThemeLangContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Navigation,
  CheckCircle2,
} from "lucide-react";

// Haversine distance calculator
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { t } = useThemeLang();
  const [fullname, setFullname] = useState(user?.fullname || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [nearestStore, setNearestStore] = useState(user?.nearest_store || "ngt");

  // Status
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await updateProfile({
        fullname,
        dob,
        phone,
        address,
        nearest_store: nearestStore,
      });
      setMessage({ type: "success", text: t("Cập nhật thông tin tài khoản thành công!") });
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("Lỗi cập nhật!") });
    } finally {
      setLoading(false);
    }
  };

  // Real FIDO2 WebAuthn Registration
  const handleRegisterFido = async () => {
    if (!window.PublicKeyCredential) {
      setMessage({
        type: "error",
        text: t("Thiết bị hoặc trình duyệt này không hỗ trợ FIDO2/WebAuthn bảo mật!"),
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      // 1. Generate challenge buffer
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // 2. Create User ID ArrayBuffer
      const userIdBuffer = new TextEncoder().encode(user.uid);

      const registrationOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: "Convenia Store Việt Nam",
            id: window.location.hostname,
          },
          user: {
            id: userIdBuffer,
            name: user.email,
            displayName: user.email,
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            userVerification: "required",
            residentKey: "required",
          },
        },
      };

      const credential = await navigator.credentials.create(registrationOptions);
      const credentialId = bufferToBase64url(credential.rawId);

      // Prompt for confirmation password to verify identity
      const confirmPassword = prompt(t("Nhập mật khẩu hiện tại của bạn để liên kết thiết bị bảo mật này:"));
      if (!confirmPassword) {
        setMessage({ type: "error", text: t("Liên kết thất bại: Bạn chưa xác nhận mật khẩu.") });
        setLoading(false);
        return;
      }

      // Verify the password by sending to login
      const loginCheck = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: confirmPassword }),
      });

      if (!loginCheck.ok) {
        const errorData = await loginCheck.json().catch(() => ({}));
        throw new Error(errorData.detail || t("Xác nhận mật khẩu thất bại! Vui lòng điền đúng mật khẩu tài khoản."));
      }

      const res = await fetch("/api/auth/fido-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          uid: user.uid,
          fido_credential_id: credentialId,
          fido_password: confirmPassword,
        }),
      });

      if (res.ok) {
        localStorage.setItem("fido_credential_id", credentialId);
        setMessage({ type: "success", text: t("Đã liên kết thiết bị bảo mật vân tay/gương mặt FIDO2 thành công!") });
        // Trigger a profile refresh
        await updateProfile({ fullname });
      } else {
        throw new Error(t("Đăng ký FIDO2 không thành công trên server!"));
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text:
          err.name === "NotAllowedError"
            ? t("Thao tác bị hủy hoặc trình duyệt không được cấp quyền sinh trắc học.")
            : err.message || t("Lỗi kết nối FIDO2!"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFido = async () => {
    if (!confirm(t("Bạn có chắc chắn muốn hủy liên kết thiết bị bảo mật FIDO2 này không?"))) {
      return;
    }
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await updateProfile({
        has_fido: false,
        fido_credential_id: "",
      });
      localStorage.removeItem("fido_credential_id");
      setMessage({ type: "success", text: t("Đã hủy liên kết thiết bị bảo mật FIDO2 thành công!") });
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("Lỗi hủy liên kết!") });
    } finally {
      setLoading(false);
    }
  };

  // Real Geolocation Nearest Store Picker
  const handleGetLocation = () => {
    setMessage({ type: "info", text: t("Đang quét vị trí của bạn...") });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const storesList = [
            { id: "ngt", name: "Convenia Nguyễn Gia Trí", lat: 10.801943, lng: 106.711524 },
            { id: "nvt", name: "Convenia Nguyễn Văn Thương", lat: 10.803522, lng: 106.710123 },
            { id: "dbp", name: "Convenia Điện Biên Phủ", lat: 10.799821, lng: 106.70521 },
            { id: "nhc", name: "Convenia Nguyễn Hữu Cảnh", lat: 10.791234, lng: 106.708567 },
          ];
          let min = Infinity;
          let closest = null;

          storesList.forEach((s) => {
            const d = getDistance(pos.coords.latitude, pos.coords.longitude, s.lat, s.lng);
            if (d < min) {
              min = d;
              closest = s;
            }
          });

          if (closest) {
            setNearestStore(closest.id);
            setMessage({
              type: "success",
              text: `${t("Đã tìm thấy cửa hàng gần nhất")}: ${closest.name} (${min.toFixed(2)} km)`,
            });
          }
        },
        () => {
          alert(t("Không thể lấy vị trí. Vui lòng bật quyền định vị!"));
          setMessage({ type: "error", text: t("Không thể định vị GPS!") });
        },
      );
    } else {
      alert(t("Trình duyệt không hỗ trợ Geolocation!"));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800">{t("quản lý tài khoản")}</h1>
          <p className="text-slate-500 text-sm mt-1">{t("cập nhật hồ sơ cá nhân và quản lý bảo mật nâng cao")}</p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-1.5 rounded-full bg-white text-xs text-slate-650 font-bold border border-slate-200">
          {t("chức vụ")}: <span className="text-cyan-600 font-bold capitalize">{user?.role}</span>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 text-sm font-bold rounded-2xl ${
            message.type === "success"
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-red-50 text-red-500 border border-red-200"
          }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Security Settings */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-650 text-cyan-600" />
              <span>{t("bảo mật nâng cao")}</span>
            </h2>

            {/* FIDO2 Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-slate-700">{t("khóa fido2 / webauthn")}</h3>
                <span
                  className={`px-2 py-0.5 text-[9px] font-black rounded-md ${
                    user?.has_fido
                      ? "bg-green-50 text-green-600 border border-green-200"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                  {user?.has_fido ? t("đã bật") : t("tắt")}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {t("đăng nhập nhanh bằng cảm biến vân tay hoặc nhận diện khuôn mặt mà không cần nhập mật khẩu.")}
              </p>
              {!user?.has_fido ? (
                <button
                  type="button"
                  onClick={handleRegisterFido}
                  disabled={loading}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs rounded-xl transition-colors shadow-sm">
                  {t("liên kết khóa bảo mật")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveFido}
                  disabled={loading}
                  className="w-full py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 font-bold text-xs rounded-xl transition-colors shadow-sm">
                  {t("hủy liên kết khóa")}
                </button>
              )}
            </div>


          </div>
        </div>

        {/* Right Side: Account Details Forms */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdate} className="glass p-8 rounded-3xl space-y-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center space-x-2">
              <User className="w-5 h-5 text-cyan-600" />
              <span>{t("hồ sơ cá nhân")}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> {t("họ và tên")}
                </label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> {t("ngày sinh")}
                </label>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> {t("email (không đổi)")}
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {t("số điện thoại")}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" /> {t("địa chỉ giao hàng")}
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, Tên đường, Quận/Huyện, Thành phố..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm shadow-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("cửa hàng gần nhất (giao nhanh)")}
              </label>
              <div className="flex space-x-2">
                <select
                  value={nearestStore}
                  onChange={(e) => setNearestStore(e.target.value)}
                  className="flex-grow px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm shadow-sm">
                  <option value="ngt">Convenia Nguyễn Gia Trí (Quận Bình Thạnh)</option>
                  <option value="nvt">Convenia Nguyễn Văn Trỗi (Quận Phú Nhuận)</option>
                  <option value="dbp">Convenia Điện Biên Phủ (Quận 3)</option>
                  <option value="nhc">Convenia Nguyễn Hữu Cảnh (Quận Bình Thạnh)</option>
                </select>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl flex items-center space-x-1 border border-slate-200">
                  <Navigation className="w-3.5 h-3.5 text-cyan-650 text-cyan-600" />
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-cyan-500/10">
                {t("lưu thay đổi")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
