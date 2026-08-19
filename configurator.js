(() => {
  const CURRENT_KEY = "ww_s51_config_current_v1";
  const SAVED_KEY = "ww_s51_configs_v1";

  const DEFAULT_CONFIG = {
    base: "street",
    tankColor: "#2f608f",
    sideColor: "#2f608f",
    wheelSize: "16",
    rim: "aluminium",
    tire: "road",
    brake: "drum",
    fork: "series",
    shock: "series",
    handlebar: "street",
    seat: "standard",
    exhaust: "series",
    engine: "silver",
    light: "classic"
  };

  const META = {
    base: {
      title: "Grundmodell",
      groups: [{
        field: "base",
        label: "Ausführung",
        options: [
          ["street", "S51 Straße", "Seriennahe Straßenoptik"],
          ["enduro", "S51 Enduro", "Höhere, robustere Enduro-Anmutung"]
        ]
      }]
    },
    paint: {
      title: "Lackierung",
      groups: [
        {field: "tankColor", label: "Tank", color: true, options: [
          ["#2f608f", "Atlantikblau", "klassischer Blauton"],
          ["#c4a35a", "Saharabraun", "warmer Sand-/Braunton"],
          ["#8f2630", "Rot", "kräftiger Rotton"],
          ["#8ba070", "Hellgrün", "klassischer Grünton"],
          ["#d6d6d2", "Silber", "helle Metalloptik"],
          ["#161616", "Schwarz", "tiefschwarz"]
        ]},
        {field: "sideColor", label: "Seitendeckel", color: true, options: [
          ["#2f608f", "Atlantikblau", "wie Tank"],
          ["#c4a35a", "Saharabraun", "wie Tank"],
          ["#8f2630", "Rot", "wie Tank"],
          ["#8ba070", "Hellgrün", "wie Tank"],
          ["#d6d6d2", "Silber", "helle Metalloptik"],
          ["#161616", "Schwarz", "Kontrastoptik"]
        ]}
      ]
    },
    wheels: {
      title: "Räder",
      groups: [
        {field: "wheelSize", label: "Radgröße", options: [
          ["16", "16 Zoll", "seriennahe Größe"],
          ["17", "17 Zoll", "größere Straßenoptik"],
          ["18", "18 Zoll", "große Radoptik"],
          ["19", "19 Zoll", "maximale Vorschaugröße"]
        ]},
        {field: "rim", label: "Felgen", options: [
          ["aluminium", "Aluminium", "helle Serienoptik"],
          ["black", "Schwarz", "dunkle Kontrastoptik"],
          ["polished", "Poliert", "helle Glanzoptik"]
        ]},
        {field: "tire", label: "Reifen", options: [
          ["road", "Straße", "glattes Straßenprofil"],
          ["classic", "Klassik", "traditionelles Profil"],
          ["enduro", "Enduro", "grobe Profilanmutung"]
        ]}
      ]
    },
    brakes: {
      title: "Bremsanlage",
      groups: [{field: "brake", label: "Vorderradbremse", options: [
        ["drum", "Trommelbremse", "klassische Trommeloptik"],
        ["disc", "Scheibenbremse", "sichtbare Bremsscheibe vorn"]
      ]}]
    },
    suspension: {
      title: "Fahrwerk",
      groups: [
        {field: "fork", label: "Telegabel", options: [
          ["series", "Serie", "klassische Gabel"],
          ["black", "Schwarz", "dunkle Gabelholme"],
          ["enduro", "Enduro", "höhere Frontanmutung"]
        ]},
        {field: "shock", label: "Federbeine", options: [
          ["series", "Serie", "klassische Federbeine"],
          ["chrome", "Chrom", "helle Federoptik"],
          ["long", "Länger", "angehobenes Heck in der Vorschau"]
        ]}
      ]
    },
    cockpit: {
      title: "Lenker & Cockpit",
      groups: [{field: "handlebar", label: "Lenker", options: [
        ["street", "Straßenlenker", "flach und klassisch"],
        ["enduro", "Endurolenker", "höherer Lenker"],
        ["cross", "Crossbar", "Lenker mit Querstrebe"]
      ]}]
    },
    seat: {
      title: "Sitzbank",
      groups: [{field: "seat", label: "Sitzbank", options: [
        ["standard", "Serie", "klassische lange Sitzbank"],
        ["flat", "Flach", "geradlinige Sitzbank"],
        ["sport", "Sport", "verkürzte dynamische Form"]
      ]}]
    },
    exhaust: {
      title: "Auspuff",
      groups: [{field: "exhaust", label: "Auspuff rechts", options: [
        ["series", "Serie", "langer verchromter Auspuff rechts"],
        ["enduro", "Enduro hoch", "hochgezogene rechte Auspufflinie"],
        ["sport", "Sport kurz", "verkürzte rechte Auspuffoptik"]
      ]}]
    },
    engine: {
      title: "Motoroptik",
      groups: [{field: "engine", label: "Motorgehäuse", options: [
        ["silver", "Silber", "seriennahe Aluminiumoptik"],
        ["black", "Schwarz", "dunkles Gehäuse"],
        ["polished", "Poliert", "helle Glanzoptik"]
      ]}]
    },
    lights: {
      title: "Beleuchtung",
      groups: [{field: "light", label: "Scheinwerferoptik", options: [
        ["classic", "Rund Serie", "klassischer Rundscheinwerfer"],
        ["h4", "H4-Optik", "modernisierte Klarglas-Anmutung"],
        ["led", "LED-Optik", "moderne Lichtsignatur in der Vorschau"]
      ]}]
    }
  };

  const CATEGORY_ORDER = ["base", "paint", "wheels", "brakes", "suspension", "cockpit", "seat", "exhaust", "engine", "lights"];
  let cfg = loadCurrent();
  let activeCategory = "base";

  function loadCurrent(){
    try { return {...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CURRENT_KEY) || "{}")}; }
    catch (_) { return {...DEFAULT_CONFIG}; }
  }
  function saveCurrent(){ localStorage.setItem(CURRENT_KEY, JSON.stringify(cfg)); }
  function savedConfigs(){
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); }
    catch (_) { return []; }
  }
  function writeSaved(list){ localStorage.setItem(SAVED_KEY, JSON.stringify(list)); }
  function escapeHtml(s){ return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

  function optionLabel(field, value){
    for(const cat of Object.values(META)) for(const group of cat.groups) if(group.field === field){
      const hit = group.options.find(o => o[0] === value); if(hit) return hit[1];
    }
    return value;
  }

  function renderCategoryNav(){
    const el = document.getElementById("configCategoryNav"); if(!el) return;
    el.innerHTML = CATEGORY_ORDER.map(key => `<button class="configCat ${key===activeCategory?"active":""}" onclick="configSetCategory('${key}')">${META[key].title}</button>`).join("");
  }

  function renderOptions(){
    const el = document.getElementById("configOptions"); if(!el) return;
    const cat = META[activeCategory];
    el.innerHTML = `<div class="configPanelHead"><span class="eyebrow">BAUGRUPPE</span><h2>${cat.title}</h2></div>` + cat.groups.map(group => {
      const opts = group.options.map(o => {
        const selected = cfg[group.field] === o[0];
        const swatch = group.color ? `<span class="configSwatch" style="background:${o[0]}"></span>` : "";
        return `<button class="configOption ${selected?"active":""}" onclick='configSelect(${JSON.stringify(group.field)},${JSON.stringify(o[0])})'>${swatch}<span><b>${o[1]}</b><small>${o[2]}</small></span><i>${selected?"✓":""}</i></button>`;
      }).join("");
      return `<div class="configGroup"><h3>${group.label}</h3>${opts}</div>`;
    }).join("");
  }

  function previewSvg(){
    const wheelR = {"16":88,"17":94,"18":100,"19":106}[cfg.wheelSize] || 88;
    const rimColor = cfg.rim === "black" ? "#202020" : cfg.rim === "polished" ? "#f5f5f1" : "#bfc2c2";
    const rimStroke = cfg.rim === "black" ? "#555" : "#777";
    const engineColor = cfg.engine === "black" ? "#242424" : cfg.engine === "polished" ? "#eeeeea" : "#aeb2b3";
    const forkColor = cfg.fork === "black" ? "#1e1e1e" : "#b9b9b5";
    const rearLift = cfg.shock === "long" ? -18 : 0;
    const frontLift = cfg.fork === "enduro" ? -18 : 0;
    const baseEnduro = cfg.base === "enduro";
    const seatPath = cfg.seat === "sport" ? "M382 189 Q465 169 535 184 L520 210 Q450 211 385 211 Z" : cfg.seat === "flat" ? "M365 184 L550 184 L548 211 L370 211 Z" : "M362 182 Q460 167 557 188 L548 214 L370 210 Z";
    const handlebar = cfg.handlebar === "enduro" ? "M665 170 L690 121 L730 121 M690 121 L660 107" : cfg.handlebar === "cross" ? "M665 170 L687 135 L727 135 M673 125 L716 125" : "M665 170 L691 144 L728 149";
    const tireDash = cfg.tire === "enduro" ? "10 5" : cfg.tire === "classic" ? "4 5" : "0";
    const headFill = cfg.light === "led" ? "#d9ff39" : cfg.light === "h4" ? "#e9f4ff" : "#f6e6b5";
    const exhaust = cfg.exhaust === "enduro"
      ? `<path d="M455 336 C535 326 590 294 625 250 C658 211 704 220 750 242" class="exhaustPipe"/><path d="M742 230 L818 252" class="muffler"/>`
      : cfg.exhaust === "sport"
      ? `<path d="M455 336 C540 341 610 355 680 357" class="exhaustPipe"/><path d="M664 348 L750 357" class="muffler"/>`
      : `<path d="M455 336 C548 344 640 357 741 365" class="exhaustPipe"/><path d="M720 353 L833 369" class="muffler"/>`;
    const frontFenderY = baseEnduro ? 264 + frontLift : 314 + frontLift;
    const rearY = 380 + rearLift, frontY = 380 + frontLift;

    return `<svg class="configBikeSvg" viewBox="0 0 900 520" role="img" aria-label="Interaktive S51 Vorschau">
      <defs>
        <filter id="bikeShadow"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-opacity=".18"/></filter>
      </defs>
      <rect width="900" height="520" fill="#e8e5dd"/>
      <ellipse cx="470" cy="476" rx="350" ry="18" fill="#000" opacity=".10"/>
      <g filter="url(#bikeShadow)">
        <g class="wheel rear" transform="translate(205 ${rearY})">
          <circle r="${wheelR}" fill="#202020" stroke="#111" stroke-width="7" stroke-dasharray="${tireDash}"/>
          <circle r="${wheelR-18}" fill="none" stroke="${rimColor}" stroke-width="10"/>
          <circle r="20" fill="#999" stroke="#111" stroke-width="5"/>
          ${[0,30,60,90,120,150].map(a=>`<line x1="0" y1="0" x2="${Math.cos(a*Math.PI/180)*(wheelR-23)}" y2="${Math.sin(a*Math.PI/180)*(wheelR-23)}" stroke="${rimStroke}" stroke-width="2"/>`).join("")}
        </g>
        <g class="wheel front" transform="translate(705 ${frontY})">
          <circle r="${wheelR}" fill="#202020" stroke="#111" stroke-width="7" stroke-dasharray="${tireDash}"/>
          <circle r="${wheelR-18}" fill="none" stroke="${rimColor}" stroke-width="10"/>
          ${cfg.brake === "disc" ? `<circle r="46" fill="none" stroke="#b9b9b9" stroke-width="8"/><circle r="10" fill="#888"/><rect x="32" y="-18" width="17" height="36" rx="4" fill="#222"/>` : `<circle r="24" fill="#9b9b98" stroke="#111" stroke-width="5"/>`}
          ${[0,30,60,90,120,150].map(a=>`<line x1="0" y1="0" x2="${Math.cos(a*Math.PI/180)*(wheelR-23)}" y2="${Math.sin(a*Math.PI/180)*(wheelR-23)}" stroke="${rimStroke}" stroke-width="2"/>`).join("")}
        </g>
        <g class="frame" fill="none" stroke="#171717" stroke-width="17" stroke-linecap="round" stroke-linejoin="round">
          <path d="M205 ${rearY} L352 245 L520 363 L205 ${rearY} M352 245 L573 250 L520 363"/>
          <path d="M573 250 L650 185 L705 ${frontY}"/>
          <path d="M352 245 L324 199"/>
        </g>
        <path d="M636 194 L703 ${frontY}" stroke="${forkColor}" stroke-width="14" stroke-linecap="round"/>
        <path d="M650 196 L716 ${frontY}" stroke="${forkColor}" stroke-width="7" stroke-linecap="round"/>
        <path d="M215 ${rearY-5} L365 205" stroke="${cfg.shock === "chrome" ? "#efefef" : "#7d7d79"}" stroke-width="12"/>
        <path d="M215 ${rearY-5} L365 205" stroke="#111" stroke-width="2" stroke-dasharray="8 8"/>
        <path d="M342 207 C390 173 483 165 558 199 L539 253 L371 254 Z" fill="${cfg.tankColor}" stroke="#111" stroke-width="6"/>
        <path d="M408 258 L505 258 L529 317 L398 318 Z" fill="${cfg.sideColor}" stroke="#111" stroke-width="6"/>
        <path d="${seatPath}" fill="#1d1d1d" stroke="#111" stroke-width="5"/>
        <g class="engine">
          <rect x="420" y="315" width="105" height="83" rx="16" fill="${engineColor}" stroke="#111" stroke-width="6"/>
          <circle cx="470" cy="354" r="29" fill="none" stroke="#666" stroke-width="6"/>
          <path d="M430 318 L443 287 L509 287 L520 319" fill="${engineColor}" stroke="#111" stroke-width="6"/>
          <path d="M440 297 H512 M437 306 H516" stroke="#777" stroke-width="3"/>
        </g>
        <path d="M309 201 L356 201" stroke="#111" stroke-width="14" stroke-linecap="round"/>
        <path d="${handlebar}" stroke="#111" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        ${cfg.handlebar === "cross" ? `<line x1="673" y1="125" x2="716" y2="125" stroke="#888" stroke-width="5"/>` : ""}
        <circle cx="650" cy="181" r="34" fill="#222" stroke="#111" stroke-width="5"/>
        <circle cx="650" cy="181" r="22" fill="${headFill}" stroke="#aaa" stroke-width="4"/>
        <path d="M643 ${frontFenderY} Q704 ${frontFenderY-32} 762 ${frontFenderY}" fill="none" stroke="${cfg.tankColor}" stroke-width="13" stroke-linecap="round"/>
        <path d="M150 ${rearY-36} Q206 ${rearY-74} 274 ${rearY-44}" fill="none" stroke="#1c1c1c" stroke-width="11" stroke-linecap="round"/>
        ${exhaust}
        <path d="M364 256 L320 340 L207 ${rearY}" fill="none" stroke="#333" stroke-width="8"/>
        <rect x="357" y="229" width="50" height="9" rx="4" fill="#d9ff39" opacity=".9"/>
        ${baseEnduro ? `<path d="M548 221 L585 190" stroke="#111" stroke-width="7"/><rect x="575" y="177" width="28" height="12" rx="5" fill="#111"/>` : ""}
      </g>
      <text x="36" y="45" font-family="Arial" font-size="16" font-weight="700" letter-spacing="2">WERKERS S51 KONFIGURATOR</text>
      <text x="36" y="72" font-family="Arial" font-size="13" fill="#67645d">${escapeHtml(optionLabel("base",cfg.base))} · ${cfg.wheelSize} Zoll · ${escapeHtml(optionLabel("brake",cfg.brake))}</text>
      <text x="36" y="493" font-family="Arial" font-size="11" fill="#716e67">Interaktive Phase-1-Vorschau · 3D-Mesh folgt im nächsten Ausbau</text>
    </svg>`;
  }

  function renderPreview(){ const el=document.getElementById("configPreview"); if(el) el.innerHTML=previewSvg(); }

  function renderSummary(){
    const el = document.getElementById("configSummary"); if(!el) return;
    const rows = [
      ["Grundmodell", optionLabel("base",cfg.base)],
      ["Tank", optionLabel("tankColor",cfg.tankColor)],
      ["Seitendeckel", optionLabel("sideColor",cfg.sideColor)],
      ["Räder", `${cfg.wheelSize} Zoll · ${optionLabel("rim",cfg.rim)} · ${optionLabel("tire",cfg.tire)}`],
      ["Bremse", optionLabel("brake",cfg.brake)],
      ["Fahrwerk", `${optionLabel("fork",cfg.fork)} · ${optionLabel("shock",cfg.shock)}`],
      ["Lenker", optionLabel("handlebar",cfg.handlebar)],
      ["Sitzbank", optionLabel("seat",cfg.seat)],
      ["Auspuff", optionLabel("exhaust",cfg.exhaust)],
      ["Motor", optionLabel("engine",cfg.engine)],
      ["Licht", optionLabel("light",cfg.light)]
    ];
    el.innerHTML = `<div class="configSummaryGrid">${rows.map(r=>`<div><small>${r[0]}</small><b>${r[1]}</b></div>`).join("")}</div><div class="configLegal">Die Vorschau ist eine gestalterische Konfiguration. Zulässigkeit, Eintragungspflicht und technische Kompatibilität von Umbauten müssen am realen Fahrzeug separat geprüft werden.</div>`;
  }

  function renderSaved(){
    const el=document.getElementById("configSaved"); if(!el) return;
    const list=savedConfigs();
    el.innerHTML = list.length ? list.map(x=>`<article class="savedConfig"><div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(optionLabel("base",x.config.base))} · ${escapeHtml(x.config.wheelSize)} Zoll · ${escapeHtml(optionLabel("exhaust",x.config.exhaust))}</small></div><div><button onclick="configLoad('${x.id}')">Laden</button><button onclick="configDelete('${x.id}')">×</button></div></article>`).join("") : `<div class="note">Noch keine Konfiguration gespeichert.</div>`;
  }

  function renderAll(){ renderCategoryNav(); renderOptions(); renderPreview(); renderSummary(); renderSaved(); }

  window.configSetCategory = function(key){ if(!META[key]) return; activeCategory=key; renderCategoryNav(); renderOptions(); };
  window.configSelect = function(field,value){ cfg[field]=value; saveCurrent(); renderOptions(); renderPreview(); renderSummary(); };
  window.configReset = function(){ cfg={...DEFAULT_CONFIG}; saveCurrent(); activeCategory="base"; renderAll(); };
  window.configMatchPaint = function(){ cfg.sideColor=cfg.tankColor; saveCurrent(); renderAll(); };
  window.configSave = function(){
    const input=document.getElementById("configName");
    const fallback=`S51 ${optionLabel("base",cfg.base)} ${new Date().toLocaleDateString("de-DE")}`;
    const name=(input?.value||"").trim()||fallback;
    const list=savedConfigs();
    list.unshift({id:String(Date.now()),name,created:new Date().toISOString(),config:{...cfg}});
    writeSaved(list.slice(0,20)); if(input) input.value=""; renderSaved();
  };
  window.configLoad = function(id){ const hit=savedConfigs().find(x=>x.id===id); if(!hit) return; cfg={...DEFAULT_CONFIG,...hit.config}; saveCurrent(); renderAll(); };
  window.configDelete = function(id){ writeSaved(savedConfigs().filter(x=>x.id!==id)); renderSaved(); };
  window.configAddToGarage = function(){
    if(typeof bikes!=="function") return alert("Garage ist noch nicht bereit.");
    const list=bikes();
    const model=cfg.base==="enduro"?"Simson S51 Enduro":"Simson S51";
    const summary=`Konfiguration: ${cfg.wheelSize} Zoll, ${optionLabel("rim",cfg.rim)}, ${optionLabel("brake",cfg.brake)}, ${optionLabel("handlebar",cfg.handlebar)}, ${optionLabel("seat",cfg.seat)}, ${optionLabel("exhaust",cfg.exhaust)}, Motor ${optionLabel("engine",cfg.engine)}, Licht ${optionLabel("light",cfg.light)}.`;
    list.push({id:Date.now(),name:`Meine ${model}`,model,year:"",km:"",fin:"",color:`${optionLabel("tankColor",cfg.tankColor)} / ${optionLabel("sideColor",cfg.sideColor)}`,price:"",purchaseDate:"",state:"Konfiguriert",notes:summary,marketValue:"",maintenance:[],todos:[],repairs:[],photos:[],documents:[],restoration:{budget:"",tasks:[]},services:[],costs:[],configuration:{...cfg}});
    localStorage.setItem("wwv31",JSON.stringify(list));
    if(typeof renderGarage==="function") renderGarage(); if(typeof refreshBikeSelectors==="function") refreshBikeSelectors();
    const status=document.getElementById("configGarageStatus"); if(status){status.textContent="Konfiguration wurde als Fahrzeug in die Garage übernommen.";status.classList.remove("hidden");}
  };

  function init(){ if(!document.getElementById("configurator")) return; renderAll(); }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
