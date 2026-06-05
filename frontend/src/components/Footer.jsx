import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Shield } from "lucide-react";
import { useThemeLang } from "../context/ThemeLangContext";

export default function Footer() {
  const { t } = useThemeLang();

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top: Branding & Links */}
        <div className="flex flex-col md:flex-row justify-between items-center pb-8 border-b border-slate-200/60 gap-6">
          <Link to="/" className="flex items-center space-x-1.5">
            <div className="bg-[#00b4d8] text-white font-extrabold text-xl px-2.5 py-0.5 rounded shadow-sm font-sans tracking-wide">
              CK
            </div>
            <span className="text-[#0077b6] font-black text-lg tracking-wider font-sans">GO</span>
          </Link>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-bold text-slate-600">
            <Link to="/stores" className="hover:text-[#00b4d8] uppercase">
              {t("hệ thống cửa hàng")}
            </Link>
            <Link to="/menu" className="hover:text-[#00b4d8] uppercase">
              {t("thức ăn & thức uống")}
            </Link>
            <Link to="/search" className="hover:text-[#00b4d8] uppercase">
              {t("ưu đãi đặc biệt")}
            </Link>
          </div>
        </div>

        {/* Middle: Details columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
          {/* Left Column */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-800">
              {t("ck convenience store vietnam - chuỗi cửa hàng tiện lợi - mở cửa 24/7")}
            </p>
            <p className="text-slate-400 font-medium">
              Copyright &copy; {new Date().getFullYear()} CK Convenience Store Vietnam
            </p>
            <div className="space-y-1 mt-2 text-slate-600 font-medium">
              <p className="flex items-center">
                <Phone className="w-3.5 h-3.5 text-[#00b4d8] mr-1.5 shrink-0" /> {t("số điện thoại")}: +84 (28) 3620
                9017
              </p>
              <p className="flex items-center font-bold text-red-500">
                <Phone className="w-3.5 h-3.5 text-red-500 mr-1.5 shrink-0" /> {t("phòng chăm sóc khách hàng")}
              </p>
              <p className="flex items-center">
                <Mail className="w-3.5 h-3.5 text-[#00b4d8] mr-1.5 shrink-0" /> Email: info@ckstores.com.vn
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3 text-slate-600 font-medium md:text-right">
            <p className="font-bold text-slate-850 text-slate-700">
              {t("công ty tnhh bán lẻ ck việt nam - giấy cnđkdn: 0306182043")}
            </p>
            <p>{t("ngày cấp: 10/11/2008. nơi cấp: sở kế hoạch - đầu tư tp. hồ chí minh")}</p>
            <p className="flex items-center md:justify-end">
              <MapPin className="w-3.5 h-3.5 text-[#00b4d8] mr-1.5 shrink-0" />
              <span>{t("địa chỉ: 160 bùi thị xuân, phường bến thành, quận 1, thành phố hồ chí minh, việt nam.")}</span>
            </p>
          </div>
        </div>

        {/* Bottom: Sub Menu & Badges */}
        <div className="pt-6 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#" className="hover:underline">
              {t("giới thiệu")}
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              {t("cơ hội nghề nghiệp")}
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              {t("tin tức & sự kiện")}
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              {t("liên hệ")}
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              {t("điều khoản sử dụng")}
            </a>
            <span>|</span>
            <a href="#" className="hover:underline">
              {t("chính sách")}
            </a>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-md shrink-0">
            <Shield className="w-3.5 h-3.5 text-cyan-600" />
            <span className="font-extrabold">DUNS&reg; REGISTERED</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
