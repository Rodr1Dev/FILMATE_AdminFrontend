import React, { useState } from 'react'

export default function Header() {
  const [hasNotif, setHasNotif] = useState(true)

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
      <button
        onClick={() => setHasNotif(false)}
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
        {hasNotif && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 9,
            height: 9,
            background: '#EF4444',
            borderRadius: '50%',
            border: '2px solid #fff',
          }} />
        )}
      </button>

      {/* Avatar EF */}
      <button
        onClick={() => alert('Perfil')}
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: '#1C2566',
          letterSpacing: '0.5px',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(255,179,0,0.4)',
          fontFamily: 'inherit',
        }}
        title="Elena Franci"
      >
        EF
      </button>

    </div>
  )
}
