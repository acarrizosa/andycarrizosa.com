// Hemiciclo: reparte las 45 bancas entre dos bloques de colores.
// Cada vez que se abre la página se sortea qué color se queda con la mayoría
// (entre 23 y 27 bancas). Los dos bloques se llenan desde los extremos hacia el centro.
(function () {
  var bancas = document.querySelectorAll(".hemiciclo circle");
  var total = bancas.length;
  if (!total) return;

  var mayoria = Math.floor(total / 2) + 1 + Math.floor(Math.random() * 5); // 23 a 27
  var izquierdaGana = Math.random() < 0.5;
  var corte = izquierdaGana ? mayoria : total - mayoria; // bancas del bloque de la izquierda

  bancas.forEach(function (banca, i) {
    var izquierda = i < corte;
    banca.classList.add(izquierda ? "bloque-a" : "bloque-b");
    // Orden de llenado: desde cada extremo hacia el centro.
    banca.style.setProperty("--orden", izquierda ? i : total - 1 - i);
  });
})();
