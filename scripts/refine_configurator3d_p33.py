from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "configurator3d.js"
CSS = ROOT / "configurator3d.css"
SW = ROOT / "sw.js"

text = JS.read_text(encoding="utf-8")

engine = r'''  function drawEngine(c,vp,metal,dark,chrome){
    const fin=c.engine==='black'?[.16,.17,.17]:[.39,.41,.41], cover=c.engine==='polished'?[.90,.91,.90]:metal, alloy=[.58,.60,.60];
    // Motorgehäuse und Seitendeckel
    draw('sphere',xform([.02,-.57,0],[.61,.45,.47]),metal,vp);
    draw('wedge',xform([-.23,-.59,.18],[.38,.31,.25],[0,0,.04]),metal,vp);
    draw('sphere',xform([.17,-.56,-.365],[.45,.37,.13]),cover,vp);
    draw('cyl',axleModel(.17,-.56,-.50,.205,.043),c.engine==='black'?[.15,.16,.16]:[.60,.62,.62],vp);
    draw('sphere',xform([-.25,-.56,.39],[.27,.28,.075]),cover,vp);
    // Schrauben am Kupplungsdeckel
    for(const [x,y] of [[.02,-.34],[.35,-.45],[.36,-.72],[.02,-.80]]) draw('sphere',xform([x,y,-.505],[.025,.025,.015]),dark,vp);
    // Zylinder und Kühlrippen
    draw('cube',xform([.025,.14,0],[.30,.32,.30]),fin,vp);
    for(let i=0;i<9;i++)draw('cube',xform([.025,-.13+i*.068,0],[.405,.020,.395]),fin,vp);
    // Zylinderkopf mit abgestuften Rippen
    draw('wedge',xform([.025,.70,0],[.40,.105,.38]),fin,vp);
    for(let i=0;i<5;i++)draw('cube',xform([.025,.43+i*.052,0],[.47-.025*i,.017,.43-.018*i]),fin,vp);
    // Zündkerze und Stecker
    draw('cyl',tubeBetween([.03,.78,0],[.04,.95,0],.038),[.85,.85,.81],vp);
    draw('cube',xform([.04,.975,0],[.065,.040,.055]),dark,vp);
    draw('cyl',tubeBetween([.04,1.01,0],[-.12,1.13,.16],.018),dark,vp);
    // Vergaser, Ansaugstutzen und Luftführung hinter dem Zylinder
    draw('cyl',tubeBetween([-.31,.22,.18],[-.52,.18,.28],.105),alloy,vp);
    draw('cube',xform([-.60,.15,.30],[.17,.20,.14],[0,0,-.04]),alloy,vp);
    draw('sphere',xform([-.60,-.03,.30],[.17,.09,.14]),alloy,vp);
    draw('cube',xform([-.60,-.11,.30],[.15,.055,.13]),[.46,.48,.48],vp);
    draw('cyl',tubeBetween([-.76,.15,.30],[-1.03,.12,.28],.105),dark,vp);
    draw('sphere',xform([-1.09,.11,.27],[.17,.16,.15]),dark,vp);
    // Gaszug und Benzinschlauch
    draw('cyl',tubeBetween([-.59,.36,.30],[-.45,.82,.24],.010),dark,vp);
    draw('cyl',tubeBetween([-.70,.28,.29],[-.55,.67,.32],.012),[.30,.36,.24],vp);
    // Kickstarter und Schalthebel
    draw('cyl',tubeBetween([.38,-.80,-.37],[.85,-.95,-.37],.034),chrome,vp);
    draw('cube',xform([.91,-.98,-.37],[.18,.035,.08],[0,0,-.10]),dark,vp);
    draw('cyl',tubeBetween([-.34,-.73,-.25],[-.74,-.91,-.25],.034),chrome,vp);
    draw('cube',xform([-.80,-.94,-.25],[.18,.035,.08]),dark,vp);
    // Abtriebswelle / Kettenritzelbereich
    draw('cyl',tubeBetween([.46,-.42,.30],[.78,-.29,.30],.045),dark,vp);
    draw('sphere',xform([.83,-.27,.30],[.09,.09,.09]),dark,vp);
    draw('cube',xform([-.26,-.56,.43],[.17,.10,.05],[0,0,.1]),[.25,.25,.25],vp);
  }'''

cockpit = r'''  function drawCockpit(c,vp,dark,chrome){
    const high=(c.handlebar==='enduro'||c.bar==='enduro'||c.base==='enduro'), barY=high?1.80:1.60, barX=high?1.60:1.66;
    // Steuerrohr und Lenkerklemmung
    draw('cyl',tubeBetween([1.50,.82,0],[barX,barY-.08,0],.034),chrome,vp);
    draw('cube',xform([barX,barY-.055,0],[.17,.055,.10]),dark,vp);
    draw('cyl',xform([barX-.08,barY-.015,-.08],[.035,.055,.035]),chrome,vp);
    draw('cyl',xform([barX+.08,barY-.015,.08],[.035,.055,.035]),chrome,vp);
    // Lenkerrohr
    draw('cyl',tubeBetween([barX,barY,0],[2.03,barY+.035,-.03],.034),chrome,vp);
    draw('cyl',tubeBetween([barX,barY,0],[1.22,barY+.035,.03],.034),chrome,vp);
    // Griffe und Armaturen
    draw('cyl',tubeBetween([2.00,barY+.035,-.03],[2.25,barY+.035,-.03],.050),dark,vp);
    draw('cyl',tubeBetween([1.25,barY+.035,.03],[1.00,barY+.035,.03],.050),dark,vp);
    draw('cube',xform([1.99,barY-.015,-.045],[.10,.065,.09]),dark,vp);
    draw('cube',xform([1.25,barY-.015,.045],[.10,.065,.09]),dark,vp);
    // Brems- und Kupplungshebel
    draw('cyl',tubeBetween([2.07,barY-.02,-.08],[2.32,barY-.14,-.12],.018),chrome,vp);
    draw('cyl',tubeBetween([1.18,barY-.02,.08],[.93,barY-.14,.12],.018),chrome,vp);
    // Tacho mit Zierring, Glas und Tachowelle
    draw('cyl',xform([1.53,1.36,-.055],[.195,.060,.195],[Math.PI/2,0,0]),dark,vp);
    draw('cyl',xform([1.53,1.37,-.120],[.160,.018,.160],[Math.PI/2,0,0]),chrome,vp);
    draw('cyl',xform([1.53,1.375,-.141],[.140,.010,.140],[Math.PI/2,0,0]),[.91,.92,.88],vp);
    draw('cube',xform([1.53,1.375,-.155],[.010,.095,.010],[0,0,-.52]),[.15,.15,.15],vp);
    draw('cyl',tubeBetween([1.50,1.18,-.06],[1.18,.56,-.13],.012),dark,vp);
    // Zünd-/Schaltergehäuse
    draw('cube',xform([1.30,1.27,.03],[.105,.072,.12],[0,0,.02]),dark,vp);
    draw('cyl',xform([1.30,1.36,.03],[.035,.025,.035]),chrome,vp);
    // Scheinwerfergehäuse, Glas und Lampenhalter
    draw('cyl',tubeBetween([1.45,.72,-.29],[1.55,1.18,-.29],.028),chrome,vp);
    draw('cyl',tubeBetween([1.45,.72,.29],[1.55,1.18,.29],.028),chrome,vp);
    draw('cyl',tubeBetween([1.52,.88,-.29],[1.63,.98,-.23],.025),dark,vp);
    draw('cyl',tubeBetween([1.52,.88,.29],[1.63,.98,.23],.025),dark,vp);
    draw('sphere',xform([1.60,1.02,0],[.31,.29,.275]),dark,vp);
    draw('sphere',xform([1.80,1.02,-.02],[.125,.245,.240]),c.light==='led'?[.74,.91,.35]:[.91,.85,.58],vp);
    draw('torus',xform([1.785,1.02,-.02],[.29,.29,.29],[0,Math.PI/2,0]),chrome,vp);
    // Vordere Blinker mit Halterungen
    draw('cyl',tubeBetween([1.48,1.10,-.28],[1.48,1.10,-.48],.022),dark,vp);
    draw('cyl',tubeBetween([1.48,1.10,.28],[1.48,1.10,.48],.022),dark,vp);
    draw('sphere',xform([1.48,1.10,-.54],[.13,.095,.10]),[.94,.48,.04],vp);
    draw('sphere',xform([1.48,1.10,.54],[.13,.095,.10]),[.94,.48,.04],vp);
    // Bowdenzüge und Kabel
    draw('cyl',tubeBetween([2.02,barY,-.06],[1.52,.80,-.16],.012),dark,vp);
    draw('cyl',tubeBetween([1.06,barY,.06],[.65,.55,.18],.012),dark,vp);
    draw('cyl',tubeBetween([2.15,barY+.01,-.03],[1.78,.95,-.12],.010),dark,vp);
    // Spiegel
    if(c.mirror!=='none'&&(c.mirror||c.base==='street')){
      draw('cyl',tubeBetween([1.92,barY+.04,-.02],[2.05,barY+.43,-.02],.018),chrome,vp);
      draw('sphere',xform([2.08,barY+.50,-.02],[.145,.20,.05],[0,0,-.25]),[.32,.34,.34],vp);
    }
  }'''


def sub_func(src, name, next_name, replacement):
    pattern = rf"  function {re.escape(name)}\([^\n]*\)\{{.*?(?=\n\n  function {re.escape(next_name)}\()"
    out, count = re.subn(pattern, replacement, src, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"Could not replace {name}; matches={count}")
    return out

text = sub_func(text, "drawEngine", "drawTankAndBody", engine)
text = sub_func(text, "drawCockpit", "drawFrameAndRunningGear", cockpit)

# Rear lighting / license plate detail
old_rear = "draw('cube',xform([-1.82,.72,0],[.15,.12,.21]),[.46,.04,.03],vp);draw('sphere',xform([-1.69,.77,-.37],[.10,.08,.08]),[.90,.47,.06],vp);draw('sphere',xform([-1.69,.77,.37],[.10,.08,.08]),[.90,.47,.06],vp);"
new_rear = "draw('cube',xform([-1.82,.72,0],[.15,.12,.21]),[.46,.04,.03],vp);draw('cube',xform([-1.96,.50,0],[.16,.20,.20],[0,0,-.10]),dark,vp);draw('cube',xform([-2.08,.30,0],[.18,.14,.20],[0,0,-.10]),[.82,.82,.78],vp);draw('sphere',xform([-1.69,.77,-.37],[.10,.08,.08]),[.90,.47,.06],vp);draw('sphere',xform([-1.69,.77,.37],[.10,.08,.08]),[.90,.47,.06],vp);"
if old_rear not in text:
    raise SystemExit("Rear-light anchor not found")
text = text.replace(old_rear, new_rear, 1)

text = text.replace("S51 3D · Detail 3.2", "S51 3D · Detail 3.3")
text = text.replace("PHASE 3.2", "PHASE 3.3")
text = text.replace("Tank · Seitendeckel · Sitzbank · Rahmen · Cockpit · Räder · Motor · rechter Auspuff", "Tank · Seitendeckel · Rahmen · Cockpit · Blinker · Vergaser · Motor · Räder · rechter Auspuff")

JS.write_text(text, encoding="utf-8")
(ROOT / "www" / "configurator3d.js").write_text(text, encoding="utf-8")

css = CSS.read_text(encoding="utf-8").replace("Phase 3.2 WebGL", "Phase 3.3 WebGL")
CSS.write_text(css, encoding="utf-8")
(ROOT / "www" / "configurator3d.css").write_text(css, encoding="utf-8")

for path in (SW, ROOT / "www" / "sw.js"):
    sw = path.read_text(encoding="utf-8")
    if "ww-v3-9-configurator-p3-2" not in sw:
        raise SystemExit(f"Expected p3-2 cache marker missing in {path}")
    path.write_text(sw.replace("ww-v3-9-configurator-p3-2", "ww-v3-9-configurator-p3-3"), encoding="utf-8")

print("S51 configurator WebGL detail 3.3 applied and synced.")
