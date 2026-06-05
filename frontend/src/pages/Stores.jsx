import React, { useState } from 'react'
import { MapPin, Phone, Clock, Search, Navigation, CheckCircle2, Footprints } from 'lucide-react'
import { useThemeLang } from '../context/ThemeLangContext'

// Haversine distance calculator
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(2)
}

export default function Stores() {
  const { t } = useThemeLang()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStore, setSelectedStore] = useState('ngt')
  const [userCoords, setUserCoords] = useState(null)

  const stores = [
    {
      id: 'ngt',
      name: 'Convenia Nguyễn Gia Trí',
      address: '113 Nguyễn Gia Trí, Phường 25, Quận Bình Thạnh, TP. HCM',
      phone: '028 3899 1234',
      hours: t('mở cửa 24/7'),
      lat: 10.8044,
      lng: 106.7157,
      facilities: [t('Ăn tại chỗ'), t('Wifi miễn phí'), t('Chỗ giữ xe'), t('Thanh toán thẻ'), 'ATM']
    },
    {
      id: 'nvt',
      name: 'Convenia Nguyễn Văn Thương',
      address: '74 Nguyễn Văn Thương, Phường 25, Quận Bình Thạnh, TP. HCM',
      phone: '028 3844 5678',
      hours: t('mở cửa 24/7'),
      lat: 10.8018,
      lng: 106.7192,
      facilities: [t('Ăn tại chỗ'), t('Wifi miễn phí'), t('Thanh toán thẻ'), t('Nhà vệ sinh')]
    },
    {
      id: 'dbp',
      name: 'Convenia Điện Biên Phủ',
      address: '475 Điện Biên Phủ, Phường 25, Quận Bình Thạnh, TP. HCM',
      phone: '028 3512 9999',
      hours: t('mở cửa 24/7'),
      lat: 10.8016,
      lng: 106.7118,
      facilities: [t('Wifi miễn phí'), t('Chỗ giữ xe'), t('Thanh toán thẻ')]
    },
    {
      id: 'nhc',
      name: 'Convenia Nguyễn Hữu Cảnh',
      address: '92 Nguyễn Hữu Cảnh, Phường 22, Quận Bình Thạnh, TP. HCM',
      phone: '028 3514 8888',
      hours: t('mở cửa 24/7'),
      lat: 10.7904,
      lng: 106.7185,
      facilities: [t('Ăn tại chỗ'), t('Wifi miễn phí'), t('Chỗ giữ xe'), t('Thanh toán thẻ')]
    }
  ]

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    store.address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeStore = stores.find(s => s.id === selectedStore) || stores[0]

  const askLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        () => {
          alert(t('Vui lòng bật định vị trên trình duyệt để sử dụng tính năng này!'))
        }
      )
    } else {
      alert(t('Trình duyệt không hỗ trợ Geolocation!'))
    }
  }

  const openDirections = (store) => {
    if (!userCoords) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`, '_blank')
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lon}&destination=${store.lat},${store.lng}`,
        '_blank'
      )
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white">{t('hệ thống cửa hàng')}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('Tìm kiếm cửa hàng Convenia gần nhất để nhận hàng ngay hoặc giao hàng cực tốc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Store list & Search */}
        <div className="lg:col-span-1 space-y-5">
          {/* Search bar with GPS */}
          <div className="flex flex-col space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('nhập tên đường, quận...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm placeholder-slate-400 shadow-sm"
              />
            </div>
            <button
              onClick={askLocation}
              className="w-full py-3 bg-white hover:bg-slate-50 text-cyan-600 font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 border border-cyan-500 transition-colors shadow-sm"
            >
              <Navigation className="w-4 h-4 text-cyan-600" />
              <span>{t('tính khoảng cách từ vị trí của tôi')}</span>
            </button>
          </div>

          {/* Store List */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredStores.map((store) => {
              const distance = userCoords 
                ? calculateDistance(userCoords.lat, userCoords.lon, store.lat, store.lng)
                : null

              return (
                <div
                  key={store.id}
                  onClick={() => setSelectedStore(store.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    selectedStore === store.id
                      ? 'bg-cyan-50 border-cyan-200 shadow shadow-cyan-500/5'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">{store.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed flex items-start">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 mr-1.5 shrink-0 mt-0.5" />
                    <span>{store.address}</span>
                  </p>
                  
                  {distance && (
                    <p className="text-xs font-bold text-red-500 mt-2 flex items-center">
                      <Footprints className="w-3.5 h-3.5 mr-1" />
                      {t('khoảng cách')}: {distance} km
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-bold">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 text-slate-400 mr-1" /> {store.hours}
                    </span>
                    {distance && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openDirections(store)
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-red-500 hover:text-white rounded-md text-[10px] text-slate-600 border border-slate-200 transition-colors"
                      >
                        {t('chỉ đường đi')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {filteredStores.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                {t('Không tìm thấy cửa hàng nào phù hợp!')}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map and Store Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            {/* Real Interactive Google Maps iFrame */}
            <div className="relative h-[380px] bg-slate-100 flex items-center justify-center overflow-hidden">
              <iframe
                id="google-map"
                src={`https://www.google.com/maps?q=${encodeURIComponent(activeStore.address)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                title={activeStore.name}
              ></iframe>
            </div>

            {/* Store details info */}
            <div className="p-8 space-y-6 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white">{activeStore.name}</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 flex items-center font-medium">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600 mr-1" />
                    <span>{activeStore.address}</span>
                  </p>
                </div>
                <span className="px-3.5 py-1 text-xs font-bold text-white bg-cyan-500 rounded-full">
                  {t('mở cửa 24/7')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t border-b border-slate-100 py-5 text-slate-600 dark:text-slate-300 font-semibold">
                <div className="flex items-center space-x-2.5">
                  <Phone className="w-4 h-4 text-cyan-500" />
                  <span>{t('số điện thoại')}: {activeStore.phone}</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  <span>{t('Giờ hoạt động')}: {activeStore.hours}</span>
                </div>
              </div>

              {/* Facilities */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{t('Dịch vụ tiện ích')}</h4>
                <div className="flex flex-wrap gap-2.5">
                  {activeStore.facilities.map((fac, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 dark:text-slate-350"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => openDirections(activeStore)}
                  className="w-full md:w-auto px-6 py-3 bg-[#00b4d8] hover:bg-[#0077b6] text-white font-extrabold text-xs uppercase tracking-wider rounded-full transition-all duration-300 shadow-md shadow-[#00b4d8]/20"
                >
                  {t('chỉ đường đi')}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
