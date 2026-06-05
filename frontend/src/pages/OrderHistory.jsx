import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { Link } from 'react-router-dom'
import { Calendar, Receipt, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react'

export default function OrderHistory() {
  const { user } = useAuth()
  const { t } = useThemeLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return
      try {
        const res = await fetch(`/api/orders?user_id=${user.uid}`)
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch (err) {
        console.error("Lỗi lấy lịch sử đơn hàng:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  const toggleExpand = (id) => {
    setExpandedOrder((prev) => (prev === id ? null : id))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      
      {/* Title */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-wide">{t('lịch sử mua hàng')}</h1>
        <p className="text-slate-500 text-xs font-semibold uppercase mt-1">{t('danh sách các đơn hàng đã đặt thành công tại hệ thống convenia')}</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200/50 rounded-2xl h-[100px] border border-slate-200" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-[#eeeeee] space-y-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-350 mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-705 text-slate-700">{t('chưa có đơn hàng nào!')}</h3>
          <p className="text-slate-500 text-xs font-semibold">{t('hãy đặt món đồ đầu tiên để bắt đầu lưu lịch sử.')}</p>
          <Link
            to="/menu"
            className="inline-flex items-center px-5 py-2.5 bg-[#00b4d8] hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-full transition-colors shadow-md"
          >
            {t('mua sắm ngay')}
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id
            const orderDate = new Date(order.order_date).toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-[#eeeeee] overflow-hidden bg-white shadow-sm"
              >
                {/* Header info */}
                <div
                  onClick={() => toggleExpand(order.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-[#caf0f8] text-[#0077b6] rounded-xl border border-[#00b4d8]/20">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{order.order_id}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center mt-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>{orderDate}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('tổng thanh toán')}</p>
                      <p className="font-extrabold text-sm text-[#00b4d8] mt-0.5">
                        {order.total_amount.toLocaleString('vi-VN')}đ
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-0.5 text-[9px] font-bold text-[#0077b6] bg-[#caf0f8] border border-[#00b4d8]/20 rounded-md uppercase tracking-wider">
                        {order.status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-4">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('danh sách món ăn')}</h5>
                    <div className="space-y-3.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.image_url || '/assets/img/default.png'}
                              alt={item.product_name}
                              className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop' }}
                            />
                            <div>
                              <p className="font-bold text-slate-700">{item.product_name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">
                                {t('số lượng: ')}<span className="font-extrabold text-slate-700">{item.quantity}</span>
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-[#00b4d8]">
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
