import React, { useState } from 'react'

const FAQS = [
  { q: '¿Cómo agrego una película al catálogo?',
    a: 'Ve a "Catálogo de Películas" > botón "Agregar Película". Completa título, año, duración, clasificación, póster, director, elenco y sinopsis. Los géneros se seleccionan de la lista.' },
  { q: '¿Cómo creo un cine o sala?',
    a: 'Ve a "Cines y Salas". Usa el botón "Nuevo Cine" para agregar un complejo. Luego selecciónalo y agrega salas con "Agregar Sala".' },
  { q: '¿Cómo proceso un reembolso?',
    a: 'En "Ventas y Tickets" > "Detalle de Compra", selecciona una transacción aprobada y haz clic en "Solicitar Reembolso". Luego en "Devoluciones y Reembolsos" puedes resolver la solicitud.' },
  { q: '¿Cómo valido una entrada en puerta?',
    a: 'Ve a "Ventas y Tickets" > "Validación de Entradas". Escanea el código QR del ticket o pega el código en el campo de texto.' },
  { q: '¿Qué hago si el sistema no carga?',
    a: 'Verifica que el backend esté corriendo en localhost:8000. Revisa la consola del navegador (F12) para errores. Si el problema persiste, contacta a soporte técnico.' },
]

function Section({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#121212' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
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

export default function AyudaSoporte() {
  const [faqOpen, setFaqOpen] = useState(null)

  return (
    <div style={{ padding: '28px 28px 40px', maxWidth: 960 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#121212', margin: 0 }}>Ayuda y Soporte</h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '5px 0 0' }}>
          Guía rápida del panel de administración de Filmate
        </p>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <Section title="Módulos del Sistema" icon="📋">
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { mod: 'Dashboard Principal', desc: 'Resumen ejecutivo con métricas clave del negocio.' },
              { mod: 'Reportes', desc: 'Reportes detallados de ventas, ingresos y rendimiento.' },
              { mod: 'Catálogo de Películas', desc: 'Gestión completa del catálogo: alta, edición y baja de películas.' },
              { mod: 'Cines y Salas', desc: 'Administración de complejos, salas y configuración de asientos.' },
              { mod: 'Programación', desc: 'Cartelera: asignación de películas a salas con horarios.' },
              { mod: 'Ventas y Tickets', desc: 'Historial de transacciones, reembolsos y validación QR en puerta.' },
              { mod: 'Usuarios y Roles', desc: 'Gestión de usuarios del sistema y control de permisos.' },
              { mod: 'Configuración y Precios', desc: 'Ajustes de precios base y configuración general.' },
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
              { label: 'Filtros rápidos', tip: 'Usa los filtros de estado, tipo y fecha en cada sección para acotar resultados.' },
              { label: 'Búsqueda global', tip: 'El campo de búsqueda en Ventas y Tickets busca por ID, cliente o película.' },
              { label: 'Descarga PDF', tip: 'Cada transacción tiene un botón "Descargar PDF" con el comprobante oficial y QR.' },
              { label: 'Paginación', tip: 'Los listados usan paginación de 10 registros. Usa las flechas para navegar.' },
              { label: 'Persistencia local', tip: 'El log de validación QR persiste en el navegador incluso al recargar.' },
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
          <FaqItem key={i} q={faq.q} a={faq.a} open={faqOpen === i} onToggle={() => setFaqOpen(faqOpen === i ? null : i)} />
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
          Panel Administrativo Filmate v0.2.0 · API conectada a localhost:8000 · {new Date().getFullYear()}
        </p>
      </div>
      </div>
    </div>
  )
}
