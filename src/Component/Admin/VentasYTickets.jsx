import React, { useState } from 'react'

function EstadoBadge({ estado }) {
  const map = {
    Completada:  { bg: '#DCFCE7', text: '#008236' },
    Pendiente:   { bg: '#FEF9C3', text: '#B45309' },
    Reembolsada: { bg: '#FFE5DC', text: '#C2410C' },
    Cancelada:   { bg: '#F3F4F6', text: '#6B7280' },
    Aprobada:    { bg: '#DCFCE7', text: '#008236' },
    Rechazada:   { bg: '#FFE5DC', text: '#C2410C' },
    Válida:      { bg: '#DCFCE7', text: '#008236' },
    Inválida:    { bg: '#FFE5DC', text: '#C2410C' },
    'Ya Usada':  { bg: '#FEF9C3', text: '#B45309' },
  }
  const s = map[estado] || { bg: '#F3F4F6', text: '#6B7280' }
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: '3px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
    }}>{estado}</span>
  )
}

function TipoBadge({ tipo }) {
  let bg = '#D7DCDF', color = '#4A5565'
  if (tipo === 'Reembolso total')   { bg = '#C5D9FF'; color = '#283593' }
  if (tipo === 'Reembolso parcial') { bg = '#E1CEFC'; color = '#770FFF' }
  if (tipo === 'Sin reembolso')     { bg = '#D7DCDF'; color = '#4A5565' }
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {tipo}
    </span>
  )
}

function SelectFilter({ label, options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 130 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#364153', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', background: '#fff', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 32px 8px 12px', fontSize: 14, color: '#4A5565', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 12 }}>▼</span>
      </div>
    </div>
  )
}

function SearchInput({ label, placeholder, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 160 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#364153', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ background: '#fff', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#4A5565', outline: 'none' }} />
    </div>
  )
}

function EmptyTableMessage() {
  return (
    <tr>
      <td colSpan={20} style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
          </svg>
          <span style={{ fontSize: 14, color: '#9CA3AF' }}>Sin datos disponibles. Conecta la base de datos para ver los registros.</span>
        </div>
      </td>
    </tr>
  )
}

function Pagination() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #E5E7EB' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>Sin registros para mostrar</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Anterior', '1', '2', '3', 'Siguiente'].map((p, i) => (
          <button key={i} disabled style={{
            padding: '5px 12px', borderRadius: 8, fontSize: 13, cursor: 'default',
            border: p === '1' ? 'none' : '1px solid #D1D5DC',
            background: p === '1' ? '#283593' : 'transparent',
            color: p === '1' ? '#fff' : '#9CA3AF', opacity: 0.6,
          }}>{p}</button>
        ))}
      </div>
    </div>
  )
}

function TabHistorial() {
  const [tipoReporte, setTipoReporte] = useState('Todas')
  const [estadoFiltro, setEstadoFiltro] = useState('Todos los estados')
  const [fecha, setFecha] = useState('Últimos 30 días')
  const [buscar, setBuscar] = useState('')

  const metricas = [
    { label: 'Ventas del Mes',   value: '—', sub: 'Boletos vendidos',    icon: '🎟️' },
    { label: 'Ingresos Totales', value: '—', sub: 'Este Mes',            icon: '💰' },
    { label: 'Reembolsos',       value: '—', sub: 'solicitudes',         icon: '↩️' },
    { label: 'Ticket Promedio',  value: '—', sub: 'Por transacción',     icon: '📊' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {metricas.map(card => (
          <div key={card.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{card.icon}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{card.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#9CA3AF' }}>{card.value}</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SelectFilter label="Tipo de Reporte" options={['Todas','Entrada','Combo','Membresía']} value={tipoReporte} onChange={setTipoReporte} />
          <SelectFilter label="Estado" options={['Todos los estados','Completada','Pendiente','Reembolsada','Cancelada']} value={estadoFiltro} onChange={setEstadoFiltro} />
          <SelectFilter label="Fecha" options={['Últimos 30 días','Esta semana','Hoy']} value={fecha} onChange={setFecha} />
          <SearchInput label="Buscar" placeholder="ID compra, cliente, película" value={buscar} onChange={setBuscar} />
          <button style={{ background: '#283593', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', whiteSpace: 'nowrap', height: 38 }}>Aplicar Filtros</button>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Historial Global de Transacciones</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Registro completo de todas las operaciones</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#ECEFF1' }}>
                {['ID Compra','Fecha','Cliente','Película / Producto','Tipo','Sala','Monto','Estado','Acción'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#4A5565', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody><EmptyTableMessage /></tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </div>
  )
}

function TabDetalle() {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 48, textAlign: 'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
      <p style={{ color: '#9CA3AF', fontSize: 15, margin: 0 }}>Selecciona una transacción desde "Historial de Transacciones" para ver el detalle.</p>
    </div>
  )
}

function TabDevoluciones() {
  const [motivo, setMotivo] = useState('TODOS')
  const [fecha, setFecha] = useState('ÚLTIMOS 30 DÍAS')
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS LOS ESTADOS')
  const [buscar, setBuscar] = useState('')

  const metricas = [
    { label: 'Solicitudes Totales', value: '—', sub: 'Este Mes',           iconBg: '#EEF2FF', iconColor: '#283593', icon: '↺' },
    { label: 'Pendientes',          value: '—', sub: 'Requieren revisión', iconBg: '#FEF9C3', iconColor: '#B45309', icon: '⏱' },
    { label: 'Aprobadas',           value: '—', sub: 'Reembolso procesado',iconBg: '#DCFCE7', iconColor: '#008236', icon: '✓' },
    { label: 'Monto Devuelto',      value: '—', sub: 'Total mes',          iconBg: '#EEF2FF', iconColor: '#283593', icon: '$' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {metricas.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: c.iconColor, marginBottom: 12, fontWeight: 700 }}>{c.icon}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#9CA3AF' }}>{c.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SearchInput label="BUSCAR SOLICITUD" placeholder="ID COMPRA, CLIENTE" value={buscar} onChange={setBuscar} />
          <SelectFilter label="MOTIVO" options={['TODOS','Cancelación de función','Error de cobro','Inconveniente cliente','Falla técnica']} value={motivo} onChange={setMotivo} />
          <SelectFilter label="FECHA" options={['ÚLTIMOS 30 DÍAS','Esta semana','Hoy']} value={fecha} onChange={setFecha} />
          <SelectFilter label="ESTADO" options={['TODOS LOS ESTADOS','Pendiente','Aprobada','Rechazada']} value={estadoFiltro} onChange={setEstadoFiltro} />
          <button style={{ background: '#283593', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', height: 38, whiteSpace: 'nowrap' }}>Aplicar Filtros</button>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Gestión de Devoluciones y Reembolsos</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Revisión y aprobación de solicitudes</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#ECEFF1' }}>
                {['ID COMPRA','FECHA SOLICITUD','CLIENTE','MOTIVO','MONTO','TIPO','ESTADO','ACCIÓN'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#4A5565', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody><EmptyTableMessage /></tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </div>
  )
}

function TabValidacion() {
  const [codigoInput, setCodigoInput] = useState('')
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#121212', margin: '0 0 14px', textAlign: 'center' }}>Validar Entrada</h3>
          <div style={{ background: '#F3F4F6', borderRadius: 8, padding: 20, marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 80, border: '3px solid #283593', borderRadius: 6, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', top: -3, left: -3, width: 20, height: 20, borderTop: '3px solid #283593', borderLeft: '3px solid #283593' }} />
              <div style={{ position: 'absolute', top: -3, right: -3, width: 20, height: 20, borderTop: '3px solid #283593', borderRight: '3px solid #283593' }} />
              <div style={{ position: 'absolute', bottom: -3, left: -3, width: 20, height: 20, borderBottom: '3px solid #283593', borderLeft: '3px solid #283593' }} />
              <div style={{ position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderBottom: '3px solid #283593', borderRight: '3px solid #283593' }} />
              <div style={{ width: 40, height: 3, background: '#283593', opacity: 0.7 }} />
            </div>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Escanear código QR</span>
          </div>
          <input type="text" value={codigoInput} onChange={e => setCodigoInput(e.target.value)} placeholder="Ej: TXN-2051-A"
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <button style={{ width: '100%', background: '#283593', color: '#fff', border: 'none', borderRadius: 8, padding: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Validar</button>
        </div>
        {['Entradas validadas hoy', 'Sin usar (próximas funciones)', 'Intentos inválidos hoy'].map(s => (
          <div key={s} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: '#9CA3AF' }}>—</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6 }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Log de Validaciones</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Últimas entradas registradas</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#ECEFF1' }}>
                {['Ticket ID','Hora','Cliente','Asiento','Resultado'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#4A5565' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody><EmptyTableMessage /></tbody>
          </table>
        </div>
        <Pagination />
      </div>
    </div>
  )
}

const TABS = ['Historial de Transacciones', 'Detalle de Compra', 'Devoluciones y Reembolsos', 'Validación de Entradas']

export default function VentasYTickets() {
  const [tabActiva, setTabActiva] = useState(0)

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Ventas Y Tickets</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>Sábado, 9 de Mayo de 2026</p>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB' }}>
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setTabActiva(i)} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              border: 'none', borderBottom: tabActiva === i ? '2px solid #283593' : '2px solid transparent',
              background: 'transparent', color: tabActiva === i ? '#283593' : '#6B7280',
              marginBottom: -2, whiteSpace: 'nowrap',
            }}>{tab}</button>
          ))}
        </div>
      </div>
      {tabActiva === 0 && <TabHistorial />}
      {tabActiva === 1 && <TabDetalle />}
      {tabActiva === 2 && <TabDevoluciones />}
      {tabActiva === 3 && <TabValidacion />}
    </div>
  )
}
