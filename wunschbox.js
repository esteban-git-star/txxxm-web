(function () {
  "use strict";

  var form = document.getElementById("wishboxForm");
  var statusEl = document.getElementById("wishboxStatus");
  var submitBtn = document.getElementById("wishboxSubmit");
  var submitHint = document.getElementById("wishSubmitHint");
  var searchInput = document.getElementById("wishSearch");
  var searchList = document.getElementById("wishSearchList");
  var searchLoading = document.getElementById("wishSearchLoading");
  var searchPanel = document.getElementById("wishSearchPanel");
  var freePanel = document.getElementById("wishFreePanel");
  var freeField = document.getElementById("wishFreeField");
  var noteField = document.getElementById("wishNoteField");
  var freitextToggle = document.getElementById("wishFreitextToggle");
  var backToSearch = document.getElementById("wishBackToSearch");
  var pickEl = document.getElementById("wishPick");
  var pickType = document.getElementById("wishPickType");
  var pickTitle = document.getElementById("wishPickTitle");
  var pickDate = document.getElementById("wishPickDate");
  var pickPoster = document.getElementById("wishPickPoster");
  var pickPosterEmpty = document.getElementById("wishPickPosterEmpty");
  var pickClear = document.getElementById("wishPickClear");
  var messageEl = form ? form.querySelector('[name="message"]') : null;
  var noteEl = form ? form.querySelector('[name="note"]') : null;
  var steps = [
    document.getElementById("step1"),
    document.getElementById("step2"),
    document.getElementById("step3"),
  ];

  if (!form || !statusEl) return;

  var API_BASE = window.TIVIM_API || "https://tivim-chatbot.eyepitv.workers.dev";
  var WISH_API = API_BASE + "/wishbox";
  var selected = null;
  var freitextMode = false;
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

  function setSteps(activeIndex) {
    steps.forEach(function (el, i) {
      if (!el) return;
      el.classList.toggle("is-active", i <= activeIndex);
      el.classList.toggle("is-done", i < activeIndex);
    });
  }

  function updateSubmitState() {
    var canSubmit = false;
    var hint = "Bitte zuerst einen Titel aus der Liste wählen.";

    if (freitextMode) {
      var text = messageEl ? messageEl.value.trim() : "";
      canSubmit = text.length >= 10;
      hint = canSubmit ? "" : "Freitext: mindestens ein kurzer Satz (10 Zeichen).";
    } else if (selected) {
      canSubmit = true;
      hint = "";
    }

    if (submitBtn) submitBtn.disabled = !canSubmit;
    if (submitHint) {
      submitHint.textContent = hint;
      submitHint.classList.toggle("is-hide", !hint);
    }
    setSteps(selected || freitextMode ? 2 : searchInput && searchInput.value.trim().length >= 2 ? 1 : 0);
  }

  function hideSearchList() {
    if (searchList) {
      searchList.classList.add("is-hide");
      searchList.innerHTML = "";
    }
    if (searchLoading) searchLoading.classList.add("is-hide");
  }

  function setPoster(preview) {
    var type = preview && preview.type;
    var hasPoster = preview && preview.poster;

    if (pickPoster) {
      if (hasPoster) {
        pickPoster.src = preview.poster;
        pickPoster.alt = preview.title || "";
        pickPoster.classList.remove("is-hide");
      } else {
        pickPoster.removeAttribute("src");
        pickPoster.classList.add("is-hide");
      }
    }
    if (pickPosterEmpty) {
      if (hasPoster) {
        pickPosterEmpty.classList.add("is-hide");
      } else {
        pickPosterEmpty.textContent = typeLabel(type || "show").slice(0, 1);
        pickPosterEmpty.className =
          "wish-pick-poster wish-pick-poster--empty wish-pick-poster--" + (type || "show");
      }
    }
  }

  function showPick(preview) {
    selected = preview;
    freitextMode = false;
    if (freePanel) freePanel.classList.add("is-hide");
    if (searchPanel) searchPanel.classList.remove("is-hide");
    if (freitextToggle) freitextToggle.classList.remove("is-hide");
    if (noteField) noteField.classList.remove("is-hide");

    if (pickEl) {
      pickEl.classList.remove("is-hide");
      pickEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (pickType) {
      pickType.textContent = typeLabel(preview.type);
      pickType.className = "wish-pick-type wish-pick-type--" + preview.type;
    }
    if (pickTitle) {
      pickTitle.textContent = preview.title + (preview.year ? " (" + preview.year + ")" : "");
    }
    if (pickDate) pickDate.textContent = preview.dateLabel || "Termin wird noch geladen …";
    setPoster(preview);
    if (searchInput) searchInput.value = "";
    hideSearchList();
    if (typeof lucide !== "undefined") lucide.createIcons();
    updateSubmitState();
  }

  function clearPick() {
    selected = null;
    if (pickEl) pickEl.classList.add("is-hide");
    updateSubmitState();
  }

  function enterFreitextMode() {
    freitextMode = true;
    clearPick();
    hideSearchList();
    if (searchPanel) searchPanel.classList.add("is-hide");
    if (freePanel) freePanel.classList.remove("is-hide");
    if (freitextToggle) freitextToggle.classList.add("is-hide");
    if (noteField) noteField.classList.add("is-hide");
    setStatus("");
    if (messageEl) messageEl.focus();
    updateSubmitState();
  }

  function exitFreitextMode() {
    freitextMode = false;
    if (messageEl) messageEl.value = "";
    if (freePanel) freePanel.classList.add("is-hide");
    if (searchPanel) searchPanel.classList.remove("is-hide");
    if (freitextToggle) freitextToggle.classList.remove("is-hide");
    setStatus("");
    if (searchInput) searchInput.focus();
    updateSubmitState();
  }

  function renderSearchItem(item) {
    var poster = item.poster
      ? '<img class="wish-search-poster" src="' +
        escapeHtml(item.poster) +
        '" alt="" loading="lazy" decoding="async" />'
      : '<span class="wish-search-poster wish-search-poster--empty wish-search-poster--' +
        escapeHtml(item.type) +
        '" aria-hidden="true">' +
        escapeHtml(typeLabel(item.type).slice(0, 1)) +
        "</span>";
    return (
      '<li><button type="button" class="wish-search-item" data-type="' +
      escapeHtml(item.type) +
      '" data-id="' +
      escapeHtml(String(item.id)) +
      '" data-title="' +
      escapeHtml(item.title) +
      '" data-year="' +
      escapeHtml(String(item.year || "")) +
      '"' +
      (item.poster ? ' data-poster="' + escapeHtml(item.poster) + '"' : "") +
      ">" +
      poster +
      '<span class="wish-search-item-body">' +
      '<span class="wish-search-item-type wish-search-item-type--' +
      escapeHtml(item.type) +
      '">' +
      escapeHtml(typeLabel(item.type)) +
      "</span>" +
      '<span class="wish-search-item-title"><strong>' +
      escapeHtml(item.title) +
      "</strong>" +
      (item.year ? ' <em>(' + escapeHtml(String(item.year)) + ")</em>" : "") +
      "</span></span></button></li>"
    );
  }

  function renderSearchResults(items) {
    if (!searchList) return;
    if (searchLoading) searchLoading.classList.add("is-hide");
    if (!items.length) {
      searchList.innerHTML =
        '<li class="wish-search-empty">Kein Treffer – unten auf Freitext wechseln.</li>';
      searchList.classList.remove("is-hide");
      return;
    }
    var shows = items.filter(function (i) {
      return i.type === "show";
    });
    var movies = items.filter(function (i) {
      return i.type === "movie";
    });
    var html = "";
    if (shows.length) {
      html += '<li class="wish-search-group">Serien</li>';
      html += shows.map(renderSearchItem).join("");
    }
    if (movies.length) {
      html += '<li class="wish-search-group">Filme</li>';
      html += movies.map(renderSearchItem).join("");
    }
    searchList.innerHTML = html;
    searchList.classList.remove("is-hide");
  }

  function runSearch(q) {
    var seq = ++searchSeq;
    if (searchLoading) searchLoading.classList.remove("is-hide");
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
        if (btn && btn.getAttribute("data-poster") && !preview.poster) {
          preview.poster = btn.getAttribute("data-poster");
        }
        showPick(preview);
        setStatus("");
      })
      .catch(function (err) {
        if (err && err.message === "rate") {
          setStatus("Zu viele Anfragen – kurz warten.", "error");
          return;
        }
        if (btn && btn.getAttribute("data-title")) {
          showPick({
            type: type,
            id: parseInt(id, 10),
            title: btn.getAttribute("data-title") || "",
            year: btn.getAttribute("data-year") ? parseInt(btn.getAttribute("data-year"), 10) : null,
            poster: btn.getAttribute("data-poster") || "",
            dateLabel: "Termin wird beim Absenden ermittelt",
          });
          setStatus("");
          return;
        }
        setStatus("Details konnten nicht geladen werden.", "error");
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      clearPick();
      var q = searchInput.value.trim();
      updateSubmitState();
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

  if (messageEl) {
    messageEl.addEventListener("input", updateSubmitState);
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

  if (freitextToggle) freitextToggle.addEventListener("click", enterFreitextMode);
  if (backToSearch) backToSearch.addEventListener("click", exitFreitextMode);

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#wishSearchWrap")) hideSearchList();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");

    if (submitBtn && submitBtn.disabled) {
      updateSubmitState();
      return;
    }

    var fd = new FormData(form);
    var contact = String(fd.get("contact") || "").trim();
    var userNote = String(fd.get("note") || "").trim();

    if (freitextMode) {
      var message = String(fd.get("message") || "").trim();
      if (message.length < 10) {
        setStatus("Bitte etwas ausführlicher schreiben.", "error");
        updateSubmitState();
        return;
      }
    } else if (!selected) {
      setStatus("Bitte einen Titel aus der Liste wählen.", "error");
      updateSubmitState();
      return;
    }

    if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setStatus("Die E-Mail sieht komisch aus – nochmal checken?", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Wird geschickt …");
    setSteps(2);

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
      payload.message = String(fd.get("message") || "").trim();
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
        exitFreitextMode();
        setStatus("Danke – ist angekommen!", "ok");
        setSteps(0);
        updateSubmitState();
      })
      .catch(function (err) {
        if (err && err.message === "rate") {
          setStatus("Gerade zu viele Versuche – später nochmal.", "error");
        } else {
          setStatus("Hat nicht geklappt. Später nochmal probieren.", "error");
        }
      })
      .finally(function () {
        updateSubmitState();
      });
  });

  updateSubmitState();
})();
