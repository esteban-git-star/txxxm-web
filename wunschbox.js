(function () {
  "use strict";

  var form = document.getElementById("wishboxForm");
  var statusEl = document.getElementById("wishboxStatus");
  var submitBtn = document.getElementById("wishboxSubmit");
  if (!form || !statusEl) return;

  var API = (window.TIVIM_API || "https://tivim-chatbot.eyepitv.workers.dev") + "/wishbox";

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "wishbox-status" + (kind ? " is-" + kind : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");

    var fd = new FormData(form);
    var message = String(fd.get("message") || "").trim();
    if (message.length < 10) {
      setStatus("Bitte etwas ausführlicher – mindestens ein Satz.", "error");
      return;
    }

    var contact = String(fd.get("contact") || "").trim();
    if (contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setStatus("Die E-Mail sieht komisch aus – nochmal checken?", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Wird geschickt …");

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") || "").trim(),
        contact: contact,
        message: message,
        website: String(fd.get("website") || ""),
      }),
    })
      .then(function (res) {
        if (res.status === 429) throw new Error("rate");
        if (!res.ok) throw new Error("fail");
        return res.json();
      })
      .then(function () {
        form.reset();
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
})();
