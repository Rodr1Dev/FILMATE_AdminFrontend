import React from 'react'
import PropTypes from 'prop-types'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/useAuth.js'
import MainLayout from './Component/MainLayout.jsx'
import LoginPage from './Component/LoginPage.jsx'

function ProtectedRoute({ children }) {
  const { user, verifying } = useAuth()
  if (verifying) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#666' }}>Verificando sesión...</div>
  if (!user?.roles?.includes(1)) return <Navigate to="/login" replace />
  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
      <Route path="/App" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
