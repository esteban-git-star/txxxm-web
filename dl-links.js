(function () {
  "use strict";
  var base = window.TIVIM_API || "";
  document.querySelectorAll("[data-dl]").forEach(function (el) {
    var key = el.getAttribute("data-dl");
    if (!key || !base) return;
    el.href = base + "/dl/" + key;
  });
})();
