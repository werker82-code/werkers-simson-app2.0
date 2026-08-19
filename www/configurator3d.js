(() => {
  const KEY = 'ww_s51_config_current_v1';
  let active = false, host = null, canvas = null, gl = null, program = null;
  let yaw = -0.58, pitch = -0.12, distance = 8.35, dragging = false, px = 0, py = 0, raf = 0;
  let meshes = {}, wrapped = false;

  const vs = `attribute vec3 aPos;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vN;void main(){gl_Position=uMVP*vec4(aPos,1.0);vN=mat3(uModel)*aNormal;}`;
  const fs = `precision mediump float;varying vec3 vN;uniform vec3 uColor;void main(){vec3 n=normalize(vN);vec3 l=normalize(vec3(.42,.78,.62));float d=max(dot(n,l),0.0);float rim=pow(1.0-max(dot(n,vec3(0.0,0.0,1.0)),0.0),2.0)*.08;float a=.27+d*.70+rim;gl_FragColor=vec4(uColor*a,1.0);}`;

  const M = {
    id(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]},
    mul(a,b){const o=new Array(16).fill(0);for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o},
    t(x,y,z){let m=this.id();m[12]=x;m[13]=y;m[14]=z;return m},
    s(x,y,z){let m=this.id();m[0]=x;m[5]=y;m[10]=z;return m},
    rx(a){let c=Math.cos(a),s=Math.sin(a),m=this.id();m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m},
    ry(a){let c=Math.cos(a),s=Math.sin(a),m=this.id();m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m},
    rz(a){let c=Math.cos(a),s=Math.sin(a),m=this.id();m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m},
    p(fov,asp,n,f){let q=1/Math.tan(fov/2),nf=1/(n-f);return [q/asp,0,0,0,0,q,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0]}
  };

  function cfg(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}}
  function hex(h){h=(h||'#777').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]}
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  function mkProgram(){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
  function mesh(pos,nor,idx){const p=gl.createBuffer(),n=gl.createBuffer(),i=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(nor),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);return {p,n,i,count:idx.length}}

  function cube(){const p=[-1,-1,1,1,-1,1,1,1,1,-1,1,1,1,-1,-1,-1,-1,-1,-1,1,-1,1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,-1,1,1,-1,-1,1,1,-1,1,1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1];const n=[0,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,1,0,0,1,0,0,1,0,0,1,0,0,-1,0,0,-1,0,0,-1,0,0,-1,0,0];let idx=[];for(let f=0;f<6;f++){let o=f*4;idx.push(o,o+1,o+2,o,o+2,o+3)}return mesh(p,n,idx)}
  function uvSphere(seg=24,ring=14){let p=[],n=[],idx=[];for(let y=0;y<=ring;y++){let v=y/ring,ph=v*Math.PI;for(let x=0;x<=seg;x++){let u=x/seg,th=u*Math.PI*2,s=Math.sin(ph),nx=Math.cos(th)*s,ny=Math.cos(ph),nz=Math.sin(th)*s;p.push(nx,ny,nz);n.push(nx,ny,nz)}}for(let y=0;y<ring;y++)for(let x=0;x<seg;x++){let a=y*(seg+1)+x,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1)}return mesh(p,n,idx)}
  function torus(rs=.72,rt=.14,seg=32,tube=12){let p=[],n=[],idx=[];for(let i=0;i<=seg;i++){let u=i/seg*Math.PI*2,cu=Math.cos(u),su=Math.sin(u);for(let j=0;j<=tube;j++){let v=j/tube*Math.PI*2,cv=Math.cos(v),sv=Math.sin(v),x=(rs+rt*cv)*cu,y=(rs+rt*cv)*su,z=rt*sv;p.push(x,y,z);n.push(cv*cu,cv*su,sv)}}for(let i=0;i<seg;i++)for(let j=0;j<tube;j++){let a=i*(tube+1)+j,b=a+tube+1;idx.push(a,b,a+1,b,b+1,a+1)}return mesh(p,n,idx)}
  function cyl(seg=22){let p=[],n=[],idx=[];for(let i=0;i<=seg;i++){let a=i/seg*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(c,-1,s,c,1,s);n.push(c,0,s,c,0,s)}for(let i=0;i<seg;i++){let a=i*2,b=a+2;idx.push(a,a+1,b,a+1,b+1,b)}return mesh(p,n,idx)}

  function initMeshes(){meshes={cube:cube(),sphere:uvSphere(),torus:torus(),cyl:cyl()}}
  function draw(meshName,model,color,vp){const me=meshes[meshName],mvp=M.mul(vp,model);gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,new Float32Array(mvp));gl.uniformMatrix4fv(gl.getUniformLocation(program,'uModel'),false,new Float32Array(model));gl.uniform3fv(gl.getUniformLocation(program,'uColor'),new Float32Array(color));const ap=gl.getAttribLocation(program,'aPos'),an=gl.getAttribLocation(program,'aNormal');gl.bindBuffer(gl.ARRAY_BUFFER,me.p);gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,me.n);gl.enableVertexAttribArray(an);gl.vertexAttribPointer(an,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,me.i);gl.drawElements(gl.TRIANGLES,me.count,gl.UNSIGNED_SHORT,0)}
  function xform(t=[0,0,0],s=[1,1,1],r=[0,0,0]){return M.mul(M.t(...t),M.mul(M.rz(r[2]),M.mul(M.ry(r[1]),M.mul(M.rx(r[0]),M.s(...s)))))}
  function tubeBetween(a,b,r=.07){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,mz=(a[2]+b[2])/2;const yaw=Math.atan2(dx,dz),pitch=Math.atan2(Math.hypot(dx,dz),dy);return xform([mx,my,mz],[r,len/2,r],[pitch,yaw,0])}
  function axleModel(x,y,z,r=.16,w=.20){return xform([x,y,z],[r,w,r],[Math.PI/2,0,0])}

  function drawWheel(cx,cy,wr,front,c,vp,chrome,dark){
    const tire=[.025,.026,.027], rim=c.rim==='black'?[.08,.085,.09]:c.rim==='polished'?[.86,.88,.88]:[.63,.66,.67];
    draw('torus',xform([cx,cy,0],[wr,wr,wr]),tire,vp);
    draw('torus',xform([cx,cy,0],[wr*.79,wr*.79,wr*.79]),rim,vp);
    if(c.tire==='enduro'){
      for(let i=0;i<18;i++){const a=i*Math.PI*2/18,x=cx+Math.cos(a)*wr*.90,y=cy+Math.sin(a)*wr*.90;draw('cube',xform([x,y,0],[.055,.11,.19],[0,0,a]),[.035,.035,.035],vp)}
    }
    const type=c.wheelType||'spokes', n=type==='star5'?5:type==='star10'?10:18, spokeR=type==='spokes'?.018:type==='star5'?.055:.04;
    for(let i=0;i<n;i++){const a=i*Math.PI*2/n,rr=wr*.62,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;draw('cyl',tubeBetween([cx,cy,0],[x,y,0],spokeR),type==='spokes'?chrome:rim,vp)}
    draw('cyl',axleModel(cx,cy,0,.12,.21),chrome,vp);
    if(front&&c.brake==='disc'){
      draw('cyl',axleModel(cx,cy,-.13,wr*.37,.018),[.62,.64,.64],vp);
      for(let i=0;i<10;i++){const a=i*Math.PI*2/10,x=cx+Math.cos(a)*wr*.25,y=cy+Math.sin(a)*wr*.25;draw('sphere',xform([x,y,-.155],[.025,.025,.018]),dark,vp)}
      draw('cube',xform([cx+wr*.30,cy-.02,-.22],[.12,.20,.10],[0,0,-.15]),dark,vp);
    } else if(front){
      draw('cyl',axleModel(cx,cy,-.02,.23,.16),[.47,.49,.49],vp);
    } else {
      draw('cyl',axleModel(cx,cy,-.02,.22,.14),[.47,.49,.49],vp);
      draw('cube',xform([cx-.18,cy-.03,.13],[.08,.18,.08]),dark,vp);
    }
  }

  function drawEngine(c,vp,metal,dark,chrome){
    const fin=c.engine==='black'?[.20,.21,.21]:[.40,.42,.42];
    draw('sphere',xform([.03,-.55,0],[.58,.44,.46]),metal,vp);
    draw('sphere',xform([.16,-.55,-.34],[.43,.36,.12]),metal,vp);
    draw('cyl',axleModel(.16,-.55,-.47,.20,.045),c.engine==='black'?[.16,.17,.17]:[.57,.59,.59],vp);
    for(let i=0;i<7;i++) draw('cube',xform([.03,-.12+i*.075,0],[.37,.025,.37]),fin,vp);
    for(let i=0;i<4;i++) draw('cube',xform([.03,.42+i*.055,0],[.45,.020,.42]),fin,vp);
    draw('cyl',tubeBetween([.03,.66,0],[.04,.86,0],.045),[.82,.82,.78],vp);
    draw('cube',xform([.04,.88,0],[.07,.04,.06]),dark,vp);
    draw('cyl',tubeBetween([.42,-.78,-.36],[.82,-.93,-.36],.035),chrome,vp);
    draw('cube',xform([.87,-.96,-.36],[.18,.04,.08],[0,0,-.1]),dark,vp);
    draw('cyl',tubeBetween([-.32,-.72,-.24],[-.72,-.90,-.24],.035),chrome,vp);
    draw('cube',xform([-.78,-.92,-.24],[.18,.04,.08]),dark,vp);
  }

  function drawTankAndBody(c,vp,paint,side,dark,chrome,enduro){
    draw('sphere',xform([-.12,.75,0],[1.00,.37,.43],[0,0,-.04]),paint,vp);
    draw('sphere',xform([.53,.73,0],[.45,.32,.40],[0,0,-.13]),paint,vp);
    draw('cube',xform([-.72,.67,0],[.34,.24,.38],[0,0,.10]),paint,vp);
    draw('sphere',xform([-.30,.04,-.03],[.58,.39,.28],[0,0,-.12]),side,vp);
    draw('sphere',xform([-.30,.04,.23],[.48,.32,.08],[0,0,-.12]),side,vp);
    draw('cube',xform([-.55,1.19,0],[1.10,.16,.36],[0,0,.025]),dark,vp);
    draw('cube',xform([-.62,1.34,0],[.58,.06,.33],[0,0,.02]),[.11,.11,.11],vp);
    if(enduro) draw('cube',xform([-.76,.93,-.39],[.33,.07,.04],[0,0,.02]),dark,vp);
    draw('cyl',tubeBetween([-.96,.54,-.30],[-.96,.15,-.30],.026),chrome,vp);
  }

  function scene(vp){
    const c=cfg(),paint=hex(c.tankColor||'#2f608f'),side=hex(c.sideColor||c.tankColor||'#2f608f'),dark=[.07,.075,.075],metal=c.engine==='black'?[.11,.12,.12]:c.engine==='polished'?[.82,.84,.84]:[.52,.55,.56],chrome=[.72,.75,.76];
    const enduro=c.base==='enduro',wr={16:.78,17:.82,18:.86,19:.90}[c.wheelSize||16]||.78,ry=-1.05+(c.shock==='long'?.12:0),fy=-1.05+(c.fork==='enduro'?.12:0);
    draw('cube',xform([0,-1.90,0],[3.4,.035,1.35]),[.72,.71,.67],vp);
    drawWheel(-2.05,ry,wr,false,c,vp,chrome,dark); drawWheel(2.15,fy,wr,true,c,vp,chrome,dark);

    const frame=[[-2,ry,0],[-.75,.25,0],[-.05,-.78,0],[-2,ry,0],[-.75,.25,0],[.75,.2,0],[-.05,-.78,0],[.75,.2,0],[1.58,.78,0],[2.15,fy,0]];
    for(let i=0;i<frame.length;i+=2) draw('cyl',tubeBetween(frame[i],frame[i+1],.075),dark,vp);
    draw('cyl',tubeBetween([-.70,.30,-.13],[-.68,1.10,-.13],.055),dark,vp);
    draw('cyl',tubeBetween([-.70,.30,.13],[-.68,1.10,.13],.055),dark,vp);

    const forkCol=c.fork==='black'?dark:chrome;
    draw('cyl',tubeBetween([1.44,.70,-.10],[2.15,fy,-.10],.055),forkCol,vp); draw('cyl',tubeBetween([1.44,.70,.10],[2.15,fy,.10],.055),forkCol,vp);
    draw('cyl',tubeBetween([1.55,.78,-.10],[2.02,-.55,-.10],.085),[.35,.37,.38],vp); draw('cyl',tubeBetween([1.55,.78,.10],[2.02,-.55,.10],.085),[.35,.37,.38],vp);
    const shockCol=c.shock==='chrome'?chrome:[.24,.25,.25];
    draw('cyl',tubeBetween([-1.86,ry,-.20],[-.66,.55,-.20],.052),shockCol,vp); draw('cyl',tubeBetween([-1.86,ry,.20],[-.66,.55,.20],.052),shockCol,vp);
    for(let i=0;i<6;i++){const t=i/5,x=-1.80+(1.05*t),y=ry+(.55-ry)*t;draw('torus',xform([x,y,-.20],[.105,.105,.105],[Math.PI/2,0,-.60]),shockCol,vp)}

    drawTankAndBody(c,vp,paint,side,dark,chrome,enduro);
    drawEngine(c,vp,metal,dark,chrome);

    draw('cube',xform([-1.30,-.98,.13],[.78,.055,.10],[0,0,-.04]),dark,vp);
    draw('cyl',tubeBetween([-1.90,ry,.14],[-.62,-.72,.14],.030),[.35,.36,.36],vp);

    const exCol=[.64,.67,.68];
    if(c.exhaust==='enduro'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.28,.05,-.40],.075),exCol,vp); draw('cyl',tubeBetween([1.28,.05,-.40],[1.95,.62,-.40],.10),exCol,vp); draw('cube',xform([1.95,.62,-.40],[.38,.11,.12],[0,0,.38]),exCol,vp);
    } else if(c.exhaust==='sport'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.46,-.72,-.40],.08),exCol,vp); draw('cyl',tubeBetween([1.46,-.72,-.40],[2.08,-.72,-.40],.11),exCol,vp);
    } else {
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.45,-.80,-.40],.075),exCol,vp); draw('cyl',tubeBetween([1.45,-.80,-.40],[2.46,-.80,-.40],.115),exCol,vp);
    }
    draw('cube',xform([1.36,-.50,-.43],[.28,.025,.04],[0,0,-.35]),dark,vp);

    const lampCol=c.light==='led'?[.65,.85,.20]:c.light==='h4'?[.72,.84,.92]:[.80,.74,.49];
    draw('cyl',axleModel(1.55,.88,0,.29,.20),dark,vp); draw('cyl',axleModel(1.55,.88,-.21,.24,.025),lampCol,vp);
    draw('cyl',tubeBetween([1.48,.99,0],[1.62,1.47,0],.035),dark,vp); draw('cyl',tubeBetween([1.62,1.47,0],[2.02,1.47,0],.035),dark,vp);
    if(c.handlebar==='enduro'||c.handlebar==='cross') draw('cyl',tubeBetween([1.72,1.32,-.18],[1.72,1.32,.18],.025),dark,vp);
    draw('sphere',xform([1.47,1.11,-.10],[.15,.15,.11]),dark,vp);

    if(enduro) draw('cube',xform([1.95,-.34,0],[.60,.055,.30],[0,0,.18]),dark,vp); else draw('cube',xform([2.15,-.20,0],[.64,.05,.30],[0,0,.05]),c.frontFender==='paint'?paint:(c.frontFender==='black'?dark:chrome),vp);
    draw('cube',xform([-2.04,-.20,0],[.62,.05,.30],[0,0,-.05]),c.rearFender==='paint'?paint:dark,vp);
    draw('cube',xform([-2.54,-.80,0],[.16,.06,.22]),[.50,.03,.03],vp);
  }

  function render(){if(!active||!gl||!canvas)return;resize();gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(.91,.90,.86,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const asp=canvas.width/canvas.height,proj=M.p(Math.PI/4,asp,.1,100),view=M.mul(M.t(0,0,-distance),M.mul(M.rx(pitch),M.ry(yaw))),vp=M.mul(proj,view);scene(vp);raf=requestAnimationFrame(render)}
  function resize(){const d=Math.min(devicePixelRatio||1,2),w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==Math.floor(w*d)||canvas.height!==Math.floor(h*d)){canvas.width=Math.floor(w*d);canvas.height=Math.floor(h*d);gl.viewport(0,0,canvas.width,canvas.height)}}
  function mount(){host=document.getElementById('configPreview');if(!host)return;active=true;host.innerHTML=`<div class="config3dTop"><b>S51 WebGL · Detailstufe 3.1</b><span>Ziehen = drehen · Mausrad = zoomen · Auswahl bleibt live</span><button onclick="window.S51ThreeD.close()">2D zurück</button></div><canvas id="config3dCanvas" aria-label="Drehbare 3D-Vorschau der Simson S51"></canvas><div class="config3dFoot"><span>Speichen/Gussrad · Bremse · Naben · Motor mit Kühlrippen · rechter Auspuff</span><b>PHASE 3.1</b></div>`;canvas=document.getElementById('config3dCanvas');gl=canvas.getContext('webgl',{antialias:true,alpha:false});if(!gl){active=false;host.innerHTML='<div class="note">WebGL ist auf diesem Gerät nicht verfügbar. Die 2D-Vorschau bleibt nutzbar.</div>';return}program=mkProgram();initMeshes();bind();cancelAnimationFrame(raf);render()}
  function close(){active=false;cancelAnimationFrame(raf);if(typeof window.configSetView==='function')window.configSetView('side')}
  function bind(){
    canvas.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-px)*.009;pitch=Math.max(-1.0,Math.min(.65,pitch+(e.clientY-py)*.007));px=e.clientX;py=e.clientY});
    canvas.addEventListener('pointerup',()=>dragging=false); canvas.addEventListener('pointercancel',()=>dragging=false);
    canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(5.2,Math.min(12,distance+e.deltaY*.006))},{passive:false});
  }
  function addButton(){const box=document.getElementById('configPreview');if(!box||active)return;const tb=box.querySelector('.configViewToolbar>div:first-child');if(tb&&!tb.querySelector('.config3dBtn')){const b=document.createElement('button');b.className='config3dBtn';b.textContent='3D WebGL';b.onclick=mount;tb.appendChild(b)}}
  const obs=new MutationObserver(()=>{if(!active)addButton()});
  function wrapLiveControls(){
    if(wrapped) return; wrapped=true;
    ['configSelect','configMatchPaint','configReset','configLoad'].forEach(name=>{
      const fn=window[name]; if(typeof fn!=='function') return;
      window[name]=function(...args){const was=active;const out=fn.apply(this,args);if(was)requestAnimationFrame(()=>mount());return out};
    });
  }
  function boot(){const p=document.getElementById('configPreview');if(p){obs.observe(p,{childList:true,subtree:true});addButton();wrapLiveControls()}}
  window.S51ThreeD={mount,close,isActive:()=>active};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();