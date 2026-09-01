(function () {
  "use strict";

  var API = window.TIVIM_API || "";
  var SESSION_KEY = "tivim_admin_token";
  var PANEL_TITLES = {
    wishes: "Wunschbox",
    updates: "Live-Updates",
    install: "Codes & Downloads"
  };

  var loginScreen = document.getElementById("loginScreen");
  var cockpit = document.getElementById("cockpit");
  var loginForm = document.getElementById("loginForm");
  var postForm = document.getElementById("postForm");
  var itemsList = document.getElementById("itemsList");
  var wishesTableBody = document.getElementById("wishesTableBody");
  var wishesCards = document.getElementById("wishesCards");
  var adminStatus = document.getElementById("adminStatus");
  var cockpitTitle = document.getElementById("cockpitTitle");
  var updatesGrid = document.getElementById("updatesGrid");

  function token() {
    return sessionStorage.getItem(SESSION_KEY) || "";
  }

  function setToken(value) {
    if (value) sessionStorage.setItem(SESSION_KEY, value);
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function showCockpit(on) {
    loginScreen.classList.toggle("is-hide", on);
    cockpit.classList.toggle("is-on", on);
    if (on && typeof lucide !== "undefined") lucide.createIcons();
  }

  function switchPanel(id) {
    document.querySelectorAll(".cockpit-view").forEach(function (p) {
      p.classList.toggle("is-active", p.id === "panel-" + id);
    });
    document.querySelectorAll("[data-panel]").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-panel") === id);
    });
    if (cockpitTitle) cockpitTitle.textContent = PANEL_TITLES[id] || "Admin";
  }

  document.querySelectorAll("[data-panel]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchPanel(btn.getAttribute("data-panel"));
    });
  });

  document.querySelectorAll("[data-sub]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sub = btn.getAttribute("data-sub");
      document.querySelectorAll("[data-sub]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      if (updatesGrid) {
        updatesGrid.classList.toggle("is-list", sub === "list");
      }
    });
  });

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token()
    };
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return iso.slice(0, 16).replace("T", ", ");
  }

  function updateWishBadges(count) {
    ["wishBadge", "wishBadgeDock"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = count;
      el.classList.toggle("is-hide", !count);
    });
  }

  function openWishCount(items) {
    var n = 0;
    items.forEach(function (w) {
      if (!w.done) n++;
    });
    return n;
  }

  function wishRowClass(w) {
    return w.done ? "wish-row wish-row--done" : "wish-row";
  }

  function wishTypeBadge(w) {
    if (!w.trakt || !w.trakt.type) return "";
    var label = w.trakt.type === "movie" ? "Film" : "Serie";
    return (
      '<span class="wish-type-badge wish-type-badge--' +
      escapeHtml(w.trakt.type) +
      '">' +
      escapeHtml(label) +
      "</span> "
    );
  }

  function wishPosterHtml(w) {
    var poster = w.trakt && w.trakt.poster;
    var type = (w.trakt && w.trakt.type) || "";
    if (poster) {
      return (
        '<img class="wish-admin-poster" src="' +
        escapeHtml(poster) +
        '" alt="" loading="lazy" decoding="async" />'
      );
    }
    if (type) {
      return (
        '<span class="wish-admin-poster wish-admin-poster--empty wish-admin-poster--' +
        escapeHtml(type) +
        '">' +
        escapeHtml(type === "movie" ? "F" : "S") +
        "</span>"
      );
    }
    return '<span class="wish-admin-poster wish-admin-poster--empty">?</span>';
  }

  function wishTitleHtml(w) {
    var html = wishTypeBadge(w) + '<span class="wish-title-text">' + escapeHtml(w.message || "") + "</span>";
    if (w.userNote) {
      html += '<span class="wish-user-note">' + escapeHtml(w.userNote) + "</span>";
    }
    return html;
  }

  function wishDateCell(w) {
    if (w.trakt && w.trakt.dateLabel) {
      return (
        '<span class="wish-trakt-date" title="' +
        escapeHtml(w.trakt.dateIso || "") +
        '">' +
        escapeHtml(w.trakt.dateLabel) +
        "</span>"
      );
    }
    if (w.adminDate) {
      return '<span class="wish-trakt-date wish-trakt-date--legacy">' + escapeHtml(w.adminDate) + "</span>";
    }
    return '<span class="wish-trakt-date wish-trakt-date--empty">—</span>';
  }

  function renderWishes(items) {
    updateWishBadges(openWishCount(items));
    if (!items.length) {
      wishesTableBody.innerHTML =
        '<tr><td colspan="7"><p class="admin-empty">Noch keine Wünsche.</p></td></tr>';
      wishesCards.innerHTML = '<p class="admin-empty">Noch keine Wünsche.</p>';
      return;
    }
    wishesTableBody.innerHTML = items
      .map(function (w) {
        var username = w.name ? escapeHtml(w.name) : "—";
        var id = escapeHtml(w.id || "");
        return (
          '<tr class="' +
          wishRowClass(w) +
          '" data-id="' +
          id +
          '"><td class="wish-cover">' +
          wishPosterHtml(w) +
          '</td><td class="wish-meta">' +
          escapeHtml(formatDate(w.created)) +
          '</td><td class="wish-title">' +
          wishTitleHtml(w) +
          '</td><td class="wish-term">' +
          wishDateCell(w) +
          '</td><td class="wish-meta">' +
          escapeHtml(username) +
          '</td><td class="wish-note"><input type="text" class="wish-note-input" data-field="note" value="' +
          escapeHtml(w.adminNote || "") +
          '" placeholder="Intern …" maxlength="500" /></td><td class="wish-actions-col"><div class="wish-actions wish-actions--row"><button type="button" class="admin-toggle admin-toggle--sm" data-action="save-wish" data-id="' +
          id +
          '">Speichern</button><button type="button" class="admin-toggle admin-toggle--sm admin-toggle--on" data-action="complete-wish" data-id="' +
          id +
          '">Erledigt</button><button type="button" class="admin-toggle admin-toggle--sm admin-toggle--danger" data-action="delete-wish" data-id="' +
          id +
          '">Löschen</button></div></td></tr>'
        );
      })
      .join("");
    wishesCards.innerHTML = items
      .map(function (w) {
        var meta = w.name ? escapeHtml(w.name) : "—";
        var id = escapeHtml(w.id || "");
        return (
          '<article class="admin-item ' +
          (w.done ? "wish-row--done" : "") +
          '" data-id="' +
          id +
          '"><div class="wish-card-top">' +
          wishPosterHtml(w) +
          '<div class="wish-card-head"><strong>' +
          escapeHtml(formatDate(w.created)) +
          '</strong><div class="wish-title">' +
          wishTitleHtml(w) +
          '</div><span class="wish-meta">' +
          (meta || "—") +
          '</span></div></div><div class="wish-card-fields"><div class="wish-card-date"><span>Termin (Trakt)</span><p>' +
          wishDateCell(w) +
          '</p></div><label><span>Notiz</span><input type="text" class="wish-note-input" data-field="note" value="' +
          escapeHtml(w.adminNote || "") +
          '" placeholder="Interne Notiz" maxlength="500" /></label></div><div class="wish-card-actions wish-actions--row"><button type="button" class="admin-toggle admin-toggle--sm" data-action="save-wish" data-id="' +
          id +
          '">Speichern</button><button type="button" class="admin-toggle admin-toggle--sm admin-toggle--on" data-action="complete-wish" data-id="' +
          id +
          '">Erledigt</button><button type="button" class="admin-toggle admin-toggle--sm admin-toggle--danger" data-action="delete-wish" data-id="' +
          id +
          '">Löschen</button></div></article>'
        );
      })
      .join("");
  }

  function readWishFields(root) {
    var noteEl = root.querySelector('[data-field="note"]');
    return {
      note: noteEl ? noteEl.value.trim() : ""
    };
  }

  function saveWish(id, root, done) {
    var fields = readWishFields(root);
    return postUpdate({
      action: "update-wish",
      id: id,
      note: fields.note,
      done: done === true ? true : undefined
    }).then(loadWishes);
  }

  function renderList(items) {
    if (!items.length) {
      itemsList.innerHTML = '<p class="admin-empty">Noch keine Meldungen.</p>';
      return;
    }
    itemsList.innerHTML = items
      .map(function (item) {
        var state = item.active === false ? "Ausgeblendet" : "Live";
        var img =
          item.image && API
            ? '<img class="admin-thumb" src="' + API + escapeHtml(item.image) + '" alt="" />'
            : "";
        return (
          '<article class="admin-item' +
          (item.highlight ? " admin-item--pinned" : "") +
          '" data-id="' +
          escapeHtml(item.id || "") +
          '">' +
          img +
          "<strong>" +
          escapeHtml(item.title || "Ohne Titel") +
          (item.highlight ? ' <em class="admin-tag">Fixiert</em>' : "") +
          "</strong>" +
          (item.body
            ? '<div class="admin-item-body">' +
              (window.TIVIM_formatUpdateBody
                ? window.TIVIM_formatUpdateBody(item.body)
                : "<p>" + escapeHtml(item.body) + "</p>") +
              "</div>"
            : "") +
          '<div class="admin-item-meta">' +
          "<span>" +
          state +
          "</span>" +
          '<div class="admin-item-actions">' +
          '<button type="button" class="admin-toggle' +
          (item.highlight ? " admin-toggle--on" : "") +
          '" data-action="toggle-highlight" data-id="' +
          escapeHtml(item.id || "") +
          '">' +
          (item.highlight ? "Fixierung aus" : "Fixieren") +
          "</button>" +
          '<button type="button" class="admin-toggle" data-action="toggle-active" data-id="' +
          escapeHtml(item.id || "") +
          '">' +
          (item.active === false ? "Ein" : "Aus") +
          "</button>" +
          '<button type="button" class="admin-toggle admin-toggle--danger" data-action="delete" data-id="' +
          escapeHtml(item.id || "") +
          '">Löschen</button></div></div></article>'
        );
      })
      .join("");
  }

  function loadItems() {
    var url = API ? API + "/updates" : "updates.json";
    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { items: [] };
      })
      .then(function (data) {
        renderList((data && data.items) || []);
      })
      .catch(function () {
        itemsList.innerHTML = '<p class="admin-empty">Liste konnte nicht geladen werden.</p>';
      });
  }

  function loadDownloads() {
    var dlHint = document.getElementById("dlHint");
    if (!API || !token()) return Promise.resolve();
    return postUpdate({ action: "get-downloads" })
      .then(function (data) {
        var d = (data && data.downloads) || {};
        document.getElementById("codePro").value = d["pro-code"] || "";
        document.getElementById("codeXc").value = d["xc-code"] || "";
        document.getElementById("dlPc").value = d["pc-app"] || "";
        if (dlHint) dlHint.textContent = "";
      })
      .catch(function () {
        if (dlHint) dlHint.textContent = "Einstellungen konnten nicht geladen werden.";
      });
  }

  function loadWishes() {
    if (!API || !token()) return Promise.resolve();
    return postUpdate({ action: "get-wishes" })
      .then(function (data) {
        renderWishes((data && data.wishes) || []);
      })
      .catch(function () {
        wishesTableBody.innerHTML =
          '<tr><td colspan="7"><p class="admin-empty">Wünsche konnten nicht geladen werden.</p></td></tr>';
        wishesCards.innerHTML = '<p class="admin-empty">Wünsche konnten nicht geladen werden.</p>';
      });
  }

  function postUpdate(payload) {
    if (!API) {
      alert("Braucht den Cloudflare Worker.");
      return Promise.reject(new Error("no api"));
    }
    return fetch(API + "/admin/updates", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (res.status === 401) throw new Error("auth");
      if (!res.ok) throw new Error("fail");
      return res.json();
    });
  }

  function logout() {
    setToken("");
    showCockpit(false);
  }

  document.getElementById("btnLogout").addEventListener("click", logout);
  document.getElementById("btnLogoutMobile").addEventListener("click", logout);

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    setToken(document.getElementById("adminPass").value);
    postUpdate({ action: "ping" })
      .then(function () {
        showCockpit(true);
        if (adminStatus) {
          adminStatus.classList.remove("is-hide");
          adminStatus.innerHTML = "<strong>Verbunden</strong> – Änderungen gehen sofort live.";
        }
        loadItems();
        loadDownloads();
        loadWishes();
        switchPanel("wishes");
      })
      .catch(function (err) {
        setToken("");
        if (err && err.message === "auth") {
          alert("Passwort falsch.");
          return;
        }
        alert("Worker antwortet nicht – Code deployt?");
      });
  });

  document.getElementById("downloadsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var dlHint = document.getElementById("dlHint");
    postUpdate({
      action: "set-downloads",
      proCode: document.getElementById("codePro").value.trim(),
      xcCode: document.getElementById("codeXc").value.trim(),
      pcApp: document.getElementById("dlPc").value.trim()
    })
      .then(function () {
        if (dlHint) dlHint.textContent = "";
        alert("Gespeichert.");
      })
      .catch(function (err) {
        if (dlHint) {
          dlHint.textContent =
            err && err.message === "auth" ? "Passwort falsch." : "Speichern fehlgeschlagen.";
        }
      });
  });

  function uploadImage(file) {
    if (!file) return Promise.resolve("");
    var form = new FormData();
    form.append("image", file);
    return fetch(API + "/admin/upload-image", {
      method: "POST",
      headers: { Authorization: "Bearer " + token() },
      body: form
    })
      .then(function (res) {
        if (res.status === 401) throw new Error("auth");
        if (res.status === 503) throw new Error("no-r2");
        if (!res.ok) throw new Error("upload");
        return res.json();
      })
      .then(function (data) {
        return data.image || "";
      });
  }

  var postImage = document.getElementById("postImage");
  var postImagePreview = document.getElementById("postImagePreview");
  var uploadHint = document.getElementById("uploadHint");
  var postBody = document.getElementById("postBody");

  function wrapTextarea(ta, before, after, fallback) {
    if (!ta) return;
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    var val = ta.value;
    var selected = val.slice(start, end) || fallback || "";
    ta.value = val.slice(0, start) + before + selected + after + val.slice(end);
    var pos = start + before.length + selected.length + after.length;
    ta.focus();
    ta.setSelectionRange(pos, pos);
  }

  function prefixLine(ta, prefix) {
    if (!ta) return;
    var start = ta.selectionStart;
    var val = ta.value;
    var lineStart = val.lastIndexOf("\n", start - 1) + 1;
    var lineEnd = val.indexOf("\n", start);
    if (lineEnd === -1) lineEnd = val.length;
    var line = val.slice(lineStart, lineEnd);
    if (/^##\s/.test(line)) line = line.replace(/^##\s+/, "");
    else line = prefix + line.replace(/^#+\s*/, "");
    ta.value = val.slice(0, lineStart) + line + val.slice(lineEnd);
    ta.focus();
    ta.setSelectionRange(lineStart + line.length, lineStart + line.length);
  }

  document.querySelectorAll(".admin-format-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var fmt = btn.getAttribute("data-fmt");
      if (fmt === "h") return prefixLine(postBody, "## ");
      if (fmt === "b") return wrapTextarea(postBody, "**", "**", "wichtig");
      if (fmt === "link") {
        var url = window.prompt("Link (https://…)", "https://");
        if (!url) return;
        var label = window.prompt("Link-Text", url);
        if (label === null) return;
        wrapTextarea(postBody, "[", "](" + url.trim() + ")", label || url);
      }
    });
  });

  if (postImage) {
    postImage.addEventListener("change", function () {
      var file = postImage.files && postImage.files[0];
      if (!file) {
        postImagePreview.classList.add("is-hide");
        postImagePreview.removeAttribute("src");
        return;
      }
      if (file.size > 800000) {
        uploadHint.textContent = "Bild zu groß (max. 800 KB).";
        postImage.value = "";
        return;
      }
      uploadHint.textContent = "";
      postImagePreview.src = URL.createObjectURL(file);
      postImagePreview.classList.remove("is-hide");
    });
  }

  postForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var file = postImage && postImage.files && postImage.files[0];
    var submitBtn = postForm.querySelector(".cta");
    if (submitBtn) submitBtn.disabled = true;
    uploadImage(file)
      .then(function (imagePath) {
        return postUpdate({
          action: "create",
          title: document.getElementById("postTitle").value.trim(),
          body: document.getElementById("postBody").value.trim(),
          active: document.getElementById("postActive").checked,
          highlight: document.getElementById("postHighlight").checked,
          image: imagePath || undefined
        });
      })
      .then(function () {
        postForm.reset();
        document.getElementById("postActive").checked = true;
        postImagePreview.classList.add("is-hide");
        postImagePreview.removeAttribute("src");
        uploadHint.textContent = "";
        loadItems();
        if (updatesGrid) updatesGrid.classList.add("is-list");
        document.querySelectorAll("[data-sub]").forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-sub") === "list");
        });
      })
      .catch(function (err) {
        if (err && err.message === "auth") {
          logout();
          alert("Session abgelaufen.");
          return;
        }
        if (err && err.message === "no-r2") {
          alert("Bild-Upload braucht R2 in Cloudflare.");
          return;
        }
        alert("Veröffentlichen fehlgeschlagen.");
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });

  itemsList.addEventListener("click", function (e) {
    var btn = e.target.closest(".admin-toggle");
    if (!btn) return;
    var id = btn.getAttribute("data-id");
    var action = btn.getAttribute("data-action");
    if (action === "delete") {
      if (!confirm("Meldung löschen?")) return;
      postUpdate({ action: "delete", id: id }).then(loadItems);
      return;
    }
    if (action === "toggle-highlight") {
      postUpdate({ action: "toggle-highlight", id: id }).then(loadItems);
      return;
    }
    if (action === "toggle-active") {
      postUpdate({ action: "toggle-active", id: id }).then(loadItems);
    }
  });

  function onWishAction(e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    if (action !== "save-wish" && action !== "complete-wish" && action !== "delete-wish") return;
    var id = btn.getAttribute("data-id");
    var root = btn.closest("[data-id]");
    if (action === "save-wish") {
      saveWish(id, root, undefined);
      return;
    }
    if (action === "complete-wish") {
      if (!confirm("Wunsch als erledigt markieren?")) return;
      saveWish(id, root, true);
      return;
    }
    if (action === "delete-wish") {
      if (!confirm("Wunsch endgültig löschen?")) return;
      postUpdate({ action: "delete-wish", id: id }).then(loadWishes);
    }
  }
  wishesTableBody.addEventListener("click", onWishAction);
  wishesCards.addEventListener("click", onWishAction);

  if (token()) {
    showCockpit(true);
    if (adminStatus) {
      adminStatus.classList.remove("is-hide");
      adminStatus.innerHTML = "<strong>Verbunden</strong>";
    }
    loadItems();
    loadDownloads();
    loadWishes();
  }
})();
