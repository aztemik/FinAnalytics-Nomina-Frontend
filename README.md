# FinAnalytics OS · Frontend

Producto 03 · Desarrollo Web Integral · UTP · Entrega individual

Cliente web del sistema de nómina FinAnalytics OS. HTML5 multipágina, Bootstrap 5.3 por CDN y JavaScript ES6 vanilla (`fetch`, `async/await`) — sin frameworks, sin build step, sin npm.

El backend vive en un repositorio aparte, **`FinAnalytics-Nomina-Backend`** (carpeta hermana de esta). Este frontend no funciona sin él corriendo.

Para el detalle de arquitectura y decisiones de diseño ver `PLAN_FRONTEND.md`; para la explicación de cada archivo pensada para la evaluación oral, ver `ESTUDIO_FRONTEND.md`.

---

## Estado del proyecto

Fase A (núcleo) en progreso: FE-01 a FE-06 completos — estructura de carpetas, `app.js` (sesión, `fetch` envuelto, helpers de interfaz), `styles.css` y el login. Falta FE-07 (prueba de humo) y las Fases B–E completas (pantallas de ADMIN, RH, periodos/aprobación, EMPLEADO). Ver `PLAN_FRONTEND.md` §6 para el tablero completo.

---

## Requisitos

- El backend de FinAnalytics OS corriendo en `https://localhost:44334` — ver el README de `FinAnalytics-Nomina-Backend`
- Extensión **Live Server** de VS Code (o cualquier servidor estático que sirva esta carpeta como raíz)

---

## Ejecutar

1. Levantar primero el backend (IIS Express, F5 en Visual Studio).
2. **Aceptar el certificado HTTPS de localhost** de la API abriéndola una vez en el navegador (`https://localhost:44334`). Si no se acepta, todos los `fetch` de este frontend fallan en silencio.
3. Abrir esta carpeta (`FinAnalytics-Nomina-Frontend/`) en VS Code.
4. Clic derecho sobre `index.html` → **Open with Live Server**. Sirve en `http://127.0.0.1:5500`.
5. Iniciar sesión con un usuario ya creado en el backend (ver el README del backend para usuarios de prueba).

---

## Configuración

La URL de la API vive en una sola constante, en `js/app.js`:

```js
const API_URL = "https://localhost:44334/api";
```

Cambiar el puerto o el host de la API es editar esta línea, nada más. Si el puerto de Live Server cambia (por defecto `5500`), hay que actualizar también el origen permitido en el backend (`EnableCorsAttribute` en `App_Start/WebApiConfig.cs`).

---

## Estructura

```
frontend/
├── index.html                 # LOGIN (unica pagina publica)
├── css/
│   └── styles.css
├── js/
│   ├── app.js                 # NUCLEO: config + sesion + fetch + helpers UI
│   ├── login.js
│   └── ...                    # un script por pantalla, se agregan por fase
└── paginas/
    └── ...                    # una pagina por pantalla, se agregan por fase
```

Detalle completo de pantallas por rol y contenido de cada una en `PLAN_FRONTEND.md` §2–3.

---

## Seguridad — lo que hay que recordar

Ocultar botones o redirigir páginas según el rol (`Auth.requerirRol`, `UI.navbar`) es **usabilidad, no seguridad**. La protección real vive en el backend (`[Autorizar(Roles=...)]`): cualquier endpoint devuelve 401/403 aunque se llame directo desde la consola del navegador, sin pasar por esta interfaz. Ver `ESTUDIO_FRONTEND.md` §2.1 y §3.
