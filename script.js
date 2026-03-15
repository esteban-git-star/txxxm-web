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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
      initSpotlightSearch();
    });
  } else {
    init();
    initSpotlightSearch();
  }

  // Service Worker für PWA
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").then(function () {
      console.log("Service Worker Registered");
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
      { title: "Störungen prüfen", desc: "Aktuelle Server-Ausfälle checken", link: "news.html", keywords: "störung ausfall server offline kaputt" },
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
})();
