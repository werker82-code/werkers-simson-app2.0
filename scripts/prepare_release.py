#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / "app-version.json"
WWW = ROOT / "www"
ANDROID_ASSETS = ROOT / "android-store-project/app/src/main/assets"
ANDROID_GRADLE = ROOT / "android-store-project/app/build.gradle"


def load_release() -> dict:
    data = json.loads(VERSION_FILE.read_text(encoding="utf-8"))
    version = str(data["version"]).strip()
    build = int(data["build"])
    renderer = str(data.get("renderer", "")).strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise SystemExit(f"Ungültige Version: {version}")
    if build < 1:
        raise SystemExit("Build muss > 0 sein")
    return {**data, "version": version, "build": build, "renderer": renderer}


def version_js(release: dict) -> str:
    payload = json.dumps(release, ensure_ascii=False, separators=(",", ":"))
    return f"""/* Auto-generated from app-version.json. Do not edit by hand. */
(() => {{
  const release = {payload};
  window.WERKERS_RELEASE = Object.freeze(release);

  function applyReleaseLabel() {{
    const label = document.querySelector('.brand small');
    if (label) label.textContent = `SIMSON KULT & TECHNIK · V${{release.version}} · B${{release.build}}`;
    document.title = `Werkers Werkstatt – Simson V${{release.version}} · Build ${{release.build}}`;
    document.documentElement.dataset.appVersion = release.version;
    document.documentElement.dataset.appBuild = String(release.build);
    document.documentElement.dataset.renderer = release.renderer || '';
  }}

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyReleaseLabel, {{once:true}});
  else applyReleaseLabel();
}})();
"""


def patch_index(path: Path) -> None:
    s = path.read_text(encoding="utf-8")
    s = re.sub(r"<title>.*?</title>", "<title>Werkers Werkstatt – Simson</title>", s, count=1, flags=re.S)
    tag = '<script src="version.js"></script>'
    if tag not in s:
        anchor = '<script src="app.js"></script>'
        if anchor in s:
            s = s.replace(anchor, tag + "\n" + anchor, 1)
        elif "</body>" in s:
            s = s.replace("</body>", tag + "\n</body>", 1)
        else:
            raise RuntimeError(f"Kein Script-Anker in {path}")
    path.write_text(s, encoding="utf-8")


def patch_service_worker(path: Path, release: dict) -> None:
    if not path.exists():
        return
    s = path.read_text(encoding="utf-8")
    cache = f"ww-v{release['version'].replace('.', '-')}-b{release['build']}-glb4-5"
    s, n = re.subn(r'const C="[^"]+";', f'const C="{cache}";', s, count=1)
    if n != 1:
        raise RuntimeError(f"Cache-Konstante nicht gefunden: {path}")
    if '"./version.js"' not in s:
        anchor = '"./configurator3d.js"'
        if anchor in s:
            s = s.replace(anchor, anchor + ',"./version.js"', 1)
        else:
            s = s.replace('const A=[', 'const A=["./version.js",', 1)
    path.write_text(s, encoding="utf-8")


def patch_android_gradle(release: dict) -> None:
    s = ANDROID_GRADLE.read_text(encoding="utf-8")
    s, n1 = re.subn(r"versionCode\s*=\s*\d+", f"versionCode = {release['build']}", s, count=1)
    s, n2 = re.subn(r"versionName\s*=\s*['\"][^'\"]+['\"]", f"versionName = '{release['version']}'", s, count=1)
    if n1 != 1 or n2 != 1:
        raise RuntimeError("Android versionCode/versionName konnte nicht aktualisiert werden")
    ANDROID_GRADLE.write_text(s, encoding="utf-8")


def sync_web(release: dict) -> None:
    (WWW / "version.js").write_text(version_js(release), encoding="utf-8")
    patch_index(WWW / "index.html")
    patch_service_worker(WWW / "sw.js", release)


def sync_android_bundle(release: dict) -> None:
    patch_android_gradle(release)
    if ANDROID_ASSETS.exists():
        shutil.rmtree(ANDROID_ASSETS)
    shutil.copytree(WWW, ANDROID_ASSETS)


def export_ci_env(release: dict) -> None:
    env_file = os.environ.get("GITHUB_ENV")
    if not env_file:
        return
    with open(env_file, "a", encoding="utf-8") as f:
        f.write(f"APP_VERSION={release['version']}\n")
        f.write(f"APP_BUILD={release['build']}\n")
        f.write(f"RENDERER_VERSION={release.get('renderer', '')}\n")


def main() -> None:
    ap = argparse.ArgumentParser(description="Prepare the canonical www bundle and native release metadata")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--web", action="store_true", help="Prepare canonical www bundle")
    mode.add_argument("--repo", action="store_true", help="Prepare www plus checked-in Android version metadata")
    mode.add_argument("--android", action="store_true", help="Prepare www and copy it into Android assets")
    args = ap.parse_args()

    release = load_release()
    sync_web(release)
    if args.repo or args.android:
        patch_android_gradle(release)
    if args.android:
        # Copy only after www is fully prepared. This makes www the one source of truth.
        if ANDROID_ASSETS.exists():
            shutil.rmtree(ANDROID_ASSETS)
        shutil.copytree(WWW, ANDROID_ASSETS)
    export_ci_env(release)
    print(f"Prepared Werkers Simson V{release['version']} build {release['build']} ({release.get('renderer','')})")


if __name__ == "__main__":
    main()
