(() => {
  const rutaBaseAdmin = document.currentScript?.src || new URL("admin.js", window.location.href).href;
  const modulosAdmin = [
    "admin/nucleo-dashboard-maquinas.js",
    "admin/editor-camara-iot-usuarios.js",
    "admin/caja-informes-logs.js",
    "admin/arranque.js",
  ];

  async function cargarModulo(ruta) {
    const respuesta = await fetch(new URL(ruta, rutaBaseAdmin), { cache: "no-store" });
    if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta}`);
    return respuesta.text();
  }

  (async () => {
    const codigo = (await Promise.all(modulosAdmin.map(cargarModulo))).join("\n");
    (0, Function)(codigo)();
  })().catch((error) => {
    console.error("Error cargando módulos de administración", error);
    alert("No se pudo cargar el panel de administración. Revisa la consola del navegador.");
  });
})();
