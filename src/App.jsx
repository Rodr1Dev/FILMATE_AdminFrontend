import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import MainLayout from './Component/MainLayout.jsx'
import LoginPage from './Component/LoginPage.jsx'

function ProtectedRoute({ children }) {
  const { user, verifying } = useAuth()
  if (verifying) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#666' }}>Verificando sesión...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
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
