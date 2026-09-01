(function () {
  "use strict";

  var API = window.TIVIM_API || "";
  var STORAGE_KEY = "tivim_poll_voted";

  var pollBtn = document.getElementById("open-poll-btn");
  var pollModal = document.getElementById("poll-modal");
  var pollClose = document.getElementById("poll-modal-close");
  var pollTitle = document.getElementById("poll-modal-title");
  var pollText = document.getElementById("poll-modal-text");
  var pollBody = document.getElementById("poll-modal-body");
  var pollState = null;

  if (!pollBtn || !pollModal || !pollBody) return;

  function openModal() {
    pollModal.classList.remove("hidden");
    pollModal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    pollModal.classList.add("hidden");
    pollModal.setAttribute("aria-hidden", "true");
  }

  function votedPollId() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function markVoted(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      /* ignore */
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderResults(results) {
    pollBody.innerHTML =
      '<div class="poll-results">' +
      results
        .map(function (r) {
          return (
            '<div class="poll-result-row">' +
            '<div class="poll-result-head"><span>' +
            escapeHtml(r.label) +
            "</span><strong>" +
            r.pct +
            "%</strong></div>" +
            '<div class="poll-result-bar"><span style="width:' +
            r.pct +
            '%"></span></div>' +
            '<p class="poll-result-count">' +
            r.count +
            " Stimme" +
            (r.count === 1 ? "" : "n") +
            "</p></div>"
          );
        })
        .join("") +
      '<button type="button" class="poll-btn poll-btn--ghost" id="poll-close-done">Schließen</button></div>';
    var done = document.getElementById("poll-close-done");
    if (done) done.addEventListener("click", closeModal);
  }

  function renderOptions(poll) {
    pollBody.innerHTML =
      '<div class="poll-options" id="poll-options">' +
      poll.options
        .map(function (o) {
          return (
            '<button type="button" class="poll-option" data-id="' +
            escapeHtml(o.id) +
            '">' +
            escapeHtml(o.label) +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="poll-vote-hint" id="poll-vote-hint"></p>';

    pollBody.querySelectorAll(".poll-option").forEach(function (btn) {
      btn.addEventListener("click", function () {
        submitVote(poll.id, btn.getAttribute("data-id"), btn);
      });
    });
  }

  function showPoll(poll) {
    pollTitle.textContent = poll.title || "Umfrage";
    pollText.textContent = poll.text || "";
    if (votedPollId() === poll.id) {
      fetchResults(poll.id);
      return;
    }
    renderOptions(poll);
  }

  function fetchResults(pollId) {
    pollBody.innerHTML = '<p class="poll-vote-hint">Lade Ergebnisse …</p>';
    fetch(API + "/poll/results", { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (!data || !data.active || data.id !== pollId || !data.results) {
          pollBody.innerHTML = '<p class="poll-vote-hint">Ergebnisse gerade nicht verfügbar.</p>';
          return;
        }
        renderResults(data.results);
      })
      .catch(function () {
        pollBody.innerHTML = '<p class="poll-vote-hint">Ergebnisse gerade nicht verfügbar.</p>';
      });
  }

  function submitVote(pollId, optionId, btn) {
    if (btn) btn.disabled = true;
    var hint = document.getElementById("poll-vote-hint");
    if (hint) hint.textContent = "Wird gezählt …";

    fetch(API + "/poll/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId: optionId, pollId: pollId }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (out) {
        if (out.data && out.data.results) {
          markVoted(pollId);
          renderResults(out.data.results);
          return;
        }
        if (out.status === 409 && out.data && out.data.results) {
          markVoted(pollId);
          renderResults(out.data.results);
          return;
        }
        if (hint) hint.textContent = "Abstimmung gerade nicht möglich – bitte später nochmal.";
        if (btn) btn.disabled = false;
      })
      .catch(function () {
        if (hint) hint.textContent = "Abstimmung gerade nicht möglich – bitte später nochmal.";
        if (btn) btn.disabled = false;
      });
  }

  function loadPoll() {
    if (!API) {
      pollBtn.classList.add("is-hide");
      return;
    }
    fetch(API + "/poll", { cache: "no-store" })
      .then(function (res) {
        return res.ok ? res.json() : { active: false };
      })
      .then(function (data) {
        if (!data || !data.active) {
          pollState = null;
          pollBtn.classList.add("is-hide");
          return;
        }
        pollState = data;
        pollBtn.classList.remove("is-hide");
      })
      .catch(function () {
        pollBtn.classList.add("is-hide");
      });
  }

  pollBtn.addEventListener("click", function () {
    if (!pollState) return;
    showPoll(pollState);
    openModal();
  });

  if (pollClose) pollClose.addEventListener("click", closeModal);
  pollModal.addEventListener("click", function (e) {
    if (e.target === pollModal) closeModal();
  });

  loadPoll();
})();
