(function () {
  "use strict";

  var APP_CODES = { xc: "9280570", pro: "3499175" };
  var selectedDevice = null;
  var selectedApp = null;
  var stepHistory = [];
  var currentStepId = "step-0";

  var codeDisplay = document.getElementById("code-display");
  var progressBar = document.getElementById("progress-bar");
  var progressLabel = document.getElementById("progress-label");
  var wizardHeader = document.getElementById("wizard-header");
  var steps = document.querySelectorAll(".step");
  var TOTAL_STEPS = 25;

  function updateProgress(stepNum) {
    if (!progressBar || !progressLabel) return;
    var percent = stepNum <= 0 ? 0 : Math.round((stepNum / TOTAL_STEPS) * 100);
    progressBar.style.width = percent + "%";
    progressBar.setAttribute("aria-valuenow", percent);
    progressLabel.textContent = stepNum <= 0 ? "Bevor wir starten" : "Schritt " + stepNum + " von 25";
  }

  function showStep(stepId) {
    var id = String(stepId).replace(/^step-?/, "");
    var targetId = id === "google" ? "step-google" : "step-" + id;

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

    if (targetId === "step-7" && codeDisplay) {
      codeDisplay.textContent = selectedApp && APP_CODES[selectedApp] ? APP_CODES[selectedApp] : "—";
    }

    var stepNum = id === "google" ? 0 : parseInt(id, 10);
    if (targetId === "step-19-pro") stepNum = 19;
    else if (targetId === "step-20-pro") stepNum = 20;
    else if (targetId === "step-21-pro") stepNum = 21;
    else if (targetId === "step-22-pro") stepNum = 22;
    else if (targetId === "step-23-pro") stepNum = 23;
    else if (targetId === "step-24-pro") stepNum = 25;
    else if (targetId === "step-20") stepNum = 25;
    updateProgress(isNaN(stepNum) ? 0 : stepNum);
  }

  function goTo(next) {
    stepHistory.push(currentStepId);
    if (next === "1") showStep("step-1");
    else if (next === "19") {
      if (selectedApp === "pro") showStep("step-19-pro");
      else showStep("step-19");
    }
    else if (next === "20-pro") showStep("step-20-pro");
    else if (next === "21-pro") showStep("step-21-pro");
    else if (next === "22-pro") showStep("step-22-pro");
    else if (next === "23-pro") showStep("step-23-pro");
    else if (next === "24-pro") showStep("step-24-pro");
    else if (next === "20") showStep("step-20");
    else if (next === "google") showStep("step-google");
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
        else goTo("google");
      });
    });
  }

  function bindStep2() {
    document.querySelectorAll("#step-2 [data-app]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedApp = this.getAttribute("data-app");
        document.querySelectorAll("#step-2 [data-app]").forEach(function (b) {
          b.classList.toggle("selected", b === btn);
        });
        goTo("3");
      });
    });
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
    bindStep1();
    bindStep2();
    bindNextButtons();
    bindBackButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
