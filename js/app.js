// NUCLEO: configuracion + sesion (Auth) + fetch (Api) + helpers de interfaz (UI).
// Ninguna pagina llama fetch directo: todo pasa por aqui.

const API_URL = "https://localhost:44334/api";

// Rutas relativas a la pagina que llama, nunca absolutas ("/..."): Live Server no
// siempre sirve frontend/ como raiz del servidor (depende de que carpeta abrio VS
// Code), asi que una ruta que empiece con "/" puede apuntar fuera del sitio.
function estaEnPaginas() {
  return location.pathname.includes("/paginas/");
}

const Auth = {
  guardarSesion(token, usuario) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
  },

  getToken() {
    return sessionStorage.getItem("token");
  },

  getUsuario() {
    const datos = sessionStorage.getItem("usuario");
    return datos ? JSON.parse(datos) : null;
  },

  getRol() {
    const usuario = Auth.getUsuario();
    return usuario ? usuario.rol : null;
  },

  cerrarSesion() {
    sessionStorage.clear();
    location.href = Auth.rutaLogin();
  },

  // Se invoca en la primera linea de cada pagina protegida.
  requerirRol(...roles) {
    const rol = Auth.getRol();

    if (!Auth.getToken() || !rol) {
      location.href = Auth.rutaLogin();
      return;
    }

    if (!roles.includes(rol)) {
      location.href = Auth.rutaPorRol(rol);
    }
  },

  rutaPorRol(rol) {
    const paginas = {
      ADMIN: "usuarios.html",
      RH: "empleados.html",
      FINANZAS: "periodos.html",
      EMPLEADO: "mis-recibos.html"
    };
    const archivo = paginas[rol];
    if (!archivo) return Auth.rutaLogin();
    // Desde index.html el destino esta en paginas/; desde otra pagina de
    // paginas/ el destino es un hermano en la misma carpeta.
    return estaEnPaginas() ? archivo : "paginas/" + archivo;
  },

  rutaLogin() {
    return estaEnPaginas() ? "../index.html" : "index.html";
  }
};

async function apiRequest(ruta, opciones = {}) {
  const token = Auth.getToken();
  const headers = { "Content-Type": "application/json", ...(opciones.headers || {}) };
  if (token) headers["Authorization"] = "Bearer " + token;

  try {
    const res = await fetch(API_URL + ruta, { ...opciones, headers });

    if (res.status === 401) {
      // Con token: la sesion murio, se cierra y se regresa al login.
      // Sin token (ej. login con credenciales invalidas): no habia sesion que
      // cerrar, se muestra el mensaje real del servidor en vez de "sesion expirada".
      if (token) {
        UI.alerta("Sesion expirada", "warning");
        Auth.cerrarSesion();
      } else {
        const e = await res.json();
        UI.alerta(e.mensaje, "danger");
      }
      throw new Error("401");
    }
    if (res.status === 403) { UI.alerta("No tienes permiso para esta accion", "danger"); throw new Error("403"); }
    if (res.status === 409) { const e = await res.json(); UI.alerta(e.mensaje, "warning"); throw new Error("409"); }
    if (res.status === 400) { const e = await res.json(); UI.alerta(e.errores.join(" · "), "danger"); throw new Error("400"); }
    if (!res.ok)            { UI.alerta("Error del servidor", "danger"); throw new Error(String(res.status)); }

    return res.status === 204 ? null : await res.json();
  } catch (err) {
    if (err instanceof TypeError) UI.alerta("No se pudo conectar con la API. Verifica que este en ejecucion.", "danger");
    throw err;
  }
}

const Api = {
  get:  (r)    => apiRequest(r),
  post: (r, d) => apiRequest(r, { method: "POST",   body: JSON.stringify(d) }),
  put:  (r, d) => apiRequest(r, { method: "PUT",    body: JSON.stringify(d) }),
  del:  (r)    => apiRequest(r, { method: "DELETE" })
};

const UI = {
  navbar(rol) {
    const contenedor = document.getElementById("navbar");
    if (!contenedor) return;

    // El navbar solo se pinta desde dentro de paginas/, asi que estos son
    // siempre hermanos en la misma carpeta (sin prefijo).
    const menus = {
      ADMIN: [
        { texto: "Usuarios", href: "usuarios.html" },
        { texto: "Parametros", href: "parametros.html" }
      ],
      RH: [
        { texto: "Empleados", href: "empleados.html" },
        { texto: "Periodos", href: "periodos.html" }
      ],
      FINANZAS: [
        { texto: "Periodos", href: "periodos.html" },
        { texto: "Empleados", href: "empleados.html" }
      ],
      EMPLEADO: [
        { texto: "Mis recibos", href: "mis-recibos.html" }
      ]
    };

    const usuario = Auth.getUsuario();
    const enlaces = (menus[rol] || [])
      .map(m => `<a class="nav-link" href="${m.href}">${m.texto}</a>`)
      .join("");

    contenedor.innerHTML = `
      <nav class="navbar navbar-expand navbar-dark mb-4">
        <div class="container-fluid">
          <span class="navbar-brand">FinAnalytics OS</span>
          <div class="navbar-nav me-auto">${enlaces}</div>
          <span class="navbar-text text-white-50 me-3">${usuario ? usuario.nombreCompleto : ""} · ${rol}</span>
          <button type="button" class="btn btn-outline-light btn-sm" onclick="Auth.cerrarSesion()">Salir</button>
        </div>
      </nav>`;
  },

  alerta(mensaje, tipo = "info") {
    const contenedor = document.getElementById("alertas");
    if (!contenedor) return;

    const id = "alerta-" + Date.now();
    contenedor.insertAdjacentHTML("beforeend", `
      <div id="${id}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>`);

    setTimeout(() => document.getElementById(id)?.remove(), 5000);
  },

  moneda(n) {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
  },

  // Prefijo manual ("US$") en vez de Intl con currency:"USD": Intl usa el mismo
  // simbolo "$" para USD y MXN, y aqui se muestran ambas una junto a la otra.
  monedaUSD(n) {
    return "US$ " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  },

  fecha(iso) {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  },

  badgeEstado(estado) {
    return estado === "APROBADO"
      ? '<span class="badge bg-success">APROBADO</span>'
      : '<span class="badge bg-secondary">BORRADOR</span>';
  }
};
