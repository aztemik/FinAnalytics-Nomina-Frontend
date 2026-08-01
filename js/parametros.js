Auth.requerirRol("ADMIN");
UI.navbar(Auth.getRol());

async function cargarParametros() {
  try {
    const respuesta = await Api.get("/parametros");
    pintarTabla(respuesta.datos);
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

function pintarTabla(parametros) {
  const tbody = document.getElementById("tbodyParametros");

  // El valor se guarda como decimal (0.10) y se muestra como porcentaje (10); la
  // conversion ocurre solo al pintar y al guardar, nunca se persiste como porcentaje.
  tbody.innerHTML = parametros.map(p => `
    <tr>
      <td>${p.clave}</td>
      <td>${p.descripcion}</td>
      <td>
        <div class="input-group input-group-sm">
          <input type="number" step="0.001" min="0" class="form-control" id="valor-${p.id}" value="${(p.valor * 100).toFixed(3)}">
          <span class="input-group-text">%</span>
        </div>
      </td>
      <td><button type="button" class="btn btn-sm btn-teal" onclick="guardar(${p.id})">Guardar</button></td>
    </tr>`).join("");
}

async function guardar(id) {
  const input = document.getElementById(`valor-${id}`);
  const porcentaje = parseFloat(input.value);

  if (isNaN(porcentaje) || porcentaje <= 0) {
    input.classList.add("is-invalid");
    return;
  }
  input.classList.remove("is-invalid");

  try {
    await Api.put(`/parametros/${id}`, { valor: porcentaje / 100 });
    UI.alerta("Parametro actualizado", "success");
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api.
  }
}

cargarParametros();
