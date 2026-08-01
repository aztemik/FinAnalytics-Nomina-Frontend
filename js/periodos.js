Auth.requerirRol("RH", "FINANZAS");
const rolActual = Auth.getRol();
UI.navbar(rolActual);

let periodosCache = [];

async function init() {
  if (rolActual !== "RH") {
    document.getElementById("btnNuevo").classList.add("d-none");
  }

  try {
    const respuesta = await Api.get("/periodos");
    periodosCache = respuesta.datos;
    pintarTabla();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function pintarTabla() {
  const tbody = document.getElementById("tbodyPeriodos");
  const ordenados = [...periodosCache].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));

  tbody.innerHTML = ordenados.map(p => `
    <tr>
      <td>${p.descripcion}</td>
      <td>${UI.fecha(p.fechaInicio)} – ${UI.fecha(p.fechaFin)}</td>
      <td>${UI.badgeEstado(p.estado)}</td>
      <td>${UI.moneda(p.totalNeto)}</td>
      <td class="text-end">${acciones(p)}</td>
    </tr>`).join("");
}

// Matriz de botones por rol Y estado (ESTUDIO_FRONTEND.md §2.6):
// BORRADOR -> RH: Editar, Eliminar, Calcular, Ver detalle. FINANZAS: Ver detalle, Aprobar.
// APROBADO -> ambos roles: solo Ver detalle.
function acciones(p) {
  const botones = [`<a class="btn btn-sm btn-outline-primary" href="periodo-detalle.html?id=${p.id}">Ver detalle</a>`];

  if (rolActual === "RH" && p.estado === "BORRADOR") {
    botones.push(`<button type="button" class="btn btn-sm btn-outline-secondary" onclick="abrirEditar(${p.id})">Editar</button>`);
    botones.push(`<button type="button" class="btn btn-sm btn-teal" onclick="calcular(${p.id})">Calcular</button>`);
    botones.push(`<button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarPeriodo(${p.id})">Eliminar</button>`);
  }

  if (rolActual === "FINANZAS" && p.estado === "BORRADOR") {
    botones.push(`<button type="button" class="btn btn-sm btn-teal" onclick="aprobar(${p.id})">Aprobar</button>`);
  }

  return botones.join(" ");
}

function marcarValidez(id, valido) {
  document.getElementById(id).classList.toggle("is-invalid", !valido);
  return valido;
}

function limpiarValidez() {
  ["campoDescripcion", "campoFechaInicio", "campoFechaFin"].forEach(id => document.getElementById(id).classList.remove("is-invalid"));
}

function abrirNuevo() {
  document.getElementById("modalPeriodoTitulo").textContent = "Nuevo periodo";
  document.getElementById("campoId").value = "";
  document.getElementById("campoDescripcion").value = "";
  document.getElementById("campoFechaInicio").value = "";
  document.getElementById("campoFechaFin").value = "";
  limpiarValidez();

  new bootstrap.Modal(document.getElementById("modalPeriodo")).show();
}

function abrirEditar(id) {
  const periodo = periodosCache.find(p => p.id === id);
  if (!periodo) return;

  document.getElementById("modalPeriodoTitulo").textContent = "Editar periodo";
  document.getElementById("campoId").value = periodo.id;
  document.getElementById("campoDescripcion").value = periodo.descripcion;
  document.getElementById("campoFechaInicio").value = periodo.fechaInicio.slice(0, 10);
  document.getElementById("campoFechaFin").value = periodo.fechaFin.slice(0, 10);
  limpiarValidez();

  new bootstrap.Modal(document.getElementById("modalPeriodo")).show();
}

async function guardarPeriodo() {
  const id = document.getElementById("campoId").value;
  const datos = {
    descripcion: document.getElementById("campoDescripcion").value.trim(),
    fechaInicio: document.getElementById("campoFechaInicio").value,
    fechaFin: document.getElementById("campoFechaFin").value
  };

  const valido = [
    marcarValidez("campoDescripcion", datos.descripcion.length > 0),
    marcarValidez("campoFechaInicio", !!datos.fechaInicio),
    marcarValidez("campoFechaFin", !!datos.fechaFin && datos.fechaFin > datos.fechaInicio)
  ].every(Boolean);

  if (!valido) return;

  try {
    if (id) {
      await Api.put(`/periodos/${id}`, datos);
      UI.alerta("Periodo actualizado", "success");
    } else {
      await Api.post("/periodos", datos);
      UI.alerta("Periodo creado", "success");
    }
    bootstrap.Modal.getInstance(document.getElementById("modalPeriodo")).hide();
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

async function calcular(id) {
  if (!confirm("¿Calcular la nomina de este periodo? Esto borra los recibos previos del periodo y los regenera.")) return;

  try {
    await Api.post(`/periodos/${id}/calcular`);
    UI.alerta("Nomina calculada", "success");
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

async function aprobar(id) {
  if (!confirm("¿Aprobar este periodo? Los empleados podran ver sus recibos y RH ya no podra modificarlo.")) return;

  try {
    await Api.post(`/periodos/${id}/aprobar`);
    UI.alerta("Periodo aprobado", "success");
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

async function eliminarPeriodo(id) {
  if (!confirm("¿Eliminar este periodo? Si ya fue calculado, tambien se pierden sus recibos.")) return;

  try {
    await Api.del(`/periodos/${id}`);
    UI.alerta("Periodo eliminado", "success");
    await init();
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

init();
