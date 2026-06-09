import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NOTIFICATIONS = [
  { id: 1, type: 'warning', text: 'Reembolso pendiente de revisión', time: 'Hace 10 min' },
  { id: 2, type: 'info',    text: 'Se registró una nueva transacción',  time: 'Hace 1 hora' },
  { id: 3, type: 'success', text: 'Solicitud de reembolso aprobada',   time: 'Hace 3 horas' },
]

const COLORS = {
  warning: { dot: '#FFB300', bg: '#FFF8E1' },
  info:    { dot: '#283593', bg: '#EEF2FF' },
  success: { dot: '#008236', bg: '#DCFCE7' },
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFICATIONS)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const initials = user?.nombre
    ? user.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const roleLabel = user?.roles === 1 ? 'Administrador' : 'Usuario'

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    setProfileOpen(false)
    logout()
    navigate('/login')
  }

  const unread = notifs.length

  const CARD = {
    position: 'absolute', top: 56,
    background: '#fff', borderRadius: 12,
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
    border: '1px solid #E5E7EB', zIndex: 999, overflow: 'hidden',
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      background: '#fff',
      padding: '0 24px',
      height: 64,
      borderBottom: '1px solid #E5E7EB',
      flexShrink: 0,
      gap: 16,
    }}>

      {/* Campana */}
      <div style={{ position: 'relative' }} ref={notifRef}>
        <button
          onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 6,
            borderRadius: 8,
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Notificaciones"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: 4, right: 4, width: 9, height: 9,
              background: '#EF4444', borderRadius: '50%', border: '2px solid #fff',
            }} />
          )}
        </button>
        {notifOpen && (
          <div style={{ ...CARD, right: 0, width: 340 }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #E5E7EB',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#121212' }}>Notificaciones</span>
              <button onClick={() => setNotifs([])}
                style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Limpiar todo
              </button>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
                  No hay notificaciones
                </div>
              ) : notifs.map(n => (
                <div key={n.id} style={{
                  display: 'flex', gap: 12, padding: '12px 18px', alignItems: 'flex-start',
                  borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setNotifs(prev => prev.filter(x => x.id !== n.id))}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: COLORS[n.type]?.dot || '#9CA3AF', marginTop: 5, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#121212' }}>{n.text}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9CA3AF' }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Avatar / Perfil */}
      <div style={{ position: 'relative' }} ref={profileRef}>
        <button
          onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#1C2566',
            letterSpacing: '0.5px', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(255,179,0,0.4)', fontFamily: 'inherit',
          }}
          title={user?.nombre || 'Usuario'}
        >
          {initials}
        </button>
        {profileOpen && (
          <div style={{ ...CARD, right: 0, width: 260 }}>
            <div style={{
              padding: '20px 18px', textAlign: 'center',
              borderBottom: '1px solid #E5E7EB',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, fontWeight: 700, color: '#1C2566',
                margin: '0 auto 10px',
                boxShadow: '0 3px 12px rgba(255,179,0,0.35)',
              }}>
                {initials}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#121212' }}>
                {user?.nombre || 'Usuario'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {user?.correo || ''}
              </div>
              <div style={{
                display: 'inline-block', marginTop: 8,
                fontSize: 11, fontWeight: 600, color: '#1C2566',
                background: '#EEF2FF', padding: '3px 10px',
                borderRadius: 20,
              }}>
                {roleLabel}
              </div>
            </div>
            <div style={{ padding: '8px' }}>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 9,
                  cursor: 'pointer', border: 'none', width: '100%',
                  textAlign: 'left', background: 'transparent',
                  color: '#B91C1C', fontSize: 13.5,
                  fontFamily: 'inherit', fontWeight: 500,
                  transition: 'background 0.15s', outline: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0, display: 'block' }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
