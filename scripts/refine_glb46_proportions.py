from pathlib import Path
import json, re, subprocess

ROOT = Path('.')


def rep(s, old, new, label):
    if old not in s:
        raise SystemExit(f'Missing pattern: {label}')
    return s.replace(old, new, 1)


def patch_renderer(path: Path):
    s = path.read_text(encoding='utf-8')
    s = rep(s,
        "let yaw = -0.52, pitch = -0.075, distance = 8.60, dragging = false, px = 0, py = 0, raf = 0;",
        "let yaw = -0.52, pitch = -0.055, distance = 7.05, dragging = false, px = 0, py = 0, raf = 0;",
        'default camera')

    s = rep(s,
        "const base=xform([.02,-.57,0]);",
        "const base=xform([.02,-.48,0],[.80,.80,.84]);",
        'engine scale')

    s = rep(s,
        "if(meshes.glbTank)draw('glbTank',xform([-.17,.78,0],[1,1,1],[0,0,-.035]),paint,vp);",
        "if(meshes.glbTank)draw('glbTank',xform([-.10,.86,0],[.88,.90,.92],[0,0,-.025]),paint,vp);",
        'tank transform')

    s = rep(s,
        "if(meshes.glbSidecover)draw('glbSidecover',xform([-.28,.02,-.31],[1,1,1],[0,0,-.10]),side,vp);",
        "if(meshes.glbSidecover)draw('glbSidecover',xform([-.18,.14,-.28],[.78,.84,.86],[0,0,-.075]),side,vp);",
        'left sidecover')
    s = rep(s,
        "if(meshes.glbSidecover)draw('glbSidecover',xform([-.28,.02,.31],[1,1,1],[0,0,-.10]),side,vp);",
        "if(meshes.glbSidecover)draw('glbSidecover',xform([-.18,.14,.28],[.78,.84,.86],[0,0,-.075]),side,vp);",
        'right sidecover')

    s = rep(s,
        "if(meshes[seatMesh])draw(seatMesh,xform(),dark,vp);",
        "if(meshes[seatMesh])draw(seatMesh,xform([.05,.02,0],[.84,.96,.96]),dark,vp);",
        'seat transform')

    s = rep(s,
        "if(meshes[barMesh])draw(barMesh,xform(),barColor,vp);",
        "if(meshes[barMesh])draw(barMesh,xform([0,0,0],[.82,.98,1]),barColor,vp);",
        'handlebar transform')
    s = rep(s,
        "if(meshes.glbCockpit)draw('glbCockpit',xform(),dark,vp);",
        "if(meshes.glbCockpit)draw('glbCockpit',xform([0,0,0],[.82,.98,1]),dark,vp);",
        'cockpit transform')
    s = rep(s,
        "if(meshes.glbHeadlightShell)draw('glbHeadlightShell',xform(),dark,vp);",
        "if(meshes.glbHeadlightShell)draw('glbHeadlightShell',xform([0,0,0],[.82,.98,1]),dark,vp);",
        'headlight shell transform')
    s = rep(s,
        "if(meshes[lensMesh])draw(lensMesh,xform(),lensColor,vp);",
        "if(meshes[lensMesh])draw(lensMesh,xform([0,0,0],[.82,.98,1]),lensColor,vp);",
        'headlight lens transform')
    s = rep(s,
        "if(meshes.glbIndicatorsFront)draw('glbIndicatorsFront',xform(),[.94,.46,.05],vp);",
        "if(meshes.glbIndicatorsFront)draw('glbIndicatorsFront',xform([0,0,0],[.82,.98,1]),[.94,.46,.05],vp);",
        'front indicators transform')

    s = rep(s,
        "if(meshes.glbFrame)draw('glbFrame',xform(),dark,vp);",
        "if(meshes.glbFrame)draw('glbFrame',xform([0,0,0],[.82,.98,1]),dark,vp);",
        'frame transform')
    s = rep(s,
        "if(meshes.glbSwingarm)draw('glbSwingarm',xform([0,ry+1.05,0]),dark,vp);",
        "if(meshes.glbSwingarm)draw('glbSwingarm',xform([0,ry+1.05,0],[.82,.98,1]),dark,vp);",
        'swingarm transform')
    s = rep(s,
        "if(meshes.glbFork)draw('glbFork',xform([0,fy+1.05,0]),forkColor,vp);",
        "if(meshes.glbFork)draw('glbFork',xform([0,fy+1.05,0],[.82,.98,1]),forkColor,vp);",
        'fork transform')
    s = rep(s,
        "if(meshes[shockMesh])draw(shockMesh,xform(),sh,vp);",
        "if(meshes[shockMesh])draw(shockMesh,xform([0,0,0],[.82,.98,1]),sh,vp);",
        'shock transform')
    s = rep(s,
        "if(meshes.glbFrontFenderEnduro)draw('glbFrontFenderEnduro',xform([0,fenderDelta,0]),dark,vp);",
        "if(meshes.glbFrontFenderEnduro)draw('glbFrontFenderEnduro',xform([-.43,fenderDelta,0]),dark,vp);",
        'front enduro fender shift')
    s = rep(s,
        "if(meshes.glbFrontFenderClassic)draw('glbFrontFenderClassic',xform([0,fenderDelta,0]),fc,vp);",
        "if(meshes.glbFrontFenderClassic)draw('glbFrontFenderClassic',xform([-.43,fenderDelta,0]),fc,vp);",
        'front classic fender shift')
    s = rep(s,
        "if(meshes.glbRearFender)draw('glbRearFender',xform([0,rearDelta,0]),rearColor,vp);",
        "if(meshes.glbRearFender)draw('glbRearFender',xform([.37,rearDelta,0]),rearColor,vp);",
        'rear fender shift')

    s = rep(s,
        "if(meshes[key]){draw(key,xform(),ex,vp);return}",
        "if(meshes[key]){draw(key,xform([0,0,0],[.82,.98,1]),ex,vp);return}",
        'exhaust transform')

    s = rep(s,
        "if(meshes.glbTaillight)draw('glbTaillight',xform(),[.62,.03,.02],vp);",
        "if(meshes.glbTaillight)draw('glbTaillight',xform([0,0,0],[.82,.98,1]),[.62,.03,.02],vp);",
        'taillight transform')
    s = rep(s,
        "if(meshes.glbLicenseplate)draw('glbLicenseplate',xform(),[.84,.84,.80],vp);",
        "if(meshes.glbLicenseplate)draw('glbLicenseplate',xform([0,0,0],[.82,.98,1]),[.84,.84,.80],vp);",
        'licenseplate transform')
    s = rep(s,
        "if(meshes.glbIndicatorsRear)draw('glbIndicatorsRear',xform(),[.94,.46,.05],vp);",
        "if(meshes.glbIndicatorsRear)draw('glbIndicatorsRear',xform([0,0,0],[.82,.98,1]),[.94,.46,.05],vp);",
        'rear indicators transform')

    s = rep(s,
        "const enduro=c.base==='enduro',wr={16:.82,17:.85,18:.88,19:.91}[c.wheelSize||16]||.82,ry=-1.03+(c.shock==='long'?.12:0),fy=-1.03+(c.fork==='enduro'?.12:0);",
        "const enduro=c.base==='enduro',wr={16:.82,17:.85,18:.88,19:.91}[c.wheelSize||16]||.82,ry=-1.03+(c.shock==='long'?.12:0),fy=-1.03+(c.fork==='enduro'?.12:0),rearX=-1.68,frontX=1.72;",
        'wheel centers')
    s = rep(s,
        "draw('cube',xform([0,-1.90,0],[3.45,.035,1.38]),[.79,.78,.74],vp,{spec:.06,rough:.94});",
        "draw('cube',xform([0,-1.90,0],[2.90,.035,1.24]),[.79,.78,.74],vp,{spec:.06,rough:.94});",
        'floor')
    s = rep(s,
        "draw('sphere',xform([-2.05,-1.835,0],[.76,.026,.44]),[.025,.025,.025],vp,{spec:0,rough:1,alpha:.16});",
        "draw('sphere',xform([rearX,-1.835,0],[.70,.026,.40]),[.025,.025,.025],vp,{spec:0,rough:1,alpha:.16});",
        'rear shadow')
    s = rep(s,
        "draw('sphere',xform([2.15,-1.835,0],[.76,.026,.44]),[.025,.025,.025],vp,{spec:0,rough:1,alpha:.16});",
        "draw('sphere',xform([frontX,-1.835,0],[.70,.026,.40]),[.025,.025,.025],vp,{spec:0,rough:1,alpha:.16});",
        'front shadow')
    s = rep(s,
        "drawWheel(-2.05,ry,wr,false,c,vp,chrome,dark);drawWheel(2.15,fy,wr,true,c,vp,chrome,dark);",
        "drawWheel(rearX,ry,wr,false,c,vp,chrome,dark);drawWheel(frontX,fy,wr,true,c,vp,chrome,dark);",
        'wheel draw centers')

    s = rep(s,
        "const asp=canvas.width/canvas.height,proj=M.p(Math.PI/4.5,asp,.1,100),view=M.mul(M.t(0,-.03,-distance),M.mul(M.rx(pitch),M.ry(yaw))),vp=M.mul(proj,view);",
        "const asp=canvas.width/canvas.height,proj=M.p(Math.PI/4.9,asp,.1,100),view=M.mul(M.t(0,-.05,-distance),M.mul(M.rx(pitch),M.ry(yaw))),vp=M.mul(proj,view);",
        'projection')
    s = rep(s,
        "function camera(name){if(name==='side'){yaw=-.02;pitch=-.055;distance=8.45}else if(name==='three'){yaw=-.52;pitch=-.075;distance=8.60}else if(name==='front'){yaw=-1.56;pitch=-.06;distance=8.30}else if(name==='rear'){yaw=1.56;pitch=-.06;distance=8.30}else{yaw=-.52;pitch=-.075;distance=8.60}}",
        "function camera(name){if(name==='side'){yaw=-.02;pitch=-.045;distance=6.95}else if(name==='three'){yaw=-.52;pitch=-.055;distance=7.05}else if(name==='front'){yaw=-1.56;pitch=-.045;distance=6.75}else if(name==='rear'){yaw=1.56;pitch=-.045;distance=6.75}else{yaw=-.52;pitch=-.055;distance=7.05}}",
        'camera presets')
    s = rep(s,
        "S51 3D · GLB 4.5 STUDIO",
        "S51 3D · GLB 4.6 PROPORTION",
        'renderer label')
    s = rep(s,
        "<b>GLB 4.5</b>",
        "<b>GLB 4.6</b>",
        'renderer badge')

    path.write_text(s, encoding='utf-8')


for p in [ROOT/'www/configurator3d.js', ROOT/'configurator3d.js']:
    patch_renderer(p)

# Central release metadata
vf = ROOT/'app-version.json'
release = json.loads(vf.read_text(encoding='utf-8'))
release.update({
    'version':'4.6.0',
    'build':4601,
    'renderer':'GLB 4.6 Proportion',
    'channel':'beta',
    'source':'www',
    'releaseDate':'2026-08-20'
})
vf.write_text(json.dumps(release, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Make cache naming renderer-driven instead of hardcoded GLB 4.5.
prep = ROOT/'scripts/prepare_release.py'
s = prep.read_text(encoding='utf-8')
old = "cache = f\"ww-v{release['version'].replace('.', '-')}-b{release['build']}-glb4-5\""
new = "renderer_slug = re.sub(r'[^a-z0-9]+', '-', release.get('renderer','').lower()).strip('-') or 'renderer'\n    cache = f\"ww-v{release['version'].replace('.', '-')}-b{release['build']}-{renderer_slug}\""
if old in s:
    s = s.replace(old,new,1)
prep.write_text(s, encoding='utf-8')

# Remove hard-coded release checks from Android build workflow.
wf = ROOT/'.github/workflows/build-aab.yml'
s = wf.read_text(encoding='utf-8')
s = s.replace("grep -q '4.5.0' android-store-project/app/src/main/assets/version.js", "grep -Fq \"$APP_VERSION\" android-store-project/app/src/main/assets/version.js")
s = s.replace("grep -q 'GLB 4.5' android-store-project/app/src/main/assets/configurator3d.js", "grep -Fq \"$RENDERER_VERSION\" android-store-project/app/src/main/assets/version.js")
s = s.replace("grep -q 'versionCode = 4501' android-store-project/app/build.gradle", "grep -Fq \"versionCode = $APP_BUILD\" android-store-project/app/build.gradle")
wf.write_text(s, encoding='utf-8')

# Refresh generated web metadata and checked-in Android version metadata.
subprocess.run(['python3','scripts/prepare_release.py','--repo'], check=True)
print('GLB 4.6 proportion correction prepared.')
