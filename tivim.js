(function () {
  "use strict";

  var APP_CODES = { xc: "4609023", pro: "4422645" };
  var selectedDevice = null;
  var selectedApp = null;
  var stepHistory = [];
  var currentStepId = "step-0";

  var codeDisplay = document.getElementById("code-display");
  var progressBar = document.getElementById("progress-bar");
  var progressLabel = document.getElementById("progress-label");
  var wizardHeader = document.getElementById("wizard-header");
  var steps = document.querySelectorAll(".step");
  var TOTAL_STEPS = 26;

  function updateProgress(stepNum) {
    if (!progressBar || !progressLabel) return;
    var percent = stepNum <= 0 ? 0 : Math.round((stepNum / TOTAL_STEPS) * 100);
    progressBar.style.width = percent + "%";
    progressBar.setAttribute("aria-valuenow", percent);
    progressLabel.textContent = stepNum <= 0 ? "Bevor wir starten" : "Schritt " + stepNum + " von 26";
  }

  function showStep(stepId) {
    var id = String(stepId).replace(/^step-?/, "");
    var targetId = "step-" + id;

    steps.forEach(function (el) {
      el.classList.remove("step-visible");
    });

    var target = document.getElementById(targetId);
    if (target) {
      target.classList.add("step-visible");
    }

    currentStepId = targetId;

    if (wizardHeader) {
      wizardHeader.style.display = targetId === "step-0" ? "none" : "";
    }

    if (targetId === "step-8") syncCodeDisplay();

    if (targetId === "step-11") {
      var btnAfter = document.getElementById("btn-after-download");
      if (btnAfter) {
        btnAfter.setAttribute("data-next", selectedDevice === "googletv" ? "g12" : "12");
      }
    }

    var stepNum = parseInt(id, 10);
    if (targetId === "step-g-delete") stepNum = 1;
    else if (targetId === "step-g-choose") stepNum = 2;
    else if (targetId === "step-g1") stepNum = 3;
    else if (targetId === "step-g2") stepNum = 4;
    else if (targetId === "step-g3") stepNum = 5;
    else if (targetId === "step-g12") stepNum = 12;
    else if (targetId === "step-g-dev1") stepNum = 13;
    else if (targetId === "step-g-dev2") stepNum = 14;
    else if (targetId === "step-g-dev3") stepNum = 15;
    else if (targetId === "step-g-success") stepNum = 16;
    else if (targetId === "step-19-pro") stepNum = 20;
    else if (targetId === "step-20-pro") stepNum = 21;
    else if (targetId === "step-21-pro") stepNum = 22;
    else if (targetId === "step-22-pro") stepNum = 23;
    else if (targetId === "step-23-pro") stepNum = 24;
    else if (targetId === "step-24-pro") stepNum = 26;
    else if (targetId === "step-21") stepNum = 26;
    updateProgress(isNaN(stepNum) ? 0 : stepNum);
  }

  function goTo(next) {
    stepHistory.push(currentStepId);
    if (next === "1") showStep("step-1");
    else if (next === "20") {
      if (selectedApp === "pro") showStep("step-19-pro");
      else showStep("step-20");
    }
    else if (next === "20-pro") showStep("step-20-pro");
    else if (next === "21-pro") showStep("step-21-pro");
    else if (next === "22-pro") showStep("step-22-pro");
    else if (next === "23-pro") showStep("step-23-pro");
    else if (next === "24-pro") showStep("step-24-pro");
    else if (next === "20") showStep("step-20");
    else if (next === "21") showStep("step-21");
    else showStep("step-" + next);
  }

  function goBack() {
    if (stepHistory.length === 0) return;
    var prevId = stepHistory.pop();
    showStep(prevId);
  }

  function bindStep1() {
    document.querySelectorAll("#step-1 [data-device]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedDevice = this.getAttribute("data-device");
        document.querySelectorAll("#step-1 [data-device]").forEach(function (b) {
          b.classList.toggle("selected", b === btn);
        });
        if (selectedDevice === "firetv") goTo("2");
        else goTo("g-delete");
      });
    });
  }

  function normalizeAppChoice(dataApp) {
    return (dataApp === "pro-google" || dataApp === "pro") ? "pro" : "xc";
  }

  function syncCodeDisplay() {
    if (codeDisplay) {
      codeDisplay.textContent = selectedApp && APP_CODES[selectedApp] ? APP_CODES[selectedApp] : "—";
    }
  }

  function bindAppSelection() {
    document.querySelectorAll("[data-app]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var raw = this.getAttribute("data-app");
        selectedApp = normalizeAppChoice(raw);
        syncCodeDisplay();
      });
    });
  }

  function bindStep2() {
    document.querySelectorAll("#step-3 [data-app]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedApp = normalizeAppChoice(this.getAttribute("data-app"));
        syncCodeDisplay();
        document.querySelectorAll("#step-3 [data-app]").forEach(function (b) {
          b.classList.toggle("selected", b === btn);
        });
        goTo("4");
      });
    });
  }

  function bindStepGoogleChoose() {
    document.querySelectorAll("#step-g-choose [data-app]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedApp = normalizeAppChoice(this.getAttribute("data-app"));
        syncCodeDisplay();
        document.querySelectorAll("#step-g-choose [data-app]").forEach(function (b) {
          b.classList.toggle("selected", b === btn);
        });
        // Navigation zu g1 übernimmt der .btn[data-next] Handler
      });
    });
  }

  function bindBtnGFinish() {
    var btnGFinish = document.getElementById("btn-g-finish");
    if (btnGFinish) {
      btnGFinish.addEventListener("click", function () {
        // Direkt zum Login/Startbildschirm (überspringt Home-Screen-Suche)
        if (selectedApp === "xc" || selectedApp === "xc-google") {
          goTo("21");      // XC: Einloggen-Screen
        } else if (selectedApp === "pro" || selectedApp === "pro-google") {
          goTo("20-pro");  // Pro: Startbildschirm „Hinzufügen“
        }
      });
    }
  }

  function bindNextButtons() {
    document.querySelectorAll(".btn[data-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = this.getAttribute("data-next");
        if (next) goTo(next);
      });
    });
  }

  function bindBackButtons() {
    document.querySelectorAll(".back-btn").forEach(function (btn) {
      if (btn.tagName === "A") return;
      btn.addEventListener("click", goBack);
    });
  }

  function init() {
    showStep("step-0");
    bindAppSelection();
    bindStep1();
    bindStep2();
    bindStepGoogleChoose();
    bindBtnGFinish();
    bindNextButtons();
    bindBackButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
