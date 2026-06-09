import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const CSS = `
.lp-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #1C2566 0%, #283593 50%, #1C2566 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.lp-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.lp-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 32px;
}
.lp-logo-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #FFB300 0%, #FF8F00 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: #1C2566;
  box-shadow: 0 4px 12px rgba(255,179,0,0.4);
}
.lp-logo-text { font-size: 22px; font-weight: 700; color: #1C2566; }
.lp-logo-role { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
.lp-title { font-size: 18px; font-weight: 700; color: #121212; text-align: center; margin-bottom: 4px; }
.lp-subtitle { font-size: 13px; color: #6B7280; text-align: center; margin-bottom: 28px; }
.lp-field { margin-bottom: 18px; }
.lp-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.lp-input {
  width: 100%; box-sizing: border-box;
  padding: 10px 14px; border-radius: 10px;
  border: 1.5px solid #D1D5DB; font-size: 14px;
  font-family: inherit; outline: none;
  transition: border-color 0.15s;
  background: #F9FAFB;
}
.lp-input:focus { border-color: #283593; background: #fff; }
.lp-error {
  background: #FEF2F2; border: 1px solid #FECACA;
  color: #B91C1C; font-size: 13px;
  padding: 10px 14px; border-radius: 10px;
  margin-bottom: 18px; text-align: center;
}
.lp-btn {
  width: 100%; padding: 11px;
  background: linear-gradient(135deg, #FFB300 0%, #FF8F00 100%);
  color: #1C2566; font-weight: 700; font-size: 15px;
  border: none; border-radius: 10px; cursor: pointer;
  font-family: inherit; letter-spacing: 0.02em;
  transition: opacity 0.15s; margin-top: 6px;
}
.lp-btn:hover { opacity: 0.9; }
.lp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!correo.trim() || !contrasena.trim()) {
      setError('Todos los campos son obligatorios')
      return
    }
    try {
      await login(correo.trim(), contrasena)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="lp-root">
        <div className="lp-card">
          <div className="lp-logo">
            <div className="lp-logo-icon">F</div>
            <div>
              <div className="lp-logo-text">Filmate</div>
              <div className="lp-logo-role">Panel de Administración</div>
            </div>
          </div>
          <div className="lp-title">Iniciar Sesión</div>
          <div className="lp-subtitle">Ingresa tus credenciales para acceder</div>
          <form onSubmit={handleSubmit}>
            {error && <div className="lp-error">{error}</div>}
            <div className="lp-field">
              <label className="lp-label">Correo electrónico</label>
              <input
                className="lp-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
                autoFocus
              />
            </div>
            <div className="lp-field">
              <label className="lp-label">Contraseña</label>
              <input
                className="lp-input"
                type="password"
                placeholder="••••••••"
                value={contrasena}
                onChange={e => setContrasena(e.target.value)}
              />
            </div>
            <button className="lp-btn" type="submit" disabled={loading}>
              {loading ? 'Iniciando sesión…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
