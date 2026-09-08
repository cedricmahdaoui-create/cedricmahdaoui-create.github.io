/* La Cave aux Instrum' — catalogue filtrable (aucune dépendance externe) */
(function () {
  "use strict";

  var grid = document.getElementById("cat-grid");
  var countEl = document.getElementById("cat-count");
  var emptyEl = document.getElementById("cat-empty");
  if (!grid) return;

  var items = [];

  var ETAT_LABEL = {
    "revise": "Révisé, prêt à jouer",
    "a-restaurer": "À restaurer",
    "piece": "Pièce détachée"
  };
  var FAMILLE_LABEL = {
    "vent": "Instrument à vent",
    "cordes": "Cordes — quatuor",
    "percussion": "Percussion",
    "accessoire": "Accessoire"
  };

  var f = {
    q: document.getElementById("f-q"),
    famille: document.getElementById("f-famille"),
    etat: document.getElementById("f-etat"),
    budget: document.getElementById("f-budget"),
    dispo: document.getElementById("f-dispo")
  };
  var resetBtn = document.getElementById("f-reset");

  function prix(v) {
    if (!v || v <= 0) return "Prix sur demande";
    return v.toLocaleString("fr-FR") + " €";
  }

  function inBudget(v, range) {
    if (!range) return true;
    if (!v || v <= 0) return false; // "prix sur demande" exclu des tranches chiffrées
    var parts = range.split("-");
    var min = parts[0] === "" ? -Infinity : Number(parts[0]);
    var max = parts[1] === "" || parts[1] === undefined ? Infinity : Number(parts[1]);
    return v >= min && v <= max;
  }

  function matches(it) {
    var q = (f.q.value || "").trim().toLowerCase();
    if (q) {
      var hay = (it.nom + " " + (it.sousfamille || "") + " " + (it.desc || "")).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    if (f.famille.value && it.famille !== f.famille.value) return false;
    if (f.etat.value && it.etat !== f.etat.value) return false;
    if (!inBudget(it.prix, f.budget.value)) return false;
    if (f.dispo.checked && !it.dispo) return false;
    return true;
  }

  function card(it) {
    var el = document.createElement("article");
    el.className = "cat-card" + (it.dispo ? "" : " is-unavailable");

    var media = document.createElement("div");
    media.className = "cat-card-media";
    if (it.photo) {
      var img = document.createElement("img");
      img.src = it.photo;
      img.alt = it.nom;
      img.loading = "lazy";
      media.appendChild(img);
    } else {
      var ph = document.createElement("div");
      ph.className = "placeholder";
      ph.setAttribute("role", "img");
      ph.setAttribute("aria-label", "Photo à venir — " + it.nom);
      media.appendChild(ph);
    }
    var badge = document.createElement("span");
    badge.className = "cat-badge" + (it.dispo ? " cat-badge--ok" : "");
    badge.textContent = it.dispo ? "Disponibilité à confirmer" : "Indisponible / sur demande";
    media.appendChild(badge);
    el.appendChild(media);

    var body = document.createElement("div");
    body.className = "cat-card-body";

    var h = document.createElement("h3");
    h.textContent = it.nom;
    body.appendChild(h);

    var meta = document.createElement("p");
    meta.className = "cat-card-meta";
    var bits = [];
    if (it.sousfamille) bits.push(it.sousfamille);
    if (ETAT_LABEL[it.etat]) bits.push(ETAT_LABEL[it.etat]);
    if (it.annee) bits.push(it.annee);
    meta.textContent = bits.join(" · ");
    body.appendChild(meta);

    if (it.desc) {
      var d = document.createElement("p");
      d.className = "cat-card-desc";
      d.textContent = it.desc;
      body.appendChild(d);
    }

    var foot = document.createElement("div");
    foot.className = "cat-card-foot";
    var p = document.createElement("span");
    p.className = "cat-card-price";
    p.textContent = it.prix > 0 ? prix(it.prix) + " · à confirmer" : "Prix sur demande";
    foot.appendChild(p);
    var a = document.createElement("a");
    a.className = "btn btn--ghost";
    a.href = "/?instrument=" + encodeURIComponent(it.nom) + "#contact";
    a.textContent = "Réserver un essai";
    foot.appendChild(a);
    body.appendChild(foot);

    el.appendChild(body);
    return el;
  }

  function render() {
    var list = items.filter(matches);
    grid.innerHTML = "";
    list.forEach(function (it) { grid.appendChild(card(it)); });

    var total = items.length;
    if (list.length === total) {
      countEl.textContent = total + (total > 1 ? " instruments" : " instrument");
    } else {
      countEl.textContent = list.length + " sur " + total + (total > 1 ? " instruments" : " instrument");
    }
    emptyEl.hidden = list.length !== 0;
    grid.hidden = list.length === 0;

    syncUrl();
  }

  /* ----- Synchronisation légère avec l'URL (partage / retour arrière) ----- */
  function syncUrl() {
    var p = new URLSearchParams();
    if (f.q.value.trim()) p.set("q", f.q.value.trim());
    if (f.famille.value) p.set("famille", f.famille.value);
    if (f.etat.value) p.set("etat", f.etat.value);
    if (f.budget.value) p.set("budget", f.budget.value);
    if (f.dispo.checked) p.set("dispo", "1");
    var qs = p.toString();
    history.replaceState(null, "", qs ? "?" + qs : location.pathname);
  }

  function readUrl() {
    var p = new URLSearchParams(location.search);
    if (p.has("q")) f.q.value = p.get("q");
    if (p.has("famille")) f.famille.value = p.get("famille");
    if (p.has("etat")) f.etat.value = p.get("etat");
    if (p.has("budget")) f.budget.value = p.get("budget");
    if (p.get("dispo") === "1") f.dispo.checked = true;
  }

  Object.keys(f).forEach(function (k) {
    f[k].addEventListener(f[k].type === "search" ? "input" : "change", render);
  });
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      f.q.value = ""; f.famille.value = ""; f.etat.value = "";
      f.budget.value = ""; f.dispo.checked = false;
      render();
    });
  }

  /* ----- Chargement des données ----- */
  countEl.textContent = "Chargement du catalogue…";

  fetch("/assets/data/catalogue.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (data) {
      items = Array.isArray(data) ? data : (data && data.instruments) || [];
      readUrl();
      render();
    })
    .catch(function () {
      countEl.textContent = "";
      grid.hidden = true;
      emptyEl.hidden = false;
      emptyEl.textContent = "Le catalogue est momentanément indisponible. ";
      var a = document.createElement("a");
      a.href = "/#contact";
      a.textContent = "Contactez-nous pour connaître le stock du moment.";
      emptyEl.appendChild(a);
    });
})();
