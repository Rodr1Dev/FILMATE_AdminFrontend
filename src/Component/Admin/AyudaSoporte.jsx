import React, { useState } from 'react'
import PropTypes from 'prop-types'

const FAQS = [
  { q: '¿Cómo agrego una película al catálogo?',
    a: 'Ve a "Catálogo de Películas" > botón "Agregar Película". Completa título, año, duración, clasificación, póster, director, elenco y sinopsis. Los géneros se seleccionan de la lista.' },
  { q: '¿Cómo creo un cine o sala?',
    a: 'Ve a "Cines y Salas". Usa el botón "Nuevo Cine" para agregar un complejo. Luego selecciónalo y agrega salas con "Agregar Sala".' },
  { q: '¿Cómo proceso un reembolso?',
    a: 'En "Ventas y Tickets" > "Detalle de Compra", selecciona una transacción aprobada y haz clic en "Solicitar Reembolso". Luego en "Devoluciones y Reembolsos" puedes resolver la solicitud.' },
  { q: '¿Cómo valido una entrada en puerta?',
    a: 'Ve a "Ventas y Tickets" > "Validar Entrada". Ingresa o pega el código de entrada en el campo de texto.' },
  { q: '¿Qué hago si el sistema no carga?',
    a: 'Verifica que el backend esté corriendo en localhost:8000. Revisa la consola del navegador (F12) para errores. Si el problema persiste, contacta a soporte técnico.' },
  { q: '¿Cómo uso la integración con TMDB para agregar películas?',
    a: 'Al crear una nueva película en "Catálogo de Películas", verás un campo de búsqueda de TMDB. Escribe el título en inglés o español, selecciona la película de los resultados, y los datos (título, sinopsis, elenco, director, géneros, duración, año, póster) se auto-completarán. Luego solo ajusta estado y tráiler antes de guardar.' },
  { q: '¿Cómo configuro los precios de entradas y el IVA?',
    a: 'Ve a "Configuración y Precios". La pestaña "Precios de Entradas" permite definir montos por formato (2D/3D/IMAX) y porcentajes por tipo de entrada (General/Niño/Jubilado/Estudiante). "Parámetros del Sistema" permite ajustar el IVA y la tasa de servicio. Todos los cambios se guardan directamente en el servidor.' },
  { q: '¿Los datos del Dashboard son en tiempo real?',
    a: 'Sí, los datos se obtienen directamente del API al cargar la página. Los filtros de período, estado, sala y búsqueda se aplican del lado del cliente para una respuesta inmediata sin recargar.' },
  { q: '¿Cómo funciona el filtro de período en Dashboard?',
    a: 'Al seleccionar Hoy, Últimos 7 días, Este mes o Mes anterior, las tarjetas de resumen (boletos, ingresos, película taquillera) y los gráficos se recalculan automáticamente con las transacciones de ese período. La tabla de últimas transacciones también se filtra por el período elegido.' },
]

function Section({ title, icon, children, style }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 24, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#121212' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}
Section.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid #F3F4F6' }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: 14, fontWeight: 500, color: '#121212', textAlign: 'left', gap: 12,
      }}>
        {q}
        <span style={{ fontSize: 12, color: '#9CA3AF', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280', lineHeight: 1.6, paddingRight: 20 }}>
          {a}
        </p>
      )}
    </div>
  )
}
FaqItem.propTypes = {
  q: PropTypes.string.isRequired,
  a: PropTypes.string.isRequired,
  open: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
}

export default function AyudaSoporte() {
  const [faqOpen, setFaqOpen] = useState(null)

  return (
    <div style={{ padding: '28px 28px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Ayuda y Soporte</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>
          Guía rápida del panel de administración de Filmate
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Section title="Módulos del Sistema" icon="📋">
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { mod: 'Dashboard Principal', desc: 'Resumen ejecutivo con datos en tiempo real del API: tarjetas de boletos vendidos, ingresos, película taquillera y gráficos (ventas semanales por día e ingresos por tipo de sala). Incluye filtro por período (Hoy/7 días/Este mes/Mes anterior) que actualiza tarjetas y gráficos. Tabla de últimas 10 transacciones con búsqueda instantánea en todas las columnas y filtros por estado/sala. "Ver detalle" abre la transacción en Ventas y Tickets.' },
              { mod: 'Reportes', desc: 'Reportes detallados de ventas, ingresos y rendimiento.' },
              { mod: 'Catálogo de Películas', desc: 'Gestión completa del catálogo: alta, edición y baja de películas. Incluye integración con TMDB para buscar y auto-completar datos de películas (título, sinopsis, elenco, póster, géneros, etc.) desde la base de datos de The Movie Database.' },
              { mod: 'Cines y Salas', desc: 'Administración de complejos, salas y configuración de asientos.' },
              { mod: 'Programación', desc: 'Cartelera: asignación de películas a salas con horarios.' },
              { mod: 'Ventas y Tickets', desc: 'Historial de transacciones, reembolsos y validación QR en puerta.' },
              { mod: 'Usuarios y Roles', desc: 'Gestión de usuarios del sistema y control de permisos.' },
              { mod: 'Configuración y Precios', desc: 'Ajustes de precios base, costos de confitería y parámetros del sistema con tres pestañas: Precios de Entradas (2D, 3D, IMAX y tipos de entrada), Costos de Confitería (combos y productos) y Parámetros del Sistema (IVA, tasa de servicio, etc.). Los cambios se guardan directamente en el servidor vía API.' },
            ].map(s => (
              <div key={s.mod} style={{ display: 'flex', gap: 8 }}>
                <span style={{ color: '#283593', fontWeight: 600, fontSize: 13, minWidth: 180 }}>{s.mod}</span>
                <span style={{ color: '#6B7280', fontSize: 13 }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Atajos y Tips" icon="⚡">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Filtros instantáneos', tip: 'Los filtros en Dashboard y Ventas aplican automáticamente al seleccionar —sin botón "Aplicar".' },
              { label: 'Búsqueda global', tip: 'En Dashboard la búsqueda filtra por ID, fecha, cliente, película, sala, monto y estado en todas las columnas visibles.' },
              { label: 'Período en Dashboard', tip: 'El selector de período (Hoy/7 días/Este mes/Mes anterior) recalcula tarjetas de resumen y gráficos automáticamente.' },
              { label: 'Ver detalle', tip: 'El botón "Ver detalle" en la tabla del Dashboard abre la transacción directamente en Ventas y Tickets.' },
              { label: 'Limpiar filtros', tip: 'El botón "Limpiar filtros" en Dashboard resetea búsqueda, estado y sala de un solo clic.' },
              { label: 'TMDB en Catálogo', tip: 'Usa la búsqueda de TMDB al crear una película para auto-completar todos los datos automáticamente. Los campos bloqueados en modo TMDB se desbloquean al editar.' },
              { label: 'Configuración de precios', tip: 'Los cambios en "Configuración y Precios" se guardan uno por uno con el botón 💾 de cada fila. Los parámetros del sistema tienen un solo botón "Guardar Cambios".' },
            ].map(s => (
              <div key={s.label}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#121212' }}>{s.label}</span>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6B7280' }}>{s.tip}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Preguntas Frecuentes" icon="❓" style={{ marginBottom: 24 }}>
        {FAQS.map((faq, i) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} open={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? null : i)} />
        ))}
      </Section>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 280, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📧</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#121212', marginBottom: 4 }}>Soporte Técnico</div>
          <div style={{ fontSize: 13, color: '#283593' }}>soporte@filmate.com</div>
        </div>
        <div style={{ width: 280, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📖</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#121212', marginBottom: 4 }}>Documentación</div>
          <div style={{ fontSize: 13, color: '#283593' }}>docs.filmate.com/admin</div>
        </div>
        <div style={{ width: 280, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#121212', marginBottom: 4 }}>Reportar un problema</div>
          <div style={{ fontSize: 13, color: '#283593' }}>Reporta bugs a tu equipo de desarrollo</div>
        </div>
      </div>

      <div style={{ marginTop: 32, padding: '16px 20px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
          Panel Administrativo Filmate v0.3.0 · API conectada a localhost:8000 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
