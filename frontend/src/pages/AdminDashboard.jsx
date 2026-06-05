import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { PlusCircle, Edit2, Trash2, ShieldAlert, Sparkles, ArrowUpRight, ArrowDownLeft, Upload, Clock } from 'lucide-react'

export default function AdminDashboard() {
  const { user, fetchWithAuth } = useAuth()
  const { t } = useThemeLang()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [branch, setBranch] = useState('ngt')

  // Product Form states
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  
  const [pid, setPid] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('food')
  const [stock, setStock] = useState(10)
  const [price, setPrice] = useState(20000)
  const [unit, setUnit] = useState('Cái')
  const [prodBranch, setProdBranch] = useState('ngt')
  const [imageUrl, setImageUrl] = useState('')
  const [isFlashSale, setIsFlashSale] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(20)

  // Upload state
  const [uploading, setUploading] = useState(false)

  // Flash Sale Settings state
  const [flashEndTime, setFlashEndTime] = useState('')
  const [settingsSearchQuery, setSettingsSearchQuery] = useState('')

  // Fetch flash sale setting
  const fetchFlashSaleSetting = async () => {
    try {
      const res = await fetch('/api/settings/flash_sale')
      if (res.ok) {
        const data = await res.json()
        if (data.exists && data.value) {
          const timestamp = parseInt(data.value)
          if (!isNaN(timestamp)) {
            const date = new Date(timestamp)
            const tzoffset = date.getTimezoneOffset() * 60000; 
            const localISOTime = (new Date(date - tzoffset)).toISOString().slice(0, 16);
            setFlashEndTime(localISOTime)
          }
        }
      }
    } catch (err) {
      console.error("Lỗi khi load cấu hình bộ đếm:", err)
    }
  }

  const handleSaveFlashTimer = async () => {
    if (!flashEndTime) {
      alert(t('Vui lòng chọn ngày giờ kết thúc hợp lệ!'))
      return
    }

    try {
      const selectedTime = new Date(flashEndTime).getTime()
      const res = await fetchWithAuth('/api/settings/flash_sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: selectedTime.toString() })
      })

      if (res.ok) {
        alert(t('Đã cập nhật thời gian kết thúc Flash Sale thành công!'))
      } else {
        const data = await res.json()
        throw new Error(data.detail || t('Lưu cấu hình thất bại!'))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleToggleFlashSale = async (product, isFlash, discountVal) => {
    try {
      const updatedProduct = {
        ...product,
        is_flash_sale: isFlash,
        discount_percent: Math.max(1, Math.min(99, parseInt(discountVal) || 20))
      }
      const res = await fetchWithAuth(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      })

      if (res.ok) {
        // Update local products list
        setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p))
      } else {
        const data = await res.json()
        throw new Error(data.detail || t('Không thể cập nhật trạng thái Flash Sale!'))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleClearAllFlashSale = async () => {
    if (!window.confirm(t('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi chương trình Flash Sale không?'))) return
    try {
      const res = await fetchWithAuth('/api/products/clear-flash-sale', {
        method: 'POST'
      })
      if (res.ok) {
        setProducts(prev => prev.map(p => ({ ...p, is_flash_sale: false })))
        alert(t('Đã xóa tất cả sản phẩm khỏi Flash Sale thành công!'))
      } else {
        throw new Error(t('Không thể xóa Flash Sale!'))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  // Fetch Data
  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'products') {
        const res = await fetch(`/api/products?branch=${branch}`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      } else if (activeTab === 'inventory') {
        const res = await fetchWithAuth('/api/inventory-logs')
        if (res.ok) {
          const data = await res.json()
          setLogs(data)
        }
      } else if (activeTab === 'settings') {
        await fetchFlashSaleSetting()
        // Fetch products as well to toggle them in Settings tab
        const res = await fetch(`/api/products?branch=${branch}`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data)
        }
      }
    } catch (err) {
      console.error("Lỗi lấy thông tin admin:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, branch])

  // Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const data = await res.json()
        setImageUrl(data.imageUrl)
        alert(t('Tải hình ảnh lên thành công!'))
      } else {
        throw new Error(t('Lỗi upload file!'))
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditProduct(prod)
      setPid(prod.pid)
      setName(prod.name)
      setType(prod.type)
      setStock(prod.stock)
      setPrice(prod.price)
      setUnit(prod.unit)
      setProdBranch(prod.branch)
      setImageUrl(prod.image_url)
      setIsFlashSale(prod.is_flash_sale)
      setDiscountPercent(prod.discount_percent || 20)
    } else {
      setEditProduct(null)
      setPid(`PID-${Math.floor(1000 + Math.random() * 9000)}`)
      setName('')
      setType('food')
      setStock(10)
      setPrice(20000)
      setUnit('Cái')
      setProdBranch(branch)
      setImageUrl('')
      setIsFlashSale(false)
      setDiscountPercent(20)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      pid,
      name,
      type,
      stock: parseInt(stock),
      price: parseFloat(price),
      unit,
      branch: prodBranch,
      image_url: imageUrl,
      is_flash_sale: isFlashSale,
      discount_percent: parseInt(discountPercent)
    }

    try {
      let res
      if (editProduct) {
        res = await fetchWithAuth(`/api/products/${editProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetchWithAuth('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        await fetch('/api/inventory-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: name,
            quantity: parseInt(stock),
            type: editProduct ? 'Điều chỉnh kho' : 'Nhập kho',
            userName: user.fullname || user.email,
            branch: prodBranch
          })
        })

        setShowModal(false)
        fetchData()
        alert(editProduct ? t('Đã chỉnh sửa sản phẩm!') : t('Đã thêm sản phẩm thành công!'))
      } else {
        const data = await res.json()
        throw new Error(data.detail || t('Thao tác sản phẩm thất bại!'))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id, prodName, currentStock, prodBranchCode) => {
    if (!window.confirm(t('Bạn có chắc chắn muốn xóa sản phẩm ') + prodName + t(' không?'))) return
    
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await fetch('/api/inventory-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: prodName,
            quantity: currentStock,
            type: 'Hủy hàng (Xóa)',
            userName: user.fullname || user.email,
            branch: prodBranchCode
          })
        })

        fetchData()
        alert(t('Đã xóa sản phẩm khỏi hệ thống!'))
      } else {
        throw new Error(t('Không thể xóa sản phẩm!'))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center space-x-2 uppercase tracking-wide">
            <ShieldAlert className="w-8 h-8 text-yellow-600 shrink-0" />
            <span>{t('Trang Quản Trị Hệ Thống')}</span>
          </h1>
          <p className="text-slate-500 text-xs font-semibold uppercase mt-1">{t('Cấu hình sản phẩm, kiểm soát số lượng kho hàng tiện lợi')}</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-white border border-[#eeeeee] rounded-xl p-1.5 self-stretch md:self-auto shrink-0 shadow-sm">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'products' ? 'bg-[#00b4d8] text-white shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('Quản Lý Sản Phẩm')}
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'inventory' ? 'bg-[#00b4d8] text-white shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('Nhật Ký Kho Hàng')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'settings' ? 'bg-[#00b4d8] text-white shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('Cấu Hình Flash Sale')}
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="flex flex-col md:flex-row gap-5 justify-between items-center bg-white p-5 rounded-2xl border border-[#eeeeee] shadow-sm">
          {/* Branch Select */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">{t('Cửa hàng:')}</span>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[#eeeeee] rounded-xl focus:outline-none focus:border-[#00b4d8] text-slate-700 text-xs font-bold shadow-sm"
            >
              <option value="ngt">Convenia Nguyễn Gia Trí (ngt)</option>
              <option value="nvt">Convenia Nguyễn Văn Trỗi (nvt)</option>
              <option value="dbp">Convenia Điện Biên Phủ (dbp)</option>
              <option value="nhc">Convenia Nguyễn Hữu Cảnh (nhc)</option>
            </select>
          </div>

          {/* Add Product Button */}
          <button
            onClick={() => handleOpenModal()}
            className="w-full md:w-auto px-5 py-2.5 bg-[#00b4d8] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('Thêm Sản Phẩm Mới')}</span>
          </button>
        </div>
      )}

      {/* Main content lists */}
      {loading ? (
        <div className="animate-pulse bg-slate-200/50 rounded-2xl h-[300px] border border-slate-200" />
      ) : activeTab === 'products' ? (
        <div className="rounded-3xl border border-[#eeeeee] bg-white overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[#eeeeee] bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="p-4">{t('Ảnh')}</th>
                <th className="p-4">{t('Mã PID')}</th>
                <th className="p-4">{t('Tên Sản Phẩm')}</th>
                <th className="p-4">{t('Danh Mục')}</th>
                <th className="p-4 text-center">{t('Tồn Kho')}</th>
                <th className="p-4 text-right">{t('Đơn Giá')}</th>
                <th className="p-4 text-center">{t('Flash Sale')}</th>
                <th className="p-4 text-center">{t('Hành Động')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 text-slate-650 font-medium">
                  <td className="p-4">
                    <img
                      src={p.image_url || '/assets/img/default.png'}
                      alt={p.name}
                      className="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-white"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600&auto=format&fit=crop' }}
                    />
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500 font-bold">{p.pid}</td>
                  <td className="p-4 font-bold text-slate-800">{p.name}</td>
                  <td className="p-4 capitalize text-xs">
                    <span className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                      p.type === 'food' ? 'bg-[#caf0f8] text-[#0077b6] border border-[#00b4d8]/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    } border`}>
                      {p.type === 'food' ? t('Đồ Ăn') : t('Nước uống')}
                    </span>
                  </td>
                  <td className={`p-4 text-center font-black text-xs ${p.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>
                    {p.stock} {p.unit}
                  </td>
                  <td className="p-4 text-right font-black text-slate-800">{p.price.toLocaleString('vi-VN')}đ</td>
                  <td className="p-4 text-center">
                    {p.is_flash_sale ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 border border-red-100 text-[10px] font-black text-red-500">
                        <Sparkles className="w-3.5 h-3.5 mr-0.5" /> <span>-{p.discount_percent}%</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-bold">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleOpenModal(p)}
                        className="p-1.5 text-slate-400 hover:text-[#00b4d8] transition-colors"
                        title={t('Sửa')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name, p.stock, p.branch)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title={t('Xóa')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'inventory' ? (
        /* Inventory Logs Table */
        <div className="rounded-3xl border border-[#eeeeee] bg-white overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[#eeeeee] bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="p-4">{t('Thời Gian')}</th>
                <th className="p-4">{t('Tên Sản Phẩm')}</th>
                <th className="p-4">{t('Phân Loại')}</th>
                <th className="p-4 text-center">{t('Số Lượng')}</th>
                <th className="p-4">{t('Người Thực Hiện')}</th>
                <th className="p-4">{t('Chi Nhánh')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log, idx) => {
                const date = log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : '-'
                const isImport = log.type.includes('Nhập') || log.type.includes('Điều chỉnh')
                
                return (
                  <tr key={idx} className="hover:bg-slate-50 text-slate-650 font-medium">
                    <td className="p-4 text-xs font-mono text-slate-500 font-bold">{date}</td>
                    <td className="p-4 font-bold text-slate-800">{log.productName}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 text-[9px] font-bold rounded-lg border uppercase tracking-wider ${
                        isImport 
                          ? 'bg-green-50 text-green-600 border-green-200' 
                          : 'bg-red-50 text-red-500 border-red-200'
                      }`}>
                        {isImport ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownLeft className="w-3.5 h-3.5 mr-0.5" />}
                        <span>{log.type}</span>
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-black text-slate-700">
                      {isImport ? '+' : '-'}{log.quantity}
                    </td>
                    <td className="p-4 text-xs font-semibold">{log.userName}</td>
                    <td className="p-4 font-mono text-xs uppercase text-slate-400 font-bold">{log.branch}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Settings Tab (Flash Sale Timer Setting & Product Selector) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Timer config */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-[#eeeeee] rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide flex items-center justify-center md:justify-start gap-2">
                  <Clock className="w-5 h-5 text-red-500 shrink-0 animate-pulse" />
                  <span>{t('Thời Gian Kết Thúc Flash Sale')}</span>
                </h3>
                <p className="text-slate-400 text-xs font-semibold">{t('Điều chỉnh thời gian đếm ngược kết thúc Flash Sale hiển thị tại Trang Chủ.')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Chọn Ngày Giờ Kết Thúc')}</label>
                  <input
                    type="datetime-local"
                    value={flashEndTime}
                    onChange={(e) => setFlashEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#eeeeee] rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  />
                </div>

                <button
                  onClick={handleSaveFlashTimer}
                  className="w-full px-5 py-2.5 bg-[#00b4d8] hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <span>{t('Lưu Thời Gian')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Flash Sale Product Selector */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#eeeeee] rounded-3xl p-8 space-y-6 shadow-sm">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#eeeeee]">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500 shrink-0" />
                    <span>{t('Lựa Chọn Sản Phẩm Flash Sale')}</span>
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">{t('Tích chọn sản phẩm bên dưới để bật Flash Sale và đặt phần trăm giảm giá.')}</p>
                </div>
                
                <button
                  onClick={handleClearAllFlashSale}
                  className="px-4 py-2 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center space-x-1.5 border border-red-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('Hủy Toàn Bộ Flash Sale')}</span>
                </button>
              </div>

              {/* Search filter for products */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('Tìm kiếm sản phẩm theo tên hoặc mã...')}
                  value={settingsSearchQuery}
                  onChange={(e) => setSettingsSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f9f9f9] border border-[#eeeeee] rounded-xl text-slate-800 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-inner"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>

              {/* Products selection list */}
              <div className="overflow-x-auto max-h-[450px] overflow-y-auto rounded-2xl border border-[#eeeeee] shadow-sm">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#eeeeee] bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3 w-10 text-center">{t('Flash')}</th>
                      <th className="p-3">{t('Sản Phẩm')}</th>
                      <th className="p-3 text-right">{t('Giá Gốc')}</th>
                      <th className="p-3 text-center w-28">{t('% Giảm')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products
                      .filter(p => 
                        p.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) || 
                        p.pid.toLowerCase().includes(settingsSearchQuery.toLowerCase())
                      )
                      .map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 font-medium">
                          {/* Toggle Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={p.is_flash_sale}
                              onChange={(e) => handleToggleFlashSale(p, e.target.checked, p.discount_percent || 20)}
                              className="w-4 h-4 rounded text-[#00b4d8] focus:ring-[#00b4d8] border-[#eeeeee] cursor-pointer"
                            />
                          </td>
                          
                          {/* Image & Title */}
                          <td className="p-3 flex items-center space-x-3">
                            <img
                              src={p.image_url || '/assets/img/products/default.jpg'}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200"
                              onError={(e) => { e.target.src = '/assets/img/products/default.jpg' }}
                            />
                            <div>
                              <div className="font-bold text-slate-800 text-xs">{p.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono font-bold uppercase">{p.pid} • {p.unit}</div>
                            </div>
                          </td>

                          {/* Regular Price */}
                          <td className="p-3 text-right font-mono font-bold text-slate-700">
                            {p.price.toLocaleString('vi-VN')}đ
                          </td>

                          {/* Discount percent input */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <input
                                type="number"
                                min="1"
                                max="99"
                                disabled={!p.is_flash_sale}
                                defaultValue={p.discount_percent || 20}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value)
                                  if (val !== p.discount_percent) {
                                    handleToggleFlashSale(p, p.is_flash_sale, val)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = parseInt(e.target.value)
                                    if (val !== p.discount_percent) {
                                      handleToggleFlashSale(p, p.is_flash_sale, val)
                                    }
                                    e.target.blur()
                                  }
                                }}
                                className={`w-14 text-center px-1.5 py-1 text-xs font-mono font-black border rounded-lg focus:outline-none transition-all ${
                                  p.is_flash_sale
                                    ? 'bg-white border-[#00b4d8] text-slate-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              />
                              <span className={`text-[10px] font-bold ${p.is_flash_sale ? 'text-slate-650' : 'text-slate-400'}`}>%</span>
                            </div>
                          </td>
                        </tr>
                    ))}
                    {products.filter(p => 
                      p.name.toLowerCase().includes(settingsSearchQuery.toLowerCase()) || 
                      p.pid.toLowerCase().includes(settingsSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center p-8 text-slate-400 text-xs font-bold">
                          {t('Không tìm thấy sản phẩm nào')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Product Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">
              {editProduct ? t('Cập Nhật Sản Phẩm') : t('Thêm Sản Phẩm Mới')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Mã PID')}</label>
                  <input
                    type="text"
                    required
                    value={pid}
                    onChange={(e) => setPid(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Tên Sản Phẩm')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Phân Loại')}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  >
                    <option value="food">{t('Đồ Ăn')}</option>
                    <option value="drink">{t('Thức Uống')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Số Lượng Kho')}</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Đơn Vị Tính')}</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Cái, Hộp, Ly..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Đơn Giá')} (đ)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Chi Nhánh Cửa Hàng')}</label>
                  <select
                    value={prodBranch}
                    onChange={(e) => setProdBranch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  >
                    <option value="ngt">Nguyễn Gia Trí (ngt)</option>
                    <option value="nvt">Nguyễn Văn Trỗi (nvt)</option>
                    <option value="dbp">Điện Biên Phủ (dbp)</option>
                    <option value="nhc">Nguyễn Hữu Cảnh (nhc)</option>
                  </select>
                </div>
              </div>

              {/* Image URL with Upload Button */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('Đường Dẫn Ảnh')}</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="assets/img/products/..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-850 text-xs font-bold focus:outline-none focus:border-[#00b4d8] shadow-sm"
                  />
                  
                  {/* File Upload Trigger */}
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl cursor-pointer flex items-center space-x-2 shrink-0 shadow-sm font-bold">
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-xs">{uploading ? t('Đang tải...') : t('Tải Lên')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Flash Sale configuration */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFlashSale"
                    checked={isFlashSale}
                    onChange={(e) => setIsFlashSale(e.target.checked)}
                    className="w-4 h-4 accent-[#00b4d8] cursor-pointer"
                  />
                  <label htmlFor="isFlashSale" className="text-xs font-extrabold text-slate-650 cursor-pointer select-none">
                    {t('Sản phẩm tham gia Flash Sale')}
                  </label>
                </div>
                {isFlashSale && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-bold">{t('Giảm %')}:</span>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-16 px-2 py-1 bg-white border border-slate-200 text-slate-800 rounded text-center text-xs font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors"
                >
                  {t('Hủy')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00b4d8] hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-colors shadow-md"
                >
                  {editProduct ? t('Cập Nhật') : t('Thêm Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
