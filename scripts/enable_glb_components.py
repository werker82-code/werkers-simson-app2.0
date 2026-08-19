from pathlib import Path
import json, math, struct

ROOT=Path('.')

def pad4(b, fill=b'\x00'):
    return b + fill*((-len(b))%4)

def make_glb(name, verts, norms, indices, color):
    def f32(xs): return struct.pack('<%sf'%len(xs), *xs)
    def u16(xs): return struct.pack('<%sH'%len(xs), *xs)
    vb, nb, ib = f32(verts), f32(norms), u16(indices)
    chunks=[]; views=[]; off=0
    for raw,target in [(vb,34962),(nb,34962),(ib,34963)]:
        chunks.append(pad4(raw)); views.append({'buffer':0,'byteOffset':off,'byteLength':len(raw),'target':target}); off+=len(chunks[-1])
    binblob=b''.join(chunks)
    pts=[verts[i:i+3] for i in range(0,len(verts),3)]
    mn=[min(p[j] for p in pts) for j in range(3)]; mx=[max(p[j] for p in pts) for j in range(3)]
    doc={'asset':{'version':'2.0','generator':'Werkers Simson procedural GLB starter'},'scene':0,'scenes':[{'nodes':[0]}],
         'nodes':[{'mesh':0,'name':name}], 'meshes':[{'name':name,'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],
         'materials':[{'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0.15,'roughnessFactor':0.48}}],
         'buffers':[{'byteLength':len(binblob)}], 'bufferViews':views,
         'accessors':[{'bufferView':0,'componentType':5126,'count':len(verts)//3,'type':'VEC3','min':mn,'max':mx},
                      {'bufferView':1,'componentType':5126,'count':len(norms)//3,'type':'VEC3'},
                      {'bufferView':2,'componentType':5123,'count':len(indices),'type':'SCALAR'}]}
    jb=pad4(json.dumps(doc,separators=(',',':')).encode(), b' ')
    total=12+8+len(jb)+8+len(binblob)
    return struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(jb),b'JSON')+jb+struct.pack('<I4s',len(binblob),b'BIN\x00')+binblob

def ellipsoid(rx,ry,rz,seg=28,ring=16):
    v=[]; n=[]; ind=[]
    for iy in range(ring+1):
        ph=math.pi*iy/ring
        for ix in range(seg+1):
            th=2*math.pi*ix/seg; s=math.sin(ph)
            x=rx*math.cos(th)*s; y=ry*math.cos(ph); z=rz*math.sin(th)*s
            nx=x/(rx*rx); ny=y/(ry*ry); nz=z/(rz*rz); L=(nx*nx+ny*ny+nz*nz)**.5 or 1
            v += [x,y,z]; n += [nx/L,ny/L,nz/L]
    for iy in range(ring):
        for ix in range(seg):
            a=iy*(seg+1)+ix; b=a+seg+1; ind += [a,b,a+1,b,b+1,a+1]
    return v,n,ind

def box(sx,sy,sz):
    faces=[((0,0,1),[(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]),((0,0,-1),[(sx,-sy,-sz),(-sx,-sy,-sz),(-sx,sy,-sz),(sx,sy,-sz)]),((0,1,0),[(-sx,sy,sz),(sx,sy,sz),(sx,sy,-sz),(-sx,sy,-sz)]),((0,-1,0),[(-sx,-sy,-sz),(sx,-sy,-sz),(sx,-sy,sz),(-sx,-sy,sz)]),((1,0,0),[(sx,-sy,sz),(sx,-sy,-sz),(sx,sy,-sz),(sx,sy,sz)]),((-1,0,0),[(-sx,-sy,-sz),(-sx,-sy,sz),(-sx,sy,sz),(-sx,sy,-sz)])]
    v=[];n=[];ind=[]
    for normal,vs in faces:
        base=len(v)//3
        for p in vs: v+=list(p); n+=list(normal)
        ind += [base,base+1,base+2,base,base+2,base+3]
    return v,n,ind

def torus(R=.78,r=.13,seg=36,tube=14):
    v=[];n=[];ind=[]
    for i in range(seg+1):
        u=2*math.pi*i/seg; cu,su=math.cos(u),math.sin(u)
        for j in range(tube+1):
            q=2*math.pi*j/tube; cq,sq=math.cos(q),math.sin(q)
            v += [(R+r*cq)*cu,(R+r*cq)*su,r*sq]; n += [cq*cu,cq*su,sq]
    for i in range(seg):
        for j in range(tube):
            a=i*(tube+1)+j;b=a+tube+1;ind += [a,b,a+1,b,b+1,a+1]
    return v,n,ind

models={
 'tank.glb':('S51_Tank',ellipsoid(.91,.34,.405),[.18,.38,.56,1]),
 'sidecover.glb':('S51_Sidecover',box(.55,.36,.055),[.18,.38,.56,1]),
 'wheel.glb':('S51_Wheel',torus(),[.04,.04,.04,1]),
 'engine.glb':('S51_Engine',ellipsoid(.61,.45,.47),[.52,.55,.56,1]),
}
for base in [ROOT/'assets/models',ROOT/'www/assets/models']:
    base.mkdir(parents=True,exist_ok=True)
    for fn,(name,geo,color) in models.items(): (base/fn).write_bytes(make_glb(name,*geo,color))
manifest={'version':'starter-1','components':{'tank':'assets/models/tank.glb','sidecover':'assets/models/sidecover.glb','wheel':'assets/models/wheel.glb','engine':'assets/models/engine.glb'}}
for p in [ROOT/'assets/models/manifest.json',ROOT/'www/assets/models/manifest.json']: p.write_text(json.dumps(manifest,indent=2),encoding='utf-8')

loader=r'''\n  async function loadGLBMesh(url,key){\n    try{\n      const buf=await fetch(url).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer()});\n      const dv=new DataView(buf);if(dv.getUint32(0,true)!==0x46546c67)throw Error('not glb');\n      let off=12,jsonDoc=null,bin=null;\n      while(off<buf.byteLength){const len=dv.getUint32(off,true),typ=dv.getUint32(off+4,true);off+=8;const part=buf.slice(off,off+len);off+=len;if(typ===0x4E4F534A)jsonDoc=JSON.parse(new TextDecoder().decode(part));else if(typ===0x004E4942)bin=part}\n      const prim=jsonDoc.meshes[0].primitives[0],acc=jsonDoc.accessors,bv=jsonDoc.bufferViews;\n      function read(ai){const a=acc[ai],v=bv[a.bufferView],start=(v.byteOffset||0)+(a.byteOffset||0),count=a.count,comps=a.type==='VEC3'?3:1;let arr;if(a.componentType===5126)arr=new Float32Array(bin,start,count*comps);else if(a.componentType===5123)arr=new Uint16Array(bin,start,count*comps);else throw Error('component');return Array.from(arr)}\n      meshes[key]=mesh(read(prim.attributes.POSITION),read(prim.attributes.NORMAL),read(prim.indices));\n      return true;\n    }catch(e){console.warn('GLB fallback',key,e);return false}\n  }\n  async function loadGLBComponents(){\n    const root=location.pathname.includes('/www/')?'assets/models/':'assets/models/';\n    const ok=await Promise.all([loadGLBMesh(root+'tank.glb','glbTank'),loadGLBMesh(root+'sidecover.glb','glbSidecover'),loadGLBMesh(root+'wheel.glb','glbWheel'),loadGLBMesh(root+'engine.glb','glbEngine')]);\n    glbReady=ok.some(Boolean);\n  }\n'''

for path in [ROOT/'configurator3d.js',ROOT/'www/configurator3d.js']:
    s=path.read_text(encoding='utf-8')
    if 'let glbReady' not in s: s=s.replace('let meshes = {}, wrapped = false, pinchDist = 0;','let meshes = {}, wrapped = false, pinchDist = 0, glbReady = false;')
    if 'async function loadGLBMesh' not in s: s=s.replace('  function initMeshes(){meshes={cube:cube(),sphere:uvSphere(),torus:torus(),cyl:cyl(),wedge:wedge()}}','  function initMeshes(){meshes={cube:cube(),sphere:uvSphere(),torus:torus(),cyl:cyl(),wedge:wedge()}}'+loader)
    s=s.replace("draw('torus',xform([cx,cy,0],[wr,wr,wr]),tire,vp);","if(meshes.glbWheel)draw('glbWheel',xform([cx,cy,0],[wr/.91,wr/.91,wr/.91]),tire,vp);else draw('torus',xform([cx,cy,0],[wr,wr,wr]),tire,vp);")
    s=s.replace("draw('sphere',xform([.02,-.57,0],[.61,.45,.47]),metal,vp);","if(meshes.glbEngine)draw('glbEngine',xform([.02,-.57,0]),metal,vp);else draw('sphere',xform([.02,-.57,0],[.61,.45,.47]),metal,vp);")
    s=s.replace("draw('sphere',xform([-.17,.78,0],[.91,.34,.405],[0,0,-.035]),paint,vp);","if(meshes.glbTank)draw('glbTank',xform([-.17,.78,0],[1,1,1],[0,0,-.035]),paint,vp);else draw('sphere',xform([-.17,.78,0],[.91,.34,.405],[0,0,-.035]),paint,vp);")
    s=s.replace("draw('wedge',xform([-.28,.02,-.31],[.55,.36,.055],[0,0,-.10]),side,vp);","if(meshes.glbSidecover)draw('glbSidecover',xform([-.28,.02,-.31],[1,1,1],[0,0,-.10]),side,vp);else draw('wedge',xform([-.28,.02,-.31],[.55,.36,.055],[0,0,-.10]),side,vp);")
    s=s.replace("draw('wedge',xform([-.28,.02,.31],[.55,.36,.055],[0,0,-.10]),side,vp);","if(meshes.glbSidecover)draw('glbSidecover',xform([-.28,.02,.31],[1,1,1],[0,0,-.10]),side,vp);else draw('wedge',xform([-.28,.02,.31],[.55,.36,.055],[0,0,-.10]),side,vp);")
    s=s.replace('program=mkProgram();initMeshes();bind();cancelAnimationFrame(raf);render()','program=mkProgram();initMeshes();loadGLBComponents();bind();cancelAnimationFrame(raf);render()')
    s=s.replace('S51 3D · Detail 3.3','S51 3D · GLB 4.0').replace('PHASE 3.3','GLB 4.0')
    path.write_text(s,encoding='utf-8')

for path in [ROOT/'configurator3d.css',ROOT/'www/configurator3d.css']:
    s=path.read_text(encoding='utf-8').replace('Phase 3.3 WebGL','Phase 4.0 GLB/WebGL')
    path.write_text(s,encoding='utf-8')

for path in [ROOT/'sw.js',ROOT/'www/sw.js']:
    s=path.read_text(encoding='utf-8')
    import re
    s=re.sub(r'ww-v3-9-configurator-p3-3','ww-v3-9-configurator-glb4-0',s)
    if 'assets/models/tank.glb' not in s:
        s=s.replace('"./assets/s51-overview.svg"', '"./assets/s51-overview.svg","./assets/models/tank.glb","./assets/models/sidecover.glb","./assets/models/wheel.glb","./assets/models/engine.glb","./assets/models/manifest.json"')
    path.write_text(s,encoding='utf-8')
print('GLB 4.0 components generated and wired')
