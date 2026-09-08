/* La Cave aux Instrum' — script principal (aucune dépendance externe) */
(function () {
  "use strict";

  /* ----- Menu mobile ----- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ----- Année dans le pied de page ----- */
  var y = document.querySelector("[data-year]");
  if (y) { y.textContent = String(new Date().getFullYear()); }

  /* ----- Formulaire de contact : garde-fous côté client -----
     Le traitement réel se fait côté serveur/prestataire d'envoi.
     Ici : anti-robot (honeypot + délai) et retour visuel. */
  var form = document.querySelector("form[data-contact]");
  if (form) {
    var instrument = new URLSearchParams(window.location.search).get("instrument");
    if (instrument) {
      var subject = form.querySelector('[name="sujet"]');
      var message = form.querySelector('[name="message"]');
      if (subject && !subject.value) { subject.value = "Demande concernant : " + instrument; }
      if (message && !message.value) { message.value = "Bonjour,\n\nJe souhaiterais obtenir des informations et, si possible, réserver un essai pour : " + instrument + ".\n\nMerci."; }
      var instrumentField = document.createElement("input");
      instrumentField.type = "hidden";
      instrumentField.name = "instrument";
      instrumentField.value = instrument;
      form.appendChild(instrumentField);
    }
    var loadedAt = Date.now();
    form.addEventListener("submit", function (e) {
      var hp = form.querySelector('input[name="site_web"]');
      var tooFast = Date.now() - loadedAt < 2500;
      if ((hp && hp.value) || tooFast) {
        e.preventDefault();
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = "Envoi en cours…"; }
    });
  }
})();
