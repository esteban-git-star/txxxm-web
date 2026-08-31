(function () {
  "use strict";

  var slot = document.getElementById("liveUpdates");
  if (!slot) return;

  var API = window.TIVIM_API || "";

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pickActive(items) {
    if (!items || !items.length) return [];
    return items
      .filter(function (item) {
        return item && item.active !== false && (item.title || item.body);
      })
      .sort(function (a, b) {
        var da = Date.parse(a.created || a.updated || 0) || 0;
        var db = Date.parse(b.created || b.updated || 0) || 0;
        return db - da;
      });
  }

  function render(items) {
    var active = pickActive(items);
    if (!active.length) {
      slot.classList.add("is-hide");
      slot.innerHTML = "";
      return;
    }

    slot.classList.remove("is-hide");
    slot.innerHTML = active
      .slice(0, 2)
      .map(function (item) {
        var title = item.title ? "<strong>" + escapeHtml(item.title) + "</strong>" : "";
        var body = item.body
          ? "<p>" + escapeHtml(item.body).replace(/\n/g, "<br>") + "</p>"
          : "";
        return '<article class="live-update">' + title + body + "</article>";
      })
      .join("");
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
