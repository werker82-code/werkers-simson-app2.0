from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTION = (ROOT / "scripts" / "configurator-section.html").read_text(encoding="utf-8").strip()


def patch_index(relpath: str):
    p = ROOT / relpath
    s = p.read_text(encoding="utf-8")

    if 'href="configurator.css"' not in s:
        s = s.replace(
            '<link rel="stylesheet" href="style.css">',
            '<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="configurator.css">',
            1,
        )

    s = s.replace('V3.8 · STORE RELEASE', 'V3.9 · CONFIGURATOR')
    s = s.replace('Varianten, Farben & Vergleich', 'Varianten, Farben & Konfigurator')

    if 'S51 Konfigurator öffnen →' not in s:
        tabs = '<div class="tabs"><button class="active"'
        insert = '<div class="configHeroActions"><button class="btn black" onclick="nav(\'configurator\')">S51 Konfigurator öffnen →</button></div>' + tabs
        if tabs not in s:
            raise RuntimeError(f"S51 tab marker not found in {relpath}")
        s = s.replace(tabs, insert, 1)

    if 'id="configurator"' not in s:
        marker = '<section id="dashboard" class="view">'
        if marker not in s:
            raise RuntimeError(f"Dashboard marker not found in {relpath}")
        s = s.replace(marker, SECTION + '\n\n' + marker, 1)

    if '>S51 Konfigurator →</button>' not in s:
        marker = '<button onclick="nav(\'identify\')">Modell bestimmen →</button>'
        replacement = '<button onclick="nav(\'configurator\')">S51 Konfigurator →</button>' + marker
        if marker not in s:
            raise RuntimeError(f"More-menu marker not found in {relpath}")
        s = s.replace(marker, replacement, 1)

    s = s.replace('<b>Version 3.8:</b>', '<b>Version 3.9:</b>')

    if '<script src="configurator.js"></script>' not in s:
        marker = '<script src="app.js"></script>'
        if marker not in s:
            raise RuntimeError(f"app.js script marker not found in {relpath}")
        s = s.replace(marker, marker + '<script src="configurator.js"></script>', 1)

    p.write_text(s, encoding="utf-8")
    print(f"patched {relpath}")


def patch_sw(relpath: str):
    p = ROOT / relpath
    s = p.read_text(encoding="utf-8")
    s = s.replace('ww-v3-8', 'ww-v3-9-configurator')
    if 'configurator.css' not in s:
        s = s.replace(
            '"./style.css","./app.js"',
            '"./style.css","./configurator.css","./app.js","./configurator.js"',
            1,
        )
    p.write_text(s, encoding="utf-8")
    print(f"patched {relpath}")


for path in ("index.html", "www/index.html"):
    patch_index(path)
for path in ("sw.js", "www/sw.js"):
    patch_sw(path)

print("S51 configurator integration complete")
