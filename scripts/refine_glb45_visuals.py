from pathlib import Path
import json,re

ROOT=Path('.')

OLD_FS="""  const fs = `precision mediump float;varying vec3 vN;varying vec3 vP;uniform vec3 uColor;void main(){vec3 n=normalize(vN);vec3 l=normalize(vec3(.35,.82,.58));float d=max(dot(n,l),0.0);float rim=pow(1.0-abs(n.z),2.0)*.10;float floorShade=clamp((vP.y+2.1)*.03,0.0,.08);float a=.25+d*.68+rim+floorShade;gl_FragColor=vec4(uColor*a,1.0);}`;"""
NEW_FS="""  const fs = `precision mediump float;varying vec3 vN;varying vec3 vP;uniform vec3 uColor;uniform float uSpec;uniform float uRough;uniform float uEmit;uniform float uAlpha;void main(){vec3 n=normalize(vN);vec3 l1=normalize(vec3(.38,.86,.42));vec3 l2=normalize(vec3(-.72,.32,.62));vec3 v=normalize(vec3(0.0,1.35,7.0)-vP);float d1=max(dot(n,l1),0.0);float d2=max(dot(n,l2),0.0);vec3 h1=normalize(l1+v);vec3 h2=normalize(l2+v);float sh=mix(88.0,14.0,clamp(uRough,0.0,1.0));float sp1=pow(max(dot(n,h1),0.0),sh)*uSpec;float sp2=pow(max(dot(n,h2),0.0),max(8.0,sh*.55))*uSpec*.34;float hemi=.24+.16*(n.y*.5+.5);float rim=pow(1.0-abs(dot(n,v)),2.4)*.08;vec3 col=uColor*(hemi+d1*.64+d2*.20)+vec3(sp1*.88+sp2)+uColor*uEmit+vec3(rim);col=pow(max(col,vec3(0.0)),vec3(.92));gl_FragColor=vec4(col,uAlpha);}`;"""

OLD_DRAW="""  function draw(meshName,model,color,vp){const me=meshes[meshName],mvp=M.mul(vp,model);gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,new Float32Array(mvp));gl.uniformMatrix4fv(gl.getUniformLocation(program,'uModel'),false,new Float32Array(model));gl.uniform3fv(gl.getUniformLocation(program,'uColor'),new Float32Array(color));const ap=gl.getAttribLocation(program,'aPos'),an=gl.getAttribLocation(program,'aNormal');gl.bindBuffer(gl.ARRAY_BUFFER,me.p);gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,me.n);gl.enableVertexAttribArray(an);gl.vertexAttribPointer(an,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,me.i);gl.drawElements(gl.TRIANGLES,me.count,gl.UNSIGNED_SHORT,0)}"""
NEW_DRAW="""  function materialFor(meshName,color){const k=(meshName||'').toLowerCase();let m={spec:.16,rough:.58,emit:0,alpha:1};if(k.includes('tank')||k.includes('sidecover'))m={spec:.52,rough:.22,emit:0,alpha:1};if(k.includes('wheel'))m={spec:.07,rough:.86,emit:0,alpha:1};if(k.includes('rim')||k.includes('spokes')||k.includes('hub')||k.includes('brakedisc'))m={spec:.88,rough:.12,emit:0,alpha:1};if(k.includes('engine')||k.includes('fork')||k.includes('exhaust')||k.includes('handlebar'))m={spec:.66,rough:.24,emit:0,alpha:1};if(k.includes('frame')||k.includes('swingarm'))m={spec:.24,rough:.48,emit:0,alpha:1};if(k.includes('headlight'))m={spec:.42,rough:.20,emit:.22,alpha:1};if(k.includes('taillight')||k.includes('indicator'))m={spec:.32,rough:.28,emit:.18,alpha:1};return m}
  function draw(meshName,model,color,vp,override){const me=meshes[meshName];if(!me)return;const mvp=M.mul(vp,model),mat=Object.assign(materialFor(meshName,color),override||{});gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,new Float32Array(mvp));gl.uniformMatrix4fv(gl.getUniformLocation(program,'uModel'),false,new Float32Array(model));gl.uniform3fv(gl.getUniformLocation(program,'uColor'),new Float32Array(color));gl.uniform1f(gl.getUniformLocation(program,'uSpec'),mat.spec);gl.uniform1f(gl.getUniformLocation(program,'uRough'),mat.rough);gl.uniform1f(gl.getUniformLocation(program,'uEmit'),mat.emit);gl.uniform1f(gl.getUniformLocation(program,'uAlpha'),mat.alpha);const ap=gl.getAttribLocation(program,'aPos'),an=gl.getAttribLocation(program,'aNormal');gl.bindBuffer(gl.ARRAY_BUFFER,me.p);gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,me.n);gl.enableVertexAttribArray(an);gl.vertexAttribPointer(an,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,me.i);gl.drawElements(gl.TRIANGLES,me.count,gl.UNSIGNED_SHORT,0)}"""

OLD_SCENE_HEAD="""    const enduro=c.base==='enduro',wr={16:.78,17:.82,18:.86,19:.90}[c.wheelSize||16]||.78,ry=-1.05+(c.shock==='long'?.12:0),fy=-1.05+(c.fork==='enduro'?.12:0);
    draw('cube',xform([0,-1.90,0],[3.45,.035,1.38]),[.73,.72,.68],vp);
    draw('sphere',xform([-2.05,-1.84,0],[.72,.035,.38]),[.40,.40,.38],vp);draw('sphere',xform([2.15,-1.84,0],[.72,.035,.38]),[.40,.40,.38],vp);"""
NEW_SCENE_HEAD="""    const enduro=c.base==='enduro',wr={16:.82,17:.85,18:.88,19:.91}[c.wheelSize||16]||.82,ry=-1.03+(c.shock==='long'?.12:0),fy=-1.03+(c.fork==='enduro'?.12:0);
    draw('cube',xform([0,-1.90,0],[3.45,.035,1.38]),[.79,.78,.74],vp,{spec:.06,rough:.94});
    draw('sphere',xform([-2.05,-1.835,0],[.76,.026,.44]),[.025,.025,.025],vp,{spec:0,rough:1,alpha:.16});
    draw('sphere',xform([2.15,-1.835,0],[.76,.026,.44]),[.025,.025,.025],vp,{spec:0,rough:1,alpha:.16});
    draw('sphere',xform([.05,-1.845,0],[2.05,.018,.50]),[.035,.035,.035],vp,{spec:0,rough:1,alpha:.055});"""

OLD_RENDER="""  function render(){if(!active||!gl||!canvas)return;resize();gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(.91,.90,.86,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const asp=canvas.width/canvas.height,proj=M.p(Math.PI/4,asp,.1,100),view=M.mul(M.t(0,-.05,-distance),M.mul(M.rx(pitch),M.ry(yaw))),vp=M.mul(proj,view);scene(vp);raf=requestAnimationFrame(render)}"""
NEW_RENDER="""  function render(){if(!active||!gl||!canvas)return;resize();gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const asp=canvas.width/canvas.height,proj=M.p(Math.PI/4.5,asp,.1,100),view=M.mul(M.t(0,-.03,-distance),M.mul(M.rx(pitch),M.ry(yaw))),vp=M.mul(proj,view);scene(vp);raf=requestAnimationFrame(render)}"""

OLD_CAMERA="""  function camera(name){if(name==='side'){yaw=-.02;pitch=-.06;distance=8.1}else if(name==='three'){yaw=-.58;pitch=-.10;distance=8.35}else if(name==='front'){yaw=-1.56;pitch=-.08;distance=8.0}else if(name==='rear'){yaw=1.56;pitch=-.08;distance=8.0}else{yaw=-.58;pitch=-.10;distance=8.35}}"""
NEW_CAMERA="""  function camera(name){if(name==='side'){yaw=-.02;pitch=-.055;distance=8.45}else if(name==='three'){yaw=-.52;pitch=-.075;distance=8.60}else if(name==='front'){yaw=-1.56;pitch=-.06;distance=8.30}else if(name==='rear'){yaw=1.56;pitch=-.06;distance=8.30}else{yaw=-.52;pitch=-.075;distance=8.60}}"""

OLD_MOUNT_CTX="""gl=canvas.getContext('webgl',{antialias:true,alpha:false});"""
NEW_MOUNT_CTX="""gl=canvas.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false});"""

for path in [ROOT/'configurator3d.js',ROOT/'www/configurator3d.js']:
    s=path.read_text(encoding='utf-8')
    for old,new,name in [(OLD_FS,NEW_FS,'shader'),(OLD_DRAW,NEW_DRAW,'draw'),(OLD_SCENE_HEAD,NEW_SCENE_HEAD,'scene'),(OLD_RENDER,NEW_RENDER,'render'),(OLD_CAMERA,NEW_CAMERA,'camera'),(OLD_MOUNT_CTX,NEW_MOUNT_CTX,'context')]:
        if old not in s: raise RuntimeError(f'{name} anchor missing in {path}')
        s=s.replace(old,new,1)
    s=s.replace("let yaw = -0.58, pitch = -0.10, distance = 8.35", "let yaw = -0.52, pitch = -0.075, distance = 8.60",1)
    s=s.replace('S51 3D · GLB 4.4','S51 3D · GLB 4.5 STUDIO').replace('<b>GLB 4.4</b>','<b>GLB 4.5</b>')
    s=s.replace('Tank · Seitendeckel · Rahmen · Cockpit · Blinker · Vergaser · Motor · Räder · rechter Auspuff','Studio-Materiallicht · Lackglanz · Chromreflexe · Kontaktschatten · optimierte Proportionen')
    path.write_text(s,encoding='utf-8')

css="""/* S51 Konfigurator · GLB 4.5 Studio Quality */
.config3dTop{display:flex;gap:10px;align-items:center;padding:10px 12px;background:#101112;color:#fff;border-bottom:1px solid #222}.config3dTop b{font-size:12px;text-transform:uppercase;letter-spacing:.07em}.config3dTop span{font-size:11px;color:#c4c6c7;flex:1}.config3dTop button{border:1px solid #d9ff39;background:#101112;color:#d9ff39;padding:7px 10px;font-weight:bold}.config3dBtn{background:#d9ff39!important;color:#111!important;border-color:#111!important}.configPreviewFrame:has(#config3dCanvas){background:radial-gradient(circle at 50% 18%,#ffffff 0%,#f3f1eb 42%,#e2ded4 72%,#cbc6ba 100%);box-shadow:inset 0 0 70px rgba(0,0,0,.07)}.configPreviewFrame #config3dCanvas{display:block;width:100%;height:500px;touch-action:none;cursor:grab;background:transparent;filter:saturate(1.03) contrast(1.015)}.configPreviewFrame #config3dCanvas:active{cursor:grabbing}.config3dCamera{display:flex;gap:6px;flex-wrap:wrap;padding:8px 10px;background:rgba(248,246,240,.96);border-bottom:1px solid #cbc6ba}.config3dCamera button{border:1px solid #171819;background:#fff;color:#111;padding:6px 9px;font-size:11px;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,.04)}.config3dCamera button:hover{background:#111;color:#fff}.config3dFoot{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 12px;border-top:1px solid #c7c2b6;background:rgba(248,246,240,.96);font-size:10px;color:#606266}.config3dFoot b{color:#111;letter-spacing:.09em;background:#d9ff39;padding:3px 6px}.config3dUnavailable{padding:18px;background:#fff;border:1px solid #111}.config3dTop,.config3dCamera,.config3dFoot{user-select:none}
@media(max-width:760px){.configPreviewFrame #config3dCanvas{height:420px}.config3dTop{flex-wrap:wrap}.config3dTop span{flex-basis:100%;order:3}.config3dTop button{margin-left:auto}.config3dCamera{overflow-x:auto;flex-wrap:nowrap}.config3dCamera button{white-space:nowrap}}
@media(max-width:480px){.configPreviewFrame #config3dCanvas{height:360px}.config3dFoot{align-items:flex-start;flex-direction:column}.config3dTop b{font-size:11px}.config3dCamera{padding:7px}.config3dCamera button{padding:6px 8px;font-size:10px}}
"""
for path in [ROOT/'configurator3d.css',ROOT/'www/configurator3d.css']:
    path.write_text(css,encoding='utf-8')

for path in [ROOT/'sw.js',ROOT/'www/sw.js']:
    s=path.read_text(encoding='utf-8')
    s=s.replace('ww-v3-9-configurator-glb4-4','ww-v3-9-configurator-glb4-5')
    path.write_text(s,encoding='utf-8')

for path in [ROOT/'assets/models/manifest.json',ROOT/'www/assets/models/manifest.json']:
    d=json.loads(path.read_text(encoding='utf-8'))
    d['version']='visual-quality-1'
    d['quality']={'renderer':'GLB 4.5 Studio','lighting':'dual-key studio light with specular material response','presentation':'transparent WebGL over radial studio background with contact shadows','proportions':'larger wheel envelope and refined camera/stance'}
    path.write_text(json.dumps(d,indent=2),encoding='utf-8')

print('GLB 4.5 studio visual refinement applied')
