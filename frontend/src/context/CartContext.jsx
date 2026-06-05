import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useThemeLang } from './ThemeLangContext'

const CartContext = createContext(null)

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const { t } = useThemeLang()
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Load cart on mount or when user changes
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true)
      if (user) {
        try {
          const res = await fetch(`/api/carts/${user.uid}`)
          if (res.ok) {
            const data = await res.json()
            setCart(data.items || [])
          }
        } catch (err) {
          console.error("Lỗi tải giỏ hàng từ database:", err)
        }
      } else {
        const saved = localStorage.getItem('convenia_cart')
        if (saved && saved !== 'undefined') {
          try {
            setCart(JSON.parse(saved))
          } catch (e) {
            console.error("Lỗi parse convenia_cart từ localStorage:", e)
            setCart([])
            localStorage.removeItem('convenia_cart')
          }
        } else {
          setCart([])
        }
      }
      setLoading(false)
    }
    loadCart()
  }, [user])

  // 2. Save cart to localStorage or DB whenever it changes
  useEffect(() => {
    if (loading) return

    const saveCart = async () => {
      if (user) {
        try {
          await fetch(`/api/carts/${user.uid}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: cart })
          })
        } catch (err) {
          console.error("Lỗi lưu giỏ hàng lên database:", err)
        }
      } else {
        localStorage.setItem('convenia_cart', JSON.stringify(cart))
      }
    }
    saveCart()
  }, [cart, user, loading])

  const addToCart = (product, quantity = 1) => {
    if (!user) {
      alert(t("bạn ơi, bạn cần đăng nhập để mua hàng nhé!"))
      window.location.href = "/login"
      return
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        const newQty = existing.quantity + quantity
        if (product.stock !== undefined && newQty > product.stock) {
          alert(`${t('chỉ còn')} ${product.stock} ${t('sản phẩm trong kho!')}`)
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: product.stock } : item
          )
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newQty } : item
        )
      } else {
        if (product.stock !== undefined && quantity > product.stock) {
          alert(`${t('chỉ còn')} ${product.stock} ${t('sản phẩm trong kho!')}`)
          return [...prev, { ...product, quantity: product.stock }]
        }
        return [...prev, { ...product, quantity }]
      }
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          if (item.stock !== undefined && quantity > item.stock) {
            alert(`${t('chỉ còn')} ${item.stock} ${t('sản phẩm trong kho!')}`)
            return { ...item, quantity: item.stock }
          }
          return { ...item, quantity }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartCount = () => {
    return cart.reduce((acc, item) => acc + item.quantity, 0)
  }

  const getCartTotal = () => {
    return cart.reduce((acc, item) => {
      const price = item.is_flash_sale
        ? item.price * (1 - (item.discount_percent || 20) / 100)
        : item.price
      return acc + price * item.quantity
    }, 0)
  }

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartCount, getCartTotal, loading }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
