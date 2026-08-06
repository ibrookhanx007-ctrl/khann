// ORYA Security Ltd — shared site behaviour

document.addEventListener("DOMContentLoaded", function () {
  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Highlight active nav link */
  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a[data-page]").forEach(function (link) {
    if (link.getAttribute("data-page") === currentPage) {
      link.classList.add("active");
    }
  });

  /* Cookie consent banner */
  var CONSENT_KEY = "oryaCookieConsent";
  var banner = document.getElementById("cookie-banner");

  if (banner) {
    var stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setTimeout(function () {
        banner.classList.add("visible");
      }, 400);
    }

    var acceptBtn = document.getElementById("cookie-accept");
    var rejectBtn = document.getElementById("cookie-reject");
    var settingsBtn = document.getElementById("cookie-settings");

    function hideBanner() {
      banner.classList.remove("visible");
    }

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        localStorage.setItem(CONSENT_KEY, "accepted");
        hideBanner();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", function () {
        localStorage.setItem(CONSENT_KEY, "rejected");
        hideBanner();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener("click", function () {
        window.location.href = "cookie-policy.html";
      });
    }
  }

  /* Quote & contact forms: build a mailto with the submitted details
     since this is a static site with no backend to receive submissions. */
  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var recipient = form.getAttribute("data-mailto");
      var subject = form.getAttribute("data-subject") || "Website enquiry";
      var lines = [];

      form.querySelectorAll("input, select, textarea").forEach(function (field) {
        if (!field.name) return;
        var labelEl = form.querySelector('label[for="' + field.id + '"]');
        var label = labelEl ? labelEl.textContent.trim() : field.name;
        var value = field.value.trim();
        if (value) {
          lines.push(label + ": " + value);
        }
      });

      var body = encodeURIComponent(lines.join("\n"));
      var mailtoUrl = "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + body;

      var successEl = form.parentElement.querySelector(".form-success");
      if (successEl) {
        successEl.classList.add("visible");
      }

      window.location.href = mailtoUrl;
      form.reset();
    });
  });
});
