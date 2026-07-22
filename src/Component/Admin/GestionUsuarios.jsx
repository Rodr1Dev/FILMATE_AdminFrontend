import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  Search, Pencil, Eye, KeyRound, X, Check, Mail,
  Shield, RefreshCw, Link as LinkIcon, Calendar, Trash2, AlertTriangle,
} from "lucide-react";
import { useAuth } from '../../context/useAuth.js';

const API = "/api/admin";
const ESTADOS_VALUES = ["Activo", "Suspendido", "Pendiente verificación"];
const MODULOS = ["Ventas", "Películas", "Usuarios", "Configuración"];
const MODULOS_DISPONIBLES = ["ADMINISTRACIÓN", "VENTAS Y TICKETS", "OPERACIONES CLIENTE", "SOCIAL"];
const MODULOS_POR_ROL = {
  ADMINISTRADOR: ["ADMINISTRACIÓN", "VENTAS Y TICKETS"],
  TAQUILLA: ["VENTAS Y TICKETS"],
  DULCERIA: ["VENTAS Y TICKETS"],
  CLIENTE: ["OPERACIONES CLIENTE", "SOCIAL"],
};

const roleToDisplay = (nombreRol) => {
  const MAP = { ADMINISTRADOR: "ADMIN", CLIENTE: "CLIENTE", SUPERADMIN: "SUPERADMIN" };
  return MAP[nombreRol] || nombreRol;
};

const ESTADO_STYLES = {
  Activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Suspendido: "bg-red-50 text-red-700 border-red-200",
  "Pendiente verificación": "bg-amber-50 text-amber-700 border-amber-200",
};
const ESTADO_TO_API = { Activo: "ACTIVO", Suspendido: "INACTIVO", "Pendiente verificación": "PENDIENTE" };
const ESTADO_FROM_API = { ACTIVO: "Activo", INACTIVO: "Suspendido", PENDIENTE: "Pendiente verificación" };

async function apiFetch(url, opts = {}) {
  const token = localStorage.getItem("filmate_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, { headers, ...opts });
  if (res.status === 401) {
    localStorage.removeItem("filmate_token");
    localStorage.removeItem("filmate_user");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

function Badge({ estado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${ESTADO_STYLES[estado] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {estado}
    </span>
  );
}
Badge.propTypes = { estado: PropTypes.string };

function Select({ value, onChange, options, placeholder, id }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
    </select>
  );
}
Select.propTypes = { value: PropTypes.string, onChange: PropTypes.func, options: PropTypes.arrayOf(PropTypes.string), placeholder: PropTypes.string, id: PropTypes.string };

function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`w-full ${maxWidth} bg-white rounded-2xl shadow-xl overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
Modal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, title: PropTypes.string, children: PropTypes.node, maxWidth: PropTypes.string };

function CambiarContrasenaModal({ open, onClose, usuario }) {
  const [modo, setModo] = useState("automatica");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [seguro, setSeguro] = useState(false);
  const [enviarCorreo, setEnviarCorreo] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [guardando, setGuardando] = useState(false);

  React.useEffect(() => {
    if (open) { setModo("automatica"); setNueva(""); setRepetir(""); setSeguro(false); setEnviarCorreo(false); setMensaje(null); }
  }, [open, usuario]);

  if (!usuario) return null;

  const passwordsValidas = nueva.length >= 8 && nueva === repetir;
  const puedeGuardarManual = passwordsValidas && seguro;

  const opciones = [
    { key: "automatica", label: "Generar automática", icon: RefreshCw },
    { key: "manual", label: "Modificar manualmente", icon: Pencil },
    { key: "enlace", label: "Enviar enlace", icon: LinkIcon },
  ];

  async function handleAutomatica() {
    setGuardando(true);
    try {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
      const rand = new Uint8Array(14)
      crypto.getRandomValues(rand)
      const pass = Array.from(rand).map(b => chars[b % chars.length]).join('')
      await apiFetch(`${API}/users/${usuario.id_usuario}/password`, {
        method: "PUT",
        body: JSON.stringify({ contrasena: pass }),
      });
      setMensaje(`Contraseña generada: ${pass}. Se recomienda copiar y compartir con el usuario.`);
    } catch (e) {
      setMensaje("Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleManual() {
    setGuardando(true);
    try {
      await apiFetch(`${API}/users/${usuario.id_usuario}/password`, {
        method: "PUT",
        body: JSON.stringify({ contrasena: nueva }),
      });
      setMensaje(enviarCorreo ? "Contraseña actualizada. Se envió un correo de confirmación al usuario." : "Contraseña actualizada correctamente.");
    } catch (e) {
      setMensaje("Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEnlace() {
    setGuardando(true);
    try {
      await apiFetch(`${API}/users/${usuario.id_usuario}/reset-link`, {
        method: "POST",
      });
      setMensaje("Enlace de reinicio enviado al correo del usuario.");
    } catch (e) {
      setMensaje("Error: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Contraseña · ${usuario.nombre}`} maxWidth="max-w-lg">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-2">
          {opciones.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => { setModo(key); setMensaje(null); }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition ${modo === key ? "border-indigo-700 bg-indigo-50 text-indigo-800" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        {modo === "automatica" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900">
              Se generará la clave <span className="font-mono font-semibold">Filmate.2026*</span> y se enviará a <span className="font-medium">{usuario.correo}</span>.
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={guardando}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={handleAutomatica} disabled={guardando}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:bg-gray-300">
                {guardando ? "Guardando…" : <><Mail size={15} /> Generar y enviar</>}
              </button>
            </div>
          </div>
        )}

        {modo === "manual" && (
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label htmlFor="nueva-contrasena" className="block text-xs font-medium text-gray-500 mb-1">Nueva contraseña</label>
              <input id="nueva-contrasena" type="text" value={nueva} onChange={(e) => setNueva(e.target.value)}
                placeholder="Mínimo 8 caracteres" autoComplete="off"
                style={{ WebkitTextSecurity: "disc" }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="repetir-contrasena" className="block text-xs font-medium text-gray-500 mb-1">Repetir contraseña</label>
              <input id="repetir-contrasena" type="text" value={repetir} onChange={(e) => setRepetir(e.target.value)}
                placeholder="Repite la contraseña" autoComplete="off" style={{ WebkitTextSecurity: "disc" }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {nueva && repetir && nueva !== repetir && <p className="text-xs text-red-600 mt-1">Las contraseñas no coinciden.</p>}
            </div>
            <div className="flex flex-col gap-3 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={seguro} onChange={(e) => setSeguro(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-700 focus:ring-indigo-500" />{' '}
                Estoy seguro de cambiar contraseña
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={enviarCorreo} onChange={(e) => setEnviarCorreo(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-700 focus:ring-indigo-500" />{' '}
                Enviar correo al usuario
              </label>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
              <button type="button" disabled={!puedeGuardarManual || guardando}
                onClick={handleManual}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:bg-gray-300 disabled:cursor-not-allowed">
                {guardando ? "Guardando…" : <><Check size={15} /> {enviarCorreo ? "Guardar y enviar correo" : "Guardar contraseña"}</>}
              </button>
            </div>
          </form>
        )}

        {modo === "enlace" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-900">
              Se enviará un enlace de reinicio a <span className="font-medium">{usuario.correo}</span>.
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} disabled={guardando}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={handleEnlace} disabled={guardando}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:bg-gray-300">
                {guardando ? "Guardando…" : <><LinkIcon size={15} /> Enviar enlace</>}
              </button>
            </div>
          </div>
        )}

        {mensaje && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg px-3 py-2">
            <Check size={15} /> {mensaje}
          </div>
        )}
      </div>
    </Modal>
  );
}
CambiarContrasenaModal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, usuario: PropTypes.object };

function EditarUsuarioModal({ open, onClose, usuario, onSave, rolesDisponibles }) {
  const [form, setForm] = useState({ nombre: "", correo: "", estado: "Activo" });
  const [tipoUsuario, setTipoUsuario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (usuario) {
      setForm(usuario);
      const rolesNoCliente = new Set((usuario.role_ids || []).filter((rid) => rid !== 2));
      const rol = rolesDisponibles.find((r) => rolesNoCliente.has(r.id_role));
      setTipoUsuario(rol ? roleToDisplay(rol.nombre_rol) : "");
    }
  }, [usuario, rolesDisponibles]);

  if (!usuario) return null;

  const esCliente = (usuario.role_ids || []).includes(2) && !(usuario.role_ids || []).some((rid) => rid !== 2);

  async function handleSave() {
    setGuardando(true);
    try {
      await apiFetch(`${API}/users/${usuario.id_usuario}`, {
        method: "PUT",
        body: JSON.stringify({
          nombre: form.nombre,
          correo: form.correo,
          estado_usuario: ESTADO_TO_API[form.estado] || "ACTIVO",
        }),
      });
      if (!esCliente && tipoUsuario) {
        const rol = rolesDisponibles.find(
          (r) => roleToDisplay(r.nombre_rol).toUpperCase() === tipoUsuario.toUpperCase()
        );
        if (rol) {
          const nuevosRoles = [...((usuario.role_ids || []).filter((rid) => rid === 2) || [])];
          if (rol.id_role !== 2) nuevosRoles.push(rol.id_role);
          await apiFetch(`${API}/users/${usuario.id_usuario}/roles`, {
            method: "PUT",
            body: JSON.stringify({ role_ids: nuevosRoles }),
          });
        }
      }
      onSave({ ...usuario, ...form });
      onClose();
    } catch (e) {
      setError("Error al guardar: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Editar usuario · ${usuario.id_usuario}`}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}
        <div>
          <label htmlFor="edit-nombre" className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
          <input id="edit-nombre" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="edit-email" className="block text-xs font-medium text-gray-500 mb-1">Correo electrónico</label>
          <input id="edit-email" type="email" value={form.correo || ""} onChange={(e) => setForm({ ...form, correo: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {!esCliente && (
          <div>
            <label htmlFor="edit-tipo" className="block text-xs font-medium text-gray-500 mb-1">Tipo usuario</label>
            <select id="edit-tipo" value={tipoUsuario} onChange={(e) => setTipoUsuario(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Seleccione un tipo</option>
              {(rolesDisponibles || []).filter((r) => r.id_role !== 3).map((r) => (
                <option key={r.id_role} value={roleToDisplay(r.nombre_rol)}>{roleToDisplay(r.nombre_rol)}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="edit-estado" className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
          <div className="flex items-center gap-2">
            <select id="edit-estado" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {ESTADOS_VALUES.map((est) => <option key={est} value={est}>{est}</option>)}
            </select>
            <Badge estado={form.estado} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={guardando}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
          <button onClick={handleSave} disabled={guardando}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:bg-gray-300">
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
EditarUsuarioModal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, usuario: PropTypes.object, onSave: PropTypes.func, rolesDisponibles: PropTypes.array };

function VerUsuarioModal({ open, onClose, usuario }) {
  if (!usuario) return null;
  const campos = [
    ["ID usuario", usuario.id_usuario],
    ["Nombre", usuario.nombre],
    ["Roles", (usuario.roles_nombres || []).map(roleToDisplay).join(", ")],
    ["Correo", usuario.correo],
    ["Username", usuario.username],
    ["Documento", usuario.numero_documento],
    ["Teléfono", usuario.telefono || "—"],
    ["Última conexión", usuario.ultima_conexion || "—"],
    ["Fecha registro", usuario.fecha_registro || "—"],
  ];
  return (
    <Modal open={open} onClose={onClose} title="Detalle de usuario">
      <div className="space-y-3">
        {campos.map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm border-b border-gray-100 pb-2">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm pt-1">
          <span className="text-gray-500">Estado</span>
          <Badge estado={usuario.estado} />
        </div>
      </div>
    </Modal>
  );
}
VerUsuarioModal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, usuario: PropTypes.object };

function DirectorioUsuarios({ rolesDisponibles }) {
  const [usuarios, setUsuarios] = useState([]);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [viendo, setViendo] = useState(null);
  const [cambiandoClave, setCambiandoClave] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);

  const roleMap = useMemo(() => {
    const m = {};
    (rolesDisponibles || []).forEach((r) => { m[r.id_role] = r.nombre_rol; });
    return m;
  }, [rolesDisponibles]);

  const tipoUsuarioOpts = useMemo(() => {
    return (rolesDisponibles || [])
      .filter((r) => r.id_role !== 3)
      .map((r) => roleToDisplay(r.nombre_rol));
  }, [rolesDisponibles]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const data = await apiFetch(`${API}/users/`);
      const mapeados = data.map((u) => ({
        id_usuario: u.id_usuario,
        nombre: u.nombre,
        username: u.username,
        correo: u.correo,
        numero_documento: u.numero_documento,
        telefono: u.telefono,
        url_perfil: u.url_perfil,
        estado_usuario: u.estado_usuario,
        fecha_registro: u.fecha_registro,
        ultima_conexion: u.ultima_conexion,
        role_ids: u.roles || [],
        roles_nombres: (u.roles || []).map((rid) => roleMap[rid] || "Rol " + rid),
        estado: ESTADO_FROM_API[u.estado_usuario] || u.estado_usuario,
      }));
      setUsuarios(mapeados);
    } catch (e) {
      setErrorCarga(e.message);
      console.error("Error al cargar usuarios:", e);
    } finally {
      setLoading(false);
    }
  }, [roleMap]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchTipo = !tipoFiltro || (u.roles_nombres || []).some((r) => {
        return roleToDisplay(r).toUpperCase() === tipoFiltro.toUpperCase();
      });
      const matchEstado = !estadoFiltro || u.estado === estadoFiltro;
      const q = busqueda.trim().toLowerCase();
      const matchBusqueda = !q || u.nombre.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q) || String(u.id_usuario).includes(q) || (u.numero_documento || '').includes(q);
      return matchTipo && matchEstado && matchBusqueda;
    });
  }, [usuarios, tipoFiltro, estadoFiltro, busqueda]);

  function guardarUsuario(actualizado) {
    setUsuarios((prev) => prev.map((u) => (u.id_usuario === actualizado.id_usuario ? { ...u, ...actualizado } : u)));
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filtro-tipo" className="block text-xs font-medium text-gray-500 mb-1">Tipo de usuario</label>
            <Select id="filtro-tipo" value={tipoFiltro} onChange={setTipoFiltro} options={tipoUsuarioOpts} placeholder="Todas" />
          </div>
          <div>
            <label htmlFor="filtro-estado" className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <Select id="filtro-estado" value={estadoFiltro} onChange={setEstadoFiltro} options={ESTADOS_VALUES} placeholder="Todos los estados" />
          </div>
          <div>
            <label htmlFor="filtro-buscar" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="filtro-buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, correo o ID" autoComplete="off" name="search-users"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Tabla de Usuarios</h3>
            <p className="text-sm text-gray-500">Registro completo de todos los usuarios en la plataforma</p>
          </div>
          <button onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50">
            <RefreshCw size={13} /> Refrescar
          </button>
        </div>

        {(() => {
          if (loading) return <div className="px-5 py-10 text-center text-gray-400 text-sm">Cargando usuarios...</div>;
          if (errorCarga) return (
            <div className="px-5 py-6">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-start gap-2">
                <span className="font-medium">Error de conexión:</span> {errorCarga}
              </div>
        
            </div>
          );
          return (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-y border-gray-100">
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-5 py-3 font-medium">ÚLTIMA CONEXIÓN</th>
                      <th className="px-5 py-3 font-medium">NOMBRE</th>
                      <th className="px-5 py-3 font-medium">ROL</th>
                      <th className="px-5 py-3 font-medium">CORREO</th>
                      <th className="px-5 py-3 font-medium">ESTADO</th>
                      <th className="px-5 py-3 font-medium">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((u) => (
                      <tr key={u.id_usuario} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-5 py-3 text-indigo-700 font-medium">USR-{u.id_usuario}</td>
                        <td className="px-5 py-3 text-gray-500">
                          {u.ultima_conexion
                            ? new Date(u.ultima_conexion).toLocaleString("es-PE", {
                                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-800">{u.nombre}</td>
                        <td className="px-5 py-3 text-gray-600 uppercase text-xs">{(u.roles_nombres || []).map(roleToDisplay).join(", ") || "—"}</td>
                        <td className="px-5 py-3 text-gray-500 max-w-[180px] truncate">{u.correo}</td>
                        <td className="px-5 py-3"><Badge estado={u.estado} /></td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button title="Editar" onClick={() => setEditando(u)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-indigo-700 hover:bg-indigo-50"><Pencil size={15} /></button>
                            <button title="Ver" onClick={() => setViendo(u)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-indigo-700 hover:bg-indigo-50"><Eye size={15} /></button>
                            <button title="Cambiar contraseña" onClick={() => setCambiandoClave(u)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-indigo-700 hover:bg-indigo-50"><KeyRound size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtrados.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No se encontraron usuarios con estos filtros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-5 py-4 text-sm text-gray-500">
                <span>Mostrando {filtrados.length} de {usuarios.length} registros</span>
              </div>
            </>
          );
        })()}
      </div>

      <EditarUsuarioModal open={!!editando} onClose={() => setEditando(null)} usuario={editando}
        onSave={guardarUsuario} rolesDisponibles={rolesDisponibles} />
      <VerUsuarioModal open={!!viendo} onClose={() => setViendo(null)} usuario={viendo} />
      <CambiarContrasenaModal open={!!cambiandoClave} onClose={() => setCambiandoClave(null)} usuario={cambiandoClave} />
    </div>
  );
}
DirectorioUsuarios.propTypes = { rolesDisponibles: PropTypes.array };

function CrearRolModal({ open, onClose, onCreado, permisosDisponibles }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [plantilla, setPlantilla] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [creado, setCreado] = useState(false);

  const [crearError, setCrearError] = useState(null);
  React.useEffect(() => { if (open) { setNombre(""); setDescripcion(""); setPlantilla(""); setCrearError(null); setCreado(false); } }, [open]);

  const PLANTILLAS = [
    { key: "", label: "Sin plantilla — permisos vacíos", modulos: [] },
    { key: "ADMINISTRADOR", label: "Administrador — ADMINISTRACIÓN + VENTAS", modulos: ["ADMINISTRACIÓN", "VENTAS Y TICKETS"] },
    { key: "TAQUILLA", label: "Taquilla — VENTAS Y TICKETS", modulos: ["VENTAS Y TICKETS"] },
    { key: "DULCERÍA", label: "Dulcería — VENTAS Y TICKETS", modulos: ["VENTAS Y TICKETS"] },
    { key: "CLIENTE", label: "Cliente — OPERACIONES CLIENTE + SOCIAL", modulos: ["OPERACIONES CLIENTE", "SOCIAL"] },
  ];

  async function handleCrear() {
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      const plantillaSel = PLANTILLAS.find((p) => p.key === plantilla);
      const rolCreado = await apiFetch(`${API}/roles/`, {
        method: "POST",
        body: JSON.stringify({ nombre_rol: nombre.trim(), descripcion: descripcion.trim() || null }),
      });
      if (plantillaSel && plantillaSel.modulos.length > 0) {
        const permisosIds = (permisosDisponibles || [])
          .filter((p) => plantillaSel.modulos.includes(p.modulo))
          .map((p) => p.id_permiso);
        if (permisosIds.length > 0) {
          await apiFetch(`${API}/roles/${rolCreado.id_role}/permisos`, {
            method: "PUT",
            body: JSON.stringify(permisosIds),
          });
        }
      }
      await onCreado();
      setCreado(true);
    } catch (e) {
      setCrearError("Error al crear rol: " + e.message);
    } finally {
      setGuardando(false);
    }
  }

  function handleClose() {
    setCreado(false);
    onClose();
  }

  if (creado) {
    return (
      <Modal open={open} onClose={handleClose} title="Rol creado">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <Check size={48} className="text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Rol creado exitosamente</p>
          <button onClick={handleClose}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900">
            Cerrar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Crear nuevo rol">
      <div className="space-y-4">
        {crearError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{crearError}</div>
        )}
        <div>
          <label htmlFor="rol-nombre" className="block text-xs font-medium text-gray-500 mb-1">Nombre del rol</label>
          <input id="rol-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Taquilla"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label htmlFor="rol-plantilla" className="block text-xs font-medium text-gray-500 mb-1">Plantilla de permisos</label>
          <select id="rol-plantilla" value={plantilla} onChange={(e) => setPlantilla(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {PLANTILLAS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <p className="text-[10px] text-gray-400 mt-1">Los permisos se asignarán automáticamente según la plantilla.</p>
        </div>
        <div>
          <label htmlFor="rol-descripcion" className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
          <textarea id="rol-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            placeholder="¿Qué funciones tendrá este rol?"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={handleClose} disabled={guardando}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancelar</button>
          <button onClick={handleCrear} disabled={guardando || !nombre.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:bg-gray-300">
            {guardando ? "Creando…" : "Crear rol"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
CrearRolModal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, onCreado: PropTypes.func, permisosDisponibles: PropTypes.array };

function PermisoDuplicado({ permisos, codigo }) {
  if (!codigo || !permisos) return null;
  const dup = permisos.find((p) => p.codigo_permiso === codigo);
  if (!dup) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
      <span>⚠️</span>
      <div>
        <p className="font-medium">Este permiso ya existe</p>
        <p className="text-xs mt-0.5">Código <span className="font-mono font-semibold">{codigo}</span> — "{dup.descripcion}" en {dup.modulo}</p>
      </div>
    </div>
  );
}
PermisoDuplicado.propTypes = { permisos: PropTypes.array, codigo: PropTypes.string };

function generarCodigoPermiso(texto) {
  return texto
    .replace(/^permite\s+/i, "")
    .replace(/del\s+/gi, "")
    .replace(/de\s+/gi, "")
    .replace(/la\s+/gi, "")
    .replace(/el\s+/gi, "")
    .replace(/los\s+/gi, "")
    .replace(/las\s+/gi, "")
    .replace(/en\s+/gi, "")
    .replace(/al\s+/gi, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function CrearPermisoModal({ open, onClose, onRefresh, onCreado, permisosDisponibles }) {
  const [descripcion, setDescripcion] = useState("");
  const [modulo, setModulo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [permisoError, setPermisoError] = useState(null);
  const [creado, setCreado] = useState(false);
  const onRefreshRef = useRef(onRefresh);

  React.useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  React.useEffect(() => {
    if (open) {
      setDescripcion(""); setModulo(""); setPermisoError(null); setCreado(false);
      onRefreshRef.current?.();
    }
  }, [open]);

  const codigo = generarCodigoPermiso(descripcion);
  const duplicado = (permisosDisponibles || []).find((p) => p.codigo_permiso === codigo);

  function handleClose() {
    setCreado(false);
    onClose();
  }

  async function handleCrear() {
    if (!codigo.trim() || !modulo.trim() || duplicado) return;
    setGuardando(true);
    try {
      await apiFetch(`${API}/permisos/`, {
        method: "POST",
        body: JSON.stringify({
          codigo_permiso: codigo,
          descripcion: descripcion.trim() || codigo,
          modulo: modulo.trim(),
        }),
      });
      await onCreado();
      setCreado(true);
    } catch (e) {
      const existente = (permisosDisponibles || []).find((p) => p.codigo_permiso === codigo)
      const msg = e.message?.includes('Duplicate entry')
        ? `El permiso "${codigo}" ya existe${existente ? ` como "${existente.descripcion}"` : ''}`
        : e.message
      setPermisoError("Error al crear permiso: " + msg);
    } finally {
      setGuardando(false);
    }
  }

  const MODULO_DESCRIPCION = {
    "ADMINISTRACIÓN": "Gestión del cine, salas, películas y programación",
    "VENTAS Y TICKETS": "Transacciones, reembolsos y validación de entradas",
    "OPERACIONES CLIENTE": "Compra de boletos, carrito y pedidos de confitería",
    "SOCIAL": "Reseñas, colecciones y seguidores",
  };

  if (creado) {
    return (
      <Modal open={open} onClose={handleClose} title="Permiso creado">
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <Check size={48} className="text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-2">Permiso creado exitosamente</p>
          <button onClick={handleClose}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900">
            Cerrar
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Crear nuevo permiso" maxWidth="max-w-lg">
      <div className="space-y-5">
        {permisoError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{permisoError}</div>
        )}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800">
          <p className="font-medium mb-0.5">¿Qué es un permiso?</p>
          <p className="text-xs text-indigo-600">Un permiso es una acción específica que un rol puede realizar en el sistema. Por ejemplo: <span className="font-semibold">"Permite gestionar usuarios"</span>.</p>
        </div>

        <div>
          <label htmlFor="permiso-descripcion" className="block text-xs font-medium text-gray-500 mb-1">¿Qué acción permite este permiso?</label>
          <input id="permiso-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Permite gestionar usuarios del sistema"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          {descripcion && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-gray-400">Código auto-generado:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                {codigo || "—"}
              </span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="permiso-modulo" className="block text-xs font-medium text-gray-500 mb-1">¿En qué área del sistema aplica?</label>
          <select id="permiso-modulo" value={modulo} onChange={(e) => setModulo(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Seleccione un módulo</option>
            {MODULOS_DISPONIBLES.map((m) => (
              <option key={m} value={m}>{m} — {MODULO_DESCRIPCION[m]}</option>
            ))}
          </select>
        </div>

        <PermisoDuplicado permisos={permisosDisponibles} codigo={codigo} />

        {descripcion && modulo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumen del permiso</p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                {codigo}
              </span>
              <span className="text-xs text-gray-400">→</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {modulo}
              </span>
            </div>
            <p className="text-xs text-gray-500">{descripcion}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={handleClose} disabled={guardando}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">Cancelar</button>
          <button onClick={handleCrear} disabled={guardando || !codigo.trim() || !modulo.trim() || duplicado}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:bg-gray-300">
            {guardando ? "Creando…" : "Crear permiso"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
CrearPermisoModal.propTypes = { open: PropTypes.bool, onClose: PropTypes.func, onRefresh: PropTypes.func, onCreado: PropTypes.func, permisosDisponibles: PropTypes.array };

function RolesYPermisos({ rolesDisponibles, permisosDisponibles, onRefresh, onDeleteRol, onDeletePermiso }) {
  const DESCRIPCION_MAP = {
    'VALIDAR_TICKETS_QR': 'Permite validar el código de entrada',
  }
  const [tipo, setTipo] = useState("");
  const [mostrado, setMostrado] = useState(null);
  const [permisosAsignados, setPermisosAsignados] = useState([]);
  const [permisosModificados, setPermisosModificados] = useState(false);
  const [creandoRol, setCreandoRol] = useState(false);
  const [creandoPermiso, setCreandoPermiso] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [eliminado, setEliminado] = useState(false);
  const [confirmarGuardar, setConfirmarGuardar] = useState(false);
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);
  const [mensajeGuardar, setMensajeGuardar] = useState(null);

  const rolesVisibles = useMemo(() => (rolesDisponibles || []).filter((r) => r.id_role !== 3), [rolesDisponibles]);

  useEffect(() => {
    if (mostrado) {
      apiFetch(`${API}/roles/${mostrado.id_role}/permisos`)
        .then((data) => setPermisosAsignados((data || []).map((p) => p.id_permiso)))
        .catch(() => setPermisosAsignados([]));
    }
  }, [mostrado]);

  function togglePermiso(pid) {
    setPermisosAsignados((prev) => (prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]));
    setPermisosModificados(true);
  }

  function guardarPermisos() {
    setMensajeGuardar(null);
    setConfirmarGuardar(true);
  }

  async function ejecutarGuardarPermisos() {
    setGuardandoPermisos(true);
    setMensajeGuardar(null);
    try {
      await apiFetch(`${API}/roles/${mostrado.id_role}/permisos`, { method: "PUT", body: JSON.stringify(permisosAsignados) });
      setPermisosModificados(false);
      if (onRefresh) await onRefresh();
      setMensajeGuardar({ tipo: "success", texto: "Permisos actualizados correctamente" });
    } catch (e) {
      setMensajeGuardar({ tipo: "error", texto: "Error al guardar permisos: " + e.message });
    } finally {
      setGuardandoPermisos(false);
    }
  }

  function pedirConfirmar(tipo, item) {
    setConfirmar({ tipo, item });
    setEliminado(false);
  }

  function cerrarConfirmar() {
    setConfirmar(null);
    setEliminado(false);
  }

  async function ejecutarEliminar() {
    if (!confirmar) return;
    const { tipo, item } = confirmar;
    setEliminando(true);
    try {
      if (tipo === "rol") {
        await apiFetch(`${API}/roles/${item.id_role}`, { method: "DELETE" });
        if (onDeleteRol) onDeleteRol(item.id_role);
      } else {
        await apiFetch(`${API}/permisos/${item.id_permiso}`, { method: "DELETE" });
        if (onDeletePermiso) onDeletePermiso(item.id_permiso);
      }
      setMostrado(null);
      setTipo("");
      setEliminado(true);
    } catch (e) {
      cerrarConfirmar();
      setMensajeGuardar({ tipo: "error", texto: "Error al eliminar " + (tipo === "rol" ? "rol" : "permiso") + ": " + e.message });
    } finally {
      setEliminando(false);
    }
  }

  const modulos = useMemo(() => {
    const m = {};
    const modulosPermitidos = MODULOS_POR_ROL[mostrado?.nombre_rol];
    (permisosDisponibles || []).forEach((p) => {
      if (modulosPermitidos && !modulosPermitidos.includes(p.modulo)) return;
      if (!m[p.modulo]) m[p.modulo] = [];
      m[p.modulo].push(p);
    });
    return m;
  }, [permisosDisponibles, mostrado]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[250px] flex-1">
            <label htmlFor="sel-rol" className="block text-xs font-medium text-gray-500 mb-1">Seleccionar rol</label>
            <div className="flex gap-2">
              <select id="sel-rol" value={tipo} onChange={(e) => {
                const r = rolesDisponibles.find((rl) => rl.id_role === Number(e.target.value));
                setTipo(e.target.value);
                if (r) setMostrado(r);
              }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Seleccione un rol</option>
                {rolesVisibles.map((r) => (
                  <option key={r.id_role} value={r.id_role}>{r.nombre_rol}</option>
                ))}
              </select>
              {mostrado && (
                <button onClick={() => pedirConfirmar("rol", mostrado)}
                  className="px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCreandoRol(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50">
              + Nuevo rol
            </button>
            <button onClick={() => setCreandoPermiso(true)}
              className="px-4 py-2 text-sm font-medium text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50">
              + Nuevo permiso
            </button>
          </div>
        </div>
      </div>

      {mostrado && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-indigo-700" />
              <h3 className="text-base font-semibold text-gray-900">Permisos para {mostrado.nombre_rol}</h3>
            </div>
            {permisosModificados && (
              <button onClick={guardarPermisos}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900">Guardar cambios</button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(modulos).map(([modulo, perms]) => (
              <div key={modulo}>
                <h4 className="text-xs font-semibold text-gray-500 tracking-wide mb-3 uppercase">{modulo}</h4>
                {perms.length === 0 ? <p className="text-xs text-gray-300">Sin permisos disponibles</p> : (
                  <ul className="space-y-2">
                    {perms.map((perm) => (
                      <li key={perm.id_permiso} className="flex items-start gap-2 text-sm text-gray-700 group">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input type="checkbox" checked={permisosAsignados.includes(perm.id_permiso)}
                            onChange={() => togglePermiso(perm.id_permiso)}
                            className="rounded border-gray-300 text-indigo-700 focus:ring-indigo-500" />
                          <span>{DESCRIPCION_MAP[perm.codigo_permiso] || perm.descripcion} <span className="text-gray-400 text-xs">({perm.codigo_permiso})</span></span>
                        </label>
                        <button onClick={() => pedirConfirmar("permiso", perm)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"
                          title="Eliminar permiso">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <CrearRolModal open={creandoRol} onClose={() => setCreandoRol(false)} onCreado={async () => { if (onRefresh) await onRefresh(); }} permisosDisponibles={permisosDisponibles} />
      <CrearPermisoModal open={creandoPermiso} onClose={() => setCreandoPermiso(false)} onRefresh={onRefresh} onCreado={async () => { if (onRefresh) await onRefresh(); }} permisosDisponibles={permisosDisponibles} />

      <Modal open={!!confirmar} onClose={cerrarConfirmar} title={eliminado ? (confirmar?.tipo === "rol" ? "Rol eliminado" : "Permiso eliminado") : (confirmar?.tipo === "rol" ? "Eliminar rol" : "Eliminar permiso")} maxWidth="max-w-sm">
        {eliminado ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <Check size={48} className="text-emerald-500" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              {confirmar?.tipo === "rol" ? "Rol eliminado exitosamente" : "Permiso eliminado exitosamente"}
            </p>
            <button onClick={cerrarConfirmar}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="flex justify-center mb-4">
              {confirmar?.tipo === "rol"
                ? <Trash2 size={36} className="text-red-500" />
                : <AlertTriangle size={36} className="text-amber-500" />
              }
            </div>
            <p className="text-sm text-gray-700 mb-6">
              {confirmar?.tipo === "rol"
                ? `¿Estás seguro de eliminar el rol "${confirmar?.item?.nombre_rol}"?`
                : `¿Estás seguro de eliminar el permiso "${confirmar?.item?.descripcion}" (${confirmar?.item?.codigo_permiso})?`
              }
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={cerrarConfirmar} disabled={eliminando}
                className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
              <button onClick={ejecutarEliminar} disabled={eliminando}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {eliminando && <RefreshCw size={14} className="animate-spin" />}
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={confirmarGuardar} onClose={() => { if (!guardandoPermisos) { setConfirmarGuardar(false); setMensajeGuardar(null); } }} title="Guardar cambios de permisos" maxWidth="max-w-md">
        <div className={mensajeGuardar ? "text-center py-4" : "text-center py-2"}>
          {!mensajeGuardar ? (
            <>
              <div className="flex justify-center mb-4">
                <Shield size={36} className="text-indigo-600" />
              </div>
              <p className="text-sm text-gray-700 mb-2">
                Se actualizarán los permisos del rol <strong>{mostrado?.nombre_rol}</strong>.
              </p>
              <p className="text-xs text-gray-500 mb-6">
                {permisosAsignados.length} permiso{permisosAsignados.length !== 1 ? "s" : ""} seleccionado{permisosAsignados.length !== 1 ? "s" : ""}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => { setConfirmarGuardar(false); setMensajeGuardar(null); }} disabled={guardandoPermisos}
                  className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">Cancelar</button>
                <button onClick={ejecutarGuardarPermisos} disabled={guardandoPermisos}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900 disabled:opacity-50">
                  {guardandoPermisos && <RefreshCw size={14} className="animate-spin" />}
                  {guardandoPermisos ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                {mensajeGuardar.tipo === "success"
                  ? <Check size={36} className="text-emerald-500" />
                  : <AlertTriangle size={36} className="text-red-500" />
                }
              </div>
              <p className={`text-sm mb-6 ${mensajeGuardar.tipo === "success" ? "text-gray-700" : "text-red-700"}`}>
                {mensajeGuardar.texto}
              </p>
              <div className="flex justify-center">
                <button onClick={() => { setConfirmarGuardar(false); setMensajeGuardar(null); }}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-800 rounded-lg hover:bg-indigo-900">Cerrar</button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
RolesYPermisos.propTypes = { rolesDisponibles: PropTypes.array, permisosDisponibles: PropTypes.array, onRefresh: PropTypes.func, onDeleteRol: PropTypes.func, onDeletePermiso: PropTypes.func };

function formatearFecha(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${anio} ${hh}:${mm}`;
}

function LogDeActividad({ rolesDisponibles }) {
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [errorLogs, setErrorLogs] = useState(null);
  const [usuarioMap, setUsuarioMap] = useState({});

  const rolMap = useMemo(() => {
    const m = {};
    (rolesDisponibles || []).forEach((r) => { m[r.id_role] = r.nombre_rol; });
    return m;
  }, [rolesDisponibles]);

  useEffect(() => {
    let cancel = false;
    async function cargar() {
      setCargando(true);
      setErrorLogs(null);
      try {
        const [logData, usersData] = await Promise.all([
          apiFetch(`${API}/logs/?page=1&limit=200`),
          apiFetch(`${API}/users/`),
        ]);
        if (cancel) return;
        setLogs(logData.items || []);
        setTotalLogs(logData.total || 0);
        const m = {};
        (usersData || []).forEach((u) => { m[u.id_usuario] = u; });
        setUsuarioMap(m);
      } catch (e) {
        if (cancel) return;
        setErrorLogs(e.message);
      } finally {
        if (!cancel) setCargando(false);
      }
    }
    cargar();
    return () => { cancel = true; };
  }, []);

  const logsMapeados = useMemo(() => logs.map((l) => ({
    id: l.id_log,
    fecha: formatearFecha(l.fecha_hora),
    usuario: usuarioMap[l.id_usuario]?.nombre || `ID ${l.id_usuario}`,
    rol: rolMap[usuarioMap[l.id_usuario]?.roles?.[0]] || "-",
    accion: l.accion_realizada,
    modulo: l.modulo_afectado,
    ip: l.ip_origen,
  })), [logs, usuarioMap, rolMap]);

  const rolesFiltro = useMemo(() => (rolesDisponibles || []).filter((r) => r.id_role !== 3), [rolesDisponibles]);
  const logRoleOpts = useMemo(() => rolesFiltro.map((r) => r.nombre_rol), [rolesFiltro]);

  const filtrados = useMemo(() => {
    return logsMapeados.filter((l) => {
      const matchTipo = !tipoFiltro || l.rol.toUpperCase() === tipoFiltro.toUpperCase();
      const matchModulo = !moduloFiltro || l.modulo === moduloFiltro;
      const q = busqueda.trim().toLowerCase();
      const matchBusqueda = !q || l.accion.toLowerCase().includes(q) || l.usuario.toLowerCase().includes(q);
      let matchFecha = true;
      if (fechaDesde || fechaHasta) {
        const fLog = new Date(l.fecha.split(" ")[0].split("/").reverse().join("-"));
        if (fechaDesde && fechaHasta) {
          matchFecha = fLog >= new Date(fechaDesde) && fLog <= new Date(fechaHasta);
        } else if (fechaDesde) {
          matchFecha = fLog >= new Date(fechaDesde);
        } else if (fechaHasta) {
          matchFecha = fLog <= new Date(fechaHasta);
        }
      }
      return matchTipo && matchModulo && matchBusqueda && matchFecha;
    });
  }, [logsMapeados, tipoFiltro, moduloFiltro, fechaDesde, fechaHasta, busqueda]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="log-tipo" className="block text-xs font-medium text-gray-500 mb-1">Tipo de usuario</label>
            <Select id="log-tipo" value={tipoFiltro} onChange={setTipoFiltro} options={logRoleOpts} placeholder="Todas" />
          </div>
          <div>
            <label htmlFor="log-modulo" className="block text-xs font-medium text-gray-500 mb-1">Módulo</label>
            <Select id="log-modulo" value={moduloFiltro} onChange={setModuloFiltro} options={MODULOS} placeholder="Todos" />
          </div>
          <div>
            <label htmlFor="log-fecha-desde" className="block text-xs font-medium text-gray-500 mb-1">Fecha desde</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="log-fecha-desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label htmlFor="log-fecha-hasta" className="block text-xs font-medium text-gray-500 mb-1">Fecha hasta</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="log-fecha-hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label htmlFor="log-buscar" className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input id="log-buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Busque con palabras clave" autoComplete="off" name="search-logs"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-semibold text-gray-900">Tabla de Historial</h3>
          <p className="text-sm text-gray-500">Registro de acciones realizadas por los usuarios en la plataforma</p>
        </div>
        {(() => {
          if (cargando) return (
            <div className="flex items-center justify-center py-12 text-sm text-gray-400">
              <RefreshCw size={16} className="animate-spin mr-2" /> Cargando historial...
            </div>
          );
          if (errorLogs) return (
            <div className="mx-5 mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              Error al cargar historial: {errorLogs}
            </div>
          );
          return (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-y border-gray-100">
                      <th className="px-5 py-3 font-medium">ID REGISTRO</th>
                      <th className="px-5 py-3 font-medium">FECHA Y HORA</th>
                      <th className="px-5 py-3 font-medium">USUARIO</th>
                      <th className="px-5 py-3 font-medium">ROL</th>
                      <th className="px-5 py-3 font-medium">ACCIÓN</th>
                      <th className="px-5 py-3 font-medium">MÓDULO</th>
                      <th className="px-5 py-3 font-medium">IP / ORIGEN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((l) => (
                      <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                        <td className="px-5 py-3 text-indigo-700 font-medium">LOG-{String(l.id).padStart(4, "0")}</td>
                        <td className="px-5 py-3 text-gray-500">{l.fecha}</td>
                        <td className="px-5 py-3 text-gray-800">{l.usuario}</td>
                        <td className="px-5 py-3 text-gray-600 uppercase text-xs">{l.rol}</td>
                        <td className="px-5 py-3 text-gray-600">{l.accion}</td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">{l.modulo}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{l.ip}</td>
                      </tr>
                    ))}
                    {filtrados.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400 text-sm">No se encontraron registros con estos filtros.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-5 py-4 text-sm text-gray-500">
                <span>Mostrando 1 a {filtrados.length} de {totalLogs} registros</span>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
LogDeActividad.propTypes = { rolesDisponibles: PropTypes.array };

const TABS = [
  { key: "directorio", label: "Directorio de Usuarios" },
  { key: "roles", label: "Roles y Permisos" },
  { key: "log", label: "Log de Actividad" },
];

export default function GestionUsuarios() {
  const { refreshPermisos } = useAuth();
  const [tab, setTab] = useState("directorio");
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  const [permisosDisponibles, setPermisosDisponibles] = useState([]);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const fetchRoles = useCallback(async () => {
    try { const data = await apiFetch(`${API}/roles/`); setRolesDisponibles(data || []); }
    catch (e) { setErrorGeneral(e.message); console.error("Error al cargar roles:", e); }
  }, []);

  const fetchPermisos = useCallback(async () => {
    try { const data = await apiFetch(`${API}/permisos/`); setPermisosDisponibles(data || []); }
    catch (e) { setErrorGeneral(e.message); console.error("Error al cargar permisos:", e); }
  }, []);

  const handleRefreshPermisos = useCallback(async () => {
    fetchRoles(); fetchPermisos(); await refreshPermisos();
  }, [fetchRoles, fetchPermisos, refreshPermisos]);

  const handleDeleteRol = useCallback((rolId) => {
    setRolesDisponibles((prev) => prev.filter((r) => r.id_role !== rolId));
  }, []);

  const handleDeletePermiso = useCallback((permisoId) => {
    setPermisosDisponibles((prev) => prev.filter((p) => p.id_permiso !== permisoId));
  }, []);

  useEffect(() => { fetchRoles(); fetchPermisos(); }, [fetchRoles, fetchPermisos]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="text-sm text-gray-500 mb-4">
          {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>

        {errorGeneral && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
            <span className="font-medium">Error:</span> {errorGeneral}
          </div>
        )}

        <div className="flex gap-6 border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition ${tab === t.key ? "border-indigo-800 text-indigo-800" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "directorio" && <DirectorioUsuarios rolesDisponibles={rolesDisponibles} />}
        {tab === "roles" && (
          <RolesYPermisos rolesDisponibles={rolesDisponibles} permisosDisponibles={permisosDisponibles}
            onRefresh={handleRefreshPermisos} onDeleteRol={handleDeleteRol} onDeletePermiso={handleDeletePermiso} />
        )}
        {tab === "log" && <LogDeActividad rolesDisponibles={rolesDisponibles} />}
      </div>
    </div>
  );
}
