Auth.requerirRol("ADMIN");
UI.navbar(Auth.getRol());

const REGEX_USERNAME = /^\S{4,50}$/;
const REGEX_PASSWORD = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;

let usuariosCache = [];
let rolesCache = [];

async function init() {
  try {
    const [usuarios, roles] = await Promise.all([Api.get("/usuarios"), Api.get("/roles")]);
    rolesCache = roles.datos;
    llenarSelectsRoles();
    usuariosCache = usuarios.datos;
    pintarTabla();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function llenarSelectsRoles() {
  const opciones = rolesCache.map(r => `<option value="${r.id}">${r.nombre}</option>`).join("");
  document.getElementById("altaRol").innerHTML = opciones;
  document.getElementById("editarRol").innerHTML = opciones;
}

function pintarTabla() {
  const tbody = document.getElementById("tbodyUsuarios");

  tbody.innerHTML = usuariosCache.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.nombreCompleto}</td>
      <td>${u.rol}</td>
      <td>${u.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
      <td class="text-end">
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="abrirEditar(${u.id})">Editar</button>
        ${u.activo ? `<button type="button" class="btn btn-sm btn-outline-danger" onclick="desactivar(${u.id})">Desactivar</button>` : ""}
      </td>
    </tr>`).join("");
}

function marcarValidez(id, valido) {
  document.getElementById(id).classList.toggle("is-invalid", !valido);
  return valido;
}

async function crearUsuario() {
  const datos = {
    username: document.getElementById("altaUsername").value.trim(),
    password: document.getElementById("altaPassword").value,
    nombreCompleto: document.getElementById("altaNombre").value.trim(),
    rolId: parseInt(document.getElementById("altaRol").value, 10)
  };

  const valido = [
    marcarValidez("altaUsername", REGEX_USERNAME.test(datos.username)),
    marcarValidez("altaPassword", REGEX_PASSWORD.test(datos.password)),
    marcarValidez("altaNombre", datos.nombreCompleto.length > 0),
    marcarValidez("altaRol", !!datos.rolId)
  ].every(Boolean);

  if (!valido) return;

  try {
    await Api.post("/usuarios", datos);
    UI.alerta("Usuario creado", "success");
    bootstrap.Modal.getInstance(document.getElementById("modalAlta")).hide();
    document.getElementById("altaUsername").value = "";
    document.getElementById("altaPassword").value = "";
    document.getElementById("altaNombre").value = "";
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function abrirEditar(id) {
  const usuario = usuariosCache.find(u => u.id === id);
  if (!usuario) return;

  document.getElementById("editarId").value = usuario.id;
  document.getElementById("editarUsername").value = usuario.username;
  document.getElementById("editarNombre").value = usuario.nombreCompleto;
  document.getElementById("editarRol").value = usuario.rolId;
  document.getElementById("editarActivo").checked = usuario.activo;
  document.getElementById("editarPassword").value = "";

  new bootstrap.Modal(document.getElementById("modalEditar")).show();
}

async function guardarEdicion() {
  const id = document.getElementById("editarId").value;
  const nombreCompleto = document.getElementById("editarNombre").value.trim();
  const nuevaPassword = document.getElementById("editarPassword").value;

  const valido = [
    marcarValidez("editarNombre", nombreCompleto.length > 0),
    marcarValidez("editarPassword", nuevaPassword === "" || REGEX_PASSWORD.test(nuevaPassword))
  ].every(Boolean);

  if (!valido) return;

  const datos = {
    nombreCompleto: nombreCompleto,
    rolId: parseInt(document.getElementById("editarRol").value, 10),
    activo: document.getElementById("editarActivo").checked
  };

  if (nuevaPassword) datos.passwordNueva = nuevaPassword;

  try {
    await Api.put(`/usuarios/${id}`, datos);
    UI.alerta("Usuario actualizado", "success");
    bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

async function desactivar(id) {
  if (!confirm("¿Desactivar este usuario? Ya no podra iniciar sesion.")) return;

  try {
    await Api.del(`/usuarios/${id}`);
    UI.alerta("Usuario desactivado", "success");
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

init();
