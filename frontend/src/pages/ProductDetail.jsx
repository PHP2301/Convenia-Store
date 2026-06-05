import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { ShoppingBag, ChevronLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react'

export default function ProductDetail() {
  const { productId } = useParams()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const { t } = useThemeLang()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${productId}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin chi tiết sản phẩm:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProductDetails()
  }, [productId])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-1/2 h-[380px] bg-slate-200/50 rounded-3xl" />
          <div className="flex-1 space-y-6 py-4">
            <div className="h-8 bg-slate-200/50 rounded w-3/4" />
            <div className="h-6 bg-slate-200/50 rounded w-1/4" />
            <div className="h-24 bg-slate-200/50 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">{t('Không tìm thấy sản phẩm!')}</h2>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-[#00b4d8] text-white rounded-full text-xs font-bold uppercase tracking-wider">
          {t('quay lại')}
        </button>
      </div>
    )
  }

  const price = product.is_flash_sale
    ? product.price * (1 - (product.discount_percent || 20) / 100)
    : product.price

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-slate-500 hover:text-[#00b4d8] transition-colors font-bold text-xs uppercase tracking-wide"
        >
          <ChevronLeft className="w-4.5 h-4.5" />
          <span>{t('quay lại')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Product image zoom view */}
        <div className="p-8 rounded-3xl border border-[#eeeeee] flex items-center justify-center bg-white shadow-sm h-[400px]">
          <img
            src={product.image_url || '/assets/img/default.png'}
            alt={product.name}
            className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-350"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop' }}
          />
        </div>

        {/* Product details info & configurations */}
        <div className="space-y-6 bg-white border border-[#eeeeee] p-8 rounded-3xl shadow-sm">
          
          <div className="space-y-2">
            <span className="px-3 py-1 bg-[#caf0f8] border border-[#00b4d8]/20 text-[#0077b6] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              {product.branch.toUpperCase()} Store
            </span>
            <h1 className="text-3xl font-black text-slate-800 leading-tight font-sans uppercase tracking-wide">{product.name}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('mã sản phẩm')}: {product.pid}</p>
          </div>

          <div className="flex items-baseline space-x-4 border-b border-slate-100 pb-5">
            <span className="text-2xl font-black text-[#00b4d8]">
              {price.toLocaleString('vi-VN')}đ
            </span>
            {product.is_flash_sale && (
              <>
                <span className="text-slate-400 line-through text-sm font-semibold">
                  {product.price.toLocaleString('vi-VN')}đ
                </span>
                <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-500 font-black text-[9px] rounded-md">
                  -{product.discount_percent}%
                </span>
              </>
            )}
            <span className="text-xs text-slate-500 font-bold">/{product.unit}</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('thông số dinh dưỡng & mô tả')}</h3>
            <p className="text-xs text-slate-650 leading-relaxed font-semibold">
              {t('sản phẩm tươi sạch chế biến trong ngày bởi đội ngũ convenia store. đảm bảo tuân thủ nghiêm ngặt tiêu chuẩn vệ sinh an toàn thực phẩm cao nhất.')}
            </p>
          </div>

          {/* Specs sheet */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden text-xs text-slate-600 font-medium">
            <div className="flex justify-between border-b border-slate-100 p-3.5">
              <span className="text-slate-400 font-bold">{t('phân loại món')}</span>
              <span className="capitalize font-bold text-slate-800">{product.type === 'food' ? t('thức ăn') : t('thức uống')}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 p-3.5">
              <span className="text-slate-400 font-bold">{t('số lượng tồn kho')}</span>
              <span className="font-bold text-slate-800">{product.stock} {product.unit}</span>
            </div>
            <div className="flex justify-between p-3.5">
              <span className="text-slate-400 font-bold">{t('hình thức cung cấp')}</span>
              <span className="font-bold text-slate-800">{t('ăn trực tiếp tại chỗ hoặc mang đi')}</span>
            </div>
          </div>

          {/* Quantity selector & Add to cart button */}
          <div className="flex items-center space-x-4 pt-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1.5 shadow-inner">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-3 py-0.5 text-slate-500 hover:text-slate-800 text-sm font-bold"
              >
                -
              </button>
              <span className="px-4 font-mono text-sm font-bold text-slate-800 min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-3 py-0.5 text-slate-500 hover:text-slate-800 text-sm font-bold"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  addToCart(product)
                }
              }}
              className="flex-1 py-4 flex items-center justify-center space-x-2 rounded-xl bg-[#00b4d8] hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span>{t('thêm vào giỏ')}</span>
            </button>
          </div>

          {/* Quick trust badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center">
            <div className="flex flex-col items-center space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-[#00b4d8]" />
              <span>{t('vệ sinh an toàn')}</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <Truck className="w-5 h-5 text-[#00b4d8]" />
              <span>{t('giao siêu tốc 20p')}</span>
            </div>
            <div className="flex flex-col items-center space-y-1.5">
              <RefreshCw className="w-5 h-5 text-[#00b4d8]" />
              <span>{t('hỗ trợ đổi trả')}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
