import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown, FileText, Download, ChevronLeft, ChevronRight, Ticket } from 'lucide-react'

const REPORTES_BASE = '/api/admin/reports'

function headerAlign(h) {
  if (h === 'Estado') return 'center'
  if (h === 'ID' || h.includes('Ingreso')) return 'right'
  return 'left'
}

const REPORT_TYPES = [
  'Rendimiento de Taquilla',
  'Ocupación por Salas',
  'Ventas por Horario',
  'Análisis de Películas',
]

const DATE_RANGES = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Últimos 7 días', value: 'semana' },
  { label: 'Este mes', value: 'mes' },
  { label: 'Este año', value: 'anio' },
]

const PAGE_SIZE = 10



async function apiFetch(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('filmate_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers, ...opts })
  if (res.status === 401) {
    localStorage.removeItem('filmate_token')
    localStorage.removeItem('filmate_user')
    globalThis.location.href = '/login'
    return { data: [], resumen: {} }
  }
  if (!res.ok) {
    return { data: [], resumen: {} }
  }
  return res.json()
}

function formatCurrency(n) {
  return 'S/. ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2 })
}

function formatPercent(n) {
  return n.toFixed(1) + '%'
}

function StatusBadge({ estado }) {
  const e = (estado || '').toUpperCase()
  let bg = '#FEF3C7', color = '#B45309'
  if (e === 'ACTIVO') { bg = '#DCFCE7'; color = '#15803D' }
  else if (e === 'EN CARTELERA') { bg = '#DBEAFE'; color = '#1D4ED8' }
  else if (e === 'PRÓXIMAMENTE') { bg = '#F3F4F6'; color = '#6B7280' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color: color,
      }}
    >
      {estado}
    </span>
  )
}

StatusBadge.propTypes = {
  estado: PropTypes.string,
}

function OcupacionBar({ pct }) {
  let color
  if (pct >= 80) color = '#15803D'
  else if (pct >= 60) color = '#B45309'
  else color = '#DC2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          background: '#E5E7EB',
          borderRadius: 4,
          overflow: 'hidden',
          maxWidth: 120,
        }}
      >
        <div
          style={{
            width: pct + '%',
            height: '100%',
            background: color,
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 40, textAlign: 'right' }}>
        {formatPercent(pct)}
      </span>
    </div>
  )
}

OcupacionBar.propTypes = {
  pct: PropTypes.number.isRequired,
}

function Dropdown({ value, onChange, options, labelKey }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          background: '#fff',
          border: '1px solid #D1D5DC',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 13,
          color: '#374151',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {labelKey ? value[labelKey] : value}
        <ChevronDown size={15} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            marginTop: 4,
            width: '100%',
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {options.filter(opt => (labelKey ? opt.label !== value.label : opt !== value)).map(opt => (
            <button
              type="button"
              key={labelKey ? opt.value : opt}
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                fontSize: 13,
                color: '#6B7280',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {labelKey ? opt.label : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

Dropdown.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired,
  labelKey: PropTypes.string,
}

function SummaryCard({ icon, label, value, sub }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: '#EEF2FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4338CA',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#121212' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

SummaryCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  sub: PropTypes.string,
}

function Pagination({ page, totalPages, totalRecords, start, end, onPageChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderTop: '1px solid #E5E7EB',
      }}
    >
      <div style={{ fontSize: 13, color: '#6B7280' }}>
        Mostrando{' '}
        <strong style={{ color: '#374151' }}>{start}</strong> a{' '}
        <strong style={{ color: '#374151' }}>{end}</strong> de{' '}
        <strong style={{ color: '#374151' }}>{totalRecords}</strong> registros
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            color: page === 1 ? '#D1D5DB' : '#6B7280',
            background: 'transparent',
            border: 'none',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <ChevronLeft size={14} />
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            type="button"
            key={p}
            onClick={() => onPageChange(p)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: p === page ? 600 : 400,
              background: p === page ? '#4338CA' : 'transparent',
              color: p === page ? '#fff' : '#6B7280',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 13,
            color: page === totalPages ? '#D1D5DB' : '#6B7280',
            background: 'transparent',
            border: 'none',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Siguiente
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalRecords: PropTypes.number.isRequired,
  start: PropTypes.number.isRequired,
  end: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
}

export default function Reportes() {
  const [reportType, setReportType] = useState(REPORT_TYPES[0])
  const [dateRange, setDateRange] = useState(DATE_RANGES[0])
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [reportData, setReportData] = useState({ data: [], resumen: null })
  const [refreshKey, setRefreshKey] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const [updated, setUpdated] = useState(false)

  const data = reportData.data || []
  const resumen = reportData.resumen || {}
  const totalRecords = data.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))
  const start = (page - 1) * PAGE_SIZE + 1
  const end2 = Math.min(page * PAGE_SIZE, totalRecords)

  const getEndpoint = useCallback(() => {
    switch (reportType) {
      case 'Rendimiento de Taquilla':
        return `${REPORTES_BASE}/taquilla`
      case 'Ocupación por Salas':
        return `${REPORTES_BASE}/ocupacion-salas`
      case 'Ventas por Horario':
        return `${REPORTES_BASE}/ventas-horario`
      case 'Análisis de Películas':
        return `${REPORTES_BASE}/analisis-peliculas`
      default:
        return `${REPORTES_BASE}/taquilla`
    }
  }, [reportType])

  useEffect(() => {
    setPage(1)
  }, [reportType])

  const fetchReport = useCallback(() => {
    setError(null)
    const endpoint = getEndpoint()
    apiFetch(`${endpoint}?periodo=${dateRange.value}`)
      .then(json => {
        setReportData(json)
        setUpdated(true)
        setTimeout(() => setUpdated(false), 2000)
      })
      .catch(() => {})
  }, [getEndpoint, dateRange.value])

  useEffect(() => {
    fetchReport()
  }, [fetchReport, refreshKey])

  const pageData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalIngresos = data.reduce((sum, r) => sum + (r.ingreso || r.ingresos || 0), 0)

  const tipoMap = {
    'Rendimiento de Taquilla': 'taquilla',
    'Ocupación por Salas': 'ocupacion-salas',
    'Ventas por Horario': 'ventas-horario',
    'Análisis de Películas': 'analisis-peliculas',
  }

  function handleExport() {
    setExporting(true)
    const tipo = tipoMap[reportType] || 'taquilla'
    const endpoint = `${REPORTES_BASE}/export/csv?tipo=${tipo}&periodo=${dateRange.value}`
    const token = localStorage.getItem('filmate_token')
    fetch(endpoint, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('filmate_token')
          localStorage.removeItem('filmate_user')
          globalThis.location.href = '/login'
          return null
        }
        if (!res.ok) { setExporting(false); return null }
        return res.blob()
      })
      .then(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_${reportType.toLowerCase().replace(/\s+/g, '_')}_${dateRange.label.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '')}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        setExporting(false)
      })
      .catch(() => setExporting(false))
  }

  function renderTable() {
    switch (reportType) {
      case 'Rendimiento de Taquilla':
        return renderTaquilla(pageData)
      case 'Ocupación por Salas':
        return renderOcupacion(pageData)
      case 'Ventas por Horario':
        return renderVentasHorario(pageData)
      case 'Análisis de Películas':
        return renderAnalisis(pageData)
      default:
        return null
    }
  }

  function renderTaquilla(rows) {
    const headers = ['ID', 'Película', 'Funciones', 'Entradas', 'Total Vendido', 'Estado']
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {headers.map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: headerAlign(h),
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#4338CA', textAlign: 'right' }}>{r.id}</td>
                <td style={{ padding: '10px 16px', color: '#374151' }}>{r.titulo}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{r.funciones ?? 0}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{(r.entradas ?? 0).toLocaleString()}</td>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#121212', textAlign: 'right' }}>{formatCurrency(r.ingreso ?? 0)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  <StatusBadge estado={r.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderOcupacion(rows) {
    const headers = ['Sala', 'Cine', 'Capacidad', 'Vendidos', 'Ocupación']
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {headers.map(h => (
                <th
                  key={h}
                  style={{
                    textAlign: h === 'Ocupación' || h === 'Capacidad' || h === 'Vendidos' ? 'right' : 'left',
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id_sala ?? i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 16px', color: '#374151' }}>{r.sala}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280' }}>{r.cine}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{r.capacidad ?? 0}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{r.vendidos ?? 0}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <OcupacionBar pct={r.porcentaje ?? 0} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderVentasHorario(rows) {
    const headers = ['Horario', 'Transacciones', 'Ingresos', 'Tickets Vendidos']
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {headers.map(h => (
                <th
                  key={h}
                  style={{
                    textAlign: h === 'Transacciones' || h === 'Ingresos' || h === 'Tickets Vendidos' ? 'right' : 'left',
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.horario} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>{r.horario === 'Otro' ? '00:00 - 10:00' : r.horario}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{r.ventas ?? 0}</td>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#121212', textAlign: 'right' }}>{formatCurrency(r.ingresos ?? 0)}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{r.tickets ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function renderAnalisis(rows) {
    const headers = ['Género', 'Películas', 'Funciones', 'Ingresos', '% del Total']
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {headers.map(h => (
                <th
                  key={h}
                  style={{
                    textAlign: h === 'Películas' || h === 'Funciones' || h === 'Ingresos' || h === '% del Total' ? 'right' : 'left',
                    padding: '10px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.genero} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#374151' }}>{r.genero}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{r.peliculas ?? 0}</td>
                <td style={{ padding: '10px 16px', color: '#6B7280', textAlign: 'right' }}>{r.funciones ?? 0}</td>
                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#121212', textAlign: 'right' }}>{formatCurrency(r.ingresos ?? 0)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}>{formatPercent(r.porcentaje ?? 0)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const horarioPicoVal = resumen?.horario_pico || (data.length ? data.reduce((max, r) => r.ventas > max.ventas ? r : max).horario : '—')

  return (
    <div style={{ padding: '24px 28px 40px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#121212', margin: '0 0 6px' }}>
        Generación de Reportes
      </h1>
      <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 20px' }}>
        Compilación de informes detallados de rendimiento de taquilla y confitería
      </p>

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <label htmlFor="report-type" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tipo de Reporte
            </label>
            <Dropdown id="report-type" value={reportType} onChange={setReportType} options={REPORT_TYPES} />
          </div>
          <div style={{ flex: '1 1 180px', minWidth: 160 }}>
            <label htmlFor="date-range" style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rango de Fechas
            </label>
            <Dropdown id="date-range" value={dateRange} onChange={setDateRange} options={DATE_RANGES} labelKey="label" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => { setRefreshKey(k => k + 1); setShowOverlay(true); localStorage.setItem('reportes_generados', JSON.stringify({ count: 1, date: new Date().toISOString() })) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 20px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: '#4338CA',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <FileText size={16} />
              {'Generar Reporte'}
            </button>
            {updated && <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, alignSelf: 'center' }}>✓ Actualizado</span>}
          </div>
        </div>
      </div>

      {showOverlay && (
        <button
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'default', padding: 0,
            width: '100vw', height: '100vh',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowOverlay(false) }}
        >
          <dialog
            open
            style={{
              background: '#fff', borderRadius: 16, padding: '28px 32px',
              width: 420, maxWidth: '90vw', position: 'relative',
              border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}
          >
            <button
              onClick={() => setShowOverlay(false)}
              style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 20, lineHeight: 1 }}
            >
              ✕
            </button>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#121212' }}>
              Reporte Generado
            </h3>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Tipo de Reporte</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#121212', marginBottom: 12 }}>{reportType}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Rango de Fechas</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#121212', marginBottom: 16 }}>{dateRange.label}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Registros</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#121212', marginBottom: 20 }}>{totalRecords} resultados</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleExport()} disabled={exporting}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  color: '#fff', background: exporting ? '#9CA3AF' : '#4338CA',
                  border: 'none', cursor: exporting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                <Download size={16} />
                {exporting ? 'Exportando…' : 'Descargar Reporte'}
              </button>
            </div>
          </dialog>
        </button>
      )}

      {reportType === 'Rendimiento de Taquilla' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <SummaryCard
            icon={<Ticket size={20} />}
            label="Total Funciones"
            value={(resumen?.total_funciones || data.reduce((s, r) => s + r.funciones, 0)).toLocaleString()}
            sub="En todo el período"
          />
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            label="Total Entradas"
            value={(resumen?.total_entradas || data.reduce((s, r) => s + r.entradas, 0)).toLocaleString()}
            sub="Entradas vendidas"
          />
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            label="Ingreso Bruto Total"
            value={formatCurrency(resumen?.ingreso_bruto ?? totalIngresos)}
            sub="En todo el período"
          />
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            label="Ticket Promedio"
            value={formatCurrency(resumen?.ticket_promedio ?? (totalIngresos / Math.max(1, data.reduce((s, r) => s + r.funciones, 0))))}
            sub="Por función"
          />
        </div>
      )}

      {reportType === 'Ocupación por Salas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <SummaryCard
            icon={<Building2Icon />}
            label="Total Salas"
            value={(resumen?.total_salas || data.length).toString()}
          />
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            label="Ocupación Promedio"
            value={formatPercent(resumen?.ocupacion_promedio ?? (data.reduce((s, r) => s + r.porcentaje, 0) / Math.max(1, data.length)))}
          />
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
            label="Capacidad Total"
            value={(resumen?.capacidad_total || data.reduce((s, r) => s + r.capacidad, 0)).toLocaleString()}
          />
        </div>
      )}

      {reportType === 'Ventas por Horario' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Horario Pico"
            value={horarioPicoVal === 'Otro' ? '00:00 - 10:00' : horarioPicoVal}
            sub="Mayor afluencia"
          />
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            label="Ingreso Total por Horarios"
            value={formatCurrency(resumen?.ingreso_total ?? data.reduce((s, r) => s + (r.ingresos || 0), 0))}
          />
          <SummaryCard
            icon={<Ticket size={20} />}
            label="Total Tickets Vendidos"
            value={(resumen?.total_tickets || data.reduce((s, r) => s + (r.tickets || 0), 0)).toLocaleString()}
          />
        </div>
      )}

      {reportType === 'Análisis de Películas' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <SummaryCard
            icon={<FilmIcon />}
            label="Género Principal"
            value={resumen?.genero_principal || (data.length ? data.reduce((max, r) => r.porcentaje > max.porcentaje ? r : max).genero : '—')}
            sub="Mayor recaudación"
          />
          <SummaryCard
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
            label="Ingreso por Géneros"
            value={formatCurrency(resumen?.ingreso_total ?? data.reduce((s, r) => s + (r.ingresos || 0), 0))}
          />
          <SummaryCard
            icon={<FilmIcon />}
            label="Total Películas"
            value={(resumen?.total_peliculas || data.reduce((s, r) => s + (r.peliculas || 0), 0)).toString()}
          />
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: '#C2410C',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
        }}
      >
        {renderTable()}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          start={start}
          end={end2}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}

function Building2Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <line x1="8" y1="6" x2="10" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" />
      <line x1="14" y1="6" x2="16" y2="6" />
      <line x1="14" y1="10" x2="16" y2="10" />
      <line x1="14" y1="14" x2="16" y2="14" />
    </svg>
  )
}

function FilmIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
      <line x1="17" y1="17" x2="22" y2="17" />
    </svg>
  )
}
