// No hay <form> con submit nativo: recargaria la pagina y se perderia la
// respuesta JSON de la API. Todo se maneja con onclick + fetch.

async function entrar() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    UI.alerta("Ingresa usuario y contrasena", "warning");
    return;
  }

  try {
    const respuesta = await Api.post("/auth/login", { username, password });

    Auth.guardarSesion(respuesta.datos.token, {
      username: respuesta.datos.username,
      nombreCompleto: respuesta.datos.nombreCompleto,
      rol: respuesta.datos.rol
    });

    location.href = Auth.rutaPorRol(respuesta.datos.rol);
  } catch (err) {
    // El mensaje de error ya se mostro dentro de Api (apiRequest); aqui no hay
    // nada mas que hacer salvo no dejar la promesa como rechazo sin atender.
  }
}
