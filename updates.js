(function () {
  "use strict";

  var slot = document.getElementById("liveUpdates");
  if (!slot) return;

  var API = window.TIVIM_API || "";
  var VISIBLE_MAX = 3;

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function imageSrc(item) {
    if (!item || !item.image) return "";
    var src = String(item.image);
    if (src.indexOf("/updates/img/") === 0 && API) return API + src;
    if (src.indexOf("http") === 0) return src;
    return "";
  }

  function pickActive(items) {
    if (!items || !items.length) return [];
    return items
      .filter(function (item) {
        return item && item.active !== false && (item.title || item.body);
      })
      .sort(function (a, b) {
        var ha = a.highlight ? 1 : 0;
        var hb = b.highlight ? 1 : 0;
        if (ha !== hb) return hb - ha;
        var da = Date.parse(a.created || a.updated || 0) || 0;
        var db = Date.parse(b.created || b.updated || 0) || 0;
        return db - da;
      });
  }

  function renderCard(item) {
    var cls = "live-update" + (item.highlight ? " live-update--highlight" : "");
    var pin = item.highlight
      ? '<span class="live-update-pin">Wichtig</span>'
      : "";
    var title = item.title ? "<strong>" + escapeHtml(item.title) + "</strong>" : "";
    var img = imageSrc(item);
    var imgHtml = img
      ? '<img class="live-update-img" src="' +
        escapeHtml(img) +
        '" alt="" loading="lazy" decoding="async" />'
      : "";
    var body = item.body
      ? "<p>" + escapeHtml(item.body).replace(/\n/g, "<br>") + "</p>"
      : "";
    return '<article class="' + cls + '">' + pin + imgHtml + title + body + "</article>";
  }

  function render(items) {
    var active = pickActive(items);
    if (!active.length) {
      slot.classList.add("is-hide");
      slot.innerHTML = "";
      return;
    }

    slot.classList.remove("is-hide");
    var visible = active.slice(0, VISIBLE_MAX);
    var hidden = active.slice(VISIBLE_MAX);

    slot.innerHTML =
      '<div class="live-updates-label">Aktuelles</div>' +
      '<div class="live-updates-list" id="liveUpdatesList">' +
      visible.map(renderCard).join("") +
      (hidden.length
        ? '<div class="live-updates-more is-hide" id="liveUpdatesMore">' +
          hidden.map(renderCard).join("") +
          "</div>"
        : "") +
      "</div>" +
      (hidden.length
        ? '<button type="button" class="live-updates-toggle" id="liveUpdatesToggle">Mehr anzeigen (' +
          hidden.length +
          ")</button>"
        : "");

    var toggle = document.getElementById("liveUpdatesToggle");
    var more = document.getElementById("liveUpdatesMore");
    if (toggle && more) {
      toggle.addEventListener("click", function () {
        var open = !more.classList.contains("is-on");
        more.classList.toggle("is-on", open);
        more.classList.toggle("is-hide", !open);
        toggle.textContent = open
          ? "Weniger anzeigen"
          : "Mehr anzeigen (" + hidden.length + ")";
      });
    }
  }

  function loadFallback() {
    return fetch("updates.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { items: [] };
      })
      .catch(function () {
        return { items: [] };
      });
  }

  function loadLive() {
    if (!API) return loadFallback();
    return fetch(API + "/updates", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) return loadFallback();
        return res.json();
      })
      .catch(function () {
        return loadFallback();
      });
  }

  loadLive().then(function (data) {
    render((data && data.items) || []);
  });
})();
