import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { ShoppingBag, Search } from 'lucide-react'

export default function Category() {
  const { categoryType } = useParams()
  const { addToCart } = useCart()
  const { t } = useThemeLang()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [branch, setBranch] = useState('ngt')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products?branch=${branch}&type=${categoryType}`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách sản phẩm:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [categoryType, branch])

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categoryName = categoryType === 'food' ? t('thức ăn') : t('thức uống')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-wide">{categoryName}</h1>
          <p className="text-slate-500 text-xs font-semibold uppercase mt-1">{t('Danh sách sản phẩm thuộc nhóm')} {categoryName.toLowerCase()}</p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">{t('chi nhánh')}:</span>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 bg-white border border-[#eeeeee] rounded-xl focus:outline-none focus:border-[#00b4d8] text-slate-700 text-xs font-bold shadow-sm"
          >
            <option value="ngt">Convenia Nguyễn Gia Trí (Bình Thạnh)</option>
            <option value="nvt">Convenia Nguyễn Văn Thương (Bình Thạnh)</option>
            <option value="dbp">Convenia Điện Biên Phủ (Bình Thạnh)</option>
            <option value="nhc">Convenia Nguyễn Hữu Cảnh (Bình Thạnh)</option>
          </select>
        </div>
      </div>

      {/* Search Filter Panel */}
      <div className="flex justify-end items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('tìm sản phẩm...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#00b4d8] text-slate-800 text-xs font-bold placeholder-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200/50 rounded-2xl h-[260px] border border-slate-200" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const price = product.is_flash_sale
                ? product.price * (1 - (product.discount_percent || 20) / 100)
                : product.price

              return (
                <div key={product.id} className="glass-hover bg-white border border-[#eeeeee] rounded-2xl p-5 flex flex-col justify-between relative shadow-sm overflow-hidden">
                  {product.is_flash_sale && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded shadow z-10">
                      SALE {product.discount_percent}%
                    </span>
                  )}

                  <Link to={`/product/${product.id}`} className="w-full h-44 overflow-hidden mb-3 flex items-center justify-center">
                    <img
                      src={product.image_url || '/assets/img/default.png'}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop' }}
                    />
                  </Link>

                  <div className="space-y-3 flex-grow flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider font-mono">{product.pid}</span>
                      <Link to={`/product/${product.id}`} className="block font-bold text-slate-800 hover:text-[#00b4d8] text-sm line-clamp-2 mt-0.5">
                        {product.name}
                      </Link>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-green-600">{t('Còn hàng')}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.is_flash_sale && (
                            <span className="text-slate-400 line-through text-[10px] font-semibold">
                              {product.price.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                          <span className="text-[#00b4d8] font-black text-base">
                            {price.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-bold">/{product.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2.5 rounded-lg bg-[#00b4d8] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md hover:shadow-lg"
                    >
                      {t('thêm vào giỏ')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-slate-400 text-sm">
              {t('Không tìm thấy sản phẩm nào!')}
            </div>
          )}
        </>
      )}

    </div>
  )
}
