import React, { useState, useCallback, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { AuthContext } from './AuthContext.js'

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

      if (!userData.roles?.includes(1)) {
        throw new Error('Acceso denegado. Solo los administradores pueden ingresar al panel.')
      }

      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      if (data.access_token) {
        localStorage.setItem('filmate_token', data.access_token)
      }
      setUser(userData)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('filmate_token')
    setUser(null)
  }, [])

  useEffect(() => {
    if (!user) {
      setVerifying(false)
      return
    }
    const token = localStorage.getItem('filmate_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    fetch('/api/admin/rooms/?limit=1', { headers })
      .then(res => {
        if (!res.ok) throw new Error('Sesión inválida')
      })
      .catch(() => {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem('filmate_token')
        setUser(null)
      })
      .finally(() => setVerifying(false))
  }, [user])

  const value = useMemo(() => ({ user, login, logout, loading, verifying }), [user, login, logout, loading, verifying])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node,
}
