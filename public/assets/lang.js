/* Sprachauswahl: Deutsch, Englisch, Spanisch, Französisch, Portugiesisch */
window.PALO = window.PALO || {};
(function(P){
P.LANGS = [
  {id:"de",name:"Deutsch",loc:"de-DE"},
  {id:"en",name:"English",loc:"en-GB"},
  {id:"es",name:"Español",loc:"es-ES"},
  {id:"fr",name:"Français",loc:"fr-FR"},
  {id:"pt",name:"Português",loc:"pt-BR"}
];
P.FLAGS = {
  de:'<svg viewBox="0 0 5 3" aria-hidden="true"><rect width="5" height="3" fill="#000"/><rect y="1" width="5" height="1" fill="#DD0000"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>',
  en:'<svg viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true"><clipPath id="ukS"><path d="M0,0v30h60V0z"/></clipPath><clipPath id="ukT"><path d="M30,15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#ukS)"><path d="M0,0v30h60V0z" fill="#012169"/><path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0L60,30M60,0L0,30" clip-path="url(#ukT)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></g></svg>',
  es:'<svg viewBox="0 0 3 2" preserveAspectRatio="none" aria-hidden="true"><rect width="3" height="2" fill="#AA151B"/><rect y=".5" width="3" height="1" fill="#F1BF00"/></svg>',
  fr:'<svg viewBox="0 0 3 2" preserveAspectRatio="none" aria-hidden="true"><rect width="1" height="2" fill="#002654"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE1126"/></svg>',
  pt:'<svg viewBox="0 0 20 14" preserveAspectRatio="none" aria-hidden="true"><rect width="20" height="14" fill="#009C3B"/><path d="M10 1.6L18.2 7 10 12.4 1.8 7z" fill="#FFDF00"/><circle cx="10" cy="7" r="3.4" fill="#002776"/><path d="M6.7 6.3a7.6 7.6 0 0 1 6.6 1.6" stroke="#fff" stroke-width=".55" fill="none"/></svg>'
};
P.SAY = {de:"Wir behandeln Sie gerne in Ihrer Sprache",en:"We are happy to treat you in your language",es:"Le atendemos con gusto en su idioma",fr:"Nous vous recevons volontiers dans votre langue",pt:"Atendemos você com prazer no seu idioma"};

/* Reihenfolge: Adresse (?lang=), gespeicherte Wahl, Sprache des Geräts, sonst Deutsch */
P.detectLang = function(){
  const ids = P.LANGS.map(x=>x.id);
  try{ const q = new URLSearchParams(location.search).get("lang"); if (q && ids.includes(q)) return q; }catch(e){}
  try{ const s = localStorage.getItem("paloLang"); if (s && ids.includes(s)) return s; }catch(e){}
  const nav = (navigator.languages||[navigator.language||"de"]).map(l=>String(l).slice(0,2).toLowerCase());
  for (const n of nav){ if (ids.includes(n)) return n; }
  return "de";
};
P.saveLang = function(id){ try{ localStorage.setItem("paloLang",id); }catch(e){} };

/* Aufklappmenü, wird in ein Element mit class="lang" gezeichnet */
P.langMenu = function(host, lang, onChange){
  let open = false;
  const draw = () => {
    const cur = P.LANGS.find(x=>x.id===lang);
    const list = P.LANGS.map(x=>`<button type="button" class="lang-item" role="menuitemradio" aria-checked="${x.id===lang}" data-lang="${x.id}" lang="${x.id}">${P.FLAGS[x.id]}<span>${x.name}</span></button>`).join("");
    host.innerHTML = `<button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="${open}" aria-label="Sprache">${P.FLAGS[lang]}<span>${cur.name}</span><span class="chev" aria-hidden="true"></span></button>${open?`<div class="lang-menu" role="menu"><div class="lang-say">${P.SAY[lang]}</div>${list}</div>`:""}`;
    host.querySelector(".lang-btn").onclick = e => { e.stopPropagation(); open = !open; draw(); };
    host.querySelectorAll("[data-lang]").forEach(b => b.onclick = e => { e.stopPropagation(); lang = b.dataset.lang; open = false; P.saveLang(lang); draw(); onChange(lang); });
  };
  document.addEventListener("click", () => { if (open){ open = false; draw(); } });
  draw();
  return { set(id){ lang = id; draw(); } };
};
})(window.PALO);
