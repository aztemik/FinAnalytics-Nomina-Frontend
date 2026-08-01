// NUCLEO: configuracion + sesion (Auth) + fetch (Api) + helpers de interfaz (UI).
// Ninguna pagina llama fetch directo: todo pasa por aqui.

const API_URL = "https://localhost:44334/api";

// Rutas absolutas desde la raiz del sitio (Live Server sirve frontend/ como raiz):
// asi Auth.rutaPorRol / Auth.rutaLogin funcionan igual sin importar si quien las
// invoca esta en index.html o en paginas/algo.html.
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
    const rutas = {
      ADMIN: "/paginas/usuarios.html",
      RH: "/paginas/empleados.html",
      FINANZAS: "/paginas/periodos.html",
      EMPLEADO: "/paginas/mis-recibos.html"
    };
    return rutas[rol] || Auth.rutaLogin();
  },

  rutaLogin() {
    return "/index.html";
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

    const menus = {
      ADMIN: [
        { texto: "Usuarios", href: "/paginas/usuarios.html" },
        { texto: "Parametros", href: "/paginas/parametros.html" }
      ],
      RH: [
        { texto: "Empleados", href: "/paginas/empleados.html" },
        { texto: "Periodos", href: "/paginas/periodos.html" }
      ],
      FINANZAS: [
        { texto: "Periodos", href: "/paginas/periodos.html" },
        { texto: "Empleados", href: "/paginas/empleados.html" }
      ],
      EMPLEADO: [
        { texto: "Mis recibos", href: "/paginas/mis-recibos.html" }
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

  fecha(iso) {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  },

  badgeEstado(estado) {
    return estado === "APROBADO"
      ? '<span class="badge bg-success">APROBADO</span>'
      : '<span class="badge bg-secondary">BORRADOR</span>';
  }
};
