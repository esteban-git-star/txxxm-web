(function () {
  "use strict";

  var STAGGER_MS = 120;
  var FLASH_MS = 200;

  function init() {
    var cards = document.querySelectorAll("[data-card]");
    if (!cards.length) return;

    // Fade-In: Kacheln nacheinander sichtbar
    cards.forEach(function (card, i) {
      card.style.transition = "opacity 0.5s ease " + (i * STAGGER_MS) + "ms, transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease";
      requestAnimationFrame(function () {
        card.classList.add("card-visible");
      });
    });

    // Klick: Aufblitzen, dann Weiterleitung
    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        var href = this.getAttribute("href");
        if (!href || href === "#") return;

        e.preventDefault();
        this.classList.add("card-flash");

        setTimeout(function () {
          window.location.href = href;
        }, FLASH_MS);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
