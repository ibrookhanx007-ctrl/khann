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

  /* Smooth scroll-reveal on scroll (progressive enhancement — elements are
     fully visible by default; this only adds motion when JS runs). */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll(
      ".card, .section-header, .process-step, .stat, .faq-item, .industry-card, .detail-panel, .benefit-item, .spec-item, .info-row"
    );
    var revealIndex = new Map();

    revealEls.forEach(function (el) {
      el.classList.add("reveal");
      var parent = el.parentElement;
      var idx = revealIndex.get(parent) || 0;
      el.style.transitionDelay = Math.min(idx * 60, 300) + "ms";
      revealIndex.set(parent, idx + 1);
    });

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
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

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    if (!question) return;
    question.addEventListener("click", function () {
      var wasOpen = item.classList.contains("open");
      item.closest(".faq-list").querySelectorAll(".faq-item.open").forEach(function (openItem) {
        openItem.classList.remove("open");
      });
      if (!wasOpen) {
        item.classList.add("open");
      }
    });
  });

  /* Pre-select the service dropdown on the quote form when arriving from
     a service detail page's "Request a Quote" link, e.g. quote.html?service=Door%20Supervisors */
  var serviceSelect = document.getElementById("service");
  if (serviceSelect) {
    var requestedService = new URLSearchParams(window.location.search).get("service");
    if (requestedService) {
      var matchingOption = Array.from(serviceSelect.options).find(function (opt) {
        return opt.value === requestedService;
      });
      if (matchingOption) {
        serviceSelect.value = requestedService;
      }
    }
  }

  /* Quote & contact forms: submit via Web3Forms (https://web3forms.com)
     so submissions are emailed without needing a custom backend. */
  document.querySelectorAll("form[data-web3forms]").forEach(function (form) {
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : "";
    var successEl = form.parentElement.querySelector(".form-success");
    var errorEl = form.parentElement.querySelector(".form-error");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (errorEl) errorEl.classList.remove("visible");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      var formData = new FormData(form);
      var payload = Object.fromEntries(formData.entries());

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          if (result.success) {
            form.reset();
            if (successEl) successEl.classList.add("visible");
          } else if (errorEl) {
            errorEl.classList.add("visible");
          }
        })
        .catch(function () {
          if (errorEl) errorEl.classList.add("visible");
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          }
        });
    });
  });
});
