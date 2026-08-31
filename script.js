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

  // Live-Server-Status
  var SERVER_STATUS_URL = (window.TIVIM_API || "https://tivim-chatbot.eyepitv.workers.dev") + "/";

  window.TIVIM_fetchStatus = async function () {
    try {
      var res = await fetch(SERVER_STATUS_URL, { method: "GET" });
      var data = res.ok ? await res.json() : null;
      if (data && data.status === "online") return { state: "online", data: data };
      if (data) return { state: "offline", data: data };
      return { state: "unknown" };
    } catch (e) {
      return { state: "unknown" };
    }
  };

  async function checkServerStatus() {
    var dot = document.getElementById("status-dot");
    var text = document.getElementById("status-text");
    if (!dot || !text) return;

    var explain = document.getElementById("status-explain");
    var next = document.getElementById("status-next");

    function apply(kind, label, extra, showNext) {
      dot.classList.remove("online", "offline");
      if (kind) dot.classList.add(kind);
      text.textContent = label;
      if (explain) explain.textContent = extra || "";
      if (next) {
        if (showNext) next.classList.remove("is-hide");
        else next.classList.add("is-hide");
      }
    }

    try {
      var result = await window.TIVIM_fetchStatus();
      if (result.state === "online") {
        apply(
          "online",
          "Server online",
          "Bei uns läuft’s. Geht bei dir trotzdem nix? Meist Leitung/VPN – nicht dass Tivim down ist.",
          true
        );
      } else if (result.state === "offline") {
        apply(
          "offline",
          "Wartungsarbeiten",
          "Gerade Pause bei uns. App nicht zurücksetzen – kurz warten.",
          false
        );
      } else {
        apply(
          "",
          "Status unklar",
          "Check hat nicht geklappt. Erste Hilfe geht trotzdem.",
          true
        );
      }
    } catch (e) {
      apply(
        "",
        "Status unklar",
        "Die Prüfung hat nicht geklappt. Du kannst trotzdem die Erste Hilfe machen.",
        true
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
      initSpotlightSearch();
      initConcierge();
      checkServerStatus();
      setInterval(checkServerStatus, 1800000);
    });
  } else {
    init();
    initSpotlightSearch();
    initConcierge();
    checkServerStatus();
    setInterval(checkServerStatus, 1800000);
  }

  // Smarter Concierge (Dynamische Begrüßung)
  function initConcierge() {
    var greetingTextElement = document.getElementById("greeting-text");
    if (!greetingTextElement) return;

    var currentHour = new Date().getHours();
    var greetingMessage = "Willkommen beim Tivim Support";

    if (currentHour >= 5 && currentHour < 12) {
      greetingMessage = "Guten Morgen! Wie können wir dir helfen?";
    } else if (currentHour >= 12 && currentHour < 18) {
      greetingMessage = "Hallo! Willkommen im Support-Hub.";
    } else if (currentHour >= 18 && currentHour < 23) {
      greetingMessage = "Guten Abend! Ruckelt das Bild? Prüfe unsere VPN-Tipps.";
    } else {
      greetingMessage = "Noch spät wach? Wir wünschen gutes Streaming!";
    }

    greetingTextElement.textContent = greetingMessage;
  }

  // Service Worker für PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js").then(function (reg) {
        console.log("Service Worker registriert.", reg);
      }).catch(function (err) {
        console.log("Service Worker Fehler:", err);
      });
    });
  }

  // Spotlight Search (nur auf Startseite)
  function initSpotlightSearch() {
    var searchData = [
      { title: "Internet ruckelt / Stau", desc: "Hilfe bei Rucklern und Telekom-Problemen", link: "vpn.html", keywords: "ruckelt stau telekom vpn lag hängt" },
      { title: "PrivadoVPN Anleitung", desc: "Schritt-für-Schritt Einrichtung für Fire TV", link: "privado.html", keywords: "privado vpn premium kaufen installieren" },
      { title: "Proton VPN (Kostenlos)", desc: "Gratis VPN einrichten", link: "proton-free.html", keywords: "proton free kostenlos gratis vpn" },
      { title: "Purple Player (iOS)", desc: "Installation für iPhone & iPad", link: "mobile-install.html", keywords: "apple ios iphone ipad purple" },
      { title: "TV Installation (Fire TV & Google TV)", desc: "Tivim Pro & XC Schritt für Schritt", link: "tivim.html", keywords: "android fire tv stick google tv installieren pro xc" },
      { title: "Handy / Tablet", desc: "App für Android & iOS", link: "mobile-install.html", keywords: "handy tablet android apk mobile" },
      { title: "PC & Mac", desc: "Installation für Windows & macOS", link: "pc.html", keywords: "windows pc mac macbook laptop apple exe .exe computer desktop" },
      { title: "Störungen prüfen", desc: "Aktuelle Server-Ausfälle checken", link: "news.html", keywords: "störung ausfall server offline kaputt" },
      { title: "Fehlercode 401", desc: "User-Agent fehlt in Tivim Pro", link: "index.html#pro-401", keywords: "401 useragent user-agent tivimplayer pro fehlercode" },
      { title: "Fehlercode 403", desc: "Abo abgelaufen oder Tivim läuft parallel", link: "index.html#pro-403", keywords: "403 abo abgelaufen parallel handy fernseher gesperrt pro" },
      { title: "Tivim XC lädt nicht", desc: "Listen leer: keine Sender, keine Filme", link: "index.html#xc-empty", keywords: "xc leer inhalt update ablehnen erlauben listen filme sender" },
      { title: "Server-Status", desc: "Live-Status: Online oder Wartung", link: "news.html", keywords: "status server online offline störung ausfall" },
      { title: "Support kontaktieren", desc: "Hilfe anfordern & Checkliste", link: "kontakt.html", keywords: "support hilfe kontakt whatsapp anschreiben" }
    ];

    var searchTrigger = document.getElementById("searchTrigger");
    var searchOverlay = document.getElementById("searchOverlay");
    var closeSearch = document.getElementById("closeSearch");
    var spotlightInput = document.getElementById("spotlightInput");
    var searchResults = document.getElementById("searchResults");

    if (!searchTrigger || !searchOverlay || !closeSearch || !spotlightInput || !searchResults) return;

    searchTrigger.addEventListener("click", function () {
      searchOverlay.classList.remove("hidden");
      searchOverlay.setAttribute("aria-hidden", "false");
      setTimeout(function () {
        spotlightInput.focus();
      }, 100);
    });

    closeSearch.addEventListener("click", function () {
      searchOverlay.classList.add("hidden");
      searchOverlay.setAttribute("aria-hidden", "true");
      spotlightInput.value = "";
      searchResults.innerHTML = "";
    });

    spotlightInput.addEventListener("input", function (e) {
      var query = e.target.value.trim().toLowerCase();
      searchResults.innerHTML = "";
      if (query.length < 2) return;

      var filtered = searchData.filter(function (item) {
        return item.title.toLowerCase().indexOf(query) !== -1 ||
          item.desc.toLowerCase().indexOf(query) !== -1 ||
          item.keywords.toLowerCase().indexOf(query) !== -1;
      });

      filtered.forEach(function (item) {
        var a = document.createElement("a");
        a.href = item.link;
        a.className = "search-result-item";
        a.innerHTML = "<span class=\"result-title\">" + item.title + "</span><span class=\"result-desc\">" + item.desc + "</span>";
        searchResults.appendChild(a);
      });
    });
  }

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
})();
