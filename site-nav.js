(function () {
  "use strict";

  if (document.body.dataset.siteNav === "off") return;

  var SVG = {
    home:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    help:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
    vpn:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>',
    install:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>',
    more:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>'
  };

  var NAV = [
    { id: "start", href: "index.html", label: "Start", icon: "home", match: /(^|\/)index\.html?$|\/$/ },
    { id: "hilfe", href: "stoerungen.html", label: "Hilfe", icon: "help", match: /stoerungen\.html/ },
    { id: "vpn", href: "vpn.html", label: "VPN", icon: "vpn", match: /vpn\.html|privado\.html|proton-free\.html/ },
    { id: "install", href: "install.html", label: "Install", icon: "install", match: /install\.html|tivim\.html|mobile-install\.html|pc\.html/ },
    { id: "mehr", href: "mehr.html", label: "Mehr", icon: "more", match: /mehr\.html|neuigkeiten\.html|kontakt\.html|news\.html/ }
  ];

  var path = window.location.pathname.split("/").pop() || "index.html";
  if (path === "") path = "index.html";
  var fullPath = window.location.pathname;

  function isIndexHome() {
    var onIndex = path === "index.html" || fullPath.endsWith("/");
    return onIndex && !document.body.classList.contains("guide-open");
  }

  function mountTopBar(container) {
    var top = document.createElement("header");
    top.className = "site-top";
    top.innerHTML =
      '<div class="site-top-inner">' +
      '<a href="index.html" class="site-top-home" id="siteTopHome" aria-label="Zur Startseite">' +
      SVG.home +
      "</a></div>";
    container.insertBefore(top, container.firstChild);

    function syncTopVisibility() {
      if (isIndexHome()) top.classList.add("is-hide");
      else top.classList.remove("is-hide");
    }
    syncTopVisibility();

    var homeLink = document.getElementById("siteTopHome");
    if (homeLink) {
      homeLink.addEventListener("click", function (e) {
        var onIndex = path === "index.html" || fullPath.endsWith("/");
        if (onIndex && document.body.classList.contains("guide-open")) {
          e.preventDefault();
          if (window.__tivimGoHome) window.__tivimGoHome();
        }
      });
    }

    window.addEventListener("tivim:guide-toggle", syncTopVisibility);
  }

  function mountBottomNav() {
    var nav = document.createElement("nav");
    nav.className = "site-bottom-nav";
    nav.setAttribute("aria-label", "Hauptmenü");

    var inner = document.createElement("div");
    inner.className = "site-bottom-inner";

    NAV.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "site-nav-item";
      a.href = item.href;
      if (item.match.test(fullPath) || item.match.test(path)) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
      a.innerHTML =
        '<span class="site-nav-icon">' +
        SVG[item.icon] +
        "</span><span>" +
        item.label +
        "</span>";
      inner.appendChild(a);
    });

    nav.appendChild(inner);
    document.body.appendChild(nav);
  }

  var root =
    document.querySelector(".wrap") ||
    document.querySelector(".wizard") ||
    document.querySelector(".page") ||
    document.body;

  document.body.classList.add("has-site-nav");
  mountTopBar(root);
  mountBottomNav();
})();
