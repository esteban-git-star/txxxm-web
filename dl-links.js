(function () {
  "use strict";

  var base = window.TIVIM_API || "";
  /* Fallback bis Worker deployed / pc-app in Admin gesetzt */
  var fallback = {
    "pc-app":
      "https://drive.google.com/file/d/1TqqzKKtyVRux-cw_DmgWxzD1v9hvkKNG/view?usp=sharing",
  };

  document.querySelectorAll("[data-dl]").forEach(function (el) {
    var key = el.getAttribute("data-dl");
    if (!key) return;
    if (fallback[key]) {
      el.href = fallback[key];
      return;
    }
    if (!base) return;
    el.href = base + "/dl/" + key;
  });
})();
