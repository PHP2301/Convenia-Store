import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { ShoppingBag, User, Search, Menu, X, LogOut, ShieldAlert, Store, Home, Compass, Sun, Moon, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { getCartCount } = useCart()
  const { theme, lang, toggleTheme, changeLang, t } = useThemeLang()
  const [isOpen, setIsOpen] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { name: t('Trang Chủ'), path: '/', icon: <Home className="w-4 h-4" /> },
    { name: t('Thực Đơn'), path: '/menu', icon: <Compass className="w-4 h-4" /> },
    { name: t('Cửa Hàng'), path: '/stores', icon: <Store className="w-4 h-4" /> }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-[#00b4d8] shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo - Restore exact CK GO block branding */}
          <Link to="/" className="flex items-center space-x-1.5">
            <div className="bg-[#00b4d8] text-white font-extrabold text-2xl px-3 py-1 rounded shadow-sm font-sans tracking-wide">
              CK
            </div>
            <span className="text-[#0077b6] font-black text-xl tracking-wider font-sans">
              GO
            </span>
          </Link>

          {/* Desktop Nav Links - Hover block styled like the old menu items */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive(link.path)
                    ? 'bg-[#caf0f8] text-[#0077b6]'
                    : 'text-[#333333] hover:bg-[#caf0f8] hover:text-[#0077b6] hover:-translate-y-0.5'
                }`}
              >
                <div className="text-[#00b4d8] mb-1">{link.icon}</div>
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Right Action Icons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search Toggle */}
            <Link
              to="/search"
              className="flex flex-col items-center justify-center px-3 py-2.5 rounded-xl text-[#333333] hover:bg-[#caf0f8] hover:text-[#0077b6] transition-all"
            >
              <Search className="w-4 h-4 text-[#00b4d8] mb-1" />
              <span className="text-[10px] font-bold">{t('Tìm Kiếm')}</span>
            </Link>

            {/* Cart Icon with count */}
            <Link
              to="/cart"
              className="relative flex flex-col items-center justify-center px-3 py-2.5 rounded-xl text-[#333333] hover:bg-[#caf0f8] hover:text-[#0077b6] transition-all"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#00b4d8] mb-1" />
                {getCartCount() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center text-[9px] font-black text-white bg-red-500 rounded-full"
                  >
                    {getCartCount()}
                  </motion.span>
                )}
              </div>
              <span className="text-[10px] font-bold">{t('Giỏ Hàng')}</span>
            </Link>

            {/* Admin Dashboard Quick Link */}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="flex flex-col items-center justify-center px-3 py-2.5 rounded-xl text-yellow-600 hover:bg-[#caf0f8] transition-all"
                title={t('quản lý kho')}
              >
                <ShieldAlert className="w-4 h-4 text-[#00b4d8] mb-1" />
                <span className="text-[10px] font-bold">{t('Quản Trị')}</span>
              </Link>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex flex-col items-center justify-center px-3 py-2.5 rounded-xl text-[#333333] hover:bg-[#caf0f8] hover:text-[#0077b6] transition-all"
              title={t('Đổi giao diện')}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500 mb-1" /> : <Moon className="w-4 h-4 text-[#00b4d8] mb-1" />}
              <span className="text-[10px] font-bold">{theme === 'dark' ? t('Sáng') : t('Tối')}</span>
            </button>

            {/* Language Dropdown Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLang(!showLang)}
                className="flex flex-col items-center justify-center px-3 py-2.5 rounded-xl text-[#333333] hover:bg-[#caf0f8] hover:text-[#0077b6] transition-all"
                title={t('Thay đổi ngôn ngữ')}
              >
                <Globe className="w-4 h-4 text-[#00b4d8] mb-1" />
                <span className="text-[10px] font-bold uppercase">{lang}</span>
              </button>
              <AnimatePresence>
                {showLang && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => { changeLang('vi'); setShowLang(false) }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#caf0f8] hover:text-[#0077b6] transition-colors"
                    >
                      Tiếng Việt
                    </button>
                    <button
                      onClick={() => { changeLang('en'); setShowLang(false) }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#caf0f8] hover:text-[#0077b6] transition-colors"
                    >
                      English
                    </button>
                    <button
                      onClick={() => { changeLang('ko'); setShowLang(false) }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-[#caf0f8] hover:text-[#0077b6] transition-colors"
                    >
                      한국어
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile / Login */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2.5 px-3 py-1.5 bg-[#caf0f8] hover:bg-[#00b4d8] rounded-full transition-all group"
                >
                  <div className="w-6 h-6 rounded-full bg-[#00b4d8] group-hover:bg-white text-white group-hover:text-[#00b4d8] flex items-center justify-center font-bold text-xs">
                    {user.fullname ? user.fullname.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-bold text-[#333333] group-hover:text-white max-w-[80px] truncate">
                    {user.fullname || user.email.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100"
                  title={t('đăng xuất')}
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#00b4d8]/20"
              >
                {t('Đăng Nhập')}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link to="/search" className="p-2 text-[#333333] hover:text-[#00b4d8]">
              <Search className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="relative p-2 text-[#333333] hover:text-[#00b4d8]">
              <ShoppingBag className="w-5 h-5" />
              {getCartCount() > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-[9px] font-bold text-white bg-red-500 rounded-full">
                  {getCartCount()}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-[#333333] hover:text-[#00b4d8] transition-colors focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                    isActive(link.path)
                      ? 'bg-[#caf0f8] text-[#0077b6]'
                      : 'text-[#333333] hover:bg-slate-100 hover:text-[#00b4d8]'
                  }`}
                >
                  <span className="text-[#00b4d8]">{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              ))}
              
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-yellow-600 hover:bg-slate-100"
                >
                  <ShieldAlert className="w-4 h-4 text-yellow-600" />
                  <span>{t('Bảng Quản Trị Admin')}</span>
                </Link>
              )}

              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>{t('Trang Cá Nhân')}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      handleLogout()
                    }}
                    className="w-full text-left flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-slate-100"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>{t('Đăng Xuất')}</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-3.5 rounded-full bg-[#00b4d8] text-white font-black uppercase tracking-wider text-xs shadow-md"
                >
                  {t('Đăng Nhập')}
                </Link>
              )}

              {/* Mobile Theme & Lang Toggles */}
              <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-150 border-slate-200 mt-3 pt-4">
                <span className="text-xs font-bold text-slate-500">{t('Giao diện & Ngôn ngữ')}</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 hover:text-brand rounded-full hover:bg-slate-100"
                    title={t('Đổi giao diện')}
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-[#00b4d8]" />}
                  </button>
                  <select
                    value={lang}
                    onChange={(e) => changeLang(e.target.value)}
                    className="text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="vi">VI</option>
                    <option value="en">EN</option>
                    <option value="ko">KO</option>
                  </select>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
