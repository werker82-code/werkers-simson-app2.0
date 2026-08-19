from pathlib import Path
import json, math, re, struct

ROOT = Path('.')


def pad4(data, fill=b'\x00'):
    return data + fill * ((-len(data)) % 4)


def merge(*geos):
    verts, norms, inds = [], [], []
    for v, n, i in geos:
        base = len(verts) // 3
        verts.extend(v)
        norms.extend(n)
        inds.extend(base + x for x in i)
    return verts, norms, inds


def translated(geo, tx=0.0, ty=0.0, tz=0.0):
    v, n, ind = geo
    out = []
    for i in range(0, len(v), 3):
        out += [v[i] + tx, v[i + 1] + ty, v[i + 2] + tz]
    return out, list(n), list(ind)


def make_glb(name, geo, color):
    verts, norms, indices = geo
    def f32(xs): return struct.pack('<%sf' % len(xs), *xs)
    def u16(xs): return struct.pack('<%sH' % len(xs), *xs)
    vb, nb, ib = f32(verts), f32(norms), u16(indices)
    chunks, views, off = [], [], 0
    for raw, target in ((vb, 34962), (nb, 34962), (ib, 34963)):
        chunk = pad4(raw)
        chunks.append(chunk)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(raw), 'target': target})
        off += len(chunk)
    binblob = b''.join(chunks)
    pts = [verts[i:i+3] for i in range(0, len(verts), 3)]
    mn = [min(p[j] for p in pts) for j in range(3)]
    mx = [max(p[j] for p in pts) for j in range(3)]
    doc = {
        'asset': {'version': '2.0', 'generator': 'Werkers Simson GLB 4.2 procedural detail'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'mesh': 0, 'name': name}],
        'meshes': [{'name': name, 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1}, 'indices': 2, 'material': 0}]}],
        'materials': [{'pbrMetallicRoughness': {'baseColorFactor': color, 'metallicFactor': 0.22, 'roughnessFactor': 0.42}}],
        'buffers': [{'byteLength': len(binblob)}],
        'bufferViews': views,
        'accessors': [
            {'bufferView': 0, 'componentType': 5126, 'count': len(verts)//3, 'type': 'VEC3', 'min': mn, 'max': mx},
            {'bufferView': 1, 'componentType': 5126, 'count': len(norms)//3, 'type': 'VEC3'},
            {'bufferView': 2, 'componentType': 5123, 'count': len(indices), 'type': 'SCALAR'}
        ]
    }
    jb = pad4(json.dumps(doc, separators=(',', ':')).encode(), b' ')
    total = 12 + 8 + len(jb) + 8 + len(binblob)
    return struct.pack('<4sII', b'glTF', 2, total) + struct.pack('<I4s', len(jb), b'JSON') + jb + struct.pack('<I4s', len(binblob), b'BIN\x00') + binblob


def ellipsoid(rx, ry, rz, seg=32, ring=18):
    v, n, ind = [], [], []
    for iy in range(ring + 1):
        ph = math.pi * iy / ring
        for ix in range(seg + 1):
            th = 2 * math.pi * ix / seg
            s = math.sin(ph)
            x, y, z = rx * math.cos(th) * s, ry * math.cos(ph), rz * math.sin(th) * s
            nx, ny, nz = x/(rx*rx), y/(ry*ry), z/(rz*rz)
            L = math.sqrt(nx*nx + ny*ny + nz*nz) or 1
            v += [x, y, z]
            n += [nx/L, ny/L, nz/L]
    for iy in range(ring):
        for ix in range(seg):
            a = iy * (seg + 1) + ix
            b = a + seg + 1
            ind += [a, b, a+1, b, b+1, a+1]
    return v, n, ind


def box(sx, sy, sz):
    faces = [
        ((0,0,1), [(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]),
        ((0,0,-1), [(sx,-sy,-sz),(-sx,-sy,-sz),(-sx,sy,-sz),(sx,sy,-sz)]),
        ((0,1,0), [(-sx,sy,sz),(sx,sy,sz),(sx,sy,-sz),(-sx,sy,-sz)]),
        ((0,-1,0), [(-sx,-sy,-sz),(sx,-sy,-sz),(sx,-sy,sz),(-sx,-sy,sz)]),
        ((1,0,0), [(sx,-sy,sz),(sx,-sy,-sz),(sx,sy,-sz),(sx,sy,sz)]),
        ((-1,0,0), [(-sx,-sy,-sz),(-sx,-sy,sz),(-sx,sy,sz),(-sx,sy,-sz)])
    ]
    v, n, ind = [], [], []
    for normal, pts in faces:
        base = len(v)//3
        for p in pts:
            v += list(p)
            n += list(normal)
        ind += [base,base+1,base+2, base,base+2,base+3]
    return v, n, ind


def torus(R=.78, r=.13, seg=48, tube=18):
    v, n, ind = [], [], []
    for i in range(seg + 1):
        u = 2 * math.pi * i / seg
        cu, su = math.cos(u), math.sin(u)
        for j in range(tube + 1):
            q = 2 * math.pi * j / tube
            cq, sq = math.cos(q), math.sin(q)
            v += [(R + r*cq)*cu, (R + r*cq)*su, r*sq]
            n += [cq*cu, cq*su, sq]
    for i in range(seg):
        for j in range(tube):
            a = i*(tube+1)+j
            b = a+tube+1
            ind += [a,b,a+1, b,b+1,a+1]
    return v,n,ind


def z_cylinder(radius, half_depth, seg=32):
    v, n, ind = [], [], []
    for side_z, nz in ((-half_depth, -1), (half_depth, 1)):
        center = len(v)//3
        v += [0,0,side_z]; n += [0,0,nz]
        ring_start = len(v)//3
        for i in range(seg):
            a = 2*math.pi*i/seg
            v += [radius*math.cos(a), radius*math.sin(a), side_z]
            n += [0,0,nz]
        for i in range(seg):
            j = (i+1)%seg
            if nz > 0: ind += [center, ring_start+i, ring_start+j]
            else: ind += [center, ring_start+j, ring_start+i]
    side_start = len(v)//3
    for i in range(seg+1):
        a = 2*math.pi*i/seg
        c,s = math.cos(a),math.sin(a)
        v += [radius*c,radius*s,-half_depth, radius*c,radius*s,half_depth]
        n += [c,s,0, c,s,0]
    for i in range(seg):
        a = side_start+i*2
        b = a+2
        ind += [a,a+1,b, a+1,b+1,b]
    return v,n,ind


def annulus(ro, ri, half_depth=.018, seg=48):
    v,n,ind=[],[],[]
    for z,nz in ((-half_depth,-1),(half_depth,1)):
        base=len(v)//3
        for i in range(seg):
            a=2*math.pi*i/seg; c,s=math.cos(a),math.sin(a)
            v += [ro*c,ro*s,z, ri*c,ri*s,z]
            n += [0,0,nz, 0,0,nz]
        for i in range(seg):
            j=(i+1)%seg; a=base+i*2; b=base+j*2
            if nz>0: ind += [a,b,a+1, b,b+1,a+1]
            else: ind += [a,a+1,b, b,a+1,b+1]
    for radius, outward in ((ro,1),(ri,-1)):
        base=len(v)//3
        for i in range(seg+1):
            a=2*math.pi*i/seg; c,s=math.cos(a),math.sin(a)
            v += [radius*c,radius*s,-half_depth, radius*c,radius*s,half_depth]
            n += [outward*c,outward*s,0, outward*c,outward*s,0]
        for i in range(seg):
            a=base+i*2; b=a+2
            if outward>0: ind += [a,a+1,b, a+1,b+1,b]
            else: ind += [a,b,a+1, a+1,b,b+1]
    return v,n,ind


def beam_xy(x1,y1,x2,y2,width=.016,depth=.018):
    dx,dy=x2-x1,y2-y1
    L=math.hypot(dx,dy) or 1
    px,py=-dy/L*width,dx/L*width
    z=depth
    pts=[(x1+px,y1+py,-z),(x2+px,y2+py,-z),(x2-px,y2-py,-z),(x1-px,y1-py,-z),
         (x1+px,y1+py,z),(x2+px,y2+py,z),(x2-px,y2-py,z),(x1-px,y1-py,z)]
    faces=[(0,1,2,3),(4,7,6,5),(0,4,5,1),(3,2,6,7),(1,5,6,2),(0,3,7,4)]
    v,n,ind=[],[],[]
    for f in faces:
        a,b,c,d=[pts[k] for k in f]
        ux,uy,uz=b[0]-a[0],b[1]-a[1],b[2]-a[2]
        vx,vy,vz=c[0]-a[0],c[1]-a[1],c[2]-a[2]
        nx,ny,nz=uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx
        ll=math.sqrt(nx*nx+ny*ny+nz*nz) or 1
        normal=(nx/ll,ny/ll,nz/ll)
        base=len(v)//3
        for p in (a,b,c,d): v+=list(p);n+=list(normal)
        ind += [base,base+1,base+2, base,base+2,base+3]
    return v,n,ind


# High-detail engine base around local origin. The renderer places it at [0.02,-0.57,0].
engine_parts = [
    ellipsoid(.60,.43,.43,36,20),
    translated(ellipsoid(.42,.34,.115,32,18), .16, .00, -.40),
    translated(ellipsoid(.28,.29,.080,28,16), -.25, -.01, .39),
    translated(box(.34,.15,.34), -.18, -.30, .02),
    translated(z_cylinder(.205,.045,36), .16, .00, -.505),
]
# Add cover screw bosses to engine mesh.
for x,y in ((.01,.20),(.35,.10),(.34,-.17),(.00,-.27)):
    engine_parts.append(translated(z_cylinder(.030,.020,20), x, y, -.565))
engine_geo = merge(*engine_parts)

# Cylinder and cylinder-head fins as a separate GLB so they keep a darker alloy color.
fins=[]
fins.append(translated(box(.30,.31,.30), .02, .70, 0))
for i in range(9):
    fins.append(translated(box(.405,.020,.395), .02, .43+i*.068, 0))
for i in range(5):
    fins.append(translated(box(.47-.025*i,.017,.43-.018*i), .02, 1.00+i*.052, 0))
fins.append(translated(box(.39,.075,.37), .02, 1.26, 0))
engine_fins_geo=merge(*fins)

# Carburetor / intake block behind the cylinder.
carb_parts=[
    translated(box(.17,.20,.14), -.61,.72,.30),
    translated(ellipsoid(.17,.09,.14,24,12), -.61,.54,.30),
    translated(box(.15,.055,.13), -.61,.46,.30),
    translated(z_cylinder(.105,.16,28), -.83,.72,.30),
    translated(ellipsoid(.17,.16,.15,24,14), -1.10,.68,.28),
]
carb_geo=merge(*carb_parts)

# Detailed wheel components authored for a base outer radius of about 0.91.
wheel_geo=torus(.78,.13,56,20)
rim_geo=torus(.635,.034,56,12)
hub_geo=merge(z_cylinder(.125,.22,40), z_cylinder(.235,.045,40))
spoke_parts=[]
for i in range(20):
    a=2*math.pi*i/20
    b=a+.12
    # Two crossed spokes per station, projected in XY; depth gives a small dish.
    x1,y1=.16*math.cos(a),.16*math.sin(a)
    x2,y2=.60*math.cos(b),.60*math.sin(b)
    spoke_parts.append(beam_xy(x1,y1,x2,y2,.010,.014))
    b2=a-.12
    x2,y2=.60*math.cos(b2),.60*math.sin(b2)
    spoke_parts.append(beam_xy(x1,y1,x2,y2,.010,.014))
spokes_geo=merge(*spoke_parts)

star5_parts=[]
for i in range(5):
    a=2*math.pi*i/5
    star5_parts.append(beam_xy(.10*math.cos(a),.10*math.sin(a),.60*math.cos(a),.60*math.sin(a),.070,.060))
star5_geo=merge(*star5_parts)
star10_parts=[]
for i in range(10):
    a=2*math.pi*i/10
    star10_parts.append(beam_xy(.10*math.cos(a),.10*math.sin(a),.60*math.cos(a),.60*math.sin(a),.045,.050))
star10_geo=merge(*star10_parts)
disc_geo=annulus(.35,.14,.018,56)

models={
    'engine.glb':('S51_EngineCase_42',engine_geo,[.52,.55,.56,1]),
    'engine_fins.glb':('S51_CylinderFins_42',engine_fins_geo,[.39,.41,.41,1]),
    'carb.glb':('S51_Carburetor_42',carb_geo,[.58,.60,.60,1]),
    'wheel.glb':('S51_Tire_42',wheel_geo,[.03,.03,.03,1]),
    'rim.glb':('S51_Rim_42',rim_geo,[.65,.67,.68,1]),
    'spokes.glb':('S51_CrossSpokes_42',spokes_geo,[.78,.80,.81,1]),
    'star5.glb':('S51_Star5_42',star5_geo,[.65,.67,.68,1]),
    'star10.glb':('S51_Star10_42',star10_geo,[.65,.67,.68,1]),
    'hub.glb':('S51_Hub_42',hub_geo,[.58,.60,.60,1]),
    'brakedisc.glb':('S51_BrakeDisc_42',disc_geo,[.72,.74,.74,1]),
}
for base in (ROOT/'assets/models',ROOT/'www/assets/models'):
    base.mkdir(parents=True,exist_ok=True)
    for fn,(name,geo,color) in models.items():
        (base/fn).write_bytes(make_glb(name,geo,color))

manifest={
    'version':'engine-wheel-highdetail-1',
    'components':{
        'tank':'assets/models/tank.glb','sidecover':'assets/models/sidecover.glb',
        'engine':'assets/models/engine.glb','engineFins':'assets/models/engine_fins.glb','carb':'assets/models/carb.glb',
        'wheel':'assets/models/wheel.glb','rim':'assets/models/rim.glb','spokes':'assets/models/spokes.glb',
        'star5':'assets/models/star5.glb','star10':'assets/models/star10.glb','hub':'assets/models/hub.glb','brakeDisc':'assets/models/brakedisc.glb'
    },
    'detail':{
        'tank':'lofted S51 profile with flattened underside and knee recesses',
        'sidecover':'bevelled rounded shield with shallow dome',
        'engine':'multi-part M5x1-style case with covers and screw bosses',
        'engineFins':'separate cylinder and stepped head cooling fins',
        'carb':'carburetor, float bowl and intake tract',
        'wheel':'high-resolution tire, separate rim, hub and crossed spokes',
        'brakes':'separate front brake disc component'
    }
}
for p in (ROOT/'assets/models/manifest.json',ROOT/'www/assets/models/manifest.json'):
    p.write_text(json.dumps(manifest,indent=2),encoding='utf-8')

new_loader = '''  async function loadGLBComponents(){
    const root='assets/models/';
    const defs=[
      ['tank.glb','glbTank'],['sidecover.glb','glbSidecover'],
      ['engine.glb','glbEngine'],['engine_fins.glb','glbEngineFins'],['carb.glb','glbCarb'],
      ['wheel.glb','glbWheel'],['rim.glb','glbRim'],['spokes.glb','glbSpokes'],
      ['star5.glb','glbStar5'],['star10.glb','glbStar10'],['hub.glb','glbHub'],['brakedisc.glb','glbBrakeDisc']
    ];
    const ok=await Promise.all(defs.map(([file,key])=>loadGLBMesh(root+file,key)));
    glbReady=ok.some(Boolean);
  }
'''

new_wheel = '''  function drawWheel(cx,cy,wr,front,c,vp,chrome,dark){
    const tire=[.025,.026,.027], rim=c.rim==='black'?[.07,.075,.08]:c.rim==='polished'?[.88,.90,.90]:[.65,.67,.68];
    const sc=wr/.91;
    if(meshes.glbWheel)draw('glbWheel',xform([cx,cy,0],[sc,sc,sc]),tire,vp);else draw('torus',xform([cx,cy,0],[wr,wr,wr]),tire,vp);
    if(meshes.glbRim)draw('glbRim',xform([cx,cy,0],[sc,sc,sc]),rim,vp);else draw('torus',xform([cx,cy,0],[wr*.79,wr*.79,wr*.79]),rim,vp);
    if(c.tire==='enduro'){for(let i=0;i<24;i++){const a=i*Math.PI*2/24,x=cx+Math.cos(a)*wr*.91,y=cy+Math.sin(a)*wr*.91;draw('cube',xform([x,y,0],[.046,.090,.19],[0,0,a]),[.03,.03,.03],vp)}}
    const type=c.wheelType||'spokes';
    if(type==='spokes'){
      if(meshes.glbSpokes)draw('glbSpokes',xform([cx,cy,0],[sc,sc,sc]),chrome,vp);
      else for(let i=0;i<20;i++){const a=i*Math.PI*2/20,b=a+.11,rr=wr*.64;draw('cyl',tubeBetween([cx+Math.cos(a)*wr*.18,cy+Math.sin(a)*wr*.18,-.07],[cx+Math.cos(b)*rr,cy+Math.sin(b)*rr,.07],.013),chrome,vp);draw('cyl',tubeBetween([cx+Math.cos(a)*wr*.18,cy+Math.sin(a)*wr*.18,.07],[cx+Math.cos(b)*rr,cy+Math.sin(b)*rr,-.07],.013),chrome,vp)}
    }else if(type==='star5'){
      if(meshes.glbStar5)draw('glbStar5',xform([cx,cy,0],[sc,sc,sc]),rim,vp);
      else for(let i=0;i<5;i++){const a=i*Math.PI*2/5,rr=wr*.62;draw('cyl',tubeBetween([cx,cy,0],[cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,0],.072),rim,vp)}
    }else{
      if(meshes.glbStar10)draw('glbStar10',xform([cx,cy,0],[sc,sc,sc]),rim,vp);
      else for(let i=0;i<10;i++){const a=i*Math.PI*2/10,rr=wr*.62;draw('cyl',tubeBetween([cx,cy,0],[cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,0],.047),rim,vp)}
    }
    if(meshes.glbHub)draw('glbHub',xform([cx,cy,0],[sc,sc,sc]),chrome,vp);else{draw('cyl',axleModel(cx,cy,0,.13,.22),chrome,vp);draw('cyl',axleModel(cx,cy,-.05,.24,.05),[.40,.42,.42],vp)}
    if(front&&c.brake==='disc'){
      if(meshes.glbBrakeDisc)draw('glbBrakeDisc',xform([cx,cy,-.16],[sc,sc,sc]),[.68,.70,.70],vp);else draw('cyl',axleModel(cx,cy,-.16,wr*.38,.018),[.67,.69,.69],vp);
      draw('cube',xform([cx+wr*.31,cy-.03,-.24],[.105,.19,.095],[0,0,-.12]),[.10,.10,.10],vp);
      draw('cyl',tubeBetween([cx+wr*.31,cy+.14,-.24],[1.54,.63,-.26],.018),dark,vp);
    }else if(front){draw('cyl',axleModel(cx,cy,-.02,.23,.16),[.49,.51,.51],vp)}
    else{draw('cube',xform([cx-.18,cy-.03,.13],[.08,.18,.08]),dark,vp)}
  }
'''

new_engine = '''  function drawEngine(c,vp,metal,dark,chrome){
    const fin=c.engine==='black'?[.16,.17,.17]:[.39,.41,.41], cover=c.engine==='polished'?[.90,.91,.90]:metal, alloy=[.58,.60,.60];
    const base=xform([.02,-.57,0]);
    if(meshes.glbEngine)draw('glbEngine',base,metal,vp);else draw('sphere',xform([.02,-.57,0],[.61,.45,.47]),metal,vp);
    if(meshes.glbEngineFins)draw('glbEngineFins',base,fin,vp);else{
      for(let i=0;i<9;i++)draw('cube',xform([.025,-.13+i*.068,0],[.405,.020,.395]),fin,vp);
      for(let i=0;i<5;i++)draw('cube',xform([.025,.43+i*.052,0],[.47-.025*i,.017,.43-.018*i]),fin,vp);
    }
    if(meshes.glbCarb)draw('glbCarb',base,alloy,vp);else{
      draw('cube',xform([-.60,.15,.30],[.17,.20,.14],[0,0,-.04]),alloy,vp);
      draw('sphere',xform([-.60,-.03,.30],[.17,.09,.14]),alloy,vp);
    }
    draw('cyl',tubeBetween([.03,.78,0],[.04,.95,0],.038),[.85,.85,.81],vp);
    draw('cube',xform([.04,.975,0],[.065,.040,.055]),dark,vp);
    draw('cyl',tubeBetween([.04,1.01,0],[-.12,1.13,.16],.018),dark,vp);
    draw('cyl',tubeBetween([-.59,.36,.30],[-.45,.82,.24],.010),dark,vp);
    draw('cyl',tubeBetween([-.70,.28,.29],[-.55,.67,.32],.012),[.30,.36,.24],vp);
    draw('cyl',tubeBetween([.38,-.80,-.37],[.85,-.95,-.37],.034),chrome,vp);
    draw('cube',xform([.91,-.98,-.37],[.18,.035,.08],[0,0,-.10]),dark,vp);
    draw('cyl',tubeBetween([-.34,-.73,-.25],[-.74,-.91,-.25],.034),chrome,vp);
    draw('cube',xform([-.80,-.94,-.25],[.18,.035,.08]),dark,vp);
    draw('cyl',tubeBetween([.46,-.42,.30],[.78,-.29,.30],.045),dark,vp);
    draw('sphere',xform([.83,-.27,.30],[.09,.09,.09]),dark,vp);
  }
'''

for path in (ROOT/'configurator3d.js',ROOT/'www/configurator3d.js'):
    s=path.read_text(encoding='utf-8')
    # Repair the old 4.0 loader insertion if it contains literal backslash-n sequences.
    a=s.find('  function initMeshes()')
    b=s.find('  function draw(',a)
    if a>=0 and b>a:
        fixed=s[a:b].replace('\\n','\n')
        s=s[:a]+fixed+s[b:]
    s=re.sub(r'  async function loadGLBComponents\(\)\{.*?\n  \}\n',new_loader,s,flags=re.S)
    s=re.sub(r'  function drawWheel\(.*?\n  \}\n\n  function drawEngine',new_wheel+'\n  function drawEngine',s,flags=re.S)
    s=re.sub(r'  function drawEngine\(.*?\n  \}\n\n  function drawTankAndBody',new_engine+'\n  function drawTankAndBody',s,flags=re.S)
    s=re.sub(r'S51 3D · GLB [0-9.]+','S51 3D · GLB 4.2',s)
    s=re.sub(r'>GLB [0-9.]+<','>GLB 4.2<',s)
    s=s.replace('Tank · Seitendeckel · Sitzbank · Rahmen · Cockpit · Räder · Motor · rechter Auspuff','Tank · Seitendeckel · Sitzbank · Rahmen · Cockpit · GLB-Räder · GLB-Motor · rechter Auspuff')
    path.write_text(s,encoding='utf-8')

for path in (ROOT/'configurator3d.css',ROOT/'www/configurator3d.css'):
    s=path.read_text(encoding='utf-8')
    s=re.sub(r'Phase 4\.0 GLB/WebGL|Phase 4\.1 GLB/WebGL','Phase 4.2 GLB/WebGL',s)
    path.write_text(s,encoding='utf-8')

extra=[
    './assets/models/engine_fins.glb','./assets/models/carb.glb','./assets/models/rim.glb','./assets/models/spokes.glb',
    './assets/models/star5.glb','./assets/models/star10.glb','./assets/models/hub.glb','./assets/models/brakedisc.glb'
]
for path in (ROOT/'sw.js',ROOT/'www/sw.js'):
    s=path.read_text(encoding='utf-8')
    s=re.sub(r'ww-v3-9-configurator-glb4-[0-9]+','ww-v3-9-configurator-glb4-2',s)
    for item in extra:
        token='"'+item+'"'
        if token not in s:
            s=s.replace('"./assets/models/manifest.json"',token+',"./assets/models/manifest.json"')
    path.write_text(s,encoding='utf-8')

print('GLB 4.2 engine and wheel detail generated')
