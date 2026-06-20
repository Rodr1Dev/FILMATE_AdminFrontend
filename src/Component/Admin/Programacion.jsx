import React, { useState, useEffect, useCallback, useMemo } from 'react'

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const API_SHOWTIMES = '/api/admin/showtimes'
const API_MOVIES    = '/api/admin/movies'
const API_CINEMAS   = '/api/admin/cinemas'
const API_ROOMS     = '/api/admin/rooms'

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  if (res.status === 204) return null
  return res.json()
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

// ─── ESTILOS COMPARTIDOS ──────────────────────────────────────────────────────
const inputStyle = {
  border: '1px solid #D1D5DC', borderRadius: 8, padding: '9px 12px',
  fontSize: 14, color: '#222', background: '#F9FAFB', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
}
const btnPrimario = {
  background: '#1C2566', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
const btnSecundario = {
  background: '#fff', color: '#4A5565', border: '1px solid #D1D5DC', borderRadius: 8,
  padding: '9px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
}
const btnPeligro = {
  background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}

function Field({ label, children, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#364153', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

// ─── HELPERS CALENDARIO ───────────────────────────────────────────────────────
function getDiasDelMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1)
  const ultimoDia = new Date(anio, mes + 1, 0)
  // lunes=0 ... domingo=6
  let inicioSemana = primerDia.getDay() - 1
  if (inicioSemana < 0) inicioSemana = 6
  const dias = []
  for (let i = 0; i < inicioSemana; i++) dias.push(null)
  for (let d = 1; d <= ultimoDia.getDate(); d++) dias.push(d)
  return dias
}

function fechaStr(anio, mes, dia) {
  return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function formatHora(fechaHora) {
  if (!fechaHora) return ''
  const d = new Date(fechaHora)
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatFechaHora(fechaHora) {
  if (!fechaHora) return ''
  const d = new Date(fechaHora)
  return d.toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

// ─── Parseo de "horarios_apertura" del cine, ej: "Lunes a Domingo: 10:00AM - 10:00PM" ──
const DIAS_SEMANA_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] // índice = Date.getDay()

function parseHorarioCine(horariosApertura) {
  if (!horariosApertura) return null
  const matchHoras = horariosApertura.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!matchHoras) return null
  const to24 = (h, m, ampm) => {
    let hh = Number(h)
    if (/pm/i.test(ampm) && hh !== 12) hh += 12
    if (/am/i.test(ampm) && hh === 12) hh = 0
    return hh * 60 + Number(m) // minutos desde medianoche
  }
  const minutosApertura = to24(matchHoras[1], matchHoras[2], matchHoras[3])
  const minutosCierre   = to24(matchHoras[4], matchHoras[5], matchHoras[6])

  // Días: buscamos nombres de día textuales antes de los dos puntos
  const ORDEN_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const partePrevia = horariosApertura.split(':').slice(0, -2).join(':') // texto antes de la hora
  let diasActivos
  const matchRango = partePrevia.match(/(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s*a\s*(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)/i)
  if (matchRango) {
    const i1 = ORDEN_DIAS.findIndex(d => d.toLowerCase() === matchRango[1].toLowerCase())
    const i2 = ORDEN_DIAS.findIndex(d => d.toLowerCase() === matchRango[2].toLowerCase())
    diasActivos = ORDEN_DIAS.slice(i1, i2 + 1)
  } else {
    diasActivos = ORDEN_DIAS.filter(d => partePrevia.toLowerCase().includes(d.toLowerCase()))
  }
  if (diasActivos.length === 0) diasActivos = [...ORDEN_DIAS] // si no se reconoce, no restringir por día

  return { minutosApertura, minutosCierre, diasActivos }
}

function validarDentroHorarioCine(fechaHoraISO, duracionMin, horariosApertura) {
  const horario = parseHorarioCine(horariosApertura)
  if (!horario) return { valido: true } // sin info de horario, no se puede validar -> se permite
  const d = new Date(fechaHoraISO)
  const diaNombre = DIAS_SEMANA_FULL[d.getDay()]
  if (!horario.diasActivos.includes(diaNombre)) {
    return { valido: false, motivo: `El cine no atiende los días ${diaNombre}.` }
  }
  const minutosInicio = d.getHours() * 60 + d.getMinutes()
  const minutosFin    = minutosInicio + duracionMin
  if (minutosInicio < horario.minutosApertura || minutosFin > horario.minutosCierre) {
    const fmt = (min) => {
      let hh = Math.floor(min / 60) % 24
      const mm = min % 60
      const ampm = hh >= 12 ? 'PM' : 'AM'
      let h12 = hh % 12; if (h12 === 0) h12 = 12
      return `${h12}:${String(mm).padStart(2, '0')}${ampm}`
    }
    return { valido: false, motivo: `Fuera del horario de atención (${fmt(horario.minutosApertura)} - ${fmt(horario.minutosCierre)}).` }
  }
  return { valido: true }
}

// ─── MODAL CONFIRMAR ELIMINACIÓN ─────────────────────────────────────────────
function ModalConfirmar({ mensaje, onConfirmar, onCancelar, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 380, padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>¿Eliminar función?</h3>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>{mensaje}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancelar} style={btnSecundario}>Cancelar</button>
          <button onClick={onConfirmar} disabled={loading} style={{ ...btnPeligro, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PASO 1: SELECCIÓN DE CINES ───────────────────────────────────────────────
function ModalSeleccionCines({ cines, onConfirmar, onClose }) {
  const cinesActivos = cines.filter(c => c.estado_cine === 'Activo')
  const [seleccionados, setSeleccionados] = useState([])
  const todosSeleccionados = seleccionados.length === cinesActivos.length && cinesActivos.length > 0

  const toggleCine = (id) => setSeleccionados(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )
  const toggleTodos = () => setSeleccionados(todosSeleccionados ? [] : cinesActivos.map(c => c.id_cine))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#121212', margin: 0 }}>Programar función</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF' }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 18px' }}>Selecciona los cines donde se programará esta función.</p>

        {/* Toggle todos */}
        <button
          onClick={toggleTodos}
          style={{ ...btnSecundario, marginBottom: 12, fontSize: 13, padding: '7px 14px', alignSelf: 'flex-start', borderColor: todosSeleccionados ? '#1C2566' : '#D1D5DC', color: todosSeleccionados ? '#1C2566' : '#4A5565', fontWeight: todosSeleccionados ? 700 : 500 }}
        >
          {todosSeleccionados ? '✓ Deseleccionar todos' : 'Seleccionar todos'}
        </button>

        {/* Lista cines */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cinesActivos.length === 0 && (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>No hay cines activos disponibles.</p>
          )}
          {cinesActivos.map(cine => {
            const sel = seleccionados.includes(cine.id_cine)
            return (
              <div
                key={cine.id_cine}
                onClick={() => toggleCine(cine.id_cine)}
                style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${sel ? '#1C2566' : '#E5E7EB'}`,
                  background: sel ? '#EEF2FF' : '#F9FAFB',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, border: `2px solid ${sel ? '#1C2566' : '#D1D5DC'}`,
                  background: sel ? '#1C2566' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {sel && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#121212' }}>{cine.nombre_cine}</div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>{cine.direccion}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{seleccionados.length} cine(s) seleccionado(s)</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={btnSecundario}>Cancelar</button>
            <button
              onClick={() => seleccionados.length > 0 && onConfirmar(seleccionados)}
              disabled={seleccionados.length === 0}
              style={{ ...btnPrimario, opacity: seleccionados.length === 0 ? 0.5 : 1 }}
            >
              Continuar →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PASO 2: FORMULARIO POR CINE ──────────────────────────────────────────────
function ModalFormFuncion({ cine, peliculas, salas, showtimes, totalCines, indexActual, fechaInicial, onGuardar, onAtras, onClose }) {
  const salasDeCine = salas.filter(s => s.id_cine === cine.id_cine)
  const [idPelicula, setIdPelicula] = useState('')
  const [idSala,     setIdSala]     = useState('')
  const [fechaHora,  setFechaHora]  = useState(fechaInicial ?? '')
  const [precio,     setPrecio]     = useState('')

  // ── Detectar cruce en tiempo real ──
  const cruce = useMemo(() => {
    if (!idSala || !fechaHora || !idPelicula) return null
    const pelicula    = peliculas.find(p => p.id_pelicula === Number(idPelicula))
    const duracion    = pelicula?.duracion_minutos ?? 0
    const nuevoInicio = new Date(fechaHora).getTime()
    const nuevoFin    = nuevoInicio + duracion * 60000

    return showtimes.find(st => {
      if (st.id_sala !== Number(idSala)) return false
      // Verificar que la sala pertenece al mismo cine
      const salaSt = salas.find(s => s.id_sala === st.id_sala)
      if (salaSt?.id_cine !== cine.id_cine) return false
      const pelSt       = peliculas.find(p => p.id_pelicula === st.id_pelicula)
      const durSt       = pelSt?.duracion_minutos ?? 0
      const stInicio    = new Date(st.fecha_hora).getTime()
      const stFin       = stInicio + durSt * 60000
      return nuevoInicio < stFin && nuevoFin > stInicio
    }) ?? null
  }, [idSala, fechaHora, idPelicula, showtimes, peliculas, salas, cine.id_cine])

  // ── Detectar fuera de horario de atención del cine ──
  const fueraDeHorario = useMemo(() => {
    if (!fechaHora || !idPelicula) return null
    const pelicula = peliculas.find(p => p.id_pelicula === Number(idPelicula))
    const duracion = pelicula?.duracion_minutos ?? 0
    const resultado = validarDentroHorarioCine(fechaHora, duracion, cine.horarios_apertura)
    return resultado.valido ? null : resultado.motivo
  }, [fechaHora, idPelicula, cine.horarios_apertura])

  // ── Detectar fecha/hora en el pasado ──
  const enElPasado = useMemo(() => {
    if (!fechaHora) return false
    return new Date(fechaHora).getTime() < Date.now()
  }, [fechaHora])

  // mínimo seleccionable = ahora mismo, formateado para datetime-local
  const ahoraLocal = useMemo(() => {
    const d = new Date()
    d.setSeconds(0, 0)
    const offset = d.getTimezoneOffset()
    const local = new Date(d.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }, [])

  const camposCompletos = idPelicula && idSala && fechaHora && precio
  const puedeGuardar    = camposCompletos && !cruce && !fueraDeHorario && !enElPasado

  const inputError = { ...inputStyle, borderColor: '#EF4444', background: '#FFF1F2' }

  const handleGuardar = () => {
    if (!puedeGuardar) return
    const pelicula = peliculas.find(p => p.id_pelicula === Number(idPelicula))
    const sala     = salas.find(s => s.id_sala === Number(idSala))
    onGuardar({
      id_pelicula:  Number(idPelicula),
      id_sala:      Number(idSala),
      fecha_hora:   fechaHora,
      precio_base:  Number(precio),
      _pelicula:    pelicula?.titulo ?? '—',
      _sala:        sala?.nombre_sala ?? '—',
      _cine:        cine.nombre_cine,
      _id_cine:     cine.id_cine,
      _duracion:    pelicula?.duracion_minutos ?? 0,
    })
  }

  // Película que choca (para el mensaje)
  const peliculaCruce = cruce ? (peliculas.find(p => p.id_pelicula === cruce.id_pelicula)?.titulo ?? 'otra función') : null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1600 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480, padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Cine {indexActual + 1} de {totalCines}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#121212', margin: 0 }}>{cine.nombre_cine}</h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>{cine.direccion}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9CA3AF' }}>×</button>
        </div>

        {/* Progreso */}
        <div style={{ display: 'flex', gap: 4, margin: '16px 0 20px' }}>
          {Array.from({ length: totalCines }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= indexActual ? '#1C2566' : '#E5E7EB' }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Película" required>
            <select value={idPelicula} onChange={e => setIdPelicula(e.target.value)} style={inputStyle}>
              <option value="">Seleccionar película...</option>
              {peliculas.map(p => <option key={p.id_pelicula} value={p.id_pelicula}>{p.titulo}</option>)}
            </select>
          </Field>

          <Field label="Sala" required>
            <select
              value={idSala}
              onChange={e => setIdSala(e.target.value)}
              style={cruce ? inputError : inputStyle}
            >
              <option value="">Seleccionar sala...</option>
              {salasDeCine.length === 0
                ? <option disabled>Sin salas activas en este cine</option>
                : salasDeCine.map(s => <option key={s.id_sala} value={s.id_sala}>{s.nombre_sala} — {s.tipo_sala} {s.tipo_formato}</option>)
              }
            </select>
          </Field>

          <Field label="Fecha y hora" required>
            <input
              type="datetime-local"
              value={fechaHora}
              min={ahoraLocal}
              onChange={e => setFechaHora(e.target.value)}
              style={(cruce || fueraDeHorario || enElPasado) ? inputError : inputStyle}
            />
          </Field>

          <Field label="Precio base (S/.)" required>
            <input type="number" min="0" step="0.50" value={precio} onChange={e => setPrecio(e.target.value)}
              placeholder="Ej. 18.00" style={inputStyle} />
          </Field>
        </div>

        {/* Mensaje de cruce */}
        {cruce && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#C2410C' }}>
            ⚠️ Esta función se cruza con <strong>{peliculaCruce}</strong> en la misma sala. Cambia la sala o el horario.
          </div>
        )}

        {/* Mensaje de fuera de horario de atención */}
        {!cruce && fueraDeHorario && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#C2410C' }}>
            ⚠️ {fueraDeHorario}
          </div>
        )}

        {/* Mensaje de fecha en el pasado */}
        {!cruce && !fueraDeHorario && enElPasado && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF1F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 13, color: '#C2410C' }}>
            ⚠️ No puedes programar una función en una fecha u hora que ya pasó.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 22 }}>
          {(indexActual > 0 && totalCines > 1) ? (
            <button onClick={onAtras} style={btnSecundario}>← Cine anterior</button>
          ) : <span />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={btnSecundario}>Cancelar</button>
            <button
              onClick={handleGuardar}
              disabled={!puedeGuardar}
              style={{ ...btnPrimario, opacity: puedeGuardar ? 1 : 0.4, cursor: puedeGuardar ? 'pointer' : 'not-allowed' }}
            >
              {indexActual + 1 < totalCines ? 'Guardar y continuar →' : 'Guardar y ver resumen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PASO 3: RESUMEN FINAL ───────────────────────────────────────────────────
function ModalResumen({ funciones, onAplicar, onDescartar, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1700 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 580, padding: '28px 32px', boxShadow: '0 8px 40px rgba(0,0,0,0.2)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#121212', margin: '0 0 4px' }}>Resumen de funciones</h2>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Revisa las funciones antes de aplicar los cambios.</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {funciones.map((f, i) => (
            <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#121212', marginBottom: 4 }}>{f._pelicula}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    🏛️ {f._cine} &nbsp;·&nbsp; 🎬 {f._sala}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    🕐 {formatFechaHora(f.fecha_hora)} &nbsp;·&nbsp; 💰 S/. {Number(f.precio_base).toFixed(2)}
                  </div>
                </div>
                <span style={{ background: '#EEF2FF', color: '#1C2566', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                  #{i + 1}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{funciones.length} función(es) a crear</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onDescartar} style={{ ...btnSecundario, color: '#EF4444', borderColor: '#FCA5A5' }}>
              Descartar todo
            </button>
            <button onClick={onAplicar} disabled={loading} style={{ ...btnPrimario, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Aplicando…' : '✓ Aplicar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Programacion() {
  // Datos
  const [showtimes, setShowtimes] = useState([])
  const [peliculas, setPeliculas] = useState([])
  const [cines,     setCines]     = useState([])
  const [salas,     setSalas]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // Calendario
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes,  setMes]  = useState(hoy.getMonth())
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate())
  const [peliculaExpandida, setPeliculaExpandida] = useState(null)

  // Eliminación
  const [confirmarElim, setConfirmarElim] = useState(null)
  const [loadingElim,   setLoadingElim]   = useState(false)

  // Flujo creación
  const [paso,              setPaso]              = useState(null)  // null | 'cines' | 'form' | 'resumen'
  const [cinesSeleccionados, setCinesSeleccionados] = useState([])
  const [indexCine,         setIndexCine]         = useState(0)
  const [borrador,          setBorrador]          = useState([])  // funciones acumuladas
  const [fechaPreseleccionada, setFechaPreseleccionada] = useState(null)

  // ── Carga de datos ──
  const cargarTodo = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [st, mv, ci, rm] = await Promise.all([
        apiFetch(`${API_SHOWTIMES}/`),
        apiFetch(`${API_MOVIES}/`),
        apiFetch(`${API_CINEMAS}/`),
        apiFetch(`${API_ROOMS}/`),
      ])
      setShowtimes(st)
      setPeliculas(mv)
      setCines(ci)
      setSalas(rm)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  // ── Funciones del día seleccionado ──
  const fechaSel = fechaStr(anio, mes, diaSeleccionado)
  const funcionesDia = useMemo(() => {
    return showtimes.filter(st => {
      const d = new Date(st.fecha_hora)
      return fechaStr(d.getFullYear(), d.getMonth(), d.getDate()) === fechaSel
    })
  }, [showtimes, fechaSel])

  // Agrupar por película
  const peliculasDia = useMemo(() => {
    const map = {}
    funcionesDia.forEach(st => {
      const pelicula = peliculas.find(p => p.id_pelicula === st.id_pelicula)
      const titulo = pelicula?.titulo ?? `Película #${st.id_pelicula}`
      if (!map[st.id_pelicula]) map[st.id_pelicula] = { id: st.id_pelicula, titulo, funciones: [] }
      const sala  = salas.find(s => s.id_sala === st.id_sala)
      const cine  = cines.find(c => c.id_cine === sala?.id_cine)
      map[st.id_pelicula].funciones.push({ ...st, _sala: sala?.nombre_sala ?? '—', _cine: cine?.nombre_cine ?? '—', _duracion: pelicula?.duracion_minutos ?? 0 })
    })
    return Object.values(map)
  }, [funcionesDia, peliculas, salas, cines])

  // ── Días con funciones (para marcar en calendario) ──
  const diasConFunciones = useMemo(() => {
    const set = new Set()
    showtimes.forEach(st => {
      const d = new Date(st.fecha_hora)
      if (d.getFullYear() === anio && d.getMonth() === mes) set.add(d.getDate())
    })
    return set
  }, [showtimes, anio, mes])

  // ── Navegar mes ──
  const mesPrev = () => { if (mes === 0) { setMes(11); setAnio(a => a - 1) } else setMes(m => m - 1); setDiaSeleccionado(1); setPeliculaExpandida(null) }
  const mesSig  = () => { if (mes === 11) { setMes(0); setAnio(a => a + 1) } else setMes(m => m + 1); setDiaSeleccionado(1); setPeliculaExpandida(null) }

  // ── Eliminar función ──
  const handleEliminar = async () => {
    setLoadingElim(true)
    try {
      await apiFetch(`${API_SHOWTIMES}/${confirmarElim.id_funcion}`, { method: 'DELETE' })
      await cargarTodo()
      setConfirmarElim(null)
      setPeliculaExpandida(null)
    } catch (e) { alert('Error al eliminar: ' + e.message) }
    finally { setLoadingElim(false) }
  }

  // ── Flujo creación ──
  const iniciarFlujo = (fechaDia = null) => {
    setBorrador([])
    setIndexCine(0)
    setFechaPreseleccionada(fechaDia ? `${fechaDia}T13:00` : null)
    setPaso('cines')
  }

  const handleCinesConfirmados = (ids) => {
    const cinesToUse = cines.filter(c => ids.includes(c.id_cine))
    setCinesSeleccionados(cinesToUse)
    setIndexCine(0)
    setBorrador([])
    setPaso('form')
  }

  const handleFormGuardado = (funcion) => {
    const nuevoBorrador = [...borrador, funcion]
    setBorrador(nuevoBorrador)
    if (indexCine + 1 < cinesSeleccionados.length) {
      setIndexCine(i => i + 1)
    } else {
      setPaso('resumen')
    }
  }

  const handleAplicar = async () => {
    setLoading(true)
    try {
      for (const f of borrador) {
        await apiFetch(`${API_SHOWTIMES}/`, {
          method: 'POST',
          body: JSON.stringify({ id_pelicula: f.id_pelicula, id_sala: f.id_sala, fecha_hora: f.fecha_hora, precio_base: f.precio_base }),
        })
      }
      setPaso(null)
      setBorrador([])
      await cargarTodo()
    } catch (e) { alert('Error al guardar: ' + e.message) }
    finally { setLoading(false) }
  }

  // ── Retroceder al cine anterior dentro del flujo de creación ──
  const handleAtras = () => {
    if (indexCine === 0) return
    setBorrador(prev => prev.slice(0, -1)) // descarta la función del cine actual que aún no se confirmó retroceder
    setIndexCine(i => i - 1)
  }

  const cerrarFlujo = () => { setPaso(null); setBorrador([]); setIndexCine(0); setFechaPreseleccionada(null) }

  // ── Render ──
  const diasDelMes = getDiasDelMes(anio, mes)

  return (
    <div style={{ padding: '28px 28px 40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Título */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Programación</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>Calendarización de funciones por cine y sala</p>
        </div>
        <button onClick={iniciarFlujo} style={{ ...btnPrimario, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Programar función
        </button>
      </div>

      {loading && !showtimes.length ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 14 }}>Cargando datos…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#EF4444', fontSize: 14 }}>⚠️ {error}</div>
      ) : (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* ── Calendario ── */}
          <div style={{ width: 380, minWidth: 380, background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

            {/* Nav mes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <button onClick={mesPrev} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#121212' }}>{MESES[mes]} {anio}</span>
              <button onClick={mesSig} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Días semana */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 12px 4px' }}>
              {DIAS_SEMANA.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            {/* Días */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px 16px', gap: 2 }}>
              {diasDelMes.map((dia, i) => {
                if (!dia) return <div key={`v${i}`} />
                const esSel  = dia === diaSeleccionado
                const esHoy  = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
                const tieneF = diasConFunciones.has(dia)
                return (
                  <div
                    key={dia}
                    onClick={() => { setDiaSeleccionado(dia); setPeliculaExpandida(null) }}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 9, cursor: 'pointer',
                      background: esSel ? '#1C2566' : esHoy ? '#EEF2FF' : 'transparent',
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!esSel) e.currentTarget.style.background = '#F3F4F6' }}
                    onMouseLeave={e => { if (!esSel) e.currentTarget.style.background = esHoy ? '#EEF2FF' : 'transparent' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: esSel || esHoy ? 700 : 400, color: esSel ? '#fff' : esHoy ? '#1C2566' : '#374151' }}>
                      {dia}
                    </span>
                    {tieneF && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: esSel ? 'rgba(255,255,255,0.8)' : '#FFB300', marginTop: 2 }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Leyenda */}
            <div style={{ padding: '10px 20px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 16, fontSize: 11, color: '#9CA3AF' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB300' }} /> Con funciones
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: '#1C2566' }} /> Día seleccionado
              </span>
            </div>
          </div>

          {/* ── Panel derecho: funciones del día ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#121212', margin: 0 }}>
                  {diaSeleccionado} de {MESES[mes]}, {anio}
                </h2>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '3px 0 0' }}>
                  {peliculasDia.length === 0 ? 'Sin funciones programadas' : `${funcionesDia.length} función(es) en ${peliculasDia.length} película(s)`}
                </p>
              </div>

              {peliculasDia.length === 0 ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
                  <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>No hay funciones para este día.</p>
                  <button onClick={() => iniciarFlujo(fechaSel)} style={{ ...btnPrimario, marginTop: 16, fontSize: 13, padding: '8px 18px' }}>
                    + Programar función
                  </button>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {peliculasDia.map(peli => {
                    const expandida = peliculaExpandida === peli.id
                    return (
                      <div key={peli.id} style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                        {/* Fila película */}
                        <div
                          onClick={() => setPeliculaExpandida(expandida ? null : peli.id)}
                          style={{ padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandida ? '#F8F9FF' : '#fff', transition: 'background 0.12s' }}
                          onMouseEnter={e => { if (!expandida) e.currentTarget.style.background = '#F9FAFB' }}
                          onMouseLeave={e => { if (!expandida) e.currentTarget.style.background = '#fff' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1C2566', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#121212' }}>{peli.titulo}</div>
                              <div style={{ fontSize: 12, color: '#9CA3AF' }}>{peli.funciones.length} función(es)</div>
                            </div>
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandida ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>

                        {/* Funciones expandidas */}
                        {expandida && (
                          <div style={{ borderTop: '1px solid #F3F4F6', background: '#FAFBFF' }}>
                            {peli.funciones.map(f => (
                              <div key={f.id_funcion} style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#374151', flexWrap: 'wrap' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ fontSize: 15 }}>🕐</span>
                                    {formatHora(f.fecha_hora)}
                                    {f._duracion > 0 && (
                                      <span style={{ color: '#9CA3AF' }}>
                                        → {formatHora(new Date(new Date(f.fecha_hora).getTime() + f._duracion * 60000).toISOString())}
                                      </span>
                                    )}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ fontSize: 15 }}>🏛️</span> {f._cine}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ fontSize: 15 }}>🎬</span> {f._sala}
                                  </span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#1C2566' }}>
                                    S/. {Number(f.precio_base).toFixed(2)}
                                  </span>
                                </div>
                                {/* Eliminar función */}
                                <button
                                  onClick={() => setConfirmarElim(f)}
                                  title="Eliminar función"
                                  style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#FCA5A5' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = '#E5E7EB' }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modales de flujo ── */}
      {paso === 'cines' && (
        <ModalSeleccionCines
          cines={cines}
          onConfirmar={handleCinesConfirmados}
          onClose={cerrarFlujo}
        />
      )}

      {paso === 'form' && cinesSeleccionados[indexCine] && (
        <ModalFormFuncion
          cine={cinesSeleccionados[indexCine]}
          peliculas={peliculas}
          salas={salas}
          showtimes={showtimes}
          totalCines={cinesSeleccionados.length}
          indexActual={indexCine}
          fechaInicial={fechaPreseleccionada}
          onGuardar={handleFormGuardado}
          onAtras={handleAtras}
          onClose={cerrarFlujo}
        />
      )}

      {paso === 'resumen' && (
        <ModalResumen
          funciones={borrador}
          onAplicar={handleAplicar}
          onDescartar={cerrarFlujo}
          loading={loading}
        />
      )}

      {confirmarElim && (
        <ModalConfirmar
          mensaje={`¿Eliminar la función de las ${formatHora(confirmarElim.fecha_hora)} en ${cines.find(c => c.id_cine === salas.find(s => s.id_sala === confirmarElim.id_sala)?.id_cine)?.nombre_cine ?? '—'}?`}
          onConfirmar={handleEliminar}
          onCancelar={() => setConfirmarElim(null)}
          loading={loadingElim}
        />
      )}
    </div>
  )
}
