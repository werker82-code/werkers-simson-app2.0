(() => {
  const KEY = 'ww_s51_config_current_v1';
  let active = false, host = null, canvas = null, gl = null, program = null;
  let yaw = -0.58, pitch = -0.10, distance = 8.35, dragging = false, px = 0, py = 0, raf = 0;
  let meshes = {}, wrapped = false, pinchDist = 0;

  const vs = `attribute vec3 aPos;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vN;varying vec3 vP;void main(){vec4 p=uModel*vec4(aPos,1.0);vP=p.xyz;gl_Position=uMVP*vec4(aPos,1.0);vN=mat3(uModel)*aNormal;}`;
  const fs = `precision mediump float;varying vec3 vN;varying vec3 vP;uniform vec3 uColor;void main(){vec3 n=normalize(vN);vec3 l=normalize(vec3(.35,.82,.58));float d=max(dot(n,l),0.0);float rim=pow(1.0-abs(n.z),2.0)*.10;float floorShade=clamp((vP.y+2.1)*.03,0.0,.08);float a=.25+d*.68+rim+floorShade;gl_FragColor=vec4(uColor*a,1.0);}`;

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
  function uvSphere(seg=28,ring=16){let p=[],n=[],idx=[];for(let y=0;y<=ring;y++){let v=y/ring,ph=v*Math.PI;for(let x=0;x<=seg;x++){let u=x/seg,th=u*Math.PI*2,s=Math.sin(ph),nx=Math.cos(th)*s,ny=Math.cos(ph),nz=Math.sin(th)*s;p.push(nx,ny,nz);n.push(nx,ny,nz)}}for(let y=0;y<ring;y++)for(let x=0;x<seg;x++){let a=y*(seg+1)+x,b=a+seg+1;idx.push(a,b,a+1,b,b+1,a+1)}return mesh(p,n,idx)}
  function torus(rs=.72,rt=.14,seg=36,tube=14){let p=[],n=[],idx=[];for(let i=0;i<=seg;i++){let u=i/seg*Math.PI*2,cu=Math.cos(u),su=Math.sin(u);for(let j=0;j<=tube;j++){let v=j/tube*Math.PI*2,cv=Math.cos(v),sv=Math.sin(v),x=(rs+rt*cv)*cu,y=(rs+rt*cv)*su,z=rt*sv;p.push(x,y,z);n.push(cv*cu,cv*su,sv)}}for(let i=0;i<seg;i++)for(let j=0;j<tube;j++){let a=i*(tube+1)+j,b=a+tube+1;idx.push(a,b,a+1,b,b+1,a+1)}return mesh(p,n,idx)}
  function cyl(seg=26){let p=[],n=[],idx=[];for(let i=0;i<=seg;i++){let a=i/seg*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(c,-1,s,c,1,s);n.push(c,0,s,c,0,s)}for(let i=0;i<seg;i++){let a=i*2,b=a+2;idx.push(a,a+1,b,a+1,b+1,b)}return mesh(p,n,idx)}
  function wedge(){const p=[-1,-1,1,1,-1,1,.65,1,1,-.65,1,1,-1,-1,-1,1,-1,-1,.65,1,-1,-.65,1,-1];const n=[];for(let i=0;i<8;i++)n.push(0,0,i<4?1:-1);const idx=[0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,3,2,6,3,6,7,1,5,6,1,6,2,0,3,7,0,7,4];return mesh(p,n,idx)}
  function initMeshes(){meshes={cube:cube(),sphere:uvSphere(),torus:torus(),cyl:cyl(),wedge:wedge()}}
  function draw(meshName,model,color,vp){const me=meshes[meshName],mvp=M.mul(vp,model);gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,new Float32Array(mvp));gl.uniformMatrix4fv(gl.getUniformLocation(program,'uModel'),false,new Float32Array(model));gl.uniform3fv(gl.getUniformLocation(program,'uColor'),new Float32Array(color));const ap=gl.getAttribLocation(program,'aPos'),an=gl.getAttribLocation(program,'aNormal');gl.bindBuffer(gl.ARRAY_BUFFER,me.p);gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,me.n);gl.enableVertexAttribArray(an);gl.vertexAttribPointer(an,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,me.i);gl.drawElements(gl.TRIANGLES,me.count,gl.UNSIGNED_SHORT,0)}
  function xform(t=[0,0,0],s=[1,1,1],r=[0,0,0]){return M.mul(M.t(...t),M.mul(M.rz(r[2]),M.mul(M.ry(r[1]),M.mul(M.rx(r[0]),M.s(...s)))))}
  function tubeBetween(a,b,r=.07){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,mz=(a[2]+b[2])/2;const yaw=Math.atan2(dx,dz),pitch=Math.atan2(Math.hypot(dx,dz),dy);return xform([mx,my,mz],[r,len/2,r],[pitch,yaw,0])}
  function axleModel(x,y,z,r=.16,w=.20){return xform([x,y,z],[r,w,r],[Math.PI/2,0,0])}

  function drawWheel(cx,cy,wr,front,c,vp,chrome,dark){
    const tire=[.025,.026,.027], rim=c.rim==='black'?[.07,.075,.08]:c.rim==='polished'?[.88,.90,.90]:[.65,.67,.68];
    draw('torus',xform([cx,cy,0],[wr,wr,wr]),tire,vp);
    draw('torus',xform([cx,cy,0],[wr*.79,wr*.79,wr*.79]),rim,vp);
    if(c.tire==='enduro'){for(let i=0;i<22;i++){const a=i*Math.PI*2/22,x=cx+Math.cos(a)*wr*.91,y=cy+Math.sin(a)*wr*.91;draw('cube',xform([x,y,0],[.050,.095,.19],[0,0,a]),[.03,.03,.03],vp)}}
    const type=c.wheelType||'spokes';
    if(type==='spokes'){
      for(let i=0;i<20;i++){const a=i*Math.PI*2/20,b=a+.11,rr=wr*.64;draw('cyl',tubeBetween([cx+Math.cos(a)*wr*.18,cy+Math.sin(a)*wr*.18,-.07],[cx+Math.cos(b)*rr,cy+Math.sin(b)*rr,.07],.013),chrome,vp);draw('cyl',tubeBetween([cx+Math.cos(a)*wr*.18,cy+Math.sin(a)*wr*.18,.07],[cx+Math.cos(b)*rr,cy+Math.sin(b)*rr,-.07],.013),chrome,vp)}
    } else {
      const n=type==='star5'?5:10,spokeR=type==='star5'?.072:.047;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,rr=wr*.62,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;draw('cyl',tubeBetween([cx,cy,0],[x,y,0],spokeR),rim,vp)}
    }
    draw('cyl',axleModel(cx,cy,0,.13,.22),chrome,vp);
    draw('cyl',axleModel(cx,cy,-.05,.24,.05),[.40,.42,.42],vp);
    if(front&&c.brake==='disc'){
      draw('cyl',axleModel(cx,cy,-.16,wr*.38,.018),[.67,.69,.69],vp);
      for(let i=0;i<12;i++){const a=i*Math.PI*2/12,x=cx+Math.cos(a)*wr*.27,y=cy+Math.sin(a)*wr*.27;draw('sphere',xform([x,y,-.182],[.022,.022,.015]),dark,vp)}
      draw('cube',xform([cx+wr*.31,cy-.03,-.24],[.105,.19,.095],[0,0,-.12]),[.10,.10,.10],vp);
      draw('cyl',tubeBetween([cx+wr*.31,cy+.14,-.24],[1.54,.63,-.26],.018),dark,vp);
    } else if(front){draw('cyl',axleModel(cx,cy,-.02,.23,.16),[.49,.51,.51],vp)}
    else {draw('cyl',axleModel(cx,cy,-.02,.22,.14),[.49,.51,.51],vp);draw('cube',xform([cx-.18,cy-.03,.13],[.08,.18,.08]),dark,vp)}
  }

  function drawEngine(c,vp,metal,dark,chrome){
    const fin=c.engine==='black'?[.17,.18,.18]:[.39,.41,.41], cover=c.engine==='polished'?[.88,.89,.88]:metal;
    draw('sphere',xform([.04,-.56,0],[.60,.45,.47]),metal,vp);
    draw('sphere',xform([.17,-.56,-.36],[.45,.37,.13]),cover,vp);
    draw('cyl',axleModel(.17,-.56,-.49,.205,.043),c.engine==='black'?[.15,.16,.16]:[.59,.61,.61],vp);
    for(let i=0;i<8;i++)draw('cube',xform([.03,-.13+i*.072,0],[.39,.022,.38]),fin,vp);
    for(let i=0;i<5;i++)draw('cube',xform([.03,.43+i*.052,0],[.46,.018,.42]),fin,vp);
    draw('wedge',xform([.03,.71,0],[.39,.105,.37]),fin,vp);
    draw('cyl',tubeBetween([.03,.77,0],[.04,.94,0],.038),[.84,.84,.80],vp);draw('cube',xform([.04,.96,0],[.065,.038,.055]),dark,vp);
    draw('cyl',tubeBetween([.38,-.80,-.37],[.85,-.95,-.37],.034),chrome,vp);draw('cube',xform([.91,-.98,-.37],[.18,.035,.08],[0,0,-.10]),dark,vp);
    draw('cyl',tubeBetween([-.34,-.73,-.25],[-.74,-.91,-.25],.034),chrome,vp);draw('cube',xform([-.80,-.94,-.25],[.18,.035,.08]),dark,vp);
    draw('cyl',tubeBetween([.46,-.42,.30],[.78,-.29,.30],.045),dark,vp);draw('sphere',xform([.83,-.27,.30],[.09,.09,.09]),dark,vp);
    draw('cube',xform([-.26,-.56,.43],[.17,.10,.05],[0,0,.1]),[.25,.25,.25],vp);
  }

  function drawTankAndBody(c,vp,paint,side,dark,chrome,enduro){
    draw('sphere',xform([-.17,.78,0],[.91,.34,.405],[0,0,-.035]),paint,vp);
    draw('sphere',xform([.44,.77,0],[.43,.30,.385],[0,0,-.13]),paint,vp);
    draw('wedge',xform([-.72,.73,0],[.34,.20,.36],[0,0,.09]),paint,vp);
    draw('cube',xform([-.15,.55,0],[.70,.055,.34],[0,0,-.04]),paint,vp);
    draw('cyl',xform([-.28,1.11,0],[.11,.025,.11],[0,0,Math.PI/2]),chrome,vp);
    draw('sphere',xform([-.08,.70,-.39],[.38,.14,.045],[0,0,-.04]),dark,vp);
    draw('sphere',xform([-.08,.70,.39],[.38,.14,.045],[0,0,-.04]),dark,vp);
    draw('wedge',xform([-.28,.02,-.31],[.55,.36,.055],[0,0,-.10]),side,vp);
    draw('wedge',xform([-.28,.02,.31],[.55,.36,.055],[0,0,-.10]),side,vp);
    draw('wedge',xform([-.62,1.20,0],[1.03,.15,.35],[0,0,.018]),dark,vp);
    draw('cube',xform([-1.08,1.31,0],[.42,.055,.34],[0,0,.018]),[.105,.105,.105],vp);
    draw('cube',xform([-.55,1.35,-.355],[.98,.012,.012],[0,0,.018]),[.35,.35,.35],vp);
    draw('cyl',tubeBetween([-1.61,1.14,-.30],[-1.88,.93,-.30],.026),chrome,vp);draw('cyl',tubeBetween([-1.61,1.14,.30],[-1.88,.93,.30],.026),chrome,vp);
    if(enduro)draw('cube',xform([-.76,.94,-.40],[.34,.065,.04],[0,0,.02]),dark,vp);
    draw('cyl',tubeBetween([-.98,.53,-.31],[-.98,.14,-.31],.025),chrome,vp);
  }

  function drawCockpit(c,vp,dark,chrome){
    const high=(c.handlebar==='enduro'||c.bar==='enduro'||c.base==='enduro'), barY=high?1.78:1.58, barX=high?1.60:1.66;
    draw('cyl',tubeBetween([1.50,.82,0],[barX,barY,0],.034),chrome,vp);
    draw('cyl',tubeBetween([barX,barY,0],[2.03,barY+.03,-.03],.034),chrome,vp);
    draw('cyl',tubeBetween([barX,barY,0],[1.22,barY+.03,.03],.034),chrome,vp);
    draw('cyl',tubeBetween([2.00,barY+.03,-.03],[2.24,barY+.03,-.03],.050),dark,vp);draw('cyl',tubeBetween([1.25,barY+.03,.03],[1.01,barY+.03,.03],.050),dark,vp);
    draw('cyl',tubeBetween([2.07,barY-.02,-.08],[2.28,barY-.14,-.11],.018),chrome,vp);draw('cyl',tubeBetween([1.18,barY-.02,.08],[.97,barY-.14,.11],.018),chrome,vp);
    draw('cyl',xform([1.53,1.34,-.05],[.18,.055,.18],[Math.PI/2,0,0]),dark,vp);draw('cyl',xform([1.53,1.35,-.112],[.14,.018,.14],[Math.PI/2,0,0]),[.90,.91,.87],vp);
    draw('cube',xform([1.30,1.27,.03],[.10,.07,.12],[0,0,.02]),dark,vp);
    draw('sphere',xform([1.60,1.02,0],[.31,.29,.27]),dark,vp);draw('sphere',xform([1.80,1.02,-.02],[.12,.24,.235]),c.light==='led'?[.74,.91,.35]:[.91,.85,.58],vp);
    draw('cyl',tubeBetween([2.02,barY,-.06],[1.52,.80,-.16],.012),dark,vp);draw('cyl',tubeBetween([1.06,barY,.06],[.65,.55,.18],.012),dark,vp);
    if(c.mirror!=='none'&&(c.mirror||c.base==='street')){draw('cyl',tubeBetween([1.92,barY+.04,-.02],[2.05,barY+.42,-.02],.018),chrome,vp);draw('sphere',xform([2.08,barY+.48,-.02],[.14,.19,.05],[0,0,-.25]),[.32,.34,.34],vp)}
  }

  function drawFrameAndRunningGear(c,vp,dark,chrome,ry,fy,enduro){
    const frame=[[-1.96,ry,0],[-.82,.25,0],[-.05,-.79,0],[-.82,.25,0],[-.67,1.02,0],[-.67,1.02,0],[.72,.24,0],[-.05,-.79,0],[.72,.24,0],[1.53,.82,0],[1.53,.82,0],[2.15,fy,0]];
    for(let i=0;i<frame.length;i+=2)draw('cyl',tubeBetween(frame[i],frame[i+1],i===8?.065:.072),dark,vp);
    draw('cyl',tubeBetween([-.06,-.70,-.13],[-1.98,ry,-.13],.045),dark,vp);draw('cyl',tubeBetween([-.06,-.70,.13],[-1.98,ry,.13],.045),dark,vp);
    draw('cyl',tubeBetween([1.48,.74,-.10],[2.15,fy,-.10],.050),c.fork==='black'?dark:chrome,vp);draw('cyl',tubeBetween([1.48,.74,.10],[2.15,fy,.10],.050),c.fork==='black'?dark:chrome,vp);
    for(let i=0;i<5;i++)draw('cyl',xform([1.67+i*.055,.25-i*.13,-.10],[.068,.040,.068],[0,0,-.45]),dark,vp);
    const sh=c.shock==='chrome'?chrome:[.24,.25,.25];draw('cyl',tubeBetween([-1.90,ry,-.20],[-.70,.57,-.20],.050),sh,vp);draw('cyl',tubeBetween([-1.90,ry,.20],[-.70,.57,.20],.050),sh,vp);
    for(let i=0;i<7;i++){const t=i/6,x=-1.83+(1.02*t),y=ry+(.57-ry)*t;draw('torus',xform([x,y,-.20],[.10,.10,.10]),chrome,vp)}
    draw('cube',xform([-1.05,-.66,.22],[.83,.045,.10],[0,0,.04]),dark,vp);draw('cyl',tubeBetween([-.28,-.87,.15],[-.55,-1.48,.25],.035),dark,vp);draw('cyl',tubeBetween([-.28,-.87,-.15],[-.55,-1.48,-.25],.035),dark,vp);
    if(enduro||c.frontFender==='black')draw('wedge',xform([2.07,-.29,0],[.63,.055,.30],[0,0,.15]),dark,vp);else draw('wedge',xform([2.14,-.18,0],[.65,.045,.29],[0,0,.04]),c.frontFender==='paint'?hex(c.tankColor||'#2f608f'):chrome,vp);
    draw('wedge',xform([-2.03,-.20,0],[.66,.045,.29],[0,0,-.04]),c.rearFender==='paint'?hex(c.tankColor||'#2f608f'):dark,vp);
  }

  function drawExhaust(c,vp){
    const ex=[.67,.70,.70], heat=[.10,.10,.10];
    if(c.exhaust==='enduro'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.38,.07,-.40],.070),ex,vp);draw('cyl',tubeBetween([1.38,.07,-.40],[2.08,.56,-.40],.105),ex,vp);draw('cube',xform([1.55,.18,-.49],[.46,.055,.06],[0,0,.32]),heat,vp);
    }else if(c.exhaust==='sport'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.50,-.72,-.40],.078),ex,vp);draw('cyl',tubeBetween([1.50,-.72,-.40],[2.10,-.72,-.40],.108),ex,vp);draw('cyl',tubeBetween([2.10,-.72,-.40],[2.34,-.67,-.40],.070),ex,vp);
    }else{
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.48,-.79,-.40],.070),ex,vp);draw('cyl',tubeBetween([1.48,-.79,-.40],[2.43,-.79,-.40],.112),ex,vp);draw('cyl',tubeBetween([2.43,-.79,-.40],[2.58,-.76,-.40],.070),ex,vp);
    }
  }

  function scene(vp){
    const c=cfg(),paint=hex(c.tankColor||'#2f608f'),side=hex(c.sideColor||c.tankColor||'#2f608f'),dark=[.065,.07,.07],metal=c.engine==='black'?[.11,.12,.12]:c.engine==='polished'?[.84,.86,.86]:[.52,.55,.56],chrome=[.74,.77,.78];
    const enduro=c.base==='enduro',wr={16:.78,17:.82,18:.86,19:.90}[c.wheelSize||16]||.78,ry=-1.05+(c.shock==='long'?.12:0),fy=-1.05+(c.fork==='enduro'?.12:0);
    draw('cube',xform([0,-1.90,0],[3.45,.035,1.38]),[.73,.72,.68],vp);
    draw('sphere',xform([-2.05,-1.84,0],[.72,.035,.38]),[.40,.40,.38],vp);draw('sphere',xform([2.15,-1.84,0],[.72,.035,.38]),[.40,.40,.38],vp);
    drawWheel(-2.05,ry,wr,false,c,vp,chrome,dark);drawWheel(2.15,fy,wr,true,c,vp,chrome,dark);
    drawFrameAndRunningGear(c,vp,dark,chrome,ry,fy,enduro);
    drawTankAndBody(c,vp,paint,side,dark,chrome,enduro);
    drawEngine(c,vp,metal,dark,chrome);
    drawExhaust(c,vp);
    drawCockpit(c,vp,dark,chrome);
    draw('cube',xform([-1.82,.72,0],[.15,.12,.21]),[.46,.04,.03],vp);draw('sphere',xform([-1.69,.77,-.37],[.10,.08,.08]),[.90,.47,.06],vp);draw('sphere',xform([-1.69,.77,.37],[.10,.08,.08]),[.90,.47,.06],vp);
    draw('cyl',tubeBetween([-.30,-.80,-.30],[-.70,-.80,-.48],.035),chrome,vp);draw('cyl',tubeBetween([-.30,-.80,.30],[-.70,-.80,.48],.035),chrome,vp);
  }

  function render(){if(!active||!gl||!canvas)return;resize();gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(.91,.90,.86,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);const asp=canvas.width/canvas.height,proj=M.p(Math.PI/4,asp,.1,100),view=M.mul(M.t(0,-.05,-distance),M.mul(M.rx(pitch),M.ry(yaw))),vp=M.mul(proj,view);scene(vp);raf=requestAnimationFrame(render)}
  function resize(){const d=Math.min(devicePixelRatio||1,2),w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);if(canvas.width!==Math.floor(w*d)||canvas.height!==Math.floor(h*d)){canvas.width=Math.floor(w*d);canvas.height=Math.floor(h*d);gl.viewport(0,0,canvas.width,canvas.height)}}
  function camera(name){if(name==='side'){yaw=-.02;pitch=-.06;distance=8.1}else if(name==='three'){yaw=-.58;pitch=-.10;distance=8.35}else if(name==='front'){yaw=-1.56;pitch=-.08;distance=8.0}else if(name==='rear'){yaw=1.56;pitch=-.08;distance=8.0}else{yaw=-.58;pitch=-.10;distance=8.35}}
  function mount(){host=document.getElementById('configPreview');if(!host)return;active=true;host.innerHTML=`<div class="config3dTop"><b>S51 3D · Detail 3.2</b><span>Ziehen = drehen · Mausrad/Pinch = zoomen</span><button onclick="window.S51ThreeD.close()">2D zurück</button></div><div class="config3dCamera"><button onclick="window.S51ThreeD.camera('side')">Seite</button><button onclick="window.S51ThreeD.camera('three')">3/4</button><button onclick="window.S51ThreeD.camera('front')">Front</button><button onclick="window.S51ThreeD.camera('rear')">Heck</button><button onclick="window.S51ThreeD.camera('reset')">Ansicht zurücksetzen</button></div><canvas id="config3dCanvas" aria-label="Drehbare 3D-Vorschau der Simson S51"></canvas><div class="config3dFoot"><span>Tank · Seitendeckel · Sitzbank · Rahmen · Cockpit · Räder · Motor · rechter Auspuff</span><b>PHASE 3.2</b></div>`;canvas=document.getElementById('config3dCanvas');gl=canvas.getContext('webgl',{antialias:true,alpha:false});if(!gl){active=false;host.innerHTML='<div class="config3dUnavailable">WebGL ist auf diesem Gerät nicht verfügbar. Die 2D-Vorschau bleibt nutzbar.</div>';return}program=mkProgram();initMeshes();bind();cancelAnimationFrame(raf);render()}
  function close(){active=false;cancelAnimationFrame(raf);if(typeof window.configSetView==='function')window.configSetView('side')}
  function bind(){
    canvas.addEventListener('pointerdown',e=>{dragging=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-px)*.009;pitch=Math.max(-1.02,Math.min(.62,pitch+(e.clientY-py)*.007));px=e.clientX;py=e.clientY});
    canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
    canvas.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(5.2,Math.min(12,distance+e.deltaY*.006))},{passive:false});
    canvas.addEventListener('touchstart',e=>{if(e.touches.length===2)pinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)},{passive:true});
    canvas.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinchDist){const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);distance=Math.max(5.2,Math.min(12,distance+(pinchDist-d)*.012));pinchDist=d}},{passive:true});
  }
  function addButton(){const box=document.getElementById('configPreview');if(!box||active)return;const tb=box.querySelector('.configViewToolbar>div:first-child');if(tb&&!tb.querySelector('.config3dBtn')){const b=document.createElement('button');b.className='config3dBtn';b.textContent='3D WebGL';b.onclick=mount;tb.appendChild(b)}}
  function keep3D(){if(active)setTimeout(()=>{if(!document.getElementById('config3dCanvas'))mount()},0)}
  function wrapConfigurator(){if(wrapped)return;wrapped=true;['configSet','configSetColor','configSetCategory','configReset','configMatchPaint','configLoad'].forEach(n=>{const old=window[n];if(typeof old==='function'){window[n]=function(...a){const r=old.apply(this,a);keep3D();return r}}})}
  const obs=new MutationObserver(()=>{if(!active)addButton()});
  function boot(){const p=document.getElementById('configPreview');if(p){obs.observe(p,{childList:true,subtree:true});addButton()}wrapConfigurator()}
  window.S51ThreeD={mount,close,camera,isActive:()=>active};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();