(function () {
  "use strict";

  var pick = document.querySelector(".install-pick");
  if (!pick) return;

  pick.querySelectorAll("[data-app]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var app = btn.getAttribute("data-app");
      pick.querySelectorAll("[data-app]").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.classList.toggle("door--rec", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".install-panel").forEach(function (panel) {
        panel.classList.toggle("is-on", panel.id === "install-" + app);
      });
    });
  });
})();
