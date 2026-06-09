import React, { useState, useEffect, useCallback } from 'react'

const VENTAS_BASE        = '/api/admin/transactions'
const TICKETS_BASE       = '/api/tickets'
const ADMIN_REEMBOLSOS   = '/api/admin/reembolsos'

async function apiFetch(url, opts = {}) {
  if (!url.startsWith('/api/')) throw new Error('URL no permitida')
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

function detectTipo(tx) {
  const hasBoletos = (tx.monto_boletos || 0) > 0
  const hasSnacks  = (tx.monto_confiteria || 0) > 0
  if (hasBoletos && hasSnacks) return 'Entrada + Dulcería'
  if (hasBoletos) return 'Solo Entrada'
  if (hasSnacks)  return 'Solo Dulcería'
  return 'Solo Entrada'
}

function detectTipoFromListItem(tx) {
  const monto = parseFloat(tx.monto_total || 0)
  if (monto > 50) return 'Entrada + Dulcería'
  if (monto > 0)  return 'Solo Entrada'
  return 'Solo Entrada'
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

function EstadoBadge({ estado }) {
  const estados = estado || ''
  const map = {
    Aprobado:     { bg: '#DCFCE7', text: '#008236' },
    Pendiente:    { bg: '#FEF9C3', text: '#B45309' },
    Reembolsada:  { bg: '#FFE5DC', text: '#C2410C' },
    Fallido:      { bg: '#FFE5DC', text: '#C2410C' },
    'Evaluacion': { bg: '#FEF9C3', text: '#B45309' },
    Aprobada:     { bg: '#DCFCE7', text: '#008236' },
    Rechazada:    { bg: '#FFE5DC', text: '#C2410C' },
    Valido:       { bg: '#DCFCE7', text: '#008236' },
    Cancelado:    { bg: '#F3F4F6', text: '#6B7280' },
    Canjeado:     { bg: '#F3F4F6', text: '#6B7280' },
  }
  const s = map[estados] || { bg: '#F3F4F6', text: '#6B7280' }
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: '3px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
    }}>{estados}</span>
  )
}

function TipoBadge({ tipo }) {
  const map = {
    'Solo Entrada':       { bg: '#EEF2FF', color: '#283593' },
    'Entrada + Dulcería': { bg: '#DCFCE7', color: '#008236' },
    'Solo Dulcería':      { bg: '#FEF9C3', color: '#B45309' },
  }
  const s = map[tipo] || { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {tipo || '—'}
    </span>
  )
}

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
]

function TabHistorial({ onSelectTransaction, computedTotals = {} }) {
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
      const res = await apiFetch(`${VENTAS_BASE}/?${params}`)
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

  const transactions = data?.data || data?.results || (Array.isArray(data) ? data : [])
  const totalPages   = data?.totalPages || data?.total_pages || 1

  const m = data?.metricas || {}

  const metricas = [
    { label: 'Transacciones',     value: m.ventasMes ?? 0,                                       sub: 'Aprobadas',       icon: '🎟️' },
    { label: 'Ingresos',          value: fmtMoney(m.ingresosTotales || 0),                        sub: 'Total aprobados', icon: '💰' },
    { label: 'Reembolsos',        value: m.reembolsos ?? 0,                                       sub: 'Registrados',     icon: '↩️' },
    { label: 'Ticket Promedio',   value: m.ticketPromedio ? fmtMoney(m.ticketPromedio) : '—',     sub: 'Por pago',        icon: '📊' },
  ]

  const filtered = tipo
    ? transactions.filter(tx => detectTipoFromListItem(tx) === tipo)
    : transactions
  const getMonto = (tx) => computedTotals[tx.id_transaccion] ?? tx.monto_total

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
              { label: 'Aprobado',          value: 'Aprobado' },
              { label: 'Pendiente',         value: 'Pendiente' },
              { label: 'Fallido',           value: 'Fallido' },
              { label: 'Reembolsada',       value: 'Reembolsada' },
            ]}
            value={estado} onChange={v => { setEstado(v); setPage(1) }}
          />
          <SelectFilter
            label="Tipo"
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
                <tr key={tx.id_transaccion} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', color: '#283593', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                    {tx.transaccion_id || `#${tx.id_transaccion}`}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#4A5565', whiteSpace: 'nowrap' }}>{fmtDate(tx.fecha_transaccion)}</td>
                  <td style={{ padding: '10px 14px', color: '#121212' }}>{tx.cliente || tx.usuario_nombre || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#4A5565', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.pelicula || tx.pelicula_titulo || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#4A5565' }}>{tx.sala || tx.sala_nombre || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><TipoBadge tipo={detectTipoFromListItem(tx)} /></td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#121212' }}>{getMonto(tx) != null ? fmtMoney(getMonto(tx)) : '—'}</td>
                  <td style={{ padding: '10px 14px' }}><EstadoBadge estado={tx.estado_pago} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    <button onClick={() => onSelectTransaction(tx.id_transaccion)}
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

function ReembolsoModal({ transaccionId, montoTotal, onClose, onCreated }) {
  const [motivo,       setMotivo]       = useState('')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)
  const [tipoR,        setTipoR]        = useState('Reembolso total')
  const [montoR,       setMontoR]       = useState(montoTotal)

  const handleSubmit = async () => {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    setSaving(true); setError(null)
    try {
      await apiFetch(`/api/reembolsos/`, {
        method: 'POST',
        body: JSON.stringify({
          id_transaccion: transaccionId,
          motivo: motivo.trim(),
          monto_reembolsado: parseFloat(montoR),
          tipo_reembolso: tipoR,
        }),
      })
      onCreated()
      onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#121212' }}>Solicitar Reembolso</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Motivo *</label>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
            placeholder="Describa el motivo del reembolso..." />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Tipo de reembolso *</label>
          <select value={tipoR} onChange={e => { setTipoR(e.target.value); if (e.target.value === 'Sin reembolso') setMontoR(0) }}
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none' }}>
            <option value="Reembolso total">Reembolso total</option>
            <option value="Reembolso parcial">Reembolso parcial</option>
            <option value="Sin reembolso">Sin reembolso</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Monto a reembolsar *</label>
          <input type="number" step="0.01" value={montoR} onChange={e => setMontoR(e.target.value)}
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#C2410C' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !motivo.trim()}
            style={{ padding: '8px 24px', border: 'none', borderRadius: 8, background: saving ? '#9CA3AF' : '#C2410C', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Enviando…' : 'Solicitar Reembolso'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResolveModal({ solicitud, onClose, onResolved }) {
  const [estadoRes,     setEstadoRes]     = useState('Aprobada')
  const [comentario,    setComentario]    = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState(null)

  const handleResolve = async () => {
    setSaving(true); setError(null)
    try {
      await apiFetch(`${ADMIN_REEMBOLSOS}/${solicitud.id_reembolso}`, {
        method: 'PUT',
        body: JSON.stringify({
          estado_solicitud: estadoRes,
          comentario_administrador: comentario,
        }),
      })
      onResolved()
      onClose()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#121212' }}>Resolver Solicitud #{solicitud.id_reembolso}</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          Transacción #{solicitud.id_transaccion} · {fmtMoney(solicitud.monto_reembolsado)} · {solicitud.tipo_reembolso}
        </p>
        {solicitud.motivo && (
          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#374151' }}>
            <strong>Motivo:</strong> {solicitud.motivo}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Decisión *</label>
          <select value={estadoRes} onChange={e => setEstadoRes(e.target.value)}
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none' }}>
            <option value="Aprobada">Aprobar</option>
            <option value="Rechazada">Rechazar</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Comentario de resolución</label>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={3}
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 8, padding: '8px 10px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: 13, color: '#C2410C' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleResolve} disabled={saving}
            style={{ padding: '8px 24px', border: 'none', borderRadius: 8, background: saving ? '#9CA3AF' : '#283593', color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TabDetalle({ reservationId, onBack, onUpdateTotal }) {
  const [data,           setData]           = useState(null)
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [solicitudes,    setSolicitudes]    = useState([])
  const [showRefund,     setShowRefund]     = useState(false)
  const [resolveTarget,  setResolveTarget]  = useState(null)
  const [refreshKey,     setRefreshKey]     = useState(0)

  useEffect(() => {
    if (!reservationId) return
    setLoading(true); setError(null); setData(null)
    Promise.all([
      apiFetch(`${VENTAS_BASE}/${reservationId}`),
      apiFetch(`${ADMIN_REEMBOLSOS}/`).catch(() => []),
    ]).then(([txData, sols]) => {
      if (txData.boletos) {
        const id = txData.id_transaccion || reservationId
        txData.boletos = txData.boletos.map((b, i) => ({
          ...b,
          codigo_qr_token: b.codigo_qr_token || `QR-FILMATE-TXN${id}-X92`,
        }))
      }
      setData(txData)
      if (onUpdateTotal) onUpdateTotal(reservationId, parseFloat(txData.monto_total || 0))
      setSolicitudes((sols || []).filter(s => s.id_transaccion === reservationId))
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [reservationId, refreshKey])

  const refreshSolicitudes = () => setRefreshKey(k => k + 1)

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

  const pelicula    = data.pelicula || '—'
  const sala        = data.sala || '—'
  const fechaHora   = null
  const asientos    = (data.boletos || []).map(b => b.asiento || '—').join(', ')
  const codigosQR   = (data.boletos || [])
    .map(b => b.codigo_qr_token)
    .filter(Boolean)
    .join(', ') || data.codigo_qr_token || '—'

  const pendienteSolicitud = solicitudes.find(s => s.estado_solicitud === 'Evaluacion')

  const historialTx = [
    { label: 'Transacción completada',           fecha: data.fecha_transaccion },
    { label: 'Pago confirmado por pasarela',     fecha: data.fecha_transaccion },
    { label: 'Carrito iniciado por cliente',     fecha: data.fecha_transaccion },
  ]

  return (
    <div>
      {showRefund && (
        <ReembolsoModal
          transaccionId={reservationId}
          montoTotal={parseFloat(data.monto_total || 0)}
          onClose={() => setShowRefund(false)}
          onCreated={refreshSolicitudes}
        />
      )}
      {resolveTarget && (
        <ResolveModal
          solicitud={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={refreshSolicitudes}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          {onBack && (
            <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', padding: 0, marginBottom: 10 }}>
              ← Volver al historial
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#121212' }}>
            Compra {data.transaccion_id || `#${data.id_transaccion}`}
          </h2>
          <p style={{ margin: '5px 0 0', fontSize: 14, color: '#6B7280' }}>
            {data.fecha_transaccion ? fmtDateTime(data.fecha_transaccion) : '—'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <EstadoBadge estado={data.estado_pago} />
          <a
            href={`${TICKETS_BASE}/transaction/${data.id_transaccion}/pdf`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', fontSize: 13, fontWeight: 600, color: '#121212', textDecoration: 'none' }}>
            <DownloadIcon size={15} color="#374151" />
            Descargar PDF
          </a>
          {!pendienteSolicitud && data.estado_pago === 'Aprobado' && (
            <button onClick={() => setShowRefund(true)}
              style={{ padding: '7px 16px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FFF1F2', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#C2410C' }}>
              Solicitar Reembolso
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DetalleCard>
            <DetalleSectionTitle>Información del Cliente</DetalleSectionTitle>
            <DetalleInfoGrid fields={[
              ['Nombre',         data.cliente || data.usuario_nombre || '—'],
              ['Email',          data.correo || data.usuario_correo || '—'],
              ['Canal de venta', 'Web Online'],
              ['Método de pago', data.metodo_pago],
            ]} />
          </DetalleCard>

          <DetalleCard>
            <DetalleSectionTitle>Detalle de la Función</DetalleSectionTitle>
            <DetalleInfoGrid fields={[
              ['Película',     pelicula],
              ['Sala',         sala],
              ['Fecha y hora', fechaHora
                ? fechaHora.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
                  ' – ' + fechaHora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) + ' hrs'
                : '—'],
              ['Asientos',     asientos || '—'],
              ['Código QR',    codigosQR],
              ['Boletos',      fmtMoney(data.monto_boletos || 0)],
              ['Confitería',   fmtMoney(data.monto_confiteria || 0)],
            ]} />
          </DetalleCard>

          <DetalleCard>
            <DetalleSectionTitle>Productos Adquiridos</DetalleSectionTitle>
            {(data.boletos || data.detalles_asientos || []).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#121212' }}>Asiento {d.asiento || `${d.fila || ''}${d.columna || ''}` || '—'}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>{sala} · Entrada</p>
                  {d.codigo_qr_token && (
                    <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'monospace', color: '#283593' }}>QR: {d.codigo_qr_token}</p>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{fmtMoney(d.precio_pagado || data.monto_boletos / Math.max((data.boletos || data.detalles_asientos || []).length, 1))}</p>
              </div>
            ))}
            {(data.snacks || data.detalles_confiteria || []).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#121212' }}>{d.producto || d.nombre_producto || `Producto #${d.id_producto || i}`} × {d.cantidad}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>Dulcería</p>
                </div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{fmtMoney(d.subtotal || (d.precio_unitario * d.cantidad) || 0)}</p>
              </div>
            ))}
            {!(data.boletos || data.detalles_asientos)?.length && !(data.snacks || data.detalles_confiteria)?.length && (
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Sin productos registrados.</p>
            )}
          </DetalleCard>

          {solicitudes.length > 0 && (
            <DetalleCard>
              <DetalleSectionTitle>Solicitudes de Reembolso</DetalleSectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {solicitudes.map(sol => (
                  <div key={sol.id_reembolso} style={{ padding: '12px 14px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#283593' }}>#{sol.id_reembolso}</span>
                      <EstadoBadge estado={sol.estado_solicitud === 'Aprobada' ? 'Aprobada' : sol.estado_solicitud === 'Rechazada' ? 'Rechazada' : 'Evaluacion'} />
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                      {fmtDate(sol.fecha_solicitud)} · {sol.tipo_reembolso} · {fmtMoney(sol.monto_reembolsado)}
                    </div>
                    {sol.motivo && (
                      <div style={{ fontSize: 12, color: '#374151', background: '#F9FAFB', borderRadius: 6, padding: '6px 10px', marginTop: 4 }}>
                        {sol.motivo}
                      </div>
                    )}
                    {sol.comentario_administrador && (
                      <div style={{ fontSize: 12, color: '#C2410C', background: '#FFF1F2', borderRadius: 6, padding: '6px 10px', marginTop: 4 }}>
                        <strong>Resolución:</strong> {sol.comentario_administrador}
                      </div>
                    )}
                    {sol.estado_solicitud === 'Evaluacion' && (
                      <button onClick={() => setResolveTarget(sol)}
                        style={{ marginTop: 8, padding: '5px 12px', border: '1px solid #283593', borderRadius: 6, background: '#EEF2FF', color: '#283593', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Resolver
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </DetalleCard>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <DetalleCard>
            <DetalleSectionTitle>Resumen de Pago</DetalleSectionTitle>
            <div style={{ fontSize: 14 }}>
              {parseFloat(data.monto_boletos || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ color: '#6B7280' }}>Entradas</span>
                  <span style={{ fontWeight: 500, color: '#121212' }}>{fmtMoney(data.monto_boletos)}</span>
                </div>
              )}

              {parseFloat(data.monto_confiteria || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#6B7280' }}>Dulcería</span>
                  <span style={{ fontWeight: 500, color: '#121212' }}>{fmtMoney(data.monto_confiteria)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 6, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Total Pagado</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{fmtMoney(data.monto_total || 0)}</span>
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


        </div>
      </div>
    </div>
  )
}

const SOLICITUD_ESTADOS = [
  { label: 'Todos los estados',   value: '' },
  { label: 'Evaluacion',          value: 'Evaluacion' },
  { label: 'Aprobadas',           value: 'Aprobada' },
  { label: 'Rechazadas',          value: 'Rechazada' },
]

function TabDevoluciones() {
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [fecha,        setFecha]        = useState('')
  const [buscarTemp,   setBuscarTemp]   = useState('')
  const [buscar,       setBuscar]       = useState('')
  const [page,         setPage]         = useState(1)
  const [data,         setData]         = useState(null)
  const [metrics,      setMetrics]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [resolveTarget, setResolveTarget] = useState(null)
  const [detailTarget, setDetailTarget]   = useState(null)
  const [refreshKey,   setRefreshKey]   = useState(0)
  const [now, setNow] = useState(0)
  useEffect(() => { setNow(Date.now()) }, [fecha])

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: 1, limit: 100 })
      const [sols, met] = await Promise.all([
        apiFetch(`${ADMIN_REEMBOLSOS}/?${params}`),
        apiFetch(`${ADMIN_REEMBOLSOS}/metricas`).catch(() => ({})),
      ])
      setData(sols || [])
      setMetrics(met || {})
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [refreshKey])

  useEffect(() => { fetchData() }, [fetchData])

  const allSolicitudes = data || []
  const hayFiltrosActivos = estadoFiltro || fecha || buscar

  const handleLimpiarFiltros = () => {
    setEstadoFiltro('')
    setFecha('')
    setBuscarTemp('')
    setBuscar('')
    setPage(1)
  }

  const filtered = allSolicitudes.filter(s => {
    if (estadoFiltro && s.estado_solicitud !== estadoFiltro) return false
    if (buscar) {
      const q = buscar.toLowerCase()
      if (!`#${s.id_reembolso}`.includes(q) &&
          !`#${s.id_transaccion}`.includes(q) &&
          !(s.motivo || '').toLowerCase().includes(q)) return false
    }
    if (fecha && s.fecha_solicitud) {
      const t = new Date(s.fecha_solicitud).getTime()
      if (isNaN(t)) return true
      const dias = { '1d': 1, '7d': 7, '30d': 30 }[fecha]
      if (dias && (now - t) > dias * 86400000) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10))
  const paginated = filtered.slice((page - 1) * 10, page * 10)

  const metricCards = [
    { label: 'Solicitudes Totales', value: allSolicitudes.length,             sub: 'Todas las solicitudes', iconBg: '#EEF2FF', iconColor: '#283593', icon: '↺' },
    { label: 'Evaluacion',          value: metrics?.evaluacion ?? '—',        sub: 'Requieren revisión',    iconBg: '#FEF9C3', iconColor: '#B45309', icon: '⏱' },
    { label: 'Aprobadas',           value: metrics?.aprobadas ?? '—',         sub: 'Reembolso procesado',   iconBg: '#DCFCE7', iconColor: '#008236', icon: '✓' },
    { label: 'Monto Devuelto',      value: metrics?.monto_total_aprobado != null ? fmtMoney(metrics.monto_total_aprobado) : '—', sub: 'Total aprobado', iconBg: '#EEF2FF', iconColor: '#283593', icon: '$' },
  ]

  return (
    <div>
      {resolveTarget && (
        <ResolveModal
          solicitud={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={() => { setRefreshKey(k => k + 1); setPage(1) }}
        />
      )}
      {detailTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => e.target === e.currentTarget && setDetailTarget(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#121212' }}>Detalle de Solicitud #{detailTarget.id_reembolso}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', marginBottom: 16 }}>
              {[
                ['ID Transacción', `#${detailTarget.id_transaccion}`],
                ['Fecha Solicitud', fmtDateTime(detailTarget.fecha_solicitud)],
                ['Motivo', detailTarget.motivo || '—'],
                ['Monto', fmtMoney(detailTarget.monto_reembolsado)],
                ['Tipo', detailTarget.tipo_reembolso],
                ['Estado', detailTarget.estado_solicitud],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#121212' }}>{val}</p>
                </div>
              ))}
            </div>
            {detailTarget.motivo && (
              <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Motivo</p>
                <p style={{ margin: 0, fontSize: 14, color: '#374151' }}>{detailTarget.motivo}</p>
              </div>
            )}
            {detailTarget.comentario_administrador && (
              <div style={{ background: '#FFF1F2', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
                <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resolución</p>
                <p style={{ margin: 0, fontSize: 14, color: '#C2410C' }}>{detailTarget.comentario_administrador}</p>
              </div>
            )}
            {detailTarget.fecha_resolucion && (
              <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Resuelto el {fmtDateTime(detailTarget.fecha_resolucion)}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setDetailTarget(null)} style={{ padding: '8px 20px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {metricCards.map(c => (
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
          <SearchInput
            label="Buscar"
            placeholder="#ID, transacción, motivo"
            value={buscarTemp}
            onChange={setBuscarTemp}
          />
          <SelectFilter
            label="Estado"
            options={SOLICITUD_ESTADOS}
            value={estadoFiltro} onChange={v => { setEstadoFiltro(v); setPage(1) }}
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
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Gestión de devoluciones y reembolsos</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>Solicitudes de reembolso registradas en el sistema</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#ECEFF1' }}>
                {['ID Solicitud', 'Transacción', 'Fecha', 'Motivo', 'Monto', 'Tipo', 'Estado', 'Acción'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#4A5565', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <LoadingRow colSpan={8} /> :
               error   ? <ErrorRow  colSpan={8} message={error} /> :
               paginated.length === 0 ? <EmptyTableMessage colSpan={8} message="No hay solicitudes de reembolso para mostrar." /> :
               paginated.map(sol => (
                <tr key={sol.id_reembolso} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '10px 14px', color: '#283593', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>#{sol.id_reembolso}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#4A5565' }}>#{sol.id_transaccion}</td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#4A5565' }}>{fmtDate(sol.fecha_solicitud)}</td>
                  <td style={{ padding: '10px 14px', color: '#121212', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sol.motivo || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#121212' }}>{fmtMoney(sol.monto_reembolsado)}</td>
                  <td style={{ padding: '10px 14px', color: '#4A5565', fontSize: 12 }}>{sol.tipo_reembolso}</td>
                  <td style={{ padding: '10px 14px' }}><EstadoBadge estado={sol.estado_solicitud} /></td>
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setDetailTarget(sol)}
                        style={{ padding: '4px 10px', border: '1px solid #D1D5DC', borderRadius: 6, background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#4A5565' }}>
                        Detalle
                      </button>
                      {sol.estado_solicitud === 'Evaluacion' && (
                        <button onClick={() => setResolveTarget(sol)}
                          style={{ padding: '4px 14px', border: '1px solid #283593', borderRadius: 6, background: '#EEF2FF', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#283593' }}>
                          Resolver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 10 && (
          <PaginationBar page={page} totalPages={totalPages} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
        )}
      </div>
    </div>
  )
}

const STORAGE_KEY_LOG = 'ventas_log_entries'
const STORAGE_KEY_CODIGOS = 'ventas_codigos_usados'

function cargarStorage(key, def) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : def
  } catch { return def }
}
function guardarStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

const codigosUsadosEnSesion = new Set(cargarStorage(STORAGE_KEY_CODIGOS, []))
let _logEntries = cargarStorage(STORAGE_KEY_LOG, [])
let _resultado  = null

const LOG_PER_PAGE = 10

function TabValidacion() {
  const [codigoInput, setCodigoInput]   = useState('')
  const [resultado,   setResultado]     = useState(_resultado)
  const [loading,     setLoading]       = useState(false)
  const [error,       setError]         = useState(null)
  const [logEntries,  setLogEntries]    = useState(_logEntries)
  const [logPage,     setLogPage]       = useState(1)

  const setLogEntriesPersist = (v) => {
    _logEntries = typeof v === 'function' ? v(_logEntries) : v
    guardarStorage(STORAGE_KEY_LOG, _logEntries)
    setLogEntries(_logEntries)
  }

  const setResultadoPersist = (v) => {
    _resultado = typeof v === 'function' ? v(_resultado) : v
    setResultado(_resultado)
  }

  const handleValidar = async () => {
    const raw = codigoInput.trim()
    if (!raw) { setError('Ingresa un código QR o escanea uno.'); return }
    setError(null)

    let codigo = raw
    try {
      const parsed = JSON.parse(raw)
      const token = parsed?.boletos?.[0]?.codigo_qr_token || parsed?.codigo_qr_token
      if (token) {
        codigo = token
      } else {
        setError('El JSON no contiene un campo codigo_qr_token válido.')
        return
      }
    } catch {
      const esUUID = /^[0-9a-f]{32}$/i.test(raw)
      const esQR   = /^[A-Z0-9_-]{8,64}$/i.test(raw)
      if (!esUUID && !esQR) {
        setError('Formato inválido. Debe ser un código QR (32 caracteres hex) o un JSON válido.')
        return
      }
    }

    if (codigosUsadosEnSesion.has(codigo)) {
      const entradaYaUsada = {
        ticket_id: codigo,
        hora:      new Date().toLocaleTimeString('es-PE'),
        cliente:   '—',
        asiento:   '—',
        resultado: 'Ya Usada',
      }
      setResultadoPersist({ valido: false, estado: 'Esta entrada ya fue usada anteriormente en esta sesión.' })
      setLogEntriesPersist(prev => [entradaYaUsada, ...prev].slice(0, 200))
      setLogPage(1)
      return
    }

    setLoading(true); setError(null); setResultadoPersist(null)
    try {
      const payload = { codigo_qr_token: codigo }
      const res = await apiFetch(`${VENTAS_BASE}/validate`, { method: 'POST', body: JSON.stringify(payload) })

      if (res.valido) {
        codigosUsadosEnSesion.add(codigo)
        guardarStorage(STORAGE_KEY_CODIGOS, [...codigosUsadosEnSesion])
      }

      setResultadoPersist(res)
      setLogEntriesPersist(prev => [{
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
            placeholder="Escanear código QR de la entrada"
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

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px 12px' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: 0 }}>Log de validaciones</h3>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '3px 0 0' }}>
            Últimas entradas registradas (persiste al recargar)
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

const TABS = [
  'Historial de Transacciones',
  'Detalle de Compra',
  'Devoluciones y Reembolsos',
  'Validación de Entradas',
]

export default function VentasYTickets() {
  const [tabActiva,             setTabActiva]             = useState(0)
  const [selectedTransactionId, setSelectedTransactionId] = useState(null)
  const [computedTotals,        setComputedTotals]        = useState({})

  const handleSelectTransaction = (id) => {
    setSelectedTransactionId(id)
    setTabActiva(1)
  }

  const handleUpdateTotal = (id, total) => {
    setComputedTotals(prev => ({ ...prev, [id]: total }))
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

      {tabActiva === 0 && <TabHistorial onSelectTransaction={handleSelectTransaction} computedTotals={computedTotals} />}
      {tabActiva === 1 && <TabDetalle reservationId={selectedTransactionId} onBack={() => setTabActiva(0)} onUpdateTotal={handleUpdateTotal} />}
      {tabActiva === 2 && <TabDevoluciones />}
      {tabActiva === 3 && <TabValidacion />}
    </div>
  )
}
