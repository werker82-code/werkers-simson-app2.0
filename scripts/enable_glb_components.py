from pathlib import Path
import json, math, struct, re

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
    mn=[min(p[j] for p in pts) for j in range(3)]
    mx=[max(p[j] for p in pts) for j in range(3)]
    doc={
        'asset':{'version':'2.0','generator':'Werkers Simson high-detail procedural GLB'},
        'scene':0,'scenes':[{'nodes':[0]}],
        'nodes':[{'mesh':0,'name':name}],
        'meshes':[{'name':name,'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],
        'materials':[{'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0.12,'roughnessFactor':0.42}}],
        'buffers':[{'byteLength':len(binblob)}],
        'bufferViews':views,
        'accessors':[
            {'bufferView':0,'componentType':5126,'count':len(verts)//3,'type':'VEC3','min':mn,'max':mx},
            {'bufferView':1,'componentType':5126,'count':len(norms)//3,'type':'VEC3'},
            {'bufferView':2,'componentType':5123,'count':len(indices),'type':'SCALAR'}
        ]
    }
    jb=pad4(json.dumps(doc,separators=(',',':')).encode(), b' ')
    total=12+8+len(jb)+8+len(binblob)
    return struct.pack('<4sII',b'glTF',2,total)+struct.pack('<I4s',len(jb),b'JSON')+jb+struct.pack('<I4s',len(binblob),b'BIN\x00')+binblob

def compute_normals(verts, indices):
    norms=[0.0]*len(verts)
    for i in range(0,len(indices),3):
        ia,ib,ic=indices[i:i+3]
        ax,ay,az=verts[3*ia:3*ia+3]
        bx,by,bz=verts[3*ib:3*ib+3]
        cx,cy,cz=verts[3*ic:3*ic+3]
        ux,uy,uz=bx-ax,by-ay,bz-az
        vx,vy,vz=cx-ax,cy-ay,cz-az
        nx=uy*vz-uz*vy
        ny=uz*vx-ux*vz
        nz=ux*vy-uy*vx
        for j in (ia,ib,ic):
            norms[3*j]+=nx; norms[3*j+1]+=ny; norms[3*j+2]+=nz
    for j in range(len(verts)//3):
        x,y,z=norms[3*j:3*j+3]
        L=(x*x+y*y+z*z)**0.5 or 1.0
        norms[3*j:3*j+3]=[x/L,y/L,z/L]
    return norms

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
            a=iy*(seg+1)+ix; b=a+seg+1
            ind += [a,b,a+1,b,b+1,a+1]
    return v,n,ind

def torus(R=.78,r=.13,seg=36,tube=14):
    v=[];n=[];ind=[]
    for i in range(seg+1):
        u=2*math.pi*i/seg; cu,su=math.cos(u),math.sin(u)
        for j in range(tube+1):
            q=2*math.pi*j/tube; cq,sq=math.cos(q),math.sin(q)
            v += [(R+r*cq)*cu,(R+r*cq)*su,r*sq]
            n += [cq*cu,cq*su,sq]
    for i in range(seg):
        for j in range(tube):
            a=i*(tube+1)+j;b=a+tube+1
            ind += [a,b,a+1,b,b+1,a+1]
    return v,n,ind

def tank_high_detail(seg=48):
    profile=[
        (-.96,.11,.15,-.055),(-.90,.20,.27,-.025),(-.78,.29,.36,.005),
        (-.55,.325,.395,.018),(-.25,.345,.415,.020),(.05,.345,.415,.012),
        (.32,.33,.395,0.0),(.56,.295,.355,-.012),(.74,.235,.300,-.028),
        (.86,.165,.220,-.045),(.92,.075,.105,-.055),
    ]
    v=[]; ind=[]; exp_y=.74
    for x,ry,rz,cy in profile:
        for j in range(seg):
            th=2*math.pi*j/seg
            sy=math.sin(th); cz=math.cos(th)
            y=cy + ry*math.copysign(abs(sy)**exp_y,sy)
            z=rz*math.copysign(abs(cz)**.82,cz)
            side=abs(cz)**6
            vertical=math.exp(-((y-(cy-.02))/(max(ry,.001)*.62))**2)
            longitudinal=math.exp(-((x-.02)/.62)**2)
            z *= 1-.11*side*vertical*longitudinal
            if y < cy-ry*.72:
                y=cy-ry*.72+(y-(cy-ry*.72))*.55
            if y > cy+ry*.82:
                y=cy+ry*.82+(y-(cy+ry*.82))*.70
            v += [x,y,z]
    rings=len(profile)
    for i in range(rings-1):
        for j in range(seg):
            a=i*seg+j; b=i*seg+(j+1)%seg
            c=(i+1)*seg+j; d=(i+1)*seg+(j+1)%seg
            ind += [a,c,b,b,c,d]
    for end,flip in [(0,True),(rings-1,False)]:
        x,ry,rz,cy=profile[end]
        center=len(v)//3
        v += [x,cy,0]
        base=end*seg
        for j in range(seg):
            a=base+j; b=base+(j+1)%seg
            ind += [center,b,a] if flip else [center,a,b]
    return v,compute_normals(v,ind),ind

def sidecover_high_detail():
    poly=[
        (-.57,.08),(-.54,.19),(-.46,.29),(-.30,.35),(-.08,.37),(.18,.34),
        (.38,.27),(.52,.16),(.57,.02),(.54,-.12),(.44,-.25),(.25,-.33),
        (.02,-.37),(-.22,-.35),(-.43,-.27),(-.56,-.12)
    ]
    cx=sum(x for x,y in poly)/len(poly); cy=sum(y for x,y in poly)/len(poly)
    inner=[(cx+(x-cx)*.88,cy+(y-cy)*.86) for x,y in poly]
    mid=[(cx+(x-cx)*.58,cy+(y-cy)*.58) for x,y in poly]
    v=[];ind=[];N=len(poly)
    for z,ring in [(0.035,poly),(-0.035,poly),(0.070,inner),(-0.070,inner),(0.086,mid),(-0.086,mid)]:
        for x,y in ring: v += [x,y,z]
    cf=len(v)//3; v += [cx,cy,.098]
    cb=len(v)//3; v += [cx,cy,-.098]
    for j in range(N):
        nj=(j+1)%N
        ind += [j,2*N+j,nj,nj,2*N+j,2*N+nj]
        ind += [N+j,N+nj,3*N+j,N+nj,3*N+nj,3*N+j]
        ind += [2*N+j,4*N+j,2*N+nj,2*N+nj,4*N+j,4*N+nj]
        ind += [3*N+j,3*N+nj,5*N+j,3*N+nj,5*N+nj,5*N+j]
        ind += [j,nj,N+j,nj,N+nj,N+j]
        ind += [cf,4*N+j,4*N+nj]
        ind += [cb,5*N+nj,5*N+j]
    return v,compute_normals(v,ind),ind

models={
    'tank.glb':('S51_Tank_HD',tank_high_detail(),[.18,.38,.56,1]),
    'sidecover.glb':('S51_Sidecover_HD',sidecover_high_detail(),[.18,.38,.56,1]),
    'wheel.glb':('S51_Wheel',torus(),[.04,.04,.04,1]),
    'engine.glb':('S51_Engine',ellipsoid(.61,.45,.47),[.52,.55,.56,1]),
}
for base in [ROOT/'assets/models',ROOT/'www/assets/models']:
    base.mkdir(parents=True,exist_ok=True)
    for fn,(name,geo,color) in models.items():
        (base/fn).write_bytes(make_glb(name,*geo,color))

manifest={
    'version':'body-highdetail-1',
    'components':{
        'tank':'assets/models/tank.glb','sidecover':'assets/models/sidecover.glb',
        'wheel':'assets/models/wheel.glb','engine':'assets/models/engine.glb'
    },
    'detail':{
        'tank':'lofted S51 profile with flattened underside and knee recesses',
        'sidecover':'bevelled rounded shield with shallow dome'
    }
}
for p in [ROOT/'assets/models/manifest.json',ROOT/'www/assets/models/manifest.json']:
    p.write_text(json.dumps(manifest,indent=2),encoding='utf-8')

tank_old="""    if(meshes.glbTank)draw('glbTank',xform([-.17,.78,0],[1,1,1],[0,0,-.035]),paint,vp);else draw('sphere',xform([-.17,.78,0],[.91,.34,.405],[0,0,-.035]),paint,vp);
    draw('sphere',xform([.44,.77,0],[.43,.30,.385],[0,0,-.13]),paint,vp);
    draw('wedge',xform([-.72,.73,0],[.34,.20,.36],[0,0,.09]),paint,vp);
    draw('cube',xform([-.15,.55,0],[.70,.055,.34],[0,0,-.04]),paint,vp);"""
tank_new="""    if(meshes.glbTank){
      draw('glbTank',xform([-.17,.78,0],[1,1,1],[0,0,-.035]),paint,vp);
    }else{
      draw('sphere',xform([-.17,.78,0],[.91,.34,.405],[0,0,-.035]),paint,vp);
      draw('sphere',xform([.44,.77,0],[.43,.30,.385],[0,0,-.13]),paint,vp);
      draw('wedge',xform([-.72,.73,0],[.34,.20,.36],[0,0,.09]),paint,vp);
      draw('cube',xform([-.15,.55,0],[.70,.055,.34],[0,0,-.04]),paint,vp);
    }"""

for path in [ROOT/'configurator3d.js',ROOT/'www/configurator3d.js']:
    s=path.read_text(encoding='utf-8')
    if tank_old in s:
        s=s.replace(tank_old,tank_new)
    s=s.replace('S51 3D · GLB 4.0','S51 3D · GLB 4.1')
    s=s.replace('<b>GLB 4.0</b>','<b>GLB 4.1</b>')
    path.write_text(s,encoding='utf-8')

for path in [ROOT/'configurator3d.css',ROOT/'www/configurator3d.css']:
    s=path.read_text(encoding='utf-8')
    s=s.replace('Phase 4.0 GLB/WebGL','Phase 4.1 High-detail GLB/WebGL')
    path.write_text(s,encoding='utf-8')

for path in [ROOT/'sw.js',ROOT/'www/sw.js']:
    s=path.read_text(encoding='utf-8')
    s=s.replace('ww-v3-9-configurator-glb4-0','ww-v3-9-configurator-glb4-1')
    path.write_text(s,encoding='utf-8')

print('GLB 4.1 high-detail tank and side covers generated and integrated')
