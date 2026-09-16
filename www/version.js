/* Auto-generated from app-version.json. Do not edit by hand. */
(() => {
  const release = {"version":"5.0.1","build":50001,"renderer":"GLB 5.0 Studio","channel":"beta","source":"www","releaseDate":"2026-09-16"};
  window.WERKERS_RELEASE = Object.freeze(release);

  function applyReleaseLabel() {
    const label = document.querySelector('.brand small');
    if (label) label.textContent = `SIMSON KULT & TECHNIK · V${release.version} · B${release.build}`;
    document.title = `Werkers Werkstatt – Simson V${release.version} · Build ${release.build}`;
    document.documentElement.dataset.appVersion = release.version;
    document.documentElement.dataset.appBuild = String(release.build);
    document.documentElement.dataset.renderer = release.renderer || '';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyReleaseLabel, {once:true});
  else applyReleaseLabel();
})();
