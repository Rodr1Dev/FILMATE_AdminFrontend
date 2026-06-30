import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import './CinesYSalas.css'

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CINEMAS_BASE      = '/api/cinemas'       // GET compartido (solo lectura)
const CINEMAS_ADMIN_BASE = '/api/admin/cinemas' // POST / PUT / DELETE
const ROOMS_BASE         = '/api/admin/rooms'   // CRUD completo admin
const SEATS_BASE         = '/api/admin/seats'   // CRUD completo admin de asientos

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
  const total = Math.min(capacidad, 300)
  const cols = Math.min(Math.ceil(Math.sqrt(total * 1.6)), 16)
  const filas = Math.ceil(total / cols)
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  return Array.from({ length: filas }, (_, f) => {
    const letra = letras[f] ?? `A${f}`
    return Array.from({ length: cols }, (_, c) => {
      const idx = f * cols + c
      if (idx >= total) return { tipo: 'vacio' }
      return {
        tipo: 'asiento',
        fila: letra,
        columna: c + 1,
        codigo: `${letra}${c + 1}`,
      }
    })
  })
}

// ─── MAPA DE ASIENTOS ────────────────────────────────────────────────────────
function MapaAsientos({ capacidad }) {
  const mapa = generarAsientos(capacidad)
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
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
      {mapa.map((fila, fi) => {
        const letra = letras[fi] ?? `A${fi}`
        return (
          <div key={letra} style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            {fila.map((asiento, ci) => {
              const key = `${letra}-${ci}`
              return asiento.tipo === 'vacio' ? (
                <div key={key} style={{ width: 13, height: 11, flexShrink: 0 }} />
              ) : (
                <div key={key} style={{ width: 13, height: 11, borderRadius: '3px 3px 1px 1px', background: '#6B7280', flexShrink: 0 }} />
              )
            })}
          </div>
        )
      })}
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

MapaAsientos.propTypes = {
  capacidad: PropTypes.number.isRequired,
}

const CAPACIDAD_FIJA = 150

// ─── MODAL AGREGAR / EDITAR SALA ─────────────────────────────────────────────
function ModalSala({ modo, salaInicial, idCine, salasExistentes, onClose, onGuardado }) {
  const [nombre,       setNombre]       = useState(salaInicial?.nombre_sala ?? '')
  const [tipoSala,     setTipoSala]     = useState(salaInicial?.tipo_sala   ?? 'Stand.')
  const [tipoFormato,  setTipoFormato]  = useState(salaInicial?.tipo_formato ?? '2D')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  let labelBtn
  if (loading) {
    labelBtn = 'Guardando…'
  } else if (modo === 'crear') {
    labelBtn = 'Agregar'
  } else {
    labelBtn = 'Guardar cambios'
  }

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('Completa todos los campos.'); return }

    // Validar nombre duplicado dentro del mismo cine
    const duplicado = salasExistentes?.some(s =>
      s.nombre_sala.trim().toLowerCase() === nombre.trim().toLowerCase() &&
      (modo === 'crear' || s.id_sala !== salaInicial?.id_sala)
    )
    if (duplicado) { setError(`Ya existe una sala con el nombre "${nombre.trim()}" en este cine.`); return }

    setLoading(true); setError(null)
    try {
      const body = {
        id_cine:            idCine,
        nombre_sala:        nombre.trim(),
        tipo_sala:          tipoSala,
        tipo_formato:       tipoFormato,
        capacidad_asientos: CAPACIDAD_FIJA,
      }
      if (modo === 'crear') {
        const sala = await apiFetch(`${ROOMS_BASE}/`, { method: 'POST', body: JSON.stringify(body) })
        const asientoPreview = generarAsientos(CAPACIDAD_FIJA)
        const asientos = asientoPreview
          .flat()
          .filter(a => a.tipo === 'asiento')
          .map(a => ({
            id_sala: sala.id_sala,
            fila: a.fila,
            columna: a.columna,
            tipo_asiento: 'Regular',
          }))

        await apiFetch(`${SEATS_BASE}/room/${sala.id_sala}/bulk`, {
          method: 'POST',
          body: JSON.stringify(asientos),
        })
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
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#C2410C' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={btnSecundario}>Cancelar</button>
          <button onClick={handleGuardar} disabled={loading} style={{ ...btnPrimario, opacity: loading ? 0.7 : 1 }}>
            {labelBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

ModalSala.propTypes = {
  modo: PropTypes.oneOf(['crear', 'editar']).isRequired,
  salaInicial: PropTypes.shape({
    nombre_sala: PropTypes.string,
    tipo_sala: PropTypes.string,
    tipo_formato: PropTypes.string,
    capacidad_asientos: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id_sala: PropTypes.number,
  }),
  idCine: PropTypes.number,
  salasExistentes: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
}

// ─── Helpers de horario (días + horas → string "Lunes a Domingo: 10:00AM - 10:00PM") ──
const DIAS_SEMANA_CINE = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function parseHorarioInicial(str) {
  if (!str) return { horaApertura: '10:00', horaCierre: '22:00', dias: [...DIAS_SEMANA_CINE] }
  const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return { horaApertura: '10:00', horaCierre: '22:00', dias: [...DIAS_SEMANA_CINE] }
  const to24 = (h, m, ampm) => {
    let hh = Number(h)
    if (/pm/i.test(ampm) && hh !== 12) hh += 12
    if (/am/i.test(ampm) && hh === 12) hh = 0
    return `${String(hh).padStart(2, '0')}:${m}`
  }
  return {
    horaApertura: to24(match[1], match[2], match[3]),
    horaCierre:   to24(match[4], match[5], match[6]),
    dias: [...DIAS_SEMANA_CINE],
  }
}

function formatHora12(hora24) {
  const [h, m] = hora24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  let hh = h % 12
  if (hh === 0) hh = 12
  return `${hh}:${String(m).padStart(2, '0')}${ampm}`
}

function construirStringHorario(dias, horaApertura, horaCierre) {
  if (dias.length === 0) return ''
  const idxs = dias.map(d => DIAS_SEMANA_CINE.indexOf(d)).sort((a, b) => a - b)
  const esRangoCompleto = dias.length === 7
  const esConsecutivo = idxs.every((v, i) => i === 0 || v === idxs[i - 1] + 1)
  let etiquetaDias
  if (esRangoCompleto) {
    etiquetaDias = 'Lunes a Domingo'
  } else if (esConsecutivo && dias.length > 1) {
    etiquetaDias = `${DIAS_SEMANA_CINE[idxs[0]]} a ${DIAS_SEMANA_CINE[idxs[idxs.length - 1]]}`
  } else {
    etiquetaDias = idxs.map(i => DIAS_SEMANA_CINE[i]).join(', ')
  }
  return `${etiquetaDias}: ${formatHora12(horaApertura)} - ${formatHora12(horaCierre)}`
}

// ─── MODAL AGREGAR / EDITAR CINE ─────────────────────────────────────────────
function ModalCine({ modo, cineInicial, cinesExistentes, onClose, onGuardado }) {
  const [nombreCine,       setNombreCine]       = useState(cineInicial?.nombre_cine        ?? '')
  const [direccion,        setDireccion]        = useState(cineInicial?.direccion          ?? '')
  const horarioInicial = parseHorarioInicial(cineInicial?.horarios_apertura)
  const [diasSeleccionados, setDiasSeleccionados] = useState(horarioInicial.dias)
  const [horaApertura,     setHoraApertura]     = useState(horarioInicial.horaApertura)
  const [horaCierre,       setHoraCierre]       = useState(horarioInicial.horaCierre)
  const [urlMapa,          setUrlMapa]          = useState(cineInicial?.url_mapa_embebido  ?? '')
  const [observaciones,    setObservaciones]    = useState(cineInicial?.observaciones      ?? '')
  const [estadoCine,       setEstadoCine]       = useState(cineInicial?.estado_cine ?? 'Activo')
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState(null)
  let labelBtnCine
  if (loading) {
    labelBtnCine = 'Guardando…'
  } else if (modo === 'crear') {
    labelBtnCine = 'Agregar'
  } else {
    labelBtnCine = 'Guardar cambios'
  }

  const toggleDia = (dia) => setDiasSeleccionados(prev =>
    prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
  )

  const handleGuardar = async () => {
    if (!nombreCine.trim() || !direccion.trim()) { setError('Completa los campos obligatorios.'); return }
    if (diasSeleccionados.length === 0) { setError('Selecciona al menos un día de atención.'); return }

    // Validar nombre duplicado
    const duplicado = cinesExistentes?.some(c =>
      c.nombre_cine.trim().toLowerCase() === nombreCine.trim().toLowerCase() &&
      (modo === 'crear' || c.id_cine !== cineInicial?.id_cine)
    )
    if (duplicado) { setError(`Ya existe un cine con el nombre "${nombreCine.trim()}".`); return }

    setLoading(true); setError(null)
    try {
      const horariosApertura = construirStringHorario(diasSeleccionados, horaApertura, horaCierre)
      const body = {
        nombre_cine:       nombreCine.trim(),
        direccion:         direccion.trim(),
        horarios_apertura: horariosApertura || null,
        url_mapa_embebido: urlMapa.trim() || null,
        observaciones:     observaciones.trim() || null,
        estado_cine:       estadoCine,
      }
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
        background: '#fff', borderRadius: 14, width: '100%', maxWidth: 520,
        padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#121212', margin: 0 }}>
            {modo === 'crear' ? 'Agregar Cine' : 'Editar Cine'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
              <label htmlFor="estado-cine" style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</label>
              <select id="estado-cine" value={estadoCine} onChange={e => setEstadoCine(e.target.value)} style={{ ...inputStyle, padding: '5px 10px', fontSize: 13, width: 'auto' }}>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9CA3AF', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nombre del cine *">
            <input value={nombreCine} onChange={e => setNombreCine(e.target.value)}
              placeholder="Ej. Filmate Centro" style={inputStyle} />
          </Field>
          <Field label="Dirección *">
            <input value={direccion} onChange={e => setDireccion(e.target.value)}
              placeholder="Ej. Av. Javier Prado Este 5400" style={inputStyle} />
          </Field>

          <Field label="Días de atención *">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DIAS_SEMANA_CINE.map(dia => {
                const sel = diasSeleccionados.includes(dia)
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => toggleDia(dia)}
                    style={{
                      padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: `1.5px solid ${sel ? '#1C2566' : '#D1D5DC'}`,
                      background: sel ? '#1C2566' : '#fff',
                      color: sel ? '#fff' : '#4A5565',
                      transition: 'all 0.12s',
                    }}
                  >
                    {dia.slice(0, 3)}
                  </button>
                )
              })}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Hora de apertura *">
              <input type="time" value={horaApertura} onChange={e => setHoraApertura(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Hora de cierre *">
              <input type="time" value={horaCierre} onChange={e => setHoraCierre(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          {diasSeleccionados.length > 0 && (
            <div style={{ fontSize: 12, color: '#6B7280', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px' }}>
              Vista previa: <strong style={{ color: '#1C2566' }}>{construirStringHorario(diasSeleccionados, horaApertura, horaCierre)}</strong>
            </div>
          )}

          <Field label="URL del mapa embebido">
            <input value={urlMapa} onChange={e => setUrlMapa(e.target.value)}
              placeholder="https://www.google.com/maps/embed?..." style={inputStyle} />
          </Field>
          <Field label="Observaciones">
            <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
              placeholder="Información adicional sobre el cine..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }} />
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
            {labelBtnCine}
          </button>
        </div>
      </div>
    </div>
  )
}

ModalCine.propTypes = {
  modo: PropTypes.oneOf(['crear', 'editar']).isRequired,
  cineInicial: PropTypes.shape({
    nombre_cine: PropTypes.string,
    direccion: PropTypes.string,
    horarios_apertura: PropTypes.string,
    url_mapa_embebido: PropTypes.string,
    observaciones: PropTypes.string,
    estado_cine: PropTypes.string,
    id_cine: PropTypes.number,
  }),
  cinesExistentes: PropTypes.array,
  onClose: PropTypes.func.isRequired,
  onGuardado: PropTypes.func.isRequired,
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#364153', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  )
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
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

ModalConfirmar.propTypes = {
  mensaje: PropTypes.string.isRequired,
  onConfirmar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  loading: PropTypes.bool,
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

  const renderCineList = () => {
    if (loadingCines) return <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Cargando…</div>
    if (errorCines) return <div style={{ padding: '32px 16px', textAlign: 'center', color: '#EF4444', fontSize: 13 }}>⚠️ {errorCines}</div>
    if (cinesFiltrados.length === 0) return <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Sin resultados</div>
    return cinesFiltrados.map(cine => (
              <div
                key={cine.id_cine}
                className="cine-row"
                style={{
                  display: 'flex', marginBottom: 4, borderRadius: 9,
                  background: cineSeleccionado?.id_cine === cine.id_cine ? '#EEF2FF' : undefined,
                  border: `1px solid ${cineSeleccionado?.id_cine === cine.id_cine ? '#C7D2FE' : 'transparent'}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => { setCineSeleccionado(cine); setSalaSeleccionada(null) }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCineSeleccionado(cine); setSalaSeleccionada(null) } }}
                  style={{
                    flex: 1, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
                    padding: '11px 12px', background: 'none', border: 'none', borderRadius: 9,
                  }}
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
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 5 }}>
                    {salas.filter(s => s.id_cine === cine.id_cine).length} sala(s)
                  </div>
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 8px 8px 0', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                    background: cine.estado_cine === 'Activo' ? '#DCFCE7' : '#F3F4F6',
                    color: cine.estado_cine === 'Activo' ? '#008236' : '#6B7280',
                  }}>
                    {cine.estado_cine}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
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
            ))
  }

  const renderSalasContent = () => {
    if (loadingSalas) return <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Cargando salas…</div>
    if (errorSalas) return <div style={{ padding: '32px 0', textAlign: 'center', color: '#EF4444', fontSize: 13 }}>⚠️ {errorSalas}</div>
    if (!cineSeleccionado) return <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Selecciona un cine para ver sus salas</div>
    if (salasDeCine.length === 0) return <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Este cine no tiene salas registradas</div>
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {salasDeCine.map(sala => (
          <div
            key={sala.id_sala}
            style={{
              display: 'flex', alignItems: 'flex-start', borderRadius: 10,
              background: salaSeleccionada?.id_sala === sala.id_sala ? '#EEF2FF' : '#F9FAFB',
              border: `1px solid ${salaSeleccionada?.id_sala === sala.id_sala ? '#C7D2FE' : '#E5E7EB'}`,
              transition: 'all 0.15s',
            }}
          >
            <button
              type="button"
              onClick={() => setSalaSeleccionada(salaSeleccionada?.id_sala === sala.id_sala ? null : sala)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSalaSeleccionada(salaSeleccionada?.id_sala === sala.id_sala ? null : sala) } }}
              style={{
                flex: 1, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
                padding: '14px 16px', background: 'none', border: 'none', borderRadius: 10,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#121212', marginBottom: 3 }}>{sala.nombre_sala}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>{sala.capacidad_asientos} asientos</div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 999,
                background: '#EEF2FF', color: '#283593',
              }}>
                {sala.tipo_sala} {sala.tipo_formato}
              </span>
            </button>
            <div style={{ display: 'flex', gap: 4, padding: '14px 16px 14px 0', flexShrink: 0 }}>
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
        ))}
      </div>
    )
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
            {renderCineList()}
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
              {renderSalasContent()}
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
          salasExistentes={salasDeCine}
          onClose={() => setModalSala(null)}
          onGuardado={handleGuardadoSala}
        />
      )}

      {modalCine && (
        <ModalCine
          modo={modalCine}
          cineInicial={modalCine === 'editar' ? cineEditando : null}
          cinesExistentes={cines}
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

InfoFila.propTypes = {
  label: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}
