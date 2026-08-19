(() => {
  const CURRENT_KEY = "ww_s51_config_current_v1";
  const SAVED_KEY = "ww_s51_configs_v1";

  const DEFAULT_CONFIG = {
    base: "street",
    tankColor: "#2f608f",
    sideColor: "#2f608f",
    frontFender: "chrome",
    rearFender: "series",
    wheelSize: "16",
    wheelType: "spokes",
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
      groups: [{field: "base", label: "Ausführung", options: [
        ["street","S51 Straße","seriennahe Straßenproportionen"],
        ["enduro","S51 Enduro","höhere Front, Enduro-Details und robuste Optik"]
      ]}]
    },
    paint: {
      title: "Lackierung",
      groups: [
        {field: "tankColor", label: "Tank", color: true, options: [
          ["#2f608f","Atlantikblau","klassischer Blauton"],
          ["#c4a35a","Saharabraun","warmer Sand-/Braunton"],
          ["#8f2630","Rot","kräftiger Rotton"],
          ["#8ba070","Hellgrün","klassischer Grünton"],
          ["#d6d6d2","Silber","helle Metalloptik"],
          ["#161616","Schwarz","tiefschwarz"]
        ]},
        {field: "sideColor", label: "Seitendeckel", color: true, options: [
          ["#2f608f","Atlantikblau","klassischer Blauton"],
          ["#c4a35a","Saharabraun","warmer Sand-/Braunton"],
          ["#8f2630","Rot","kräftiger Rotton"],
          ["#8ba070","Hellgrün","klassischer Grünton"],
          ["#d6d6d2","Silber","helle Metalloptik"],
          ["#161616","Schwarz","Kontrastoptik"]
        ]}
      ]
    },
    body: {
      title: "Karosserie",
      groups: [
        {field: "frontFender", label: "Vorderes Schutzblech", options: [
          ["chrome","Metall / Chrom","seriennahe helle Schutzblechoptik"],
          ["black","Schwarz Kunststoff","typische Enduro-Anmutung"],
          ["paint","Lackiert","Farbe passend zum Tank"]
        ]},
        {field: "rearFender", label: "Hinteres Schutzblech", options: [
          ["series","Serie","lange klassische Hecklinie"],
          ["short","Kurz","kompaktere Heckoptik"]
        ]}
      ]
    },
    wheels: {
      title: "Räder",
      groups: [
        {field: "wheelSize", label: "Radgröße", options: [
          ["16","16 Zoll","seriennahe Größe"],
          ["17","17 Zoll","größere Straßenoptik"],
          ["18","18 Zoll","große Radoptik"],
          ["19","19 Zoll","maximale Vorschaugröße"]
        ]},
        {field: "wheelType", label: "Raddesign", options: [
          ["spokes","Speichenrad","klassische Simson-Optik"],
          ["star5","5-Speichen-Gussrad","sportliche moderne Optik"],
          ["star10","10-Speichen-Gussrad","feingliedrige Tuning-Optik"]
        ]},
        {field: "rim", label: "Felgenfinish", options: [
          ["aluminium","Aluminium","helle Serienoptik"],
          ["black","Schwarz","dunkle Kontrastoptik"],
          ["polished","Poliert","helle Glanzoptik"]
        ]},
        {field: "tire", label: "Reifen", options: [
          ["road","Straße","glattes Straßenprofil"],
          ["classic","Klassik","traditionelles Profil"],
          ["enduro","Enduro","grobe Profilanmutung"]
        ]}
      ]
    },
    brakes: {
      title: "Bremsanlage",
      groups: [{field: "brake", label: "Vorderradbremse", options: [
        ["drum","Trommelbremse","klassische Trommeloptik"],
        ["disc","Scheibenbremse","sichtbare Bremsscheibe mit Bremssattel"]
      ]}]
    },
    suspension: {
      title: "Fahrwerk",
      groups: [
        {field: "fork", label: "Telegabel", options: [
          ["series","Serie","klassische Gabel"],
          ["black","Schwarz","dunkle Gabelholme"],
          ["enduro","Enduro","höhere Frontanmutung"]
        ]},
        {field: "shock", label: "Federbeine", options: [
          ["series","Serie","klassische Federbeine"],
          ["chrome","Chrom","helle Federoptik"],
          ["long","Länger","angehobenes Heck"]
        ]}
      ]
    },
    cockpit: {
      title: "Lenker & Cockpit",
      groups: [{field: "handlebar", label: "Lenker", options: [
        ["street","Straßenlenker","flach und klassisch"],
        ["enduro","Endurolenker","höherer Lenker"],
        ["cross","Crossbar","Lenker mit Querstrebe"]
      ]}]
    },
    seat: {
      title: "Sitzbank",
      groups: [{field: "seat", label: "Sitzbank", options: [
        ["standard","Serie","klassische lange Sitzbank"],
        ["flat","Flach","geradlinige Sitzbank"],
        ["sport","Sport","verkürzte dynamische Form"]
      ]}]
    },
    exhaust: {
      title: "Auspuff",
      groups: [{field: "exhaust", label: "Auspuff rechts", options: [
        ["series","Serie","langer verchromter Auspuff rechts"],
        ["enduro","Enduro hoch","hochgezogene rechte Auspufflinie"],
        ["sport","Sport kurz","verkürzte rechte Auspuffoptik"]
      ]}]
    },
    engine: {
      title: "Motoroptik",
      groups: [{field: "engine", label: "Motorgehäuse", options: [
        ["silver","Silber","seriennahe Aluminiumoptik"],
        ["black","Schwarz","dunkles Gehäuse"],
        ["polished","Poliert","helle Glanzoptik"]
      ]}]
    },
    lights: {
      title: "Beleuchtung",
      groups: [{field: "light", label: "Scheinwerferoptik", options: [
        ["classic","Rund Serie","klassischer Rundscheinwerfer"],
        ["h4","H4-Optik","modernisierte Klarglas-Anmutung"],
        ["led","LED-Optik","moderne Lichtsignatur"]
      ]}]
    }
  };

  const CATEGORY_ORDER = ["base","paint","body","wheels","brakes","suspension","cockpit","seat","exhaust","engine","lights"];
  let cfg = loadCurrent();
  let activeCategory = "base";
  let previewMode = "side";
  let previewZoom = 1;

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
  function optionLabel(field,value){
    for(const cat of Object.values(META)) for(const group of cat.groups) if(group.field === field){
      const hit = group.options.find(o => o[0] === value);
      if(hit) return hit[1];
    }
    return value;
  }

  function renderCategoryNav(){
    const el = document.getElementById("configCategoryNav");
    if(!el) return;
    el.innerHTML = CATEGORY_ORDER.map(key =>
      `<button class="configCat ${key===activeCategory?"active":""}" onclick="configSetCategory('${key}')">${META[key].title}</button>`
    ).join("");
  }

  function renderOptions(){
    const el = document.getElementById("configOptions");
    if(!el) return;
    const cat = META[activeCategory];
    el.innerHTML =
      `<div class="configPanelHead"><span class="eyebrow">BAUGRUPPE</span><h2>${cat.title}</h2></div>` +
      cat.groups.map(group => {
        const opts = group.options.map(o => {
          const selected = cfg[group.field] === o[0];
          const swatch = group.color ? `<span class="configSwatch" style="background:${o[0]}"></span>` : "";
          return `<button class="configOption ${selected?"active":""}" onclick='configSelect(${JSON.stringify(group.field)},${JSON.stringify(o[0])})'>
            ${swatch}<span><b>${o[1]}</b><small>${o[2]}</small></span><i>${selected?"✓":""}</i>
          </button>`;
        }).join("");
        return `<div class="configGroup"><h3>${group.label}</h3>${opts}</div>`;
      }).join("");
  }

  function spokes(r,count,color,width=1.8){
    let out = "";
    for(let i=0;i<count;i++){
      const a = i * Math.PI * 2 / count;
      const x = Math.cos(a) * (r - 19);
      const y = Math.sin(a) * (r - 19);
      out += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="${width}"/>`;
    }
    return out;
  }

  function castWheel(r,type,color){
    const n = type === "star5" ? 5 : 10;
    let out = "";
    for(let i=0;i<n;i++){
      const a = i * Math.PI * 2 / n;
      const a2 = a + (type === "star5" ? 0.17 : 0.08);
      const x1 = Math.cos(a) * 17, y1 = Math.sin(a) * 17;
      const x2 = Math.cos(a2) * (r-24), y2 = Math.sin(a2) * (r-24);
      out += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${type==="star5"?10:6}" stroke-linecap="round"/>`;
    }
    return out;
  }

  function wheelSvg(cx,cy,r,front=false){
    const rimColor = cfg.rim === "black" ? "#202020" : cfg.rim === "polished" ? "#f7f7f4" : "#c7cbcc";
    const spokeColor = cfg.rim === "black" ? "#414141" : "#a8adae";
    const tireDash = cfg.tire === "enduro" ? "9 4" : cfg.tire === "classic" ? "3 5" : "0";
    const viewScaleX = previewMode === "three" ? .92 : 1;
    const depth = previewMode === "three" ? `<ellipse rx="${r}" ry="${r}" cx="8" cy="-4" fill="none" stroke="#070707" stroke-width="4" opacity=".28"/>` : "";
    const inner = cfg.wheelType === "spokes"
      ? spokes(r,18,spokeColor,1.7)
      : castWheel(r,cfg.wheelType,rimColor);
    const brake = front
      ? cfg.brake === "disc"
        ? `<circle r="43" fill="url(#discMetal)" stroke="#777" stroke-width="3"/><circle r="31" fill="none" stroke="#777" stroke-width="2" stroke-dasharray="3 4"/><rect x="29" y="-19" width="18" height="38" rx="4" fill="#202020"/><circle r="8" fill="#74787a"/>`
        : `<circle r="24" fill="url(#hubMetal)" stroke="#666" stroke-width="4"/>`
      : `<circle r="23" fill="url(#hubMetal)" stroke="#666" stroke-width="4"/>`;

    return `<g transform="translate(${cx} ${cy}) scale(${viewScaleX} 1)">
      ${depth}
      <circle r="${r}" fill="#1c1d1e" stroke="#090909" stroke-width="8" stroke-dasharray="${tireDash}"/>
      <circle r="${r-12}" fill="none" stroke="#333" stroke-width="3"/>
      <circle r="${r-19}" fill="none" stroke="${rimColor}" stroke-width="${cfg.wheelType==="spokes"?7:9}"/>
      ${inner}
      ${brake}
      <circle r="6" fill="#2e3030"/>
    </g>`;
  }

  function previewSvg(){
    const wheelR = {"16":86,"17":92,"18":98,"19":104}[cfg.wheelSize] || 86;
    const rearLift = cfg.shock === "long" ? -15 : 0;
    const frontLift = cfg.fork === "enduro" ? -16 : 0;
    const isEnduro = cfg.base === "enduro";
    const rearY = 392 + rearLift;
    const frontY = 392 + frontLift;
    const rearX = 188;
    const frontX = 710;
    const frameColor = "#171819";
    const engineColor = cfg.engine === "black" ? "#222425" : cfg.engine === "polished" ? "#f0f1ee" : "#b8bcbc";
    const forkOuter = cfg.fork === "black" ? "#1d1f20" : "#bfc2c2";
    const shockColor = cfg.shock === "chrome" ? "#e7e9e7" : "#8e9190";
    const fenderColor = cfg.frontFender === "black" ? "#1b1c1d" : cfg.frontFender === "paint" ? cfg.tankColor : "url(#chrome)";
    const rearFenderColor = cfg.rearFender === "short" ? "#2a2a29" : "url(#chrome)";
    const headFill = cfg.light === "led" ? "#d9ff39" : cfg.light === "h4" ? "#eaf5ff" : "#f3e6bd";
    const bodyTransform = previewMode === "three" ? `translate(22 0) skewX(-2)` : "";
    const detailScale = previewMode === "detail" ? 1.08 : 1;

    const seat = cfg.seat === "sport"
      ? `<path d="M345 190 Q421 173 503 184 L515 198 Q466 215 370 211 L340 203 Z" fill="url(#seatGrad)" stroke="#0b0b0b" stroke-width="4"/>`
      : cfg.seat === "flat"
      ? `<path d="M331 188 L538 188 L533 213 L344 213 Z" fill="url(#seatGrad)" stroke="#0b0b0b" stroke-width="4"/>`
      : `<path d="M326 186 Q426 166 548 187 L545 211 Q445 219 338 211 Z" fill="url(#seatGrad)" stroke="#0b0b0b" stroke-width="4"/>`;

    const handlebar = cfg.handlebar === "enduro"
      ? `<path d="M621 206 L648 147 L696 137 M648 147 L621 128" class="bar"/><line x1="651" y1="146" x2="689" y2="139" class="grip"/>`
      : cfg.handlebar === "cross"
      ? `<path d="M621 206 L646 164 L699 158" class="bar"/><line x1="640" y1="150" x2="691" y2="146" stroke="#8b8b89" stroke-width="5"/><line x1="652" y1="162" x2="691" y2="157" class="grip"/>`
      : `<path d="M621 206 L649 178 L698 183" class="bar"/><line x1="660" y1="180" x2="697" y2="183" class="grip"/>`;

    const exhaust = cfg.exhaust === "enduro"
      ? `<path d="M468 324 C545 314 583 285 613 245 C642 208 685 211 735 236" class="exhaustPipe"/><path d="M724 224 L817 246" class="muffler"/><path d="M738 229 L808 246" stroke="#5f6262" stroke-width="3"/>`
      : cfg.exhaust === "sport"
      ? `<path d="M470 329 C552 333 616 347 686 351" class="exhaustPipe"/><path d="M667 342 L756 352" class="muffler"/><path d="M681 344 L747 352" stroke="#5f6262" stroke-width="3"/>`
      : `<path d="M470 330 C560 340 649 355 744 363" class="exhaustPipe"/><path d="M716 351 L835 368" class="muffler"/><path d="M733 355 L823 367" stroke="#5f6262" stroke-width="3"/>`;

    const frontFenderY = frontY - wheelR + (isEnduro ? 25 : 13);
    const rearFenderY = rearY - wheelR + 20;
    const rearFenderPath = cfg.rearFender === "short"
      ? `M128 ${rearFenderY+26} Q185 ${rearFenderY-10} 239 ${rearFenderY+10}`
      : `M114 ${rearFenderY+34} Q187 ${rearFenderY-20} 265 ${rearFenderY+18}`;

    const zoomW = 900 / previewZoom;
    const zoomH = 540 / previewZoom;
    const viewX = (900 - zoomW) / 2;
    const viewY = (540 - zoomH) / 2;

    return `<svg class="configBikeSvg" viewBox="${viewX.toFixed(1)} ${viewY.toFixed(1)} ${zoomW.toFixed(1)} ${zoomH.toFixed(1)}" role="img" aria-label="Realistischere interaktive S51 Vorschau">
      <defs>
        <linearGradient id="studioBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f1e9"/><stop offset="1" stop-color="#d8d4ca"/></linearGradient>
        <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e9394"/><stop offset=".25" stop-color="#f7f7f5"/><stop offset=".55" stop-color="#b8bdbd"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#8b8f90"/></linearGradient>
        <linearGradient id="hubMetal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e6e7e4"/><stop offset=".5" stop-color="#9da1a1"/><stop offset="1" stop-color="#d2d5d4"/></linearGradient>
        <radialGradient id="discMetal"><stop offset="0" stop-color="#777"/><stop offset=".55" stop-color="#ddd"/><stop offset="1" stop-color="#999"/></radialGradient>
        <linearGradient id="seatGrad" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#333"/><stop offset="1" stop-color="#101010"/></linearGradient>
        <linearGradient id="engineGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${engineColor}"/><stop offset=".55" stop-color="${cfg.engine==="black"?"#131414":"#e4e6e3"}"/><stop offset="1" stop-color="${engineColor}"/></linearGradient>
        <filter id="bikeShadow"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-opacity=".24"/></filter>
        <pattern id="studioGrid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="#b7b3aa" stroke-width=".6" opacity=".34"/></pattern>
      </defs>
      <rect width="900" height="540" fill="url(#studioBg)"/>
      <rect width="900" height="540" fill="url(#studioGrid)"/>
      <path d="M0 455 H900" stroke="#a9a59c" stroke-width="1"/>
      <ellipse cx="455" cy="471" rx="365" ry="21" fill="#000" opacity=".12"/>

      <g transform="${bodyTransform} scale(${detailScale})" transform-origin="450 330" filter="url(#bikeShadow)">
        ${wheelSvg(rearX,rearY,wheelR,false)}
        ${wheelSvg(frontX,frontY,wheelR,true)}

        <path d="M${rearX} ${rearY} L417 348" stroke="#252627" stroke-width="15" stroke-linecap="round"/>
        <path d="M${rearX} ${rearY} L421 358" stroke="#5e6060" stroke-width="4"/>

        <g fill="none" stroke="${frameColor}" stroke-linecap="round" stroke-linejoin="round">
          <path d="M${rearX} ${rearY} L350 249 L421 348 L${rearX} ${rearY}" stroke-width="17"/>
          <path d="M350 249 L572 256 L421 348" stroke-width="17"/>
          <path d="M572 256 L620 211" stroke-width="17"/>
          <path d="M350 249 L322 203" stroke-width="14"/>
          ${isEnduro ? `<path d="M390 257 L534 257" stroke-width="7"/><path d="M533 257 L564 224" stroke-width="7"/>` : ""}
        </g>

        <path d="M614 215 L700 ${frontY}" stroke="${forkOuter}" stroke-width="14" stroke-linecap="round"/>
        <path d="M630 214 L716 ${frontY}" stroke="${cfg.fork==="black"?"#333":"#6f7373"}" stroke-width="7" stroke-linecap="round"/>
        <rect x="607" y="207" width="35" height="14" rx="5" fill="#1d1e1e"/>

        <g>
          <path d="M220 ${rearY-6} L357 211" stroke="${shockColor}" stroke-width="11" stroke-linecap="round"/>
          <path d="M220 ${rearY-6} L357 211" stroke="#2d2e2e" stroke-width="2" stroke-dasharray="7 7"/>
          <circle cx="224" cy="${rearY-7}" r="9" fill="#777" stroke="#222" stroke-width="3"/>
        </g>

        <path d="${rearFenderPath}" fill="none" stroke="${rearFenderColor}" stroke-width="${cfg.rearFender==="short"?10:13}" stroke-linecap="round"/>
        <path d="M650 ${frontFenderY+18} Q706 ${frontFenderY-12} 765 ${frontFenderY+17}" fill="none" stroke="${fenderColor}" stroke-width="14" stroke-linecap="round"/>

        <path d="M338 225 C374 190 466 181 555 208 C567 213 571 225 565 237 L540 267 L365 265 L334 248 Z" fill="${cfg.tankColor}" stroke="#161616" stroke-width="5"/>
        <path d="M355 229 C394 203 470 198 539 214" fill="none" stroke="#fff" stroke-width="4" opacity=".18"/>
        <path d="M352 252 L543 252" stroke="#101010" stroke-width="2" opacity=".5"/>
        <text x="397" y="244" font-family="Arial" font-size="17" font-weight="700" fill="#f4f2ea" opacity=".86">simson</text>

        <path d="M375 271 L490 270 L516 323 L388 326 L365 302 Z" fill="${cfg.sideColor}" stroke="#161616" stroke-width="5"/>
        <path d="M385 280 L478 279" stroke="#fff" stroke-width="3" opacity=".18"/>
        <circle cx="493" cy="296" r="5" fill="#111"/>

        ${seat}
        <path d="M320 205 L352 205" stroke="#161616" stroke-width="13" stroke-linecap="round"/>
        <rect x="303" y="196" width="20" height="18" rx="3" fill="#2b2b2b"/>

        <g>
          <path d="M420 325 C435 308 486 306 514 320 L523 368 C510 391 439 393 417 366 Z" fill="url(#engineGrad)" stroke="#151515" stroke-width="5"/>
          <circle cx="469" cy="355" r="31" fill="none" stroke="${cfg.engine==="black"?"#555":"#85898a"}" stroke-width="6"/>
          <circle cx="469" cy="355" r="9" fill="#777"/>
          <path d="M431 321 L441 287 L498 287 L511 321" fill="url(#engineGrad)" stroke="#151515" stroke-width="5"/>
          ${[292,299,306,313].map(y=>`<line x1="438" y1="${y}" x2="506" y2="${y}" stroke="${cfg.engine==="black"?"#616464":"#777b7c"}" stroke-width="3"/>`).join("")}
          <path d="M511 351 Q545 351 552 380" fill="none" stroke="#4a4c4c" stroke-width="6" stroke-linecap="round"/>
          <path d="M450 389 Q430 403 416 392" fill="none" stroke="#424343" stroke-width="5" stroke-linecap="round"/>
        </g>

        <path d="M397 333 L330 352 L204 ${rearY}" fill="none" stroke="#292a2a" stroke-width="8" stroke-linecap="round"/>
        <path d="M331 351 L210 ${rearY}" stroke="#777" stroke-width="3"/>
        <rect x="292" y="344" width="96" height="11" rx="5" fill="#202121"/>
        <path d="M438 387 L397 408" stroke="#303131" stroke-width="7" stroke-linecap="round"/>
        <path d="M499 390 L533 408" stroke="#303131" stroke-width="7" stroke-linecap="round"/>

        ${handlebar}
        <circle cx="621" cy="204" r="35" fill="#1c1d1d" stroke="#101010" stroke-width="5"/>
        <circle cx="621" cy="204" r="24" fill="${headFill}" stroke="#b5b7b6" stroke-width="4"/>
        ${cfg.light==="led" ? `<path d="M607 204 H635" stroke="#202020" stroke-width="4"/><path d="M621 190 V218" stroke="#202020" stroke-width="3"/>` : ""}
        <circle cx="592" cy="192" r="13" fill="#111"/><circle cx="592" cy="192" r="7" fill="#d9ff39" opacity=".35"/>

        ${exhaust}
        <path d="M460 330 C452 332 448 339 450 349" fill="none" stroke="#646868" stroke-width="9"/>

        <rect x="255" y="${rearY-wheelR-5}" width="22" height="16" rx="3" fill="#a51e22" stroke="#111" stroke-width="3"/>
        <path d="M270 ${rearY-wheelR+11} L299 ${rearY-wheelR+22}" stroke="#222" stroke-width="5"/>

        ${isEnduro ? `<path d="M543 238 L584 206" stroke="#171819" stroke-width="7"/><rect x="574" y="194" width="33" height="13" rx="6" fill="#171819"/>` : ""}
      </g>

      <g class="configHotspots">
        <button style="display:none"></button>
        <g onclick="configSetCategory('paint')" class="hotspot"><circle cx="448" cy="219" r="15"/><text x="448" y="224">1</text></g>
        <g onclick="configSetCategory('wheels')" class="hotspot"><circle cx="710" cy="${frontY}" r="15"/><text x="710" y="${frontY+5}">2</text></g>
        <g onclick="configSetCategory('engine')" class="hotspot"><circle cx="468" cy="350" r="15"/><text x="468" y="355">3</text></g>
        <g onclick="configSetCategory('exhaust')" class="hotspot"><circle cx="744" cy="356" r="15"/><text x="744" y="361">4</text></g>
      </g>

      <text x="34" y="38" font-family="Arial" font-size="15" font-weight="700" letter-spacing="2">WERKERS S51 STUDIO · PHASE 2</text>
      <text x="34" y="63" font-family="Arial" font-size="12" fill="#65635e">${escapeHtml(optionLabel("base",cfg.base))} · ${cfg.wheelSize} Zoll · ${escapeHtml(optionLabel("wheelType",cfg.wheelType))}</text>
      <text x="34" y="514" font-family="Arial" font-size="11" fill="#6e6b65">Realistischere 2D/3D-Hybridansicht · Hotspots 1–4 öffnen direkt die Baugruppe</text>
    </svg>`;
  }

  function renderPreview(){
    const el = document.getElementById("configPreview");
    if(!el) return;
    el.innerHTML = `
      <div class="configViewToolbar">
        <div>
          <button class="${previewMode==="side"?"active":""}" onclick="configSetView('side')">Seite</button>
          <button class="${previewMode==="three"?"active":""}" onclick="configSetView('three')">3/4</button>
          <button class="${previewMode==="detail"?"active":""}" onclick="configSetView('detail')">Detail</button>
        </div>
        <div>
          <button onclick="configZoom(-.1)">−</button>
          <span>${Math.round(previewZoom*100)}%</span>
          <button onclick="configZoom(.1)">+</button>
        </div>
      </div>
      ${previewSvg()}
      <div class="configHotspotLegend"><span><b>1</b> Lack</span><span><b>2</b> Räder</span><span><b>3</b> Motor</span><span><b>4</b> Auspuff</span></div>`;
  }

  function renderSummary(){
    const el = document.getElementById("configSummary");
    if(!el) return;
    const rows = [
      ["Grundmodell",optionLabel("base",cfg.base)],
      ["Tank",optionLabel("tankColor",cfg.tankColor)],
      ["Seitendeckel",optionLabel("sideColor",cfg.sideColor)],
      ["Schutzblech",`${optionLabel("frontFender",cfg.frontFender)} · ${optionLabel("rearFender",cfg.rearFender)}`],
      ["Räder",`${cfg.wheelSize} Zoll · ${optionLabel("wheelType",cfg.wheelType)} · ${optionLabel("rim",cfg.rim)}`],
      ["Reifen",optionLabel("tire",cfg.tire)],
      ["Bremse",optionLabel("brake",cfg.brake)],
      ["Fahrwerk",`${optionLabel("fork",cfg.fork)} · ${optionLabel("shock",cfg.shock)}`],
      ["Lenker",optionLabel("handlebar",cfg.handlebar)],
      ["Sitzbank",optionLabel("seat",cfg.seat)],
      ["Auspuff",optionLabel("exhaust",cfg.exhaust)],
      ["Motor",optionLabel("engine",cfg.engine)],
      ["Licht",optionLabel("light",cfg.light)]
    ];
    el.innerHTML = `<div class="configSummaryGrid">${rows.map(r=>`<div><small>${r[0]}</small><b>${r[1]}</b></div>`).join("")}</div>
      <div class="configLegal">Die Vorschau ist eine gestalterische Konfiguration. Zulässigkeit, Eintragungspflicht und technische Kompatibilität von Umbauten müssen am realen Fahrzeug separat geprüft werden.</div>`;
  }

  function renderSaved(){
    const el = document.getElementById("configSaved");
    if(!el) return;
    const list = savedConfigs();
    el.innerHTML = list.length
      ? list.map(x=>`<article class="savedConfig"><div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(optionLabel("base",x.config.base))} · ${escapeHtml(x.config.wheelSize)} Zoll · ${escapeHtml(optionLabel("exhaust",x.config.exhaust))}</small></div><div><button onclick="configLoad('${x.id}')">Laden</button><button onclick="configDelete('${x.id}')">×</button></div></article>`).join("")
      : `<div class="note">Noch keine Konfiguration gespeichert.</div>`;
  }

  function renderAll(){ renderCategoryNav(); renderOptions(); renderPreview(); renderSummary(); renderSaved(); }

  window.configSetCategory = function(key){
    if(!META[key]) return;
    activeCategory = key;
    renderCategoryNav();
    renderOptions();
    const panel = document.querySelector(".configPanel");
    if(panel && window.innerWidth < 760) panel.scrollIntoView({behavior:"smooth",block:"start"});
  };
  window.configSelect = function(field,value){
    cfg[field] = value;
    saveCurrent();
    renderOptions();
    renderPreview();
    renderSummary();
  };
  window.configSetView = function(mode){
    if(!["side","three","detail"].includes(mode)) return;
    previewMode = mode;
    previewZoom = mode === "detail" ? 1.2 : 1;
    renderPreview();
  };
  window.configZoom = function(delta){
    previewZoom = Math.max(.8,Math.min(1.45,Math.round((previewZoom+delta)*10)/10));
    renderPreview();
  };
  window.configReset = function(){
    cfg = {...DEFAULT_CONFIG};
    saveCurrent();
    activeCategory = "base";
    previewMode = "side";
    previewZoom = 1;
    renderAll();
  };
  window.configMatchPaint = function(){ cfg.sideColor = cfg.tankColor; saveCurrent(); renderAll(); };
  window.configSave = function(){
    const input = document.getElementById("configName");
    const fallback = `S51 ${optionLabel("base",cfg.base)} ${new Date().toLocaleDateString("de-DE")}`;
    const name = (input?.value || "").trim() || fallback;
    const list = savedConfigs();
    list.unshift({id:String(Date.now()),name,created:new Date().toISOString(),config:{...cfg}});
    writeSaved(list.slice(0,20));
    if(input) input.value = "";
    renderSaved();
  };
  window.configLoad = function(id){
    const hit = savedConfigs().find(x=>x.id===id);
    if(!hit) return;
    cfg = {...DEFAULT_CONFIG,...hit.config};
    saveCurrent();
    renderAll();
  };
  window.configDelete = function(id){ writeSaved(savedConfigs().filter(x=>x.id!==id)); renderSaved(); };
  window.configAddToGarage = function(){
    if(typeof bikes !== "function") return alert("Garage ist noch nicht bereit.");
    const list = bikes();
    const model = cfg.base === "enduro" ? "Simson S51 Enduro" : "Simson S51";
    const summary = `Konfiguration: ${cfg.wheelSize} Zoll, ${optionLabel("wheelType",cfg.wheelType)}, ${optionLabel("rim",cfg.rim)}, ${optionLabel("brake",cfg.brake)}, ${optionLabel("handlebar",cfg.handlebar)}, ${optionLabel("seat",cfg.seat)}, ${optionLabel("exhaust",cfg.exhaust)}, Motor ${optionLabel("engine",cfg.engine)}, Licht ${optionLabel("light",cfg.light)}.`;
    list.push({
      id:Date.now(), name:`Meine ${model}`, model, year:"", km:"", fin:"",
      color:`${optionLabel("tankColor",cfg.tankColor)} / ${optionLabel("sideColor",cfg.sideColor)}`,
      price:"", purchaseDate:"", state:"Konfiguriert", notes:summary, marketValue:"",
      maintenance:[], todos:[], repairs:[], photos:[], documents:[],
      restoration:{budget:"",tasks:[]}, services:[], costs:[], configuration:{...cfg}
    });
    localStorage.setItem("wwv31",JSON.stringify(list));
    if(typeof renderGarage === "function") renderGarage();
    if(typeof refreshBikeSelectors === "function") refreshBikeSelectors();
    const status = document.getElementById("configGarageStatus");
    if(status){ status.textContent = "Konfiguration wurde als Fahrzeug in die Garage übernommen."; status.classList.remove("hidden"); }
  };

  function init(){
    const section = document.getElementById("configurator");
    if(!section) return;
    const eyebrow = section.querySelector(".pageHead .eyebrow");
    const intro = section.querySelector(".configIntro p");
    const badge = section.querySelector(".configBadge");
    if(eyebrow) eyebrow.textContent = "S51 KONFIGURATOR · PHASE 2";
    if(intro) intro.textContent = "Realistischere S51-Proportionen, austauschbare Räder, Schutzbleche, Bremsen, Fahrwerk und Detailansichten. Die echte GLB-3D-Schicht folgt als nächster Ausbau.";
    if(badge) badge.textContent = "LIVE · DETAILANSICHT";
    renderAll();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init); else init();
})();