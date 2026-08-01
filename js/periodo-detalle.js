Auth.requerirRol("RH", "FINANZAS");
UI.navbar(Auth.getRol());

// El id viaja por query string, no hay estado compartido entre paginas.
const idPeriodo = new URLSearchParams(location.search).get("id");

async function init() {
  try {
    const [periodo, recibos] = await Promise.all([
      Api.get(`/periodos/${idPeriodo}`),
      Api.get(`/recibos?periodoId=${idPeriodo}`)
    ]);
    pintarCabecera(periodo.datos);
    pintarRecibos(recibos.datos);
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function pintarCabecera(p) {
  document.getElementById("descripcion").textContent = p.descripcion;
  document.getElementById("fechas").textContent = `${UI.fecha(p.fechaInicio)} – ${UI.fecha(p.fechaFin)}`;
  document.getElementById("estado").innerHTML = UI.badgeEstado(p.estado);
  document.getElementById("totalPercepciones").textContent = UI.moneda(p.totalPercepciones);
  document.getElementById("totalDeducciones").textContent = UI.moneda(p.totalDeducciones);
  document.getElementById("totalNeto").textContent = UI.moneda(p.totalNeto);
  document.getElementById("totalCargaPatronal").textContent = UI.moneda(p.totalCargaPatronal);

  // Solo hay tipo de cambio si el periodo tuvo honorarios en USD al calcularse.
  const bloque = document.getElementById("bloqueTipoCambio");
  if (p.tipoCambioUsd) {
    bloque.classList.remove("d-none");
    document.getElementById("tipoCambioValor").textContent = Number(p.tipoCambioUsd).toFixed(4);
    document.getElementById("tipoCambioFuente").innerHTML = badgeFuente(p.fuenteTipoCambio);
  } else {
    bloque.classList.add("d-none");
  }
}

function badgeFuente(fuente) {
  const clases = { API: "bg-success", CACHE: "bg-warning text-dark", MANUAL: "bg-secondary" };
  return `<span class="badge ${clases[fuente] || "bg-secondary"} ms-1">${fuente}</span>`;
}

function pintarRecibos(recibos) {
  const tbody = document.getElementById("tbodyRecibos");

  tbody.innerHTML = recibos.map(r => `
    <tr>
      <td>${r.numeroEmpleado}</td>
      <td>${r.nombreEmpleado}</td>
      <td>${UI.moneda(r.netoPagar)}</td>
      <td class="text-end"><a class="btn btn-sm btn-outline-primary" href="recibo.html?id=${r.id}">Ver recibo</a></td>
    </tr>`).join("");
}

init();
