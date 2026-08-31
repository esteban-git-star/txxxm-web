(function () {
  "use strict";

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function safeUrl(url) {
    var u = String(url || "").trim();
    if (!/^https?:\/\//i.test(u)) return "";
    return escapeHtml(u);
  }

  function linkHtml(url, label) {
    var safe = safeUrl(url);
    if (!safe) return escapeHtml(label);
    return (
      '<a href="' +
      safe +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(label) +
      "</a>"
    );
  }

  function formatInline(raw) {
    var s = String(raw);
    var links = [];

    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, function (_m, label, url) {
      var i = links.length;
      links.push({ url: url, label: label });
      return "\x01L" + i + "\x01";
    });

    s = escapeHtml(s);

    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    s = s.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/gi, function (url) {
      return linkHtml(url, url);
    });

    s = s.replace(/\x01L(\d+)\x01/g, function (_m, idx) {
      var item = links[Number(idx)];
      if (!item) return "";
      return linkHtml(item.url, item.label);
    });

    return s;
  }

  function formatUpdateBody(text) {
    if (!text) return "";
    var lines = String(text).split(/\n/);
    var out = [];

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;

      if (/^##\s+/.test(trimmed)) {
        out.push(
          '<h3 class="live-update-h">' +
            formatInline(trimmed.replace(/^##\s+/, "")) +
            "</h3>"
        );
        return;
      }

      if (/^#\s+/.test(trimmed)) {
        out.push(
          '<h3 class="live-update-h">' +
            formatInline(trimmed.replace(/^#\s+/, "")) +
            "</h3>"
        );
        return;
      }

      out.push('<p class="live-update-p">' + formatInline(trimmed) + "</p>");
    });

    return out.join("");
  }

  window.TIVIM_formatUpdateBody = formatUpdateBody;
})();
