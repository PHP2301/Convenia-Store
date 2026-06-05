import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Percent, Receipt } from 'lucide-react'

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart()
  const { user } = useAuth()
  const { t } = useThemeLang()
  const navigate = useNavigate()

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [couponMessage, setCouponMessage] = useState('')

  // Checkout state
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)

  const handleApplyCoupon = () => {
    setCouponMessage('')
    if (couponCode.toUpperCase() === 'CONVENIA10') {
      setDiscountPercent(10)
      setCouponMessage(t('Áp dụng mã giảm giá 10% thành công!'))
    } else if (couponCode.toUpperCase() === 'CONVENIA50') {
      setDiscountPercent(50)
      setCouponMessage(t('WOW! Áp dụng mã giảm giá 50% thành công!'))
    } else {
      setCouponMessage(t('Mã giảm giá không hợp lệ!'))
      setDiscountPercent(0)
    }
  }

  const subtotal = getCartTotal()
  const discountAmount = subtotal * (discountPercent / 100)
  const shippingFee = subtotal > 100000 || subtotal === 0 ? 0 : 15000
  const grandTotal = subtotal - discountAmount + shippingFee

  const handleCheckout = async () => {
    if (!user) {
      alert(t('Vui lòng đăng nhập trước khi thanh toán!'))
      navigate('/login')
      return
    }

    if (cart.length === 0) return

    setLoading(true)
    try {
      // --- FIDO2 MFA STEP-UP (Chỉ áp dụng cho đơn hàng >= 1.000.000đ) ---
      if (grandTotal >= 1000000) {
        if (user.has_fido) {
          const confirmFido = confirm(t('Đơn hàng có giá trị lớn (>= 1.000.000đ) yêu cầu xác thực sinh trắc học bảo mật (FIDO2 Step-up). Xác nhận xác thực?'))
          if (!confirmFido) {
            alert(t('Đã hủy thanh toán đơn hàng có giá trị cao!'))
            setLoading(false)
            return
          }
          
          try {
            const challenge = new Uint8Array(32)
            window.crypto.getRandomValues(challenge)
            
            await navigator.credentials.get({
              publicKey: {
                challenge: challenge,
                rpId: window.location.hostname,
                timeout: 60000,
                userVerification: "required",
              }
            })
            alert(t('Xác thực sinh trắc học thành công!'))
          } catch (fidoErr) {
            console.error("Lỗi FIDO2 Step-up:", fidoErr)
            alert(t('Xác thực sinh trắc học thất bại hoặc bị hủy!'))
            setLoading(false)
            return
          }
        } else {
          alert(t('Đơn hàng từ 1.000.000đ trở lên yêu cầu Xác thực đa yếu tố cấp cao (MFA Step-up). Vui lòng vào trang Hồ sơ để liên kết thiết bị bảo mật (FIDO2) trước!'))
          setLoading(false)
          return
        }
      }

      const orderId = `ORD-${Date.now()}`
      
      // 1. Create order in Database
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user.uid,
          order_id: orderId,
          total_amount: grandTotal,
          status: 'Hoàn tất',
          items: cart.map(item => ({
            product_name: item.name,
            price: item.is_flash_sale ? item.price * (1 - (item.discount_percent || 20) / 100) : item.price,
            quantity: item.quantity,
            image_url: item.image_url || ''
          }))
        })
      })

      if (!orderRes.ok) throw new Error(t('Không thể khởi tạo đơn hàng!'))

      // 2. Log inventory for each item
      for (const item of cart) {
        await fetch('/api/inventory-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: item.name,
            quantity: item.quantity,
            type: 'Xuất kho',
            userName: user.fullname || user.email,
            branch: item.branch
          })
        })

        const newStock = Math.max(0, (item.stock || 10) - item.quantity)
        await fetch(`/api/products/${item.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`
          },
          body: JSON.stringify({
            ...item,
            stock: newStock
          })
        })
      }

      setOrderSuccess(true)
      clearCart()
      setTimeout(() => navigate('/order-history'), 1500)

    } catch (err) {
      alert(err.message || t('Lỗi thanh toán!'))
    } finally {
      setLoading(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-[#caf0f8] border border-[#00b4d8]/20 text-[#00b4d8] rounded-full flex items-center justify-center text-3xl font-bold animate-bounce shadow">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{t('Đặt Hàng Thành Công!')}</h2>
        <p className="text-slate-550 text-xs font-semibold text-slate-400">{t('Cảm ơn bạn đã mua sắm tại Convenia Premium. Đang chuyển hướng...')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-wide">{t('giỏ hàng')}</h1>
        <p className="text-slate-500 text-xs font-semibold uppercase mt-1">{t('kiểm tra thông tin sản phẩm và áp mã giảm giá để thanh toán')}</p>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#eeeeee] space-y-5 shadow-sm">
          <ShoppingBag className="w-16 h-16 text-slate-350 mx-auto text-slate-300" />
          <h3 className="text-lg font-bold text-slate-700">{t('Giỏ hàng trống!')}</h3>
          <p className="text-slate-500 text-xs font-semibold">{t('Chưa có mặt hàng nào trong giỏ của bạn.')}</p>
          <Link
            to="/menu"
            className="inline-flex items-center px-6 py-3 bg-[#00b4d8] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-md"
          >
            {t('mua sắm ngay')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List of Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => {
              const price = item.is_flash_sale
                ? item.price * (1 - (item.discount_percent || 20) / 100)
                : item.price

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-5 bg-white border border-[#eeeeee] rounded-2xl shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.image_url || '/assets/img/default.png'}
                      alt={item.name}
                      className="w-16 h-16 object-contain rounded-xl border border-slate-100"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop' }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5 capitalize">/{item.unit}</p>
                      <p className="text-sm text-[#00b4d8] font-black mt-1">
                        {price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Quantity controls */}
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1.5 shadow-inner">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-500 hover:text-slate-800 text-sm font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-mono text-sm font-bold text-slate-800 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-500 hover:text-slate-800 text-sm font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-xl hover:bg-slate-100"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Checkout Summary panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Promo Code Card */}
            <div className="p-6 rounded-3xl border border-[#eeeeee] shadow-sm bg-white space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Percent className="w-4 h-4 text-[#00b4d8]" />
                <span>{t('mã ưu đãi')}</span>
              </h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="CONVENIA10 hoặc CONVENIA50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#00b4d8] text-slate-800 text-xs font-bold placeholder-slate-400 uppercase shadow-sm"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wide transition-colors shrink-0"
                >
                  {t('áp dụng')}
                </button>
              </div>
              {couponMessage && (
                <p className={`text-[11px] font-bold ${
                  discountPercent > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Receipt Summary Card */}
            <div className="p-6 rounded-3xl border border-[#eeeeee] shadow-sm bg-white space-y-6">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-[#00b4d8]" />
                <span>{t('tóm tắt thanh toán')}</span>
              </h3>

              <div className="space-y-3.5 text-xs text-slate-500 border-b border-slate-150 pb-5 font-semibold">
                <div className="flex justify-between">
                  <span>{t('tạm tính')}</span>
                  <span className="text-slate-800 font-extrabold">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>{t('ưu đãi')} (-{discountPercent}%)</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('phí vận chuyển')}</span>
                  <span className="text-slate-800 font-extrabold">{shippingFee === 0 ? t('miễn phí') : `${shippingFee.toLocaleString('vi-VN')}đ`}</span>
                </div>
                {shippingFee > 0 && (
                  <p className="text-[10px] text-slate-400">{t('miễn phí giao hàng cho đơn hàng trên 100k')}</p>
                )}
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('tổng cộng')}</span>
                <span className="text-2xl font-black text-[#00b4d8]">
                  {grandTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
                className="w-full py-4 flex items-center justify-center space-x-2 rounded-xl bg-[#00b4d8] hover:bg-black text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
              >
                <span>{t('thanh toán đơn hàng')}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
