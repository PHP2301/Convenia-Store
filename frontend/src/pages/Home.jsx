import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { ShoppingBag, ChevronLeft, ChevronRight, Zap, ArrowRight, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const { addToCart } = useCart()
  const { t } = useThemeLang()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)

  // Banners from Circle K Vietnam as in the old site
  const bannerSlides = [
    {
      img: 'https://www.circlek.com.vn/wp-content/uploads/2026/01/1920x536_1920x536_acf_cropped_1920x536_acf_cropped.jpg',
      alt: 'Banner Hot Deal'
    },
    {
      img: 'https://www.circlek.com.vn/wp-content/uploads/2026/05/Banner_DinoWeb_1920x536-3_1920x536_acf_cropped.png',
      alt: 'Khuyến mãi Dino'
    },
    {
      img: 'https://www.circlek.com.vn/wp-content/uploads/2026/05/1920-x-536_1920x536_acf_cropped.png',
      alt: 'Ưu đãi đặc biệt'
    }
  ]

  // Slide AutoPlay
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % bannerSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Fetch Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?branch=ngt')
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
  }, [])

  // Timer for Flash Sale
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [flashEndTime, setFlashEndTime] = useState(null)

  // Fetch flash sale end time from server
  useEffect(() => {
    const fetchSetting = async () => {
      try {
        const res = await fetch('/api/settings/flash_sale')
        if (res.ok) {
          const data = await res.json()
          if (data.exists && data.value) {
            const timestamp = parseInt(data.value)
            if (!isNaN(timestamp)) {
              setFlashEndTime(timestamp)
            }
          }
        }
      } catch (err) {
        console.error("Lỗi lấy thời gian flash sale:", err)
      }
    }

    fetchSetting()
    // Poll every 10 seconds to keep it "realtime"
    const pollInterval = setInterval(fetchSetting, 10000)
    return () => clearInterval(pollInterval)
  }, [])

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!flashEndTime) {
        // Fallback: end of today
        const now = new Date()
        const endOfToday = new Date()
        endOfToday.setHours(23, 59, 59, 999)
        const diff = endOfToday - now
        if (diff > 0) {
          setTimeLeft({
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60)
          })
        }
        return
      }

      const now = new Date().getTime()
      const diff = flashEndTime - now
      
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)), // Total hours remaining
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        })
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [flashEndTime])

  const flashSales = products.filter(p => p.is_flash_sale)
  const featured = products.filter(p => !p.is_flash_sale).slice(0, 4)

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Hero Slide Section (Circle K Banner Slider style) */}
      <div className="relative w-full max-w-7xl mx-auto md:my-6 md:rounded-2xl overflow-hidden shadow-lg aspect-[1920/536] bg-slate-200 border border-slate-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.6 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <img
              src={bannerSlides[activeSlide].img}
              alt={bannerSlides[activeSlide].alt}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Slide navigation controls */}
        <button
          onClick={() => setActiveSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveSlide((prev) => (prev + 1) % bannerSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                activeSlide === idx ? 'bg-[#00b4d8]' : 'bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 2. Shortcuts / Category boxes */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: t('Thực đơn'), type: 'food', icon: '🍔', desc: t('Thức ăn') },
            { name: t('Thức uống'), type: 'drink', icon: '🥤', desc: t('Thức uống') },
            { name: t('Tất cả menu'), type: 'menu', icon: '📋', desc: t('Tất cả menu') },
            { name: t('Cửa hàng'), type: 'stores', icon: '📍', desc: t('Hệ thống cửa hàng') }
          ].map((cat, i) => (
            <Link
              key={i}
              to={cat.type === 'menu' ? '/menu' : cat.type === 'stores' ? '/stores' : `/category/${cat.type}`}
              className="group p-6 bg-white border border-[#eeeeee] rounded-2xl text-center shadow-sm transition-all duration-300 hover:border-[#00b4d8] hover:-translate-y-1.5 hover:shadow-md"
            >
              <div className="text-3xl mb-3">{cat.icon}</div>
              <h3 className="font-extrabold text-slate-800 text-sm">{cat.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">{cat.desc}</p>
            </Link>
          ))}
        </section>

        {/* 3. Flash Sale Section */}
        {flashSales.length > 0 && (
          <section className="p-8 rounded-3xl border border-red-200 bg-white shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-5 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500 text-white rounded-full shadow-md shadow-red-500/20">
                  <Zap className="w-5 h-5 animate-pulse fill-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-red-600 tracking-wider">
                    {t('flash sale chớp nhoáng')}
                  </h2>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{t('flash sale chớp nhoáng')}</p>
                </div>
              </div>
              
              {/* Countdown Timer */}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wide">{t('kết thúc trong')}:</span>
                {[
                  { label: 'hours', val: timeLeft.hours },
                  { label: 'minutes', val: timeLeft.minutes },
                  { label: 'seconds', val: timeLeft.seconds }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center">
                    <span className="px-2.5 py-1.5 rounded-lg bg-red-500 text-white font-extrabold text-sm shadow min-w-[32px] text-center">
                      {String(item.val).padStart(2, '0')}
                    </span>
                    {idx < 2 && <span className="text-red-500 font-black px-1">:</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Flash Sale Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {flashSales.map((product) => {
                const discountedPrice = product.price * (1 - product.discount_percent / 100)
                return (
                  <div key={product.id} className="glass-hover bg-white border border-[#eeeeee] rounded-2xl p-5 flex flex-col justify-between relative shadow-sm overflow-hidden">
                    <span className="absolute top-3 left-3 px-2 py-0.5 text-[9px] font-black text-white bg-red-500 rounded z-10 shadow">
                      -{product.discount_percent}%
                    </span>
                    
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
                        <p className="text-xs font-bold text-green-600">{t('còn hàng')}</p>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[#00b4d8] font-black text-base">
                            {discountedPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-slate-400 line-through text-[11px] font-semibold">
                            {product.price.toLocaleString('vi-VN')}đ
                          </span>
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
          </section>
        )}

        {/* 4. Featured Recommendations */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-wide uppercase">{t('sản phẩm nổi bật')}</h2>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">{t('ck go tự hào cung cấp các dịch vụ tiện ích đa dạng và chất lượng nhất')}</p>
            </div>
            <Link to="/menu" className="text-xs font-bold text-[#00b4d8] hover:text-[#0077b6] flex items-center">
              {t('tất cả menu')} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200/50 rounded-2xl h-[260px] border border-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.map((product) => (
                <div key={product.id} className="glass-hover bg-white border border-[#eeeeee] rounded-2xl p-5 flex flex-col justify-between shadow-sm overflow-hidden">
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
                      <p className="text-xs font-bold text-green-600">{t('còn hàng')}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#00b4d8] font-black text-base">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">/{product.unit}</span>
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
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
