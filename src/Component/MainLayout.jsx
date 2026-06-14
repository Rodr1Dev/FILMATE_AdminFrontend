import React, { useState } from 'react'
import MenuPrincipal from './MenuPrincipal.jsx'
import Header from './Header.jsx'
import DashboardPrincipal from './Admin/DashboardPrincipal.jsx'
import VentasYTickets from './Admin/VentasYTickets.jsx'
import CatalogoPeliculas from './Admin/CatalogoPeliculas.jsx'
import CinesYSalas from './Admin/CinesYSalas.jsx'
import AyudaSoporte from './Admin/AyudaSoporte.jsx'

// Placeholder for other sections
function PlaceholderView({ nombre }) {
  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>{nombre}</h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
        Módulo en construcción – Se conectará con backend y base de datos próximamente.
      </p>
    </div>
  )
}

export default function MainLayout() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [detailTxnId, setDetailTxnId] = useState(null)

  function renderView() {
    switch (activeIndex) {
      case 2: return <CatalogoPeliculas />
      case 5: return <VentasYTickets initialTxnId={detailTxnId} />
      case 0: return <DashboardPrincipal onNavigate={setActiveIndex} onViewTransaction={(id) => { setDetailTxnId(id); setActiveIndex(5) }} />
      case 1: return <PlaceholderView nombre="Reportes" />
      case 3: return <CinesYSalas />
      case 4: return <PlaceholderView nombre="Programación" />
      case 6: return <PlaceholderView nombre="Usuarios y Roles" />
      case 7: return <PlaceholderView nombre="Configuración y Precios" />
      case 8: return <AyudaSoporte />
      default: return <VentasYTickets />
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      height: '100%',
      background: '#ECEFF1',
      alignItems: 'stretch',
    }}>
      <MenuPrincipal activeIndex={activeIndex} onNavigate={setActiveIndex} />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        <Header />
        <div style={{ flex: 1, padding: '0 0 32px 0' }}>
          {renderView()}
        </div>
      </div>
    </div>
  )
}
