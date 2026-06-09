import React, { useState } from 'react'

const ICONS = {
  grid:        "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
  "chart-bar": "M3 3v18h18M7 16v-5m4 5V8m4 8V5",
  movie:       "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 4h16M8 4v4m8-4v4",
  building:    "M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4",
  calendar:    "M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm0 4h16M8 3v4m8-4v4m-4 8h.01",
  ticket:      "M15 5l-1 1m-4 4l-1 1M5 3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2 2 2 0 0 0 0 4 2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2 2 2 0 0 0 0-4 2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5z",
  users:       "M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M3 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2",
  settings:    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572C2.561 14.074 2.561 11.576 4.317 11.15a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  help:        "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 16h.01M12 8a2 2 0 0 1 .001 4c-.836.001-1.5.895-1.501 2",
}

function Icon({ name, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }} aria-hidden="true">
      <path d={ICONS[name] || ICONS.settings} />
    </svg>
  )
}

const NAV_ITEMS = [
  { label: 'Dashboard Principal',     icon: 'grid' },
  { label: 'Reportes',                icon: 'chart-bar' },
  { label: 'Catálogo de Películas',   icon: 'movie' },
  { label: 'Cines y Salas',           icon: 'building' },
  { label: 'Programación',            icon: 'calendar' },
  { label: 'Ventas y Tickets',        icon: 'ticket' },
  { label: 'Usuarios y Roles',        icon: 'users' },
  { label: 'Configuración y Precios', icon: 'settings' },
]

const CSS = `
.sb-root {
  width: 240px; min-width: 240px;
  min-height: 100vh; align-self: stretch;
  background: #1C2566;
  display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative; overflow: hidden;
}
.sb-root::before {
  content: ''; position: absolute;
  top: -70px; right: -70px; width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.sb-root::after {
  content: ''; position: absolute;
  bottom: 100px; left: -50px; width: 160px; height: 160px;
  background: radial-gradient(circle, rgba(255,179,0,0.07) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.sb-logo {
  display: flex; align-items: center;
  padding: 20px 18px 18px; gap: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  position: relative; z-index: 1;
}
.sb-logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #FFB300 0%, #FF8F00 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; font-weight: 700; color: #1C2566;
  flex-shrink: 0; letter-spacing: -0.5px;
  box-shadow: 0 2px 10px rgba(255,179,0,0.4);
}
.sb-logo-name { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.3px; line-height: 1.2; }
.sb-logo-role { font-size: 11px; color: rgba(255,255,255,0.42); margin-top: 1px; }
.sb-nav {
  flex: 1; padding: 12px 10px;
  display: flex; flex-direction: column; gap: 2px;
  position: relative; z-index: 1;
}
.sb-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 9px;
  cursor: pointer; border: none; width: 100%;
  text-align: left; background: transparent;
  transition: background 0.15s ease; position: relative; outline: none;
}
.sb-item:hover { background: rgba(255,255,255,0.07); }
.sb-item.sb-active { background: rgba(255,255,255,0.12); }
.sb-item.sb-active::before {
  content: ''; position: absolute; left: 0; top: 50%;
  transform: translateY(-50%); width: 3px; height: 58%;
  background: #FFB300; border-radius: 0 3px 3px 0;
}
.sb-item-icon { display: flex; align-items: center; }
.sb-item.sb-active .sb-item-icon        { color: #FFB300; }
.sb-item:not(.sb-active) .sb-item-icon  { color: rgba(255,255,255,0.42); }
.sb-item:not(.sb-active):hover .sb-item-icon { color: rgba(255,255,255,0.7); }
.sb-item-label { font-size: 13.5px; font-weight: 500; white-space: nowrap; letter-spacing: 0.01em; }
.sb-item.sb-active .sb-item-label        { color: #fff; }
.sb-item:not(.sb-active) .sb-item-label  { color: rgba(255,255,255,0.58); }
.sb-item:not(.sb-active):hover .sb-item-label { color: rgba(255,255,255,0.85); }
.sb-footer {
  padding: 10px 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex; flex-direction: column; gap: 4px;
  position: relative; z-index: 1;
}
.sb-help {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 9px;
  cursor: pointer; border: none; width: 100%; text-align: left;
  background: transparent; color: rgba(255,255,255,0.48);
  font-size: 13.5px; font-weight: 500; font-family: inherit;
  letter-spacing: 0.01em;
  transition: background 0.15s ease, color 0.15s ease; outline: none;
}
.sb-help:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }
`

export default function MenuPrincipal({ activeIndex, onNavigate }) {
  const [localActive, setLocalActive] = useState(5)
  const active = activeIndex !== undefined ? activeIndex : localActive
  const setActive = onNavigate || setLocalActive

  return (
    <>
      <style>{CSS}</style>
      <div className="sb-root">

        <div className="sb-logo">
          <div className="sb-logo-icon">F</div>
          <div>
            <div className="sb-logo-name">Filmate</div>
            <div className="sb-logo-role">Administrador</div>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item.label}
              className={`sb-item${active === i ? ' sb-active' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className="sb-item-icon"><Icon name={item.icon} /></span>
              <span className="sb-item-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sb-footer">
          <button className="sb-help" onClick={() => setActive(8)}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <Icon name="help" />
            </span>
            <span>Ayuda y Soporte</span>
          </button>
        </div>

      </div>
    </>
  )
}