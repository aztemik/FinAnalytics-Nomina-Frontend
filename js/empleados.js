Auth.requerirRol("RH", "FINANZAS");
const rolActual = Auth.getRol();
UI.navbar(rolActual);

const REGEX_RFC = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;

let empleadosCache = [];
let usuariosEmpleadoCache = [];

async function init() {
  // FINANZAS solo lee empleados; el resto de la pantalla (nuevo, editar,
  // vinculacion) es exclusivo de RH, asi que ni se pide GET /api/usuarios.
  if (rolActual !== "RH") {
    document.getElementById("btnNuevo").classList.add("d-none");
  }

  try {
    const empleados = await Api.get("/empleados");
    empleadosCache = empleados.datos;

    if (rolActual === "RH") {
      const usuarios = await Api.get("/usuarios");
      usuariosEmpleadoCache = usuarios.datos.filter(u => u.rol === "EMPLEADO");
      llenarSelectUsuario();
    }

    pintarTabla(empleadosCache);
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function llenarSelectUsuario() {
  const opciones = usuariosEmpleadoCache
    .map(u => `<option value="${u.id}">${u.username} — ${u.nombreCompleto}</option>`)
    .join("");
  document.getElementById("campoUsuarioId").innerHTML = '<option value="">Sin vincular</option>' + opciones;
}

function filtrar() {
  const q = document.getElementById("buscador").value.trim().toLowerCase();

  const filtrados = q === "" ? empleadosCache : empleadosCache.filter(e =>
    e.numeroEmpleado.toLowerCase().includes(q) ||
    e.nombre.toLowerCase().includes(q) ||
    e.apellidos.toLowerCase().includes(q) ||
    e.rfc.toLowerCase().includes(q)
  );

  pintarTabla(filtrados);
}

function pintarTabla(lista) {
  const tbody = document.getElementById("tbodyEmpleados");

  tbody.innerHTML = lista.map(e => `
    <tr>
      <td>${e.numeroEmpleado}</td>
      <td>${e.nombre} ${e.apellidos}</td>
      <td>${e.rfc}</td>
      <td>${badgeTipo(e.tipoContratacion)}</td>
      <td>${UI.moneda(e.salarioMensual)}</td>
      <td>${e.activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
      <td class="text-end">${rolActual === "RH" ? accionesFila(e) : ""}</td>
    </tr>`).join("");
}

function badgeTipo(tipo) {
  return tipo === "HONORARIOS"
    ? '<span class="badge bg-info text-dark">HONORARIOS</span>'
    : '<span class="badge bg-primary">NOMINA</span>';
}

function accionesFila(e) {
  const editar = `<button type="button" class="btn btn-sm btn-outline-secondary" onclick="abrirEditar(${e.id})">Editar</button>`;
  const eliminar = e.activo
    ? ` <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarEmpleado(${e.id})">Eliminar</button>`
    : "";
  return editar + eliminar;
}

function actualizarVisibilidadMoneda() {
  const esHonorarios = document.getElementById("campoTipoContratacion").value === "HONORARIOS";
  document.getElementById("grupoMoneda").classList.toggle("d-none", !esHonorarios);
}

function marcarValidez(id, valido) {
  document.getElementById(id).classList.toggle("is-invalid", !valido);
  return valido;
}

function limpiarValidez() {
  ["campoNumeroEmpleado", "campoRfc", "campoNombre", "campoApellidos", "campoSalario", "campoFechaIngreso"]
    .forEach(id => document.getElementById(id).classList.remove("is-invalid"));
}

function abrirNuevo() {
  document.getElementById("modalEmpleadoTitulo").textContent = "Nuevo empleado";
  document.getElementById("campoId").value = "";
  document.getElementById("campoNumeroEmpleado").value = "";
  document.getElementById("campoRfc").value = "";
  document.getElementById("campoNombre").value = "";
  document.getElementById("campoApellidos").value = "";
  document.getElementById("campoPuesto").value = "";
  document.getElementById("campoDepartamento").value = "";
  document.getElementById("campoTipoContratacion").value = "NOMINA";
  document.getElementById("campoMoneda").value = "MXN";
  document.getElementById("campoSalario").value = "";
  document.getElementById("campoFechaIngreso").value = "";
  document.getElementById("campoUsuarioId").value = "";
  actualizarVisibilidadMoneda();
  limpiarValidez();

  new bootstrap.Modal(document.getElementById("modalEmpleado")).show();
}

function abrirEditar(id) {
  const empleado = empleadosCache.find(e => e.id === id);
  if (!empleado) return;

  document.getElementById("modalEmpleadoTitulo").textContent = "Editar empleado";
  document.getElementById("campoId").value = empleado.id;
  document.getElementById("campoNumeroEmpleado").value = empleado.numeroEmpleado;
  document.getElementById("campoRfc").value = empleado.rfc;
  document.getElementById("campoNombre").value = empleado.nombre;
  document.getElementById("campoApellidos").value = empleado.apellidos;
  document.getElementById("campoPuesto").value = empleado.puesto || "";
  document.getElementById("campoDepartamento").value = empleado.departamento || "";
  document.getElementById("campoTipoContratacion").value = empleado.tipoContratacion;
  document.getElementById("campoMoneda").value = empleado.moneda;
  document.getElementById("campoSalario").value = empleado.salarioMensual;
  document.getElementById("campoFechaIngreso").value = empleado.fechaIngreso.slice(0, 10);
  document.getElementById("campoUsuarioId").value = empleado.usuarioId || "";
  actualizarVisibilidadMoneda();
  limpiarValidez();

  new bootstrap.Modal(document.getElementById("modalEmpleado")).show();
}

async function guardarEmpleado() {
  const id = document.getElementById("campoId").value;
  const tipoContratacion = document.getElementById("campoTipoContratacion").value;
  const usuarioIdTexto = document.getElementById("campoUsuarioId").value;

  const datos = {
    numeroEmpleado: document.getElementById("campoNumeroEmpleado").value.trim(),
    nombre: document.getElementById("campoNombre").value.trim(),
    apellidos: document.getElementById("campoApellidos").value.trim(),
    rfc: document.getElementById("campoRfc").value.trim().toUpperCase(),
    puesto: document.getElementById("campoPuesto").value.trim() || null,
    departamento: document.getElementById("campoDepartamento").value.trim() || null,
    tipoContratacion: tipoContratacion,
    moneda: tipoContratacion === "HONORARIOS" ? document.getElementById("campoMoneda").value : "MXN",
    salarioMensual: parseFloat(document.getElementById("campoSalario").value),
    fechaIngreso: document.getElementById("campoFechaIngreso").value,
    usuarioId: usuarioIdTexto ? parseInt(usuarioIdTexto, 10) : null
  };

  if (!validarEmpleado(datos)) return;

  try {
    if (id) {
      await Api.put(`/empleados/${id}`, datos);
      UI.alerta("Empleado actualizado", "success");
    } else {
      await Api.post("/empleados", datos);
      UI.alerta("Empleado creado", "success");
    }
    bootstrap.Modal.getInstance(document.getElementById("modalEmpleado")).hide();
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function validarEmpleado(datos) {
  const hoy = new Date().toISOString().slice(0, 10);

  return [
    marcarValidez("campoNumeroEmpleado", datos.numeroEmpleado.length > 0 && datos.numeroEmpleado.length <= 20),
    marcarValidez("campoRfc", REGEX_RFC.test(datos.rfc)),
    marcarValidez("campoNombre", datos.nombre.length > 0),
    marcarValidez("campoApellidos", datos.apellidos.length > 0),
    marcarValidez("campoSalario", !isNaN(datos.salarioMensual) && datos.salarioMensual > 0),
    marcarValidez("campoFechaIngreso", !!datos.fechaIngreso && datos.fechaIngreso <= hoy)
  ].every(Boolean);
}

async function eliminarEmpleado(id) {
  if (!confirm("¿Dar de baja a este empleado?")) return;

  try {
    await Api.del(`/empleados/${id}`);
    UI.alerta("Empleado desactivado", "success");
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

init();
