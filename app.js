let DB={};let filter="Alle",currentBike=null;
async function boot(){DB=await fetch("data.json").then(r=>r.json());fill()}
function fill(){
 renderModels();renderS51();renderGuides();renderSymptoms();renderRare();renderHomeRare();renderGarage();renderTechArchive();
 let types=[...new Set(DB.models.map(x=>x.type))];
 document.getElementById("modelType").innerHTML='<option value="">Alle Bauarten</option>'+types.map(x=>`<option>${x}</option>`).join("");
 document.getElementById("gModel").innerHTML=DB.models.map(x=>`<option value="${x.name}">${x.name}</option>`).join("");
 document.getElementById("finModel").innerHTML=DB.models.map(x=>`<option value="${x.id}">${x.name}</option>`).join("");
 document.getElementById("gState").innerHTML=(DB.restoration_states||[]).map(x=>`<option>${x}</option>`).join("");
 document.getElementById("origVariant").innerHTML=DB.s51.map((x,i)=>`<option value="${i}">${x.name}</option>`).join("");
 document.getElementById("cmpA").innerHTML=DB.s51.map((x,i)=>`<option value="${i}">${x.name}</option>`).join("");
 document.getElementById("cmpB").innerHTML=DB.s51.map((x,i)=>`<option value="${i}" ${i===3?"selected":""}>${x.name}</option>`).join("");
 document.getElementById("specModel").innerHTML=Object.entries(DB.vehicle_specs||{}).map(([id,x])=>`<option value="${id}">${x.label}</option>`).join("");
 document.getElementById("partSystem").innerHTML='<option value="">Alle Systeme</option>'+[...new Set((DB.parts_reference||[]).map(x=>x.system))].map(x=>`<option>${x}</option>`).join("");
 renderVehicleSpec();renderParts();renderMaintenance();renderWiring();
 document.getElementById("s51SpecPick").innerHTML=(DB.s51_detail_specs||[]).map((x,i)=>`<option value="${i}">${x.name}</option>`).join("");
 document.getElementById("wirePick").innerHTML=Object.entries(DB.wiring_interactive||{}).map(([id,x])=>`<option value="${id}">${x.title}</option>`).join("");
 renderS51Detail();renderCarbRef();renderTorqueFluids();renderInteractiveWire();
 document.getElementById("assemblyPick").innerHTML=(DB.assemblies||[]).map((x,i)=>`<option value="${i}">${x.title}</option>`).join("");
 document.getElementById("diagVehicle").innerHTML=Object.entries(DB.vehicle_diagnosis_profiles||{}).map(([id,x])=>`<option value="${id}">${x.name}</option>`).join("");
 renderAssembly();renderVehicleDiagnosis();
 document.getElementById("shopSystem").innerHTML='<option value="">Alle Systeme</option>'+(DB.shopping_categories||[]).map(x=>`<option>${x}</option>`).join("");
 renderShoppingCatalog();renderShoppingList();startGuidedDiagnosis();
 refreshBikeSelectors();
 document.getElementById("techCat").innerHTML='<option value="">Alle Themen</option>'+[...new Set((DB.tech_library||[]).map(x=>x.cat))].map(x=>`<option>${x}</option>`).join("");
 document.getElementById("finRules").innerHTML=(DB.fin_help?.rules||[]).map((x,i)=>`<div class="fact"><b>${String(i+1).padStart(2,"0")}</b><span>${x}</span></div>`).join("");
 loadOrig();renderCompare()
}
function nav(id){document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll("nav button").forEach(x=>x.classList.toggle("active",x.dataset.v===id));closeSearch();scrollTo({top:0,behavior:"smooth"});if(id==="garage")renderGarage();refreshBikeSelectors()}
function renderHomeRare(){document.getElementById("homeRare").innerHTML=DB.rare.slice(0,3).map((x,i)=>`<button class="guide" onclick="nav('rare')"><b>${String(i+1).padStart(2,"0")} · ${x.name}</b><span>${x.score}/5 →</span></button>`).join("")}
function renderModels(){
 if(!DB.models)return;
 let q=(document.getElementById("modelSearch")?.value||"").toLowerCase(),t=document.getElementById("modelType")?.value||"";
 document.getElementById("modelList").innerHTML=DB.models.filter(x=>(!t||x.type===t)&&(x.name+" "+x.desc).toLowerCase().includes(q)).map(x=>`<button class="model" onclick="openModel('${x.id}')"><img class="modelThumb" src="${x.image}" alt="${x.name} Modellkarte"><div><h3>${x.name}</h3><p>${x.years} · ${x.desc}</p></div><span>→</span></button>`).join("")
}
function openModel(id){
 let x=DB.models.find(m=>m.id===id);
 let facts=(x.facts||[]).map((f,i)=>`<div class="fact"><b>${String(i+1).padStart(2,"0")}</b><span>${f}</span></div>`).join("");
 document.getElementById("modelDetailBody").innerHTML=`<div class="modelGalleryHero"><img src="${x.image}" alt="${x.name}"></div><article class="detail"><span class="eyebrow">${x.years}</span><h1>${x.name}</h1><p>${x.desc}</p></article><div class="specs"><div><small>Bauart</small><b>${x.type}</b></div><div><small>Motor</small><b>${x.engine}</b></div><div><small>Hubraum</small><b>${x.ccm}</b></div><div><small>Getriebe</small><b>${x.gear}</b></div><div><small>Kühlung</small><b>${x.cooling}</b></div><div><small>Geschwindigkeit</small><b>${x.speed}</b></div></div><div class="factList">${facts}</div>${id==="s51"?'<button class="wide" onclick="nav(\'s51\')">S51 Studio öffnen →</button>':""}<a class="web" target="_blank" rel="noopener" href="${x.url}">Werkers-Werkstatt-Detailseite ↗</a>`;
 nav("modelDetail")
}
function renderS51(){document.getElementById("variantCards").innerHTML=DB.s51.map(x=>`<article class="variant"><span class="badge">${x.rarity}</span><h3>${x.name}</h3><dl><div><dt>Getriebe</dt><dd>${x.gear}</dd></div><div><dt>Zündung</dt><dd>${x.ignition}</dd></div><div><dt>Licht</dt><dd>${x.headlight}</dd></div></dl><p>${x.features}</p><small>Farben: ${x.colors.join(", ")}</small></article>`).join("");document.getElementById("colorCards").innerHTML=DB.colors.map(x=>`<div class="color"><span class="swatch" style="background:${x.hex}"></span><div><b>${x.name}</b><br><small>${x.note}</small></div></div>`).join("")}
function tab(e,id){document.querySelectorAll(".tabs>button").forEach(x=>x.classList.remove("active"));e.currentTarget.classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active")}
function renderCompare(){if(!DB.s51)return;let a=DB.s51[+document.getElementById("cmpA").value||0],b=DB.s51[+document.getElementById("cmpB").value||0],rows=[["Modell",a.name,b.name],["Getriebe",a.gear,b.gear],["Zündung",a.ignition,b.ignition],["Licht",a.headlight,b.headlight],["Farben",a.colors.join(", "),b.colors.join(", ")],["Ausstattung",a.features,b.features]];document.getElementById("compareBody").innerHTML='<div class="compareTable">'+rows.flatMap(r=>r.map(c=>`<div>${c}</div>`)).join("")+"</div>"}
function renderGuides(){let tags=["Alle",...new Set(DB.guides.map(x=>x.tag))];document.getElementById("guideFilters").innerHTML=tags.map(x=>`<button class="chip ${x===filter?"active":""}" onclick="setFilter('${x}')">${x}</button>`).join("");document.getElementById("guideList").innerHTML=DB.guides.filter(x=>filter==="Alle"||x.tag===filter).map(x=>{let i=DB.guides.indexOf(x);return `<button class="guide" onclick="openGuide(${i})"><small>${x.tag} · ${x.models}</small><b>${x.title}</b><span>öffnen →</span></button>`}).join("")}
function setFilter(x){filter=x;renderGuides()}
function openGuide(i){let g=DB.guides[i];document.getElementById("guideDetailBody").innerHTML=`<article class="article"><span class="eyebrow">${g.tag} · ${g.models}</span><h1>${g.title}</h1><h3>Werkzeug</h3><div class="tools">${g.tools.map(x=>`<span>${x}</span>`).join("")}</div><h3>Vorgehen</h3>${g.steps.map((x,n)=>`<div class="step"><b>${String(n+1).padStart(2,"0")}</b><span>${x}</span></div>`).join("")}<div class="warning">${g.warning}</div></article>`;nav("guideDetail")}
function renderSymptoms(){document.getElementById("symptomGrid").innerHTML=Object.entries(DB.diagnostics).map(([k,v])=>`<button class="symptom" onclick='diagnose(${JSON.stringify(k)})'>${k}<small>${v.system}</small></button>`).join("")}
function diagnose(k){let d=DB.diagnostics[k],key="diag_"+k,done=JSON.parse(localStorage.getItem(key)||"[]");document.getElementById("diagBody").innerHTML=`<div class="diag"><span class="badge">${d.severity} · ${d.system}</span><h2>${k}</h2>${d.checks.map((x,i)=>`<label class="check"><input type="checkbox" ${done.includes(i)?"checked":""} onchange="saveDiag('${key}')"><span>${x}</span></label>`).join("")}<div class="warning">Sicherheitsrelevante Fehler vor der Weiterfahrt beheben.</div></div>`;document.getElementById("diagBody").scrollIntoView({behavior:"smooth"})}
function saveDiag(k){let a=[...document.querySelectorAll("#diagBody input")].map((x,i)=>x.checked?i:null).filter(x=>x!==null);localStorage.setItem(k,JSON.stringify(a))}
function identify(){let t=v("idType"),g=v("idGear"),c=v("idCooling");let a=DB.models.map(m=>{let s=0;if(t==="Straßenmoped"&&m.type.includes("Straßen"))s+=3;if(t==="Kleinroller"&&m.type.includes("Kleinroller"))s+=3;if(t==="Vogelserie"&&m.type.includes("Vogel"))s+=3;if(t==="Dreirad"&&m.type.includes("Dreirad"))s+=5;if(g!=="Unbekannt"&&m.gear.includes(g[0]))s+=2;if(c!=="Unbekannt"&&m.cooling===c)s+=2;return{m,s}}).filter(x=>x.s).sort((a,b)=>b.s-a.s).slice(0,4);document.getElementById("identifyResult").innerHTML=`<div class="result"><b>Mögliche Treffer</b>${a.map(x=>`<p><b>${x.m.name}</b> · Score ${x.s}</p>`).join("")}<small>FIN, Baujahr, Motortyp und Originalteile zusätzlich prüfen.</small></div>`}
function loadOrig(){
 if(!DB.s51)return;
 let x=DB.s51[+document.getElementById("origVariant").value||0];
 document.getElementById("origReference").innerHTML=`<div class="variantReference"><b>${x.name}</b><br><small>Getriebe: ${x.gear} · Zündung: ${x.ignition} · Licht: ${x.headlight}<br>${x.features}<br>Typische Farben: ${x.colors.join(", ")}</small></div>`;
 document.getElementById("origChecklist").innerHTML=(DB.originality_components||[]).map(c=>`<div class="orig31"><div class="orig31Head"><b>${c.name}</b><span>Gewicht ${c.weight}%</span></div><p>${c.hint}</p><div class="tri"><label><input type="radio" name="oc_${c.id}" value="1"><span>✓ passt</span></label><label><input type="radio" name="oc_${c.id}" value="0.5"><span>? unklar</span></label><label><input type="radio" name="oc_${c.id}" value="0"><span>× abweichend</span></label></div></div>`).join("");
 document.getElementById("origResult").innerHTML=""
}
function evalOrig31(){
 let total=0,earned=0,answered=0,details=[];
 (DB.originality_components||[]).forEach(c=>{total+=c.weight;let e=document.querySelector(`input[name="oc_${c.id}"]:checked`);if(e){answered++;let val=+e.value;earned+=c.weight*val;if(val<1)details.push(c.name+(val===0?" abweichend":" unklar"))}});
 if(!answered){document.getElementById("origResult").innerHTML='<div class="result">Bitte mindestens eine Baugruppe bewerten.</div>';return}
 let score=Math.round(earned/total*100),coverage=Math.round(answered/(DB.originality_components||[]).length*100);
 let text=score>=85?"Sehr hohe Übereinstimmung der bewerteten Baugruppen.":score>=65?"Gute Basis, aber Abweichungen und unklare Punkte gezielt prüfen.":score>=45?"Gemischtes Bild – Fahrzeughistorie und Baugruppen genauer dokumentieren.":"Deutliche Abweichungen von der hinterlegten Variantenreferenz.";
 document.getElementById("origResult").innerHTML=`<div class="result"><div class="origScore">${score}%</div><div class="scoreBar"><i style="width:${score}%"></i></div><b>${text}</b><br><small>Bewertungsabdeckung: ${coverage}%. ${details.length?"Offen/abweichend: "+details.join(", ")+".":""} Keine Echtheitsbestätigung.</small></div>`
}
function resetOrig31(){loadOrig()}
function renderRare(){document.getElementById("rareList").innerHTML=DB.rare.map((x,i)=>`<article class="rare"><div class="num">${String(i+1).padStart(2,"0")}</div><div><span class="score">${x.score}/5</span><h3>${x.name}</h3><p>${x.why}</p></div></article>`).join("")}
function bikes(){try{return JSON.parse(localStorage.getItem("wwv31")||"[]")}catch(e){return[]}}
function toggleBikeForm(){document.getElementById("bikeForm").classList.toggle("hidden")}
function saveBike(){
 let b={id:Date.now(),name:v("gName"),model:v("gModel"),year:v("gYear"),km:v("gKm"),fin:v("gFin"),color:v("gColor"),price:v("gPrice"),purchaseDate:v("gPurchaseDate"),state:v("gState"),notes:v("gNotes"),marketValue:"",maintenance:[],todos:[],repairs:[],photos:[],documents:[],restoration:{budget:"",tasks:[]},services:[],costs:[]};
 if(!b.name)return alert("Name fehlt");
 let a=bikes();a.push(b);localStorage.setItem("wwv31",JSON.stringify(a));
 ["gName","gYear","gKm","gFin","gColor","gPrice","gPurchaseDate","gNotes"].forEach(id=>{let e=document.getElementById(id);if(e)e.value=""});
 toggleBikeForm();renderGarage();refreshBikeSelectors()
}
function renderGarage(){
 if(!DB.models)return;let a=bikes();
 document.getElementById("garageList").innerHTML=a.length?a.map(x=>`<article class="bike"><div><h3>${x.name}</h3><small>${x.model}${x.year?" · Bj. "+x.year:""}${x.km?" · "+x.km+" km":""}</small>${x.state?`<br><span class="restorationBadge">${x.state}</span>`:""}</div><div><button class="btn" onclick="openBike(${x.id})">Öffnen</button><button class="btn" onclick="deleteBike(${x.id})">×</button></div></article>`).join(""):'<div class="note">Noch kein Fahrzeug gespeichert.</div>'
}
function deleteBike(id){if(confirm("Löschen?")){localStorage.setItem("wwv31",JSON.stringify(bikes().filter(x=>x.id!==id)));renderGarage()}}
function openBike(id){
 currentBike=id;let b=bikes().find(x=>x.id===id);if(!b)return;b.repairs=b.repairs||[];b.photos=b.photos||[];b.documents=b.documents||[];b.restoration=b.restoration||{budget:"",tasks:[]};b.services=b.services||[];
 let own=`<div class="ownership"><div><small>Kaufdatum</small><b>${b.purchaseDate||"—"}</b></div><div><small>Kaufpreis</small><b>${b.price?b.price+" €":"—"}</b></div><div><small>Zustand</small><b>${b.state||"—"}</b></div><div><small>Farbe</small><b>${b.color||"—"}</b></div></div>`;
 let todos=(b.todos||[]).map((t,i)=>`<div class="todoRow"><input type="checkbox" ${t.done?"checked":""} onchange="toggleTodo(${i})"><span>${t.text}</span><button onclick="removeTodo(${i})">×</button></div>`).join("")||'<div class="note">Noch keine offenen Arbeiten.</div>';
 let repairs=b.repairs.slice().reverse().map(r=>`<div class="repairCard"><span class="badge">${r.category}</span><b>${r.title}</b><small>${r.date||""}${r.km?" · "+r.km+" km":""}</small>${r.parts?`<p><b>Teile:</b> ${r.parts}</p>`:""}${r.cost?`<p><b>Kosten:</b> ${r.cost} €</p>`:""}${r.note?`<p>${r.note}</p>`:""}</div>`).join("")||'<div class="note">Noch keine Reparaturhistorie.</div>';
 let photos=b.photos.map((p,i)=>`<figure class="photoCard"><img src="${p.data}" alt="${p.caption||"Fahrzeugfoto"}"><figcaption>${p.caption||"Foto"}<button onclick="removePhoto(${i})">×</button></figcaption></figure>`).join("")||'<div class="note">Noch keine Fotos gespeichert.</div>';
 document.getElementById("bikeDetailBody").innerHTML=`<article class="detail"><span class="eyebrow">${b.model}</span><h1>${b.name}</h1><p>${b.year?"Bj. "+b.year:""} ${b.km?" · "+b.km+" km":""}<br>${b.fin?"FIN: "+b.fin:""}</p></article>${own}${b.notes?`<div class="note">${b.notes}</div>`:""}
 <h2>Foto-Dokumentation</h2><div class="form"><label>Foto<input id="photoInput" type="file" accept="image/*"></label><label>Bildunterschrift<input id="photoCaption" placeholder="z. B. Zustand beim Kauf"></label><button class="btn black" onclick="addPhoto()">Foto speichern</button></div><div class="photoGrid">${photos}</div>
 <h2>Offene Arbeiten</h2><div class="form"><label>Neue Aufgabe<input id="todoText" placeholder="z. B. Wellendichtringe prüfen"></label><button class="btn black" onclick="addTodo()">Hinzufügen</button></div>${todos}
 <h2>Reparaturhistorie</h2><div class="form"><label>Titel<input id="rTitle" placeholder="z. B. Kupplung erneuert"></label><div class="two"><label>Kategorie<select id="rCategory">${(DB.repair_categories||[]).map(x=>`<option>${x}</option>`).join("")}</select></label><label>Datum<input id="rDate" type="date"></label></div><div class="two"><label>km<input id="rKm"></label><label>Kosten €<input id="rCost"></label></div><label>Verwendete Teile<input id="rParts"></label><label>Notiz<textarea id="rNote"></textarea></label><button class="btn black" onclick="addRepair()">Reparatur speichern</button></div>${repairs}
 <h2>Wartungsbuch</h2><div class="form"><label>Arbeit<input id="mw"></label><div class="two"><label>Datum<input id="md" type="date"></label><label>km<input id="mk"></label></div><label>Notiz<input id="mn"></label><button class="btn black" onclick="addMaint()">Speichern</button></div>${(b.maintenance||[]).slice().reverse().map(m=>`<div class="guide"><b>${m.work}</b><small>${m.date||""} ${m.km?"· "+m.km+" km":""}</small><span>${m.note||""}</span></div>`).join("")}`;
 nav("bikeDetail")
}
function addMaint(){let a=bikes(),b=a.find(x=>x.id===currentBike);b.maintenance.push({work:v("mw"),date:v("md"),km:v("mk"),note:v("mn")});localStorage.setItem("wwv31",JSON.stringify(a));openBike(currentBike)}
function exportGarage(){let blob=new Blob([JSON.stringify(bikes(),null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="simson-garage.json";a.click()}







function refreshBikeSelectors(){
 let a=bikes(),opts=a.map(x=>`<option value="${x.id}">${x.name} · ${x.model}</option>`).join("");
 ["dashBike","timelineBike","costBike","restBike","docBike","serviceBike"].forEach(id=>{let e=document.getElementById(id);if(e)e.innerHTML=opts||'<option value="">Kein Fahrzeug</option>'});
 renderDashboard();renderTimeline();renderCosts();renderRestoration();renderDocuments();renderService()
}
function bikeBySelect(id){let val=+document.getElementById(id)?.value||0;return bikes().find(x=>x.id===val)}
function num(x){let n=parseFloat(String(x||"").replace(",","."));return isFinite(n)?n:0}
function money(x){return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(num(x))}

function ensureBike38(b){
 if(!b)return b;
 b.repairs=b.repairs||[];b.maintenance=b.maintenance||[];b.todos=b.todos||[];
 b.photos=b.photos||[];b.documents=b.documents||[];b.services=b.services||[];
 b.costs=b.costs||[];b.restoration=b.restoration||{budget:"",tasks:[]};
 if(b.marketValue===undefined)b.marketValue="";
 return b
}
function renderDashboard(){
 if(!document.getElementById("dashboardBody"))return;
 let b=ensureBike38(bikeBySelect("dashBike"));
 if(!b){document.getElementById("dashboardBody").innerHTML='<div class="note">Noch kein Fahrzeug vorhanden.</div>';return}
 let purchase=num(b.price);
 let repairs=(b.repairs||[]).reduce((s,r)=>s+num(r.cost),0);
 let extras=(b.costs||[]).reduce((s,c)=>s+num(c.amount),0);
 let invested=purchase+repairs+extras;
 let tasks=b.restoration?.tasks||[], done=tasks.filter(x=>x.done).length, progress=tasks.length?Math.round(done/tasks.length*100):0;
 let open=(b.todos||[]).filter(x=>!x.done).length;
 let services=(b.services||[]).filter(x=>!x.done&&x.due).sort((a,b)=>String(a.due).localeCompare(String(b.due)));
 let next=services[0]?.due||"—";
 let docs=b.documents||[], important=["KBA-Papiere","Betriebserlaubnis","Kaufvertrag"];
 let present=important.filter(t=>docs.some(d=>d.type===t)).length;
 let docPct=Math.round(present/important.length*100);
 let mv=num(b.marketValue), delta=mv-invested;
 document.getElementById("dashboardBody").innerHTML=`
 <div class="dashCards">
   <article><small>Marktwert</small><b>${mv?money(mv):"nicht gesetzt"}</b><button onclick="editMarketValue()">Wert ändern</button></article>
   <article><small>Gesamtinvestition</small><b>${money(invested)}</b><span>${delta>=0?"+":""}${money(delta)} ggü. Marktwert</span></article>
   <article><small>Restauration</small><b>${progress}%</b><span>${done}/${tasks.length} Phasen</span></article>
   <article><small>Offene Arbeiten</small><b>${open}</b><span>To-dos</span></article>
   <article><small>Nächster Service</small><b>${next}</b><span>${services.length} offen</span></article>
   <article><small>Dokumentstatus</small><b>${docPct}%</b><span>${present}/${important.length} Kerndokumente</span></article>
 </div>
 <div class="dashboardSplit">
   <div><h2>Projektstatus</h2><div class="scoreBar"><i style="width:${progress}%"></i></div><p>${b.state||"Zustand nicht gesetzt"} · ${b.year?"Bj. "+b.year:"Baujahr offen"} · ${b.km?b.km+" km":"km-Stand offen"}</p></div>
   <div><h2>Finanzübersicht</h2><div class="miniStats"><span>Kauf ${money(purchase)}</span><span>Reparaturen ${money(repairs)}</span><span>Sonstiges ${money(extras)}</span></div></div>
 </div>
 <div class="quickLinks"><button onclick="nav('timeline')">Zeitstrahl →</button><button onclick="nav('restoration')">Restauration →</button><button onclick="nav('service')">Service →</button><button onclick="nav('documents')">Dokumente →</button></div>`
}
function editMarketValue(){
 let b=bikeBySelect("dashBike");if(!b)return;
 let val=prompt("Aktuellen geschätzten Marktwert in € eingeben:",b.marketValue||"");
 if(val===null)return;
 let a=bikes(),x=a.find(y=>y.id===b.id);x.marketValue=String(val).replace(",",".");
 localStorage.setItem("wwv31",JSON.stringify(a));renderDashboard()
}
function timelineEvents(b){
 b=ensureBike38(b);let e=[];
 if(b.purchaseDate||b.price)e.push({type:"purchase",date:b.purchaseDate||"0000-00-00",title:"Fahrzeug gekauft",text:`${b.price?money(b.price):""}${b.state?" · "+b.state:""}`});
 (b.repairs||[]).forEach(x=>e.push({type:"repair",date:x.date||"0000-00-00",title:x.title,text:`${x.category}${x.cost?" · "+money(x.cost):""}${x.parts?" · Teile: "+x.parts:""}`}));
 (b.maintenance||[]).forEach(x=>e.push({type:"maintenance",date:x.date||"0000-00-00",title:x.work,text:`${x.km?x.km+" km":""}${x.note?" · "+x.note:""}`}));
 (b.documents||[]).forEach(x=>e.push({type:"document",date:"0000-00-00",title:x.type,text:x.name+(x.note?" · "+x.note:"")}));
 (b.photos||[]).forEach(x=>e.push({type:"photo",date:"0000-00-00",title:"Foto hinzugefügt",text:x.caption||"Fahrzeugfoto"}));
 (b.services||[]).forEach(x=>e.push({type:"service",date:x.due||"0000-00-00",title:x.name,text:x.done?"erledigt":"offen"}));
 (b.restoration?.tasks||[]).forEach(x=>{if(x.done)e.push({type:"restoration",date:"0000-00-00",title:"Restaurationsphase abgeschlossen",text:x.text})});
 return e.sort((a,b)=>String(b.date).localeCompare(String(a.date)))
}
function renderTimeline(){
 if(!document.getElementById("timelineBody"))return;
 let b=ensureBike38(bikeBySelect("timelineBike"));if(!b){document.getElementById("timelineBody").innerHTML='<div class="note">Noch kein Fahrzeug vorhanden.</div>';return}
 let f=v("timelineFilter"),events=timelineEvents(b).filter(x=>!f||x.type===f);
 document.getElementById("timelineBody").innerHTML=events.length?`<div class="timeline">${events.map(x=>`<article class="timelineItem"><div class="dot"></div><div><span class="badge">${DB.timeline_types?.[x.type]||x.type}</span><small>${x.date==="0000-00-00"?"Datum nicht erfasst":x.date}</small><h3>${x.title}</h3><p>${x.text||""}</p></div></article>`).join("")}</div>`:'<div class="note">Keine Ereignisse für diesen Filter.</div>'
}

function renderCosts(){
 if(!document.getElementById("costBody"))return;let b=bikeBySelect("costBike");if(!b){document.getElementById("costBody").innerHTML='<div class="note">Noch kein Fahrzeug vorhanden.</div>';return}
 let repair=(b.repairs||[]).reduce((s,r)=>s+num(r.cost),0),purchase=num(b.price),extra=(b.costs||[]).reduce((s,c)=>s+num(c.amount),0),total=purchase+repair+extra;
 document.getElementById("costBody").innerHTML=`<div class="costSummary"><div><small>Kaufpreis</small><b>${money(purchase)}</b></div><div><small>Reparaturen</small><b>${money(repair)}</b></div><div><small>Weitere Kosten</small><b>${money(extra)}</b></div><div><small>Gesamt</small><b>${money(total)}</b></div></div><h2>Weitere Kosten</h2><div class="form"><div class="two"><label>Bezeichnung<input id="cTitle" placeholder="z. B. Lackierung"></label><label>Betrag €<input id="cAmount" inputmode="decimal"></label></div><label>Datum<input id="cDate" type="date"></label><button class="btn black" onclick="addCost()">Kosten speichern</button></div>${(b.costs||[]).slice().reverse().map((c,i)=>`<div class="costRow"><div><b>${c.title}</b><small>${c.date||""}</small></div><b>${money(c.amount)}</b></div>`).join("")||'<div class="note">Keine weiteren Kosten erfasst.</div>'}`
}
function addCost(){let id=+v("costBike"),a=bikes(),b=a.find(x=>x.id===id),title=v("cTitle"),amount=v("cAmount");if(!b||!title||!amount)return alert("Bezeichnung und Betrag fehlen");b.costs=b.costs||[];b.costs.push({title,amount,date:v("cDate")});localStorage.setItem("wwv31",JSON.stringify(a));renderCosts()}
function renderRestoration(){
 if(!document.getElementById("restorationBody"))return;let b=bikeBySelect("restBike");if(!b){document.getElementById("restorationBody").innerHTML='<div class="note">Noch kein Fahrzeug vorhanden.</div>';return}
 b.restoration=b.restoration||{budget:"",tasks:[]};let tasks=b.restoration.tasks||[],done=tasks.filter(x=>x.done).length,p=tasks.length?Math.round(done/tasks.length*100):0;
 document.getElementById("restorationBody").innerHTML=`<div class="result"><div class="origScore">${p}%</div><div class="scoreBar"><i style="width:${p}%"></i></div><b>${done} von ${tasks.length} Phasen abgeschlossen</b></div><div class="form"><label>Restaurationsbudget €<input id="restBudget" value="${b.restoration.budget||""}" onchange="saveRestBudget(this.value)"></label><label>Eigene Aufgabe<input id="restTask" placeholder="z. B. Rahmen pulverbeschichten"></label><button class="btn black" onclick="addRestTask()">Aufgabe hinzufügen</button></div>${tasks.map((t,i)=>`<div class="restRow"><input type="checkbox" ${t.done?"checked":""} onchange="toggleRestTask(${i})"><span>${t.text}</span><button onclick="removeRestTask(${i})">×</button></div>`).join("")||'<div class="note">Noch kein Restaurationsplan angelegt.</div>'}`
}
function addRestorationTemplate(){let id=+v("restBike"),a=bikes(),b=a.find(x=>x.id===id);if(!b)return;b.restoration=b.restoration||{budget:"",tasks:[]};if(b.restoration.tasks.length&&!confirm("Standardphasen zusätzlich hinzufügen?"))return;(DB.restoration_project_templates||[]).forEach(x=>b.restoration.tasks.push({text:x,done:false}));localStorage.setItem("wwv31",JSON.stringify(a));renderRestoration()}
function saveRestBudget(val){let id=+v("restBike"),a=bikes(),b=a.find(x=>x.id===id);if(!b)return;b.restoration=b.restoration||{budget:"",tasks:[]};b.restoration.budget=val;localStorage.setItem("wwv31",JSON.stringify(a))}
function addRestTask(){let id=+v("restBike"),a=bikes(),b=a.find(x=>x.id===id),t=v("restTask");if(!b||!t)return;b.restoration=b.restoration||{budget:"",tasks:[]};b.restoration.tasks.push({text:t,done:false});localStorage.setItem("wwv31",JSON.stringify(a));renderRestoration()}
function toggleRestTask(i){let id=+v("restBike"),a=bikes(),b=a.find(x=>x.id===id);b.restoration.tasks[i].done=!b.restoration.tasks[i].done;localStorage.setItem("wwv31",JSON.stringify(a));renderRestoration()}
function removeRestTask(i){let id=+v("restBike"),a=bikes(),b=a.find(x=>x.id===id);b.restoration.tasks.splice(i,1);localStorage.setItem("wwv31",JSON.stringify(a));renderRestoration()}
function renderDocuments(){
 if(!document.getElementById("documentsBody"))return;let b=bikeBySelect("docBike");if(!b){document.getElementById("documentsBody").innerHTML='<div class="note">Noch kein Fahrzeug vorhanden.</div>';return}
 b.documents=b.documents||[];
 document.getElementById("documentsBody").innerHTML=`<div class="form"><label>Dokumenttyp<select id="docType">${(DB.document_types||[]).map(x=>`<option>${x}</option>`).join("")}</select></label><label>Datei<input id="docFile" type="file" accept="image/*,application/pdf"></label><label>Notiz<input id="docNote"></label><button class="btn black" onclick="addDocument()">Dokument speichern</button></div><div class="note">Lokaler Browser-Speicher ist begrenzt. Große PDFs besser extern sichern und hier nur als Hinweis/Foto dokumentieren.</div>${b.documents.map((d,i)=>`<div class="docRow"><div><span class="badge">${d.type}</span><b>${d.name}</b><small>${d.note||""}</small></div><div>${d.data?`<button class="btn" onclick="openDocument(${i})">Öffnen</button>`:""}<button class="btn" onclick="removeDocument(${i})">×</button></div></div>`).join("")||'<div class="note">Noch keine Dokumente gespeichert.</div>'}`
}
function addDocument(){
 let id=+v("docBike"),a=bikes(),b=a.find(x=>x.id===id),file=document.getElementById("docFile")?.files?.[0];if(!b||!file)return alert("Bitte Datei auswählen");
 if(file.size>1500000)return alert("Datei ist zu groß. Bitte unter ca. 1,5 MB verwenden.");
 let r=new FileReader();r.onload=()=>{b.documents=b.documents||[];b.documents.push({type:v("docType"),name:file.name,note:v("docNote"),data:r.result,mime:file.type});try{localStorage.setItem("wwv31",JSON.stringify(a));renderDocuments()}catch(e){alert("Lokaler Speicher ist voll.")}};r.readAsDataURL(file)
}
function openDocument(i){let b=bikeBySelect("docBike"),d=b?.documents?.[i];if(!d?.data)return;let w=window.open();if(d.mime==="application/pdf")w.location=d.data;else w.document.write(`<img src="${d.data}" style="max-width:100%">`)}
function removeDocument(i){let id=+v("docBike"),a=bikes(),b=a.find(x=>x.id===id);b.documents.splice(i,1);localStorage.setItem("wwv31",JSON.stringify(a));renderDocuments()}
function addMonths(dateStr,months){let d=dateStr?new Date(dateStr+"T12:00:00"):new Date();d.setMonth(d.getMonth()+months);return d.toISOString().slice(0,10)}
function renderService(){
 if(!document.getElementById("serviceBody"))return;let b=bikeBySelect("serviceBike");if(!b){document.getElementById("serviceBody").innerHTML='<div class="note">Noch kein Fahrzeug vorhanden.</div>';return}
 b.services=b.services||[];let today=new Date().toISOString().slice(0,10);
 document.getElementById("serviceBody").innerHTML=`<div class="form"><label>Aufgabe<input id="sName" placeholder="z. B. Bremsen prüfen"></label><label>Fällig am<input id="sDue" type="date"></label><button class="btn black" onclick="addService()">Erinnerung speichern</button></div>${b.services.map((s,i)=>{let due=s.due&&s.due<today&&!s.done;return `<div class="serviceRow ${due?"overdue":""}"><input type="checkbox" ${s.done?"checked":""} onchange="toggleService(${i})"><div><b>${s.name}</b><small>${s.due?`Fällig: ${s.due}`:"ohne Datum"}${due?" · ÜBERFÄLLIG":""}</small></div><button onclick="removeService(${i})">×</button></div>`}).join("")||'<div class="note">Noch keine Service-Erinnerungen.</div>'}`
}
function addServiceTemplate(){let id=+v("serviceBike"),a=bikes(),b=a.find(x=>x.id===id);if(!b)return;b.services=b.services||[];(DB.service_templates||[]).forEach(x=>b.services.push({name:x.name,due:addMonths("",x.months),done:false}));localStorage.setItem("wwv31",JSON.stringify(a));renderService()}
function addService(){let id=+v("serviceBike"),a=bikes(),b=a.find(x=>x.id===id),n=v("sName");if(!b||!n)return;b.services=b.services||[];b.services.push({name:n,due:v("sDue"),done:false});localStorage.setItem("wwv31",JSON.stringify(a));renderService()}
function toggleService(i){let id=+v("serviceBike"),a=bikes(),b=a.find(x=>x.id===id);b.services[i].done=!b.services[i].done;localStorage.setItem("wwv31",JSON.stringify(a));renderService()}
function removeService(i){let id=+v("serviceBike"),a=bikes(),b=a.find(x=>x.id===id);b.services.splice(i,1);localStorage.setItem("wwv31",JSON.stringify(a));renderService()}

let guidedNode="start";
function startGuidedDiagnosis(){guidedNode="start";renderGuidedDiagnosis()}
function renderGuidedDiagnosis(){
 if(!document.getElementById("guidedDiagBody")||!DB.guided_diagnosis)return;
 let n=DB.guided_diagnosis[guidedNode];
 document.getElementById("guidedDiagBody").innerHTML=`<div class="guidedCard"><span class="eyebrow">FRAGE</span><h2>${n.question}</h2><div class="guidedOptions">${n.options.map((o,i)=>`<button onclick="guidedChoose(${i})">${o.label}<span>→</span></button>`).join("")}</div>${guidedNode!=="start"?'<button class="btn" onclick="startGuidedDiagnosis()">Neu starten</button>':""}</div>`
}
function guidedChoose(i){
 let o=DB.guided_diagnosis[guidedNode].options[i];
 if(o.next){guidedNode=o.next;renderGuidedDiagnosis();return}
 if(o.result){let d=DB.diagnostics[o.result];document.getElementById("guidedDiagBody").innerHTML=`<div class="guidedCard"><span class="badge">${d?d.system:"Diagnose"}</span><h2>${o.result}</h2><p>Passendes Fehlerbild gefunden.</p><button class="btn black" onclick='nav("diagnose");setTimeout(()=>diagnose(${JSON.stringify(o.result)}),80)'>Prüfkette öffnen</button><button class="btn" onclick="startGuidedDiagnosis()">Neu starten</button></div>`;return}
 if(o.custom){document.getElementById("guidedDiagBody").innerHTML=`<div class="guidedCard"><span class="badge">Antrieb</span><h2>${o.custom}</h2><p>Prüfe Kette, Ritzel, Kettenrad, Durchhang und Radflucht als zusammengehöriges System.</p><button class="btn" onclick="startGuidedDiagnosis()">Neu starten</button></div>`}
}
function shoppingItems(){try{return JSON.parse(localStorage.getItem("ww36_shop")||"[]")}catch(e){return[]}}
function saveShopping(a){localStorage.setItem("ww36_shop",JSON.stringify(a))}
function renderShoppingCatalog(){
 if(!document.getElementById("shoppingCatalog"))return;
 let q=v("shopSearch").toLowerCase(),s=v("shopSystem"),fav=shoppingItems();
 let a=(DB.parts_reference||[]).filter(x=>(!s||x.system===s)&&(x.part+" "+x.fit+" "+x.ref).toLowerCase().includes(q));
 document.getElementById("shoppingCatalog").innerHTML=a.map((x,i)=>{let key=x.system+"|"+x.part+"|"+x.fit,selected=fav.some(y=>y.key===key);return `<article class="shopCard"><div><span class="badge">${x.system}</span><h3>${x.part}</h3><p>${x.fit}</p><small>${x.ref}</small></div><button class="favBtn ${selected?"active":""}" onclick='toggleShopping(${JSON.stringify(key)},${JSON.stringify(x.part)},${JSON.stringify(x.system)},${JSON.stringify(x.fit)})'>★</button></article>`}).join("")
}
function toggleShopping(key,part,system,fit){
 let a=shoppingItems(),i=a.findIndex(x=>x.key===key);
 if(i>=0)a.splice(i,1);else a.push({key,part,system,fit,qty:1,note:""});
 saveShopping(a);renderShoppingCatalog();renderShoppingList()
}
function renderShoppingList(){
 if(!document.getElementById("shoppingList"))return;
 let a=shoppingItems();document.getElementById("shoppingList").innerHTML=a.length?a.map((x,i)=>`<div class="shoppingRow"><div><b>${x.part}</b><small>${x.system} · ${x.fit}</small></div><input type="number" min="1" value="${x.qty||1}" onchange="updateShop(${i},'qty',this.value)"><input value="${x.note||""}" placeholder="Notiz" onchange="updateShop(${i},'note',this.value)"><button onclick="removeShop(${i})">×</button></div>`).join(""):'<div class="note">Noch keine Teile markiert.</div>'
}
function updateShop(i,k,val){let a=shoppingItems();a[i][k]=k==="qty"?Math.max(1,+val||1):val;saveShopping(a)}
function removeShop(i){let a=shoppingItems();a.splice(i,1);saveShopping(a);renderShoppingCatalog();renderShoppingList()}
function clearShoppingList(){if(confirm("Einkaufsliste leeren?")){saveShopping([]);renderShoppingCatalog();renderShoppingList()}}
function exportShoppingList(){
 let a=shoppingItems(),text="WERKERS WERKSTATT – EINKAUFSLISTE\\n\\n"+a.map(x=>`${x.qty||1}x ${x.part} | ${x.system} | ${x.fit}${x.note?" | "+x.note:""}`).join("\\n");
 let blob=new Blob([text],{type:"text/plain"}),lnk=document.createElement("a");lnk.href=URL.createObjectURL(blob);lnk.download="simson-einkaufsliste.txt";lnk.click()
}
function addRepair(){
 let a=bikes(),b=a.find(x=>x.id===currentBike),title=v("rTitle");if(!title)return alert("Titel fehlt");
 b.repairs=b.repairs||[];b.repairs.push({title,category:v("rCategory"),date:v("rDate"),km:v("rKm"),cost:v("rCost"),parts:v("rParts"),note:v("rNote")});localStorage.setItem("wwv31",JSON.stringify(a));openBike(currentBike)
}
function addPhoto(){
 let input=document.getElementById("photoInput"),file=input?.files?.[0];if(!file)return alert("Bitte Foto auswählen");
 if(file.size>1200000)return alert("Foto ist zu groß. Bitte unter ca. 1,2 MB verwenden.");
 let reader=new FileReader();reader.onload=()=>{let a=bikes(),b=a.find(x=>x.id===currentBike);b.photos=b.photos||[];if(b.photos.length>=8)return alert("Maximal 8 Fotos pro Fahrzeug in dieser lokalen Version.");b.photos.push({data:reader.result,caption:v("photoCaption")});try{localStorage.setItem("wwv31",JSON.stringify(a));openBike(currentBike)}catch(e){alert("Speicher voll. Bitte kleinere Fotos verwenden oder alte Fotos löschen.")}};reader.readAsDataURL(file)
}
function removePhoto(i){let a=bikes(),b=a.find(x=>x.id===currentBike);b.photos.splice(i,1);localStorage.setItem("wwv31",JSON.stringify(a));openBike(currentBike)}

function renderAssembly(){
 if(!document.getElementById("assemblyBody")||!DB.assemblies)return;
 let a=DB.assemblies[+document.getElementById("assemblyPick").value||0];
 let parts=a.parts.map((p,i)=>`<button class="explodedPart" onclick="selectAssemblyPart(${i})"><span class="partNum">${p.n}</span><b>${p.name}</b><small>${p.role}</small></button>`).join("");
 document.getElementById("assemblyBody").innerHTML=`<article class="detail"><span class="eyebrow">${a.system} · ${a.models}</span><h1>${a.title}</h1></article><div class="explodedStage">${parts}</div><div id="assemblyInfo" class="note">Bauteil antippen. Prüfpunkte: ${a.checks.join(", ")}.</div>`
}
function selectAssemblyPart(i){
 let a=DB.assemblies[+document.getElementById("assemblyPick").value||0],p=a.parts[i];
 document.querySelectorAll(".explodedPart").forEach((x,n)=>x.classList.toggle("selected",n===i));
 document.getElementById("assemblyInfo").innerHTML=`<b>${p.n} · ${p.name}</b><br>Funktion: ${p.role}.<br><small>Baugruppe: ${a.title}. Vor Zerlegung Einbaulage dokumentieren und passende Reparaturunterlage verwenden.</small>`
}
function renderVehicleDiagnosis(){
 if(!document.getElementById("vehicleDiagBody"))return;
 let id=document.getElementById("diagVehicle").value||Object.keys(DB.vehicle_diagnosis_profiles||{})[0],p=DB.vehicle_diagnosis_profiles[id];
 let pre=p.prechecks.map((x,i)=>`<div class="fact"><b>${String(i+1).padStart(2,"0")}</b><span>${x}</span></div>`).join("");
 let issues=p.priority.map(x=>{let d=DB.diagnostics[x];return `<button class="diagPriority" onclick='nav("diagnose");setTimeout(()=>diagnose(${JSON.stringify(x)}),80)'><b>${x}</b><small>${d?d.system:"Diagnose"}</small><span>→</span></button>`}).join("");
 document.getElementById("vehicleDiagBody").innerHTML=`<h2>Vorprüfung</h2><div class="factList">${pre}</div><h2>Priorisierte Fehlerbilder</h2><div class="diagPriorityList">${issues}</div>`
}

function renderS51Detail(){
 if(!DB.s51_detail_specs||!document.getElementById("s51SpecBody"))return;
 let x=DB.s51_detail_specs[+document.getElementById("s51SpecPick").value||0];
 document.getElementById("s51SpecBody").innerHTML=`<article class="detail"><span class="eyebrow">S51 VARIANTENREFERENZ · SICHERHEIT ${x.certainty.toUpperCase()}</span><h1>${x.name}</h1><p>${x.special}</p></article><div class="specs"><div><small>Motor</small><b>${x.engine}</b></div><div><small>Gänge</small><b>${x.gears}</b></div><div><small>Zündung</small><b>${x.ignition}</b></div><div><small>Elektrik</small><b>${x.electrics}</b></div><div><small>Blinker</small><b>${x.signals}</b></div><div><small>Batterie</small><b>${x.battery}</b></div><div><small>Instrumente</small><b>${x.speedometer}</b></div><div><small>Auspuff</small><b>${x.exhaust}</b></div></div><div class="note"><b>Einordnung:</b> ${x.notes}</div>`
}
function renderCarbRef(){
 if(!document.getElementById("carbRefList"))return;
 document.getElementById("carbRefList").innerHTML=(DB.carb_reference||[]).map(x=>`<article class="refCard"><span class="badge">${x.model} · ${x.engine}</span><h3>${x.carb}</h3><p><b>${x.status}</b></p><div class="note">${x.notes}</div></article>`).join("")
}
function renderTorqueFluids(){
 if(!document.getElementById("tfList"))return;
 document.getElementById("tfList").innerHTML=(DB.fluids_torque||[]).map(x=>`<article class="tfCard"><span class="badge">${x.group}</span><h3>${x.item}</h3><div class="tfGrid"><div><small>Modelle</small><b>${x.models}</b></div><div><small>Wert/Referenz</small><b>${x.value}</b></div></div><div class="note">${x.note}</div></article>`).join("")
}
let wireSelected=null;
function renderInteractiveWire(){
 if(!document.getElementById("wireCanvas"))return;
 let id=document.getElementById("wirePick").value||Object.keys(DB.wiring_interactive||{})[0],w=DB.wiring_interactive[id];
 wireSelected=null;
 let linked=new Set();
 let edges=w.edges.map((e,i)=>`<div class="edge" data-a="${e[0]}" data-b="${e[1]}"><span>${w.nodes.find(n=>n.id===e[0]).label}</span><b>→</b><span>${w.nodes.find(n=>n.id===e[1]).label}</span></div>`).join("");
 let nodes=w.nodes.map(n=>`<button class="wireNode ${n.type}" data-id="${n.id}" onclick="selectWireNode('${n.id}')"><small>${n.type}</small><b>${n.label}</b></button>`).join("");
 let legend=(DB.wire_color_legend||[]).map(x=>`<span class="wireLegendItem"><i style="background:${x.color}"></i>${x.label}</span>`).join("");
 document.getElementById("wireCanvas").innerHTML=`<h2>${w.title}</h2><div class="wireLegend">${legend}</div><div class="wireNodes">${nodes}</div><h3>Verbindungen</h3><div class="edgeList">${edges}</div><div class="note">Die Farben oben sind reine App-Kategorien und ausdrücklich keine Aussage über originale Kabelfarben.</div>`;
 document.getElementById("wireInfo").innerHTML="Baugruppe antippen. Die zugehörigen Verbindungen werden hervorgehoben."
}
function selectWireNode(id){
 wireSelected=id;
 let wid=document.getElementById("wirePick").value,w=DB.wiring_interactive[wid],n=w.nodes.find(x=>x.id===id);
 document.querySelectorAll(".wireNode").forEach(x=>x.classList.toggle("selected",x.dataset.id===id));
 document.querySelectorAll(".edge").forEach(x=>x.classList.toggle("selected",x.dataset.a===id||x.dataset.b===id));
 let con=w.edges.filter(e=>e[0]===id||e[1]===id).map(e=>{let other=e[0]===id?e[1]:e[0];return w.nodes.find(x=>x.id===other).label});
 document.getElementById("wireInfo").innerHTML=`<b>${n.label}</b><br>Rolle: ${n.type}. Verbunden mit: ${con.join(", ")||"—"}.`
}
function resetWire(){renderInteractiveWire()}

function renderVehicleSpec(){
 if(!DB.vehicle_specs||!document.getElementById("vehicleSpecBody"))return;
 let id=document.getElementById("specModel").value||Object.keys(DB.vehicle_specs)[0],x=DB.vehicle_specs[id];
 document.getElementById("vehicleSpecBody").innerHTML=`<article class="detail"><span class="eyebrow">FAHRZEUGREFERENZ</span><h1>${x.label}</h1></article><div class="specs"><div><small>Motorfamilie</small><b>${x.engine_family}</b></div><div><small>Hubraum</small><b>${x.displacement}</b></div><div><small>Getriebe</small><b>${x.gearbox}</b></div><div><small>Vergaser</small><b>${x.carburetor}</b></div><div><small>Zündung</small><b>${x.ignition}</b></div><div><small>Kühlung</small><b>${x.cooling}</b></div><div><small>Geschwindigkeit</small><b>${x.speed}</b></div></div><div class="factList">${x.notes.map((n,i)=>`<div class="fact"><b>${String(i+1).padStart(2,"0")}</b><span>${n}</span></div>`).join("")}</div>`
}
function renderParts(){
 if(!DB.parts_reference||!document.getElementById("partsList"))return;
 let q=v("partSearch").toLowerCase(),s=v("partSystem");
 let a=DB.parts_reference.filter(x=>(!s||x.system===s)&&(x.part+" "+x.fit+" "+x.ref+" "+x.check).toLowerCase().includes(q));
 document.getElementById("partsList").innerHTML=a.map(x=>`<article class="refCard"><span class="badge">${x.system}</span><h3>${x.part}</h3><p><b>Fahrzeugbezug:</b> ${x.fit}</p><p><b>Referenz:</b> ${x.ref}</p><div class="note"><b>Vor Bestellung:</b> ${x.check}</div></article>`).join("")
}
function renderMaintenance(){
 if(!DB.maintenance_plan||!document.getElementById("maintenanceList"))return;
 document.getElementById("maintenanceList").innerHTML=DB.maintenance_plan.map((x,i)=>`<label class="maintCheck"><input type="checkbox" onchange="saveMaintMaster()"><span><b>${x.task}</b><small>${x.category} · ${x.when}</small></span></label>`).join("");
 let saved=JSON.parse(localStorage.getItem("ww33_maint")||"[]");
 [...document.querySelectorAll("#maintenanceList input")].forEach((e,i)=>e.checked=saved.includes(i))
}
function saveMaintMaster(){
 let a=[...document.querySelectorAll("#maintenanceList input")].map((x,i)=>x.checked?i:null).filter(x=>x!==null);
 localStorage.setItem("ww33_maint",JSON.stringify(a))
}
function renderWiring(){
 if(!DB.wiring_systems||!document.getElementById("wiringList"))return;
 document.getElementById("wiringList").innerHTML=DB.wiring_systems.map(x=>`<article class="wireCard"><span class="badge">${x.models}</span><h3>${x.name}</h3><div class="wireFlow">${x.flow.map((f,i)=>`<div><b>${String(i+1).padStart(2,"0")}</b><span>${f}</span></div>`).join("")}</div><div class="warning">${x.warning}</div></article>`).join("")
}

function renderTechArchive(){
 if(!DB.tech_library||!document.getElementById("techArchiveList"))return;
 let q=(document.getElementById("techSearch")?.value||"").toLowerCase(),cat=document.getElementById("techCat")?.value||"";
 let a=DB.tech_library.filter(x=>(!cat||x.cat===cat)&&(x.title+" "+x.summary+" "+x.points.join(" ")).toLowerCase().includes(q));
 document.getElementById("techArchiveList").innerHTML=a.map(x=>`<article class="techCard" id="tc_${x.id}"><button onclick="toggleTech('${x.id}')"><span class="offlinePill">${x.cat}</span><h3>${x.title}</h3><p>${x.summary}</p><b>Details →</b></button><div class="techPoints"><ul>${x.points.map(p=>`<li>${p}</li>`).join("")}</ul><small>Exakte Maße, Drehmomente und Einstellwerte immer anhand des konkreten Modells/Motors verifizieren.</small></div></article>`).join("")||'<div class="note">Keine Treffer.</div>';
}
function toggleTech(id){document.getElementById("tc_"+id)?.classList.toggle("open")}

function runFinCheck(){
 let id=v("finModel"),num=v("finNumber").replace(/\s+/g,""),year=parseInt(v("finYear"),10),src=v("finYearSource"),m=DB.models.find(x=>x.id===id);
 let rows=[],score=0,max=0;
 max++;let numeric=/^\d{5,12}$/.test(num);rows.push({ok:numeric,kind:numeric?"ok":"warn",text:numeric?"FIN-Format ist als reine Ziffernfolge plausibel.":"FIN-Format ist ungewöhnlich oder unvollständig. Noch einmal direkt am Rahmen prüfen."});if(numeric)score++;
 max++;let hasYear=Number.isInteger(year)&&year>1900&&year<2100;rows.push({ok:hasYear,kind:hasYear?"ok":"warn",text:hasYear?`Baujahr ${year} wurde erfasst.`:"Kein plausibles Baujahr eingegeben."});if(hasYear)score++;
 if(hasYear&&m.production&&m.production[0]){
   max++;let within=year>=m.production[0]&&year<=m.production[1];
   rows.push({ok:within,kind:within?"ok":"bad",text:within?`${year} liegt im hinterlegten Produktionszeitraum ${m.production[0]}–${m.production[1]} für ${m.name}.`:`${year} liegt außerhalb des hinterlegten Produktionszeitraums ${m.production[0]}–${m.production[1]} für ${m.name}.`});if(within)score++;
 }
 max++;let strong=src==="Typenschild"||src==="Fahrzeugpapiere";rows.push({ok:strong,kind:strong?"ok":"warn",text:strong?`Baujahrquelle „${src}“ ist für die Plausibilitätsprüfung brauchbar.`:`Quelle „${src}“ sollte durch Typenschild/Papiere ergänzt werden.`});if(strong)score++;
 let p=Math.round(score/max*100);
 document.getElementById("finResult").innerHTML=`<div class="result"><div class="origScore">${p}%</div><b>Plausibilitätswert</b>${rows.map(r=>`<div class="finStatus ${r.kind}"><span class="ico">${r.ok?"✓":r.kind==="bad"?"!":"?"}</span><span>${r.text}</span></div>`).join("")}<small>${DB.fin_help.note}</small></div>`
}
function addTodo(){
 let text=v("todoText");if(!text)return;
 let a=bikes(),b=a.find(x=>x.id===currentBike);b.todos=b.todos||[];b.todos.push({text,done:false});localStorage.setItem("wwv31",JSON.stringify(a));openBike(currentBike)
}
function toggleTodo(i){
 let a=bikes(),b=a.find(x=>x.id===currentBike);b.todos[i].done=!b.todos[i].done;localStorage.setItem("wwv31",JSON.stringify(a));openBike(currentBike)
}
function removeTodo(i){
 let a=bikes(),b=a.find(x=>x.id===currentBike);b.todos.splice(i,1);localStorage.setItem("wwv31",JSON.stringify(a));openBike(currentBike)
}

function openSearch(){document.getElementById("overlay").classList.remove("hidden")}
function closeSearch(){document.getElementById("overlay").classList.add("hidden")}
function doSearch(){let q=v("globalSearch").toLowerCase(),h=[];DB.models.filter(x=>(x.name+" "+x.desc).toLowerCase().includes(q)).forEach(x=>h.push(`<button class="searchHit" onclick="openModel('${x.id}')"><b>${x.name}</b><small>Modell</small></button>`));DB.guides.forEach((x,i)=>{if((x.title+" "+x.tag).toLowerCase().includes(q))h.push(`<button class="searchHit" onclick="openGuide(${i})"><b>${x.title}</b><small>Anleitung</small></button>`)});document.getElementById("searchResults").innerHTML=h.slice(0,10).join("")}
function v(id){return document.getElementById(id)?.value?.trim()||""}
boot();if("serviceWorker"in navigator&&location.protocol!=="file:")navigator.serviceWorker.register("sw.js").catch(()=>{})