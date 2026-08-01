Auth.requerirRol("EMPLEADO");
UI.navbar(Auth.getRol());

// Sin id de empleado en la peticion: el backend lo saca del claim del token.
async function init() {
  try {
    const recibos = await Api.get("/recibos/mis-recibos");
    pintarRecibos(recibos.datos);
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function pintarRecibos(recibos) {
  const tbody = document.getElementById("tbodyRecibos");

  if (recibos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Aun no tienes recibos de periodos aprobados.</td></tr>`;
    return;
  }

  tbody.innerHTML = recibos.map(r => `
    <tr>
      <td>Periodo #${r.periodoId}</td>
      <td>${UI.moneda(r.sueldoBase)}</td>
      <td>${UI.moneda(r.netoPagar)}</td>
      <td class="text-end"><a class="btn btn-sm btn-outline-primary" href="recibo.html?id=${r.id}">Ver recibo</a></td>
    </tr>`).join("");
}

init();
