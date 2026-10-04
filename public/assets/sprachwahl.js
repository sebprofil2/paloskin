/*
 * Sprachauswahl und Zonen-Link der Startseite (früher lang.js). Der Server rendert den geschlossenen Schalter
 * und liefert die Daten im Element #sprachwahl-daten (lib/startseite.ts). Aufklappliste mit den Sprachnamen in der
 * jeweiligen Sprache, ohne Flaggen, gleiches Markup wie components/Sprachwahl.tsx. Die Wahl wird im Cookie und wie
 * bisher im localStorage gespeichert; danach liefert der Server die Seite in der neuen Sprache.
 */
(function(){
  var host = document.getElementById("lang"), el = document.getElementById("sprachwahl-daten");
  if (!host || !el) return;
  var D = JSON.parse(el.textContent), lang = document.documentElement.lang, open = false;
  var byId = {}; D.langs.forEach(function(x){ byId[x.id] = x; });
  function esc(s){ var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function save(id){
    document.cookie = D.cookie + "=" + id + ";path=/;max-age=" + D.maxAge + ";samesite=lax";
    try { localStorage.setItem(D.storage, id); } catch (e) {}
  }
  function draw(){
    var cur = byId[lang];
    var list = D.langs.map(function(x){ return '<button type="button" class="lang-item" role="menuitemradio" aria-checked="' + (x.id === lang) + '" data-lang="' + x.id + '" lang="' + x.id + '">' + esc(x.name) + '</button>'; }).join("");
    host.innerHTML = '<button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="' + open + '" aria-label="' + esc(D.label) + '"><span lang="' + cur.id + '">' + esc(cur.name) + '</span><span class="chev" aria-hidden="true"></span></button>' + (open ? '<div class="lang-menu" role="menu">' + list + '</div>' : "");
    bind();
  }
  function bind(){
    host.querySelector(".lang-btn").onclick = function(e){ e.stopPropagation(); open = !open; draw(); };
    host.querySelectorAll("[data-lang]").forEach(function(b){
      b.onclick = function(e){
        e.stopPropagation();
        var id = b.getAttribute("data-lang");
        open = false; save(id);
        if (id === lang) { draw(); return; }
        var u = new URL(location.href); u.searchParams.delete("lang");
        if (u.toString() === location.href) location.reload(); else location.replace(u.toString());
      };
    });
  }
  document.addEventListener("click", function(){ if (open) { open = false; draw(); } });
  document.addEventListener("keydown", function(e){ if (open && e.key === "Escape") { open = false; draw(); host.querySelector(".lang-btn").focus(); } });
  bind();
  var z = document.getElementById("zoneLink");
  if (z) z.addEventListener("click", function(){ var d = document.querySelector("#fragen details"); if (d) d.open = true; });
})();
