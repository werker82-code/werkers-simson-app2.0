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
        'asset': {'version':'2.0','generator':'Werkers Simson GLB 4.4 body/cockpit'},
        'scene':0,'scenes':[{'nodes':[0]}],
        'nodes':[{'mesh':0,'name':name}],
        'meshes':[{'name':name,'primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'indices':2,'material':0}]}],
        'materials':[{'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0.20,'roughnessFactor':0.42}}],
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


def tube(a,b,r=0.05,seg=18,r2=None):
    r2 = r if r2 is None else r2
    u,v,w,L=basis_for_axis(a,b)
    verts=[]; norms=[]; inds=[]
    for p,rr in ((a,r),(b,r2)):
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


def ellipsoid(cx,cy,cz,rx,ry,rz,seg=28,ring=16):
    v=[]; n=[]; ind=[]
    for iy in range(ring+1):
        ph=math.pi*iy/ring
        for ix in range(seg+1):
            th=2*math.pi*ix/seg; sp=math.sin(ph)
            x=cx+rx*math.cos(th)*sp; y=cy+ry*math.cos(ph); z=cz+rz*math.sin(th)*sp
            nx=(x-cx)/(rx*rx); ny=(y-cy)/(ry*ry); nz=(z-cz)/(rz*rz)
            L=(nx*nx+ny*ny+nz*nz)**.5 or 1
            v += [x,y,z]; n += [nx/L,ny/L,nz/L]
    for iy in range(ring):
        for ix in range(seg):
            a=iy*(seg+1)+ix; b=a+seg+1; ind += [a,b,a+1,b,b+1,a+1]
    return v,n,ind


def loft_x(sections, seg=24):
    v=[]; n=[]; ind=[]
    for x,cy,ry,rz in sections:
        for k in range(seg):
            a=2*math.pi*k/seg; ca,sa=math.cos(a),math.sin(a)
            y=cy+ry*ca; z=rz*sa
            v += [x,y,z]
            ny=ca/max(ry,1e-4); nz=sa/max(rz,1e-4); L=(ny*ny+nz*nz)**.5 or 1
            n += [0,ny/L,nz/L]
    rings=len(sections)
    for j in range(rings-1):
        for k in range(seg):
            q=(k+1)%seg; a=j*seg+k; b=(j+1)*seg+k
            ind += [a,b,j*seg+q, j*seg+q,b,(j+1)*seg+q]
    # end caps
    for end in (0,rings-1):
        base=len(v)//3; x,cy,ry,rz=sections[end]; sign=-1 if end==0 else 1
        v += [x,cy,0]; n += [sign,0,0]
        for k in range(seg):
            a=2*math.pi*k/seg; v += [x,cy+ry*math.cos(a),rz*math.sin(a)]; n += [sign,0,0]
        for k in range(seg):
            q=(k+1)%seg
            if end==0: ind += [base,base+1+q,base+1+k]
            else: ind += [base,base+1+k,base+1+q]
    return v,n,ind


def arc_fender(cx,cy,R,width=.30,th=.045,a0=.35,a1=2.78,seg=36):
    v=[]; n=[]; ind=[]
    rin=R-th; rout=R+th
    for i in range(seg+1):
        a=a0+(a1-a0)*i/seg; ca,sa=math.cos(a),math.sin(a)
        for rr,z in ((rin,-width),(rin,width),(rout,-width),(rout,width)):
            v += [cx+rr*ca,cy+rr*sa,z]
            # approximate radial normal
            n += [ca,sa,0]
    for i in range(seg):
        a=i*4; b=(i+1)*4
        # inner, outer, side walls
        ind += [a,b,a+1,a+1,b,b+1]
        ind += [a+2,a+3,b+2,a+3,b+3,b+2]
        ind += [a,a+2,b,a+2,b+2,b]
        ind += [a+1,b+1,a+3,a+3,b+1,b+3]
    return v,n,ind


def build_seat(kind):
    if kind=='flat':
        sec=[(-1.70,1.20,.105,.27),(-1.35,1.22,.115,.34),(-.70,1.23,.115,.35),(.05,1.22,.105,.32),(.35,1.16,.080,.25)]
    elif kind=='sport':
        sec=[(-1.48,1.25,.145,.25),(-1.18,1.32,.180,.32),(-.82,1.29,.155,.34),(-.25,1.22,.115,.31),(.30,1.15,.080,.24)]
    else:
        sec=[(-1.72,1.22,.120,.27),(-1.40,1.27,.155,.34),(-.78,1.30,.160,.36),(-.10,1.27,.145,.34),(.38,1.16,.085,.25)]
    return MeshFrom(loft_x(sec,28))


def MeshFrom(g):
    m=Mesh(); m.add(*g); return m


def build_handlebar(kind):
    m=Mesh()
    if kind=='enduro':
        center=[1.56,1.70,0]; left=[1.60,1.82,.64]; right=[1.60,1.82,-.64]
        m.add(*tube([1.50,.84,0],center,.036,18))
        m.add(*tube(center,left,.035,18)); m.add(*tube(center,right,.035,18))
        m.add(*tube([1.58,1.71,-.45],[1.58,1.71,.45],.023,16))
        m.add(*tube([1.60,1.82,.52],left,.052,16)); m.add(*tube([1.60,1.82,-.52],right,.052,16))
    elif kind=='cross':
        center=[1.58,1.62,0]; left=[1.62,1.66,.70]; right=[1.62,1.66,-.70]
        m.add(*tube([1.50,.84,0],center,.036,18))
        m.add(*tube(center,left,.036,18)); m.add(*tube(center,right,.036,18))
        m.add(*tube([1.60,1.63,-.48],[1.60,1.63,.48],.026,16))
        m.add(*tube([1.62,1.66,.56],left,.054,16)); m.add(*tube([1.62,1.66,-.56],right,.054,16))
    else:
        center=[1.58,1.53,0]; left=[1.62,1.58,.56]; right=[1.62,1.58,-.56]
        m.add(*tube([1.50,.84,0],center,.034,18))
        m.add(*tube(center,left,.034,18)); m.add(*tube(center,right,.034,18))
        m.add(*tube([1.62,1.58,.45],left,.050,16)); m.add(*tube([1.62,1.58,-.45],right,.050,16))
    return m


def build_cockpit():
    m=Mesh()
    m.add(*ellipsoid(1.48,1.34,0,.17,.16,.11,24,12))
    m.add(*box(1.56,1.47,0,.19,.045,.14))
    m.add(*tube([1.42,1.20,0],[1.48,1.30,0],.026,14))
    return m


def build_headlight_shell():
    m=Mesh(); m.add(*ellipsoid(1.60,1.03,0,.31,.28,.27,28,16)); return m


def build_headlight_lens(kind):
    m=Mesh()
    if kind=='led':
        m.add(*ellipsoid(1.82,1.03,0,.060,.205,.205,28,14))
        # small center projector boss
        m.add(*ellipsoid(1.865,1.03,0,.025,.080,.080,20,10))
    elif kind=='h4':
        m.add(*ellipsoid(1.825,1.03,0,.055,.215,.215,28,14))
        m.add(*box(1.865,1.03,0,.018,.055,.055))
    else:
        m.add(*ellipsoid(1.82,1.03,0,.065,.220,.220,28,14))
    return m


def build_indicators(front=True):
    m=Mesh()
    if front:
        points=[(1.68,1.19,-.42),(1.68,1.19,.42)]
    else:
        points=[(-1.72,.77,-.39),(-1.72,.77,.39)]
    for x,y,z in points:
        m.add(*ellipsoid(x,y,z,.095,.080,.080,20,10))
    return m


def build_taillight():
    m=Mesh(); m.add(*ellipsoid(-1.84,.72,0,.085,.130,.205,22,12)); return m


def build_licenseplate():
    m=Mesh(); m.add(*box(-2.04,.42,0,.025,.18,.22)); return m


models={
    'seat_standard.glb':('S51_Seat_Standard',build_seat('standard'),[.08,.08,.08,1]),
    'seat_flat.glb':('S51_Seat_Flat',build_seat('flat'),[.08,.08,.08,1]),
    'seat_sport.glb':('S51_Seat_Sport',build_seat('sport'),[.08,.08,.08,1]),
    'handlebar_street.glb':('S51_Handlebar_Street',build_handlebar('street'),[.72,.75,.76,1]),
    'handlebar_enduro.glb':('S51_Handlebar_Enduro',build_handlebar('enduro'),[.72,.75,.76,1]),
    'handlebar_cross.glb':('S51_Handlebar_Cross',build_handlebar('cross'),[.20,.21,.21,1]),
    'cockpit.glb':('S51_Cockpit',build_cockpit(),[.10,.10,.10,1]),
    'headlight_shell.glb':('S51_Headlight_Shell',build_headlight_shell(),[.09,.09,.09,1]),
    'headlight_classic.glb':('S51_Headlight_Classic',build_headlight_lens('classic'),[.93,.86,.60,1]),
    'headlight_h4.glb':('S51_Headlight_H4',build_headlight_lens('h4'),[.92,.92,.82,1]),
    'headlight_led.glb':('S51_Headlight_LED',build_headlight_lens('led'),[.76,.92,.40,1]),
    'indicators_front.glb':('S51_Indicators_Front',build_indicators(True),[.94,.46,.05,1]),
    'indicators_rear.glb':('S51_Indicators_Rear',build_indicators(False),[.94,.46,.05,1]),
    'taillight.glb':('S51_Taillight',build_taillight(),[.62,.03,.02,1]),
    'licenseplate.glb':('S51_License_Plate',build_licenseplate(),[.84,.84,.80,1]),
    'front_fender_classic.glb':('S51_Fender_Front_Classic',MeshFrom(arc_fender(2.15,-1.05,.93,.29,.035,.38,2.78,34)),[.76,.79,.80,1]),
    'front_fender_enduro.glb':('S51_Fender_Front_Enduro',MeshFrom(arc_fender(2.15,-1.05,.94,.30,.050,.67,2.52,28)),[.07,.07,.07,1]),
    'rear_fender.glb':('S51_Fender_Rear',MeshFrom(arc_fender(-2.05,-1.05,.93,.29,.040,.36,2.82,34)),[.07,.07,.07,1]),
}

for base in [ROOT/'assets/models',ROOT/'www/assets/models']:
    base.mkdir(parents=True,exist_ok=True)
    for fn,(name,m,color) in models.items():
        (base/fn).write_bytes(make_glb(name,m.v,m.n,m.i,color))

manifest_path=ROOT/'assets/models/manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['version']='body-cockpit-highdetail-1'
manifest['components'].update({
    'seatStandard':'assets/models/seat_standard.glb','seatFlat':'assets/models/seat_flat.glb','seatSport':'assets/models/seat_sport.glb',
    'handlebarStreet':'assets/models/handlebar_street.glb','handlebarEnduro':'assets/models/handlebar_enduro.glb','handlebarCross':'assets/models/handlebar_cross.glb',
    'cockpit':'assets/models/cockpit.glb','headlightShell':'assets/models/headlight_shell.glb',
    'headlightClassic':'assets/models/headlight_classic.glb','headlightH4':'assets/models/headlight_h4.glb','headlightLed':'assets/models/headlight_led.glb',
    'indicatorsFront':'assets/models/indicators_front.glb','indicatorsRear':'assets/models/indicators_rear.glb',
    'taillight':'assets/models/taillight.glb','licenseplate':'assets/models/licenseplate.glb',
    'frontFenderClassic':'assets/models/front_fender_classic.glb','frontFenderEnduro':'assets/models/front_fender_enduro.glb','rearFender':'assets/models/rear_fender.glb'
})
manifest.setdefault('detail',{}).update({
    'seat':'standard, flat and sport seat GLBs with rounded lofted upholstery',
    'handlebar':'street, enduro and cross handlebar assemblies with real lateral width',
    'cockpit':'separate speedometer/cluster and mounting geometry',
    'headlight':'separate shell plus classic, H4 and LED-look lens components',
    'indicators':'separate front and rear indicator pairs',
    'fenders':'curved classic/enduro front and rear fender meshes',
    'rearLighting':'separate taillight and license plate components'
})
for p in [ROOT/'assets/models/manifest.json',ROOT/'www/assets/models/manifest.json']:
    p.write_text(json.dumps(manifest,indent=2),encoding='utf-8')

# Patch both renderer copies.
def extend_defs(s):
    if "['seat_standard.glb','glbSeatStandard']" in s:
        return s
    anchor="      ['exhaust_series.glb','glbExhaustSeries'],['exhaust_enduro.glb','glbExhaustEnduro'],['exhaust_sport.glb','glbExhaustSport']\n"
    addition="""      ['exhaust_series.glb','glbExhaustSeries'],['exhaust_enduro.glb','glbExhaustEnduro'],['exhaust_sport.glb','glbExhaustSport'],
      ['seat_standard.glb','glbSeatStandard'],['seat_flat.glb','glbSeatFlat'],['seat_sport.glb','glbSeatSport'],
      ['handlebar_street.glb','glbHandlebarStreet'],['handlebar_enduro.glb','glbHandlebarEnduro'],['handlebar_cross.glb','glbHandlebarCross'],['cockpit.glb','glbCockpit'],
      ['headlight_shell.glb','glbHeadlightShell'],['headlight_classic.glb','glbHeadlightClassic'],['headlight_h4.glb','glbHeadlightH4'],['headlight_led.glb','glbHeadlightLed'],
      ['indicators_front.glb','glbIndicatorsFront'],['indicators_rear.glb','glbIndicatorsRear'],['taillight.glb','glbTaillight'],['licenseplate.glb','glbLicenseplate'],
      ['front_fender_classic.glb','glbFrontFenderClassic'],['front_fender_enduro.glb','glbFrontFenderEnduro'],['rear_fender.glb','glbRearFender']
"""
    if anchor not in s: raise RuntimeError('GLB defs anchor missing')
    return s.replace(anchor,addition,1)

new_body=r'''  function drawTankAndBody(c,vp,paint,side,dark,chrome,enduro){
    if(meshes.glbTank)draw('glbTank',xform([-.17,.78,0],[1,1,1],[0,0,-.035]),paint,vp);else{
      draw('sphere',xform([-.17,.78,0],[.91,.34,.405],[0,0,-.035]),paint,vp);
      draw('sphere',xform([.44,.77,0],[.43,.30,.385],[0,0,-.13]),paint,vp);
      draw('wedge',xform([-.72,.73,0],[.34,.20,.36],[0,0,.09]),paint,vp);
    }
    draw('cyl',xform([-.28,1.11,0],[.11,.025,.11],[0,0,Math.PI/2]),chrome,vp);
    draw('sphere',xform([-.08,.70,-.39],[.38,.14,.045],[0,0,-.04]),dark,vp);
    draw('sphere',xform([-.08,.70,.39],[.38,.14,.045],[0,0,-.04]),dark,vp);
    if(meshes.glbSidecover)draw('glbSidecover',xform([-.28,.02,-.31],[1,1,1],[0,0,-.10]),side,vp);else draw('wedge',xform([-.28,.02,-.31],[.55,.36,.055],[0,0,-.10]),side,vp);
    if(meshes.glbSidecover)draw('glbSidecover',xform([-.28,.02,.31],[1,1,1],[0,0,-.10]),side,vp);else draw('wedge',xform([-.28,.02,.31],[.55,.36,.055],[0,0,-.10]),side,vp);
    const seatType=c.seat||'standard', seatMesh=seatType==='flat'?'glbSeatFlat':seatType==='sport'?'glbSeatSport':'glbSeatStandard';
    if(meshes[seatMesh])draw(seatMesh,xform(),dark,vp);else draw('wedge',xform([-.62,1.20,0],[1.03,.15,.35],[0,0,.018]),dark,vp);
    draw('cyl',tubeBetween([-1.55,1.14,-.31],[-1.88,.93,-.31],.026),chrome,vp);draw('cyl',tubeBetween([-1.55,1.14,.31],[-1.88,.93,.31],.026),chrome,vp);
    if(enduro)draw('cube',xform([-.76,.94,-.40],[.34,.065,.04],[0,0,.02]),dark,vp);
    draw('cyl',tubeBetween([-.98,.53,-.31],[-.98,.14,-.31],.025),chrome,vp);
  }

'''

new_cockpit=r'''  function drawCockpit(c,vp,dark,chrome){
    let barType=c.handlebar||c.bar||'street';
    if(c.base==='enduro'&&barType==='street')barType='enduro';
    const barMesh=barType==='enduro'?'glbHandlebarEnduro':barType==='cross'?'glbHandlebarCross':'glbHandlebarStreet';
    const barColor=barType==='cross'?dark:chrome;
    if(meshes[barMesh])draw(barMesh,xform(),barColor,vp);else{
      const high=barType==='enduro',barY=high?1.80:1.60,barX=1.60;
      draw('cyl',tubeBetween([1.50,.82,0],[barX,barY-.08,0],.034),chrome,vp);
      draw('cyl',tubeBetween([barX,barY,0],[barX,barY+.02,.58],.034),chrome,vp);draw('cyl',tubeBetween([barX,barY,0],[barX,barY+.02,-.58],.034),chrome,vp);
    }
    if(meshes.glbCockpit)draw('glbCockpit',xform(),dark,vp);else draw('cyl',xform([1.53,1.36,-.055],[.195,.060,.195],[Math.PI/2,0,0]),dark,vp);
    if(meshes.glbHeadlightShell)draw('glbHeadlightShell',xform(),dark,vp);else draw('sphere',xform([1.60,1.02,0],[.31,.29,.27]),dark,vp);
    const light=c.light||'classic',lensMesh=light==='led'?'glbHeadlightLed':light==='h4'?'glbHeadlightH4':'glbHeadlightClassic';
    const lensColor=light==='led'?[.74,.91,.35]:light==='h4'?[.91,.91,.82]:[.91,.85,.58];
    if(meshes[lensMesh])draw(lensMesh,xform(),lensColor,vp);else draw('sphere',xform([1.80,1.02,0],[.12,.24,.235]),lensColor,vp);
    draw('cyl',tubeBetween([1.43,1.21,-.24],[1.59,.98,-.24],.026),chrome,vp);draw('cyl',tubeBetween([1.43,1.21,.24],[1.59,.98,.24],.026),chrome,vp);
    if(meshes.glbIndicatorsFront)draw('glbIndicatorsFront',xform(),[.94,.46,.05],vp);else{
      draw('sphere',xform([1.68,1.19,-.42],[.10,.08,.08]),[.94,.46,.05],vp);draw('sphere',xform([1.68,1.19,.42],[.10,.08,.08]),[.94,.46,.05],vp);
    }
    draw('cyl',tubeBetween([1.55,1.18,-.24],[1.66,1.19,-.38],.018),chrome,vp);draw('cyl',tubeBetween([1.55,1.18,.24],[1.66,1.19,.38],.018),chrome,vp);
    draw('cyl',tubeBetween([1.58,1.53,-.42],[1.50,.82,-.18],.011),dark,vp);draw('cyl',tubeBetween([1.58,1.53,.42],[.65,.55,.18],.011),dark,vp);
    if(c.mirror!=='none'&&(c.mirror||c.base==='street')){
      const y=barType==='enduro'?1.82:1.60;
      draw('cyl',tubeBetween([1.60,y,-.48],[1.72,y+.38,-.55],.018),chrome,vp);draw('sphere',xform([1.75,y+.44,-.57],[.14,.19,.05],[0,0,-.25]),[.32,.34,.34],vp);
    }
  }

'''

new_frame=r'''  function drawFrameAndRunningGear(c,vp,dark,chrome,ry,fy,enduro){
    if(meshes.glbFrame)draw('glbFrame',xform(),dark,vp);else{
      const frame=[[-1.96,ry,0],[-.82,.25,0],[-.05,-.79,0],[-.82,.25,0],[-.67,1.02,0],[-.67,1.02,0],[.72,.24,0],[-.05,-.79,0],[.72,.24,0],[1.53,.82,0]];
      for(let i=0;i<frame.length;i+=2)draw('cyl',tubeBetween(frame[i],frame[i+1],.072),dark,vp);
    }
    if(meshes.glbSwingarm)draw('glbSwingarm',xform([0,ry+1.05,0]),dark,vp);else{
      draw('cyl',tubeBetween([-.06,-.70,-.13],[-1.98,ry,-.13],.045),dark,vp);draw('cyl',tubeBetween([-.06,-.70,.13],[-1.98,ry,.13],.045),dark,vp);
    }
    const forkColor=c.fork==='black'?dark:chrome;
    if(meshes.glbFork)draw('glbFork',xform([0,fy+1.05,0]),forkColor,vp);else{
      draw('cyl',tubeBetween([1.48,.74,-.10],[2.15,fy,-.10],.050),forkColor,vp);draw('cyl',tubeBetween([1.48,.74,.10],[2.15,fy,.10],.050),forkColor,vp);
    }
    const sh=c.shock==='chrome'?chrome:[.24,.25,.25], shockMesh=c.shock==='long'?'glbShocksLong':'glbShocks';
    if(meshes[shockMesh])draw(shockMesh,xform(),sh,vp);else{
      draw('cyl',tubeBetween([-1.90,ry,-.20],[-.70,.57,-.20],.050),sh,vp);draw('cyl',tubeBetween([-1.90,ry,.20],[-.70,.57,.20],.050),sh,vp);
    }
    draw('cube',xform([-1.05,-.66,.22],[.83,.045,.10],[0,0,.04]),dark,vp);draw('cyl',tubeBetween([-.28,-.87,.15],[-.55,-1.48,.25],.035),dark,vp);draw('cyl',tubeBetween([-.28,-.87,-.15],[-.55,-1.48,-.25],.035),dark,vp);
    const fenderDelta=fy+1.05;
    if(enduro||c.frontFender==='black'){
      if(meshes.glbFrontFenderEnduro)draw('glbFrontFenderEnduro',xform([0,fenderDelta,0]),dark,vp);else draw('wedge',xform([2.07,-.29+fenderDelta,0],[.63,.055,.30],[0,0,.15]),dark,vp);
    }else{
      const fc=c.frontFender==='paint'?hex(c.tankColor||'#2f608f'):chrome;
      if(meshes.glbFrontFenderClassic)draw('glbFrontFenderClassic',xform([0,fenderDelta,0]),fc,vp);else draw('wedge',xform([2.14,-.18+fenderDelta,0],[.65,.045,.29],[0,0,.04]),fc,vp);
    }
    const rearColor=c.rearFender==='paint'?hex(c.tankColor||'#2f608f'):dark, rearDelta=ry+1.05;
    if(meshes.glbRearFender)draw('glbRearFender',xform([0,rearDelta,0]),rearColor,vp);else draw('wedge',xform([-2.03,-.20+rearDelta,0],[.66,.045,.29],[0,0,-.04]),rearColor,vp);
  }

'''

rear_fn=r'''  function drawRearLighting(c,vp,dark,chrome){
    draw('cube',xform([-1.78,.69,0],[.10,.15,.23]),dark,vp);
    if(meshes.glbTaillight)draw('glbTaillight',xform(),[.62,.03,.02],vp);else draw('cube',xform([-1.84,.72,0],[.15,.12,.21]),[.46,.04,.03],vp);
    if(meshes.glbLicenseplate)draw('glbLicenseplate',xform(),[.84,.84,.80],vp);else draw('cube',xform([-2.04,.42,0],[.03,.18,.22]),[.82,.82,.78],vp);
    if(meshes.glbIndicatorsRear)draw('glbIndicatorsRear',xform(),[.94,.46,.05],vp);else{
      draw('sphere',xform([-1.69,.77,-.37],[.10,.08,.08]),[.90,.47,.06],vp);draw('sphere',xform([-1.69,.77,.37],[.10,.08,.08]),[.90,.47,.06],vp);
    }
    draw('cyl',tubeBetween([-1.60,.76,-.23],[-1.69,.77,-.34],.018),chrome,vp);draw('cyl',tubeBetween([-1.60,.76,.23],[-1.69,.77,.34],.018),chrome,vp);
  }

'''

for path in [ROOT/'configurator3d.js',ROOT/'www/configurator3d.js']:
    s=path.read_text(encoding='utf-8')
    s=extend_defs(s)
    s,n=re.subn(r"  function drawTankAndBody\(c,vp,paint,side,dark,chrome,enduro\)\{.*?\n  \}\n\n(?=  function drawCockpit)",new_body,s,count=1,flags=re.S)
    if n!=1: raise RuntimeError(f'body function patch failed in {path}')
    s,n=re.subn(r"  function drawCockpit\(c,vp,dark,chrome\)\{.*?\n  \}\n\n(?=  function drawFrameAndRunningGear)",new_cockpit,s,count=1,flags=re.S)
    if n!=1: raise RuntimeError(f'cockpit function patch failed in {path}')
    s,n=re.subn(r"  function drawFrameAndRunningGear\(c,vp,dark,chrome,ry,fy,enduro\)\{.*?\n  \}\n\n(?=  function drawExhaust)",new_frame,s,count=1,flags=re.S)
    if n!=1: raise RuntimeError(f'frame function patch failed in {path}')
    if 'function drawRearLighting' not in s:
        s=s.replace('  function scene(vp){',rear_fn+'  function scene(vp){',1)
    old_rear="draw('cube',xform([-1.82,.72,0],[.15,.12,.21]),[.46,.04,.03],vp);draw('cube',xform([-1.96,.50,0],[.16,.20,.20],[0,0,-.10]),dark,vp);draw('cube',xform([-2.08,.30,0],[.18,.14,.20],[0,0,-.10]),[.82,.82,.78],vp);draw('sphere',xform([-1.69,.77,-.37],[.10,.08,.08]),[.90,.47,.06],vp);draw('sphere',xform([-1.69,.77,.37],[.10,.08,.08]),[.90,.47,.06],vp);"
    if old_rear in s:
        s=s.replace(old_rear,'drawRearLighting(c,vp,dark,chrome);',1)
    elif 'drawRearLighting(c,vp,dark,chrome);' not in s:
        raise RuntimeError(f'rear lighting anchor missing in {path}')
    s=s.replace('S51 3D · GLB 4.3','S51 3D · GLB 4.4').replace('GLB 4.3','GLB 4.4')
    path.write_text(s,encoding='utf-8')

# Cache all new components.
new_assets=[
    'seat_standard.glb','seat_flat.glb','seat_sport.glb','handlebar_street.glb','handlebar_enduro.glb','handlebar_cross.glb','cockpit.glb',
    'headlight_shell.glb','headlight_classic.glb','headlight_h4.glb','headlight_led.glb','indicators_front.glb','indicators_rear.glb','taillight.glb','licenseplate.glb',
    'front_fender_classic.glb','front_fender_enduro.glb','rear_fender.glb'
]
for path in [ROOT/'sw.js',ROOT/'www/sw.js']:
    s=path.read_text(encoding='utf-8')
    s=s.replace('ww-v3-9-configurator-glb4-3','ww-v3-9-configurator-glb4-4')
    for fn in new_assets:
        asset='"./assets/models/'+fn+'"'
        if asset not in s:
            s=s.replace('"./assets/models/manifest.json"',asset+',"./assets/models/manifest.json"')
    path.write_text(s,encoding='utf-8')

for path in [ROOT/'configurator3d.css',ROOT/'www/configurator3d.css']:
    s=path.read_text(encoding='utf-8').replace('Phase 4.0 GLB/WebGL','Phase 4.4 GLB/WebGL')
    path.write_text(s,encoding='utf-8')

print('GLB 4.4 body, cockpit, lighting and fenders generated and wired')
