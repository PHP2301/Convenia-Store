import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ThemeLangProvider } from './context/ThemeLangContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Import Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Stores from './pages/Stores'
import Menu from './pages/Menu'
import Category from './pages/Category'
import Cart from './pages/Cart'
import OrderHistory from './pages/OrderHistory'
import AdminDashboard from './pages/AdminDashboard'
import ProductDetail from './pages/ProductDetail'
import SearchPage from './pages/SearchPage'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#00b4d8] font-bold">Đang tải...</div>
  return user ? children : <Navigate to="/login" />
}

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#00b4d8] font-bold">Đang tải...</div>
  return user && user.role === 'admin' ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeLangProvider>
        <CartProvider>
          <Router>
          <div className="flex flex-col min-h-screen bg-[#f9f9f9] text-[#222222]">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/category/:categoryType" element={<Category />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                
                {/* Protected Routes */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/cart" element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                } />
                <Route path="/order-history" element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                } />

                {/* Admin Only Routes */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </CartProvider>
      </ThemeLangProvider>
    </AuthProvider>
  )
}
