import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

const USER_KEY = 'filmate_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)

  const login = useCallback(async (correo, contrasena) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Error de conexión' }))
        throw new Error(err.detail || 'Credenciales inválidas')
      }
      const data = await res.json()
      const userData = data.user
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!user) {
      setVerifying(false)
      return
    }
    fetch('/api/admin/rooms/?limit=1', {
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => {
        if (!res.ok) throw new Error('Sesión inválida')
      })
      .catch(() => {
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => setVerifying(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, verifying }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
