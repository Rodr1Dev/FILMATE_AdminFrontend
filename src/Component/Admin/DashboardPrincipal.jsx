import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import PropTypes from "prop-types"
import { useAuth } from '../../context/useAuth.js'
import {
  Film,
  Ticket,
  DollarSign,
  TrendingUp,
  UserPlus,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  ChevronDown,
  RefreshCw,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"

const DASHBOARD_BASE    = '/api/admin/dashboard'
const REEMBOLSOS_BASE   = '/api/admin/reembolsos'

async function apiFetch(url, opts = {}) {
  const token = localStorage.getItem('filmate_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, {
    headers,
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

function ensureArray(data) {
  return Array.isArray(data) ? data : []
}

function buildCineMap(cinemas) {
  const cmap = {}
  cinemas.forEach(c => { cmap[c.id_cine] = c.nombre_cine })
  return cmap
}

function calcTopMovie(paidTx) {
  const counts = {}
  paidTx.forEach(tx => {
    if (tx.pelicula) counts[tx.pelicula] = (counts[tx.pelicula] ?? 0) + (tx.monto_total ?? 0)
  })
  let best = null
  for (const [titulo, total] of Object.entries(counts)) {
    if (!best || total > best.total) best = { titulo, total }
  }
  return best
}

function calcChartData(dashData, period) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const daysOpt = PERIOD_MAP[period]?.days
  const cutoffDays = daysOpt === -1 ? 60 : (daysOpt ?? 30)
  const cutoffDate = new Date(now)
  cutoffDate.setDate(cutoffDate.getDate() - cutoffDays)
  const cutoff = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth()+1).padStart(2,'0')}-${String(cutoffDate.getDate()).padStart(2,'0')}`
  return (dashData?.ventasPorDia ?? [])
    .filter(d => d.dia >= cutoff && d.dia <= today)
    .map(d => {
      const dt = new Date(d.dia + (d.dia.includes('T') ? '' : 'T00:00:00'))
      return {
        label: Number.isNaN(dt.getTime()) ? d.dia : DAY_NAMES[dt.getDay()],
        value: d.ventas,
      }
    })
}

function buildSalaCategoriaMap(salas) {
  const map = {}
  salas.forEach(s => {
    map[s.nombre_sala?.toLowerCase().trim()] = s.tipo_sala
    map[`sala ${s.id_sala}`] = s.tipo_sala
  })
  return map
}

function getCategoria(tx, salaCategoriaMap) {
  const name = (tx.sala || tx.sala_nombre || '').toLowerCase().trim()
  return salaCategoriaMap[name] || 'General'
}

function calcCategoryData(dashData, paidTx, salaCategoriaMap) {
  if ((dashData?.ingresosPorCategoria ?? []).length > 0) {
    return dashData.ingresosPorCategoria.map(c => ({ category: c.tipo_sala, value: c.total }))
  }
  return paidTx.reduce((acc, tx) => {
    const cat = getCategoria(tx, salaCategoriaMap)
    const existing = acc.find(d => d.category === cat)
    if (existing) existing.value += tx.monto_total ?? 0
    else acc.push({ category: cat, value: tx.monto_total ?? 0 })
    return acc
  }, [])
}

function filterTransactions(transactions, period, estadoFilter, salaFilter, search) {
  return transactions
    .filter(tx => {
      const txDate = tx.fecha_transaccion ? new Date(tx.fecha_transaccion) : null
      if (!isTxInPeriod(txDate, period)) return false
      if (estadoFilter && tx.estado_pago !== estadoFilter) return false
      if (salaFilter && !(tx.sala ?? '').toLowerCase().includes(salaFilter.toLowerCase())) return false
      if (!txMatchesSearch(tx, search)) return false
      return true
    })
    .sort((a, b) => new Date(b.fecha_transaccion) - new Date(a.fecha_transaccion))
    .slice(0, 10)
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const periodOptions = ["Hoy", "Últimos 7 días", "Este mes", "Mes anterior"]

function formatCurrency(value) {
  if (value == null) return 'S/. 0'
  return `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNumber(value) {
  if (value == null) return '0'
  return Number(value).toLocaleString('es-PE')
}

function formatBadge(value) {
  if (value == null || value === 0) return '0%'
  const sign = value > 0 ? '+' : ''
  return `${sign}${Number(value).toFixed(1)}%`
}

function formatOccupancy(value) {
  if (value == null) return '0%'
  const num = Number(value)
  if (num < 1) return `${num.toFixed(2)}%`
  return `${Math.round(num)}%`
}

function trendFromChange(value) {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'neutral'
}

function isTxInPeriod(txDate, period) {
  if (!txDate) return true
  const p = PERIOD_MAP[period]
  if (!p) return true
  const now = new Date()
  if (p.days === 0) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const txDay = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate())
    return txDay.getTime() === today.getTime()
  }
  if (p.days > 0) {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - p.days)
    return txDate >= cutoff
  }
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  return txDate >= start && txDate <= end
}

function txMatchesSearch(tx, query) {
  if (!query) return true
  const q = query.toLowerCase()
  if (`txn-${tx.id_transaccion}`.includes(q)) return true
  const fecha = tx.fecha_transaccion ? new Date(tx.fecha_transaccion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  if (fecha.toLowerCase().includes(q)) return true
  if ((tx.cliente ?? '').toLowerCase().includes(q)) return true
  if ((tx.pelicula ?? '').toLowerCase().includes(q)) return true
  if ((tx.sala ?? '').toLowerCase().includes(q)) return true
  if (formatCurrency(tx.monto_total).toLowerCase().includes(q)) return true
  if ((tx.estado_pago ?? '').toLowerCase().includes(q)) return true
  return false
}

const PERIOD_MAP = {
  'Hoy':               { days: 0, api: 'hoy' },
  'Últimos 7 días':    { days: 7, api: 'semana' },
  'Este mes':          { days: 30, api: 'mes' },
  'Mes anterior':      { days: -1, api: 'mes_anterior' },
}

const DASHBOARD_CSS = `
@keyframes spin { to { transform: rotate(360deg); } }
`

DashboardPrincipal.propTypes = {
  onNavigate: PropTypes.func,
  onViewTransaction: PropTypes.func,
}

export default function DashboardPrincipal({ onNavigate, onViewTransaction }) {
  const { permisos: userPermisos } = useAuth()
  const [period, setPeriod] = useState("Este mes")
  const [periodOpen, setPeriodOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [salaFilter, setSalaFilter] = useState("")

  const [dashData, setDashData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [ventasMes, setVentasMes] = useState(0)
  const [pendientes, setPendientes] = useState(0)
  const [reportesGen, setReportesGen] = useState({ count: 0, ultima_generacion: null })

  useEffect(() => {
    const token = localStorage.getItem('filmate_token')
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
    const periodo = PERIOD_MAP[period]?.api ?? 'mes'
    fetch(`/api/admin/reports/generados?periodo=${periodo}`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setReportesGen(d) })
      .catch(() => {})
  }, [period])
  const [salas, setSalas] = useState([])
  const [cineMap, setCineMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef(null)

  const fetchData = useCallback(async (isAutoRefresh = false) => {
    setRefreshing(isAutoRefresh)
    setLoading(!isAutoRefresh)
    try {
      const puedeReembolsos = userPermisos.includes('GESTIONAR_REEMBOLSOS')
      const periodoApi = PERIOD_MAP[period]?.api ?? 'mes'
      const reembPromise = puedeReembolsos
        ? apiFetch(`${REEMBOLSOS_BASE}/metricas`)
        : Promise.resolve({ pendientes: 0 })
      const [dash, reembData] = await Promise.all([
        apiFetch(`${DASHBOARD_BASE}/?periodo=${periodoApi}`),
        reembPromise,
      ])
      setDashData(dash)
      setTransactions(dash.ultimasTransacciones ?? [])
      const totalVentas = dash.ventasMes ?? dash.comparacion?.ventas?.actual ?? 0
      setVentasMes(totalVentas)
      setPendientes(reembData.pendientes ?? 0)
      const rooms = ensureArray(dash.salas)
      setSalas(rooms)
      setCineMap(buildCineMap(rooms.map((room) => ({
        id_cine: room.id_cine,
        nombre_cine: room.nombre_cine,
      }))))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period, userPermisos])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(intervalRef.current)
  }, [fetchData])

  function clearFilters() {
    setSearch('')
    setEstadoFilter('')
    setSalaFilter('')
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const periodTx = useMemo(
    () => transactions.filter(tx => isTxInPeriod(tx.fecha_transaccion ? new Date(tx.fecha_transaccion) : null, period)),
    [period, transactions]
  )

  const paidTx = useMemo(
    () => periodTx.filter(tx => tx.estado_pago === 'Aprobado'),
    [periodTx]
  )

  const ventasTotales = ventasMes

  const ingresosTotales = dashData?.comparacion?.ingresos?.actual
    ?? paidTx.reduce((sum, tx) => sum + (tx.monto_total ?? 0), 0)

  const topMovie = useMemo(
    () => dashData?.peliculaMasTaquillera ?? calcTopMovie(paidTx),
    [dashData?.peliculaMasTaquillera, paidTx]
  )

  const chartData = useMemo(
    () => calcChartData(dashData, period),
    [dashData, period]
  )

  const salaCategoriaMap = useMemo(
    () => buildSalaCategoriaMap(salas),
    [salas]
  )

  const categoryData = useMemo(
    () => calcCategoryData(dashData, paidTx, salaCategoriaMap),
    [dashData, paidTx, salaCategoriaMap]
  )

  useEffect(() => {
    globalThis.__debugDash = { categoryData, chartData, periodTx, transactions, ventasTotales, ingresosTotales, topMovie }
  }, [categoryData, chartData, periodTx, transactions, ventasTotales, ingresosTotales, topMovie])

  const cmp = dashData?.comparacion ?? {}

  const filteredTx = useMemo(
    () => filterTransactions(transactions, period, estadoFilter, salaFilter, search),
    [estadoFilter, period, salaFilter, search, transactions]
  )

  if (loading) {
    return (<><style>{DASHBOARD_CSS}</style><div style={{ padding: '28px 28px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#94A3B8', fontSize: 14 }}>Cargando dashboard...</div></div></>)
  }

  return (
    <DashboardContent
      dateStr={dateStr}
      refreshing={refreshing}
      fetchData={fetchData}
      period={period}
      setPeriod={setPeriod}
      periodOpen={periodOpen}
      setPeriodOpen={setPeriodOpen}
      dashData={dashData}
      chartData={chartData}
      categoryData={categoryData}
      topMovie={topMovie}
      cmp={cmp}
      pendientes={pendientes}
      reportesGen={reportesGen}
      ventasTotales={ventasTotales}
      ingresosTotales={ingresosTotales}
      search={search}
      setSearch={setSearch}
      estadoFilter={estadoFilter}
      setEstadoFilter={setEstadoFilter}
      salaFilter={salaFilter}
      setSalaFilter={setSalaFilter}
      salas={salas}
      cineMap={cineMap}
      filteredTx={filteredTx}
      clearFilters={clearFilters}
      onViewTransaction={onViewTransaction}
    />
  )
}

DashboardContent.propTypes = {
  dateStr: PropTypes.string,
  refreshing: PropTypes.bool,
  fetchData: PropTypes.func,
  period: PropTypes.string,
  setPeriod: PropTypes.func,
  periodOpen: PropTypes.bool,
  setPeriodOpen: PropTypes.func,
  dashData: PropTypes.shape({
    ocupacionPromedio: PropTypes.number,
    ventasPorDia: PropTypes.array,
    ingresosPorCategoria: PropTypes.array,
    nuevosUsuarios: PropTypes.number,
    comparacion: PropTypes.object,
  }),
  chartData: PropTypes.arrayOf(PropTypes.object),
  categoryData: PropTypes.arrayOf(PropTypes.object),
  topMovie: PropTypes.shape({
    titulo: PropTypes.string,
    total: PropTypes.number,
  }),
  cmp: PropTypes.shape({
    nuevosUsuarios: PropTypes.shape({
      cambioPorcentual: PropTypes.number,
    }),
  }),
  reportesGen: PropTypes.shape({
    count: PropTypes.number,
    ultima_generacion: PropTypes.string,
  }),
  ventasTotales: PropTypes.number,
  ingresosTotales: PropTypes.number,
  search: PropTypes.string,
  setSearch: PropTypes.func,
  estadoFilter: PropTypes.string,
  setEstadoFilter: PropTypes.func,
  salaFilter: PropTypes.string,
  setSalaFilter: PropTypes.func,
  salas: PropTypes.arrayOf(PropTypes.object),
  cineMap: PropTypes.objectOf(PropTypes.string),
  filteredTx: PropTypes.arrayOf(PropTypes.object),
  clearFilters: PropTypes.func,
  onViewTransaction: PropTypes.func,
}

function DashboardContent(props) {
  const {
    dateStr, refreshing, fetchData,
    period, setPeriod, periodOpen, setPeriodOpen,
    dashData, chartData, categoryData, topMovie, cmp, reportesGen,
    ventasTotales, ingresosTotales,
    search, setSearch, estadoFilter, setEstadoFilter, salaFilter, setSalaFilter,
    salas, cineMap, filteredTx, clearFilters, onViewTransaction,
  } = props

  return (
    <>
      <style>{DASHBOARD_CSS}</style>
      <div style={{ padding: '28px 28px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>
              Resumen de Operaciones - Filmate Chain
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>{dateStr}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer', opacity: refreshing ? 0.6 : 1 }}
              title="Actualizar datos"
            >
              <RefreshCw style={{ width: 14, height: 14, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              {refreshing ? 'Actualizando…' : 'Actualizar'}
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setPeriodOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}
              >
                {period}
                <ChevronDown style={{ width: 16, height: 16, color: '#94A3B8' }} />
              </button>
              {periodOpen && (
                <div style={{ position: 'absolute', right: 0, zIndex: 10, marginTop: 6, width: 180, borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', padding: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                  {periodOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => { setPeriod(option); setPeriodOpen(false) }}
                      style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: 13, color: '#475569', background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          <SummaryCard
            icon={Ticket} iconBg="#F5F3FF" iconColor="#8B5CF6"
            badge="—" trend="neutral"
            label="Ventas de Boletos Totales"
            value={formatNumber(ventasTotales)}
          />
          <SummaryCard
            icon={DollarSign} iconBg="#ECFDF5" iconColor="#10B981"
            badge="—" trend="neutral"
            label="Ingresos Totales"
            value={formatCurrency(ingresosTotales)}
          />
          <SummaryCard
            icon={TrendingUp} iconBg="#F0F9FF" iconColor="#0EA5E9"
            badge={formatBadge(dashData?.ocupacionPromedio)} trend="neutral"
            label="Ocupación Promedio de Asientos"
            value={formatOccupancy(dashData?.ocupacionPromedio)}
          />
          <SummaryCard
            icon={Film} iconBg="#FFFBEB" iconColor="#F59E0B"
            badge="—" trend="neutral"
            label="Película Más Taquillera"
            value={topMovie ? `'${topMovie.titulo}'` : '-'}
          />
          <SummaryCard
            icon={UserPlus} iconBg="#ECFEFF" iconColor="#06B6D4"
            badge={formatBadge(cmp.nuevosUsuarios?.cambioPorcentual)}
            trend={trendFromChange(cmp.nuevosUsuarios?.cambioPorcentual)}
            label="Nuevos Usuarios Registrados"
            value={formatNumber(dashData?.nuevosUsuarios)}
          />
          <SummaryCard
            icon={FileText} iconBg="#F1F5F9" iconColor="#64748B"
            badge={reportesGen?.count > 0 ? String(reportesGen.count) : '0'} trend={reportesGen?.count > 0 ? 'up' : 'neutral'}
            label="Reportes Generados"
            value={String(reportesGen?.count ?? 0)}
            sub={reportesGen?.ultima_generacion ? new Date(reportesGen.ultima_generacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ borderRadius: 16, border: '1px solid #F1F5F9', background: '#fff', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>
                  {({ "Hoy": "Ventas del Día", "Últimos 7 días": "Ventas Semanales", "Este mes": "Ventas Mensuales", "Mes anterior": "Ventas del Mes Anterior" }[period] || "Ventas")}
                </h2>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '2px 0 0' }}>
                  {({ "Hoy": "Tickets vendidos hoy", "Últimos 7 días": "Tickets vendidos por día (última semana)", "Este mes": "Tickets vendidos por día (este mes)", "Mes anterior": "Tickets vendidos por día (mes anterior)" }[period] || "")}
                </p>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 14 }}>Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" vertical={true} horizontal={true} />
                  <XAxis dataKey="label" axisLine={{ stroke: '#D1D5DC' }} tickLine={{ stroke: '#D1D5DC' }} tick={{ fontSize: 12, fill: "#9CA3AF" }} interval={0} />
                  <YAxis axisLine={{ stroke: '#D1D5DC' }} tickLine={{ stroke: '#D1D5DC' }} tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#253285" strokeWidth={3} dot={{ r: 5, fill: "#253285", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ borderRadius: 16, border: '1px solid #F1F5F9', background: '#fff', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Ingresos por Categoría</h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '2px 0 16px' }}>Distribución mensual</p>
            {categoryData.length === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 14 }}>Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryData}>
                  <CartesianGrid stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F5A93E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 16, borderRadius: 16, border: '1px solid #F1F5F9', background: '#fff', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', alignItems: 'end' }}>
          <div>
            <label htmlFor="dashboard-search" style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Buscar</label>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8' }} />
              <input
                id="dashboard-search"
                type="text"
                placeholder="Buscar en todas las columnas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 10px 8px 32px', fontSize: 13, color: '#475569', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="dashboard-estado" style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Estado</label>
            <select id="dashboard-estado" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} style={{ width: '100%', borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 10px', fontSize: 13, color: '#475569', outline: 'none', background: '#fff' }}>
              <option value="">Todos los estados</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Fallido">Fallido</option>
              <option value="Reembolsada">Reembolsada</option>
            </select>
          </div>
          <div>
            <label htmlFor="dashboard-sala" style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Sala</label>
            <select id="dashboard-sala" value={salaFilter} onChange={e => setSalaFilter(e.target.value)} style={{ width: '100%', borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 10px', fontSize: 13, color: '#475569', outline: 'none', background: '#fff' }}>
              <option value="">Todas las salas</option>
              {salas.map(s => (
                <option key={s.id_sala} value={s.nombre_sala}>{s.nombre_sala} — {cineMap[s.id_cine] || '?'}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dashboard-clear" style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Acciones</label>
            <button id="dashboard-clear" onClick={clearFilters} style={{ borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Limpiar filtros
            </button>
          </div>
        </div>

        <div style={{ borderRadius: 16, border: '1px solid #F1F5F9', background: '#fff', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Últimas Transacciones</h2>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '2px 0 16px' }}>Historial reciente de compras</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 750, textAlign: 'left', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {['ID Compra', 'Fecha', 'Cliente', 'Película', 'Sala', 'Monto', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px 10px 0', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '32px 0', textAlign: 'center', color: '#94A3B8' }}>
                      No hay transacciones recientes
                    </td>
                  </tr>
                ) : filteredTx.map((tx, i) => (
                  <tr key={tx.id_transaccion ?? i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                    <td style={{ padding: '10px 12px 10px 0', fontWeight: 600, color: '#4F46E5' }}>
                      TXN-{tx.id_transaccion}
                    </td>
                    <td style={{ padding: '10px 12px 10px 0', color: '#64748B' }}>
                      {tx.fecha_transaccion ? new Date(tx.fecha_transaccion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '10px 12px 10px 0', color: '#334155' }}>{tx.cliente ?? '-'}</td>
                    <td style={{ padding: '10px 12px 10px 0', color: '#334155' }}>{tx.pelicula ?? '-'}</td>
                    <td style={{ padding: '10px 12px 10px 0', color: '#64748B' }}>{tx.sala || tx.sala_nombre || '-'}</td>
                    <td style={{ padding: '10px 12px 10px 0', fontWeight: 500, color: '#334155' }}>
                      {formatCurrency(tx.monto_total)}
                    </td>
                    <td style={{ padding: '10px 12px 10px 0' }}>
                      <span style={{
                        display: 'inline-block',
                        borderRadius: 20,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        ...(tx.estado_pago === 'Completada' || tx.estado_pago === 'Aprobado' ? { background: '#ECFDF5', color: '#059669' } : {}),
                        ...(tx.estado_pago === 'Pendiente' ? { background: '#FFFBEB', color: '#D97706' } : {}),
                        ...(tx.estado_pago === 'Reembolsada' || tx.estado_pago === 'Reembolsado' ? { background: '#FEF2F2', color: '#DC2626' } : {}),
                      }}>
                        {tx.estado_pago ?? '-'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                      <button onClick={() => onViewTransaction?.(tx.id_transaccion)} style={{ borderRadius: 8, border: '1px solid #EEF2FF', background: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#4F46E5', cursor: 'pointer' }}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function trendStyleConfig(trend) {
  if (trend === 'up') return { background: '#ECFDF5', color: '#059669', icon: <ArrowUpRight style={{ width: 12, height: 12 }} /> }
  if (trend === 'down') return { background: '#FEF2F2', color: '#DC2626', icon: <ArrowDownRight style={{ width: 12, height: 12 }} /> }
  return { background: '#F1F5F9', color: '#64748B', icon: <Minus style={{ width: 12, height: 12 }} /> }
}

SummaryCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  iconBg: PropTypes.string,
  iconColor: PropTypes.string,
  badge: PropTypes.string,
  trend: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  sub: PropTypes.string,
}

function SummaryCard({ icon: Icon, iconBg, iconColor, badge, trend, label, value, sub }) {
  const trendStyle = trendStyleConfig(trend)

  return (
    <div style={{ borderRadius: 16, border: '1px solid #F1F5F9', background: '#fff', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: iconBg }}>
          <Icon style={{ width: 20, height: 20, color: iconColor }} />
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 2, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
          background: trendStyle.background, color: trendStyle.color,
        }}>
          {trendStyle.icon}
          {badge}
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: '4px 0 0' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0' }}>{sub}</p>}
    </div>
  )
}
