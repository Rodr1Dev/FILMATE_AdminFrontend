import React, { useState, useEffect, useCallback } from 'react'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CINEMAS_BASE      = '/api/cinemas'       // GET compartido (solo lectura)
const CINEMAS_ADMIN_BASE = '/api/admin/cinemas' // POST / PUT / DELETE
const ROOMS_BASE         = '/api/admin/rooms'   // CRUD completo admin

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  // DELETE devuelve 204 sin body
  if (res.status === 204) return null
  return res.json()
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generarAsientos(capacidad) {
  const total = Math.min(capacidad, 120)
  const cols  = Math.min(Math.ceil(Math.sqrt(total * 1.6)), 16)
  const filas = Math.ceil(total / cols)
  return Array.from({ length: filas }, (_, f) =>
    Array.from({ length: cols }, (_, c) => {
      const idx = f * cols + c
      return idx < total ? 'asiento' : 'vacio'
    })
  )
}

// ─── MAPA DE ASIENTOS ────────────────────────────────────────────────────────
function MapaAsientos({ capacidad }) {
  const mapa = generarAsientos(capacidad)
  return (
    <div style={{
      flex: 1,
      background: '#1C2566',
      borderRadius: 10,
      padding: '16px 16px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 0,
      overflow: 'hidden',
    }}>
      {mapa.map((fila, fi) => (
        <div key={fi} style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
          {fila.map((tipo, ci) =>
            tipo === 'vacio' ? (
              <div key={ci} style={{ width: 13, height: 11, flexShrink: 0 }} />
            ) : (
              <div key={ci} style={{
                width: 13,
                height: 11,
                borderRadius: '3px 3px 1px 1px',
                background: '#6B7280',
                flexShrink: 0,
              }} />
            )
          )}
        </div>
      ))}
      <div style={{
        textAlign: 'center',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        letterSpacing: 3,
        marginTop: 8,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingTop: 6,
        textTransform: 'uppercase',
      }}>
        Pantalla
      </div>
    </div>
  )
}

// ─── MODAL AGREGAR / EDITAR SALA ─────────────────────────────────────────────
function ModalSala({ modo, salaInicial, idCine, onClose, onGuardado }) {
  const [nombre,       setNombre]       = useState(salaInicial?.nombre_sala ?? '')
  const [tipoSala,     setTipoSala]     = useState(salaInicial?.tipo_sala   ?? 'Stand.')
  const [tipoFormato,  setTipoFormato]  = useState(salaInicial?.tipo_formato ?? '2D')
  const [capacidad,    setCapacidad]    = useState(salaInicial?.capacidad_asientos ?? '')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  const handleGuardar = async () => {
    if (!nombre.trim() || !capacidad) { setError('Completa todos los campos.'); return }
    setLoading(true); setError(null)
    try {
      const body = { id_cine: idCine, nombre_sala: nombre.trim(), tipo_sala: tipoSala, tipo_formato: tipoFormato, capacidad_asientos: Number(capacidad) }
      if (modo === 'crear') {
        await apiFetch(`${ROOMS_BASE}/`, { method: 'POST', body: JSON.stringify(body) })
      } else {
        await apiFetch(`${ROOMS_BASE}/${salaInicial.id_sala}`, { method: 'PUT', body: JSON.stringify(body) })
      }
      onGuardado()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460,
        padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#121212', margin: 0 }}>
            {modo === 'crear' ? 'Agregar Sala' : 'Editar Sala'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', lineHeight: 1 }}>×</button>
        </div>

        {/* Campos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Nombre de la sala">
            <input value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej. Sala 1" style={inputStyle} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Tipo de sala">
              <select value={tipoSala} onChange={e => setTipoSala(e.target.value)} style={inputStyle}>
                <option value="Stand.">Estándar</option>
                <option value="VIP">VIP</option>
                <option value="IMAX">IMAX</option>
                <option value="4DX">4DX</option>
              </select>
            </Field>
            <Field label="Formato">
              <select value={tipoFormato} onChange={e => setTipoFormato(e.target.value)} style={inputStyle}>
                <option value="2D">2D</option>
                <option value="3D">3D</option>
              </select>
            </Field>
          </div>
          <Field label="Capacidad total de asientos">
            <input type="number" min="1" value={capacidad} onChange={e => setCapacidad(e.target.value)}
              placeholder="Ej. 120" style={inputStyle} />
          </Field>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#C2410C' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={btnSecundario}>Cancelar</button>
          <button onClick={handleGuardar} disabled={loading} style={{ ...btnPrimario, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Guardando…' : modo === 'crear' ? 'Agregar' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MODAL AGREGAR / EDITAR CINE ─────────────────────────────────────────────
function ModalCine({ modo, cineInicial, onClose, onGuardado }) {
  const [nombreCine, setNombreCine] = useState(cineInicial?.nombre_cine ?? '')
  const [direccion,  setDireccion]  = useState(cineInicial?.direccion  ?? '')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const handleGuardar = async () => {
    if (!nombreCine.trim() || !direccion.trim()) { setError('Completa todos los campos.'); return }
    setLoading(true); setError(null)
    try {
      const body = { nombre_cine: nombreCine.trim(), direccion: direccion.trim() }
      if (modo === 'crear') {
        await apiFetch(`${CINEMAS_ADMIN_BASE}/`, { method: 'POST', body: JSON.stringify(body) })
      } else {
        await apiFetch(`${CINEMAS_ADMIN_BASE}/${cineInicial.id_cine}`, { method: 'PUT', body: JSON.stringify(body) })
      }
      onGuardado()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 460,
        padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#121212', margin: 0 }}>
            {modo === 'crear' ? 'Agregar Cine' : 'Editar Cine'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Nombre del cine">
            <input value={nombreCine} onChange={e => setNombreCine(e.target.value)}
              placeholder="Ej. Filmate Centro" style={inputStyle} />
          </Field>
          <Field label="Dirección">
            <input value={direccion} onChange={e => setDireccion(e.target.value)}
              placeholder="Ej. Av. Larco 123" style={inputStyle} />
          </Field>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#C2410C' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={btnSecundario}>Cancelar</button>
          <button onClick={handleGuardar} disabled={loading} style={{ ...btnPrimario, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Guardando…' : modo === 'crear' ? 'Agregar' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#364153', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  border: '1px solid #D1D5DC', borderRadius: 8, padding: '9px 12px',
  fontSize: 14, color: '#222', background: '#F9FAFB', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}

const btnPrimario = {
  background: '#1C2566', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

const btnSecundario = {
  background: '#fff', color: '#4A5565', border: '1px solid #D1D5DC', borderRadius: 8,
  padding: '9px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
}

// ─── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────────────────────────
function ModalConfirmar({ mensaje, onConfirmar, onCancelar, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 380,
        padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>¿Confirmar eliminación?</h3>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>{mensaje}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancelar} style={btnSecundario}>Cancelar</button>
          <button onClick={onConfirmar} disabled={loading} style={{ ...btnPrimario, background: '#EF4444', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CinesYSalas() {
  const [cines,             setCines]             = useState([])
  const [salas,             setSalas]             = useState([])
  const [cineSeleccionado,  setCineSeleccionado]  = useState(null)
  const [salaSeleccionada,  setSalaSeleccionada]  = useState(null)
  const [busqueda,          setBusqueda]          = useState('')
  const [loadingCines,      setLoadingCines]      = useState(true)
  const [loadingSalas,      setLoadingSalas]      = useState(false)
  const [errorCines,        setErrorCines]        = useState(null)
  const [errorSalas,        setErrorSalas]        = useState(null)

  // Modales
  const [modalSala,         setModalSala]         = useState(null)  // null | 'crear' | 'editar'
  const [modalCine,         setModalCine]         = useState(null)  // null | 'crear' | 'editar'
  const [cineEditando,      setCineEditando]      = useState(null)
  const [confirmarElim,     setConfirmarElim]     = useState(null)  // null | { tipo, item }
  const [loadingElim,       setLoadingElim]       = useState(false)

  // ── Cargar cines ──
  const cargarCines = useCallback(async () => {
    setLoadingCines(true); setErrorCines(null)
    try {
      const data = await apiFetch(`${CINEMAS_BASE}/`)
      setCines(data)
      if (data.length > 0) setCineSeleccionado(prev => prev ?? data[0])
    } catch (e) { setErrorCines(e.message) }
    finally { setLoadingCines(false) }
  }, [])

  // ── Cargar salas ──
  const cargarSalas = useCallback(async () => {
    setLoadingSalas(true); setErrorSalas(null)
    try {
      const data = await apiFetch(`${ROOMS_BASE}/`)
      setSalas(data)
    } catch (e) { setErrorSalas(e.message) }
    finally { setLoadingSalas(false) }
  }, [])

  useEffect(() => { cargarCines() }, [cargarCines])
  useEffect(() => { cargarSalas() }, [cargarSalas])

  // ── Salas del cine seleccionado ──
  const salasDeCine = cineSeleccionado
    ? salas.filter(s => s.id_cine === cineSeleccionado.id_cine)
    : []

  // ── Cines filtrados por búsqueda ──
  const cinesFiltrados = cines.filter(c =>
    c.nombre_cine.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.direccion?.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ── Eliminar sala ──
  const handleEliminarSala = async () => {
    setLoadingElim(true)
    try {
      await apiFetch(`${ROOMS_BASE}/${confirmarElim.item.id_sala}`, { method: 'DELETE' })
      if (salaSeleccionada?.id_sala === confirmarElim.item.id_sala) setSalaSeleccionada(null)
      await cargarSalas()
      setConfirmarElim(null)
    } catch (e) { alert('Error al eliminar: ' + e.message) }
    finally { setLoadingElim(false) }
  }

  // ── Eliminar cine ──
  const handleEliminarCine = async () => {
    setLoadingElim(true)
    try {
      await apiFetch(`${CINEMAS_ADMIN_BASE}/${confirmarElim.item.id_cine}`, { method: 'DELETE' })
      if (cineSeleccionado?.id_cine === confirmarElim.item.id_cine) {
        setCineSeleccionado(null)
        setSalaSeleccionada(null)
      }
      await cargarCines()
      setConfirmarElim(null)
    } catch (e) { alert('Error al eliminar: ' + e.message) }
    finally { setLoadingElim(false) }
  }

  // ── Confirmar eliminación (sala o cine) ──
  const handleConfirmarElim = confirmarElim?.tipo === 'sala' ? handleEliminarSala : handleEliminarCine

  // ── Al guardar sala (crear/editar) ──
  const handleGuardadoSala = async () => {
    setModalSala(null)
    setSalaSeleccionada(null)
    await cargarSalas()
  }

  // ── Al guardar cine (crear/editar) ──
  const handleGuardadoCine = async () => {
    setModalCine(null)
    setCineEditando(null)
    await cargarCines()
  }

  return (
    <div style={{ padding: '28px 28px 40px' }}>

      {/* Título */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Cines y Salas</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>
          Gestión de complejos cinematográficos y sus salas
        </p>
      </div>

      {/* Layout principal */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Columna izquierda: cines ── */}
        <div style={{
          width: 260, minWidth: 260,
          background: '#fff', borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header cines */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#4A5565', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cines
              </span>
              <button
                onClick={() => setModalCine('crear')}
                style={{ ...btnPrimario, padding: '5px 12px', fontSize: 12 }}
              >
                + Agregar Cine
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar cines..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ ...inputStyle, padding: '7px 10px', fontSize: 13 }}
            />
          </div>

          {/* Lista cines */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
            {loadingCines ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Cargando…</div>
            ) : errorCines ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#EF4444', fontSize: 13 }}>⚠️ {errorCines}</div>
            ) : cinesFiltrados.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin resultados</div>
            ) : cinesFiltrados.map(cine => (
              <div
                key={cine.id_cine}
                onClick={() => { setCineSeleccionado(cine); setSalaSeleccionada(null) }}
                style={{
                  padding: '11px 12px', borderRadius: 9, cursor: 'pointer', marginBottom: 4,
                  background: cineSeleccionado?.id_cine === cine.id_cine ? '#EEF2FF' : 'transparent',
                  border: `1px solid ${cineSeleccionado?.id_cine === cine.id_cine ? '#C7D2FE' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (cineSeleccionado?.id_cine !== cine.id_cine) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (cineSeleccionado?.id_cine !== cine.id_cine) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#121212', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cine.nombre_cine}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cine.direccion}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: cine.estado_cine === 'Activo' ? '#DCFCE7' : '#F3F4F6',
                      color: cine.estado_cine === 'Activo' ? '#008236' : '#6B7280',
                    }}>
                      {cine.estado_cine}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {/* Editar cine */}
                      <button
                        onClick={e => { e.stopPropagation(); setCineEditando(cine); setModalCine('editar') }}
                        title="Editar cine"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#D1D5DB', lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#1C2566'}
                        onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      {/* Eliminar cine */}
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmarElim({ tipo: 'cine', item: cine }) }}
                        title="Desactivar cine"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#D1D5DB', lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                        onMouseLeave={e => e.currentTarget.style.color = '#D1D5DB'}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 5 }}>
                  {salas.filter(s => s.id_cine === cine.id_cine).length} sala(s)
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              Mostrando {cinesFiltrados.length} de {cines.length} cines
            </span>
          </div>
        </div>

        {/* ── Columna derecha ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

          {/* Panel de salas */}
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#121212', margin: 0 }}>
                  Salas — {cineSeleccionado?.nombre_cine ?? '—'}
                </h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>
                  {cineSeleccionado ? `${salasDeCine.length} sala(s) registradas` : 'Selecciona un cine'}
                </p>
              </div>
              {cineSeleccionado && (
                <button
                  onClick={() => setModalSala('crear')}
                  style={{ ...btnPrimario, padding: '7px 16px', fontSize: 13 }}
                >
                  + Agregar Sala
                </button>
              )}
            </div>

            <div style={{ padding: 16 }}>
              {loadingSalas ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Cargando salas…</div>
              ) : errorSalas ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#EF4444', fontSize: 13 }}>⚠️ {errorSalas}</div>
              ) : !cineSeleccionado ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Selecciona un cine para ver sus salas</div>
              ) : salasDeCine.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Este cine no tiene salas registradas</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {salasDeCine.map(sala => (
                    <div
                      key={sala.id_sala}
                      onClick={() => setSalaSeleccionada(prev => prev?.id_sala === sala.id_sala ? null : sala)}
                      style={{
                        background: salaSeleccionada?.id_sala === sala.id_sala ? '#EEF2FF' : '#F9FAFB',
                        border: `1px solid ${salaSeleccionada?.id_sala === sala.id_sala ? '#C7D2FE' : '#E5E7EB'}`,
                        borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#121212', marginBottom: 3 }}>{sala.nombre_sala}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{sala.capacidad_asientos} asientos</div>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 999,
                            background: '#EEF2FF', color: '#283593',
                          }}>
                            {sala.tipo_sala} {sala.tipo_formato}
                          </span>
                        </div>
                        {/* Acciones */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={e => { e.stopPropagation(); setSalaSeleccionada(sala); setModalSala('editar') }}
                            title="Editar sala"
                            style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#283593' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setConfirmarElim({ tipo: 'sala', item: sala }) }}
                            title="Eliminar sala"
                            style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '4px 7px', cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#E5E7EB' }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor / visualizador de sala seleccionada */}
          {salaSeleccionada && (
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: 20, display: 'flex', gap: 20, alignItems: 'flex-start',
            }}>
              {/* Info de la sala */}
              <div style={{ width: 200, minWidth: 200 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#121212', margin: '0 0 16px' }}>
                  {salaSeleccionada.nombre_sala}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <InfoFila label="Tipo" valor={salaSeleccionada.tipo_sala} />
                  <InfoFila label="Formato" valor={salaSeleccionada.tipo_formato} />
                  <InfoFila label="Capacidad" valor={`${salaSeleccionada.capacidad_asientos} asientos`} />
                  <InfoFila label="ID Sala" valor={`#${salaSeleccionada.id_sala}`} />
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => setModalSala('editar')}
                    style={{ ...btnPrimario, padding: '8px', fontSize: 13, textAlign: 'center' }}
                  >
                    Editar sala
                  </button>
                  <button
                    onClick={() => setConfirmarElim({ tipo: 'sala', item: salaSeleccionada })}
                    style={{ ...btnSecundario, padding: '8px', fontSize: 13, color: '#EF4444', borderColor: '#FCA5A5' }}
                  >
                    Eliminar sala
                  </button>
                </div>
              </div>

              {/* Mapa de asientos */}
              <MapaAsientos capacidad={salaSeleccionada.capacidad_asientos} />
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {modalSala && (
        <ModalSala
          modo={modalSala}
          salaInicial={modalSala === 'editar' ? salaSeleccionada : null}
          idCine={cineSeleccionado?.id_cine}
          onClose={() => setModalSala(null)}
          onGuardado={handleGuardadoSala}
        />
      )}

      {modalCine && (
        <ModalCine
          modo={modalCine}
          cineInicial={modalCine === 'editar' ? cineEditando : null}
          onClose={() => { setModalCine(null); setCineEditando(null) }}
          onGuardado={handleGuardadoCine}
        />
      )}

      {confirmarElim && (
        <ModalConfirmar
          mensaje={
            confirmarElim.tipo === 'sala'
              ? `¿Eliminar "${confirmarElim.item.nombre_sala}"? Esta acción no se puede deshacer.`
              : `¿Desactivar el cine "${confirmarElim.item.nombre_cine}"? Dejará de aparecer en el sistema.`
          }
          onConfirmar={handleConfirmarElim}
          onCancelar={() => setConfirmarElim(null)}
          loading={loadingElim}
        />
      )}
    </div>
  )
}

function InfoFila({ label, valor }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#121212', fontWeight: 500 }}>{valor}</div>
    </div>
  )
}
