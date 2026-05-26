import React, { useState, useEffect, useCallback } from 'react'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const VENTAS_BASE  = '/api/api/ventas'
const TICKETS_BASE = '/api/tickets'

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const IGV_RATE = 0.18

function detectTipo(tx) {
  const hasBoletos = tx.boletos?.length > 0
  const hasSnacks  = tx.snacks?.length > 0
  if (hasBoletos && hasSnacks) return 'Entrada + Dulcería'
  if (hasBoletos) return 'Solo Entrada'
  if (hasSnacks)  return 'Solo Dulcería'
  return 'Solo Entrada'
}

function detectTipoFromListItem(tx) {
  return tx.tipo || 'Solo Entrada'
}

function calcSummary(detail) {
  const dulceriaReal  = (detail.snacks || []).reduce((s, s2) => s + parseFloat(s2.subtotal || 0), 0)
  const entradasReal  = (detail.boletos || []).reduce((s, b) => s + parseFloat(b.precio_pagado || 0), 0)
  const descuento     = parseFloat(detail.descuento_aplicado || 0)
  const totalReal     = entradasReal + dulceriaReal - descuento

  const cargos        = 2.00

  if (totalReal === 0) {
    return { entradas: 0, dulceria: 0, descuento, cargos, igv: 0, total: 0, entradasReal, dulceriaReal }
  }

  const sinCargos     = totalReal - cargos
  const igv           = parseFloat((sinCargos * IGV_RATE / (1 + IGV_RATE)).toFixed(2))
  const ratio         = sinCargos / totalReal
  const entradasNet   = parseFloat((entradasReal * ratio - igv * (entradasReal / totalReal)).toFixed(2))
  const dulceriaNet   = parseFloat((sinCargos - igv - entradasNet).toFixed(2))

  return {
    entradas:     entradasNet,
    dulceria:     dulceriaNet,
    descuento,
    cargos,
    igv,
    total:        totalReal,
    entradasReal,
    dulceriaReal,
  }
}

function fmtMoney(n) {
  return `S/ ${parseFloat(n).toFixed(2)}`
}

function fmtDate(str, opts = {}) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', ...opts })
}

function fmtDateTime(str) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + ' hrs'
}

// ─── ICONO DESCARGA SVG ───────────────────────────────────────────────────────
function DownloadIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

// ─── BADGES ──────────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    Completada:  { bg: '#DCFCE7', text: '#008236' },
    Pendiente:   { bg: '#FEF9C3', text: '#B45309' },
    Reembolsada: { bg: '#FFE5DC', text: '#C2410C' },
    Cancelada:   { bg: '#F3F4F6', text: '#6B7280' },
    Aprobada:    { bg: '#DCFCE7', text: '#008236' },
    Rechazada:   { bg: '#FFE5DC', text: '#C2410C' },
    'Válida':    { bg: '#DCFCE7', text: '#008236' },
    'Inválida':  { bg: '#FFE5DC', text: '#C2410C' },
    'Ya Usada':  { bg: '#FEF9C3', text: '#B45309' },
    Pagado:      { bg: '#DCFCE7', text: '#008236' },
    Cancelado:   { bg: '#F3F4F6', text: '#6B7280' },
    Reembolsado: { bg: '#FFE5DC', text: '#C2410C' },
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
  const map = {
    'Solo Entrada':       { bg: '#EEF2FF', color: '#283593' },
    'Entrada + Dulcería': { bg: '#DCFCE7', color: '#008236' },
    'Solo Dulcería':      { bg: '#FEF9C3', color: '#B45309' },
    'Combo':              { bg: '#FFE5DC', color: '#C2410C' },
  }
  const s = map[tipo] || { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {tipo || '—'}
    </span>
  )
}

// ─── SHARED UI ───────────────────────────────────────────────────────────────
function SelectFilter({ label, options, value, onChange, minWidth = 130 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#364153', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', background: '#fff', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 32px 8px 12px', fontSize: 14, color: '#4A5565', cursor: 'pointer', outline: 'none', appearance: 'none' }}>
          {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 12 }}>▼</span>
      </div>
    </div>
  )
}

function SearchInput({ label, placeholder, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 2, minWidth: 180 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#364153', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ background: '#fff', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#4A5565', outline: 'none' }} />
    </div>
  )
}

function EmptyTableMessage({ colSpan = 10, message = 'Sin registros para mostrar.' }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
          </svg>
          <span style={{ fontSize: 14, color: '#9CA3AF' }}>{message}</span>
        </div>
      </td>
    </tr>
  )
}

function LoadingRow({ colSpan = 10 }) {
  return <tr><td colSpan={colSpan} style={{ padding: '48px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Cargando…</td></tr>
}

function ErrorRow({ colSpan = 10, message }) {
  return <tr><td colSpan={colSpan} style={{ padding: '48px 20px', textAlign: 'center', color: '#EF4444', fontSize: 14 }}>⚠️ {message}</td></tr>
}

function PaginationBar({ page, totalPages, onPrev, onNext }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #E5E7EB' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>Página {page} de {totalPages || 1}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onPrev} disabled={page <= 1} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 13, border: '1px solid #D1D5DC', background: 'transparent', color: page <= 1 ? '#9CA3AF' : '#283593', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Anterior</button>
        <button onClick={onNext} disabled={page >= totalPages} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 13, border: '1px solid #D1D5DC', background: 'transparent', color: page >= totalPages ? '#9CA3AF' : '#283593', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}>Siguiente</button>
      </div>
    </div>
  )
}

// ─── SUBCOMPONENTES DE DETALLE ────────────────────────────────────────────────
function DetalleCard({ children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 24, ...style }}>
      {children}
    </div>
  )
}

function DetalleSectionTitle({ children }) {
  return (
    <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 12, marginBottom: 18 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#121212' }}>{children}</h3>
    </div>
  )
}

function DetalleInfoGrid({ fields }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
      {fields.map(([lbl, val]) => (
        <div key={lbl}>
          <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#121212' }}>{val || '—'}</p>
        </div>
      ))}
    </div>
  )
}

// ─── FECHA / TIPO OPTIONS ─────────────────────────────────────────────────────
const FECHA_OPTIONS = [
  { label: 'Cualquier fecha', value: '' },
  { label: 'Hoy',             value: '1d' },
  { label: 'Esta semana',     value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
]

const TIPO_OPTIONS = [
  { label: 'Todos los tipos',    value: '' },
  { label: 'Solo Entrada',       value: 'Solo Entrada' },
  { label: 'Entrada + Dulcería', value: 'Entrada + Dulcería' },
  { label: 'Solo Dulcería',      value: 'Solo Dulcería' },
  { label: 'Combo',              value: 'Combo' },
]

// ─── TAB: HISTORIAL ───────────────────────────────────────────────────────────
function TabHistorial({ onSelectTransaction }) {
  const [estado,     setEstado]     = useState('')
  const [fecha,      setFecha]      = useState('')
  const [tipo,       setTipo]       = useState('')
  const [buscarTemp, setBuscarTemp] = useState('')
  const [buscar,     setBuscar]     = useState('')
  const [page,       setPage]       = useState(1)
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      if (estado) params.append('estado', estado)
      if (fecha)  params.append('fecha',  fecha)
      if (buscar) params.append('buscar', buscar)
      const res = await apiFetch(`${VENTAS_BASE}/transacciones?${params}`)
      setData(res)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [estado, fecha, buscar, page])

  useEffect(() => { fetchData() }, [fetchData])

  const hayFiltrosActivos = estado || fecha || tipo || buscar || buscarTemp

  const handleLimpiarFiltros = () => {
    setEstado('')
    setFecha('')
    setTipo('')
    setBuscarTemp('')
    setBuscar('')
    setPage(1)
  }

  const metrics      = data?.metricas || data?.metrics || {}
  const transactions = data?.data || []
  const totalPages   = data?.totalPages || data?.total_pages || 1

  const filtered = tipo
    ? transactions.filter(tx => detectTipoFromListItem(tx) === tipo)
    : transactions

  const metricas = [
    { label: 'Ventas del Mes',    value: metrics.ventasMes     ?? metrics.total_ventas     ?? '—', sub: 'Boletos vendidos',   icon: '🎟️' },
    { label: 'Ingresos Totales',  value: metrics.ingresosTotales != null ? fmtMoney(metrics.ingresosTotales) : metrics.ingresos_totales != null ? fmtMoney(metrics.ingresos_totales) : '—', sub: 'Este Mes', icon: '💰' },
    { label: 'Reembolsos',        value: metrics.reembolsos    ?? metrics.total_reembolsos ?? '—', sub: 'Solicitudes',         icon: '↩️' },
    { label: 'Ticket Promedio',   value: metrics.ticketPromedio != null ? fmtMoney(metrics.ticketPromedio) : metrics.ticket_promedio != null ? fmtMoney(metrics.ticket_promedio) : '—', sub: 'Por transacción', icon: '📊' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {metricas.map(card => (
          <div key={card.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{card.icon}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{card.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: card.value === '—' ? '#9CA3AF' : '#121212' }}>{card.value}</span>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SearchInput
            label="Buscar"
            placeholder="ID transacción, cliente, película"
            value={buscarTemp}
            onChange={setBuscarTemp}
          />
          <SelectFilter
            label="Estado"
            options={[
              { label: 'Todos los estados', value: '' },
              { label: 'Pagado',            value: 'Pagado' },
              { label: 'Pendiente',         value: 'Pendiente' },
              { label: 'Cancelado',         value: 'Cancelado' },
              { label: 'Reembolsado',       value: 'Reembolsado' },
            ]}
            value={estado} onChange={v => { setEstado(v); setPage(1) }}
          />
          <SelectFilter
            label="Tipo de reporte"
            options={TIPO_OPTIONS}
            value={tipo} onChange={v => { setTipo(v); setPage(1) }}
          />
          <SelectFilter
            label="Período"
            options={FECHA_OPTIONS}
            value={fecha} onChange={v => { setFecha(v); setPage(1) }}
          />
          <button
            onClick={() => { setBuscar(buscarTemp); setPage(1) }}
            style={{
              background: '#283593', color: '#fff', border: 'none',
              borderRadius: 8, padding: '9px 18px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', height: 38,
            }}>
            Aplicar filtros
          </button>
          {hayFiltrosActivos && (
            <button
              onClick={handleLimpiarFiltros}
              style={{
                background: '#fff', color: '#6B7280',
                border: '1px solid #D1D5DC', borderRadius: 8,
                padding: '9px 18px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', alignSelf: 'flex-end', height: 38,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Historial global de transacciones</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Registro completo de todas las operaciones</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#ECEFF1' }}>
                {['ID Transacción', 'Fecha', 'Cliente', 'Película', 'Sala', 'Tipo', 'Monto Total', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#4A5565', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={9} /> :
               error   ? <ErrorRow  colSpan={9} message={error} /> :
               filtered.length === 0 ? <EmptyTableMessage colSpan={9} /> :
               filtered.map(tx => (
                <tr key={tx.id_reserva} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', color: '#283593', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {tx.transaccion_id || `#${tx.id_reserva}`}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#4A5565', whiteSpace: 'nowrap' }}>{fmtDate(tx.fecha_compra)}</td>
                  <td style={{ padding: '10px 14px', color: '#121212' }}>{tx.cliente || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#4A5565', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.pelicula || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#4A5565' }}>{tx.sala || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><TipoBadge tipo={detectTipoFromListItem(tx)} /></td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#121212' }}>{tx.monto_total != null ? fmtMoney(tx.monto_total) : '—'}</td>
                  <td style={{ padding: '10px 14px' }}><EstadoBadge estado={tx.estado_pago} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => onSelectTransaction(tx.id_reserva)}
                      style={{ background: '#EEF2FF', color: '#283593', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} totalPages={totalPages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  )
}

// ─── TAB: DETALLE DE COMPRA ───────────────────────────────────────────────────
function TabDetalle({ reservationId, onBack }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!reservationId) return
    setLoading(true); setError(null); setData(null)
    apiFetch(`${VENTAS_BASE}/transacciones/${reservationId}`)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [reservationId])

  if (!reservationId) return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 48, textAlign: 'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <p style={{ color: '#9CA3AF', fontSize: 15, margin: 0 }}>Selecciona una transacción desde el historial para ver el detalle.</p>
    </div>
  )

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Cargando detalle…</div>
  if (error)   return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444' }}>⚠️ {error}</div>
  if (!data)   return null

  const funcion     = data.funcion || {}
  const fechaInicio = funcion.fecha_inicio ? new Date(funcion.fecha_inicio) : null
  const fechaFin    = funcion.fecha_fin    ? new Date(funcion.fecha_fin)    : null
  const duracion    = fechaInicio && fechaFin ? Math.round((fechaFin - fechaInicio) / 60000) + ' min' : '—'
  const asientos    = (data.boletos || []).map(b => b.asiento).join(', ')
  const summary     = calcSummary(data)

  const historialTx = [
    { label: 'Compra completada',           fecha: data.fecha_reserva },
    { label: 'Pago confirmado por pasarela', fecha: data.fecha_reserva },
    { label: 'Carrito iniciado por cliente', fecha: data.fecha_reserva },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          {onBack && (
            <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', padding: 0, marginBottom: 10 }}>
              ← Volver al historial
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#121212' }}>
            Compra {data.transaccion_id || `#${data.id_reserva}`}
          </h2>
          <p style={{ margin: '5px 0 0', fontSize: 14, color: '#6B7280' }}>
            {data.fecha_reserva ? fmtDateTime(data.fecha_reserva) : '—'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <EstadoBadge estado={data.estado_pago === 'Pagado' ? 'Completada' : data.estado_pago} />
          {/* Botón Descargar PDF con icono SVG */}
          <a
            href={`${TICKETS_BASE}/reservation/${data.id_reserva}/pdf`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, color: '#121212', textDecoration: 'none' }}>
            <DownloadIcon size={15} color="#374151" />
            Descargar PDF
          </a>
          <button style={{ padding: '7px 16px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FFF1F2', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#C2410C' }}>
            Solicitar Reembolso
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DetalleCard>
            <DetalleSectionTitle>Información del Cliente</DetalleSectionTitle>
            <DetalleInfoGrid fields={[
              ['Nombre',         data.cliente],
              ['Documento',      data.documento || '—'],
              ['Email',          data.correo],
              ['Teléfono',       data.telefono || '—'],
              ['Canal de venta', 'Web Online'],
              ['Método de pago', data.metodo_pago],
            ]} />
          </DetalleCard>

          <DetalleCard>
            <DetalleSectionTitle>Detalle de la Función</DetalleSectionTitle>
            <DetalleInfoGrid fields={[
              ['Película',     data.pelicula],
              ['Formato',      [funcion.idioma, funcion.formato].filter(Boolean).join(' · ') || '—'],
              ['Fecha y hora', fechaInicio
                ? fechaInicio.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                  ' – ' + fechaInicio.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + ' hrs'
                : '—'],
              ['Sala',         data.sala],
              ['Asientos',     asientos || '—'],
              ['Duración',     duracion],
            ]} />
          </DetalleCard>

          <DetalleCard>
            <DetalleSectionTitle>Productos Adquiridos</DetalleSectionTitle>
            {data.boletos?.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#121212' }}>Entrada General × {data.boletos.length}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>{data.sala} · Asientos {asientos}</p>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{fmtMoney(summary.entradasReal)}</p>
              </div>
            )}
            {(data.snacks || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#121212' }}>{s.producto} × {s.cantidad}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>Dulcería</p>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{fmtMoney(s.subtotal)}</p>
              </div>
            ))}
            {!data.boletos?.length && !data.snacks?.length && (
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Sin productos registrados.</p>
            )}
          </DetalleCard>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DetalleCard>
            <DetalleSectionTitle>Resumen de Pago</DetalleSectionTitle>
            <div style={{ fontSize: 14 }}>
              {[
                { label: `Entradas (×${data.boletos?.length || 0})`, val: summary.entradas,   color: '#121212' },
                { label: 'Dulcería',                                  val: summary.dulceria,   color: '#121212' },
                { label: 'Cargos por servicio',                       val: summary.cargos,     color: '#121212' },
                { label: 'Descuentos aplicados',                      val: -summary.descuento, color: '#008236', hide: summary.descuento === 0 },
                { label: 'IGV (18%)',                                  val: summary.igv,        color: '#121212' },
              ].filter(r => !r.hide).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: i === 0 ? '1px solid #F3F4F6' : 'none' }}>
                  <span style={{ color: '#6B7280' }}>{row.label}</span>
                  <span style={{ fontWeight: 500, color: row.color }}>
                    {row.val < 0 ? `– ${fmtMoney(Math.abs(row.val))}` : fmtMoney(row.val)}
                  </span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 6, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Total Pagado</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{fmtMoney(summary.total)}</span>
              </div>
            </div>
          </DetalleCard>

          <DetalleCard>
            <DetalleSectionTitle>Historial de la Transacción</DetalleSectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {historialTx.map((h, i) => {
                const d = h.fecha ? new Date(h.fecha) : null
                return (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 12, color: '#008236', fontWeight: 700 }}>✓</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#121212' }}>{h.label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                        {d ? d.toLocaleDateString('es-PE') + ' – ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + ' hrs' : '—'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </DetalleCard>

          {data.boletos?.length > 0 && (
            <DetalleCard>
              <DetalleSectionTitle>Entradas Generadas</DetalleSectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.boletos.map((b, i) => (
                  <div key={b.id_boleto} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#283593' }}>
                        TICKET #{data.transaccion_id || data.id_reserva}-{String.fromCharCode(65 + i)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>
                        Asiento {b.asiento} · {data.sala}
                        {fechaInicio ? ' · ' + fechaInicio.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EstadoBadge estado={b.estado_ingreso === 'Vigente' ? 'Válida' : 'Ya Usada'} />
                      {/* Icono descarga SVG en lugar del emoji ⬇ */}
                      <a
                        href={`${TICKETS_BASE}/reservation/${data.id_reserva}/pdf`}
                        target="_blank" rel="noopener noreferrer"
                        title="Descargar ticket"
                        style={{ color: '#6B7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        <DownloadIcon size={18} color="#6B7280" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </DetalleCard>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── TAB: DEVOLUCIONES ────────────────────────────────────────────────────────
function TabDevoluciones() {
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [buscarTemp,   setBuscarTemp]   = useState('')
  const [buscar,       setBuscar]       = useState('')
  const [page,         setPage]         = useState(1)
  const [data,         setData]         = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page, limit: 10 })
      params.append('estado', estadoFiltro || 'Reembolsado')
      if (buscar) params.append('buscar', buscar)
      const res = await apiFetch(`${VENTAS_BASE}/transacciones?${params}`)
      setData(res)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [estadoFiltro, buscar, page])

  useEffect(() => { fetchData() }, [fetchData])

  const transactions = data?.data || []
  const totalPages   = data?.totalPages || data?.total_pages || 1
  const metrics      = data?.metricas || data?.metrics || {}

  const metricas = [
    { label: 'Solicitudes Totales', value: metrics.ventasMes ?? metrics.total_ventas ?? '—',     sub: 'Este mes',           iconBg: '#EEF2FF', iconColor: '#283593', icon: '↺' },
    { label: 'Pendientes',          value: '—',                                                    sub: 'Requieren revisión', iconBg: '#FEF9C3', iconColor: '#B45309', icon: '⏱' },
    { label: 'Reembolsadas',        value: metrics.reembolsos ?? metrics.total_reembolsos ?? '—', sub: 'Reembolso procesado', iconBg: '#DCFCE7', iconColor: '#008236', icon: '✓' },
    { label: 'Monto Devuelto',      value: '—',                                                    sub: 'Total mes',          iconBg: '#EEF2FF', iconColor: '#283593', icon: '$' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {metricas.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: c.iconColor, marginBottom: 12, fontWeight: 700 }}>{c.icon}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c.value === '—' ? '#9CA3AF' : '#121212' }}>{c.value}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <SearchInput label="Buscar solicitud" placeholder="ID reserva, cliente" value={buscarTemp} onChange={setBuscarTemp} />
          <SelectFilter
            label="Estado"
            options={[
              { label: 'Reembolsados', value: 'Reembolsado' },
              { label: 'Cancelados',   value: 'Cancelado' },
            ]}
            value={estadoFiltro || 'Reembolsado'} onChange={v => { setEstadoFiltro(v); setPage(1) }}
          />
          <button onClick={() => { setBuscar(buscarTemp); setPage(1) }}
            style={{ background: '#283593', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-end', height: 38, whiteSpace: 'nowrap' }}>
            Aplicar filtros
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Gestión de devoluciones y reembolsos</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Transacciones reembolsadas o canceladas</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#ECEFF1' }}>
                {['ID Reserva', 'Fecha', 'Cliente', 'Película', 'Monto', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#4A5565', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={6} /> :
               error   ? <ErrorRow  colSpan={6} message={error} /> :
               transactions.length === 0 ? <EmptyTableMessage colSpan={6} message="No hay devoluciones para mostrar." /> :
               transactions.map(tx => (
                <tr key={tx.id_reserva} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', color: '#283593', fontWeight: 600 }}>#{tx.id_reserva}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{fmtDate(tx.fecha_compra)}</td>
                  <td style={{ padding: '10px 14px' }}>{tx.cliente || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{tx.pelicula || '—'}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{tx.monto_total != null ? fmtMoney(tx.monto_total) : '—'}</td>
                  <td style={{ padding: '10px 14px' }}><EstadoBadge estado={tx.estado_pago} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} totalPages={totalPages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  )
}

// ─── TAB: VALIDACIÓN ──────────────────────────────────────────────────────────
// Conjunto global de códigos ya usados en la sesión (persiste entre renders)
const codigosUsadosEnSesion = new Set()

const LOG_PER_PAGE = 10

function TabValidacion() {
  const [codigoInput, setCodigoInput] = useState('')
  const [resultado,   setResultado]   = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [logEntries,  setLogEntries]  = useState([])
  const [logPage,     setLogPage]     = useState(1)

  const handleValidar = async () => {
    const codigo = codigoInput.trim()
    if (!codigo) return

    // ── FIX: detectar código ya usado en esta sesión ──────────────────────
    if (codigosUsadosEnSesion.has(codigo)) {
      const entradaYaUsada = {
        ticket_id: codigo,
        hora:      new Date().toLocaleTimeString('es-PE'),
        cliente:   '—',
        asiento:   '—',
        resultado: 'Ya Usada',
      }
      setResultado({ valido: false, estado: 'Esta entrada ya fue usada anteriormente en esta sesión.' })
      setLogEntries(prev => [entradaYaUsada, ...prev].slice(0, 200))
      setLogPage(1)
      return
    }

    setLoading(true); setError(null); setResultado(null)
    try {
      const body = codigo.startsWith('QR_')
        ? { codigo_qr: codigo }
        : { codigo: codigo }
      const res = await apiFetch(`${VENTAS_BASE}/validar`, { method: 'POST', body: JSON.stringify(body) })

      // Si la entrada es válida, marcarla como usada para esta sesión
      if (res.valido) {
        codigosUsadosEnSesion.add(codigo)
      }

      setResultado(res)
      setLogEntries(prev => [{
        ticket_id: codigo,
        hora:      new Date().toLocaleTimeString('es-PE'),
        cliente:   res.cliente  || '—',
        asiento:   res.asiento  || '—',
        resultado: res.valido ? 'Válida' : (res.estado?.includes('Ya') ? 'Ya Usada' : 'Inválida'),
      }, ...prev].slice(0, 200))
      setLogPage(1)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const validadas = logEntries.filter(e => e.resultado === 'Válida').length
  const invalidas = logEntries.filter(e => e.resultado !== 'Válida').length

  // ── Paginación del log ────────────────────────────────────────────────────
  const totalLogPages  = Math.max(1, Math.ceil(logEntries.length / LOG_PER_PAGE))
  const logPaginado    = logEntries.slice((logPage - 1) * LOG_PER_PAGE, logPage * LOG_PER_PAGE)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#121212', margin: '0 0 14px', textAlign: 'center' }}>Validar entrada</h3>
          <div style={{ background: '#F3F4F6', borderRadius: 8, padding: 20, marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 80, height: 80, border: '3px solid #283593', borderRadius: 6, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
                <div key={v+h} style={{ position: 'absolute', [v]: -3, [h]: -3, width: 20, height: 20, [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: '3px solid #283593', [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: '3px solid #283593' }} />
              ))}
              <div style={{ width: 40, height: 3, background: '#283593', opacity: 0.7 }} />
            </div>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Escanear código QR</span>
          </div>
          <input
            type="text" value={codigoInput}
            onChange={e => setCodigoInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleValidar()}
            placeholder="Ej: QR_TK_1001_FUNC1_AS1"
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button onClick={handleValidar} disabled={loading}
            style={{ width: '100%', background: loading ? '#9CA3AF' : '#283593', color: '#fff', border: 'none', borderRadius: 8, padding: 9, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Validando…' : 'Validar'}
          </button>
          {resultado && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: resultado.valido ? '#DCFCE7' : '#FFE5DC', border: `1px solid ${resultado.valido ? '#86EFAC' : '#FCA5A5'}` }}>
              <div style={{ fontWeight: 700, color: resultado.valido ? '#008236' : '#C2410C', fontSize: 14, marginBottom: 4 }}>
                {resultado.valido ? '✅ Entrada válida' : '❌ Entrada inválida'}
              </div>
              <div style={{ fontSize: 12, color: '#4A5565' }}>{resultado.estado}</div>
            </div>
          )}
          {error && (
            <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: '#FFF1F2', border: '1px solid #FCA5A5', fontSize: 12, color: '#C2410C' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {[
          { label: 'Entradas validadas (sesión)', value: validadas, color: '#008236' },
          { label: 'Sin usar / pendientes',       value: '—',       color: '#9CA3AF' },
          { label: 'Intentos inválidos (sesión)', value: invalidas, color: '#C2410C' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: s.value === '—' ? '#9CA3AF' : s.color }}>{s.value}</span>
            <span style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 6 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Log con paginación */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Log de validaciones</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
            Últimas entradas registradas en esta sesión
            {logEntries.length > 0 && ` · ${logEntries.length} registro${logEntries.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#ECEFF1' }}>
                {['Ticket / QR', 'Hora', 'Cliente', 'Asiento', 'Resultado'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#4A5565' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logEntries.length === 0
                ? <EmptyTableMessage colSpan={5} message="Aún no se ha validado ninguna entrada." />
                : logPaginado.map((e, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#283593' }}>{e.ticket_id}</td>
                    <td style={{ padding: '10px 14px' }}>{e.hora}</td>
                    <td style={{ padding: '10px 14px' }}>{e.cliente}</td>
                    <td style={{ padding: '10px 14px' }}>{e.asiento}</td>
                    <td style={{ padding: '10px 14px' }}><EstadoBadge estado={e.resultado} /></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* Paginación del log */}
        {logEntries.length > LOG_PER_PAGE && (
          <PaginationBar
            page={logPage}
            totalPages={totalLogPages}
            onPrev={() => setLogPage(p => p - 1)}
            onNext={() => setLogPage(p => p + 1)}
          />
        )}
      </div>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TABS = [
  'Historial de Transacciones',
  'Detalle de Compra',
  'Devoluciones y Reembolsos',
  'Validación de Entradas',
]

export default function VentasYTickets() {
  const [tabActiva,             setTabActiva]             = useState(0)
  const [selectedReservationId, setSelectedReservationId] = useState(null)

  const handleSelectTransaction = (id) => {
    setSelectedReservationId(id)
    setTabActiva(1)
  }

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Ventas y Tickets</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
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

      {tabActiva === 0 && <TabHistorial onSelectTransaction={handleSelectTransaction} />}
      {tabActiva === 1 && <TabDetalle reservationId={selectedReservationId} onBack={() => setTabActiva(0)} />}
      {tabActiva === 2 && <TabDevoluciones />}
      {tabActiva === 3 && <TabValidacion />}
    </div>
  )
}