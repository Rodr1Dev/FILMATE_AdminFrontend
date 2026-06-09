import React, { useState, useEffect, useCallback, useRef } from 'react'
import './CatalogoPeliculas.css'

// ─── API Configuration ────────────────────────────────────────────────────────
const API_BASE = '/api'

const ADMIN = `${API_BASE}/admin/movies`

const api = {
  list:    (skip = 0, limit = 200) => fetch(`${ADMIN}/?skip=${skip}&limit=${limit}`).then(r => r.json()),
  details: (id)                    => fetch(`${API_BASE}/movies/${id}/details`).then(r => r.json()),
  create:  (body)                  => fetch(`${ADMIN}/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(async r => { if (!r.ok) { const e = await r.text(); throw new Error(e) } return r.json() }),
  update:  (id, body)              => fetch(`${ADMIN}/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(async r => { if (!r.ok) { const e = await r.text(); throw new Error(e) } return r.json() }),
  delete:  (id)                    => fetch(`${ADMIN}/${id}`, {
    method: 'DELETE',
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.text().then(t => t ? JSON.parse(t) : {}) }),
  genres:          () => fetch(`${ADMIN}/meta/genres`).then(r => r.json()),
  classifications: () => fetch(`${ADMIN}/meta/classifications`).then(r => r.json()),
}

// ─── Helpers para extraer strings de objetos ─────────────────────────────────
function extractString(value) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && value.nombre) return value.nombre
  return ''
}

function extractGenres(value) {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(g => {
      if (typeof g === 'string') return g
      if (g && typeof g === 'object') return g.nombre_genero || g.nombre || String(g)
      return String(g)
    })
  }
  return []
}

// ─── Field mapping ────────────────────────────────────────────────────────────
function backendToFrontend(m) {
  if (!m) return {}

  const id = m.id ?? m.id_pelicula ?? null

  const poster  = m.url_poster  || m.poster  || ''
  const trailer = m.url_trailer || m.trailer || ''
  const banner  = m.url_banner  || m.banner  || ''

  let duracion = ''
  if (m.duracion_minutos) {
    const h   = Math.floor(m.duracion_minutos / 60)
    const min = m.duracion_minutos % 60
    duracion  = h > 0 ? `${h}h ${min > 0 ? `${min} min` : ''}` : `${min} min`
  } else if (m.duracion) {
    duracion = m.duracion
  }

  return {
    id,
    titulo:           m.titulo               ?? '',
    anio_lanzamiento: m.anio_lanzamiento      ?? '',
    sinopsis:         m.sinopsis             ?? '',
    duracion,
    duracion_minutos: m.duracion_minutos      ?? null,
    clasificacion:    m.clasificacion        ?? '',
    poster,
    trailer,
    banner,
    generos:          extractGenres(m.generos) || [],
    estado:           m.estado_pelicula      ?? 'ACTIVO',
    director:         m.director             ?? '',
    elenco:           m.elenco               ?? '',
  }
}

function frontendToBackend(f, mode = 'create') {
  let duracion_minutos = null
  if (f.duracion && f.duracion.trim() !== '') {
    const solo = parseInt(f.duracion)
    if (!isNaN(solo) && solo > 0) {
      duracion_minutos = solo
    }
  }

  const body = {
    titulo:              f.titulo             || null,
    anio_lanzamiento:    Number(f.anio_lanzamiento) || null,
    sinopsis:            f.sinopsis           || null,
    duracion_minutos,
    clasificacion:       f.clasificacion      || null,
    estado_pelicula:     f.estado             || 'ACTIVO',
    url_poster:          f.poster             || null,
    url_trailer:         f.trailer            || null,
    url_banner:          f.banner             || null,
    director:            f.director           || '',
    elenco:              f.elenco             || '',
  }
  if (mode === 'create') {
    body.generos = f.generos || []
  }
  return body
}

// ─── Validación del formulario ────────────────────────────────────────────────
function validarForm(form) {
  const errores = {}
  if (!form.titulo?.trim())         errores.titulo         = 'El título es obligatorio'
  if (!form.anio_lanzamiento)       errores.anio_lanzamiento = 'El año de lanzamiento es obligatorio'
  else if (form.anio_lanzamiento < 1888 || form.anio_lanzamiento > 2100) errores.anio_lanzamiento = 'Año inválido'
  if (!form.sinopsis?.trim())       errores.sinopsis       = 'La sinopsis es obligatoria'
  if (!form.duracion?.trim())       errores.duracion       = 'La duración es obligatoria'
  else {
    const solo = parseInt(form.duracion)
    if (isNaN(solo) || solo <= 0)   errores.duracion       = 'Duración inválida (solo números, ej: 120)'
  }
  if (!form.clasificacion)          errores.clasificacion  = 'La clasificación es obligatoria'
  if (!form.generos?.length)        errores.generos        = 'Selecciona al menos un género'
  if (!form.poster?.trim())         errores.poster         = 'El URL del poster es obligatorio'
  else if (!form.poster.match(/^https?:\/\/.+/)) errores.poster = 'URL inválida (debe empezar con http:// o https://)'
  if (!form.trailer?.trim())        errores.trailer        = 'El URL del tráiler es obligatorio'
  if (!form.director?.trim())       errores.director       = 'El director es obligatorio'
  return errores
}

// ─── Helper components ────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const map = {
    'EN CARTELERA': { bg: '#DCFCE7', text: '#008236' },
    'PRÓXIMAMENTE': { bg: '#DBEAFE', text: '#1D4ED8' },
    'ACTIVO':       { bg: '#F3F4F6', text: '#6B7280' },
  }
  const s = map[estado] || { bg: '#F3F4F6', text: '#6B7280' }
  return (
    <span style={{ background: s.bg, color: s.text, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {estado || '—'}
    </span>
  )
}

function GeneroBadge({ genero }) {
  return (
    <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {genero}
    </span>
  )
}

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICON_EDIT    = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
const ICON_EYE     = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
const ICON_DEL     = "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"
const ICON_PLUS    = "M12 5v14M5 12h14"
const ICON_SEARCH  = "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
const ICON_X       = "M18 6 6 18M6 6l12 12"
const ICON_CHECK   = "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
const ICON_WARN    = "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
const ICON_REFRESH = "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"

function Overlay({ children, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}
      >
        {children}
      </div>
    </div>
  )
}

function ConfirmDiscard({ onSi, onNo }) {
  return (
    <Overlay onClose={onNo}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '32px 36px', width: 340, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ color: '#F59E0B', marginBottom: 12 }}><Icon d={ICON_WARN} size={40} /></div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>¿Descartar cambios?</h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>Los cambios no guardados se perderán.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onNo} style={{ padding: '9px 28px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>No</button>
          <button onClick={onSi} style={{ padding: '9px 28px', border: 'none', borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Sí</button>
        </div>
      </div>
    </Overlay>
  )
}

function SuccessOverlay({ mensaje, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '40px 48px', width: 380, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ color: '#22C55E', marginBottom: 16 }}><Icon d={ICON_CHECK} size={48} /></div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#121212', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{mensaje}</h3>
        <button onClick={onClose} style={{ padding: '10px 32px', border: 'none', borderRadius: 8, background: '#1C2566', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Aceptar</button>
      </div>
    </Overlay>
  )
}

function ErrorOverlay({ mensaje, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '40px 48px', width: 400, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ color: '#EF4444', marginBottom: 16 }}><Icon d={ICON_WARN} size={48} /></div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>Error</h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 20px', wordBreak: 'break-word' }}>{mensaje}</p>
        <button onClick={onClose} style={{ padding: '10px 32px', border: 'none', borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
      </div>
    </Overlay>
  )
}

function ConfirmEliminar({ titulo, loading, onCancelar, onEliminar }) {
  return (
    <Overlay onClose={onCancelar}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '32px 36px', width: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>¿Eliminar Película?</h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 6px' }}><strong>{titulo}</strong></p>
        <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 24px', fontWeight: 600 }}>Esta acción no se puede deshacer</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onCancelar} disabled={loading} style={{ padding: '9px 28px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={onEliminar} disabled={loading} style={{ padding: '9px 28px', border: 'none', borderRadius: 8, background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Eliminando...' : 'Eliminar'}</button>
        </div>
      </div>
    </Overlay>
  )
}

function GeneroSelector({ value, onChange, genres, error }) {
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter(x => x !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {genres.map(g => {
          const id = g.id_genero
          const nombre = g.nombre_genero || g.nombre
          const active = value.includes(id)

          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              style={{
                padding: '5px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: active ? 'none' : `1px solid ${error ? '#FCA5A5' : '#D1D5DC'}`,
                background: active ? '#1C2566' : (error ? '#FEF2F2' : '#F9FAFB'),
                color: active ? '#fff' : '#374151',
                transition: 'all 0.15s',
              }}
            >
              {nombre}
            </button>
          )
        })}
      </div>
      {value.length === 0 && (
        <p style={{ fontSize: 12, color: error ? '#EF4444' : '#9CA3AF', margin: '8px 0 0' }}>
          {error || 'Ningún género seleccionado'}
        </p>
      )}
    </div>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ fontSize: 11, color: '#EF4444', margin: '4px 0 0', fontWeight: 500 }}>{msg}</p>
}

// ─── PeliculaForm ─────────────────────────────────────────────────────────────
function PeliculaForm({
  initial,
  onGuardar,
  onCancelar,
  saving,
  genres,
  classifications,
}) {
  const initForm = () => {
    if (initial) {
      return {
        titulo:         initial.titulo         || '',
        sinopsis:       initial.sinopsis       || '',
        duracion:       initial.duracion_minutos ? String(initial.duracion_minutos) : (initial.duracion || ''),
        clasificacion:  initial.clasificacion  || '',
        poster:         initial.poster         || '',
        trailer:        initial.trailer        || '',
        banner:         initial.banner         || '',
        anio_lanzamiento: initial.anio_lanzamiento || '',
        generos:        initial.generos        || [],
        estado:         initial.estado         || 'ACTIVO',
        director:       initial.director       || '',
        elenco:         initial.elenco         || '',
      }
    }
    return {
      titulo: '', generos: [], clasificacion: '', duracion: '',
      director: '', sinopsis: '', elenco: '', trailer: '',
      poster: '', banner: '', estado: 'ACTIVO',
      anio_lanzamiento: '',
    }
  }

  const [form, setForm]           = useState(initForm)
  const [errores, setErrores]     = useState({})
  const [showDiscard, setShowDiscard] = useState(false)

  useEffect(() => {
    if (initial) setForm(initForm())
  }, [initial])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errores[k]) setErrores(prev => ({ ...prev, [k]: undefined }))
  }

  const fieldStyle = (key) => ({
    width: '100%',
    border: `1px solid ${errores[key] ? '#FCA5A5' : '#D1D5DC'}`,
    borderRadius: 8,
    padding: '7px 10px',
    fontSize: 13,
    color: '#374151',
    outline: 'none',
    background: errores[key] ? '#FEF2F2' : '#fff',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  })

  const label = { fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 3 }
  const section = { fontSize: 12, fontWeight: 700, color: '#121212', margin: '0 0 10px', borderBottom: '2px solid #1C2566', paddingBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }

  const handleGuardar = () => {
    const errs = validarForm(form)
    if (Object.keys(errs).length > 0) {
      setErrores(errs)
      return
    }
    onGuardar(form)
  }

  const camposFaltantes = Object.keys(validarForm(form)).length

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', width: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#121212', margin: 0 }}>
            {initial ? 'Editar Película' : 'Nueva Película'}
          </h2>
          <button onClick={() => setShowDiscard(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <Icon d={ICON_X} size={20} />
          </button>
        </div>

          {camposFaltantes > 0 && Object.keys(errores).length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon d={ICON_WARN} size={16} />
            <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 600 }}>
              Completa todos los campos obligatorios ({camposFaltantes} pendiente{camposFaltantes !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        <p style={section}>Información General</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>Título *</label>
            <input style={fieldStyle('titulo')} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Título de la película" />
            <FieldError msg={errores.titulo} />
          </div>
          <div>
            <label style={label}>Clasificación de edad *</label>
            <select style={fieldStyle('clasificacion')} value={form.clasificacion} onChange={e => set('clasificacion', e.target.value)}>
              <option value="">Seleccionar</option>
              {classifications.map(c => <option key={c}>{c}</option>)}
            </select>
            <FieldError msg={errores.clasificacion} />
          </div>
          <div>
            <label style={label}>Duración * <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(minutos, ej: 120)</span></label>
            <input style={fieldStyle('duracion')} value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="120" type="number" min="1" />
            <FieldError msg={errores.duracion} />
          </div>
          <div>
            <label style={label}>Año de lanzamiento * <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(ej: 2025)</span></label>
            <input style={fieldStyle('anio_lanzamiento')} value={form.anio_lanzamiento} onChange={e => set('anio_lanzamiento', e.target.value)} placeholder="2025" type="number" min="1888" max="2100" />
            <FieldError msg={errores.anio_lanzamiento} />
          </div>
          <div>
            <label style={label}>Director *</label>
            <input style={fieldStyle('director')} value={form.director} onChange={e => set('director', e.target.value)} placeholder="Nombre del director" />
            <FieldError msg={errores.director} />
          </div>
          <div>
            <label style={label}>Estado *</label>
            <select style={fieldStyle('estado')} value={form.estado} onChange={e => set('estado', e.target.value)}>
              <option value="EN CARTELERA">En cartelera</option>
              <option value="PRÓXIMAMENTE">Próximamente</option>
              <option value="ACTIVO">Activo</option>
            </select>
            <FieldError msg={errores.estado} />
          </div>
        </div>

        <p style={section}>Géneros *</p>
        <div style={{ marginBottom: 18 }}>
          <label style={{ ...label, marginBottom: 8 }}>Selecciona uno o más géneros</label>
          <GeneroSelector
            value={form.generos}
            onChange={v => { set('generos', v); if (errores.generos) setErrores(prev => ({ ...prev, generos: undefined })) }}
            genres={genres}
            error={errores.generos}
          />
        </div>

        <p style={section}>Multimedia</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={label}>URL Poster *</label>
            <input style={fieldStyle('poster')} value={form.poster} onChange={e => set('poster', e.target.value)} placeholder="https://..." />
            <FieldError msg={errores.poster} />
          </div>
          <div>
            <label style={label}>URL Tráiler *</label>
            <input style={fieldStyle('trailer')} value={form.trailer} onChange={e => set('trailer', e.target.value)} placeholder="https://www.youtube.com/embed/..." />
            <FieldError msg={errores.trailer} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={label}>URL Banner <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opcional)</span></label>
            <input style={fieldStyle('banner')} value={form.banner} onChange={e => set('banner', e.target.value)} placeholder="https://... (imagen horizontal para el banner)" />
          </div>
        </div>

        {form.poster && (
          <div style={{ marginBottom: 10 }}>
            <img src={form.poster} alt="preview" onError={e => e.target.style.display='none'}
              style={{ height: 90, borderRadius: 8, objectFit: 'cover', border: '1px solid #E5E7EB' }} />
          </div>
        )}

        <p style={section}>Descripción</p>
        <div style={{ marginBottom: 12 }}>
          <label style={label}>Sinopsis *</label>
          <textarea style={{ ...fieldStyle('sinopsis'), minHeight: 70, resize: 'vertical' }} value={form.sinopsis} onChange={e => set('sinopsis', e.target.value)} placeholder="Descripción de la película..." />
          <FieldError msg={errores.sinopsis} />
        </div>

        <p style={section}>Reparto *</p>
        <div style={{ marginBottom: 14 }}>
          <label style={label}>Elenco <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(nombres separados por coma)</span></label>
          <textarea style={{ ...fieldStyle('elenco'), minHeight: 60, resize: 'vertical' }} value={form.elenco} onChange={e => set('elenco', e.target.value)} placeholder="Ej: Nicholas Galitzine, Jared Leto, Camila Mendes" />
          <FieldError msg={errores.elenco} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 6, borderTop: '1px solid #F3F4F6' }}>
          <button onClick={() => setShowDiscard(true)} disabled={saving} style={{ padding: '8px 20px', border: '1px solid #D1D5DC', borderRadius: 8, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button
            onClick={handleGuardar}
            disabled={saving}
            style={{
              padding: '8px 24px',
              border: 'none',
              borderRadius: 8,
              background: saving ? '#9CA3AF' : '#1C2566',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Película'}
          </button>
        </div>
      </div>
      {showDiscard && <ConfirmDiscard onSi={onCancelar} onNo={() => setShowDiscard(false)} />}
    </>
  )
}

// ─── VerPelicula ──────────────────────────────────────────────────────────────
function VerPelicula({ movie, onClose }) {
  if (!movie) return null

  const embedTrailer = (url) => {
    if (!url) return null
    if (url.includes('/embed/')) return url
    const match = url.match(/(?:youtu\.be\/|v=)([^&?/]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : url
  }

  return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: 640, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ position: 'relative', height: 210, background: 'linear-gradient(135deg, #1C2566 0%, #0f1642 100%)', overflow: 'hidden' }}>
         {(movie.banner || movie.poster) && (
          <img src={movie.banner || movie.poster} alt="" onError={e => e.target.style.display='none'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }} />
            )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon d={ICON_X} size={16} />
          </button>
          <div style={{ position: 'absolute', bottom: 18, left: 22, display: 'flex', gap: 18, alignItems: 'flex-end' }}>
            <div style={{ width: 88, height: 126, borderRadius: 10, border: '2px solid rgba(255,255,255,0.25)', background: '#364153', overflow: 'hidden', flexShrink: 0 }}>
              {movie.poster
                ? <img src={movie.poster} alt={movie.titulo} onError={e => e.target.style.display='none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>Sin imagen</div>
              }
            </div>
            <div style={{ paddingBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 8px', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{movie.titulo}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {(movie.generos || []).map(g => (
                  <span key={g} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{g}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, flexWrap: 'wrap' }}>
                {movie.clasificacion && <span style={{ color: 'rgba(255,255,255,0.8)' }}><b>Edad:</b> {movie.clasificacion}</span>}
                {movie.duracion      && <span style={{ color: 'rgba(255,255,255,0.8)' }}><b>Duración:</b> {movie.duracion}</span>}
                {movie.director      && <span style={{ color: 'rgba(255,255,255,0.8)' }}><b>Dir:</b> {movie.director}</span>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '22px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <EstadoBadge estado={movie.estado} />
            {movie.clasificacion && (
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>{movie.clasificacion}</span>
            )}
          </div>

          {movie.sinopsis && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#121212', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sinopsis</h3>
              <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.7 }}>{movie.sinopsis}</p>
            </div>
          )}

          {movie.elenco && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#121212', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reparto</h3>
              <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.7 }}>{movie.elenco}</p>
            </div>
          )}

          {movie.trailer && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#121212', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tráiler</h3>
              {embedTrailer(movie.trailer)?.includes('embed') ? (
                <iframe width="100%" height="230" src={embedTrailer(movie.trailer)} title="Trailer"
                  frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen style={{ borderRadius: 10 }} />
              ) : (
                <a
                  href={movie.trailer}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ background: '#1C2566', borderRadius: 10, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', textDecoration: 'none' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M5 3l14 9-14 9V3z"/></svg>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>VER TRÁILER OFICIAL</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Overlay>
  )
}

// ─── MovieCard ─────────────────────────────────────────────────────────────────
function MovieCard({ movie, onEdit, onVer, onEliminar }) {
  return (
    <div className="movie-card">
      <div style={{ aspectRatio: '2/3', background: '#1C2566', position: 'relative', overflow: 'hidden' }}>
        {movie.poster
          ? <img src={movie.poster} alt={movie.titulo} onError={e => e.target.style.display='none'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 4h16M8 4v4m8-4v4"/>
              </svg>
            </div>
        }
        <div style={{ position: 'absolute', top: 8, left: 8 }}>
          <EstadoBadge estado={movie.estado} />
        </div>
      </div>

      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#121212', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3 }}>{movie.titulo}</div>

        {(movie.generos || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {movie.generos.slice(0, 2).map(g => <GeneroBadge key={g} genero={g} />)}
            {movie.generos.length > 2 && <span style={{ fontSize: 10, color: '#9CA3AF', alignSelf: 'center' }}>+{movie.generos.length - 2}</span>}
          </div>
        )}

        {movie.director && (
          <div style={{ fontSize: 11.5, color: '#6B7280' }}>
            <span style={{ fontWeight: 600 }}>Dir. </span>{movie.director}
          </div>
        )}

        <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>
          {[movie.clasificacion, movie.duracion, movie.anio_lanzamiento].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div style={{ padding: '10px 14px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 8 }}>
        <button className="movie-card-btn" onClick={onEdit}     title="Editar"><Icon d={ICON_EDIT} size={15} /></button>
        <button className="movie-card-btn" onClick={onVer}      title="Ver"><Icon d={ICON_EYE}  size={15} /></button>
        <button className="movie-card-btn btn-del" onClick={onEliminar} title="Eliminar"><Icon d={ICON_DEL}  size={15} /></button>
      </div>
    </div>
  )
}

// ─── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ total, page, perPage, onPage }) {
  const pages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, padding: '0 2px' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>Mostrando <b>{start}</b>–<b>{end}</b> de <b>{total}</b></span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: page === 1 ? 'default' : 'pointer', border: '1px solid #D1D5DC', background: '#fff', color: page === 1 ? '#D1D5DC' : '#374151' }}>Anterior</button>
        {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: p === page ? '#1C2566' : '#fff', color: p === page ? '#fff' : '#374151', border: p === page ? 'none' : '1px solid #D1D5DC' }}>{p}</button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === pages} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: page === pages ? 'default' : 'pointer', border: '1px solid #D1D5DC', background: '#fff', color: page === pages ? '#D1D5DC' : '#374151' }}>Siguiente</button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CatalogoPeliculas() {
  const [movies, setMovies]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [buscar, setBuscar]             = useState('')
  const [genres, setGenres]             = useState([])
  const [classifications, setClassifications] = useState([])
  const [filtroGenero, setFiltroGenero] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroClasif, setFiltroClasif] = useState('')
  const [page, setPage]                 = useState(1)
  const PER_PAGE = 12

  const [modalAdd, setModalAdd]     = useState(false)
  const [modalEdit, setModalEdit]   = useState(null)
  const [modalVer, setModalVer]     = useState(null)
  const [modalDel, setModalDel]     = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [detailsCache, setDetailsCache] = useState({})
  const fetchedIds = useRef(new Set())

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.list()
      setMovies((Array.isArray(data) ? data : []).map(backendToFrontend))
    } catch (e) {
      setErrorMsg(`Error al cargar películas: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMeta = useCallback(async () => {
    try {
      const [genresData, classificationsData] = await Promise.all([
        api.genres(),
        api.classifications(),
      ])
      setGenres(genresData || [])
      setClassifications((classificationsData || []).map(c => typeof c === 'string' ? c : c.nombre))
    } catch (e) {
      setErrorMsg(`Error cargando filtros: ${e.message}`)
    }
  }, [])

  useEffect(() => {
    fetchMovies()
    loadMeta()
  }, [fetchMovies, loadMeta])

  const handleCreate = async (formData) => {
    setSaving(true)
    try {
      const payload = frontendToBackend(formData, 'create')
      const created = await api.create(payload)
      const movieId = created.id_pelicula || created.id
      const det = await api.details(movieId)
      const parsed = backendToFrontend(det)
      const newMovie = {
        ...parsed,
        generos:  formData.generos
                      .map(id => {
                      const g = genres.find(g => g.id_genero === id)
                      return g ? (g.nombre_genero || g.nombre) : null
                    })
                    .filter(Boolean),
        director:  det.director || '',
        elenco:    det.elenco || '',
      }
      setMovies(prev => [...prev, newMovie])
      setDetailsCache(prev => ({ ...prev, [movieId]: { director: newMovie.director, elenco: newMovie.elenco } }))
      setModalAdd(false)
      setSuccessMsg('PELÍCULA AÑADIDA CORRECTAMENTE')
    } catch (e) {
      setErrorMsg(`Error al crear película: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (formData) => {
    setSaving(true)
    try {
      const payload = frontendToBackend(formData, 'update')
      await api.update(modalEdit.id, payload)
      const det = await api.details(modalEdit.id)
      const parsed = backendToFrontend(det)
      const updatedMovie = {
        ...parsed,
        id:        modalEdit.id,
        generos:  formData.generos
                    .map(id => {
                      const g = genres.find(g => g.id_genero === id)
                      return g ? (g.nombre_genero || g.nombre) : null
                    })
                    .filter(Boolean),
        director:  det.director || '',
        elenco:    det.elenco || '',
        duracion:  parsed.duracion,
      }
      setMovies(prev => prev.map(m => m.id === modalEdit.id ? updatedMovie : m))
      setDetailsCache(prev => ({ ...prev, [modalEdit.id]: { director: updatedMovie.director, elenco: updatedMovie.elenco } }))
      setModalEdit(null)
      setSuccessMsg('PELÍCULA EDITADA CORRECTAMENTE')
    } catch (e) {
      setErrorMsg(`Error al actualizar película: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(modalDel.id)
      setMovies(prev => prev.filter(m => m.id !== modalDel.id))
      setDetailsCache(prev => { const n = { ...prev }; delete n[modalDel.id]; return n })
      setModalDel(null)
    } catch (e) {
      setErrorMsg(`Error al eliminar película: ${e.message}`)
      setModalDel(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleVer = async (movie) => {
    try {
      const details = await api.details(movie.id)
      const parsed = backendToFrontend(details)
      setModalVer({
        ...parsed,
        generos:  (details.generos  || []).map(g => g.nombre_genero ?? g.nombre ?? g),
        elenco:   parsed.elenco   || '',
        director: parsed.director || '',
        poster:   parsed.poster   || movie.poster,
        trailer:  parsed.trailer  || movie.trailer,
        banner:   parsed.banner   || movie.banner,
      })
    } catch (e) {
      setErrorMsg(`Error al cargar detalles: ${e.message}`)
    }
  }

  const filtered = movies.filter(m => {
    const q = buscar.toLowerCase()
    if (q && !(m.titulo || '').toLowerCase().includes(q)) return false
    if (filtroGenero && !(m.generos || []).includes(filtroGenero)) return false
    if (filtroEstado && m.estado !== filtroEstado) return false
    if (filtroClasif && m.clasificacion !== filtroClasif) return false
    return true
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const enrichedPaginated = paginated.map(m => ({
    ...m,
    ...(detailsCache[m.id] || {}),
  }))

  // Enrich current page movies with director/actor data from details endpoint
  useEffect(() => {
    const idsToFetch = paginated
      .filter(m => m.id && !fetchedIds.current.has(m.id))
      .map(m => m.id)
    if (idsToFetch.length === 0) return
    idsToFetch.forEach(id => fetchedIds.current.add(id))
    const doFetch = async () => {
      const results = await Promise.allSettled(
        idsToFetch.map(id => api.details(id))
      )
      const newCache = {}
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          const det = r.value
          const parsed = backendToFrontend(det)
          newCache[idsToFetch[idx]] = {
            director: parsed.director || '',
            elenco: parsed.elenco || '',
          }
        }
      })
      if (Object.keys(newCache).length > 0) {
        setDetailsCache(prev => ({ ...prev, ...newCache }))
      }
    }
    doFetch()
  }, [paginated])

  const dropStyle = {
    background: '#fff', border: '1px solid #D1D5DC', borderRadius: 10,
    padding: '10px 36px 10px 14px', fontSize: 14, color: '#374151',
    cursor: 'pointer', outline: 'none', appearance: 'none', minWidth: 150,
  }

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Catálogo de Películas</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>
            {loading ? 'Cargando...' : `${filtered.length} película${filtered.length !== 1 ? 's' : ''} encontrada${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchMovies} title="Recargar" style={{ background: '#F9FAFB', color: '#374151', border: '1px solid #D1D5DC', borderRadius: 10, padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Icon d={ICON_REFRESH} size={16} />
          </button>
          <button onClick={() => setModalAdd(true)}
            onMouseEnter={e => e.currentTarget.style.background = '#1a3a8a'}
            onMouseLeave={e => e.currentTarget.style.background = '#1C2566'}
            style={{ background: '#1C2566', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(28,37,102,0.3)', transition: 'background 0.15s' }}>
            <Icon d={ICON_PLUS} size={16} />
            Nueva Película
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}><Icon d={ICON_SEARCH} size={16} /></span>
          <input type="text" placeholder="Buscar por título..." value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1) }}
            style={{ width: '100%', border: '1px solid #D1D5DC', borderRadius: 10, padding: '10px 14px 10px 38px', fontSize: 14, color: '#374151', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filtroGenero} onChange={e => { setFiltroGenero(e.target.value); setPage(1) }} style={dropStyle}>
            <option value="">GÉNERO</option>
              {genres.map(g => {
              const nombre = typeof g === 'string' ? g : (g.nombre_genero || g.nombre)
              return <option key={nombre} value={nombre}>{nombre}</option>
            })}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 11 }}>▼</span>
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }} style={dropStyle}>
            <option value="">ESTADO</option>
            <option value="EN CARTELERA">En cartelera</option>
            <option value="PRÓXIMAMENTE">Próximamente</option>
            <option value="ACTIVO">Activo</option>
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 11 }}>▼</span>
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filtroClasif} onChange={e => { setFiltroClasif(e.target.value); setPage(1) }} style={dropStyle}>
            <option value="">CLASIFICACIÓN</option>
            {classifications.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 11 }}>▼</span>
        </div>
        {(filtroGenero || filtroEstado || filtroClasif || buscar) && (
          <button onClick={() => { setBuscar(''); setFiltroGenero(''); setFiltroEstado(''); setFiltroClasif(''); setPage(1) }}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Grid */}
      {loading
        ? <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF', fontSize: 15 }}>Cargando películas...</div>
        : enrichedPaginated.length === 0
        ? <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF', fontSize: 15 }}>No se encontraron películas.</div>
        : <div className="movies-grid">
            {enrichedPaginated.map(m => (
              <MovieCard
                key={m.id}
                movie={m}
                onEdit={async () => {
                  try {
                    const details = await api.details(m.id)
                    const generoIds = (details.generos || []).map(g => {
                      const nombre = g.nombre_genero ?? g.nombre ?? g
                      const found = genres.find(gen => (gen.nombre_genero || gen.nombre) === nombre)
                      return found ? found.id_genero : null
                    }).filter(Boolean)
                    const parsed = backendToFrontend(details)
                    setModalEdit({
                      ...parsed,
                      id: m.id,
                      generos: generoIds,
                      director: parsed.director,
                      elenco: parsed.elenco || m.elenco || '',
                    })
                  } catch (e) {
                    setModalEdit({
                      ...m,
                    })
                  }
                }}
                onVer={() => handleVer(m)}
                onEliminar={() => setModalDel(m)}
              />
            ))}
          </div>
      }

      {!loading && filtered.length > PER_PAGE && (
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPage={setPage} />
      )}

      {modalAdd && (
        <Overlay onClose={() => {}}>
          <PeliculaForm
            saving={saving}
            onGuardar={handleCreate}
            onCancelar={() => setModalAdd(false)}
            genres={genres}
            classifications={classifications}
          />
        </Overlay>
      )}

      {modalEdit && (
        <Overlay onClose={() => {}}>
          <PeliculaForm
            initial={modalEdit}
            saving={saving}
            onGuardar={handleUpdate}
            onCancelar={() => setModalEdit(null)}
            genres={genres}
            classifications={classifications}
          />
        </Overlay>
      )}

      {modalVer && <VerPelicula movie={modalVer} onClose={() => setModalVer(null)} />}

      {modalDel && (
        <ConfirmEliminar titulo={modalDel.titulo} loading={deleting} onCancelar={() => setModalDel(null)} onEliminar={handleDelete} />
      )}

      {successMsg && <SuccessOverlay mensaje={successMsg} onClose={() => setSuccessMsg('')} />}
      {errorMsg   && <ErrorOverlay  mensaje={errorMsg}   onClose={() => setErrorMsg('')} />}
    </div>
  )
}
