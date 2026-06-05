import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useThemeLang } from "../context/ThemeLangContext";
import { ShoppingBag, Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export default function SearchPage() {
  const { addToCart } = useCart();
  const { t } = useThemeLang();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [branch, setBranch] = useState("ngt");
  const [priceRange, setPriceRange] = useState(150000); // max price slider
  const [sortBy, setSortBy] = useState("priceAsc"); // priceAsc, priceDesc, nameAsc

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?branch=${branch}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách tìm kiếm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, [branch]);

  // Realtime instant search filter logic on client-side
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const productPrice = product.is_flash_sale
        ? product.price * (1 - (product.discount_percent || 20) / 100)
        : product.price;
      const matchesPrice = productPrice <= priceRange;
      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      const priceA = a.is_flash_sale ? a.price * (1 - (a.discount_percent || 20) / 100) : a.price;
      const priceB = b.is_flash_sale ? b.price * (1 - (b.discount_percent || 20) / 100) : b.price;

      if (sortBy === "priceAsc") return priceA - priceB;
      if (sortBy === "priceDesc") return priceB - priceA;
      if (sortBy === "nameAsc") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-wide">{t("tìm kiếm")}</h1>
        <p className="text-slate-500 text-xs font-semibold uppercase mt-1">
          {t("ck go tự hào cung cấp các dịch vụ tiện ích đa dạng và chất lượng nhất")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Filter Controls panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl border border-[#eeeeee] bg-white space-y-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-[#00b4d8]" />
              <span>{t("bộ lọc sản phẩm")}</span>
            </h2>

            {/* Branch Filter */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t("chi nhánh")}</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#eeeeee] rounded-xl text-slate-700 text-xs font-bold focus:outline-none shadow-sm">
                <option value="ngt">Convenia Nguyễn Gia Trí (ngt)</option>
                <option value="nvt">Convenia Nguyễn Văn Thương (nvt)</option>
                <option value="dbp">Điện Biên Phủ (dbp)</option>
                <option value="nhc">Nguyễn Hữu Cảnh (nhc)</option>
              </select>
            </div>

            {/* Price range filter */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>{t("khoảng giá tối đa")}</span>
                <span className="text-[#00b4d8] font-extrabold normal-case">{priceRange.toLocaleString("vi-VN")}đ</span>
              </div>
              <input
                type="range"
                min="5000"
                max="150000"
                step="5000"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#00b4d8]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>5.000đ</span>
                <span>150.000đ</span>
              </div>
            </div>

            {/* Sort order options */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-[#00b4d8]" />
                <span>{t("sắp xếp theo")}</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#eeeeee] rounded-xl text-slate-700 text-xs font-bold focus:outline-none shadow-sm">
                <option value="priceAsc">{t("giá: từ thấp đến cao")}</option>
                <option value="priceDesc">{t("giá: từ cao đến thấp")}</option>
                <option value="nameAsc">{t("tên: a đến z")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right column: Results list */}
        <div className="lg:col-span-3 space-y-6">
          {/* Realtime Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t("tìm sản phẩm...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-white border border-[#eeeeee] rounded-2xl focus:outline-none focus:border-[#00b4d8] text-slate-880 placeholder-slate-400 text-xs font-bold shadow-sm"
            />
          </div>

          {/* Results grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200/50 rounded-2xl h-[260px] border border-slate-200" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const price = product.is_flash_sale
                    ? product.price * (1 - (product.discount_percent || 20) / 100)
                    : product.price;

                  return (
                    <div
                      key={product.id}
                      className="glass-hover bg-white border border-[#eeeeee] rounded-2xl p-5 flex flex-col justify-between relative shadow-sm overflow-hidden">
                      {product.is_flash_sale && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded shadow z-10">
                          -{product.discount_percent}%
                        </span>
                      )}

                      <Link
                        to={`/product/${product.id}`}
                        className="w-full h-44 overflow-hidden mb-3 flex items-center justify-center">
                        <img
                          src={product.image_url || "/assets/img/default.png"}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src =
                              "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop";
                          }}
                        />
                      </Link>

                      <div className="space-y-3 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider font-mono">
                            {product.pid}
                          </span>
                          <Link
                            to={`/product/${product.id}`}
                            className="block font-bold text-slate-800 hover:text-[#00b4d8] text-sm line-clamp-2 mt-0.5">
                            {product.name}
                          </Link>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-green-600">{t("Còn hàng")}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              {product.is_flash_sale && (
                                <span className="text-slate-400 line-through text-[10px] font-semibold">
                                  {product.price.toLocaleString("vi-VN")}đ
                                </span>
                              )}
                              <span className="text-[#00b4d8] font-black text-base">
                                {price.toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-450 font-bold text-slate-500">/{product.unit}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2.5 rounded-lg bg-[#00b4d8] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md hover:shadow-lg">
                          {t("thêm vào giỏ")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-slate-400 text-sm">{t("Không tìm thấy sản phẩm nào!")}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
