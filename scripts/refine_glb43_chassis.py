from pathlib import Path
import json, math, struct, re

ROOT = Path('.')


def pad4(b, fill=b'\x00'):
    return b + fill * ((-len(b)) % 4)


def make_glb(name, verts, norms, indices, color):
    def f32(xs): return struct.pack('<%sf' % len(xs), *xs)
    def u16(xs): return struct.pack('<%sH' % len(xs), *xs)
    vb, nb, ib = f32(verts), f32(norms), u16(indices)
    chunks, views, off = [], [], 0
    for raw, target in [(vb,34962),(nb,34962),(ib,34963)]:
        chunk = pad4(raw)
        chunks.append(chunk)
        views.append({'buffer':0,'byteOffset':off,'byteLength':len(raw),'target':target})
        off += len(chunk)
    binblob = b''.join(chunks)
    pts = [verts[i:i+3] for i in range(0,len(verts),3)]
    mn = [min(p[j] for p in pts) for j in range(3)]
    mx = [max(p[j] for p in pts) for j in range(3)]
    doc = {
        'asset': {'version':'2.0','generator':'Werkers Simson GLB 4.3 chassis'},
        'scene':0,'scenes':[{'nodes':[0]}],
        'nodes':[{'mesh':0,'name':name}],
        'meshes':[{'name':name,'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],
        'materials':[{'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0.32,'roughnessFactor':0.38}}],
        'buffers':[{'byteLength':len(binblob)}], 'bufferViews':views,
        'accessors':[
            {'bufferView':0,'componentType':5126,'count':len(verts)//3,'type':'VEC3','min':mn,'max':mx},
            {'bufferView':1,'componentType':5126,'count':len(norms)//3,'type':'VEC3'},
            {'bufferView':2,'componentType':5123,'count':len(indices),'type':'SCALAR'}
        ]
    }
    jb = pad4(json.dumps(doc,separators=(',',':')).encode(), b' ')
    total = 12 + 8 + len(jb) + 8 + len(binblob)
    return struct.pack('<4sII',b'glTF',2,total) + struct.pack('<I4s',len(jb),b'JSON') + jb + struct.pack('<I4s',len(binblob),b'BIN\x00') + binblob


class Mesh:
    def __init__(self): self.v=[]; self.n=[]; self.i=[]
    def add(self, verts, norms, inds):
        base=len(self.v)//3
        self.v += verts; self.n += norms; self.i += [base+x for x in inds]


def basis_for_axis(a,b):
    ax=[b[i]-a[i] for i in range(3)]
    L=math.sqrt(sum(x*x for x in ax)) or 1.0
    w=[x/L for x in ax]
    ref=[0,1,0] if abs(w[1])<0.88 else [1,0,0]
    u=[ref[1]*w[2]-ref[2]*w[1], ref[2]*w[0]-ref[0]*w[2], ref[0]*w[1]-ref[1]*w[0]]
    lu=math.sqrt(sum(x*x for x in u)) or 1.0; u=[x/lu for x in u]
    v=[w[1]*u[2]-w[2]*u[1], w[2]*u[0]-w[0]*u[2], w[0]*u[1]-w[1]*u[0]]
    return u,v,w,L


def tube(a,b,r=0.06,seg=16,r2=None):
    r2 = r if r2 is None else r2
    u,v,w,L=basis_for_axis(a,b)
    verts=[]; norms=[]; inds=[]
    for ring,(p,rr) in enumerate([(a,r),(b,r2)]):
        for k in range(seg):
            t=2*math.pi*k/seg; ct,st=math.cos(t),math.sin(t)
            nx=u[0]*ct+v[0]*st; ny=u[1]*ct+v[1]*st; nz=u[2]*ct+v[2]*st
            verts += [p[0]+rr*nx,p[1]+rr*ny,p[2]+rr*nz]
            norms += [nx,ny,nz]
    for k in range(seg):
        q=(k+1)%seg; inds += [k,q,seg+k, q,seg+q,seg+k]
    return verts,norms,inds


def box(cx,cy,cz,sx,sy,sz):
    faces=[((0,0,1),[(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]),((0,0,-1),[(sx,-sy,-sz),(-sx,-sy,-sz),(-sx,sy,-sz),(sx,sy,-sz)]),((0,1,0),[(-sx,sy,sz),(sx,sy,sz),(sx,sy,-sz),(-sx,sy,-sz)]),((0,-1,0),[(-sx,-sy,-sz),(sx,-sy,-sz),(sx,-sy,sz),(-sx,-sy,sz)]),((1,0,0),[(sx,-sy,sz),(sx,-sy,-sz),(sx,sy,-sz),(sx,sy,sz)]),((-1,0,0),[(-sx,-sy,-sz),(-sx,-sy,sz),(-sx,sy,sz),(-sx,sy,-sz)])]
    vv=[];nn=[];ii=[]
    for normal,vs in faces:
        base=len(vv)//3
        for x,y,z in vs: vv += [x+cx,y+cy,z+cz]; nn += list(normal)
        ii += [base,base+1,base+2,base,base+2,base+3]
    return vv,nn,ii


def torus(center,R,r,seg=32,tube_seg=10,axis=(0,0,1)):
    # Default torus in XY plane; enough for collars and spring visual detail.
    cx,cy,cz=center; vv=[];nn=[];ii=[]
    for i in range(seg+1):
        u=2*math.pi*i/seg; cu,su=math.cos(u),math.sin(u)
        for j in range(tube_seg+1):
            q=2*math.pi*j/tube_seg; cq,sq=math.cos(q),math.sin(q)
            vv += [cx+(R+r*cq)*cu,cy+(R+r*cq)*su,cz+r*sq]
            nn += [cq*cu,cq*su,sq]
    for i in range(seg):
        for j in range(tube_seg):
            a=i*(tube_seg+1)+j; b=a+tube_seg+1; ii += [a,b,a+1,b,b+1,a+1]
    return vv,nn,ii


def add_tubes(mesh, segments):
    for a,b,r,*rest in segments:
        mesh.add(*tube(a,b,r,18,rest[0] if rest else None))


def build_frame():
    m=Mesh()
    segs=[
        ([-.82,.25,-.10],[-.67,1.02,-.10],.065),([-.82,.25,.10],[-.67,1.02,.10],.065),
        ([-.05,-.79,-.10],[-.82,.25,-.10],.072),([-.05,-.79,.10],[-.82,.25,.10],.072),
        ([.72,.24,-.10],[-.05,-.79,-.10],.074),([.72,.24,.10],[-.05,-.79,.10],.074),
        ([.72,.24,-.10],[-.67,1.02,-.10],.064),([.72,.24,.10],[-.67,1.02,.10],.064),
        ([.72,.24,-.10],[1.50,.82,-.10],.068),([.72,.24,.10],[1.50,.82,.10],.068),
        ([-.67,1.02,-.14],[-1.55,1.18,-.14],.050),([-.67,1.02,.14],[-1.55,1.18,.14],.050),
        ([-1.55,1.18,-.14],[-1.72,.70,-.14],.044),([-1.55,1.18,.14],[-1.72,.70,.14],.044),
        ([1.50,.70,-.12],[1.50,.94,-.12],.085),([1.50,.70,.12],[1.50,.94,.12],.085)
    ]
    add_tubes(m,segs)
    m.add(*tube([1.50,.82,-.15],[1.50,.82,.15],.090,20))
    return m


def build_swingarm():
    m=Mesh(); add_tubes(m,[
        ([-.06,-.70,-.14],[-1.98,-1.05,-.14],.050),([-.06,-.70,.14],[-1.98,-1.05,.14],.050),
        ([-1.98,-1.05,-.14],[-1.98,-1.05,.14],.065),([-.06,-.70,-.14],[-.06,-.70,.14],.060)
    ])
    m.add(*box(-1.03,-.88,0,.70,.035,.19))
    return m


def build_fork():
    m=Mesh(); add_tubes(m,[
        ([1.48,.74,-.11],[2.15,-1.05,-.11],.055),([1.48,.74,.11],[2.15,-1.05,.11],.055),
        ([1.54,.60,-.11],[1.54,.60,.11],.075),([1.65,.28,-.11],[1.65,.28,.11],.065)
    ])
    # lower sliders slightly thicker
    add_tubes(m,[([1.84,-.22,-.11],[2.15,-1.05,-.11],.070),([1.84,-.22,.11],[2.15,-1.05,.11],.070)])
    return m


def build_shocks(long=False):
    m=Mesh(); ry=-.93 if long else -1.05
    for z in (-.20,.20):
        a=[-1.90,ry,z]; b=[-.70,.57,z]
        m.add(*tube(a,b,.052,16))
        # spring illusion: short thick collars along shock axis
        for t in [0.12,0.24,0.36,0.48,0.60,0.72,0.84]:
            p=[a[i]+(b[i]-a[i])*t for i in range(3)]
            q=[a[i]+(b[i]-a[i])*(t+.025) for i in range(3)]
            m.add(*tube(p,q,.095,14))
        m.add(*tube(a,[a[0]+.02,a[1]+.08,a[2]],.085,16))
        m.add(*tube([b[0]-.02,b[1]-.08,b[2]],b,.085,16))
    return m


def build_exhaust(kind):
    m=Mesh(); z=-.40
    if kind=='enduro':
        m.add(*tube([.35,-.38,z],[1.38,.07,z],.070,20,.083))
        m.add(*tube([1.38,.07,z],[2.08,.56,z],.105,22,.105))
        m.add(*tube([2.08,.56,z],[2.30,.63,z],.068,18,.055))
        m.add(*box(1.56,.19,-.49,.46,.055,.06))
    elif kind=='sport':
        m.add(*tube([.35,-.38,z],[1.50,-.72,z],.078,20,.095))
        m.add(*tube([1.50,-.72,z],[2.10,-.72,z],.108,22,.108))
        m.add(*tube([2.10,-.72,z],[2.36,-.67,z],.072,18,.052))
    else:
        m.add(*tube([.35,-.38,z],[1.48,-.79,z],.070,20,.090))
        m.add(*tube([1.48,-.79,z],[2.43,-.79,z],.112,24,.112))
        m.add(*tube([2.43,-.79,z],[2.62,-.75,z],.070,18,.048))
        # heat shield on right side
        m.add(*box(1.92,-.69,-.505,.48,.035,.035))
    return m


models={
    'frame.glb':('S51_Frame',build_frame(),[.07,.075,.078,1]),
    'swingarm.glb':('S51_Swingarm',build_swingarm(),[.07,.075,.078,1]),
    'fork.glb':('S51_Fork',build_fork(),[.70,.73,.74,1]),
    'shocks.glb':('S51_Shocks',build_shocks(False),[.52,.54,.55,1]),
    'shocks_long.glb':('S51_Shocks_Long',build_shocks(True),[.52,.54,.55,1]),
    'exhaust_series.glb':('S51_Exhaust_Series',build_exhaust('series'),[.72,.75,.76,1]),
    'exhaust_enduro.glb':('S51_Exhaust_Enduro',build_exhaust('enduro'),[.72,.75,.76,1]),
    'exhaust_sport.glb':('S51_Exhaust_Sport',build_exhaust('sport'),[.72,.75,.76,1]),
}
for base in [ROOT/'assets/models',ROOT/'www/assets/models']:
    base.mkdir(parents=True,exist_ok=True)
    for fn,(name,m,color) in models.items():
        (base/fn).write_bytes(make_glb(name,m.v,m.n,m.i,color))

manifest_path=ROOT/'assets/models/manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['version']='chassis-exhaust-highdetail-1'
manifest['components'].update({
    'frame':'assets/models/frame.glb','swingarm':'assets/models/swingarm.glb','fork':'assets/models/fork.glb',
    'shocks':'assets/models/shocks.glb','shocksLong':'assets/models/shocks_long.glb',
    'exhaustSeries':'assets/models/exhaust_series.glb','exhaustEnduro':'assets/models/exhaust_enduro.glb','exhaustSport':'assets/models/exhaust_sport.glb'
})
manifest.setdefault('detail',{}).update({
    'frame':'separate twin-rail frame, steering head and rear subframe',
    'swingarm':'boxed rear swingarm with axle bridge and chain guard',
    'fork':'separate twin-leg telescopic fork with bridge and sliders',
    'shocks':'separate standard and long rear shock assemblies',
    'exhaust':'right-side series, enduro-high and sport exhaust GLBs'
})
for p in [ROOT/'assets/models/manifest.json',ROOT/'www/assets/models/manifest.json']:
    p.write_text(json.dumps(manifest,indent=2),encoding='utf-8')

old_defs="""      ['star5.glb','glbStar5'],['star10.glb','glbStar10'],['hub.glb','glbHub'],['brakedisc.glb','glbBrakeDisc']
    ];"""
new_defs="""      ['star5.glb','glbStar5'],['star10.glb','glbStar10'],['hub.glb','glbHub'],['brakedisc.glb','glbBrakeDisc'],
      ['frame.glb','glbFrame'],['swingarm.glb','glbSwingarm'],['fork.glb','glbFork'],
      ['shocks.glb','glbShocks'],['shocks_long.glb','glbShocksLong'],
      ['exhaust_series.glb','glbExhaustSeries'],['exhaust_enduro.glb','glbExhaustEnduro'],['exhaust_sport.glb','glbExhaustSport']
    ];"""

old_frame="""  function drawFrameAndRunningGear(c,vp,dark,chrome,ry,fy,enduro){
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
  }"""
new_frame="""  function drawFrameAndRunningGear(c,vp,dark,chrome,ry,fy,enduro){
    if(meshes.glbFrame)draw('glbFrame',xform(),dark,vp);else{
      const frame=[[-1.96,ry,0],[-.82,.25,0],[-.05,-.79,0],[-.82,.25,0],[-.67,1.02,0],[-.67,1.02,0],[.72,.24,0],[-.05,-.79,0],[.72,.24,0],[1.53,.82,0],[1.53,.82,0],[2.15,fy,0]];
      for(let i=0;i<frame.length;i+=2)draw('cyl',tubeBetween(frame[i],frame[i+1],i===8?.065:.072),dark,vp);
    }
    if(meshes.glbSwingarm)draw('glbSwingarm',xform([0,ry+1.05,0]),dark,vp);else{
      draw('cyl',tubeBetween([-.06,-.70,-.13],[-1.98,ry,-.13],.045),dark,vp);draw('cyl',tubeBetween([-.06,-.70,.13],[-1.98,ry,.13],.045),dark,vp);
    }
    const forkColor=c.fork==='black'?dark:chrome;
    if(meshes.glbFork)draw('glbFork',xform([0,fy+1.05,0]),forkColor,vp);else{
      draw('cyl',tubeBetween([1.48,.74,-.10],[2.15,fy,-.10],.050),forkColor,vp);draw('cyl',tubeBetween([1.48,.74,.10],[2.15,fy,.10],.050),forkColor,vp);
      for(let i=0;i<5;i++)draw('cyl',xform([1.67+i*.055,.25-i*.13,-.10],[.068,.040,.068],[0,0,-.45]),dark,vp);
    }
    const sh=c.shock==='chrome'?chrome:[.24,.25,.25], shockMesh=c.shock==='long'?'glbShocksLong':'glbShocks';
    if(meshes[shockMesh])draw(shockMesh,xform(),sh,vp);else{
      draw('cyl',tubeBetween([-1.90,ry,-.20],[-.70,.57,-.20],.050),sh,vp);draw('cyl',tubeBetween([-1.90,ry,.20],[-.70,.57,.20],.050),sh,vp);
      for(let i=0;i<7;i++){const t=i/6,x=-1.83+(1.02*t),y=ry+(.57-ry)*t;draw('torus',xform([x,y,-.20],[.10,.10,.10]),chrome,vp)}
    }
    draw('cube',xform([-1.05,-.66,.22],[.83,.045,.10],[0,0,.04]),dark,vp);draw('cyl',tubeBetween([-.28,-.87,.15],[-.55,-1.48,.25],.035),dark,vp);draw('cyl',tubeBetween([-.28,-.87,-.15],[-.55,-1.48,-.25],.035),dark,vp);
    if(enduro||c.frontFender==='black')draw('wedge',xform([2.07,-.29,0],[.63,.055,.30],[0,0,.15]),dark,vp);else draw('wedge',xform([2.14,-.18,0],[.65,.045,.29],[0,0,.04]),c.frontFender==='paint'?hex(c.tankColor||'#2f608f'):chrome,vp);
    draw('wedge',xform([-2.03,-.20,0],[.66,.045,.29],[0,0,-.04]),c.rearFender==='paint'?hex(c.tankColor||'#2f608f'):dark,vp);
  }"""

old_exhaust="""  function drawExhaust(c,vp){
    const ex=[.67,.70,.70], heat=[.10,.10,.10];
    if(c.exhaust==='enduro'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.38,.07,-.40],.070),ex,vp);draw('cyl',tubeBetween([1.38,.07,-.40],[2.08,.56,-.40],.105),ex,vp);draw('cube',xform([1.55,.18,-.49],[.46,.055,.06],[0,0,.32]),heat,vp);
    }else if(c.exhaust==='sport'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.50,-.72,-.40],.078),ex,vp);draw('cyl',tubeBetween([1.50,-.72,-.40],[2.10,-.72,-.40],.108),ex,vp);draw('cyl',tubeBetween([2.10,-.72,-.40],[2.34,-.67,-.40],.070),ex,vp);
    }else{
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.48,-.79,-.40],.070),ex,vp);draw('cyl',tubeBetween([1.48,-.79,-.40],[2.43,-.79,-.40],.112),ex,vp);draw('cyl',tubeBetween([2.43,-.79,-.40],[2.58,-.76,-.40],.070),ex,vp);
    }
  }"""
new_exhaust="""  function drawExhaust(c,vp){
    const ex=[.67,.70,.70], heat=[.10,.10,.10];
    const key=c.exhaust==='enduro'?'glbExhaustEnduro':c.exhaust==='sport'?'glbExhaustSport':'glbExhaustSeries';
    if(meshes[key]){draw(key,xform(),ex,vp);return}
    if(c.exhaust==='enduro'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.38,.07,-.40],.070),ex,vp);draw('cyl',tubeBetween([1.38,.07,-.40],[2.08,.56,-.40],.105),ex,vp);draw('cube',xform([1.55,.18,-.49],[.46,.055,.06],[0,0,.32]),heat,vp);
    }else if(c.exhaust==='sport'){
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.50,-.72,-.40],.078),ex,vp);draw('cyl',tubeBetween([1.50,-.72,-.40],[2.10,-.72,-.40],.108),ex,vp);draw('cyl',tubeBetween([2.10,-.72,-.40],[2.34,-.67,-.40],.070),ex,vp);
    }else{
      draw('cyl',tubeBetween([.35,-.38,-.40],[1.48,-.79,-.40],.070),ex,vp);draw('cyl',tubeBetween([1.48,-.79,-.40],[2.43,-.79,-.40],.112),ex,vp);draw('cyl',tubeBetween([2.43,-.79,-.40],[2.58,-.76,-.40],.070),ex,vp);
    }
  }"""

for path in [ROOT/'configurator3d.js',ROOT/'www/configurator3d.js']:
    s=path.read_text(encoding='utf-8')
    if old_defs not in s: raise RuntimeError(f'GLB defs anchor missing in {path}')
    s=s.replace(old_defs,new_defs,1)
    if old_frame not in s: raise RuntimeError(f'frame function anchor missing in {path}')
    s=s.replace(old_frame,new_frame,1)
    if old_exhaust not in s: raise RuntimeError(f'exhaust function anchor missing in {path}')
    s=s.replace(old_exhaust,new_exhaust,1)
    s=s.replace('S51 3D · GLB 4.2','S51 3D · GLB 4.3').replace('GLB 4.2','GLB 4.3')
    path.write_text(s,encoding='utf-8')

for path in [ROOT/'configurator3d.css',ROOT/'www/configurator3d.css']:
    s=path.read_text(encoding='utf-8').replace('Phase 4.2 GLB/WebGL','Phase 4.3 GLB/WebGL').replace('GLB 4.2','GLB 4.3')
    path.write_text(s,encoding='utf-8')

new_assets=['frame.glb','swingarm.glb','fork.glb','shocks.glb','shocks_long.glb','exhaust_series.glb','exhaust_enduro.glb','exhaust_sport.glb']
for path in [ROOT/'sw.js',ROOT/'www/sw.js']:
    s=path.read_text(encoding='utf-8').replace('ww-v3-9-configurator-glb4-2','ww-v3-9-configurator-glb4-3')
    anchor='"./assets/models/manifest.json"'
    if anchor not in s: raise RuntimeError(f'sw manifest anchor missing in {path}')
    extra=','.join('"./assets/models/'+x+'"' for x in new_assets)
    if 'assets/models/frame.glb' not in s: s=s.replace(anchor,extra+','+anchor,1)
    path.write_text(s,encoding='utf-8')

print('GLB 4.3 chassis, fork, shocks, swingarm and right-side exhaust integrated')
