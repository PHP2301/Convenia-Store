import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useThemeLang } from '../context/ThemeLangContext'
import { Mail, Lock, ShieldCheck, LogIn, UserPlus, Key } from 'lucide-react'
import { motion } from 'framer-motion'

function bufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

export default function Login() {
  const { login, register, completeLogin } = useAuth()
  const { t } = useThemeLang()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      if (isLogin) {
        await login(email, password)
        setSuccess(t('Đăng nhập thành công! Đang chuyển hướng...'))
        setTimeout(() => navigate(from, { replace: true }), 1000)
      } else {
        await register(email, password)
        setSuccess(t('Đăng ký tài khoản thành công! Hãy đăng nhập ngay.'))
        setIsLogin(true)
        setPassword('')
      }
    } catch (err) {
      setError(err.message || t('Có lỗi xảy ra!'))
    } finally {
      setLoading(false)
    }
  }

  // Real FIDO2 WebAuthn Login Flow
  const handleFidoLogin = async () => {
    if (!window.PublicKeyCredential) {
      setError(t('Trình duyệt hoặc thiết bị của bạn không hỗ trợ FIDO2/WebAuthn!'))
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const challenge = new Uint8Array(32)
      window.crypto.getRandomValues(challenge)

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: window.location.hostname,
          timeout: 60000,
          userVerification: "required",
        }
      })

      const credentialId = bufferToBase64url(assertion.rawId)

      const res = await fetch('/api/auth/fido-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fido_credential_id: credentialId })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || t('Thiết bị bảo mật chưa được đăng ký hoặc không khớp!'))
      }
      
      // Complete auth
      completeLogin(data)
      setSuccess(t('Xác thực vân tay/FIDO2 thành công! Đang vào hệ thống...'))
      setTimeout(() => navigate(from, { replace: true }), 1000)
    } catch (err) {
      console.error(err)
      setError(err.name === "NotAllowedError" ? t('Đã hủy thao tác vân tay sinh trắc học.') : err.message || t('Lỗi xác thực thiết bị FIDO2!'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 relative overflow-hidden bg-slate-50">
      {/* Background neon glows */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-cyan-500/5 blur-[100px]" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-500/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 rounded-3xl glass shadow-2xl relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {isLogin ? t('chào mừng trở lại') : t('đăng ký thành viên')}
          </h2>
          <p className="text-slate-550 text-sm font-medium">
            {isLogin 
              ? t('đăng nhập để nhận ngập tràn ưu đãi tại convenia') 
              : t('gia nhập convenia premium chỉ trong vài giây')}
          </p>
        </div>

        {error && (
          <div className="p-4 text-xs font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-xs font-bold text-green-600 bg-green-50 border border-green-200 rounded-xl">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('địa chỉ email')}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@vidu.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('mật khẩu')}</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-800 text-sm shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-500/10 disabled:opacity-50"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{isLogin ? t('đăng nhập') : t('tạo tài khoản')}</span>
          </button>
        </form>

        {isLogin && (
          <div className="space-y-4 pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-4 text-slate-450 text-xs font-bold uppercase tracking-wider text-slate-400">{t('hoặc đăng nhập nhanh')}</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            <button
              onClick={handleFidoLogin}
              disabled={loading}
              type="button"
              className="w-full py-3 flex items-center justify-center space-x-2 rounded-xl bg-white hover:bg-slate-50 text-cyan-600 border border-slate-200 hover:border-cyan-500/40 text-sm font-bold transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>{t('đăng nhập với vân tay / fido2')}</span>
            </button>
          </div>
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccess('')
            }}
            className="text-xs font-bold text-cyan-600 hover:text-cyan-500 transition-colors"
          >
            {isLogin ? t('chưa có tài khoản? đăng ký ngay') : t('đã có tài khoản? đăng nhập ngay')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
