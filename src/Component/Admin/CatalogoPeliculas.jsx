import React, { useState } from 'react'

// ─── Sample data (referential mockup – replace with API calls) ───────────────
const SAMPLE_MOVIES = [
  {
    id: 1, titulo: 'DUNE PARTE 2', genero: 'Ciencia Ficción', estado: 'Activo',
    clasificacion: 'PG-13', duracion: '2h 46 min', fecha: '28/03/2024',
    director: 'Denis Villeneuve',
    sinopsis: 'Dune: Parte Dos (2024) sigue a Paul Atreides uniendo fuerzas con Chani y los Fremen para vengarse de los conspiradores que destruyeron a su familia.',
    elenco: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem, Josh Brolin, Austin Butler',
    trailer: 'https://youtu.be/jg4-ErdQuXI',
    poster: 'https://image.tmdb.org/t/p/w342/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
  },
  {
    id: 2, titulo: 'OPPENHEIMER', genero: 'Drama', estado: 'Activo',
    clasificacion: 'PG-13', duracion: '3h 00 min', fecha: '21/07/2023',
    director: 'Christopher Nolan',
    sinopsis: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
    elenco: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
    trailer: 'https://youtu.be/uYPbbksJxIg',
    poster: 'https://image.tmdb.org/t/p/w342/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg',
  },
  {
    id: 3, titulo: 'AVATAR 3', genero: 'Ciencia Ficción', estado: 'Activo',
    clasificacion: 'APT', duracion: '3h 17 min', fecha: '19/12/2025',
    director: 'James Cameron',
    sinopsis: 'La tercera entrega de la saga de Avatar continúa la historia de los Na\'vi en Pandora.',
    elenco: 'Sam Worthington, Zoe Saldaña, Sigourney Weaver',
    trailer: 'https://youtu.be/example',
    poster: 'https://image.tmdb.org/t/p/w342/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/eHOzc1JGbFMDjGBXxdEv0pMlNdM.jpg',
  },
  {
    id: 4, titulo: 'BARBIE', genero: 'Comedia / Fantasía', estado: 'En cartelera',
    clasificacion: '+14', duracion: '1h 54 min', fecha: '21/07/2023',
    director: 'Greta Gerwig',
    sinopsis: 'Barbie sufre una crisis existencial y viaja al mundo real junto a Ken para descubrir su verdadero propósito.',
    elenco: 'Margot Robbie, Ryan Gosling, America Ferrera',
    trailer: 'https://youtu.be/pBk4NYhWNMM',
    poster: 'https://image.tmdb.org/t/p/w342/iuFNMS8vlmzxvyjaoHKhOrOihyO.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/nHf61UzkfFno5X1ofIjAVTnI1zH.jpg',
  },
  {
    id: 5, titulo: 'NAPOLEÓN', genero: 'Drama', estado: 'Activo',
    clasificacion: '+14', duracion: '2h 38 min', fecha: '22/11/2023',
    director: 'Ridley Scott',
    sinopsis: 'Un retrato épico del ascenso al poder de Napoleón Bonaparte y su relación con Josefina.',
    elenco: 'Joaquin Phoenix, Vanessa Kirby',
    trailer: 'https://youtu.be/OAZWXUkrjPc',
    poster: 'https://image.tmdb.org/t/p/w342/vcZWJGvB5xydWuUO1vaTLI52YB8.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/jE5o7y9K6pZtWNNMEw3IdpHuncR.jpg',
  },
  {
    id: 6, titulo: 'WONKA', genero: 'Fantasía', estado: 'En cartelera',
    clasificacion: 'APT', duracion: '1h 56 min', fecha: '15/12/2023',
    director: 'Paul King',
    sinopsis: 'Los primeros años y aventuras del joven y excéntrico Willy Wonka antes de fundar su famosa fábrica de chocolate.',
    elenco: 'Timothée Chalamet, Olivia Colman, Hugh Grant',
    trailer: 'https://youtu.be/otNh9bTjXWg',
    poster: 'https://image.tmdb.org/t/p/w342/qhb1qOilapbapxWQn9jtRkgQ5OQ.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/nGL2AbKDBM5dPm6gQAJGMXk3dAS.jpg',
  },
  {
    id: 7, titulo: 'GUARDIANES DE LA GALAXIA 3', genero: 'Ciencia Ficción', estado: 'Activo',
    clasificacion: '+14', duracion: '2h 30 min', fecha: '05/05/2023',
    director: 'James Gunn',
    sinopsis: 'Los Guardianes deben defender a uno de los suyos en una misión que podría marcar el fin del equipo.',
    elenco: 'Chris Pratt, Zoe Saldana, Bradley Cooper, Vin Diesel',
    trailer: 'https://youtu.be/u3V5KDHRQvk',
    poster: 'https://image.tmdb.org/t/p/w342/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/5YZbUmjbMa3ClvSW1Wj3D6XGkVA.jpg',
  },
  {
    id: 8, titulo: 'LOS 4 FANTÁSTICOS PRIMEROS PASOS', genero: 'Ciencia Ficción', estado: 'En cartelera',
    clasificacion: '+14', duracion: '1h 55 min', fecha: '25/07/2025',
    director: 'Matt Shakman',
    sinopsis: 'Los Cuatro Fantásticos hacen su debut en el Universo Marvel.',
    elenco: 'Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach',
    trailer: 'https://youtu.be/example',
    poster: 'https://image.tmdb.org/t/p/w342/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/example.jpg',
  },
  {
    id: 9, titulo: 'SPIDERMAN INTO THE SPIDERVERSE', genero: 'Animación', estado: 'Activo',
    clasificacion: 'APT', duracion: '2h 20 min', fecha: '14/12/2018',
    director: 'Bob Persichetti',
    sinopsis: 'Miles Morales se convierte en Spider-Man y conoce a otros Spider-People de distintos universos.',
    elenco: 'Shameik Moore, Hailee Steinfeld, Jake Johnson',
    trailer: 'https://youtu.be/g4Hbz2jLxvQ',
    poster: 'https://image.tmdb.org/t/p/w342/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/lfRkUr7DYdHldAw3kEuSrXMFjTo.jpg',
  },
  {
    id: 10, titulo: 'SUPERMAN', genero: 'Acción', estado: 'En cartelera',
    clasificacion: '+14', duracion: '2h 09 min', fecha: '11/07/2025',
    director: 'James Gunn',
    sinopsis: 'El renacimiento de Superman en el nuevo Universo DC, explorando el equilibrio entre su humanidad y sus orígenes kryptonianos.',
    elenco: 'David Corenswet, Rachel Brosnahan, Nicholas Hoult',
    trailer: 'https://youtu.be/example',
    poster: 'https://image.tmdb.org/t/p/w342/example.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/example.jpg',
  },
  {
    id: 11, titulo: 'SPIDER-MAN: BRAND NEW DAY', genero: 'Ciencia Ficción', estado: 'Próximamente',
    clasificacion: '+14', duracion: '2h 15 min', fecha: 'TBD',
    director: 'Desmond Daniel Cretton',
    sinopsis: 'Peter Parker se enfrenta a un nuevo comienzo después de los eventos del universo cinematográfico.',
    elenco: 'Tom Holland, Zendaya',
    trailer: 'https://youtu.be/example',
    poster: 'https://image.tmdb.org/t/p/w342/example.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/example.jpg',
  },
  {
    id: 12, titulo: 'PARASITE', genero: 'Drama / Suspenso', estado: 'Finalizada',
    clasificacion: '+14', duracion: '2h 12 min', fecha: '05/06/2019',
    director: 'Bong Joon-ho',
    sinopsis: 'La familia Kim, que vive en la pobreza, se infiltra en la vida de la adinerada familia Park de formas inesperadas.',
    elenco: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong',
    trailer: 'https://youtu.be/5xH0HfJHsaY',
    poster: 'https://image.tmdb.org/t/p/w342/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    banner: 'https://image.tmdb.org/t/p/w780/ApiBzeaa95TNYLSKkEWF5wGQPaw.jpg',
  },
]

// ─── Helper components ────────────────────────────────────────────────────────

function EstadoBadge({ estado }) {
  const map = {
    'Activo':        { bg: '#DCFCE7', text: '#008236' },
    'En cartelera':  { bg: '#FEF9C3', text: '#B45309' },
    'Próximamente':  { bg: '#DBEAFE', text: '#1D4ED8' },
    'Finalizada':    { bg: '#F3F4F6', text: '#6B7280' },
  }
  const s = map[estado] || { bg: '#F3F4F6', text: '#6B7280' }
  return (
    <span style={{
      background: s.bg, color: s.text,
      padding: '3px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{estado}</span>
  )
}

function Icon({ d, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICON_EDIT = "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
const ICON_EYE  = "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
const ICON_DEL  = "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"
const ICON_PLUS = "M12 5v14M5 12h14"
const ICON_SEARCH = "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
const ICON_UPLOAD = "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
const ICON_X = "M18 6 6 18M6 6l12 12"
const ICON_CHECK = "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
const ICON_WARN  = "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"

// ─── Overlay / Modal wrapper ──────────────────────────────────────────────────
function Overlay({ children, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Confirmation overlays ────────────────────────────────────────────────────
function ConfirmDiscard({ onSi, onNo }) {
  return (
    <Overlay onClose={onNo}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '32px 36px',
        width: 340, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ color: '#F59E0B', marginBottom: 12 }}>
          <Icon d={ICON_WARN} size={40} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>¿Descartar cambios?</h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>Los cambios no guardados se perderán si sales de esta página.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onNo} style={{
            padding: '9px 28px', border: '1px solid #D1D5DC', borderRadius: 8,
            background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>No</button>
          <button onClick={onSi} style={{
            padding: '9px 28px', border: 'none', borderRadius: 8,
            background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Sí</button>
        </div>
      </div>
    </Overlay>
  )
}

function SuccessOverlay({ mensaje, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '40px 48px',
        width: 380, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ color: '#22C55E', marginBottom: 16 }}>
          <Icon d={ICON_CHECK} size={48} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#121212', margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{mensaje}</h3>
        <button onClick={onClose} style={{
          padding: '10px 32px', border: 'none', borderRadius: 8,
          background: '#1C2566', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Aceptar</button>
      </div>
    </Overlay>
  )
}

function ConfirmEliminar({ titulo, onCancelar, onEliminar }) {
  return (
    <Overlay onClose={onCancelar}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '32px 36px',
        width: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: '#121212', margin: '0 0 8px' }}>¿Eliminar Película?</h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 6px' }}>
          <strong style={{ color: '#374151' }}>{titulo}</strong>
        </p>
        <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 24px', fontWeight: 600 }}>Esta acción no se puede deshacer</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onCancelar} style={{
            padding: '9px 28px', border: '1px solid #D1D5DC', borderRadius: 8,
            background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={onEliminar} style={{
            padding: '9px 28px', border: 'none', borderRadius: 8,
            background: '#EF4444', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Eliminar</button>
        </div>
      </div>
    </Overlay>
  )
}

// ─── Upload area ──────────────────────────────────────────────────────────────
function UploadBox({ label, preview }) {
  return (
    <div style={{
      border: '2px dashed #D1D5DC', borderRadius: 10, padding: '28px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 8, cursor: 'pointer', background: '#FAFAFA', flex: 1,
      minHeight: preview ? 'auto' : 110,
    }}>
      {preview
        ? <img src={preview} alt={label} style={{ width: '100%', borderRadius: 8, maxHeight: 140, objectFit: 'cover' }} />
        : <>
          <Icon d={ICON_UPLOAD} size={24} />
          <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
        </>
      }
    </div>
  )
}

// ─── Movie form (shared by Add/Edit) ─────────────────────────────────────────
function PeliculaForm({ initial, onGuardar, onCancelar }) {
  const [form, setForm] = useState(initial || {
    titulo: '', genero: '', clasificacion: '', duracion: '', fecha: '',
    director: '', sinopsis: '', elenco: '', trailer: '', estado: '',
    poster: '', banner: '',
  })
  const [showDiscard, setShowDiscard] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const fieldStyle = {
    width: '100%', border: '1px solid #D1D5DC', borderRadius: 8,
    padding: '9px 12px', fontSize: 14, color: '#374151', outline: 'none',
    background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const labelStyle = { fontSize: 14, fontWeight: 700, color: '#121212', display: 'block', marginBottom: 6 }

  return (
    <>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '32px 36px',
        width: 580, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#121212', margin: 0 }}>
            {initial ? 'Editar Película' : 'Añadir Nueva Película'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#121212' }}>Estado</span>
            <select value={form.estado} onChange={e => set('estado', e.target.value)}
              style={{ ...fieldStyle, width: 'auto', padding: '7px 28px 7px 10px' }}>
              <option value="">ESTADO</option>
              <option>Activo</option>
              <option>Próximamente</option>
              <option>En cartelera</option>
              <option>Finalizada</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#121212', margin: '0 0 12px', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>Información</h3>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Título</label>
            <input style={fieldStyle} value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Título de la película" />
          </div>
          <div>
            <label style={labelStyle}>Género</label>
            <select style={fieldStyle} value={form.genero} onChange={e => set('genero', e.target.value)}>
              <option value="">GÉNERO</option>
              {['Acción','Aventura','Ciencia Ficción','Comedia','Drama','Animación','Fantasía','Terror','Suspenso','Romance','Documental','Infantil','Musical','Misterio','Histórico','Otros'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Clasificación</label>
            <select style={fieldStyle} value={form.clasificacion} onChange={e => set('clasificacion', e.target.value)}>
              <option value="">CLASIFICACIÓN</option>
              {['APT','PG','PG-13','+14','+16','+18'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duración</label>
            <input style={fieldStyle} value={form.duracion} onChange={e => set('duracion', e.target.value)} placeholder="Ej: 2h 30 min" />
          </div>
          <div>
            <label style={labelStyle}>Director</label>
            <input style={fieldStyle} value={form.director} onChange={e => set('director', e.target.value)} placeholder="Nombre del director" />
          </div>
          <div>
            <label style={labelStyle}>Fecha Estreno</label>
            <input style={fieldStyle} type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#121212', margin: '0 0 12px', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>Multimedia</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <UploadBox label="Subir Poster" preview={form.poster} />
            <UploadBox label="Subir Banner" preview={form.banner} />
          </div>
          <label style={labelStyle}>Tráiler</label>
          <input style={fieldStyle} value={form.trailer} onChange={e => set('trailer', e.target.value)} placeholder="https://www.youtube URL" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Sinopsis</label>
          <textarea style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }}
            value={form.sinopsis} onChange={e => set('sinopsis', e.target.value)}
            placeholder="Descripción de la película..." />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Elenco</label>
          <textarea style={{ ...fieldStyle, minHeight: 60, resize: 'vertical' }}
            value={form.elenco} onChange={e => set('elenco', e.target.value)}
            placeholder="Actor 1, Actor 2, Actor 3..." />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={() => setShowDiscard(true)} style={{
            padding: '10px 24px', border: '1px solid #D1D5DC', borderRadius: 8,
            background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={() => onGuardar(form)} style={{
            padding: '10px 24px', border: 'none', borderRadius: 8,
            background: '#1C2566', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Guardar Película</button>
        </div>
      </div>

      {showDiscard && (
        <ConfirmDiscard
          onSi={onCancelar}
          onNo={() => setShowDiscard(false)}
        />
      )}
    </>
  )
}

// ─── View movie modal ─────────────────────────────────────────────────────────
function VerPelicula({ movie, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div style={{
        background: '#fff', borderRadius: 14, width: 620,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden', position: 'relative',
      }}>
        {/* Banner */}
        <div style={{ position: 'relative', height: 200, background: '#1C2566', overflow: 'hidden' }}>
          {movie.banner && movie.banner.includes('tmdb') && !movie.banner.includes('example') && (
            <img src={movie.banner} alt="" onError={e => e.target.style.display='none'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
          }} />
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon d={ICON_X} size={16} />
          </button>

          {/* Poster + title */}
          <div style={{ position: 'absolute', bottom: 16, left: 20, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
            <div style={{
              width: 90, height: 130, borderRadius: 8, border: '2px solid rgba(255,255,255,0.3)',
              background: '#364153', overflow: 'hidden', flexShrink: 0,
            }}>
              {movie.poster && movie.poster.includes('tmdb') && !movie.poster.includes('example') && (
                <img src={movie.poster} alt={movie.titulo}
                  onError={e => e.target.style.display='none'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                {movie.titulo}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px', fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}><b>Género:</b> {movie.genero}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}><b>Duración:</b> {movie.duracion}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}><b>Clasificación:</b> {movie.clasificacion}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}><b>Director:</b> {movie.director}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#121212', margin: '0 0 6px' }}>Sinopsis:</h3>
            <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.6 }}>{movie.sinopsis}</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#121212', margin: '0 0 6px' }}>Reparto:</h3>
            <p style={{ fontSize: 13, color: '#4B5563', margin: 0, lineHeight: 1.6 }}>{movie.elenco}</p>
          </div>
          {movie.trailer && (
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#121212', margin: '0 0 10px' }}>Tráiler:</h3>
              <div style={{
                background: '#1C2566', borderRadius: 10, padding: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                cursor: 'pointer',
              }} onClick={() => window.open(movie.trailer, '_blank')}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" opacity="0.9">
                  <path d="M5 3l14 9-14 9V3z"/>
                </svg>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>VER TRÁILER OFICIAL</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{movie.trailer}</div>
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Estado:</span>
            <EstadoBadge estado={movie.estado} />
          </div>
        </div>
      </div>
    </Overlay>
  )
}

// ─── Movie card ───────────────────────────────────────────────────────────────
function MovieCard({ movie, onEdit, onVer, onEliminar }) {
  const hasPoster = movie.poster && movie.poster.includes('tmdb') && !movie.poster.includes('example')

  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Poster */}
      <div style={{ height: 180, background: '#1C2566', position: 'relative', overflow: 'hidden' }}>
        {hasPoster
          ? <img src={movie.poster} alt={movie.titulo}
              onError={e => { e.target.style.display='none' }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm0 4h16M8 4v4m8-4v4"/>
              </svg>
            </div>
        }
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#121212', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.3 }}>
          {movie.titulo}
        </div>
        <div style={{ fontSize: 11.5, color: '#6B7280' }}>
          {movie.genero} , {movie.duracion}
        </div>
        <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 6 }}>
          {movie.clasificacion}
        </div>
        <EstadoBadge estado={movie.estado} />
      </div>

      {/* Actions */}
      <div style={{
        padding: '10px 14px', borderTop: '1px solid #F3F4F6',
        display: 'flex', gap: 8,
      }}>
        {[
          { icon: ICON_EDIT, onClick: onEdit, title: 'Editar', color: '#6B7280', hoverBg: '#F3F4F6' },
          { icon: ICON_EYE,  onClick: onVer,  title: 'Ver',    color: '#6B7280', hoverBg: '#F3F4F6' },
          { icon: ICON_DEL,  onClick: onEliminar, title: 'Eliminar', color: '#EF4444', hoverBg: '#FEF2F2' },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick} title={btn.title}
            onMouseEnter={e => { e.currentTarget.style.background = btn.hoverBg; e.currentTarget.style.color = btn.color }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' }}
            style={{
              background: 'transparent', border: '1px solid #E5E7EB', borderRadius: 8,
              padding: '6px 10px', cursor: 'pointer', color: '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}>
            <Icon d={btn.icon} size={15} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ total, page, perPage, onPage }) {
  const pages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 24, padding: '0 2px',
    }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>
        Mostrando <b>{start}</b> a <b>{end}</b> de <b>{total}</b> registros
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: page === 1 ? 'default' : 'pointer',
            border: '1px solid #D1D5DC', background: '#fff',
            color: page === 1 ? '#D1D5DC' : '#374151',
          }}>Anterior</button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => onPage(p)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: p === page ? '#1C2566' : '#fff',
              color: p === page ? '#fff' : '#374151',
              border: p === page ? 'none' : '1px solid #D1D5DC',
            }}>{p}</button>
        ))}
        <button onClick={() => onPage(page + 1)} disabled={page === pages}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: page === pages ? 'default' : 'pointer',
            border: '1px solid #D1D5DC', background: '#fff',
            color: page === pages ? '#D1D5DC' : '#374151',
          }}>Siguiente</button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CatalogoPeliculas() {
  const [movies, setMovies]           = useState(SAMPLE_MOVIES)
  const [buscar, setBuscar]           = useState('')
  const [filtroGenero, setFiltroGenero]     = useState('')
  const [filtroEstado, setFiltroEstado]     = useState('')
  const [filtroClasif, setFiltroClasif]     = useState('')
  const [page, setPage]               = useState(1)
  const PER_PAGE = 12

  // Modals
  const [modalAdd, setModalAdd]       = useState(false)
  const [modalEdit, setModalEdit]     = useState(null)   // movie object
  const [modalVer, setModalVer]       = useState(null)   // movie object
  const [modalDel, setModalDel]       = useState(null)   // movie object
  const [successMsg, setSuccessMsg]   = useState('')

  // ── Filtering ──
  const filtered = movies.filter(m => {
    const q = buscar.toLowerCase()
    if (q && !m.titulo.toLowerCase().includes(q) && !m.genero.toLowerCase().includes(q)) return false
    if (filtroGenero && !m.genero.toLowerCase().includes(filtroGenero.toLowerCase())) return false
    if (filtroEstado && m.estado !== filtroEstado) return false
    if (filtroClasif && m.clasificacion !== filtroClasif) return false
    return true
  })

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const dropStyle = {
    background: '#fff', border: '1px solid #D1D5DC', borderRadius: 10,
    padding: '10px 36px 10px 14px', fontSize: 14, color: '#374151',
    cursor: 'pointer', outline: 'none', appearance: 'none', minWidth: 150,
  }

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Catálogo de Películas</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>Administra todas las Películas disponibles en la plataforma</p>
        </div>
        <button onClick={() => setModalAdd(true)}
          onMouseEnter={e => e.currentTarget.style.background = '#1a3a8a'}
          onMouseLeave={e => e.currentTarget.style.background = '#1C2566'}
          style={{
            background: '#1C2566', color: '#fff', border: 'none', borderRadius: 10,
            padding: '11px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(28,37,102,0.3)', transition: 'background 0.15s',
          }}>
          <Icon d={ICON_PLUS} size={16} />
          Nueva Película
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
            <Icon d={ICON_SEARCH} size={16} />
          </span>
          <input
            type="text" placeholder="Buscar Películas"
            value={buscar} onChange={e => { setBuscar(e.target.value); setPage(1) }}
            style={{
              width: '100%', border: '1px solid #D1D5DC', borderRadius: 10,
              padding: '10px 14px 10px 38px', fontSize: 14, color: '#374151',
              outline: 'none', background: '#fff', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Género */}
        <div style={{ position: 'relative' }}>
          <select value={filtroGenero} onChange={e => { setFiltroGenero(e.target.value); setPage(1) }} style={dropStyle}>
            <option value="">GÉNERO</option>
            {['Acción','Aventura','Ciencia Ficción','Comedia','Drama','Animación','Fantasía','Terror','Suspenso','Romance','Documental','Infantil','Musical','Misterio','Histórico','Otros'].map(g => <option key={g}>{g}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 12 }}>▼</span>
        </div>

        {/* Estado */}
        <div style={{ position: 'relative' }}>
          <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPage(1) }} style={dropStyle}>
            <option value="">ESTADO</option>
            <option>Activo</option>
            <option>Próximamente</option>
            <option>En cartelera</option>
            <option>Finalizada</option>
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 12 }}>▼</span>
        </div>

        {/* Clasificación */}
        <div style={{ position: 'relative' }}>
          <select value={filtroClasif} onChange={e => { setFiltroClasif(e.target.value); setPage(1) }} style={dropStyle}>
            <option value="">CLASIFICACIÓN</option>
            {['APT','PG','PG-13','+14','+16','+18'].map(c => <option key={c}>{c}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280', fontSize: 12 }}>▼</span>
        </div>
      </div>

      {/* Grid */}
      {paginated.length === 0
        ? <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF', fontSize: 15 }}>
            No se encontraron películas con los filtros seleccionados.
          </div>
        : <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 18,
          }}>
            {paginated.map(m => (
              <MovieCard
                key={m.id} movie={m}
                onEdit={() => setModalEdit(m)}
                onVer={() => setModalVer(m)}
                onEliminar={() => setModalDel(m)}
              />
            ))}
          </div>
      }

      {/* Pagination */}
      {filtered.length > 0 && (
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPage={setPage} />
      )}

      {/* ── Modals ── */}

      {/* Add */}
      {modalAdd && (
        <Overlay onClose={() => {}}>
          <PeliculaForm
            onGuardar={data => {
              setMovies(prev => [...prev, { ...data, id: Date.now() }])
              setModalAdd(false)
              setSuccessMsg('PELÍCULA AÑADIDA CORRECTAMENTE')
            }}
            onCancelar={() => setModalAdd(false)}
          />
        </Overlay>
      )}

      {/* Edit */}
      {modalEdit && (
        <Overlay onClose={() => {}}>
          <PeliculaForm
            initial={modalEdit}
            onGuardar={data => {
              setMovies(prev => prev.map(m => m.id === modalEdit.id ? { ...m, ...data } : m))
              setModalEdit(null)
              setSuccessMsg('PELÍCULA EDITADA CORRECTAMENTE')
            }}
            onCancelar={() => setModalEdit(null)}
          />
        </Overlay>
      )}

      {/* Ver */}
      {modalVer && (
        <VerPelicula movie={modalVer} onClose={() => setModalVer(null)} />
      )}

      {/* Eliminar */}
      {modalDel && (
        <ConfirmEliminar
          titulo={modalDel.titulo}
          onCancelar={() => setModalDel(null)}
          onEliminar={() => {
            setMovies(prev => prev.filter(m => m.id !== modalDel.id))
            setModalDel(null)
          }}
        />
      )}

      {/* Success */}
      {successMsg && (
        <SuccessOverlay mensaje={successMsg} onClose={() => setSuccessMsg('')} />
      )}
    </div>
  )
}
