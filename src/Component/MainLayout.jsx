import React, { Suspense, lazy, useState } from 'react'
import PropTypes from 'prop-types'
import MenuPrincipal from './MenuPrincipal.jsx'
import Header from './Header.jsx'
import DashboardPrincipal from './Admin/DashboardPrincipal.jsx'

const VentasYTickets = lazy(() => import('./Admin/VentasYTickets.jsx'))
const CatalogoPeliculas = lazy(() => import('./Admin/CatalogoPeliculas.jsx'))
const Programacion = lazy(() => import('./Admin/Programacion.jsx'))
const CinesYSalas = lazy(() => import('./Admin/CinesYSalas.jsx'))
const Reportes = lazy(() => import('./Admin/Reportes.jsx'))
const AyudaSoporte = lazy(() => import('./Admin/AyudaSoporte.jsx'))
const ConfiguracionPrecios = lazy(() => import('./Admin/ConfiguracionPrecios.jsx'))
const GestionUsuarios = lazy(() => import('./Admin/GestionUsuarios.jsx'))

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

PlaceholderView.propTypes = {
  nombre: PropTypes.string,
}

function LoadingView() {
  return (
    <div style={{ padding: '28px 28px 40px', color: '#64748B', fontSize: 14 }}>
      Cargando módulo...
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
      case 1: return <Reportes />
      case 3: return <CinesYSalas />
      case 4: return <Programacion />
      case 6: return <GestionUsuarios />
      case 7: return <ConfiguracionPrecios />
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
          <Suspense fallback={<LoadingView />}>
            {renderView()}
          </Suspense>
        </div>
      </div>
    </div>
  )
}
