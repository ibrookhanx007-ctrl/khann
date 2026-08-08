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

  /* ================================================================
     Premium form system: client-side validation, multi-state submit
     button, success/error screens, and Web3Forms submission.
     (No application backend exists for this static site — Web3Forms
     is the real service that emails oryasec@yahoo.com; see README
     notes in the repo for details.)
     ================================================================ */

  function fieldLabel(field) {
    var wrapper = field.closest(".form-field");
    var label = wrapper ? wrapper.querySelector("label") : null;
    if (!label) return field.name || "This field";
    return label.textContent.replace(/\s*\*\s*$/, "").replace(/\s*\(optional\)\s*$/i, "").trim();
  }

  function setFieldError(field, message) {
    var wrapper = field.closest(".form-field");
    if (!wrapper) return;
    var errorEl = wrapper.querySelector(".field-error");
    wrapper.classList.toggle("has-error", !!message);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (errorEl) errorEl.textContent = message || "";
  }

  function validateField(field) {
    if (field.name === "botcheck" || field.disabled) return true;

    var value = field.value || "";
    var message = "";

    if (field.type === "file") {
      if (field.hasAttribute("required") && (!field.files || field.files.length === 0)) {
        message = "Please attach your CV.";
      } else if (field.files && field.files[0]) {
        var file = field.files[0];
        var allowed = (field.dataset.allowedTypes || "").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
        var maxMb = parseFloat(field.dataset.maxSizeMb || "5");
        var ext = "." + (file.name.split(".").pop() || "").toLowerCase();
        if (allowed.length && allowed.indexOf(ext) === -1) {
          message = "Please upload a " + allowed.join(", ") + " file.";
        } else if (file.size > maxMb * 1024 * 1024) {
          message = "That file is too large. Maximum size is " + maxMb + "MB.";
        }
      }
    } else if (field.type === "checkbox") {
      if (field.hasAttribute("required") && !field.checked) {
        message = fieldLabel(field) + " is required.";
      }
    } else {
      var trimmed = value.trim();
      if (field.hasAttribute("required") && trimmed.length === 0) {
        message = fieldLabel(field) + " is required.";
      } else if (trimmed.length > 0) {
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          message = "Please enter a valid email address.";
        } else if (field.type === "tel" && !/^[+]?[\d\s()-]{7,20}$/.test(trimmed)) {
          message = "Please enter a valid telephone number.";
        } else if (field.tagName === "SELECT" && field.hasAttribute("required") && trimmed === "") {
          message = "Please make a selection.";
        } else if (field.dataset.minlength && trimmed.length < parseInt(field.dataset.minlength, 10)) {
          message = "Please provide a little more detail (at least " + field.dataset.minlength + " characters).";
        } else if (field.maxLength && field.maxLength > 0 && value.length > field.maxLength) {
          message = "Please shorten this to " + field.maxLength + " characters or fewer.";
        }
      }
    }

    setFieldError(field, message);
    return !message;
  }

  function validateForm(form) {
    var fields = form.querySelectorAll("input, select, textarea");
    var firstInvalid = null;
    var valid = true;
    fields.forEach(function (field) {
      if (!validateField(field) && field.name !== "botcheck") {
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });
    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function generateReference() {
    var year = new Date().getFullYear();
    var rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return "ORYA-" + year + "-" + rand;
  }

  /* Custom file inputs: show the chosen filename, keep it keyboard accessible */
  document.querySelectorAll(".file-upload").forEach(function (wrap) {
    var input = wrap.querySelector('input[type="file"]');
    var nameEl = wrap.querySelector(".file-upload-name");
    if (!input || !nameEl) return;
    input.addEventListener("change", function () {
      if (input.files && input.files[0]) {
        nameEl.textContent = input.files[0].name;
        nameEl.classList.add("chosen");
        wrap.classList.add("has-file");
      } else {
        nameEl.textContent = nameEl.dataset.placeholder || "No file chosen";
        nameEl.classList.remove("chosen");
        wrap.classList.remove("has-file");
      }
      validateField(input);
    });
  });

  document.querySelectorAll("form[data-web3forms]").forEach(function (form) {
    var loadedAt = Date.now();
    var isSubmitting = false;
    var submitBtn = form.querySelector(".btn-submit");
    var labelEl = submitBtn ? submitBtn.querySelector(".btn-label") : null;
    var wrapper = form.closest(".form-card") || form.parentElement;
    var statusBanner = wrapper.querySelector(".form-status-banner");
    var successScreen = wrapper.querySelector(".form-success-screen");

    var TEXT = {
      default: (submitBtn && submitBtn.dataset.defaultText) || (labelEl && labelEl.textContent) || "Submit",
      loading: (submitBtn && submitBtn.dataset.loadingText) || "Submitting...",
      success: (submitBtn && submitBtn.dataset.successText) || "Submission Received",
      error: (submitBtn && submitBtn.dataset.errorText) || "Try Again",
    };

    function setButtonState(state) {
      if (!submitBtn) return;
      submitBtn.classList.remove("is-loading", "is-success", "is-error");
      submitBtn.disabled = state === "loading";
      if (state === "loading") {
        submitBtn.classList.add("is-loading");
      } else if (state === "success") {
        submitBtn.classList.add("is-success");
      } else if (state === "error") {
        submitBtn.classList.add("is-error");
      }
      if (labelEl) {
        labelEl.textContent = TEXT[state] || TEXT.default;
      }
    }

    /* Validate on blur once the user has interacted with a field */
    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      if (field.name === "botcheck") return;
      field.addEventListener("blur", function () {
        field.dataset.touched = "1";
        validateField(field);
      });
      field.addEventListener("input", function () {
        if (field.dataset.touched) validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (isSubmitting) return;

      if (statusBanner) statusBanner.classList.remove("visible");

      /* Validate first, always — genuine visitors must see field errors
         no matter how quickly they submit. Spam heuristics only gate
         submissions that are otherwise valid. */
      if (!validateForm(form)) {
        return;
      }

      /* Honeypot: bots that fill every field will trip this hidden checkbox */
      var honeypot = form.querySelector('[name="botcheck"]');
      if (honeypot && honeypot.checked) return;

      /* Simple bot-timing heuristic: genuine visitors take more than a
         couple of seconds to read and fill the form */
      if (Date.now() - loadedAt < 1500) return;

      var reference = generateReference();
      var refField = form.querySelector('[name="reference"]');
      if (refField) refField.value = reference;

      isSubmitting = true;
      setButtonState("loading");

      var formData = new FormData(form);

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (result) {
          if (result && result.success) {
            setButtonState("success");
            if (successScreen) {
              var refValueEl = successScreen.querySelector(".success-reference .value");
              if (refValueEl) refValueEl.textContent = reference;
              form.setAttribute("hidden", "");
              successScreen.classList.add("visible");
              var heading = successScreen.querySelector("h3");
              if (heading) {
                heading.setAttribute("tabindex", "-1");
                heading.focus();
              }
            }
          } else {
            setButtonState("error");
            if (statusBanner) statusBanner.classList.add("visible");
          }
        })
        .catch(function () {
          setButtonState("error");
          if (statusBanner) statusBanner.classList.add("visible");
        })
        .finally(function () {
          isSubmitting = false;
        });
    });
  });
});
