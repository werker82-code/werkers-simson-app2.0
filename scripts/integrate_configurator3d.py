from pathlib import Path

INDEXES = [Path('index.html'), Path('www/index.html')]
SERVICES = [Path('sw.js'), Path('www/sw.js')]

for p in INDEXES:
    s = p.read_text(encoding='utf-8')
    if 'configurator3d.css' not in s:
        s = s.replace('<link rel="stylesheet" href="configurator.css">', '<link rel="stylesheet" href="configurator.css"><link rel="stylesheet" href="configurator3d.css">')
    if '<script src="configurator3d.js"></script>' not in s:
        s = s.replace('<script src="configurator.js"></script>', '<script src="configurator.js"></script><script src="configurator3d.js"></script>')
    s = s.replace('S51 KONFIGURATOR · PHASE 1', 'S51 KONFIGURATOR · PHASE 3')
    s = s.replace('Der Konfigurator bildet die komplette Auswahl- und Speicherlogik ab. Die aktuelle Fahrzeugansicht ist eine interaktive 2D/SVG-Vorschau; austauschbare GLB-3D-Bauteile folgen im nächsten Ausbau.', 'Der Konfigurator bietet jetzt zusätzlich eine echte, offline-fähige WebGL-3D-Ansicht. Räder, Tank/Seitendeckel, Motor und Auspuff werden als getrennte 3D-Komponenten gerendert; die 2D-Hybridansicht bleibt als schnelle Alternative verfügbar.')
    p.write_text(s, encoding='utf-8')

for p in SERVICES:
    s = p.read_text(encoding='utf-8')
    s = s.replace('ww-v3-9-configurator-p2', 'ww-v3-9-configurator-p3')
    if './configurator3d.css' not in s:
        s = s.replace('"./configurator.css"', '"./configurator.css","./configurator3d.css"')
    if './configurator3d.js' not in s:
        s = s.replace('"./configurator.js"', '"./configurator.js","./configurator3d.js"')
    p.write_text(s, encoding='utf-8')

for p in INDEXES:
    s = p.read_text(encoding='utf-8')
    assert 'configurator3d.css' in s and 'configurator3d.js' in s and 'PHASE 3' in s, p
for p in SERVICES:
    s = p.read_text(encoding='utf-8')
    assert 'configurator3d.css' in s and 'configurator3d.js' in s and 'p3' in s, p
print('Phase 3 WebGL integration complete')
