import React, { useState, useCallback, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { AuthContext } from './AuthContext.js'

const USER_KEY = 'filmate_user'
const PERMISOS_KEY = 'filmate_permisos'

const API = '/api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [permisos, setPermisos] = useState(() => {
    try {
      const stored = localStorage.getItem(PERMISOS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)

  const refreshPermisos = useCallback(async () => {
    const token = localStorage.getItem('filmate_token')
    const storedUser = localStorage.getItem(USER_KEY)
    if (!token || !storedUser) return
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    try {
      const res = await fetch(`${API}/me/permisos`, { headers })
      if (!res.ok) return
      const data = await res.json()
      localStorage.setItem(PERMISOS_KEY, JSON.stringify(data))
      setPermisos(data)
    } catch {
      // ignore
    }
  }, [])

  const fetchPermisos = useCallback(async () => {
    const token = localStorage.getItem('filmate_token')
    if (!token) return
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    try {
      const res = await fetch(`${API}/me/permisos`, { headers })
      if (!res.ok) return
      const data = await res.json()
      localStorage.setItem(PERMISOS_KEY, JSON.stringify(data))
      setPermisos(data)
    } catch {
      // ignore
    }
  }, [])

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

      if (!userData.roles?.some(r => r === 1 || r === 3)) {
        throw new Error('Acceso denegado. Solo administradores o superadmins pueden ingresar al panel.')
      }

      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      if (data.access_token) {
        localStorage.setItem('filmate_token', data.access_token)
      }
      setUser(userData)
      await fetchPermisos()
      return userData
    } finally {
      setLoading(false)
    }
  }, [fetchPermisos])

  const logout = useCallback(() => {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('filmate_token')
    localStorage.removeItem(PERMISOS_KEY)
    setUser(null)
    setPermisos([])
  }, [])

  useEffect(() => {
    if (!user) {
      setVerifying(false)
      return
    }
    const token = localStorage.getItem('filmate_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    fetch('/api/admin/notifications/', { headers })
      .then(notifRes => {
        if (notifRes.status === 401) {
          localStorage.removeItem(USER_KEY)
          localStorage.removeItem('filmate_token')
          localStorage.removeItem(PERMISOS_KEY)
          setUser(null)
          setPermisos([])
        }
      })
      .catch(() => {})
      .finally(() => setVerifying(false))
  }, [user])

  useEffect(() => {
    if (!user) return
    const onFocus = () => refreshPermisos()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [user, refreshPermisos])

  const value = useMemo(() => ({ user, permisos, login, logout, loading, verifying, refreshPermisos }), [user, permisos, login, logout, loading, verifying, refreshPermisos])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node,
}
