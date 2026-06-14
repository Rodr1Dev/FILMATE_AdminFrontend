import React, { useState, useEffect, useCallback } from "react"
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
const TRANSACTIONS_BASE = '/api/admin/transactions'
const REEMBOLSOS_BASE   = '/api/admin/reembolsos'
const ROOMS_BASE        = '/api/admin/rooms'

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

const PERIOD_MAP = {
  'Hoy':               { days: 0 },
  'Últimos 7 días':    { days: 7 },
  'Este mes':          { days: 30 },
  'Mes anterior':      { days: -1 },
}

export default function DashboardPrincipal({ onNavigate, onViewTransaction }) {
  const [period, setPeriod] = useState("Este mes")
  const [periodOpen, setPeriodOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [salaFilter, setSalaFilter] = useState("")

  const [dashData, setDashData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [ventasMes, setVentasMes] = useState(0)
  const [pendientes, setPendientes] = useState(0)
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [dash, txData, reembData, roomsData] = await Promise.all([
        apiFetch(`${DASHBOARD_BASE}/`),
        apiFetch(`${TRANSACTIONS_BASE}/?page=1&limit=50`),
        apiFetch(`${REEMBOLSOS_BASE}/metricas`).catch(() => ({ pendientes: 0 })),
        apiFetch(`${ROOMS_BASE}/`).catch(() => []),
      ])
      setDashData(dash)
      setTransactions(txData.data ?? [])
      setVentasMes(txData.metricas?.ventasMes ?? 0)
      setPendientes(reembData.pendientes ?? 0)
      setSalas(Array.isArray(roomsData) ? roomsData : [])
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function clearFilters() {
    setSearch('')
    setEstadoFilter('')
    setSalaFilter('')
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  function isInPeriod(txDate) {
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

  const periodTx = transactions.filter(tx => isInPeriod(tx.fecha_transaccion ? new Date(tx.fecha_transaccion) : null))

  const ventasTotales = ventasMes

  const ingresosTotales = periodTx
    .reduce((sum, tx) => sum + (tx.monto_total ?? 0), 0)

  const topMovie = (() => {
    const counts = {}
    periodTx.forEach(tx => {
      if (tx.pelicula) counts[tx.pelicula] = (counts[tx.pelicula] ?? 0) + (tx.monto_total ?? 0)
    })
    let best = null
    for (const [titulo, total] of Object.entries(counts)) {
      if (!best || total > best.total) best = { titulo, total }
    }
    return best
  })()

  const chartData = (dashData?.ventasPorDia ?? []).map(d => ({
    day: DAY_NAMES[new Date(d.dia + 'T00:00:00').getDay()],
    value: d.ventas,
  }))

  const salaCategoriaMap = {}
  salas.forEach(s => {
    salaCategoriaMap[s.nombre_sala?.toLowerCase().trim()] = s.tipo_sala
    salaCategoriaMap[`sala ${s.id_sala}`] = s.tipo_sala
  })

  const getCategoria = tx => {
    const name = (tx.sala || tx.sala_nombre || '').toLowerCase().trim()
    return salaCategoriaMap[name] || 'General'
  }

  const categoryData = periodTx.reduce((acc, tx) => {
    const cat = getCategoria(tx)
    const existing = acc.find(d => d.category === cat)
    if (existing) existing.value += tx.monto_total ?? 0
    else acc.push({ category: cat, value: tx.monto_total ?? 0 })
    return acc
  }, [])

  if (typeof window !== 'undefined') {
    window.__debugDash = { categoryData, chartData, periodTx, ventasTotales, ingresosTotales, topMovie }
  }

  const cmp = dashData?.comparacion ?? {}

  const filteredTx = transactions
    .filter(tx => {
      const txDate = tx.fecha_transaccion ? new Date(tx.fecha_transaccion) : null
      if (!isInPeriod(txDate)) return false
      if (estadoFilter && tx.estado_pago !== estadoFilter) return false
      if (salaFilter && !(tx.sala ?? '').toLowerCase().includes(salaFilter.toLowerCase())) return false
      if (search) {
        const q = search.toLowerCase()
        const idMatch       = `txn-${tx.id_transaccion}`.includes(q)
        const fecha         = tx.fecha_transaccion ? new Date(tx.fecha_transaccion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
        const fechaMatch    = fecha.toLowerCase().includes(q)
        const clienteMatch  = (tx.cliente ?? '').toLowerCase().includes(q)
        const peliculaMatch = (tx.pelicula ?? '').toLowerCase().includes(q)
        const salaMatch     = (tx.sala ?? '').toLowerCase().includes(q)
        const montoMatch    = formatCurrency(tx.monto_total).toLowerCase().includes(q)
        const estadoMatch   = (tx.estado_pago ?? '').toLowerCase().includes(q)
        if (!(idMatch || fechaMatch || clienteMatch || peliculaMatch || salaMatch || montoMatch || estadoMatch)) return false
      }
      return true
    })
    .sort((a, b) => new Date(b.fecha_transaccion) - new Date(a.fecha_transaccion))
    .slice(0, 10)

  return (
    <div style={{ padding: '28px 28px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>
            Resumen de Operaciones - Filmate Chain
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>{dateStr}</p>
        </div>
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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: '#94A3B8', fontSize: 14 }}>
          Cargando dashboard...
        </div>
      ) : (
        <>
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
              value={`${Math.round(dashData?.ocupacionPromedio ?? 0)}%`}
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
              trend={cmp.nuevosUsuarios?.cambioPorcentual > 0 ? 'up' : cmp.nuevosUsuarios?.cambioPorcentual < 0 ? 'down' : 'neutral'}
              label="Nuevos Usuarios Registrados"
              value={formatNumber(dashData?.nuevosUsuarios)}
            />
            <SummaryCard
              icon={FileText} iconBg="#F1F5F9" iconColor="#64748B"
              badge={pendientes > 0 ? `-${pendientes}` : '0'} trend={pendientes > 0 ? 'down' : 'neutral'}
              label="Reportes Pendientes"
              value={String(pendientes)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ borderRadius: 16, border: '1px solid #F1F5F9', background: '#fff', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Ventas Semanales</h2>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: '2px 0 0' }}>Tickets vendidos por día</p>
                </div>
              </div>
              {chartData.length === 0 ? (
                <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 14 }}>Sin datos</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94A3B8" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: "#4F46E5" }} />
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
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Buscar</label>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar en todas las columnas..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 10px 8px 32px', fontSize: 13, color: '#475569', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Estado</label>
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} style={{ width: '100%', borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 10px', fontSize: 13, color: '#475569', outline: 'none', background: '#fff' }}>
                <option value="">Todos los estados</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Fallido">Fallido</option>
                <option value="Reembolsada">Reembolsada</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>Sala</label>
              <select value={salaFilter} onChange={e => setSalaFilter(e.target.value)} style={{ width: '100%', borderRadius: 8, border: '1px solid #E2E8F0', padding: '8px 10px', fontSize: 13, color: '#475569', outline: 'none', background: '#fff' }}>
                <option value="">Todas las salas</option>
                {salas.map(s => (
                  <option key={s.id_sala} value={s.nombre_sala}>{s.nombre_sala}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>&nbsp;</label>
              <button onClick={clearFilters} style={{ borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', padding: '8px 16px', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
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
        </>
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, iconBg, iconColor, badge, trend, label, value }) {
  const trendStyle = trend === 'up'
    ? { background: '#ECFDF5', color: '#059669', icon: <ArrowUpRight style={{ width: 12, height: 12 }} /> }
    : trend === 'down'
    ? { background: '#FEF2F2', color: '#DC2626', icon: <ArrowDownRight style={{ width: 12, height: 12 }} /> }
    : { background: '#F1F5F9', color: '#64748B', icon: <Minus style={{ width: 12, height: 12 }} /> }

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
    </div>
  )
}
