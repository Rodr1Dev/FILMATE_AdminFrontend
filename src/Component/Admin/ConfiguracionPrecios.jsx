import React, { useState, useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'

const TABS = [
  { id: 'entradas', label: 'Precios de Entradas' },
  { id: 'confiteria', label: 'Costos de Confitería' },
]

const API = '/api/admin/config'

const TIPOS_SALA = ['Estándar', 'VIP', 'IMAX', '4DX']
const FORMATOS = ['2D', '3D']

const PRECIOS_DEFAULT = {
  'Estándar': { '2D': 8.5, '3D': 11 },
  'VIP': { '2D': 15, '3D': 18 },
  'IMAX': { '2D': 14, '3D': 17 },
  '4DX': { '2D': 18, '3D': 21 },
}

const VALORES_INICIALES = {
  preciosSalaFormato: TIPOS_SALA.flatMap(tipo_sala =>
    FORMATOS.map(formato => ({ tipo_sala, formato, precio: PRECIOS_DEFAULT[tipo_sala]?.[formato] ?? 0 }))
  ),
  combos: [],
}

async function apiFetch(url, opts = {}) {
  const token = localStorage.getItem('filmate_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers, ...opts })
  if (res.status === 204) return null
  if (!res.ok) {
    if (res.status === 401) localStorage.removeItem('filmate_token')
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

function ToastFeedback({ tipo, mensaje, onClose }) {
  useEffect(() => {
    if (!mensaje) return
    const t = setTimeout(onClose, 2500)
    return () => clearTimeout(t)
  }, [mensaje, onClose])

  if (!mensaje) return null

  const esExito = tipo === 'exito'
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 1500,
      display: 'flex', alignItems: 'center', gap: 10,
      background: esExito ? '#F0FDF4' : '#FFF1F2',
      border: `1px solid ${esExito ? '#BBF7D0' : '#FECDD3'}`,
      borderRadius: 12, padding: '14px 20px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      fontSize: 14, fontWeight: 500,
      color: esExito ? '#15803D' : '#BE123C',
      animation: 'toastIn 0.22s cubic-bezier(.21,1.02,.73,1) both',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: esExito ? '#22C55E' : '#F43F5E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>{esExito ? '✓' : '✕'}</span>
      <span>{mensaje}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: esExito ? '#15803D' : '#BE123C', fontSize: 18,
        marginLeft: 8, padding: 0, lineHeight: 1, opacity: 0.6,
      }}>×</button>
    </div>
  )
}
ToastFeedback.propTypes = {
  tipo: PropTypes.string,
  mensaje: PropTypes.string,
  onClose: PropTypes.func,
}

/* ── Design tokens ── */
const T = {
  primary: '#1C2566',
  primaryHover: '#162055',
  primaryLight: '#EEF0FB',
  border: '#E4E7EC',
  borderFocus: '#1C2566',
  bg: '#F7F8FB',
  surface: '#FFFFFF',
  text: '#111928',
  textMid: '#374151',
  textMuted: '#6B7280',
  textPlaceholder: '#9CA3AF',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  success: '#22C55E',
  radius: 12,
  radiusSm: 8,
  shadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowMd: '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)',
}

const styles = `
  *, *::before, *::after { box-sizing: border-box; }

  .cp-page {
    padding: 32px 40px 56px;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  }

  .cp-page-header {
    margin-bottom: 32px;
  }
  .cp-page-title {
    font-size: 24px;
    font-weight: 700;
    color: ${T.text};
    margin: 0 0 4px;
    letter-spacing: -0.3px;
  }
  .cp-page-sub {
    font-size: 14px;
    color: ${T.textMuted};
    margin: 0;
  }

  .cp-tabs {
    display: flex;
    border-bottom: 1.5px solid ${T.border};
    margin-bottom: 28px;
    gap: 4px;
  }
  .cp-tab {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: ${T.textMuted};
    margin-bottom: -1.5px;
    border-radius: 6px 6px 0 0;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    white-space: nowrap;
    font-family: inherit;
  }
  .cp-tab:hover { color: ${T.primary}; background: ${T.primaryLight}; }
  .cp-tab.active {
    color: ${T.primary};
    border-bottom-color: ${T.primary};
    font-weight: 600;
  }

  .cp-card {
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: ${T.radius}px;
    box-shadow: ${T.shadow};
    overflow: hidden;
    margin-bottom: 20px;
  }
  .cp-card-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid ${T.border};
  }
  .cp-card-title {
    font-size: 15px;
    font-weight: 700;
    color: ${T.text};
    margin: 0 0 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .cp-card-title::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 16px;
    background: ${T.primary};
    border-radius: 2px;
  }
  .cp-card-desc {
    font-size: 13px;
    color: ${T.textMuted};
    margin: 0;
    line-height: 1.5;
  }
  .cp-card-body { padding: 32px; }
  .cp-card-footer {
    padding: 16px 24px;
    border-top: 1px solid ${T.border};
    background: #FAFAFA;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
  }

  .cp-two-col {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
    gap: 24px;
    align-items: start;
  }

  .cp-input {
    width: 100%;
    height: 40px;
    border: 1px solid ${T.border};
    border-radius: ${T.radiusSm}px;
    padding: 0 14px;
    font-size: 14px;
    color: ${T.textMid};
    background: #FAFAFA;
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .cp-input:hover { border-color: #B0B8C8; background: #fff; }
  .cp-input:focus { border-color: ${T.primary}; background: #fff; box-shadow: 0 0 0 3px ${T.primaryLight}; }
  .cp-input.error { border-color: ${T.danger}; background: ${T.dangerBg}; }
  .cp-input.error:focus { box-shadow: 0 0 0 3px #FEE2E2; }
  .cp-input-prefix-wrap { position: relative; }
  .cp-input-prefix {
    position: absolute; left: 12px; top: 50%;
    transform: translateY(-50%);
    font-size: 13px; color: ${T.textMuted}; pointer-events: none;
    font-weight: 500;
  }
  .cp-input-prefix-wrap .cp-input { padding-left: 36px; }

  .cp-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: ${T.textMid};
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }

  .cp-field { margin-bottom: 16px; }
  .cp-field:last-child { margin-bottom: 0; }
  .cp-error-msg {
    font-size: 11px;
    color: ${T.danger};
    margin-top: 4px;
    display: block;
  }

  .cp-formato-row {
    display: grid;
    grid-template-columns: 80px 1fr;
    align-items: center;
    gap: 16px;
    padding: 14px 0;
    border-bottom: 1px solid ${T.border};
  }
  .cp-formato-row:first-child { padding-top: 0; }
  .cp-formato-row:last-child { border-bottom: none; padding-bottom: 0; }
  .cp-formato-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    background: ${T.primaryLight};
    color: ${T.primary};
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .cp-tipo-row {
    display: grid;
    grid-template-columns: 1fr 120px 36px;
    align-items: start;
    gap: 10px;
    padding: 12px 14px;
    background: #F9FAFB;
    border: 1px solid ${T.border};
    border-radius: ${T.radiusSm}px;
    margin-bottom: 8px;
    transition: border-color 0.15s;
  }
  .cp-tipo-row:hover { border-color: #B0B8C8; }
  .cp-tipo-pct-wrap { display: flex; align-items: center; gap: 6px; }
  .cp-pct-sym { font-size: 14px; color: ${T.textMuted}; font-weight: 600; flex-shrink: 0; }
  .cp-tipo-row .cp-input { text-align: center; }
  .cp-btn-icon {
    background: none; border: none; cursor: pointer;
    color: #CBD5E1; font-size: 20px; padding: 4px;
    border-radius: 6px; line-height: 1; height: 40px;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s;
  }
  .cp-btn-icon:hover { color: ${T.danger}; background: ${T.dangerBg}; }

  .cp-btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 6px; height: 38px; padding: 0 20px;
    border-radius: ${T.radiusSm}px; font-size: 14px; font-weight: 600;
    cursor: pointer; border: none; font-family: inherit;
    transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
    white-space: nowrap;
  }
  .cp-btn-primary {
    background: ${T.primary}; color: #fff;
    box-shadow: 0 1px 3px rgba(28,37,102,0.25);
  }
  .cp-btn-primary:hover { background: ${T.primaryHover}; box-shadow: 0 3px 10px rgba(28,37,102,0.30); }
  .cp-btn-primary:disabled { opacity: 0.6; cursor: wait; }
  .cp-btn-secondary {
    background: #fff; color: ${T.textMid};
    border: 1px solid ${T.border};
  }
  .cp-btn-secondary:hover { background: #F9FAFB; border-color: #B0B8C8; }

  .cp-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .cp-table thead tr { background: #F9FAFB; border-bottom: 1px solid ${T.border}; }
  .cp-table th {
    padding: 12px 20px; text-align: left;
    font-size: 11px; font-weight: 600;
    color: ${T.textMuted}; text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .cp-table th.right { text-align: right; }
  .cp-table tbody tr { border-bottom: 1px solid #F3F4F6; transition: background 0.1s; }
  .cp-table tbody tr:hover { background: #FAFAFA; }
  .cp-table tbody tr:last-child { border-bottom: none; }
  .cp-table td { padding: 10px 20px; vertical-align: middle; }
  .cp-table td.right { text-align: right; }
  .cp-price-badge {
    font-size: 14px; font-weight: 600; color: ${T.text};
    background: #F3F4F6; padding: 4px 10px; border-radius: 6px;
    display: inline-block;
  }

  .cp-param-row {
    display: grid;
    grid-template-columns: 1fr 300px 130px;
    align-items: center;
    gap: 24px;
    padding: 20px 24px;
    background: #F9FAFB;
    border: 1px solid ${T.border};
    border-radius: 10px;
    margin-bottom: 10px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .cp-param-row:hover { border-color: #C0C8D8; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .cp-param-key {
    font-size: 13px; font-weight: 600; color: ${T.text};
    margin-bottom: 3px; font-family: 'SF Mono', 'Fira Code', monospace;
    letter-spacing: -0.01em;
  }
  .cp-param-desc { font-size: 12px; color: ${T.textMuted}; line-height: 1.4; }

  .cp-empty {
    padding: 48px 20px; text-align: center;
  }
  .cp-empty-icon {
    width: 44px; height: 44px; margin: 0 auto 12px;
    background: #F3F4F6; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: ${T.textMuted};
  }
  .cp-empty-text { font-size: 14px; color: ${T.textMuted}; }

  @keyframes toastIn {
    from { transform: translateX(24px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }

  @media (max-width: 768px) {
    .cp-page { padding: 20px 16px 48px; }
    .cp-two-col { grid-template-columns: 1fr; }
    .cp-param-row { grid-template-columns: 1fr; gap: 12px; }
    .cp-param-row > button { width: 100%; }
    .cp-tabs { overflow-x: auto; gap: 0; }
    .cp-tab { padding: 10px 14px; font-size: 13px; }
    .cp-table th, .cp-table td { padding: 10px 12px; }
    .cp-tipo-row { grid-template-columns: 1fr 100px 36px; }
    .cp-card-footer { flex-direction: column; }
    .cp-card-footer button { width: 100%; justify-content: center; }
    .cp-btn { height: 42px; }
  }
`

export default function ConfiguracionPrecios() {
  const [activeTab, setActiveTab] = useState('entradas')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const combosOriginal = useRef([])

  const [preciosSalaFormato, setPreciosSalaFormato] = useState(VALORES_INICIALES.preciosSalaFormato)
  const [combos, setCombos] = useState(VALORES_INICIALES.combos)
  const [errores, setErrores] = useState({})

  const cargarTodo = useCallback(async () => {
    setLoading(true)
    try {
      const [pf, co] = await Promise.all([
        apiFetch(`${API}/precios-sala-formato`).catch(() => null),
        apiFetch(`${API}/confiteria`).catch(() => null),
      ])
      if (pf) setPreciosSalaFormato(pf.precios)
      if (co) {
        setCombos(co.productos)
        combosOriginal.current = structuredClone(co.productos)
      }
    } catch (e) {
      error('Error al cargar datos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  function handlePrecioChange(tipoSala, formato, value) {
    const v = Number.parseFloat(value)
    const errKey = `precio_${tipoSala}_${formato}`
    validarNumero(v, errKey)
    setPreciosSalaFormato(prev => prev.map(p =>
      p.tipo_sala === tipoSala && p.formato === formato ? { ...p, precio: v || 0 } : p
    ))
  }

  function handleComboNombreChange(id, value) {
    setCombos(prev => prev.map(c => c.id === id ? { ...c, nombre: value } : c))
  }

  function handleComboPrecioChange(id, value) {
    const v = Number.parseFloat(value) || 0
    const errKey = `combo_precio_${id}`
    validarNumero(v, errKey)
    setCombos(prev => prev.map(c => c.id === id ? { ...c, precio: v } : c))
  }

  function handleComboEliminar(id, nombre) {
    setCombos(prev => prev.filter(c => c.id !== id))
    exito(`"${nombre}" eliminado`)
  }

  async function guardarPreciosSalaFormato() {
    const body = { precios: preciosSalaFormato }
    await apiFetch(`${API}/precios-sala-formato`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async function guardarConfiteria() {
    const orig = combosOriginal.current
    const curr = combos
    const origMap = new Map(orig.map(c => [c.id, c]))
    const currMap = new Map(curr.map(c => [c.id, c]))

    for (const item of curr) {
      const original = origMap.get(item.id)
      if (!original) {
        await apiFetch(`${API}/confiteria`, {
          method: 'POST',
          body: JSON.stringify({ nombre: item.nombre, precio: item.precio }),
        })
      } else if (original.nombre !== item.nombre || original.precio !== item.precio) {
        await apiFetch(`${API}/confiteria/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre: item.nombre, precio: item.precio }),
        })
      }
    }

    for (const item of orig) {
      if (!currMap.has(item.id)) {
        await apiFetch(`${API}/confiteria/${item.id}`, { method: 'DELETE' })
      }
    }
  }

  async function handleSave(mensaje, fn) {
    setSaving(true)
    try {
      await fn()
      combosOriginal.current = structuredClone(combos)
      exito(mensaje)
    } catch (e) {
      error(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function exito(msg) { setToast({ tipo: 'exito', mensaje: msg }) }
  function error(msg) { setToast({ tipo: 'error', mensaje: msg }) }

  function validarNumero(valor, campo) {
    if (Number.isNaN(valor) || valor < 0) {
      setErrores(prev => ({ ...prev, [campo]: 'Debe ser un número válido mayor o igual a 0' }))
      return false
    }
    setErrores(prev => ({ ...prev, [campo]: null }))
    return true
  }

  if (loading) {
    return (
      <div className="cp-page">
        <style>{styles}</style>
        <div className="cp-page-header">
          <h1 className="cp-page-title">Configuración y Precios</h1>
          <p className="cp-page-sub">Cargando datos...</p>
        </div>
        <div style={{ textAlign: 'center', padding: 60, color: T.textMuted }}>
          <div style={{
            width: 36, height: 36, margin: '0 auto 12px',
            border: `3px solid ${T.border}`, borderTopColor: T.primary,
            borderRadius: '50%', animation: 'cp-spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes cp-spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 14 }}>Cargando configuración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="cp-page">
      <style>{styles}</style>

      <div className="cp-page-header">
        <h1 className="cp-page-title">Configuración y Precios</h1>
        <p className="cp-page-sub">Gestión de parámetros comerciales y variables globales del sistema</p>
      </div>

      <div className="cp-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`cp-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'entradas' && (
        <div className="cp-card">
          <div className="cp-card-header">
            <div className="cp-card-title">Precios por Tipo de Sala y Formato</div>
            <p className="cp-card-desc">
              Define el precio base de la entrada según el tipo de sala (Estándar, VIP, IMAX, 4DX) y el formato (2D, 3D).
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="cp-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>Tipo de Sala</th>
                  {FORMATOS.map(fmt => (
                    <th key={fmt} className="right">{fmt}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIPOS_SALA.map(tipo_sala => (
                  <tr key={tipo_sala}>
                    <td style={{ fontWeight: 600, color: T.text }}>{tipo_sala}</td>
                    {FORMATOS.map(formato => {
                      const item = preciosSalaFormato.find(p => p.tipo_sala === tipo_sala && p.formato === formato)
                      const errKey = `precio_${tipo_sala}_${formato}`
                      return (
                        <td key={formato} className="right">
                          <div className="cp-input-prefix-wrap" style={{ display: 'inline-block', width: 140 }}>
                            <span className="cp-input-prefix">S/</span>
                            <input
                              type="number" step="0.01" min="0"
                              value={item?.precio ?? 0}
                              onChange={e => handlePrecioChange(tipo_sala, formato, e.target.value)}
                              className={`cp-input${errores[errKey] ? ' error' : ''}`}
                              style={{ textAlign: 'right' }}
                            />
                          </div>
                          {errores[errKey] && <span className="cp-error-msg">{errores[errKey]}</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cp-card-footer">
            <button
              className="cp-btn cp-btn-primary"
              onClick={() => handleSave('Precios guardados correctamente', guardarPreciosSalaFormato)}
              disabled={saving}
            >
              {saving ? 'Guardando…' : 'Guardar Precios'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'confiteria' && (
        <div className="cp-card">
          <div className="cp-card-header">
            <div className="cp-card-title">Combos y Productos de Confitería</div>
            <p className="cp-card-desc">
              Administra los combos y productos de dulcería. Podés editar nombre, precio, agregar nuevos o eliminar existentes.
            </p>
          </div>

          {combos.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p className="cp-empty-text">No hay productos registrados. Presione "+ Agregar Combo" para crear uno.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="right">Precio Actual</th>
                    <th className="right">Nuevo Precio</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map(item => {
                    const errKey = 'combo_precio_' + item.id
                    const err = errores[errKey]
                    return (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text" value={item.nombre}
                          onChange={e => handleComboNombreChange(item.id, e.target.value)}
                          className="cp-input"
                          style={{ fontWeight: 600, color: T.primary, maxWidth: 260 }}
                        />
                      </td>
                      <td className="right">
                        <span className="cp-price-badge">S/ {item.precio.toFixed(2)}</span>
                      </td>
                      <td className="right">
                        <div className="cp-input-prefix-wrap" style={{ display: 'inline-block', width: 150 }}>
                          <span className="cp-input-prefix">S/</span>
                          <input
                            type="number" step="0.01" min="0"
                            defaultValue={item.precio}
                            onChange={e => handleComboPrecioChange(item.id, e.target.value)}
                            className={'cp-input' + (err ? ' error' : '')}
                            style={{ textAlign: 'right' }}
                          />
                        </div>
                        {err && (
                          <span className="cp-error-msg" style={{ textAlign: 'right' }}>{err}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="cp-btn-icon"
                          title="Eliminar combo"
                          onClick={() => handleComboEliminar(item.id, item.nombre)}
                        >×</button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="cp-card-footer" style={{ justifyContent: 'space-between' }}>
            <button
              className="cp-btn cp-btn-secondary"
              onClick={() => {
                setCombos(prev => [...prev, { id: Date.now(), nombre: 'Nuevo Combo', precio: 0 }])
                exito('Nuevo combo agregado')
              }}
            >
              + Agregar Combo
            </button>
            <button
              className="cp-btn cp-btn-primary"
              disabled={saving}
              onClick={() => {
                if (combos.some(c => !c.nombre.trim())) {
                  error('Completa los nombres de todos los combos antes de guardar')
                  return
                }
                handleSave('Precios de confitería guardados correctamente', guardarConfiteria)
              }}
            >
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      <ToastFeedback
        tipo={toast?.tipo}
        mensaje={toast?.mensaje}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
