// Filtro del blog: muestra todos los textos o solo un tipo (blog, columnas, entrevistas).
(function () {
  var botones = document.querySelectorAll("[data-filtro]");
  if (!botones.length) return;
  var textos = document.querySelectorAll("[data-tipo]");
  var grupos = document.querySelectorAll("[data-grupo]");
  var estado = document.getElementById("estado-filtro");

  function aplicar(tipo) {
    var visibles = 0;
    textos.forEach(function (t) {
      var mostrar = tipo === "todos" || t.getAttribute("data-tipo") === tipo;
      t.hidden = !mostrar;
      if (mostrar) visibles++;
    });
    grupos.forEach(function (g) {
      g.hidden = !g.querySelector("[data-tipo]:not([hidden])");
    });
    botones.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-filtro") === tipo));
    });
    if (estado) {
      estado.textContent = "Mostrando " + visibles + " de " + textos.length + " textos.";
    }
  }

  botones.forEach(function (b) {
    b.addEventListener("click", function () {
      aplicar(b.getAttribute("data-filtro"));
    });
  });
})();
