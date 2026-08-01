Auth.requerirRol("RH", "FINANZAS", "EMPLEADO");
UI.navbar(Auth.getRol());

// El id viaja por query string, no hay estado compartido entre paginas.
const idRecibo = new URLSearchParams(location.search).get("id");

async function init() {
  try {
    const resp = await Api.get(`/recibos/${idRecibo}`);
    const recibo = resp.datos;
    const rol = Auth.getRol();

    // El recibo solo guarda el monto ya convertido a MXN; el tipo de cambio que se
    // aplico vive en el periodo, no en el recibo. Se pide aparte, y solo cuando hace
    // falta: RH/FINANZAS viendo el recibo de un empleado que cobra en USD.
    let tipoCambio = null;
    if ((rol === "RH" || rol === "FINANZAS") && recibo.moneda === "USD") {
      const periodo = await Api.get(`/periodos/${recibo.periodoId}`);
      tipoCambio = periodo.datos.tipoCambioUsd;
      pintarTipoCambio(tipoCambio, periodo.datos.fuenteTipoCambio);
    }

    pintarRecibo(recibo, tipoCambio);
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api (ej. 403 si el recibo no es suyo).
  }
}

function pintarTipoCambio(tipoCambio, fuente) {
  document.getElementById("bloqueTipoCambio").classList.remove("d-none");
  document.getElementById("tipoCambioValor").textContent = Number(tipoCambio).toFixed(4);
  document.getElementById("tipoCambioFuente").innerHTML = badgeFuente(fuente);
}

function badgeFuente(fuente) {
  const clases = { API: "bg-success", CACHE: "bg-warning text-dark", MANUAL: "bg-secondary" };
  return `<span class="badge ${clases[fuente] || "bg-secondary"} ms-1">${fuente}</span>`;
}

function pintarRecibo(r, tipoCambio) {
  document.getElementById("nombreEmpleado").textContent = r.nombreEmpleado;
  document.getElementById("numeroEmpleado").textContent = r.numeroEmpleado;
  document.getElementById("periodoId").textContent = r.periodoId;
  document.getElementById("sueldoBase").innerHTML = formatoDual(r.sueldoBase, tipoCambio);
  document.getElementById("totalPercepciones").innerHTML = formatoDual(r.totalPercepciones, tipoCambio);
  document.getElementById("totalDeducciones").innerHTML = formatoDual(r.totalDeducciones, tipoCambio);
  document.getElementById("totalNeto").innerHTML = formatoDual(r.netoPagar, tipoCambio);

  pintarConceptos("tbodyPercepciones", r.detalle.filter(d => d.tipo === "PERCEPCION"), tipoCambio);
  pintarConceptos("tbodyDeducciones", r.detalle.filter(d => d.tipo === "DEDUCCION"), tipoCambio);

  // La carga patronal es costo de la empresa, no del empleado: solo RH y FINANZAS la ven.
  const rol = Auth.getRol();
  if (rol === "RH" || rol === "FINANZAS") {
    document.getElementById("bloquePatronal").classList.remove("d-none");
    document.getElementById("totalCargaPatronal").textContent = UI.moneda(r.cargaPatronal);
    pintarConceptos("tbodyPatronal", r.detalle.filter(d => d.tipo === "PATRONAL"));
  }

  const enlace = document.getElementById("enlaceVolver");
  if (rol === "EMPLEADO") {
    enlace.href = "mis-recibos.html";
    enlace.textContent = "← Volver a mis recibos";
  } else {
    enlace.href = `periodo-detalle.html?id=${r.periodoId}`;
    enlace.textContent = "← Volver al periodo";
  }
}

// Sin tipo de cambio (empleado en MXN, o vista de EMPLEADO) se muestra solo el monto
// en pesos. Con tipo de cambio se agrega el equivalente en dolares: se recalcula
// dividiendo, porque el recibo nunca guarda el monto original en USD, solo el ya
// convertido a MXN.
function formatoDual(montoMxn, tipoCambio) {
  if (!tipoCambio) return UI.moneda(montoMxn);
  return `${UI.moneda(montoMxn)} MXN <span class="text-muted small">(&asymp; ${UI.monedaUSD(montoMxn / tipoCambio)})</span>`;
}

function pintarConceptos(tbodyId, conceptos, tipoCambio) {
  document.getElementById(tbodyId).innerHTML = conceptos.map(c => `
    <tr><td>${c.concepto}</td><td class="text-end">${formatoDual(c.monto, tipoCambio)}</td></tr>`).join("");
}

init();
