/* Vanilla JS: i18n, kainodara, mailto forma, mobilus meniu. Be priklausomybių. */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var DICT = window.I18N || {};
  var PRICING = window.PRICING || { packages: [] };
  var STORAGE_KEY = "site-lang";
  var lang = CFG.defaultLang || "lt";

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICT[saved]) lang = saved;
  } catch (e) { /* localStorage unavailable */ }

  function fill(str) {
    return String(str).replace(/\{company\}/g, CFG.companyName || "");
  }

  function t(key) {
    var table = DICT[lang] || {};
    if (Object.prototype.hasOwnProperty.call(table, key)) return fill(table[key]);
    var fallback = DICT.lt || {};
    if (Object.prototype.hasOwnProperty.call(fallback, key)) return fill(fallback[key]);
    if (window.console) console.warn("i18n: missing key", key);
    return key;
  }

  function pick(obj) {
    if (obj == null) return "";
    if (typeof obj === "string") return obj;
    return obj[lang] != null ? obj[lang] : (obj.lt || "");
  }

  function formatPrice(value) {
    try {
      return new Intl.NumberFormat(lang === "lt" ? "lt-LT" : "en-IE", {
        style: "currency", currency: PRICING.currency || "EUR", maximumFractionDigits: 2
      }).format(value);
    } catch (e) {
      return value + " " + (PRICING.currency || "EUR");
    }
  }

  function hasPrice(p) {
    return typeof p.price === "number" && isFinite(p.price);
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderPricing() {
    var cards = document.getElementById("pricing-cards");
    var tbody = document.querySelector("#pricing-table tbody");
    if (!cards || !tbody) return;
    cards.textContent = "";
    tbody.textContent = "";

    PRICING.packages.forEach(function (p) {
      var card = el("article", "card price-card" + (p.highlight ? " is-highlight" : ""));
      if (p.highlight) card.appendChild(el("span", "badge", t("pricing.popular")));
      card.appendChild(el("h3", null, pick(p.name)));

      var priceBox = el("p", "price");
      if (hasPrice(p)) {
        // Skaičius rodomas tik kai kaina užpildyta pricing.js
        priceBox.appendChild(el("span", "price-value", (p.from ? (lang === "lt" ? "nuo " : "from ") : "") + formatPrice(p.price)));
        priceBox.appendChild(el("span", "price-unit", " / " + pick(p.unit)));
      } else {
        priceBox.appendChild(el("span", "price-request", t("pricing.onRequest")));
        priceBox.appendChild(el("span", "price-unit", pick(p.unit)));
      }
      card.appendChild(priceBox);

      var ul = el("ul", "checklist");
      (pick(p.features) || []).forEach(function (f) { ul.appendChild(el("li", null, f)); });
      card.appendChild(ul);

      var cta = el("a", "btn " + (p.highlight ? "btn-primary" : "btn-outline"), t("pricing.cta"));
      cta.href = "#kontaktai";
      cta.setAttribute("data-package", p.id);
      card.appendChild(cta);
      cards.appendChild(card);

      var tr = document.createElement("tr");
      var th = el("th", null, pick(p.name));
      th.scope = "row";
      tr.appendChild(th);
      tr.appendChild(el("td", null, pick(p.unit)));
      tr.appendChild(el("td", null, hasPrice(p) ? (p.from ? (lang === "lt" ? "nuo " : "from ") : "") + formatPrice(p.price) : t("pricing.onRequest")));
      tbody.appendChild(tr);
    });

    var vt = document.getElementById("volume-table");
    if (vt && PRICING.volumes) {
      var priced = PRICING.packages.filter(hasPrice);
      document.getElementById("volume-caption").textContent = pick(PRICING.volumeCaption);
      var head = document.getElementById("volume-head"); head.innerHTML = "";
      var th0 = el("th", null, pick(PRICING.volumeAssetsLabel)); th0.scope = "col"; head.appendChild(th0);
      priced.forEach(function (p) { var th = el("th", null, pick(p.name)); th.scope = "col"; head.appendChild(th); });
      var vb = vt.querySelector("tbody"); vb.innerHTML = "";
      PRICING.volumes.forEach(function (n) {
        var tr = document.createElement("tr");
        tr.appendChild(el("td", null, n.toLocaleString(lang === "lt" ? "lt-LT" : "en-IE")));
        priced.forEach(function (p) { tr.appendChild(el("td", null, formatPrice(Math.round(n * p.price)) + (lang === "lt" ? " / mėn." : " / mo"))); });
        vb.appendChild(tr);
      });
      vt.parentNode.hidden = priced.length === 0;
    }
    var lic = document.getElementById("license-reference");
    if (lic && PRICING.licenseReference) lic.textContent = pick(PRICING.licenseReference);
    var vat = document.getElementById("vat-note");
    if (vat) {
      var anyPrice = PRICING.packages.some(hasPrice);
      vat.textContent = anyPrice ? pick(PRICING.vatNote) : "";
      vat.hidden = !anyPrice;
    }
  }

  function applyCompany() {
    document.querySelectorAll("[data-company]").forEach(function (n) {
      n.textContent = CFG.companyName || "";
    });

    var email = CFG.contactEmail || "";
    var a = document.getElementById("contact-email");
    if (a) { a.textContent = email; a.href = "mailto:" + email; }

    var phone = document.getElementById("contact-phone");
    if (phone) {
      if (CFG.contactPhone) {
        phone.textContent = "";
        var pa = el("a", null, CFG.contactPhone);
        pa.href = "tel:" + CFG.contactPhone.replace(/\s+/g, "");
        phone.appendChild(pa);
        phone.hidden = false;
      } else {
        phone.hidden = true;
      }
    }

    var meta = document.getElementById("company-meta");
    if (meta) {
      var parts = [];
      if (CFG.companyCode) parts.push((lang === "lt" ? "Įm. k. " : "Reg. no. ") + CFG.companyCode);
      if (CFG.address) parts.push(CFG.address);
      meta.textContent = parts.length ? " " + parts.join(" · ") : "";
    }

    // TODO(partner-status): tekstas imamas iš config.js → partnerStatus; tuščias = paslėpta.
    var ps = document.getElementById("partner-status");
    if (ps) {
      var txt = pick(CFG.partnerStatus);
      ps.textContent = txt;
      ps.hidden = !txt;
    }

    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function applyLang() {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (n) {
      n.textContent = t(n.getAttribute("data-i18n"));
    });

    document.querySelectorAll("[data-i18n-attr]").forEach(function (n) {
      n.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var idx = pair.indexOf(":");
        if (idx < 1) return;
        n.setAttribute(pair.slice(0, idx).trim(), t(pair.slice(idx + 1).trim()));
      });
    });

    document.title = t("meta.title");

    var toggle = document.getElementById("lang-toggle");
    if (toggle) toggle.textContent = lang === "lt" ? "EN" : "LT";

    applyCompany();
    renderPricing();
  }

  function setupLangToggle() {
    var toggle = document.getElementById("lang-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      lang = lang === "lt" ? "en" : "lt";
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
      applyLang();
    });
  }

  function setupNav() {
    var btn = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!btn || !nav) return;
    function close() { nav.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.tagName === "A") close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { close(); btn.focus(); }
    });
  }

  function setupForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var err = document.getElementById("form-error");

    // Paspaudus „Gauti pasiūlymą“ – žinutėje paminimas paketas
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest("[data-package]") : null;
      if (!link) return;
      var pkg = PRICING.packages.filter(function (p) { return p.id === link.getAttribute("data-package"); })[0];
      var msg = document.getElementById("cf-msg");
      if (pkg && msg && !msg.value) msg.value = pick(pkg.name) + ": ";
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      if (!name || !email || !form.elements.email.checkValidity()) {
        err.textContent = t("contact.required");
        err.hidden = false;
        (name ? form.elements.email : form.elements.name).focus();
        return;
      }
      err.hidden = true;
      var lines = [
        t("contact.name") + ": " + name,
        t("contact.org") + ": " + form.elements.org.value.trim(),
        t("contact.email") + ": " + email,
        t("contact.assets") + ": " + form.elements.assets.value.trim(),
        "",
        form.elements.message.value.trim()
      ];
      var href = "mailto:" + encodeURIComponent(CFG.contactEmail || "").replace(/%40/g, "@") +
        "?subject=" + encodeURIComponent(t("contact.subject")) +
        "&body=" + encodeURIComponent(lines.join("\n"));
      window.location.href = href;
    });
  }

  function init() {
    applyLang();
    setupLangToggle();
    setupNav();
    setupForm();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  // Testavimui / for debugging
  window.__site = { t: t, setLang: function (l) { if (DICT[l]) { lang = l; applyLang(); } } };
})();
