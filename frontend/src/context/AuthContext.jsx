import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('current_user')
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.error("Lỗi parse current_user từ localStorage:", e)
      localStorage.removeItem('current_user')
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session on startup
    const checkSession = async () => {
      if (user) {
        try {
          const res = await fetch(`/api/auth/profile/${user.uid}`, {
            headers: {
              'Authorization': `Bearer ${user.access_token}`
            }
          })
          if (res.status === 401) {
            // Token expired, try refreshing
            await refreshSession()
          } else if (res.ok) {
            const data = await res.json()
            const updatedUser = { ...user, ...data }
            setUser(updatedUser)
            localStorage.setItem('current_user', JSON.stringify(updatedUser))
          }
        } catch (err) {
          console.error("Session verification failed", err)
        }
      }
      setLoading(false)
    }
    checkSession()
  }, [])

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' })
      if (res.ok) {
        const data = await res.json() // { access_token: ... }
        const saved = localStorage.getItem('current_user')
        if (saved && saved !== 'undefined') {
          try {
            const currentUser = JSON.parse(saved)
            const updatedUser = { ...currentUser, access_token: data.access_token }
            setUser(updatedUser)
            localStorage.setItem('current_user', JSON.stringify(updatedUser))
            return data.access_token
          } catch (e) {
            console.error("Lỗi parse current_user trong refreshSession:", e)
          }
        }
      }
    } catch (err) {
      console.error("Token refresh failed", err)
    }
    // If refresh fails, log out
    logout()
    return null
  }

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Đăng nhập thất bại!')
    }
    // Defer setting user session if 2FA is enabled
    if (!data.tfa_secret) {
      setUser(data)
      localStorage.setItem('current_user', JSON.stringify(data))
    }
    return data
  }

  const completeLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('current_user', JSON.stringify(userData))
  }

  const register = async (email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Đăng ký thất bại!')
    }
    return data
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error("Logout request failed", err)
    }
    setUser(null)
    localStorage.removeItem('current_user')
  }

  const updateProfile = async (profileData) => {
    if (!user) return
    const res = await fetch(`/api/auth/profile/${user.uid}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.access_token}`
      },
      body: JSON.stringify(profileData)
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.detail || 'Cập nhật thất bại!')
    }
    const updatedUser = { ...user, ...profileData }
    setUser(updatedUser)
    localStorage.setItem('current_user', JSON.stringify(updatedUser))
    return updatedUser
  }

  // A wrapper around fetch that handles authorization and silent token refresh
  const fetchWithAuth = async (url, options = {}) => {
    let token = user?.access_token
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }

    let response = await fetch(url, options)

    if (response.status === 401) {
      // Access token expired, attempt refresh
      const newToken = await refreshSession()
      if (newToken) {
        options.headers['Authorization'] = `Bearer ${newToken}`
        response = await fetch(url, options)
      }
    }
    return response
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, completeLogin, register, logout, updateProfile, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
