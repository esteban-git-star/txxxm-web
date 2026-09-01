(function () {
  "use strict";

  var form = document.getElementById("wishboxForm");
  var statusEl = document.getElementById("wishboxStatus");
  var submitBtn = document.getElementById("wishboxSubmit");
  var searchInput = document.getElementById("wishSearch");
  var searchList = document.getElementById("wishSearchList");
  var pickEl = document.getElementById("wishPick");
  var pickType = document.getElementById("wishPickType");
  var pickTitle = document.getElementById("wishPickTitle");
  var pickDate = document.getElementById("wishPickDate");
  var pickClear = document.getElementById("wishPickClear");
  var freeField = document.getElementById("wishFreeField");
  var messageEl = form ? form.querySelector('[name="message"]') : null;

  if (!form || !statusEl) return;

  var API_BASE = window.TIVIM_API || "https://tivim-chatbot.eyepitv.workers.dev";
  var WISH_API = API_BASE + "/wishbox";
  var selected = null;
  var searchTimer = null;
  var searchSeq = 0;

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "wishbox-status" + (kind ? " is-" + kind : "");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function typeLabel(type) {
    return type === "movie" ? "Film" : "Serie";
  }

  function hideSearchList() {
    if (searchList) {
      searchList.classList.add("is-hide");
      searchList.innerHTML = "";
    }
  }

  function updateFormMode() {
    if (!messageEl || !freeField) return;
    if (selected) {
      messageEl.removeAttribute("required");
      freeField.classList.add("is-compact");
    } else {
      messageEl.setAttribute("required", "required");
      freeField.classList.remove("is-compact");
    }
  }

  function showPick(preview) {
    selected = preview;
    if (!pickEl) return;
    pickEl.classList.remove("is-hide");
    if (pickType) {
      pickType.textContent = typeLabel(preview.type);
      pickType.className = "wish-pick-type wish-pick-type--" + preview.type;
    }
    if (pickTitle) {
      pickTitle.textContent = preview.title + (preview.year ? " (" + preview.year + ")" : "");
    }
    if (pickDate) pickDate.textContent = preview.dateLabel || "";
    if (searchInput) searchInput.value = "";
    hideSearchList();
    updateFormMode();
  }

  function clearPick() {
    selected = null;
    if (pickEl) pickEl.classList.add("is-hide");
    updateFormMode();
  }

  function renderSearchResults(items) {
    if (!searchList) return;
    if (!items.length) {
      searchList.innerHTML = '<li class="wish-search-empty">Kein Treffer</li>';
      searchList.classList.remove("is-hide");
      return;
    }
    searchList.innerHTML = items
      .map(function (item) {
        return (
          '<li><button type="button" class="wish-search-item" data-type="' +
          escapeHtml(item.type) +
          '" data-id="' +
          escapeHtml(String(item.id)) +
          '"><span class="wish-search-item-type">' +
          escapeHtml(typeLabel(item.type)) +
          "</span><strong>" +
          escapeHtml(item.title) +
          "</strong>" +
          (item.year ? '<em>(' + escapeHtml(String(item.year)) + ")</em>" : "") +
          "</button></li>"
        );
      })
      .join("");
    searchList.classList.remove("is-hide");
  }

  function runSearch(q) {
    var seq = ++searchSeq;
    fetch(API_BASE + "/trakt/search?q=" + encodeURIComponent(q), { cache: "no-store" })
      .then(function (res) {
        if (seq !== searchSeq) return null;
        if (res.status === 429) throw new Error("rate");
        if (!res.ok) throw new Error("fail");
        return res.json();
      })
      .then(function (data) {
        if (!data || seq !== searchSeq) return;
        renderSearchResults((data && data.results) || []);
      })
      .catch(function (err) {
        if (seq !== searchSeq) return;
        hideSearchList();
        if (err && err.message === "rate") {
          setStatus("Zu viele Suchen – kurz warten.", "error");
        }
      });
  }

  function loadPreview(type, id, btn) {
    if (btn) btn.disabled = true;
    setStatus("Lade Details …");
    fetch(API_BASE + "/trakt/preview?type=" + encodeURIComponent(type) + "&id=" + encodeURIComponent(id), {
      cache: "no-store",
    })
      .then(function (res) {
        if (res.status === 429) throw new Error("rate");
        if (!res.ok) throw new Error("fail");
        return res.json();
      })
      .then(function (preview) {
        showPick(preview);
        setStatus("");
      })
      .catch(function (err) {
        if (err && err.message === "rate") {
          setStatus("Zu viele Anfragen – kurz warten.", "error");
        } else {
          setStatus("Details konnten nicht geladen werden.", "error");
        }
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      var q = searchInput.value.trim();
      if (q.length < 2) {
        hideSearchList();
        return;
      }
      searchTimer = setTimeout(function () {
        runSearch(q);
      }, 350);
    });

    searchInput.addEventListener("focus", function () {
      var q = searchInput.value.trim();
      if (q.length >= 2 && searchList && searchList.children.length) {
        searchList.classList.remove("is-hide");
      }
    });
  }

  if (searchList) {
    searchList.addEventListener("click", function (e) {
      var btn = e.target.closest(".wish-search-item");
      if (!btn) return;
      loadPreview(btn.getAttribute("data-type"), btn.getAttribute("data-id"), btn);
    });
  }

  if (pickClear) {
    pickClear.addEventListener("click", function () {
      clearPick();
      setStatus("");
      if (searchInput) searchInput.focus();
    });
  }

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#wishSearchWrap")) hideSearchList();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");

    var fd = new FormData(form);
    var message = String(fd.get("message") || "").trim();
    var userNote = message;

    if (!selected && message.length < 10) {
      setStatus("Bitte einen Film/Serie auswählen oder mindestens einen Satz Freitext.", "error");
      return;
    }

    var contact = String(fd.get("contact") || "").trim();
    if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setStatus("Die E-Mail sieht komisch aus – nochmal checken?", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Wird geschickt …");

    var payload = {
      name: String(fd.get("name") || "").trim(),
      contact: contact,
      website: String(fd.get("website") || ""),
    };

    if (selected) {
      payload.trakt = { type: selected.type, id: selected.id };
      if (userNote) payload.note = userNote;
      payload.message = selected.title + (selected.year ? " (" + selected.year + ")" : "");
    } else {
      payload.message = message;
    }

    fetch(WISH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (res.status === 429) throw new Error("rate");
        if (!res.ok) throw new Error("fail");
        return res.json();
      })
      .then(function () {
        form.reset();
        clearPick();
        setStatus("Danke – ist angekommen!", "ok");
      })
      .catch(function (err) {
        if (err && err.message === "rate") {
          setStatus("Gerade zu viele Versuche – später nochmal.", "error");
        } else {
          setStatus("Hat nicht geklappt. Später nochmal probieren.", "error");
        }
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  updateFormMode();
})();
