(function () {
  "use strict";

  var KB = window.TIVIM_KB || [];
  var form = document.getElementById("askForm");
  var input = document.getElementById("askInput");
  var home = document.getElementById("homeView");
  var guide = document.getElementById("guideView");
  var guideTitle = document.getElementById("guideTitle");
  var guideLead = document.getElementById("guideLead");
  var guideBody = document.getElementById("guideBody");
  var guideActions = document.getElementById("guideActions");
  var backBtn = document.getElementById("btnBack");
  var chips = document.getElementById("chips");

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function scoreIntent(query, intent) {
    var q = normalize(query);
    if (!q) return 0;
    var score = 0;
    var words = q.split(" ");

    intent.keywords.forEach(function (kw) {
      var k = normalize(kw);
      if (!k) return;
      if (q.indexOf(k) !== -1) {
        score += k.length > 8 ? 6 : k.length > 4 ? 4 : 3;
      } else {
        var parts = k.split(" ");
        var hit = parts.every(function (p) {
          return words.indexOf(p) !== -1 || q.indexOf(p) !== -1;
        });
        if (hit && parts.length > 1) score += 3;
      }
    });

    var title = normalize(intent.title);
    if (title && q.indexOf(title) !== -1) score += 8;

    return score;
  }

  function match(query) {
    var ranked = KB.map(function (intent) {
      return { intent: intent, score: scoreIntent(query, intent) };
    })
      .filter(function (r) {
        return r.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      });

    if (!ranked.length) return null;
    if (ranked.length === 1) return { best: ranked[0].intent, alts: [] };

    var best = ranked[0];
    var alts = [];
    // Unklar: mehrere nah beieinander
    if (ranked[1] && best.score - ranked[1].score < 3 && ranked[1].score >= 3) {
      alts = ranked.slice(0, 4).map(function (r) {
        return r.intent;
      });
      return { best: null, alts: alts };
    }

    alts = ranked.slice(1, 3).filter(function (r) {
      return r.score >= best.score * 0.55 && r.score >= 3;
    }).map(function (r) {
      return r.intent;
    });

    return { best: best.intent, alts: alts };
  }

  function showHome() {
    home.classList.remove("is-hide");
    guide.classList.add("is-hide");
    backBtn.classList.remove("is-on");
    guideBody.innerHTML = "";
    guideActions.innerHTML = "";
    window.scrollTo(0, 0);
  }

  function showGuide() {
    home.classList.add("is-hide");
    guide.classList.remove("is-hide");
    backBtn.classList.add("is-on");
    window.scrollTo(0, 0);
  }

  function renderChoices(title, lead, intents) {
    guideTitle.textContent = title;
    guideLead.textContent = lead || "";
    guideBody.innerHTML = "";
    guideActions.innerHTML = "";

    var list = document.createElement("div");
    list.className = "doors";
    intents.forEach(function (intent) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "door";
      btn.innerHTML =
        "<strong>" +
        escapeHtml(intent.title) +
        "</strong>" +
        (intent.summary
          ? "<em>" + escapeHtml(intent.summary) + "</em>"
          : "");
      btn.addEventListener("click", function () {
        openIntent(intent);
      });
      list.appendChild(btn);
    });
    guideBody.appendChild(list);
    showGuide();
  }

  function renderStatus(intent) {
    guideTitle.textContent = intent.title;
    guideLead.textContent = intent.summary || "";
    guideBody.innerHTML =
      '<div class="guide-status">' +
      '<div class="guide-status-row">' +
      '<span class="guide-status-dot" id="guideStatusDot"></span>' +
      '<span class="guide-status-label" id="guideStatusLabel">Wird geprüft…</span>' +
      "</div>" +
      '<p class="guide-status-note" id="guideStatusNote"></p>' +
      "</div>";
    guideActions.innerHTML = "";
    showGuide();

    function finish(state, label, note, showHelp) {
      var dot = document.getElementById("guideStatusDot");
      var lab = document.getElementById("guideStatusLabel");
      var noteEl = document.getElementById("guideStatusNote");
      if (dot) dot.className = "guide-status-dot" + (state ? " " + state : "");
      if (lab) lab.textContent = label;
      if (noteEl) noteEl.textContent = note;
      guideActions.innerHTML = "";

      if (showHelp) {
        var help = document.createElement("button");
        help.type = "button";
        help.className = "cta cta--ghost";
        help.textContent = "Bei mir geht trotzdem nichts";
        help.addEventListener("click", function () {
          openIntent(byId("probleme-app"));
        });
        guideActions.appendChild(help);
      }

      var home = document.createElement("button");
      home.type = "button";
      home.className = "cta";
      home.textContent = "Zurück zum Start";
      home.addEventListener("click", function () {
        input.value = "";
        showHome();
      });
      guideActions.appendChild(home);
    }

    var fetchFn = window.TIVIM_fetchStatus;
    if (!fetchFn) {
      finish("", "Status unklar", "Prüfung gerade nicht möglich.", true);
      return;
    }

    fetchFn().then(function (result) {
      if (result.state === "online") {
        finish(
          "online",
          "Server online",
          "Bei uns läuft’s. Wenn bei dir trotzdem nichts geht: meist die Strecke zu dir (VPN abends), App neu starten – oder ein Fehlercode.",
          true
        );
      } else if (result.state === "offline") {
        finish(
          "offline",
          "Wartungsarbeiten",
          "Gerade Pause bei uns. App nicht zurücksetzen – in ein paar Minuten nochmal versuchen.",
          false
        );
      } else {
        finish(
          "",
          "Status unklar",
          "Die Prüfung hat nicht geklappt. Wenn bei dir nichts geht, wähl unten „Bei mir geht trotzdem nichts“.",
          true
        );
      }
    });
  }

  function renderLink(intent) {
    guideTitle.textContent = intent.title;
    guideLead.textContent = intent.summary || "";
    guideBody.innerHTML =
      '<p class="guide-note">Ich öffne die passende Anleitung für dich. Die Schritte dort sind geprüft – nichts Freies vom Netz.</p>';
    guideActions.innerHTML = "";

    var a = document.createElement("a");
    a.className = "cta";
    a.href = intent.href;
    a.textContent = intent.cta || "Weiter";
    guideActions.appendChild(a);
    showGuide();
  }

  function renderSteps(intent) {
    guideTitle.textContent = intent.title;
    guideLead.textContent = intent.summary || "";
    guideBody.innerHTML = "";
    guideActions.innerHTML = "";

    var total = intent.steps.length;
    var idx = 0;

    var progress = document.createElement("p");
    progress.className = "step-progress";
    guideBody.appendChild(progress);

    var card = document.createElement("div");
    card.className = "step-focus";
    guideBody.appendChild(card);

    function paint() {
      progress.textContent = "Schritt " + (idx + 1) + " von " + total;
      card.innerHTML = buildStepHtml(intent.steps[idx], idx + 1);

      guideActions.innerHTML = "";

      if (idx < total - 1) {
        var next = document.createElement("button");
        next.type = "button";
        next.className = "cta";
        next.textContent = "Erledigt – weiter";
        next.addEventListener("click", function () {
          idx += 1;
          paint();
          window.scrollTo(0, 0);
        });
        guideActions.appendChild(next);
      } else {
        var ok = document.createElement("button");
        ok.type = "button";
        ok.className = "cta";
        ok.textContent = "Geht wieder";
        ok.addEventListener("click", function () {
          input.value = "";
          showHome();
        });
        guideActions.appendChild(ok);

        var bad = document.createElement("a");
        bad.className = "cta cta--ghost";
        bad.href = "kontakt.html";
        bad.textContent = "Immer noch tot – Support";
        guideActions.appendChild(bad);
      }
    }

    paint();
    showGuide();
  }

  function buildStepHtml(step, num) {
    if (step && typeof step === "object" && step.taps && step.taps.length) {
      var lead = step.lead
        ? '<p class="step-lead">' + formatInline(step.lead) + "</p>"
        : "";
      var taps = step.taps
        .map(function (tap) {
          return (
            '<li class="tap-item">' +
            '<div class="tap-row">' +
            '<span class="tap-dot" aria-hidden="true"></span>' +
            '<span class="tap-label">' +
            formatInline(tap) +
            "</span></div></li>"
          );
        })
        .join("");
      return (
        '<div class="step-focus-top">' +
        '<span class="step-num">' +
        num +
        "</span>" +
        lead +
        "</div>" +
        '<ol class="step-taps">' +
        taps +
        "</ol>"
      );
    }

    var text = typeof step === "string" ? step : step.text || "";
    return (
      '<div class="step-focus-top">' +
      '<span class="step-num">' +
      num +
      "</span>" +
      '<p class="step-text">' +
      formatInline(text) +
      "</p>" +
      "</div>"
    );
  }

  function formatInline(text) {
    return escapeHtml(text).replace(
      /\b(TivimPlayer|FA69EV)\b/g,
      '<span class="code">$1</span>'
    );
  }

  function formatStep(text) {
    return formatInline(text);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openIntent(intent) {
    if (!intent) return;
    if (intent.type === "link") renderLink(intent);
    else if (intent.type === "status") renderStatus(intent);
    else if (intent.type === "steps") renderSteps(intent);
    else if (intent.type === "choose") {
      var intents = (intent.options || []).map(function (opt) {
        var target = byId(opt.intent) || {
          id: opt.intent,
          title: opt.title,
          summary: opt.summary,
          type: "steps",
          steps: []
        };
        return {
          id: target.id,
          title: opt.title || target.title,
          summary: opt.summary || target.summary,
          type: target.type,
          steps: target.steps,
          href: target.href,
          cta: target.cta,
          options: target.options
        };
      });
      renderChoices(intent.title, intent.summary || "", intents);
    } else renderChoices("Was genau?", "", [intent]);
  }

  function ask(query) {
    var q = String(query || "").trim();
    if (!q) return;

    var result = match(q);

    if (!result) {
      renderChoices(
        "Hab ich so nicht gefunden",
        "Nimm einen der Punkte – oder formuliere kürzer, z.B. „Fehlercode 401“.",
        KB.filter(function (i) {
          return (
            ["status", "probleme", "pro-401", "pro-403", "xc-empty", "vpn", "install-tv", "support"].indexOf(
              i.id
            ) !== -1
          );
        })
      );
      return;
    }

    if (!result.best && result.alts.length) {
      renderChoices(
        "Was meinst du?",
        "Mehrere Treffer – tipp kurz drauf.",
        result.alts
      );
      return;
    }

    openIntent(result.best);
  }

  function byId(id) {
    for (var i = 0; i < KB.length; i++) {
      if (KB[i].id === id) return KB[i];
    }
    return null;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      ask(input.value);
    });
  }

  if (chips) {
    chips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-ask], [data-intent]");
      if (!btn) return;
      var intentId = btn.getAttribute("data-intent");
      if (intentId) {
        openIntent(byId(intentId));
        return;
      }
      var q = btn.getAttribute("data-ask");
      if (q) {
        input.value = q;
        ask(q);
      }
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      showHome();
    });
  }

  // Deep-Link: index.html#pro-401
  var hash = (location.hash || "").replace(/^#/, "");
  if (hash && byId(hash)) openIntent(byId(hash));
})();
