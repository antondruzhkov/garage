(function(){
"use strict";
const V3=THREE.Vector3, S=0.01;
/* hooks the app shell (app.js) sets: tap, openOp, openDiag, ready, autoRot */
const H=window.R9T_HOOKS=window.R9T_HOOKS||{};
const RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- renderer ---------- */
const canvas=document.getElementById('gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.physicallyCorrectLights=false;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(34,1,0.05,400);
const controls=new THREE.OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=2.2;controls.maxDistance=60;
controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;controls.autoRotateSpeed=1.1;
scene.add(new THREE.HemisphereLight(0xffffff,0x5d6268,0.35));
const key=new THREE.DirectionalLight(0xfff6ea,0.9);key.position.set(6,11,8);scene.add(key);
const rim=new THREE.DirectionalLight(0xe8f0ff,0.55);rim.position.set(-9,6,-7);scene.add(rim);
const root=new THREE.Group();root.scale.setScalar(S);scene.add(root);

/* studio reflections: soft boxes painted into an equirect, prefiltered */
(function(){const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#eef1f4');g.addColorStop(.46,'#b9bfc6');g.addColorStop(.5,'#6d737a');g.addColorStop(1,'#2a2d31');
  x.fillStyle=g;x.fillRect(0,0,1024,512);
  x.fillStyle='#ffffff';x.fillRect(90,70,230,80);x.fillRect(560,40,320,60);x.fillRect(420,150,70,150);x.fillRect(930,120,60,140);
  x.fillStyle='rgba(255,255,255,.55)';x.fillRect(0,226,1024,5);x.fillRect(0,250,1024,3);
  const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.encoding=THREE.sRGBEncoding;
  const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(t).texture;t.dispose();pm.dispose();})();

function themeColor(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#E4E7EA';}
function applyTheme(){
  const bg=new THREE.Color(themeColor('--bg'));scene.background=bg;
  const dark=bg.getHSL({}).l<.4;
  turntable.material.color.set(dark?0x1a1d21:0xd3d7db);
  ticks.material.color.set(dark?0x3a4047:0xa9afb6);
}

/* ---------- turntable + contact shadow ---------- */
const turntable=new THREE.Mesh(new THREE.CylinderGeometry(1500,1500,12,96),new THREE.MeshStandardMaterial({color:0xd3d7db,roughness:.95,metalness:0}));
turntable.position.set(760,-6,0);root.add(turntable);
const tg=[];for(let i=0;i<72;i++){const a=i/72*Math.PI*2,r1=i%6?1440:1400;tg.push(760+Math.cos(a)*r1,1,Math.sin(a)*r1,760+Math.cos(a)*1490,1,Math.sin(a)*1490);}
const tgeo=new THREE.BufferGeometry();tgeo.setAttribute('position',new THREE.Float32BufferAttribute(tg,3));
const ticks=new THREE.LineSegments(tgeo,new THREE.LineBasicMaterial({color:0xa9afb6}));root.add(ticks);
(function(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,8,128,128,128);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.6,'rgba(0,0,0,.18)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,256,256);
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(2400,620),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));
  sh.rotation.x=-Math.PI/2;sh.position.set(760,2,0);root.add(sh);window.__floorSh=sh;})();

/* ---------- materials (BMW finish per press kit: black-coated engine, frame, swingarm; Monolith matt tank) ---------- */
const M={
  case:[0x1b1c1e,.55,.35],  fin:[0x222427,.45,.45], edge:[0xb8bdc2,.28,1], alu:[0xc9cdd1,.26,1], brushed:[0xbfc4c9,.34,1],
  chrome:[0xf0f2f4,.05,1], blast:[0xa7acb1,.55,1], pipe:[0xdfe2e5,.16,1], well:[0x2c2e31,.8,.2], dirt:[0xa08763,.85,0], tool:[0xd5d9dd,.18,1], grip:[0x1f2022,.75,0], gripr:[0xb3261e,.6,0], black:[0x18191b,.5,.35], satin:[0x232528,.4,.55], rubber:[0x141516,.9,0],
  steel:[0xa2a7ac,.32,1], paint:[0x5a5e5f,.42,.55], seat:[0x6a3519,.62,0], frame:[0x141517,.42,.35], red:[0xc0281f,.3,0],
  glass:[0xdde7ee,.04,.1], ceramic:[0xf1efe9,.35,0], coil:[0x1d1f22,.55,.2], brass:[0xc9a24a,.3,1], spring:[0xf2f2ee,.35,.1],
  blue:[0x2b4f8a,.45,.2], oil:[0xd8a21f,.2,0], lens:[0xf4f7fa,.08,0], gold:[0x8f7a45,.35,.8], disc:[0x8a8f94,.28,1], copper:[0xb06a3a,.35,1], cast:[0x232527,.5,.55], heat:[0x9c7a5c,.3,1], ti:[0xb3b0aa,.38,1], headcov:[0xa3a7ab,.42,.85], rimblk:[0x161719,.35,.6]
};
const ENVI={rubber:.18,case:.45,fin:.55,frame:.45,black:.4,satin:.6,seat:.35,rimblk:.6,coil:.4};
function mat(k,dbl){const a=M[k];const m=new THREE.MeshStandardMaterial({color:a[0],roughness:a[1],metalness:a[2],envMapIntensity:ENVI[k]==null?1:ENVI[k]});if(dbl)m.side=THREE.DoubleSide;m.userData.k=k;return m;}

const PHOTO={};
const PHT={};function phTex(k){if(!PHT[k]){const t=new THREE.TextureLoader().load(PHOTO[k]);t.encoding=THREE.sRGBEncoding;t.anisotropy=8;PHT[k]=t;}return PHT[k];}
function phMat(k,o){o=o||{};const t=phTex(k);const m=new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:new THREE.Color(o.em==null?.62:o.em,o.em==null?.62:o.em,o.em==null?.62:o.em),roughness:o.r==null?.45:o.r,metalness:o.m||0,envMapIntensity:o.env==null?.35:o.env});m.userData.baseEm=m.emissive.clone();return m;}
const PMAP={R:(X,Y)=>[(392+X/1.46)/1920,1-(955-(Y-315)/1.46)/1280],L:(X,Y)=>[(890-X/2.286)/1112,1-(525-(Y-315)/2.286)/716],T:(X,Z)=>[(255+(1120-X)/2.05)/1024,1-(345-Z/2.05)/698]};
/* project photos onto a mesh: pick(worldNormal) -> [photoKey, (worldPoint)->[u,v]] */
function skin(m){return m;}
function skinOld(m,off,pick,mo){mo=mo||{};off=new V3(...(off||[0,0,0]));m.updateMatrix();const g0=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
  m.geometry.computeBoundingBox();const ctr=m.geometry.boundingBox.getCenter(new V3()).applyMatrix4(m.matrix).add(off),shk=mo.shrink||1;
  const pa=g0.attributes.position,na=g0.attributes.normal,M=m.matrix,NM=new THREE.Matrix3().getNormalMatrix(M);const buckets={};
  const a=new V3(),b=new V3(),c=new V3(),fn=new V3();
  for(let t=0;t<pa.count;t+=3){a.fromBufferAttribute(pa,t).applyMatrix4(M).add(off);b.fromBufferAttribute(pa,t+1).applyMatrix4(M).add(off);c.fromBufferAttribute(pa,t+2).applyMatrix4(M).add(off);
    fn.subVectors(c,b).cross(new V3().subVectors(a,b)).normalize();const [k,f]=pick(fn,a);(buckets[k]=buckets[k]||[]).push([t,f]);}
  const keys=Object.keys(buckets),P=[],N=[],UV=[],g=new THREE.BufferGeometry();let start=0;const mats=[];
  keys.forEach((k,mi)=>{buckets[k].forEach(([t,f])=>{for(let i=0;i<3;i++){const v=new V3().fromBufferAttribute(pa,t+i);P.push(v.x,v.y,v.z);if(na){N.push(na.getX(t+i),na.getY(t+i),na.getZ(t+i));}
      const w=v.clone().applyMatrix4(M).add(off);w.sub(ctr).multiplyScalar(shk).add(ctr);const uv=f(w);UV.push(uv[0],uv[1]);}});
    const n=buckets[k].length*3;g.addGroup(start,n,mi);start+=n;mats.push(phMat(k,mo));});
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));if(na)g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));else g.computeVertexNormals();g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));
  m.geometry=g;m.material=mats;return m;}
const sideRL=(n)=>n.z>=0?'R':'L';
/* ---------- part registry ---------- */
const P={};const pickables=[];
function part(id,o){const g=new THREE.Group();g.name=id;root.add(g);
  P[id]=Object.assign({id,g,ex:new V3(0,0,0),layer:'bike',cur:{off:0,op:1,hl:0},tgt:{off:0,op:1,hl:0},ops:[]},o);
  P[id].ex=new V3(...(o.ex||[0,0,0]));P[id].home=new V3();return g;}
function add(g,geo,k,pos,rot){const m=new THREE.Mesh(geo,typeof k==='string'?mat(k):k);if(pos)m.position.set(...pos);if(rot)m.rotation.set(...rot);
  m.userData.part=g.name;g.add(m);pickables.push(m);return m;}
function box(g,s,p,k,rot){return add(g,new THREE.BoxGeometry(...s),k,p,rot);}
function cyl(g,r,h,ax,p,k,seg,r2){const geo=new THREE.CylinderGeometry(r2==null?r:r2,r,h,seg||32);
  if(ax==='x')geo.rotateZ(Math.PI/2);if(ax==='z')geo.rotateX(Math.PI/2);return add(g,geo,k,p);}
function orient(m,a,b){const A=new V3(...a),B=new V3(...b),d=B.clone().sub(A);m.position.copy(A);m.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());return d.length();}
function rod(g,a,b,r,k,seg){const A=new V3(...a),B=new V3(...b),L=B.clone().sub(A).length();
  const m=add(g,new THREE.CylinderGeometry(r,r,L,seg||14),k);m.position.copy(A).add(B).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new V3(0,1,0),B.clone().sub(A).normalize());return m;}
function tube(g,pts,r,k,seg,rs){const c=new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p)),false,'centripetal');const m=add(g,new THREE.TubeGeometry(c,seg||64,r,rs||16,false),k);
  [pts[0],pts[pts.length-1]].forEach(p=>{const cap=add(g,new THREE.SphereGeometry(r,rs||16,10),m.material,p);});return m;}
function rr(w,h,r){const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);
  s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
function rrH(w,h,r,hr){const s=rr(w,h,r);const p=new THREE.Path();p.absarc(0,0,hr,0,Math.PI*2,true);s.holes.push(p);return s;}
function poly(pts){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();return s;}
function smooth(pts,n){const c=new THREE.SplineCurve(pts.map(p=>new THREE.Vector2(p[0],p[1])));return new THREE.Shape(c.getPoints(n||60));}
/* extrude a 2D shape (in its own XY) along Z by depth, centred; axis rotates the result */
function slab(g,shape,depth,bevel,k,pos,axis,curve){const b=bevel||0;
  const geo=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.5,depth-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:4,curveSegments:curve||14});
  geo.translate(0,0,-(depth-2*b)/2);if(axis==='x')geo.rotateY(Math.PI/2);if(axis==='y')geo.rotateX(-Math.PI/2);geo.computeVertexNormals();return add(g,geo,k,pos);}
/* lathe: profile [[radius, along-axis],...] around axis */
function lathe(g,prof,axis,pos,k,seg){const geo=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(Math.max(0.01,p[0]),p[1])),seg||48);
  if(axis==='x')geo.rotateZ(-Math.PI/2);if(axis==='z')geo.rotateX(Math.PI/2);if(axis==='-z')geo.rotateX(-Math.PI/2);if(axis==='-x')geo.rotateZ(Math.PI/2);
  const m=add(g,geo,typeof k==='string'?mat(k,true):k,pos);return m;}
function latheAB(g,prof,a,b,k,seg){const m=add(g,new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(Math.max(.01,p[0]),p[1])),seg||40),mat(k,true));orient(m,a,b);return m;}
function inst(g,geo,k,mats){const m=new THREE.InstancedMesh(geo,typeof k==='string'?mat(k):k,mats.length);mats.forEach((x,i)=>m.setMatrixAt(i,x));
  m.userData.part=g.name;g.add(m);pickables.push(m);return m;}
function mirrorZ(fn){fn(1);fn(-1);}
/* loft: a closed body from side profiles (top, bottom) and plan half-width, sampled along X */
function interp(pts,x){if(x<=pts[0][0])return pts[0][1];for(let i=1;i<pts.length;i++){if(x<=pts[i][0]){const a=pts[i-1],b=pts[i],t=(x-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*(t*t*(3-2*t));}}return pts[pts.length-1][1];}
function spow(v,e){return Math.sign(v)*Math.pow(Math.abs(v),e);}
function loft(g,o,k){const NX=o.nx||64,NA=o.na||56,x0=o.top[0][0],x1=o.top[o.top.length-1][0];const pos=[],idx=[];
  for(let i=0;i<=NX;i++){const x=x0+(x1-x0)*i/NX,yt=interp(o.top,x),yb=interp(o.bot,x),hw=interp(o.hw,x),yc=(yt+yb)/2,ry=Math.max(1,(yt-yb)/2);
    for(let j=0;j<NA;j++){const th=j/NA*Math.PI*2,c=Math.cos(th),s=Math.sin(th);const ey=s>=0?spow(s,2/o.nt):spow(s,2/o.nb),ez=spow(c,2/o.nz);
      let z=hw*ez*(1-(o.taper||0)*Math.max(0,ey)),y=yc+ry*ey;if(o.rip&&ey>0)y+=o.rip(x,z,ey);pos.push(x,y,z);}}
  for(let i=0;i<NX;i++)for(let j=0;j<NA;j++){const a=i*NA+j,b=i*NA+(j+1)%NA,c2=(i+1)*NA+j,d=(i+1)*NA+(j+1)%NA;idx.push(a,c2,b,b,c2,d);}
  [[0,-1],[NX,1]].forEach(([i,dir])=>{const x=x0+(x1-x0)*i/NX,yt=interp(o.top,x),yb=interp(o.bot,x);const ci=pos.length/3;pos.push(x+dir*(o.dome||6),(yt+yb)/2,0);
    for(let j=0;j<NA;j++){const a=i*NA+j,b=i*NA+(j+1)%NA;dir<0?idx.push(ci,a,b):idx.push(ci,b,a);}});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();return add(g,geo,k);}

function gearGeo0(r,teeth){const s=new THREE.Shape();const n=teeth*2;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,rad=i%2?r:r-4;i?s.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):s.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);}
  const g=new THREE.ExtrudeGeometry(s,{depth:8,bevelEnabled:false});g.translate(0,0,-4);g.rotateX(Math.PI/2);return g;}
/* involute gear (20° pressure angle), axis along X, centred on x=0. Teeth point at angles i*2π/z (tooth 0 along +Y, angle measured Y->Z,
   the same way rotation.x turns). Optional helix: the profile twists across the face width (hand +1/-1). Bore as a plain hole. */
function invProfile(z,m){const a0=20*Math.PI/180,rp=m*z/2,rb=rp*Math.cos(a0),ra=rp+m,rf=rp-1.25*m,inv=a=>Math.tan(a)-a;
  const psi=r=>{const rr=Math.max(r,rb),a=Math.acos(Math.min(1,rb/rr));return Math.max(0.006,Math.PI/(2*z)+inv(a0)-inv(a));};
  const rs=[rf];if(rb>rf)rs.push(rb);const r0=Math.max(rb,rf);for(let k=1;k<=5;k++)rs.push(r0+(ra-r0)*k/5);
  const pts=[];for(let i=0;i<z;i++){const c=i*2*Math.PI/z;pts.push([c-Math.PI/z,rf]);
    rs.forEach(r=>pts.push([c-psi(r),r]));pts.push([c,ra]);rs.slice().reverse().forEach(r=>pts.push([c+psi(r),r]));}
  return pts;}
function invGear(z,m,w,o){o=o||{};const prof=invProfile(z,m),n=prof.length,rp=m*z/2,bore=o.bore||Math.max(4,rp*.3);
  const S=o.helix?4:1,tw=o.helix?w*Math.tan(o.helix*Math.PI/180)/rp*(o.hand||1):0,pos=[];
  const P=(t,r,x)=>[x,r*Math.cos(t),r*Math.sin(t)];
  const tri=(a,b,c)=>pos.push(...a,...b,...c),quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
  for(let s=0;s<S;s++){const x0=-w/2+w*s/S,x1=-w/2+w*(s+1)/S,q0=tw*(s/S-.5),q1=tw*((s+1)/S-.5);
    for(let j=0;j<n;j++){const A=prof[j],B=prof[(j+1)%n];quad(P(A[0]+q0,A[1],x0),P(B[0]+q0,B[1],x0),P(B[0]+q1,B[1],x1),P(A[0]+q1,A[1],x1));}}
  [[-w/2,-tw/2,-1],[w/2,tw/2,1]].forEach(([x,q,d])=>{for(let j=0;j<n;j++){const A=prof[j],B=prof[(j+1)%n];
    const a=P(A[0]+q,A[1],x),b=P(B[0]+q,B[1],x),c=P(B[0]+q,bore,x),e=P(A[0]+q,bore,x);d<0?quad(a,e,c,b):quad(a,b,c,e);}});
  const NB=48;for(let j=0;j<NB;j++){const t0=j/NB*Math.PI*2,t1=(j+1)/NB*Math.PI*2;quad(P(t0,bore,-w/2),P(t1,bore,-w/2),P(t1,bore,w/2),P(t0,bore,w/2));}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();g.userData={z,m,rp};return g;}
/* rotation of gear B (zB teeth) meshing with gear A turned by thA; phi = direction from A's axis to B's axis (angle Y->Z) */
function meshAngle(thA,zA,zB,phi){return -(zA/zB)*(thA-phi)+phi+Math.PI+Math.PI/zB;}
/* ================= BUILD ================= */
/* coordinates in mm: X forward (rear axle = 0), Y up, Z to rider's right */
const CR=new V3(770,430,0);

/* --- wheels: spoked, 17" rims, adventure-pattern tyres 120/70 R17 and 180/55 R17 --- */
const TYRE={};function tyreMat(w){if(TYRE[w])return TYRE[w];const c=document.createElement('canvas');c.width=2048;c.height=512;const x=c.getContext('2d');
  x.fillStyle='#1c1d1f';x.fillRect(0,0,2048,512);x.fillStyle='#232426';x.fillRect(0,0,2048,90);x.fillRect(0,422,2048,90);
  x.strokeStyle='#2e3033';x.lineWidth=2;[40,60,452,472].forEach(y=>{x.beginPath();x.moveTo(0,y);x.lineTo(2048,y);x.stroke();});
  x.strokeStyle='#08090a';x.lineCap='round';const n=44;
  for(let i=0;i<n;i++){const u=i/n*2048;x.lineWidth=9;
    x.beginPath();x.moveTo(u,256+18);x.bezierCurveTo(u+24,256+60,u+30,256+110,u+64,256+150);x.stroke();
    x.beginPath();x.moveTo(u+24,256-18);x.bezierCurveTo(u+48,256-60,u+54,256-110,u+88,256-150);x.stroke();
    x.lineWidth=6;x.beginPath();x.moveTo(u+10,256+170);x.lineTo(u+30,256+200);x.stroke();x.beginPath();x.moveTo(u+34,256-170);x.lineTo(u+54,256-200);x.stroke();}
  const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.anisotropy=8;t.encoding=THREE.sRGBEncoding;
  const m=new THREE.MeshStandardMaterial({map:t,bumpMap:t,bumpScale:-3,roughness:.88,metalness:0,envMapIntensity:.2,side:THREE.DoubleSide});TYRE[w]=m;return m;}
function wheel(id,x,y,secH,secW,name,desc,ex){
  const g=part(id,{name,desc,sys:'Ходовая',ex});
  const R=216+secH,hw=secW/2;
  const prof=[[208,-hw*.62],[222,-hw*.92],[R-secH*.55,-hw],[R-secH*.2,-hw*.94],[R-3,-hw*.66],[R,-hw*.3],[R+1,0],[R,hw*.3],[R-3,hw*.66],[R-secH*.2,hw*.94],[R-secH*.55,hw],[222,hw*.92],[208,hw*.62]];
  const tp=[];for(let i=0;i<=40;i++){const u=i/40*2-1,ang=u*Math.PI*.5;tp.push([R-secH*(1-Math.cos(ang))*.62-(Math.abs(u)>.85?(Math.abs(u)-.85)*secH*1.6:0),Math.sin(ang)*hw*(1-.06*Math.abs(u))]);}
  const prf=[[208,-hw*.62],[222,-hw*.92]].concat(tp.filter(q=>Math.abs(q[1])<hw*.94)).concat([[222,hw*.92],[208,hw*.62]]);
  const t=lathe(g,prf,'z',[x,y,0],tyreMat(secW),128);t.userData.tyre=true;
  /* rim: alloy hoop with flanges */
  const rw=secW*.62/2;lathe(g,[[200,-rw-4],[214,-rw-4],[216,-rw+2],[204,-rw+6],[198,0],[204,rw-6],[216,rw-2],[214,rw+4],[200,rw+4]],'z',[x,y,0],'rimblk',96);
  /* hub */
  lathe(g,[[30,-78],[46,-78],[50,-62],[62,-56],[62,-40],[44,-30],[40,0],[44,30],[62,40],[62,56],[50,62],[46,78],[30,78]],'z',[x,y,0],'satin',40);
  /* cross-laced spokes: 40, tangent to hub flange */
  const o=new THREE.Object3D();const sp=new THREE.CylinderGeometry(1.8,1.8,1,6);sp.translate(0,.5,0);const sm=[];
  for(let i=0;i<40;i++){const side=i%2?1:-1,a=i/40*Math.PI*2,tw=(i%4<2?1:-1)*.42;
    const A=new V3(x+Math.cos(a+tw)*58,y+Math.sin(a+tw)*58,side*52),B=new V3(x+Math.cos(a)*200,y+Math.sin(a)*200,side*9);
    const d=B.clone().sub(A);o.position.copy(A);o.quaternion.setFromUnitVectors(new V3(0,1,0),d.clone().normalize());o.scale.set(1,d.length(),1);o.updateMatrix();sm.push(o.matrix.clone());}
  o.scale.set(1,1,1);inst(g,sp,'steel',sm);
  return g;
}
wheel('wheelF',1527,300,84,120,'Переднее колесо','Спицованное колесо 17", шина 120/70 R17. Давление 2,5 бар на холодную.',[420,0,0]);
wheel('wheelR',0,315,99,180,'Заднее колесо','Спицованное колесо 17", шина 180/55 R17. Давление 2,7 бар одному, 2,9 бар с пассажиром. Крепится болтами к фланцу главной передачи.',[-420,0,0]);

/* drilled floating disc */
function disc(g,x,y,z,R,ri,holes){const s=new THREE.Shape();s.absarc(0,0,R,0,Math.PI*2,false);
  const h0=new THREE.Path();h0.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(h0);
  for(let i=0;i<holes;i++){const a=i/holes*Math.PI*2,rr2=(R+ri)/2+(i%2?9:-9);const h=new THREE.Path();h.absarc(Math.cos(a)*rr2,Math.sin(a)*rr2,4.2,0,Math.PI*2,true);s.holes.push(h);}
  const geo=new THREE.ExtrudeGeometry(s,{depth:5,bevelEnabled:false,curveSegments:48});geo.translate(0,0,-2.5);add(g,geo,'disc',[x,y,z]);
  const c=new THREE.Shape();c.absarc(0,0,ri+2,0,Math.PI*2,false);const ch=new THREE.Path();ch.absarc(0,0,52,0,Math.PI*2,true);c.holes.push(ch);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const h=new THREE.Path();h.absarc(Math.cos(a)*((ri+52)/2),Math.sin(a)*((ri+52)/2),13,0,Math.PI*2,true);c.holes.push(h);}
  const cg=new THREE.ExtrudeGeometry(c,{depth:6,bevelEnabled:false,curveSegments:32});cg.translate(0,0,-3);add(g,cg,'alu',[x,y,z+(z>0?3:-3)]);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;cyl(g,5,10,'z',[x+Math.cos(a)*(ri+1),y+Math.sin(a)*(ri+1),z],'alu',10);}
}
function caliper(g,x,y,z,ang,big){const cg=new THREE.Group();cg.position.set(x,y,z);cg.rotation.z=ang;g.add(cg);
  const w=big?118:84;const m1=add(cg,new THREE.ExtrudeGeometry(rr(w,big?52:44,16),{depth:16,bevelEnabled:true,bevelThickness:4,bevelSize:4,bevelSegments:3}),'satin');m1.position.z=4;
  const m2=add(cg,new THREE.ExtrudeGeometry(rr(w,big?52:44,16),{depth:16,bevelEnabled:true,bevelThickness:4,bevelSize:4,bevelSegments:3}),'satin');m2.position.z=-24;
  box(cg,[w-20,14,30],[0,(big?26:22),-2],'satin');
  [-1,1].forEach(s=>cyl(cg,5,40,'z',[s*w*.3,-(big?18:14),-2],'steel',10));
  cg.children.forEach(m=>m.userData.part=g.name);return cg;}
const gB=part('brakeF',{name:'Передние тормоза',desc:'Два плавающих диска 320 мм, четырёхпоршневые суппорты, армированные шланги. Колодки: минимум 1,0 мм накладки.',sys:'Тормоза',ex:[380,120,0]});
mirrorZ(s=>{disc(gB,1527,300,s*74,160,112,28);caliper(gB,1527-120,300+96,s*(74+(s>0?-6:6)),-0.85,true);});
const gBR=part('brakeR',{name:'Задний тормоз',desc:'Диск 265 мм, двухпоршневой плавающий суппорт. Износ видно по оси с тремя кольцами между колодками.',sys:'Тормоза',ex:[-300,-60,120]});
disc(gBR,0,315,58,132,92,22);caliper(gBR,-92,222,64,.65,false);slab(gBR,poly([[-120,190],[-60,180],[40,290],[20,330],[-30,320]]),10,3,'case',[0,0,92]);cyl(gBR,4,40,'z',[-92,222,64],'brass',10);

/* --- fork: 43 mm conventional, black sliders, gaiters; steering head angle 61.5° --- */
const FA=new V3(1527,300,0), FU=new V3(-Math.cos(61.5*Math.PI/180),Math.sin(61.5*Math.PI/180),0);
const fpt=t=>FA.clone().addScaledVector(FU,t);

const gF=part('fork',{name:'Вилка',desc:'Классическая телескопическая вилка 43 мм с резиновыми гофрами, ход 125 мм. Перья чёрные. Масло в вилке по регламенту Scrambler не меняется.',sys:'Ходовая',ex:[360,200,0]});
mirrorZ(s=>{const z=s*104;
  latheAB(gF,[[22,-40],[34,-30],[36,0],[33,240],[31,300],[24,312]],[FA.x,FA.y-0,z],[fpt(1).x,fpt(1).y,z],'satin');
  const a=fpt(300),c=fpt(780);rod(gF,[a.x,a.y,z],[c.x,c.y,z],21.5,'chrome',24);
  const gp=[];for(let i=0;i<=20;i++){gp.push([i%2?30:25,i*10]);}latheAB(gF,gp,[fpt(312).x,fpt(312).y,z],[fpt(313).x,fpt(313).y,z],'rubber');
  latheAB(gF,[[0.1,0],[21.5,0],[22,2],[22,7],[19,9],[19,12],[0.1,12]],fpt(780).setZ(z).toArray(),fpt(781).setZ(z).toArray(),'alu',24);
  {const m=add(gF,new THREE.CylinderGeometry(9,9,6,6),'steel');m.position.copy(fpt(794)).setZ(z);m.quaternion.setFromUnitVectors(new V3(0,1,0),FU);}
});
cyl(gF,13,240,'z',[1527,300,0],'steel',16);
mirrorZ(s=>cyl(gF,20,24,'z',[1527,300,s*118],'alu',6));
/* triple clamps: cast plates square to the steering axis, fork tubes clamped through them, steering stem between */
const FP_=new V3(FU.y,-FU.x,0), FZ_=new V3(0,0,-1), CLB=new THREE.Matrix4().makeBasis(FP_,FZ_,FU);
function clampPlate(g,t,th,k,stemR){const G=new THREE.Group();G.position.copy(fpt(t));G.quaternion.setFromRotationMatrix(CLB);g.add(G);
  const sh=new THREE.Shape(new THREE.SplineCurve([[42,0],[36,62],[38,104],[26,134],[0,144],[-26,134],[-38,104],[-46,62],[-60,24],[-60,-24],[-46,-62],[-38,-104],[-26,-134],[0,-144],[26,-134],[38,-104],[36,-62],[42,0]].map(p=>new THREE.Vector2(p[0],p[1]))).getPoints(120));
  [104,-104].forEach(y=>{const p=new THREE.Path();p.absarc(0,y,21.6,0,Math.PI*2,true);sh.holes.push(p);});
  if(stemR){const p=new THREE.Path();p.absarc(0,0,stemR,0,Math.PI*2,true);sh.holes.push(p);}
  const geo=new THREE.ExtrudeGeometry(sh,{depth:th-8,bevelEnabled:true,bevelThickness:4,bevelSize:4,bevelSegments:3,curveSegments:24});geo.translate(0,0,-(th-8)/2);
  const m=add(G,geo,k);
  /* pinch slots + bolts on the rear of each fork-tube lobe */
  [104,-104].forEach(y=>{box(G,[30,3,th+1],[-34,y,0],'black');const b=add(G,new THREE.CylinderGeometry(6,6,40,6),'steel',[-40,y,0]);b.rotation.x=0;
    const hd=add(G,new THREE.CylinderGeometry(8,8,6,6),'steel',[-40,y+(y>0?22:-22),0]);});
  G.children.forEach(c=>c.userData.part=g.name);return G;}
const gTC=part('triple',{name:'Траверсы вилки',desc:'Верхняя литая алюминиевая и нижняя траверсы. Перья вилки зажаты в них стяжными болтами, между траверсами рулевая колонка в подшипниках рулевой колонки. На верхней траверсе стойки руля. Люфт руля проверяют при каждом ТО.',sys:'Ходовая',ex:[260,260,0]});
clampPlate(gTC,532,34,'satin',0);
const UC=clampPlate(gTC,764,26,'brushed',0);
/* steering stem nut on the top clamp, stem between the clamps */
{const n=add(UC,new THREE.CylinderGeometry(20,20,12,6).rotateX(Math.PI/2),'steel',[0,0,19]);const w=add(UC,new THREE.CylinderGeometry(26,26,2,32).rotateX(Math.PI/2),'steel',[0,0,14]);n.userData.part=w.userData.part='triple';}
rod(gTC,fpt(515).toArray(),fpt(751).toArray(),14,'steel');
/* short front cover bolted to sliders (fork stabiliser) */
const gFen=part('fender',{name:'Переднее крыло',desc:'Короткое крыло, прикручено к перьям вилки и работает как стабилизатор вилки.',sys:'Кузов',ex:[300,260,0]});
(function(){const s=new THREE.Shape();s.absarc(0,0,334,0.62,1.95,false);s.absarc(0,0,326,1.95,0.62,true);
  const geo=new THREE.ExtrudeGeometry(s,{depth:120,bevelEnabled:true,bevelThickness:3,bevelSize:3,bevelSegments:2,curveSegments:40});geo.translate(0,0,-60);add(gFen,geo,'black',[1527,300,0]);
  mirrorZ(z=>{const p=fpt(150);box(gFen,[60,14,8],[p.x-10,p.y+40,z*70],'black',[0,0,.5]);});})();

/* --- handlebar, levers, switchgear, mirrors --- */
const gH=part('bars',{name:'Руль и органы управления',desc:'Алюминиевый руль переменной толщины: 28 мм в стойках, 22 мм под рукоятками, с подъёмом и загибом к водителю. Стоит в двух стойках на верхней траверсе, крышки стоек на 4 болтах Torx. Справа ручка газа (трос, электронного газа до 2021 года нет) и тормозной рычаг. Слева сцепление с гидроприводом.',sys:'Управление',ex:[200,380,0]});
/* bar risers on the top clamp with split clamp caps, 4 Torx bolts each */
mirrorZ(s=>{const base=fpt(777).addScaledVector(FP_,10).setZ(s*40),bar=new V3(1150,1032,s*40);
  latheAB(gH,[[0.1,0],[19,0],[20,3],[17,8],[16,30],[19,34],[19,36]],base.toArray(),bar.clone().addScaledVector(new V3(0,1,0),-14).toArray(),'brushed',24);
  slab(gH,rr(44,44,10),46,6,'brushed',[1150,1032,s*40]);
  slab(gH,rr(46,6,2),48,1,'black',[1150,1032,s*40]);
  [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([u,v])=>cyl(gH,4.5,6,'x',[1126,1032+u*15,s*40+v*14],'steel',12));});
/* Scrambler bar: straight centre in the clamps, bend up and back, straight grip sections; 28 mm centre tapering to 22 mm */
(function(){const P=[[986,1070,-424],[988,1070,-290],[996,1068,-262],[1022,1061,-226],[1060,1050,-190],[1102,1040,-150],[1132,1034,-112],[1146,1032,-70],[1150,1032,0]];
  const pts=P.concat(P.slice(0,-1).reverse().map(p=>[p[0],p[1],-p[2]]));
  const cv=new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p)),false,'centripetal',.5);
  const N=160,geo=new THREE.TubeGeometry(cv,N,1,20,false),pa=geo.attributes.position,fr=cv.computeFrenetFrames(N,false);
  for(let i=0;i<=N;i++){const c=cv.getPointAt(i/N),z=Math.abs(c.z),r=z<90?14:(z<190?14-(z-90)/100*3:11);
    for(let j=0;j<=20;j++){const k=i*21+j,v=new V3(pa.getX(k),pa.getY(k),pa.getZ(k)).sub(c).multiplyScalar(r).add(c);pa.setXYZ(k,v.x,v.y,v.z);}}
  geo.computeVertexNormals();add(gH,geo,'alu');
  mirrorZ(s=>lathe(gH,[[0.1,0],[12,0],[15,3],[15,14],[12,17],[0.1,17]],s>0?'z':'-z',[986,1070,s*420],'black',24));})();
/* controls ride on the swept-back grips */
const gHc=new THREE.Group();gHc.name='bars';gHc.position.set(-140,14,0);gH.add(gHc);
function lever(g,s){const sh=smooth([[1176,6],[1196,-4],[1214,-60],[1236,-140],[1246,-196],[1240,-206],[1228,-200],[1218,-140],[1198,-60],[1182,-14]],60);
  const m=slab(g,sh,10,3,mat('satin',true),[0,1046,s*206],'y');m.scale.z=s;return m;}
mirrorZ(s=>{
  lathe(gHc,[[16,0],[19,6],[18,60],[19,110],[22,118],[0.1,120]],s>0?'z':'-z',[1128,1056,s*296],'rubber',24);
  /* switch housing: rounded, black */
  const sw=slab(gHc,rr(66,58,20),50,10,'satin',[1152,1048,s*258]);
  /* master cylinder body + lever + adjuster + mirror clamp */
  cyl(gHc,13,56,'z',[1180,1042,s*206],'satin',20);cyl(gHc,7,16,'y',[1194,1060,s*230],'black',16);
  lever(gHc,s);cyl(gHc,6,14,'y',[1190,1046,s*214],'alu',12);
  tube(gHc,[[1170,1050,s*222],[1166,1100,s*246],[1150,1150,s*292],[1140,1160,s*318]],5,'black',20);
  const mr=lathe(gHc,[[0.1,-10],[34,-7],[36,0],[34,7],[0.1,10]],'x',[1136,1160,s*330],'black',32);mr.scale.set(1,.8,1.3);
});
/* right switch: heated grips (top), red STOP rocker with starter (front) */
box(gHc,[20,8,16],[1150,1080,270],'steel');
slab(gHc,rr(18,34,6),12,3,'red',[1186,1036,262],'x');
box(gHc,[4,12,10],[1192,1030,262],'ceramic');
/* left switch: MENU rocker, indicator switch with OFF, red hazard button, headlight flasher */
slab(gHc,rr(26,36,6),10,3,'steel',[1186,1050,-262],'x');
box(gHc,[22,10,26],[1172,1022,-262],'black');
slab(gHc,rr(18,18,5),10,3,'red',[1160,1080,-246],'y');
box(gHc,[14,8,12],[1130,1056,-232],'black');
/* throttle drum and cables to the right throttle body */
lathe(gHc,[[24,0],[26,4],[26,24],[22,30]],'z',[1128,1056,282],'satin',24);
tube(gH,[[1006,1054,232],[1060,1000,170],[1120,900,110],[1112,760,122],[950,620,200],[800,560,262],[740,520,284]],4,'black',80);
/* hydraulic clutch line on the left, down to the slave cylinder on the gearbox */
tube(gH,[[1042,1046,-182],[1080,980,-140],[1125,880,-100],[1110,740,-120],[900,640,-140],[700,580,-128],[500,520,-92]],4,'black',80);
/* ignition lock: left of the top clamp, at the tank */
lathe(gH,[[0.1,0],[28,0],[30,6],[26,22],[18,26],[0.1,27]],'y',[1116,962,0],'black',32);box(gH,[4,6,14],[1116,990,0],'steel');
const gRes=part('resF',{name:'Главный цилиндр и бачок переднего тормоза',desc:'BMW 32_2498: на правой рукоятке, бачок встроен в корпус главного цилиндра (поршень D=14 мм), крышка бачка на трёх винтах M4x20 под резиновой мембраной, корпус держит хомут на двух винтах M6x25. Спереди окошко уровня. Жидкость DOT 4. Уровень проверяют при ровном руле, бачок горизонтально, не ниже MIN.',sys:'Тормоза',ex:[150,320,160]});
slab(gRes,rr(54,40,8),40,4,'black',[1180,1080,196],'z');slab(gRes,rr(58,8,4),44,2,'satin',[1180,1102,196],'z');add(gRes,new THREE.PlaneGeometry(34,12),mat('glass'),[1207.5,1074,196],[0,Math.PI/2,0]);
/* headlight: steel shell in Monolith, chrome ring, H4 reflector look */
const gL=part('light',{name:'Фара и прибор',desc:'Круглая фара в стальном корпусе, H4 60/55 Вт, габарит W5W. Круглый аналоговый спидометр в металлическом корпусе.',sys:'Электрика',ex:[420,220,0]});
lathe(gL,[[0.1,-58],[52,-55],[80,-38],[94,-8],[96,22],[94,30]],'x',[1330,905,0],'paint',64);
lathe(gL,[[86,24],[98,26],[100,34],[92,40],[86,38]],'x',[1330,905,0],'chrome',64);
lathe(gL,[[0.1,40],[60,38],[86,32]],'x',[1330,905,0],mat('lens'),64).material.transparent=true;
lathe(gL,[[18,-10],[70,10],[84,30]],'x',[1330,905,0],'chrome',48);
mirrorZ(s=>{rod(gL,[1250,880,s*96],[1330,905,s*96],6,'black');cyl(gL,10,10,'z',[1330,905,s*96],'alu',12);});
/* turn indicators front */
mirrorZ(s=>{rod(gL,[1250,870,s*90],[1270,866,s*150],5,'black');lathe(gL,[[0.1,0],[16,4],[17,26],[0.1,30]],'x',[1262,866,s*152],mat('lens'),20);});

/* --- frame: black tubular, front section + bolted rear section + passenger frame --- */
const gFr=part('frame',{name:'Рама',desc:'Трубчатая стальная рама из трёх частей на болтах: передняя, задняя и пассажирская. Двигатель несущий: верхние трубы идут от рулевой колонки под баком к коробке, нижние к передней опоре двигателя. Пассажирскую часть можно снять.',sys:'Рама',ex:[0,420,0]});
mirrorZ(s=>{
  tube(gFr,[[1180,925,s*40],[1110,850,s*80],[980,740,s*100],[820,690,s*112],[660,660,s*120],[580,650,s*124]],14,'frame');
  tube(gFr,[[1242,825,s*40],[1190,765,s*80],[1140,700,s*120],[1100,645,s*145]],14,'frame');
  rod(gFr,[1100,645,s*145],[1045,615,s*140],16,'frame');
  tube(gFr,[[580,650,s*124],[560,560,s*126],[540,440,s*126]],15,'frame');
  tube(gFr,[[580,650,s*122],[520,720,s*115],[420,768,s*108],[200,780,s*98],[0,788,s*88],[-130,790,s*70]],11,'frame');
  tube(gFr,[[545,470,s*122],[360,640,s*112],[150,770,s*96]],10,'frame');
  /* cast aluminium passenger-frame bracket with the footrest boss */
  /* cast aluminium passenger-frame bracket: three arms from the footrest boss */
  const B0=[168,680,s*128];
  [[[400,758,s*124],13],[[40,786,s*112],11],[[150,562,s*132],12]].forEach(([e,r])=>{const m=tube(gFr,[B0,[(B0[0]+e[0])/2,(B0[1]+e[1])/2+(e[1]>B0[1]?6:0),(B0[2]+e[2])/2],e],r,'alu',24,14);m.scale.z=1;});
  slab(gFr,smooth([[250,730],[330,748],[300,722],[230,700]],20),6,2,'black',[0,0,s*136]);
  lathe(gFr,[[0.1,0],[22,0],[25,4],[23,12],[0.1,13]],s>0?'z':'-z',[168,680,s*130],'alu',28);
});
lathe(gFr,[[30,0],[38,4],[36,186],[40,192],[30,196]],'y',[fpt(552).x,fpt(552).y,0],'frame').quaternion.setFromUnitVectors(new V3(0,1,0),FU);
rod(gFr,[580,650,-124],[580,650,124],11,'frame');rod(gFr,[0,788,-88],[0,788,88],10,'frame');rod(gFr,[1140,700,-120],[1140,700,120],12,'frame');rod(gFr,[-130,790,-70],[-130,790,70],9,'frame');

/* --- tank: steel, Monolith metallic matt, alu trim over right-hand air intake --- */
const gT=part('tank',{name:'Бак',desc:'Стальной бак 17 л, длинный и высокий, от рулевой колонки до сиденья. Под баком справа алюминиевая накладка воздухозаборника, слева окрашенная крышка. Бензин АИ-98, допускается АИ-95.',sys:'Топливо',ex:[0,520,0]});
const TANK={top:[[515,780],[522,840],[537,867],[596,917],[654,943],[712,954],[771,962],[829,966],[888,966],[961,960],[1034,943],[1080,922],[1100,900],[1112,860]],
  bot:[[515,760],[522,705],[600,712],[742,731],[900,740],[1034,760],[1100,768],[1112,800]],
  hw:[[515,60],[540,95],[618,130],[720,160],[823,172],[925,176],[1028,160],[1080,125],[1112,80]],nz:2.6,nt:2.2,nb:4,taper:.22,dome:8};
{const m=loft(gT,TANK,'paint');skin(m,null,(n,w)=>n.y>.78?['T',q=>PMAP.T(q.x,q.z)]:(n.z>=0?['R',q=>PMAP.R(q.x,q.y)]:['L',q=>PMAP.L(548+(q.x-548)*1.032,q.y)]),{em:.6,r:.4,env:.5,shrink:.84});}
mirrorZ(s=>{lathe(gT,[[0.1,0],[28,0],[31,2],[31,5],[0.1,6]],s>0?'z':'-z',[968,877,s*157],'chrome',40);add(gT,new THREE.CircleGeometry(25,40),new THREE.MeshStandardMaterial({color:0xe8eaec,roughness:.3,metalness:.2}),[968,877,s*163.2],[0,s>0?0:Math.PI,0]);});
/* round side badges and filler neck ring */
(function(){/* right: brushed alu snorkel cover over a black duct; left: painted cover. Profiles traced from the photos */
  const pnl=[[455,700],[600,712],[742,731],[900,740],[1034,760],[1062,748],[1052,700],[975,660],[800,640],[620,624],[520,628],[455,660]];
  slab(gT,smooth(pnl.map(q=>[q[0],q[1]]),80),40,8,'black',[0,0,112]);{const m=slab(gT,smooth(pnl,80),14,5,new THREE.MeshStandardMaterial({color:0xd4d8dc,roughness:.32,metalness:.85,envMapIntensity:1.3}),[0,0,146]);skin(m,null,()=>['R',q=>PMAP.R(q.x,q.y)],{em:.62,r:.35,m:.2,env:.6});}
  for(let i=0;i<3;i++)slab(gT,rr(60,6,3),3,1,'satin',[930-i*26,700-i*4,154]);
  lathe(gT,[[0.1,-30],[36,-30],[42,-26],[42,26],[38,30],[30,30],[30,6],[0.1,6]],'x',[1040,716,112],'black',40);
  slab(gT,smooth(pnl,80),46,8,'black',[0,0,-118]);skin(slab(gT,smooth(pnl,80),8,2,'paint',[0,0,-148]),null,()=>['L',q=>PMAP.L(548+(q.x-548)*1.032,q.y)],{em:.6,r:.4,env:.5});})();
/* --- seat: tapered two-up bench, Saddle Brown leather look --- */
const gS=part('seat',{name:'Сиденье',desc:'Длинное двухместное сиденье до самого хвоста. Под ним аккумулятор, блок управления, предохранители, разъём диагностики и штатный набор инструментов. Высота по водителю 820 мм.',sys:'Кузов',ex:[0,600,0]});
skin(loft(gS,{top:[[-118,845],[-108,866],[-70,877],[18,874],[105,874],[149,868],[193,849],[237,839],[280,830],[324,822],[368,819],[412,826],[456,835],[499,848],[530,846],[548,825]],
  bot:[[-118,830],[-70,814],[18,800],[105,784],[149,770],[193,756],[280,753],[324,745],[412,757],[456,778],[499,784],[548,812]],
  hw:[[-118,40],[-100,85],[-60,118],[7,133],[100,140],[219,143],[300,130],[431,112],[500,92],[548,55]],nz:3.2,nt:3,nb:6,taper:.08,dome:4,nx:90,
  rip:(x,z,ey)=>ey>.55?2.6*Math.abs(Math.sin(x*Math.PI/34))*(ey-.55)/.45:0},'seat'),null,(n)=>n.y>.6?['T',q=>[(545+(548-q.x)/2.12)/1024,1-(345-q.z/2.12)/698]]:['R',q=>PMAP.R(q.x,q.y)],{em:.62,r:.6,shrink:.93});
/* --- tail: short rear section, LED light, plate holder --- */
const gTl=part('tail',{name:'Хвост и фонарь',desc:'Короткий чёрный хвост за сиденьем, светодиодный фонарь (меняется только целиком), поворотники и наклонный номерной кронштейн с подсветкой.',sys:'Кузов',ex:[-260,380,0]});
loft(gTl,{top:[[-302,782],[-290,800],[-220,810],[-150,816],[-110,814]],bot:[[-302,770],[-220,768],[-110,774]],hw:[[-302,30],[-280,62],[-180,78],[-110,72]],nz:3,nt:2.5,nb:5,dome:4},'black');
lathe(gTl,[[0.1,0],[26,2],[28,10],[0.1,12]],'-x',[-298,786,0],'red',32);
mirrorZ(s=>{rod(gTl,[-250,776,s*60],[-262,772,s*110],5,'black');lathe(gTl,[[0.1,0],[12,4],[13,20],[0.1,24]],'-x',[-262,772,s*112],mat('lens'),18);});
tube(gTl,[[-200,770,0],[-232,760,0],[-246,730,0]],8,'black',20);
{const pl=box(gTl,[8,170,200],[-262,680,0],'black');pl.rotation.z=-.33;const pf=add(gTl,new THREE.PlaneGeometry(196,150),mat('lens'),[-268,676,0],[0,-Math.PI/2,0]);pf.rotation.order='YXZ';pf.rotation.x=.33;}
lathe(gTl,[[0.1,0],[12,0],[13,6],[0.1,8]],'-x',[-236,770,0],'lens',16);
/* --- battery, airbox, oil cooler --- */
const gBat=part('battery',{name:'Аккумулятор',desc:'12 В, 14 А·ч, под сиденьем за корпусом воздушного фильтра. Доступ: снять сиденье. Рядом блок управления, предохранители и разъём диагностики. Если стоит больше 4 недель, подключай поддерживающее зарядное.',sys:'Электрика',ex:[-80,300,0]});
box(gBat,[150,145,87],[370,665,0],'black');box(gBat,[156,8,93],[370,733,0],'satin');
cyl(gBat,7,12,'y',[330,743,26],'red');cyl(gBat,7,12,'y',[330,743,-26],'satin');
const gAir=part('airbox',{name:'Корпус воздушного фильтра',desc:'Чёрный корпус за двигателем, над коробкой. Воздух заходит через заборник справа под баком. С боков в него входят патрубки от дросселей. Фильтр меняют каждые 20 000 км, оригинал BMW 13 71 7 706 414.',sys:'Впуск',ex:[0,300,0]});
slab(gAir,rr(220,140,40),250,14,'black',[560,630,0]);
mirrorZ(k=>{slab(gAir,rr(112,150,34),32,8,'black',[600,540,k*138]);
  lathe(gAir,[[0.1,0],[38,0],[44,2],[44,14],[38,16],[0.1,16]],k>0?'z':'-z',[614,502,k*150],'black',40);});
slab(gAir,rr(80,56,6),1,0,'ceramic',[560,620,-126]);
const gOC=part('cooler',{name:'Масляный радиатор',desc:'Перед двигателем слева под фарой. Двигатель воздушно-масляного охлаждения: масло охлаждает головки и проходит через этот радиатор.',sys:'Смазка',ex:[300,40,0]});
slab(gOC,rr(34,190,8),130,3,'black',[1095,640,-70],'z');
for(let i=0;i<18;i++)box(gOC,[36,2,118],[1100,560+i*9.5,-70],'satin');


/* --- engine (black coating, brushed alu covers) --- */
const gCase=part('crankcase',{name:'Картер двигателя',desc:'Оппозитный двухцилиндровый «боксер» 1170 см³, 101 на 73 мм, сжатие 12:1. Внизу сливная пробка, снизу спереди масляный фильтр, слева окошко уровня масла.',sys:'Двигатель',layer:'drive',ex:[0,-160,0]});
slab(gCase,smooth([[640,300],[700,268],[860,262],[930,300],[950,380],[948,520],[905,572],[760,580],[650,560],[628,470]],80),246,18,'case',[0,0,0]);
lathe(gCase,[[0.1,-125],[108,-125],[122,-112],[124,0],[122,112],[108,125],[0.1,125]],'x',[778,452,0],'case',56);
for(let i=0;i<6;i++)box(gCase,[300-i*20,5,250],[795,270+i*12,0],'fin');
slab(gCase,smooth([[700,266],[920,266],[905,232],[715,232]],40),200,10,'case',[0,0,0]);
slab(gCase,smooth([[508,300],[650,290],[660,560],[520,560],[505,470]],50),224,14,'case',[0,0,0]);
const gBelt=part('beltcover',{name:'Крышка ремня генератора',desc:'Алюминиевая крышка спереди двигателя. Под ней поликлиновой ремень от коленвала к генератору. Замена ремня раз в 6 лет или 40 000 км.',sys:'Электрика',layer:'drive',ex:[260,0,0]});
slab(gBelt,rr(200,300,100),30,10,'brushed',[968,530,0],'x');slab(gBelt,rr(120,220,60),4,1,'satin',[984,530,0],'x');
for(let i=0;i<6;i++){cyl(gBelt,6,6,'x',[985,410+i*48,(i%2?1:-1)*84],'steel',6);}
const gGB=part('gearbox',{name:'Коробка передач',desc:'Шесть передач, сухое сцепление с гидроприводом. Первичная передача 1,737. Стартер слева под впускным патрубком. Пробки: заливная M14 и сливная M18, обе 30 Нм.',sys:'Трансмиссия',layer:'drive',ex:[-200,0,0]});
slab(gGB,smooth([[630,300],[560,296],[480,330],[466,400],[476,500],[540,560],[630,566]],60),206,14,'case',[0,0,0]);

lathe(gGB,[[58,0],[60,6],[56,40],[0.1,44]],'-x',[470,395,96],'case',36);
const gTB=part('throttle',{name:'Дроссели и впуск',desc:'Два чёрных дроссельных узла по 50 мм на тросе, сразу за головками на хомутах. Сбоку датчик положения дросселя, сверху форсунка. Толстый патрубок идёт прямо назад в окно корпуса фильтра. Синхронизацию делают каждые 10 000 км.',sys:'Впуск',layer:'drive',ex:[-140,160,0]});
mirrorZ(s=>{
  /* throttle body: black, short, straight behind the head on a clamp */
  lathe(gTB,[[0.1,0],[34,0],[34,10],[31,14],[31,70],[34,74],[34,84],[0.1,84]],'-x',[652,462,s*250],'black',40);
  lathe(gTB,[[35,0],[37,2],[37,10],[35,12]],'-x',[660,462,s*250],'steel',32);
  /* throttle position sensor on the outer face, with its plug */
  slab(gTB,rr(38,48,6),14,3,'black',[612,454,s*290]);for(let i=0;i<4;i++)box(gTB,[3,40,4],[600+i*8,454,s*299],'black');
  box(gTB,[22,20,18],[612,422,s*292],'black');cyl(gTB,4,10,'z',[598,466,s*299],'steel',8);cyl(gTB,4,10,'z',[626,442,s*299],'steel',8);
  /* injector on top with its plug and lines */
  cyl(gTB,11,44,'y',[628,512,s*250],'black',16);box(gTB,[24,18,26],[628,540,s*250],'black');
  tube(gTB,[[628,550,s*250],[620,580,s*226],[600,600,s*190],[590,610,s*130]],3.5,'black',20);
  tube(gTB,[[640,520,s*262],[660,560,s*240],[690,590,s*200]],3,'black',16);
  /* intake duct: thick, straight back into the airbox side port, clamps both ends */
  tube(gTB,[[580,462,s*250],[556,462,s*250],[530,462,s*226],[506,462,s*190],[494,462,s*166]],40,'rubber',48);
  lathe(gTB,[[41,0],[43,2],[43,12],[41,14]],'-x',[574,462,s*250],'steel',32);});

const cyls={};
mirrorZ(s=>{
  const side=s>0?'R':'L', nm=s>0?'правый':'левый';
  const gC=part('cyl'+side,{name:'Цилиндр, '+nm,desc:'Цилиндр с рёбрами воздушного охлаждения, диаметр 101 мм.',sys:'Двигатель',layer:'drive',ex:[0,0,s*170]});
  lathe(gC,[[70,0],[78,0],[78,100],[70,100]],'z',[770,430,s>0?112:-212],'case',40);
  for(let i=0;i<8;i++){slab(gC,rr(204-i*3,204-i*3,96-i*1.5),4,1,'fin',[770,430,s*(124+i*11)],null,24);
    lathe(gC,[[96,0],[99,0],[99,2],[96,2]],'z',[770,430,s*(123+i*11)],'edge',4).visible=false;}
  const gHd=part('head'+side,{name:'Головка цилиндра, '+nm,desc:'Два распредвала с цепным приводом, 4 клапана: впуск 39 мм сзади, выпуск 33 мм спереди. В центре колодец свечи.',sys:'Двигатель',layer:'drive',ex:[0,0,s*260]});
  slab(gHd,rrH(226,226,96,15+14),76,14,'case',[770,430,s*252],null,24);
  {const sh=rr(226,226,96);const ho=rr(184,184,74);sh.holes.push(new THREE.Path(ho.getPoints(40).reverse()));
   const g=new THREE.ExtrudeGeometry(sh,{depth:30,bevelEnabled:true,bevelThickness:3,bevelSize:3,bevelSegments:2,curveSegments:14});g.translate(0,0,-15);add(gHd,g,'case',[770,430,s*308]);
   add(gHd,new THREE.PlaneGeometry(184,196),mat('well',true),[770,430,s*289.5]);
   [-50,50].forEach(dx=>[-32,32].forEach(dy=>add(gHd,new THREE.RingGeometry(14.2,17,24),mat('steel',true),[770+dx,430+dy,s*290.2])));}
  for(let i=0;i<3;i++)slab(gHd,rrH(248,244,108,16),4,1,'fin',[770,430,s*(232+i*16)],null,24);
  /* spark-plug well: bore Ø30 from the cover face down to the plug seat, ~12 cm deep */
  const gW=part('well'+side,{name:'Колодец свечи, '+nm,desc:'Отверстие диаметром около 30 мм через крышку клапанов и головку, глубиной около 12 см. На дне свеча. Сюда вставляется катушка.',sys:'Зажигание',layer:'drive',ex:[0,0,0]});
  lathe(gW,[[15,0],[15,128]],s>0?'z':'-z',[770,430,s*238],'well',32);
  add(gW,new THREE.RingGeometry(8.4,15,32),mat('well',true),[770,430,s*238],[0,s>0?0:Math.PI,0]);
  lathe(gW,[[5.2,0],[5.2,24]],s>0?'z':'-z',[770,430,s*214],'well',16);
  slab(gHd,rr(70,120,30),40,8,'case',[858,368,s*262]);slab(gHd,rr(80,110,30),40,8,'case',[674,466,s*262]);
  const gCv=part('cover'+side,{name:'Крышка клапанов, '+nm,desc:'Алюминиевая крышка на болтах M6, момент 10 Нм. Под ней распредвалы и толкатели. При снятии ставь новую прокладку.',sys:'Двигатель',layer:'drive',ex:[0,0,s*360]});
  skin(slab(gCv,rrH(214,200,84,15+12),40,16,'headcov',[770,430,s*344],null,24),[120,40,0],()=>s>0?['R',q=>[(995+(q.x-890)/1.63)/1920,1-(850-(q.y-470)/1.63)/1280]]:['L',q=>[(480-(q.x-890)/2.2)/1112,1-(457-(q.y-470)/2.2)/716]],{em:.6,r:.35,m:.3,env:.7,shrink:.9});
  {const sh=rr(214,224,62);sh.holes.push(new THREE.Path(rr(196,206,54).getPoints(40).reverse()));const g=new THREE.ExtrudeGeometry(sh,{depth:2,bevelEnabled:false,curveSegments:14});g.translate(0,0,-1);add(gCv,g,'rubber',[770,430,s*326]);}
  lathe(gCv,[[15,0],[15,36],[19,40]],s>0?'z':'-z',[770,430,s*327],'headcov',32);
  const gCo=part('coil'+side,{name:'Катушка зажигания, '+nm,desc:'Стержневая катушка, стоит прямо на свече через центр крышки клапанов. Снимается рукой: отщёлкнуть разъём и тянуть прямо наружу.',sys:'Зажигание',layer:'drive',ex:[70,300,s*360]});
  lathe(gCo,[[6,0],[10,4],[11,18],[12,22]],s>0?'z':'-z',[770,430,s*282],'rubber',20);
  cyl(gCo,12,66,'z',[770,430,s*337],'coil',20);lathe(gCo,[[0.1,-6],[14,-6],[22,0],[24,6],[22,30],[16,36],[0.1,38]],s>0?'z':'-z',[770,430,s*368],'coil',28);
  const gCn=part('conn'+side,{name:'Разъём катушки, '+nm,desc:'Пластиковый разъём на верхушке катушки. Снимается нажатием на защёлку. Тянуть за корпус разъёма, не за провода.',sys:'Зажигание',layer:'drive',ex:[50,230,s*200]});
  box(gCn,[30,24,22],[770,468,s*388],'black');box(gCn,[12,4,14],[770,482,s*388],'red');
  tube(gCn,[[770,476,s*398],[760,500,s*392],[700,520,s*360],[640,540,s*300],[610,580,s*200],[620,660,s*128]],4,'black',40);
  gCn.position.y=0;
  const gPl=part('plug'+side,{name:'Свеча зажигания, '+nm,desc:'NGK MAR8B-JDS, резьба M10x1, зазор 0,8 мм, момент 12 Нм. Замена каждые 20 000 км.',sys:'Зажигание',layer:'drive',ex:[0,0,s*620]});
  cyl(gPl,5,24,'z',[770,430,s*226],'steel',12);
  cyl(gPl,8.08,14,'z',[770,430,s*245],'steel',6);cyl(gPl,8.6,2,'z',[770,430,s*239],'copper',20);
  lathe(gPl,[[6.5,0],[7.5,4],[7,20],[5.5,34],[4.5,38]],s>0?'z':'-z',[770,430,s*252],'ceramic',20);
  cyl(gPl,3.6,8,'z',[770,430,s*294],'steel',12);
  cyl(gPl,1.3,8,'z',[770,430,s*210],'steel',8);
  [-1,1].forEach(k=>box(gPl,[3,1.6,10],[770,430+k*3.4,s*209],'steel'));
  /* internals */
  const gCam=part('cams'+side,{name:'Газораспределительный механизм, '+nm,desc:'Как у BMW в этом DOHC-моторе: два распредвала на цилиндр лежат вдоль мотоцикла, один над другим, и каждый открывает один впускной и один выпускной клапан. Кулачки давят на лёгкие рычаги (Schlepphebel, «рокеры»): с одной стороны рычаг на оси, с другой давит на клапан через полусферическую шайбу. Зазор регулируют подбором этих шайб. Ход клапана 10,8 мм. Цепь крутит звёздочку на нижнем распредвале, верхний крутится от него через шестерню, оба в два раза медленнее коленвала.',sys:'ГРМ',layer:'internal',ex:[0,0,s*120]});
  const cams=[],valves=[],ZC=309;
  const xEnd=s>0?656:884, xg=s>0?680:860;          // chain sprocket and cam-gear planes (cam frame)
  const tag=o=>{o.traverse(q=>{if(q.isMesh)q.userData.part='cams'+side;});return o;};
  const ig=null;
  /* two camshafts (BMW parts list: camshaft I and II, one sprocket per head). The chain drives the sprocket on the lower camshaft;
     both camshafts carry spur gears that mesh, so the upper one turns the other way at the same speed. */
  const PK={in:460,ex:270};
  [[1,485],[-1,375]].forEach(([u,cy])=>{const cg=new THREE.Group();cg.position.set(0,cy,s*ZC);gCam.add(cg);
    const x0=u<0?xEnd:xg;add(cg,new THREE.CylinderGeometry(10,10,Math.abs(850-x0)+20,16).rotateZ(Math.PI/2),'steel',[(850+x0)/2,0,0]);
    {const q=gearGeo0(55,40);q.rotateZ(Math.PI/2);q.scale(.75,1,1);add(cg,q,'brass',[xg,0,0]);}
    if(u<0){const g=gearGeo0(40,30);g.rotateZ(Math.PI/2);add(cg,g,'satin',[xEnd,0,0]);}
    [[720,'in'],[820,'ex']].forEach(([x,kind])=>{const lobe=new THREE.Shape();lobe.absarc(0,0,16,Math.PI*.2,Math.PI*.8,true);lobe.quadraticCurveTo(-10,24,0,26);lobe.quadraticCurveTo(10,24,16*Math.cos(Math.PI*.2),16*Math.sin(Math.PI*.2));
      const lg=new THREE.ExtrudeGeometry(lobe,{depth:16,bevelEnabled:true,bevelThickness:1,bevelSize:1,bevelSegments:1});lg.translate(0,0,-8);lg.rotateY(Math.PI/2);
      const lgp=new THREE.Group();lgp.position.x=x;lgp.rotation.x=-s*Math.PI/2-u*PK[kind]/2*Math.PI/180;cg.add(lgp);add(lgp,lg,'steel');});
    tag(cg);cams.push({g:cg,u});
    /* camshaft supporting bracket across both shafts */
    [700,770,840].forEach(x=>{const b=box(gCam,[14,34,24],[x,cy,s*(ZC+4)],'case');b.userData.part='cams'+side;});
    const ry=cy+u*24;add(gCam,new THREE.CylinderGeometry(5,5,170,10).rotateZ(Math.PI/2),'steel',[770,ry,s*296]).userData.part='cams'+side;});
  /* valves with finger rockers: pivot on the rocker shaft, pad under the lobe, tip on the valve */
  [[720,'in'],[820,'ex']].forEach(([x,kind])=>[[1,462],[-1,398]].forEach(([u,vy])=>{const vg=new THREE.Group();gCam.add(vg);
    add(vg,new THREE.CylinderGeometry(3,3,70,8).rotateX(Math.PI/2),'steel',[x,vy,s*245]);
    add(vg,new THREE.CylinderGeometry(kind==='in'?19.5:16.5,kind==='in'?19.5:16.5,3,20).rotateX(Math.PI/2),'steel',[x,vy,s*211]);
    add(vg,new THREE.CylinderGeometry(10,10,4,16).rotateX(Math.PI/2),'alu',[x,vy,s*278]);
    tag(vg);
    const piv=new THREE.Group();piv.position.set(x,vy+u*47,s*296);gCam.add(piv);
    const arm=box(piv,[14,52,7],[0,-u*24,-s*3],'satin');const pad=box(piv,[12,10,3],[0,-u*24,s*1],'steel');
    const sh=new THREE.Mesh(new THREE.SphereGeometry(6,14,8,0,Math.PI*2,0,Math.PI/2),mat('brass'));sh.rotation.x=-s*Math.PI/2;sh.position.set(0,-u*47,-s*8);piv.add(sh);sh.userData.part='cams'+side;
    tag(piv);valves.push({g:vg,kind,piv,u});}));
  const gPi=part('piston'+side,{name:'Поршень, '+nm,desc:'Поршень 101 мм. В боксере оба поршня одновременно уходят наружу и возвращаются к коленвалу.',sys:'Двигатель',layer:'internal',ex:[0,0,0]});
  const pg=new THREE.Group();gPi.add(pg);
  const pm=lathe(pg,[[0.1,-25],[44,-25],[50,-20],[50.5,25],[46,27],[0.1,28]],'z',[0,0,0],'alu',36);if(s<0)pm.scale.z=-1;
  for(let i=0;i<3;i++)lathe(pg,[[50.6,0],[50.8,0],[50.8,2],[50.6,2]],'z',[0,0,s*(12+i*5)],'steel',36);
  const conrod=add(gPi,new THREE.CylinderGeometry(9,9,125,10),'steel');
  const spark=new THREE.Mesh(new THREE.SphereGeometry(30,16,12),new THREE.MeshBasicMaterial({color:0xffc83d,transparent:true,opacity:0}));
  spark.position.set(770,430,s*205);spark.userData.own=true;gPi.add(spark);
  cyls[side]={s,cams,valves,pg,conrod,spark,ig};
});
const gCrank=part('crank',{name:'Коленвал',desc:'Коленвал идёт вдоль мотоцикла. Шатунные шейки развёрнуты на 180°, поэтому поршни двигаются зеркально.',sys:'Двигатель',layer:'internal',ex:[0,0,0]});
const crankRot=new THREE.Group();crankRot.position.copy(CR);gCrank.add(crankRot);
add(crankRot,new THREE.CylinderGeometry(20,20,300,16).rotateZ(Math.PI/2),'steel');
const pins={R:new V3(-30,0,0),L:new V3(30,0,0)};
['R','L'].forEach(k=>{const sgn=k==='R'?1:-1;add(crankRot,new THREE.BoxGeometry(14,70,60),'steel',[pins[k].x-12,0,sgn*18]);
  add(crankRot,new THREE.CylinderGeometry(16,16,28,14).rotateZ(Math.PI/2),'steel',[pins[k].x,0,sgn*36.5]);});
crankRot.children.forEach(m=>m.userData.part='crank');

/* ===================== GEARBOX INTERNALS (BMW 23_1108 shafts, 23_1109 shift parts, 23_1110 selector shaft) =====================
   Official: three shafts on grooved ball bearings (input 52x20x15 + 20x47x14, intermediate 2x 56x22x16, output 56x22x16 + 62x25x17),
   helical gears running on needle bearings, engaged by shift sleeves; hollow aluminium shift drum (shifting roll) on a 12x28x8 bearing,
   three forks (1/6, 2/3, 4/5) on two rails (167x13,8 and 148), selector shaft with 17x42x7,5 seal, locking lever with spring.
   Ratios (BMW technical data): 2,375 / 1,696 / 1,296 / 1,065 / 0,939 / 0,848, fixed pair 1,737, final drive 2,91.
   Not published by BMW, so estimated here: tooth counts (picked to give exactly these ratios), the order of the pairs, shaft positions.
   Fit to the scan: the input shaft is coaxial with the crank (clutch disc hub), the output shaft ends at the front universal joint
   on the swingarm pivot. The six pairs run between the input and intermediate shafts (they need the length between clutch and
   rear wall); the fixed 1,737 pair sits at the front and drops to the short output shaft. */
const RATIOS=[2.375,1.696,1.296,1.065,0.939,0.848], PRIMARY=1.737, FINAL=2.91;
const GBX=(function(){
const DEG=Math.PI/180;
const AXI={y:454,z:0}, AXO={y:341,z:112};                         /* input = crank axis; output = front U-joint axis */
const dIO=Math.hypot(AXO.y-AXI.y,AXO.z-AXI.z), A1=85;               /* input-intermediate centre distance (estimate) */
const AXM={y:AXI.y+(AXO.y-AXI.y)*A1/dIO,z:AXI.z+(AXO.z-AXI.z)*A1/dIO}, A2=dIO-A1;
const PHI_IM=Math.atan2(AXM.z-AXI.z,AXM.y-AXI.y), PHI_MO=Math.atan2(AXO.z-AXM.z,AXO.y-AXM.y);
/* pairs: [gear, teeth on input (free gear), teeth on intermediate (fixed), x centre]; front -> rear */
const W=10,TRV=2;
const PAIRS=[[5,33,31,544],[4,31,33,520],[3,27,35,506],[2,23,39,482],[6,33,28,468],[1,16,38,444]];
const SLEEVES=[{x:532,f:5,r:4},{x:494,f:3,r:2},{x:456,f:6,r:1}];   /* sleeve between two gears: front gear f, rear gear r */
const XD=575, ZD=[19,33];                                           /* fixed pair 33/19 = 1,737 (intermediate Z19 -> output Z33) */
part('gears',{name:'',desc:'',sys:'Трансмиссия',layer:'internal',ex:[0,0,0]});const gG=P.gears.g;P.gears.name='Коробка: валы и шестерни';
P.gears.desc='BMW 23_1108. Три вала на шариковых подшипниках: первичный (соосен коленвалу, полый, внутри шток сцепления; подшипники 52x20x15 и 20x47x14), промежуточный (два 56x22x16) и выходной (56x22x16 и 62x25x17), выходной кончается карданным шарниром на оси маятника. Шестерни косозубые, свободные сидят на игольчатых подшипниках и всё время в зацеплении; передачу включает муфта, которая скользит по шлицам вала и цепляет шестерню кулачками. Передаточные числа BMW: 2,375 / 1,696 / 1,296 / 1,065 / 0,939 / 0,848 и постоянная пара 1,737. Числа зубьев подобраны под эти числа, порядок пар и положение валов: оценка, BMW их не публикует.';
P.gears.sys='Трансмиссия';
const parts=[];
const M=(k,geo,pos)=>{const m=new THREE.Mesh(geo,mat(k,true));if(pos)m.position.set(...pos);return m;};
const put=(o,id)=>{o.traverse(m=>{if(m.isMesh){m.userData.part=id||'gears';pickables.push(m);}});(id?P[id].g:gG).add(o);return o;};
const ring=(ro,ri,w,n)=>{const g=new THREE.LatheGeometry([[ri,-w/2],[ro,-w/2],[ro,w/2],[ri,w/2],[ri,-w/2]].map(p=>new THREE.Vector2(p[0],p[1])),n||40);g.rotateZ(-Math.PI/2);return g;};
const bearing=(od,id,w,x,ax,id2)=>{const g=new THREE.Group();g.position.set(x,ax.y,ax.z);
  g.add(M('steel',ring(od/2,od/2-3.2,w)));g.add(M('chrome',ring(id/2+3,id/2,w)));g.add(M('satin',ring(od/2-3.2,id/2+3,w*.55)));return put(g,id2);};
/* input shaft gears: free, with dog windows facing the sleeve */
const mods={},free={},fixed={};
PAIRS.forEach(([g,zi,zm,x])=>{const m=2*A1/(zi+zm);mods[g]=m;const hand=1;
  const gi=M('steel',invGear(zi,m,W,{helix:22,hand,bore:14}),[x,AXI.y,AXI.z]);gi.userData.ownEm=true;
  const sl=SLEEVES.find(s=>s.f===g||s.r===g),dir=sl.x>x?1:-1;      /* dogs on the side facing the sleeve */
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;const d=M('steel',new THREE.BoxGeometry(1.5,7,6),[dir*(W/2+.75),22*Math.cos(a),22*Math.sin(a)]);d.rotation.x=a;gi.add(d);}
  free[g]=put(gi);
  const gm=M('steel',invGear(zm,m,W,{helix:22,hand:-1,bore:12}),[x,AXM.y,AXM.z]);gm.userData.ownEm=true;fixed[g]=put(gm);});
/* intermediate shaft with the drive gear Z19 of the fixed pair, output shaft with Z33 */
const md=2*A2/(ZD[0]+ZD[1]);
const iSh=new THREE.Group();iSh.position.set(0,AXM.y,AXM.z);
iSh.add(M('steel',new THREE.CylinderGeometry(11,11,598-420,20).rotateZ(Math.PI/2),[(598+420)/2,0,0]));
const dM=M('steel',invGear(ZD[0],md,14,{helix:22,hand:1,bore:10}),[XD,0,0]);iSh.add(dM);put(iSh);
const oSh=new THREE.Group();oSh.position.set(0,AXO.y,AXO.z);
oSh.add(M('steel',new THREE.CylinderGeometry(12.5,12.5,598-547,20).rotateZ(Math.PI/2),[(598+547)/2,0,0]));
oSh.add(M('steel',invGear(ZD[1],md,14,{helix:22,hand:-1,bore:12}),[XD,0,0]));
put(oSh);
/* bearings, official sizes */
bearing(52,20,15,590,AXI);bearing(47,20,14,428,AXI);
bearing(56,22,16,590,AXM);bearing(56,22,16,428,AXM);
bearing(56,22,16,590,AXO);bearing(62,25,17,559,AXO);
/* shift sleeves on the input shaft splines, with the fork groove */
const sleeves=SLEEVES.map(s=>{const g=new THREE.Group();g.position.set(s.x,AXI.y,AXI.z);
  const pr=[[15,-4],[34,-4],[34,-1.5],[30,-1.5],[30,1.5],[34,1.5],[34,4],[15,4],[15,-4]].map(p=>new THREE.Vector2(p[0],p[1]));
  const lg=new THREE.LatheGeometry(pr,48);lg.rotateZ(-Math.PI/2);g.add(M('satin',lg));
  [-1,1].forEach(d=>{for(let k=0;k<6;k++){const a=(k+.5)/6*Math.PI*2;const b=M('satin',new THREE.BoxGeometry(1.5,7,6),[d*4.75,22*Math.cos(a),22*Math.sin(a)]);b.rotation.x=a;g.add(b);}});
  put(g);return {g,s,pos:0};});
/* ---- shift mechanism (own part) ---- */
part('shiftMech',{name:'Механизм переключения',desc:'BMW 23_1109, 23_1110. Барабан переключения (полый, алюминиевый, на подшипнике 12x28x8) с тремя фигурными канавками. В канавки входят пальцы трёх вилок: 1-я и 6-я, 2-я и 3-я, 4-я и 5-я. Вилки ходят по двум штокам (167x13,8 и 148 мм) и двигают муфты на первичном валу. Барабан поворачивает вал переключения (сальник 17x42x7,5) от рычага на левой подножке, рычаг фиксатора с пружиной держит барабан в положении каждой передачи. Нейтраль между 1-й и 2-й. Где именно стоят барабан и штоки внутри коробки: оценка.',sys:'Трансмиссия',layer:'internal',ex:[0,-40,-120]});
const DR={y:386,z:-62,x0:440,x1:540,r:20}, RA={y:430,z:-74}, RB={y:408,z:-90};
const STA={1:-50,0:0,2:50,3:100,4:150,5:200,6:250};               /* drum angle for each gear (N = 0) */
const drum=new THREE.Group();drum.position.set(0,DR.y,DR.z);
drum.add(M('alu',new THREE.CylinderGeometry(DR.r,DR.r,DR.x1-DR.x0,40).rotateZ(Math.PI/2),[(DR.x0+DR.x1)/2,0,0]));
const FORKS=SLEEVES.map(s=>({x:s.x,f:s.f,r:s.r,rail:s.f===6?RB:RA}));
function forkOff(F,ang){/* axial fork travel for a drum angle (deg): +4 to the front gear, -4 to the rear one, ramps between stations */
  const st=Object.entries(STA).map(([g,a])=>[a,+g===F.f?TRV:(+g===F.r?-TRV:0)]).sort((a,b)=>a[0]-b[0]);
  if(ang<=st[0][0])return st[0][1];if(ang>=st[st.length-1][0])return st[st.length-1][1];
  for(let i=0;i<st.length-1;i++){const [a0,v0]=st[i],[a1,v1]=st[i+1];if(ang<=a1){const t=(ang-a0)/(a1-a0),k=t<.3?0:(t>.7?1:(t-.3)/.4);return v0+(v1-v0)*k;}}return 0;}
FORKS.forEach(F=>{const pts=[],ps=Math.atan2(F.rail.z-DR.z,F.rail.y-DR.y);for(let a=-80;a<=280;a+=4){const t=ps+a*DEG;pts.push(new V3(F.x+forkOff(F,a),(DR.r+.2)*Math.cos(t),(DR.r+.2)*Math.sin(t)));}
  drum.add(M('black',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),120,2,6,false)));});
/* star cam for the locking lever on the front end */
{const st=[];for(let i=0;i<72;i++){const t=i/72*Math.PI*2,r=24-3*Math.max(0,Math.cos(7*t))**6;st.push(new THREE.Vector2(r*Math.cos(t),r*Math.sin(t)));}
  const g=new THREE.ExtrudeGeometry(new THREE.Shape(st),{depth:6,bevelEnabled:false});g.rotateY(Math.PI/2);drum.add(M('steel',g,[DR.x1,0,0]));
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;drum.add(M('chrome',new THREE.CylinderGeometry(2.5,2.5,6,10).rotateZ(Math.PI/2),[DR.x1+9,14*Math.cos(a),14*Math.sin(a)]));}}
put(drum,'shiftMech');
bearing(28,12,8,DR.x0-4,DR,'shiftMech');
/* rails */
[[RA,436,590],[RB,438,575]].forEach(([R,a,b])=>put(M('chrome',new THREE.CylinderGeometry(6.9,6.9,b-a,16).rotateZ(Math.PI/2),[(a+b)/2,R.y,R.z]),'shiftMech'));
/* forks: hub on the rail, arm to the sleeve, half-ring in the sleeve groove, pin into the drum groove */
const forkG=FORKS.map(F=>{const g=new THREE.Group();g.position.set(F.x,0,0);const R=F.rail;
  const toR=Math.atan2(R.z-AXI.z,R.y-AXI.y);
  const arc=[];for(let i=0;i<=24;i++){const t=toR-1.25+2.5*i/24;arc.push(new THREE.Vector2(-(AXI.z+42*Math.sin(t)),AXI.y+42*Math.cos(t)));}
  for(let i=24;i>=0;i--){const t=toR-1.25+2.5*i/24;arc.push(new THREE.Vector2(-(AXI.z+31*Math.sin(t)),AXI.y+31*Math.cos(t)));}
  const ag=new THREE.ExtrudeGeometry(new THREE.Shape(arc),{depth:2.8,bevelEnabled:false});ag.translate(0,0,-1.4);ag.rotateY(Math.PI/2);g.add(M('brass',ag));
  const mid=new V3(0,AXI.y+42*Math.cos(toR),AXI.z+42*Math.sin(toR)),hub=new V3(0,R.y,R.z);
  const arm=M('brass',new THREE.BoxGeometry(5,mid.distanceTo(hub)+4,10),[0,(mid.y+hub.y)/2,(mid.z+hub.z)/2]);arm.rotation.x=Math.atan2(hub.z-mid.z,hub.y-mid.y);g.add(arm);
  g.add(M('brass',new THREE.CylinderGeometry(11,11,18,20).rotateZ(Math.PI/2),[0,R.y,R.z]));
  const dv=new V3(0,DR.y-R.y,DR.z-R.z),dl=dv.length()-DR.r+1;dv.normalize();
  const pin=M('chrome',new THREE.CylinderGeometry(3,3,dl,10),[0,R.y+dv.y*dl/2,R.z+dv.z*dl/2]);pin.quaternion.setFromUnitVectors(new V3(0,1,0),dv);g.add(pin);
  put(g,'shiftMech');return g;});
/* selector shaft from the left side (to the shift linkage) with the shifting arm on the drum end, locking lever with roller */
const sel=new THREE.Group();sel.position.set(552,362,-117);
sel.add(M('steel',new THREE.CylinderGeometry(8.5,8.5,70,18).rotateX(Math.PI/2)));
sel.add(M('black',ring(21,8.5,7.5).rotateY(Math.PI/2),[0,0,-30]));                       /* shaft seal 17x42x7,5 */
const armS=M('steel',new THREE.BoxGeometry(5,34,10),[-4,16,30]);sel.add(armS);put(sel,'shiftMech');
{const lv=new THREE.Group();const p0=new V3(DR.x1+3,DR.y-34,DR.z+18);lv.position.copy(p0);
  lv.add(M('steel',new THREE.BoxGeometry(5,26,8),[0,8,-6]));lv.add(M('chrome',new THREE.CylinderGeometry(4,4,8,12).rotateZ(Math.PI/2),[0,14,-12]));
  lv.add(M('spring',new THREE.TorusGeometry(5,1.2,6,16).rotateY(Math.PI/2),[0,-2,0]));put(lv,'shiftMech');}
/* ---- motion ---- */
let drumAng=0;
function set(aIn,gear,dt){/* aIn: input shaft angle in rotation.x terms (rad) */
  const k=gear?PAIRS.find(p=>p[0]===gear):null;
  const aM=k?meshAngle(aIn,k[1],k[2],PHI_IM):0;                       /* intermediate shaft angle */
  PAIRS.forEach(([g,zi,zm])=>{fixed[g].rotation.x=aM;free[g].rotation.x=meshAngle(aM,zm,zi,PHI_IM+Math.PI);});
  iSh.rotation.x=aM;dM.rotation.x=0;oSh.rotation.x=meshAngle(aM,ZD[0],ZD[1],PHI_MO);
  sleeves.forEach(S=>{S.g.rotation.x=aIn;});
  const tgt=STA[gear||0];drumAng+=(tgt-drumAng)*Math.min(1,(dt||.016)*7);
  drum.rotation.x=-drumAng*DEG;armS.rotation.x=(tgt-drumAng)*DEG*.6;
  FORKS.forEach((F,i)=>{const o=forkOff(F,drumAng);forkG[i].position.x=F.x+o;sleeves[i].g.position.x=SLEEVES[i].x+o;});
  PAIRS.forEach(([g])=>[free[g],fixed[g]].forEach(m=>m.material.emissive.setRGB(...(g===gear?[.75,.55,0]:[0,0,0]))));}
return {set,AXI,AXM,AXO};})();

/* driveline: Paralever single-sided swingarm (black), shaft inside, bevel final drive */
const gSA=part('swingarm',{name:'Маятник Paralever и кардан',desc:'Литой однорычажный маятник справа, чёрный, внутри карданный вал. Снизу реактивная тяга Paralever.',sys:'Трансмиссия',layer:'drive',ex:[-160,-80,180]});
(function(){const sh=smooth([[490,438],[300,402],[110,368],[48,352],[48,284],[110,288],[300,330],[490,352]],60);slab(gSA,sh,62,14,'case',[0,0,104]);
  rod(gSA,[470,318,82],[80,252,92],9,'steel');cyl(gSA,16,20,'z',[470,318,82],'alu',16);cyl(gSA,16,20,'z',[80,252,92],'alu',16);
  lathe(gSA,[[44,-70],[50,-62],[50,62],[44,70]],'z',[500,392,0],'case',32);})();
const gShaft=part('driveshaft',{name:'Карданный вал',desc:'Передаёт вращение от коробки на главную передачу. Смазки и регулировки не требует.',sys:'Трансмиссия',layer:'internal',ex:[0,0,0]});
rod(gShaft,[460,392,100],[60,317,105],15,'steel');
lathe(gShaft,[[18,0],[24,8],[24,22],[18,30]],'x',[430,388,100],'steel',16);lathe(gShaft,[[18,0],[24,8],[24,22],[18,30]],'x',[90,322,104],'steel',16);
const gFD=part('finaldrive',{name:'Главная передача (редуктор)',desc:'Корпус редуктора на конце маятника справа (BMW 33 11 8 405 267, с сапуном). Качается на оси маятника, от проворачивания его держит реактивная тяга Paralever. Внутри пара шестерён 11/32 (отношение 2,91), фланец под колесо на 5 болтов. Масло Hypoid Axle Oil G3, замена раз в 2 года. Заливная пробка M12x1,5 с медной шайбой A12x16, сливная M12x1 с кольцом 11,2x1,8.',sys:'Трансмиссия',layer:'drive',ex:[-240,0,220]});
lathe(gFD,[[0.1,40],[60,40],[92,30],[104,8],[104,-8],[96,-20],[70,-30]],'z',[8,315,120],'case',56);
lathe(gFD,[[0.1,41],[56,41],[60,44],[0.1,46]],'z',[8,315,120],'brushed',48);
for(let i=0;i<5;i++){const a=i/5*Math.PI*2;cyl(gFD,6,8,'z',[8+Math.cos(a)*76,315+Math.sin(a)*76,166],'steel',6);}
slab(gFD,rr(110,80,30),60,10,'case',[60,330,108]);
const gFDf=part('fdfill',{name:'Заливная пробка редуктора',desc:'BMW 07 11 9 904 550, M12x1,5 с медной шайбой A12x16 (менять при каждом открытии). Сбоку на корпусе сзади, чуть ниже оси колеса: уровень масла по нижнему краю этого отверстия. Момент 20 Нм.',sys:'Трансмиссия',layer:'drive',ex:[-80,120,160]});
{const an=200*Math.PI/180,c=new THREE.Mesh(new THREE.CylinderGeometry(11,11,12,6),mat('brass'));c.position.set(Math.cos(an)*88,315+Math.sin(an)*88,128);c.rotation.z=an-Math.PI/2;c.userData.part='fdfill';gFDf.add(c);pickables.push(c);}
const gFDd=part('fddrain',{name:'Сливная пробка редуктора',desc:'BMW 33 11 7 705 854, M12x1 с уплотнительным кольцом 11,2x1,8. В самой нижней точке корпуса, под ведомой шестернёй. Момент 20 Нм.',sys:'Трансмиссия',layer:'drive',ex:[-60,-140,160]});
cyl(gFDd,11,12,'y',[-4,230,104],'brass',6);
const gSh=part('shock',{name:'Задний амортизатор',desc:'Центральный амортизатор с белой пружиной: преднатяг регулируется гайкой, отбой винтом. Ход 140 мм.',sys:'Ходовая',ex:[-60,300,-160]});
(function(){const A=[350,396,40],B=[520,690,30];rod(gSh,A,B,11,'chrome',20);
  slab(gSh,rr(50,46,14),34,4,'case',[350,396,52]);rod(gSh,[350,396,104],[350,396,56],9,'case');
  rod(gSh,[520,690,-128],[520,690,128],10,'frame');slab(gSh,rr(44,40,12),40,4,'frame',[520,690,30]);
  const d=new V3(190,300,0);const L=d.length();d.normalize();
  const pts=[];for(let i=0;i<=220;i++){const t=i/220,a=t*Math.PI*2*9;const c=new V3(...A).addScaledVector(d,L*(.22+.56*t));
    const n1=new V3(-d.y,d.x,0),n2=new V3(0,0,1);pts.push(c.clone().addScaledVector(n1,Math.cos(a)*30).addScaledVector(n2,Math.sin(a)*30).toArray());}
  tube(gSh,pts,5,'spring',400,8);
  latheAB(gSh,[[24,0],[26,4],[26,90],[22,96]],[A[0]+d.x*L*.62,A[1]+d.y*L*.62,A[2]],[B[0],B[1],B[2]],'satin');
  cyl(gSh,14,28,'z',A,'alu',16);cyl(gSh,14,28,'z',B,'alu',16);})();

/* oil service points */
const gF1=part('oilfilter',{name:'Масляный фильтр',desc:'Снизу спереди картера: по схеме BMW 11_4215 вкручивается вертикально снизу, рядом со сливной пробкой. Сам фильтр сидит под цепью привода промежуточного вала и её не касается. BMW/Mahle 11 42 7 673 541 или Hiflofiltro HF164. Момент 11 Нм, кольцо смазать маслом.',sys:'Смазка',layer:'drive',ex:[0,-260,0]});
/* BMW 11_4215: the filter screws in vertically from below at the front of the crankcase, under the primary chain */
lathe(gF1,[[0.1,0],[30,1],[36,5],[36,56],[31,60]],'y',[895,167,0],'satin',36);
const gDr=part('drainplug',{name:'Сливная пробка масла',desc:'Внизу картера. Резьба M16x1,5, момент 32 Нм, новое уплотнительное кольцо.',sys:'Смазка',layer:'drive',ex:[0,-260,0]});
cyl(gDr,13,14,'y',[800,226,0],'steel',6);cyl(gDr,15,2,'y',[800,234,0],'copper',24);
const gSG=part('sightglass',{name:'Окошко уровня масла',desc:'Слева внизу картера. Уровень между MIN и MAX на прогретом двигателе, мотоцикл ровно, через 5 минут после остановки.',sys:'Смазка',layer:'drive',ex:[0,0,-260]});
lathe(gSG,[[12,0],[18,0],[18,8],[12,8]],'-z',[740,330,-122],'brushed',28);add(gSG,new THREE.CircleGeometry(12,28),'oil',[740,330,-128],[0,Math.PI,0]);
box(gSG,[18,1.5,1],[740,336,-129],'black');box(gSG,[18,1.5,1],[740,324,-129],'black');
const gFill=part('filler',{name:'Пробка маслозаливной горловины',desc:'Чёрная круглая пробка сверху сзади на правой крышке клапанов. По инструкции BMW: очисти вокруг, вставь биту из бортового набора крестом вперёд в рукоятку отвёртки, поставь на замок пробки и поверни против часовой. Потом сними пробку.',sys:'Смазка',layer:'drive',ex:[0,110,140]});
lathe(gFill,[[0.1,10],[22,10],[24,4],[24,0]],'y',[688,566,96],'brushed',32);box(gFill,[34,8,8],[688,578,96],'satin');

/* exhaust: one chrome manifold for both cylinders -> catalyst collector under the engine -> riser on the left -> two silencers stacked vertically, raised */
const gEx=part('headers',{name:'Выпускной коллектор',desc:'Хромированные трубы от передней части головок уходят вниз и под двигатель. По каталогу BMW это одна деталь на оба цилиндра. Гайки фланцев на головках.',sys:'Выпуск',ex:[180,-120,0]});
mirrorZ(s=>{tube(gEx,[[862,392,s*258],[930,382,s*284],[990,330,s*262],[1000,250,s*205],[960,200,s*140],[860,196,s*70],[800,192,s*20]],22,'pipe',80);
  slab(gEx,rr(52,68,14),10,3,'steel',[868,392,s*254],'x');});
const gCol=part('collector',{name:'Сборник с катализатором',desc:'Под двигателем: сюда сходятся газы обоих цилиндров, внутри катализатор, сверху лямбда-зонд. Поэтому по глушителям нельзя понять, какой цилиндр не работает.',sys:'Выпуск',ex:[0,-200,0]});
lathe(gCol,[[0.1,-130],[22,-128],[34,-100],[36,-50],[36,70],[32,110],[18,130],[0.1,132]],'x',[690,192,0],'blast',48);
for(let i=0;i<3;i++)lathe(gCol,[[36.5,0],[38,2],[36.5,4]],'x',[640+i*60,192,0],'blast',48);

const gSil=part('silencers',{name:'Глушители (два)',desc:'Два глушителя слева один над другим, как на Scrambler. Оба питаются от общего сборника под двигателем. Перед ними заслонка выпуска с сервоприводом на тросике.',sys:'Выпуск',ex:[-120,160,-200]});
tube(gSil,[[440,232,-118],[392,240,-150],[340,262,-172],[300,310,-178],[280,420,-178],[268,470,-176]],30,'pipe',60);
lathe(gSil,[[0.1,-44],[24,-40],[36,-20],[40,0],[36,20],[26,40],[0.1,46]],'y',[266,486,-176],'pipe',40);

const silProf=[[34,0],[40,8],[50,60],[56,250],[57,282],[54,284],[57,288],[54,292],[57,296],[54,300],[52,312],[36,326],[28,330],[24,328],[23,296],[0.1,294]];
function shieldGeo(){const s=rr(150,70,16);for(let i=0;i<4;i++){const h=new THREE.Path();h.absarc(-45+i*30,-8,9-i*.8,0,Math.PI*2,true);s.holes.push(h);
  const h2=new THREE.Path();h2.moveTo(-58+i*30,16);h2.lineTo(-38+i*30,16);h2.lineTo(-38+i*30,26);h2.lineTo(-58+i*30,26);h2.closePath();s.holes.push(h2);}
  const g=new THREE.ExtrudeGeometry(s,{depth:3,bevelEnabled:true,bevelThickness:1.5,bevelSize:1.5,bevelSegments:2,curveSegments:16});g.translate(0,0,-3);return g;}
[[[200,500,-172],[-170,575,-172]],[[180,612,-166],[-166,690,-166]]].forEach(([A,B],i)=>{const z0=A[2];
  skin(latheAB(gSil,silProf,A,B,'ti',56),null,()=>['L',q=>PMAP.L(q.x,q.y)],{em:.55,r:.3,m:.5,env:.8});latheAB(gSil,[[0.1,296],[22.5,296],[22.5,297],[0.1,297]],A,B,'black',32);
  const d=new V3(...B).sub(new V3(...A)).normalize();
  latheAB(gSil,[[57.5,118],[59.5,120],[59.5,136],[57.5,138]],A,B,'black',48);
  tube(gSil,i?[[268,470,-176],[262,560,-172],[220,606,-168],[A[0]+4,A[1],z0]]:[[268,470,-176],[240,500,-174],[A[0]+4,A[1],z0]],26,'pipe',24);});
/* hanger: from the upper clamp to the left passenger-footrest bracket */
tube(gSil,[[150,668,-160],[200,610,-166],[262,540,-170]],7,'black',16);

/* Hepco & Becker engine guards, rear rack, cast alu rear-frame piece (as on this bike) */
const gCB=part('crashbars',{name:'Дуги Hepco & Becker',desc:'Защитные дуги двигателя, чёрные. Мешают доступу к крышкам клапанов снизу: для проверки зазоров удобнее снять нижнее крепление.',sys:'Кузов',ex:[120,0,0]});
mirrorZ(s=>{tube(gCB,[[985,600,s*140],[978,590,s*260],[962,540,s*370],[945,440,s*402],[905,330,s*404],[820,272,s*384],[720,262,s*330],[650,272,s*240],[612,300,s*112]],15,'frame',120);
  tube(gCB,[[956,512,s*388],[900,586,s*352],[790,604,s*318],[700,610,s*240],[650,630,s*160],[640,640,s*124]],13,'frame',80);
  cyl(gCB,16,20,'z',[612,300,s*104],'frame',16);slab(gCB,rr(40,40,12),12,3,'frame',[985,600,s*134]);});
const gLoom=part('loom',{name:'Основной жгут проводки',desc:'Жгут идёт по раме от блока под сиденьем к фаре и рулю. К нему подключены катушки зажигания, датчики и дроссели.',sys:'Электрика',ex:[0,200,0]});
mirrorZ(s=>tube(gLoom,[[220,756,s*55],[450,772,s*100],[600,680,s*126],[740,700,s*128],[900,760,s*104],[1060,850,s*50],[1180,880,s*20],[1270,890,0]],7,'black',90));
const gRack=part('rack',{name:'Багажник',desc:'Задний багажник на пассажирской раме.',sys:'Кузов',ex:[-200,260,0]});
mirrorZ(s=>{tube(gRack,[[-100,812,s*80],[-104,870,s*92],[-160,884,s*96],[-260,880,s*86],[-290,860,s*60]],9,'frame',40);rod(gRack,[-260,880,s*86],[-250,812,s*62],8,'frame');});
rod(gRack,[-290,860,-60],[-290,860,60],9,'frame');slab(gRack,rr(150,170,20),8,2,'frame',[-190,888,0],'y');



/* footrests (toothed steel with rubber), levers, side stand */
const gPeg=part('pegs',{name:'Подножки и рычаги',desc:'Зубчатые стальные подножки со съёмными резинками, ниже и дальше назад, чем у R nineT. Слева рычаг переключения, справа педаль тормоза. С выдвинутой боковой подножкой и включённой передачей двигатель не заведётся.',sys:'Управление',ex:[0,-80,0]});
mirrorZ(s=>{slab(gPeg,rr(56,30,6),110,3,'steel',[540,400,s*190]);for(let i=0;i<5;i++)box(gPeg,[4,8,104],[518+i*11,418,s*190],'steel');
  slab(gPeg,rr(110,60,20),12,3,'alu',[560,440,s*136],'z');});
tube(gPeg,[[560,420,-152],[620,412,-170],[700,402,-196]],6,'alu',16);cyl(gPeg,8,30,'z',[702,402,-200],'rubber',12);
tube(gPeg,[[560,420,152],[620,404,170],[690,396,196]],6,'alu',16);slab(gPeg,rr(30,12,4),36,2,'alu',[694,394,200]);
tube(gPeg,[[600,300,-130],[580,170,-190],[548,30,-260]],10,'black',24);
mirrorZ(s=>{rod(gPeg,[230,548,s*132],[230,548,s*196],12,'rubber');cyl(gPeg,14,10,'z',[230,548,s*134],'alu',16);});box(gPeg,[50,8,30],[548,24,-262],'black');
const gRR=part('resR',{name:'Бачок заднего тормоза',desc:'Справа, у подножки водителя. DOT 4, не ниже MIN при вертикальном мотоцикле.',sys:'Тормоза',ex:[0,120,170]});
lathe(gRR,[[0.1,0],[16,0],[17,4],[17,40],[18,44],[18,52],[0.1,52]],'y',[520,500,176],mat('lens'),24).material.transparent=true;
cyl(gRR,12,30,'y',[520,520,176],'oil',20);



/* =====================================================================
   FULL SYSTEMS: every unit the bike needs to run, placed where it sits,
   connected end to end (BMW K23 parts catalogue groups 11-65).
   ===================================================================== */
const SYS={air:'Воздух',fuel:'Топливо',elec:'Электрика и зажигание',oil:'Смазка и охлаждение',exh:'Выпуск',drive:'Трансмиссия',brake:'Тормоза и ABS',chassis:'Ходовая',ctrl:'Управление',body:'Кузов'};

/* ---------- AIR: snorkel -> duct under the tank -> airbox with filter -> ducts -> throttles -> heads ---------- */
const gDuct=part('intakeDuct',{name:'Воздуховод от заборника',desc:'Чёрный пластиковый канал под баком справа: ведёт воздух от круглого заборника спереди назад в корпус воздушного фильтра.',sys:SYS.air,ex:[60,240,120]});
tube(gDuct,[[1050,718,112],[980,722,110],[860,712,106],[740,690,100],[668,668,92]],34,'black',60,20);
const gAF=part('airfilter',{name:'Воздушный фильтр',desc:'Бумажный элемент внутри корпуса за двигателем. Чистит воздух до дросселей. Замена каждые 20 000 км, оригинал 13 71 7 706 414. Доступ сверху после снятия сиденья и крышки корпуса.',sys:SYS.air,layer:'internal',ex:[0,260,0]});
slab(gAF,rr(180,40,10),200,4,'brass',[560,630,0]);for(let i=0;i<14;i++)box(gAF,[3,42,198],[480+i*12,630,0],'gold');
const gIAT=part('iat',{name:'Датчик температуры воздуха',desc:'На корпусе фильтра. Блок управления по нему поправляет количество топлива: холодный воздух плотнее.',sys:SYS.elec,ex:[0,120,-80]});
cyl(gIAT,9,30,'z',[620,640,-126],'black',12);box(gIAT,[20,16,14],[620,640,-146],'black');
const gBr=part('breather',{name:'Сапун картера',desc:'Шланг вентиляции картера: газы, прорвавшиеся мимо колец, уходят в корпус фильтра и дожигаются в цилиндрах.',sys:SYS.oil,ex:[0,180,0]});
tube(gBr,[[850,622,0],[790,650,0],[720,654,0],[672,650,0]],12,'rubber',24);

/* ---------- FUEL: tank -> in-tank pump with filter -> pressure line -> distributor -> injectors; vapour -> canister -> purge ---------- */
const gFP=part('fuelPump',{name:'Топливный насос с фильтром',desc:'Стоит внутри бака на фланце снизу. Электронасос с сетчатым и тонким фильтром подаёт бензин под давлением к форсункам. Рядом поплавковый датчик уровня.',sys:SYS.fuel,ex:[0,-160,0]});
lathe(gFP,[[0.1,0],[38,0],[40,6],[40,10],[0.1,10]],'y',[820,730,0],'satin',36);
lathe(gFP,[[0.1,0],[24,0],[24,70],[20,76],[0.1,76]],'y',[820,738,0],'black',28);
box(gFP,[30,8,30],[820,742,40],'gold');rod(gFP,[830,770,30],[900,770,60],2.5,'steel');box(gFP,[30,14,20],[900,770,60],'black');
const gFL=part('fuelLine',{name:'Топливопровод и распределитель',desc:'Напорная трубка от насоса вниз к распределителю над коробкой, оттуда по шлангу к форсунке каждого цилиндра. Быстроразъёмы с защёлками.',sys:SYS.fuel,ex:[0,120,0]});
tube(gFL,[[820,730,0],[800,700,-30],[770,660,-40],[742,640,0]],5,'black',40);
box(gFL,[40,24,40],[742,630,0],'satin');
mirrorZ(s=>tube(gFL,[[742,630,s*20],[744,622,s*100],[748,606,s*190],[748,596,s*236]],4.5,'black',40));
const gCC=part('canister',{name:'Адсорбер паров бензина',desc:'Цилиндр с активированным углём позади коробки. Бак дышит через него: пары бензина не уходят в атмосферу, а на работающем двигателе высасываются во впуск через клапан продувки.',sys:SYS.fuel,ex:[-200,-60,0]});
lathe(gCC,[[0.1,0],[34,0],[36,4],[36,116],[34,120],[0.1,120]],'z',[404,500,-60],'black',32);
tube(gCC,[[404,536,-30],[400,600,-60],[470,690,-70],[530,705,-30]],3.5,'rubber',40);
tube(gCC,[[404,540,40],[440,560,160],[600,540,220],[700,532,252]],3.5,'rubber',40);
cyl(gCC,9,24,'y',[440,560,160],'black',12);
const gCap=part('fuelCap',{name:'Крышка бака',desc:'Замок крышки открывается ключом зажигания. Лить до нижней кромки горловины: перелив уходит в адсорбер и портит его.',sys:SYS.fuel,ex:[0,200,0]});
lathe(gCap,[[0.1,0],[38,0],[40,4],[38,10],[0.1,11]],'y',[895,960,0],'brushed',40);box(gCap,[20,6,30],[895,972,0],'satin');

/* ---------- ELECTRICS: battery -> fuses/relays -> ECU -> coils, injectors, pump; alternator -> regulator -> battery; starter circuit ---------- */
const gECU=part('ecu',{name:'Блок управления двигателем BMS-MP',desc:'Под сиденьем. Считает зажигание и впрыск по датчикам: коленвала, распредвала, дросселя, температуры, детонации и лямбда-зонду. Сюда подключается диагностика.',sys:SYS.elec,ex:[-60,300,0]});
slab(gECU,rr(150,34,10),118,4,'satin',[200,738,0]);box(gECU,[30,22,60],[122,738,0],'black');
const gReg=part('regulator',{name:'Регулятор напряжения',desc:'Оребрённый блок на раме: выпрямляет ток генератора и держит напряжение 14 В для зарядки аккумулятора. Если на приборе горит значок батареи, проверять его и ремень генератора.',sys:SYS.elec,ex:[100,60,-160]});
slab(gReg,rr(70,90,8),24,3,'black',[1080,700,-110],'z');for(let i=0;i<6;i++)box(gReg,[64,3,8],[1080,666+i*13,-124],'black');
tube(gReg,[[1080,650,-110],[1078,640,-80],[1072,646,-40]],4,'black',24);
const gAlt=part('alternator',{name:'Генератор 720 Вт',desc:'Спереди сверху на двигателе, крутится поликлиновым ремнём от коленвала. Даёт ток на всю электрику и зарядку аккумулятора.',sys:SYS.elec,layer:'drive',ex:[220,120,0]});
lathe(gAlt,[[0.1,0],[50,0],[54,8],[54,96],[48,104],[0.1,106]],'-x',[952,604,0],'black',40);
for(let i=0;i<10;i++)box(gAlt,[90,2,4],[900,604+Math.sin(i/10*Math.PI*2)*54,Math.cos(i/10*Math.PI*2)*54],'satin');
lathe(gAlt,[[0.1,0],[30,0],[30,14],[0.1,14]],'x',[952,604,0],'steel',24);
const gBeltI=part('belt',{name:'Ремень генератора',desc:'Поликлиновой ремень от шкива коленвала к генератору под передней крышкой. Замена раз в 6 лет или каждые 40 000 км. Порвался: генератор не крутится, аккумулятор садится.',sys:SYS.elec,layer:'internal',ex:[180,0,0]});
(function(){const pts=[];const c1=[462,0],c2=[604,0];for(let i=0;i<=40;i++){const a=Math.PI+i/40*Math.PI;pts.push([960,c1[0]+Math.sin(a)*44,Math.cos(a)*44]);}
  for(let i=0;i<=40;i++){const a=i/40*Math.PI;pts.push([960,c2[0]+Math.sin(a)*32,Math.cos(a)*32]);}
  const c=new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p)),true);add(gBeltI,new THREE.TubeGeometry(c,120,5,8,true),'rubber');})();
const gStarter=part('starter',{name:'Стартер 1,2 кВт',desc:'Слева под впускным патрубком. Крутит двигатель через венец маховика. Питание толстым кабелем от аккумулятора через реле стартера.',sys:SYS.elec,layer:'drive',ex:[0,-60,-200]});
lathe(gStarter,[[0.1,0],[36,0],[38,4],[38,124],[34,130],[0.1,132]],'-x',[662,380,-150],'black',36);
lathe(gStarter,[[0.1,0],[17,0],[18,3],[18,70],[0.1,72]],'-x',[640,426,-150],'black',24);
add(gStarter,new THREE.PlaneGeometry(22,60),'ceramic',[560,380,-189],[0,Math.PI,Math.PI/2]);
const gRel=part('relays',{name:'Предохранители и реле',desc:'Блок предохранителей и реле под сиденьем: реле стартера, реле топливного насоса, главный предохранитель. Сгорел предохранитель: менять на такой же номинал.',sys:SYS.elec,ex:[-40,240,80]});
box(gRel,[70,24,46],[200,705,70],'black');box(gRel,[30,30,30],[260,705,96],'black');box(gRel,[30,30,30],[260,705,-96],'black');
const gCab=part('powerCables',{name:'Силовые кабели',desc:'Плюс от аккумулятора через реле к стартеру, масса от аккумулятора на коробку. Окисленная клемма = стартер щёлкает и не крутит.',sys:SYS.elec,ex:[0,0,-140]});
tube(gCab,[[330,749,-26],[320,700,-60],[400,580,-100],[540,460,-140],[632,442,-170]],6,'black',60);
tube(gCab,[[330,749,26],[380,650,80],[470,520,104]],6,'black',40);
const gHorn=part('horn',{name:'Звуковой сигнал',desc:'Спереди под баком. Кнопка на левом блоке переключателей.',sys:SYS.elec,ex:[200,0,100]});
lathe(gHorn,[[0.1,0],[40,0],[42,6],[30,20],[0.1,22]],'x',[1170,800,70],'black',32);
const gDiag=part('diag',{name:'Разъём диагностики',desc:'Под сиденьем, под колпачком. Сюда подключают BMW ISTA или OBD-адаптер: чтение ошибок, сброс сервиса, адаптации.',sys:SYS.elec,ex:[-40,200,-60]});
box(gDiag,[30,20,24],[200,705,-60],'black');box(gDiag,[34,6,28],[200,717,-60],'red');
/* sensors */
const gSens=part('sensors',{name:'Датчики двигателя',desc:'Коленвала (обороты и положение), распредвала (такт), детонации на цилиндрах, температуры головки и масла, положения передачи. Блок управления без них не заведёт или включит аварийный режим.',sys:SYS.elec,layer:'drive',ex:[0,-80,0]});
cyl(gSens,10,30,'x',[930,350,-90],'black',12);
mirrorZ(s=>{cyl(gSens,12,14,'z',[800,560,s*170],'black',14);});
cyl(gSens,9,24,'z',[700,380,-334],'black',12);cyl(gSens,8,22,'y',[660,300,-100],'black',12);cyl(gSens,10,24,'z',[520,360,-108],'black',12);
mirrorZ(s=>tube(gSens,[[800,568,s*178],[760,600,s*160],[680,640,s*130],[620,700,s*126]],2.5,'black',24));
tube(gSens,[[930,350,-110],[880,320,-130],[700,300,-130],[610,300,-120]],2.5,'black',30);
const gLam=part('lambda',{name:'Лямбда-зонд',desc:'Вкручен в сборник выпуска до катализатора. Измеряет кислород в выхлопе: блок управления держит смесь точно. Сдох: расход вверх, на приборе ошибка двигателя.',sys:SYS.exh,ex:[0,-140,120]});
cyl(gLam,9,40,'y',[740,240,24],'steel',10);box(gLam,[18,14,18],[740,264,24],'black');
tube(gLam,[[740,270,24],[700,300,90],[620,320,110],[600,400,108]],2.5,'black',24);
/* exhaust flap servo */
const gFlap=part('flap',{name:'Заслонка выпуска с сервоприводом',desc:'Заслонка перед глушителями открывается сервоприводом по тросику: тише на малых оборотах, свободнее на высоких. Сервопривод под сиденьем.',sys:SYS.exh,ex:[-100,60,-160]});
lathe(gFlap,[[30,0],[33,0],[33,24],[30,24]],'y',[280,404,-178],'steel',32);
box(gFlap,[60,44,40],[300,730,-90],'black');tube(gFlap,[[290,710,-110],[280,620,-150],[280,500,-176],[280,430,-178]],2.5,'black',30);

/* ---------- OIL: sump -> pump -> filter -> galleries -> heads; cooler loop at the front ---------- */
const gPump=part('oilpump',{name:'Масляный насос',desc:'Внутри картера спереди, приводится от коленвала. Забирает масло из поддона и гонит через фильтр к подшипникам, головкам и через радиатор.',sys:SYS.oil,layer:'internal',ex:[0,-80,0]});
slab(gPump,rr(80,60,16),60,6,'alu',[900,320,0]);lathe(gPump,[[0.1,0],[24,0],[24,40],[0.1,40]],'y',[860,270,0],'brass',20);
const gOL=part('oilLines',{name:'Маслопроводы радиатора',desc:'Две трубки от картера спереди к масляному радиатору и обратно. Течь здесь = масло на переднем колесе. Проверять при каждом ТО.',sys:SYS.oil,ex:[160,0,-60]});
tube(gOL,[[1105,450,-40],[1090,420,-60],[1060,400,-90]],7,'black',30);
tube(gOL,[[1105,450,-100],[1085,400,-110],[1060,370,-110]],7,'black',30);
/* engine internals for the engine tab */
const gClutch=part('clutch',{name:'Сухое сцепление',desc:'Однодисковое сухое сцепление между двигателем и коробкой, с гидроприводом от рычага. Диск, нажимной диск и пружина на маховике.',sys:SYS.drive,layer:'internal',ex:[-80,0,0]});
lathe(gClutch,[[40,0],[110,0],[110,12],[40,12]],'x',[650,430,0],'steel',48);lathe(gClutch,[[30,0],[96,0],[96,8],[30,8]],'x',[636,430,0],'gold',48);lathe(gClutch,[[30,0],[104,0],[104,8],[30,8]],'x',[626,430,0],'steel',48);
const gBal=part('balancer',{name:'Балансирный вал',desc:'Вал с противовесом под коленвалом гасит вибрации оппозита. Крутится от коленвала.',sys:SYS.drive,layer:'internal',ex:[0,-60,0]});
cyl(gBal,12,240,'x',[790,340,0],'steel',16);box(gBal,[50,36,30],[790,322,0],'steel');
const gChain=part('camchains',{name:'Цепи привода ГРМ',desc:'Привод ГРМ по каталогу деталей BMW для этого мотора: спереди короткая цепь от коленвала на промежуточный вал под ним. От промежуточного вала к каждой головке своя втулочная цепь: правая сзади, левая спереди. Цепь крутит звёздочку на нижнем распредвале, а он через шестерню крутит верхний. Распредвалы вращаются в два раза медленнее коленвала. На каждой цепи гидравлический натяжитель и направляющая шина: подтягивать вручную ничего не надо.',sys:SYS.drive,layer:'internal',ex:[0,0,0]});
/* timing drive (BMW parts lists for this engine): a single chain from the crankshaft to the intermediate shaft under it (front),
   then one sleeve chain per cylinder from the intermediate shaft up to the sprocket on the lower camshaft:
   right cylinder chain at the rear, left cylinder chain at the front. Each chain has a hydraulic tensioner rail and a guide rail. */
const CHAINS=[];const IY=292;
{const g=new THREE.Group();g.name='ishaft';g.position.set(0,IY,0);gChain.add(g);add(g,new THREE.CylinderGeometry(9,9,360,14).rotateZ(Math.PI/2),'steel',[800,0,0]);
 [[970,20],[656,20],[938,20]].forEach(([x,r])=>{const q=gearGeo0(r-2,16);q.rotateZ(Math.PI/2);add(g,q,'satin',[x,0,0]);});
 cyl(gChain,9,60,'x',[950,430,0],'steel',14);
 window.__ishaft=g;}
[[0,970,{y:430,z:0,r:20},{y:IY,z:0,r:20},true],[1,656,{y:IY,z:0,r:20},{y:359,z:233,r:40}],[-1,938,{y:IY,z:0,r:20},{y:359,z:-231,r:40}]].forEach(([s,x,A,B,prim])=>{
  const pts=[];for(let i=0;i<90;i++){const a=i/90*Math.PI*2;pts.push([A.y+Math.cos(a)*A.r,A.z+Math.sin(a)*A.r]);pts.push([B.y+Math.cos(a)*B.r,B.z+Math.sin(a)*B.r]);}
  pts.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  pts.forEach(p=>{while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);});
  pts.slice().reverse().forEach(p=>{while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);});
  const curve=new THREE.CatmullRomCurve3(lo.slice(0,-1).concat(up.slice(0,-1)).map(q=>new V3(x,q[0],q[1])),true,'centripetal');
  const len=curve.getLength(),pitch=8,n=Math.floor(len/pitch);
  const lk=new THREE.InstancedMesh(new THREE.BoxGeometry(4,4,7.6),mat('steel'),n);lk.userData.part='camchains';gChain.add(lk);pickables.push(lk);
  const pn=new THREE.InstancedMesh(new THREE.CylinderGeometry(1.6,1.6,10,6).rotateZ(Math.PI/2),mat('satin'),n);pn.userData.part='camchains';gChain.add(pn);
  let lowS=null;if(prim){lowS=new THREE.Group();lowS.position.set(x,A.y,A.z);gChain.add(lowS);const g=gearGeo0(A.r-2,16);g.rotateZ(Math.PI/2);add(lowS,g,'satin');}
  if(!prim){const mid=(A.z+B.z)/2,len2=Math.abs(B.z-A.z)*.58;
    const ang1=Math.atan2((B.y+B.r)-(A.y+A.r),B.z-A.z),ang2=Math.atan2((B.y-B.r)-(A.y-A.r),B.z-A.z);
    const r1=box(gChain,[12,7,len2],[x,(A.y+A.r+B.y+B.r)/2+7,mid],'black');r1.rotation.x=-ang1;
    const r2=box(gChain,[12,7,len2],[x,(A.y-A.r+B.y-B.r)/2-7,mid],'black');r2.rotation.x=-ang2;
    cyl(gChain,7,30,'y',[x,(A.y+A.r+B.y+B.r)/2+24,mid],'satin',12);}
  CHAINS.push({curve,len,n,lk,pn,lowS,pitch});});
const _co=new THREE.Object3D();
function updateChains(th){CHAINS.forEach(c=>{const off=((-th*Math.PI/180*20)%c.len+c.len)%c.len;
  for(let i=0;i<c.n;i++){const t=((i*c.pitch+off)%c.len)/c.len,p=c.curve.getPointAt(t),tg=c.curve.getTangentAt(t);
    _co.position.copy(p);_co.quaternion.setFromUnitVectors(new V3(0,0,1),tg);_co.updateMatrix();c.lk.setMatrixAt(i,_co.matrix);c.pn.setMatrixAt(i,_co.matrix);}
  c.lk.instanceMatrix.needsUpdate=true;c.pn.instanceMatrix.needsUpdate=true;if(c.lowS)c.lowS.rotation.x=-th*Math.PI/180;});
  if(window.__ishaft)window.__ishaft.rotation.x=-th*Math.PI/180;}
updateChains(0);
/* drive-side controls: clutch slave, shift linkage */
part('clutchMaster',{name:'Главный цилиндр сцепления с бачком',desc:'BMW 32_2499: на левой рукоятке, бачок встроен в корпус главного цилиндра, крышка на трёх винтах M4x20, в рычаге микровыключатели (сцепление выжато, можно заводить). От него магистраль идёт к рабочему цилиндру сзади на коробке. Уровень смотри в окошке при ровном руле.',sys:SYS.drive,ex:[150,320,-160]});
const gSlave=part('clutchSlave',{name:'Рабочий цилиндр сцепления',desc:'Сзади на коробке слева. Гидравлика от рычага давит шток, тот выжимает сухое сцепление. Тормозная жидкость DOT 4 в бачке на левой рукоятке.',sys:SYS.drive,ex:[-120,0,-80]});
lathe(gSlave,[[0.1,0],[20,0],[22,4],[22,50],[0.1,52]],'-x',[516,520,-92],'satin',24);
const gShift=part('shiftLink',{name:'Тяга переключения передач',desc:'От рычага на левой подножке к валу переключения коробки. Люфт или задевание: регулировать длину тяги.',sys:SYS.ctrl,ex:[0,-40,-120]});
rod(gShift,[700,402,-196],[620,360,-150],5,'alu');cyl(gShift,10,30,'z',[620,360,-140],'satin',12);rod(gShift,[620,360,-128],[600,380,-108],8,'satin');

/* ---------- BRAKES + ABS: lever -> master -> ABS modulator -> calipers; pedal -> rear master -> ABS -> rear caliper ---------- */
const gABS=part('abs',{name:'Модулятор ABS',desc:'Гидроблок с клапанами и насосом справа, за коробкой передач, под рамой сиденья над маятником. Сравнивает скорости колёс и при блокировке за доли секунды сбрасывает давление в суппорте. Все тормозные трубки идут через него.',sys:SYS.brake,ex:[0,200,180]});
slab(gABS,rr(100,80,14),70,6,'satin',[395,640,140]);lathe(gABS,[[0.1,0],[26,0],[26,40],[0.1,42]],'z',[430,630,176],'black',24);
const gBL=part('brakeLines',{name:'Тормозные магистрали',desc:'Стальные армированные шланги и трубки: от главных цилиндров в модулятор ABS и от него к суппортам. Жидкость DOT 4, замена раз в 2 года.',sys:SYS.brake,ex:[0,0,140]});
tube(gBL,[[1042,1048,186],[1090,990,140],[1130,890,105],[1110,760,125],[800,690,150],[440,660,150]],4,'black',80);
{const p2=fpt(560);tube(gBL,[[400,672,120],[700,720,110],[1000,780,90],[1180,820,50],[p2.x+20,p2.y,0]],4,'black',80);
 mirrorZ(k=>tube(gBL,[[p2.x+20,p2.y,0],[p2.x+10,p2.y-60,k*90],[1460,470,k*106],[1430,420,k*84]],4,'black',40));}
tube(gBL,[[450,480,176],[480,560,170],[420,622,150]],4,'black',30);
tube(gBL,[[380,612,130],[300,500,120],[150,380,100],[-60,250,70]],4,'black',60);
const gRM=part('rearMaster',{name:'Задний главный цилиндр и педаль',desc:'Педаль справа давит на главный цилиндр, рядом бачок. Отсюда жидкость идёт в модулятор ABS и дальше к заднему суппорту. На педали датчик стоп-сигнала.',sys:SYS.brake,ex:[0,-60,140]});
lathe(gRM,[[0.1,0],[14,0],[14,60],[0.1,62]],'y',[540,420,176],'satin',20);rod(gRM,[540,420,176],[600,380,186],5,'alu');
const gWS=part('wheelSensors',{name:'Датчики скорости колёс',desc:'Спереди на левом пере у ступицы, сзади на редукторе. Читают зубчатые кольца. Без них не работают ABS и ASC, на приборе загорается значок ABS.',sys:SYS.brake,ex:[0,0,0]});
cyl(gWS,8,30,'z',[1505,330,-112],'black',12);cyl(gWS,8,30,'z',[40,270,150],'black',12);
tube(gWS,[[1505,330,-122],[1480,420,-118],[fpt(560).x+10,fpt(560).y,-100]],2.5,'black',24);
tube(gWS,[[40,270,160],[150,320,140],[350,380,130],[400,600,140]],2.5,'black',40);

/* ---------- small chassis/control items ---------- */
const gSS=part('standSwitch',{name:'Боковая подножка с датчиком',desc:'Датчик сообщает блоку, что подножка откинута: с откинутой подножкой и включённой передачей двигатель заглохнет. Не заводится на передаче: проверить его.',sys:SYS.ctrl,ex:[0,-100,-120]});
cyl(gSS,14,30,'z',[600,300,-140],'black',12);box(gSS,[20,14,20],[620,316,-150],'black');
const gGauge=part('instrument',{name:'Спидометр',desc:'Круглый аналоговый спидометр в металлическом корпусе на кронштейне над верхней траверсой, слева от центра. Шкала до 220 км/ч, внизу ЖК-строка: пробег, суточный, время, температура двигателя, напряжение. Над ней лампы: нейтраль, ABS, ASC, двигатель, дальний свет. Кнопка MENU на левой рукоятке листает экраны.',sys:SYS.elec,ex:[100,240,0]});
(function(){
  /* dial face: black, white km/h scale 0-220, red zone marks, warning lights, LCD strip, needle */
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d'),C=256;
  x.fillStyle='#0d0e10';x.beginPath();x.arc(C,C,256,0,7);x.fill();
  x.strokeStyle='#2a2c30';x.lineWidth=6;x.beginPath();x.arc(C,C,246,0,7);x.stroke();
  const a0=Math.PI*0.75,a1=Math.PI*2.25,ang=v=>a0+(a1-a0)*v/220;
  for(let v=0;v<=220;v+=5){const a=ang(v),big=v%20===0,mid=v%10===0;const r1=232,r2=big?200:(mid?212:220);
    x.strokeStyle='#f2f2ee';x.lineWidth=big?5:(mid?3:2);x.beginPath();x.moveTo(C+Math.cos(a)*r1,C+Math.sin(a)*r1);x.lineTo(C+Math.cos(a)*r2,C+Math.sin(a)*r2);x.stroke();
    if(big){x.fillStyle='#f2f2ee';x.font='600 34px "Golos Text",Arial,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(v),C+Math.cos(a)*166,C+Math.sin(a)*166);}}
  x.fillStyle='#9aa0a6';x.font='500 24px "Golos Text",Arial,sans-serif';x.textAlign='center';x.fillText('km/h',C,C-70);
  x.fillStyle='#c9cdd1';x.font='600 22px "Golos Text",Arial,sans-serif';x.fillText('BMW Motorrad',C,C+138);
  /* LCD strip */
  x.fillStyle='#1b2a24';x.fillRect(C-112,C+28,224,72);x.strokeStyle='#3b4a44';x.lineWidth=3;x.strokeRect(C-112,C+28,224,72);
  x.fillStyle='#b6d9c7';x.font='600 34px "JetBrains Mono",monospace';x.textAlign='right';x.fillText('28600',C+92,C+64);x.font='500 20px "JetBrains Mono",monospace';x.textAlign='left';x.fillText('ODO km',C-100,C+90);x.textAlign='right';x.fillText('12:00',C+100,C+90);
  /* warning lights in a row */
  [['#2fbf4a',-90],['#f2b705',-45],['#e8402f',0],['#f2b705',45],['#2f7de8',90]].forEach(([col,dx])=>{x.fillStyle=col;x.globalAlpha=.55;x.beginPath();x.arc(C+dx,C-24,11,0,7);x.fill();x.globalAlpha=1;});
  {const a=ang(0);x.strokeStyle='#e8402f';x.lineWidth=7;x.lineCap='round';x.beginPath();x.moveTo(C-Math.cos(a)*30,C-Math.sin(a)*30);x.lineTo(C+Math.cos(a)*205,C+Math.sin(a)*205);x.stroke();}
  const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
  const G=new THREE.Group();G.position.set(1212,1058,0);G.rotation.z=.62;gGauge.add(G);
  /* housing: closed metal cup in tank colour, chrome bezel, glass, face, needle */
  const cup=lathe(G,[[0.1,-44],[30,-43],[46,-34],[54,-18],[56,0],[55,6]],'y',[0,0,0],'paint',56);
  lathe(G,[[50,4],[57,5],[59,10],[56,14],[50,13]],'y',[0,0,0],'chrome',64);
  const face=add(G,new THREE.CircleGeometry(50,64),new THREE.MeshStandardMaterial({map:tex,roughness:.6,metalness:0}),[0,6,0],[-Math.PI/2,0,0]);
  face.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new V3(0,1,0),-Math.PI/2));
  const glass=add(G,new THREE.CircleGeometry(51,64),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.02,metalness:0,transparent:true,opacity:.12,envMapIntensity:1.6}),[0,12,0],[-Math.PI/2,0,0]);glass.userData.baseOpacity=.12;
  cyl(G,5,4,'y',[0,8,0],'black',20);
  /* bracket from the top clamp to the cup */
  G.updateMatrixWorld();
  {const b=fpt(777).addScaledVector(FP_,30).setZ(0);rod(gGauge,b.toArray(),[1214,1022,0],7,'brushed');cyl(gGauge,12,10,'y',b.toArray(),'brushed',16);}
  /* loom to the instrument */
  tube(gGauge,[[1212,1010,0],[1222,990,-40],[1250,940,-10],[1270,900,0]],3,'black',24);
})();

/* ---------- workshop tools and dirt for the spark-plug job (right cylinder) ---------- */
function toolPart(id,name,desc){const g=part(id,{name,desc,sys:'Инструмент',layer:'tool',ex:[0,0,620]});const rg=new THREE.Group();rg.name=id;rg.position.set(770,430,0);g.add(rg);return rg;}
function socket(rg){lathe(rg,[[8.6,0],[10.6,0],[10.9,58],[9.6,64],[6.2,68],[6.2,72]],'z',[0,0,238],'tool',32);
  lathe(rg,[[7.2,0],[7.2,12]],'z',[0,0,262],'grip',20);
  lathe(rg,[[6.2,0],[6.4,4],[6.4,140],[8,146],[8,156],[6,160]],'z',[0,0,308],'tool',20);}
function label(txt){const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');
  x.fillStyle='#F2B705';x.beginPath();x.roundRect?x.roundRect(4,4,248,72,14):x.rect(4,4,248,72);x.fill();x.fillStyle='#15181B';x.font='600 44px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,128,42);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthTest:false}));sp.scale.set(96,30,1);sp.renderOrder=10;return sp;}
const TOOL={};
TOOL.socket=toolPart('toolSocketR','Свечная головка 14 мм с удлинителем и трещоткой','Тонкостенная головка 14 мм с резинкой внутри, удлинитель 3/8", трещотка 3/8". Выкручивать против часовой.');
socket(TOOL.socket);lathe(TOOL.socket,[[0.1,0],[20,0],[22,4],[22,20],[20,24],[0.1,24]],'z',[0,0,462],'tool',28);
box(TOOL.socket,[230,24,14],[124,0,474],'tool');box(TOOL.socket,[100,30,20],[200,0,474],'grip');
TOOL.ext=toolPart('toolExtR','Головка с удлинителем, без трещотки','Наживляй свечу пальцами за удлинитель, без трещотки: так сразу почувствуешь перекос.');
socket(TOOL.ext);lathe(TOOL.ext,[[0.1,0],[14,0],[15,3],[15,36],[0.1,38]],'z',[0,0,466],'grip',24);
TOOL.torque=toolPart('toolTorqueR','Динамометрический ключ','Ключ 1/4" с диапазоном 2-25 Нм. Выставь 12 Нм, тяни плавно за рукоятку до щелчка.');
socket(TOOL.torque);lathe(TOOL.torque,[[0.1,0],[19,0],[20,4],[20,20],[0.1,24]],'z',[0,0,462],'tool',28);
cyl(TOOL.torque,12,300,'x',[170,0,474],'tool',20);cyl(TOOL.torque,15,110,'x',[290,0,474],'gripr',20);cyl(TOOL.torque,13,24,'x',[220,0,474],'grip',20);
const tql=label('12 Нм');tql.position.set(240,60,474);TOOL.torque.add(tql);
TOOL.air=toolPart('toolAirR','Сжатый воздух','Продувочный пистолет компрессора или баллончик со сжатым воздухом. Сопло к краю колодца, очки на глаза.');
lathe(TOOL.air,[[2.5,0],[3.5,0],[3.5,90],[6,100],[6,120]],'z',[0,0,372],'tool',14);
box(TOOL.air,[60,40,40],[10,0,512],'grip');box(TOOL.air,[30,110,30],[24,-70,512],'grip');
const airM=new THREE.MeshBasicMaterial({color:0xbfe6ff,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false});
lathe(TOOL.air,[[13,0],[2,128]],'z',[0,0,244],airM,24);
TOOL.feel=toolPart('toolFeelerR','Набор плоских щупов','Лезвие нужной толщины заводишь в щель между круглой частью кулачка и толкателем, сбоку, плоско. Щуп нижнего допуска должен проходить, щуп верхнего допуска уже не должен.');
const blM=new THREE.MeshStandardMaterial({color:0xf2b705,roughness:.3,metalness:.6});box(TOOL.feel,[80,12,1.6],[30,0,291.5],blM);box(TOOL.feel,[50,16,8],[94,0,293],'grip');
for(let i=1;i<6;i++){const b=box(TOOL.feel,[60,12,0.8],[46+i*3,0,293+i*1.8],'tool');b.rotation.y=-i*.1;}
const feelLbl=[label('0,10-0,17'),label('0,34-0,41')];feelLbl.forEach(l=>{l.scale.set(48,15,1);l.position.set(60,22,310);TOOL.feel.add(l);});
TOOL.gauge=toolPart('toolGaugeR','Плоский щуп 0,8 мм','Лезвие щупа 0,8 мм должно проходить между центральным и каждым боковым электродом с лёгким касанием.');
box(TOOL.gauge,[70,0.8,9],[34,2.1,209],'tool');box(TOOL.gauge,[70,6,14],[100,2.1,209],'grip');
for(let i=1;i<6;i++){const b=box(TOOL.gauge,[70,0.6,9],[100+Math.cos(i*.22)*0,2.1+i*1.2,209],'tool');b.rotation.z=-i*.12;b.position.x=34+70*(1-Math.cos(i*.12))*0+ (1-Math.cos(i*.12))*30;}
(function(){const g=part('dirtR',{name:'Песок и грязь в колодце',desc:'То, что за сезон насыпается в колодец свечи. Если не продуть до выкручивания свечи, всё упадёт в цилиндр.',sys:'Зажигание',layer:'fx',ex:[0,0,420]});
  const geo=new THREE.IcosahedronGeometry(1,0),o=new THREE.Object3D(),mm=[];let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647;};
  for(let i=0;i<70;i++){const a=rnd()*Math.PI*2,onFloor=i<46,r=onFloor?9.5+rnd()*5:14+rnd()*0.6,z=onFloor?239.5+rnd()*2.5:244+rnd()*70;
    o.position.set(770+Math.cos(a)*r,430+Math.sin(a)*r,z);o.rotation.set(rnd()*3,rnd()*3,rnd()*3);const sc=1.6+rnd()*2.2;o.scale.set(sc,sc*.8,sc);o.updateMatrix();mm.push(o.matrix.clone());}
  inst(g,geo,'dirt',mm);})();

/* store home transforms */
const ENG=[120,40,0];
const OFFS={light:[-30,-12,0],pegs:[-90,0,0],rearMaster:[-90,0,0],shiftLink:[-90,0,0],standSwitch:[-90,0,0],resR:[-140,70,-10],cooler:[15,-100,0],starter:[80,20,0],resF:[-140,14,0]};
['crankcase','beltcover','cylL','cylR','headL','headR','wellL','wellR','coverL','coverR','coilL','coilR','connL','connR','plugL','plugR','camsL','camsR','pistonL','pistonR','crank','throttle','oilfilter','drainplug','sightglass','filler','headers','collector','lambda','alternator','belt','oilpump','balancer','camchains','sensors','crashbars','toolSocketR','toolExtR','toolTorqueR','toolAirR','toolGaugeR','toolFeelerR','dirtR'].forEach(id=>OFFS[id]=ENG);
/* align each cylinder to the scanned engine: left cylinder sits 54 mm ahead of the right one */
const SIDE={R:[0,-16,-36],L:[54,-16,38]};
['cyl','head','well','cover','coil','conn','plug','cams','piston'].forEach(b=>['L','R'].forEach(s=>{OFFS[b+s]=ENG.map((v,i)=>v+SIDE[s][i]);}));
['toolSocketR','toolExtR','toolTorqueR','toolAirR','toolGaugeR','toolFeelerR','dirtR'].forEach(id=>OFFS[id]=ENG.map((v,i)=>v+SIDE.R[i]));
OFFS.wheelF=[-35,0,0];
['coil','conn'].forEach(b=>{OFFS[b+'R'][2]-=40;OFFS[b+'L'][2]+=40;});
OFFS.camsR[2]-=40;OFFS.camsL[2]+=40;OFFS.toolFeelerR=OFFS.toolFeelerR.slice();OFFS.toolFeelerR[2]-=40;
OFFS.drainplug=ENG.map((v,i)=>v+[0,-72,0][i]);
/* ===================== ENGINE INTERNALS v2 =====================
   Built from BMW parts diagrams for K23 (11_3669 crankshaft, 11_2806 conrod, 11_4202 piston, 11_4277 primary chain,
   11_4216 oil pump / intermediate shaft, 11_4267 cam chains, 11_6541 camshaft, 11_4294 rockers/valves) and fitted to the
   scanned engine (cylinder axes from the scanned valve covers). World coordinates, mm.
   Kinematic chain: crankshaft (Z24) -> primary chain -> intermediate shaft (Z48, half speed, drives oil pump)
   -> two cam chains (Z22/Z22) -> lower camshaft of each head -> spur gears 1:1 -> upper camshaft.
   Each camshaft: one intake + one exhaust lobe; lobe -> finger rocker (own shaft) -> semi-sphere shim -> valve. */
const E2=(function(){
const AX={R:{x:891,s:1},L:{x:943,s:-1}}, CY=454, STROKE=73, CR_R=STROKE/2, ROD=125, CH=30;
const PITCH=8, VL=10.8, Z_VFACE=193.5, Z_TIP=267.5, Z_PIV=277, RB=14, CAM_Z=295.85, CAM_DY=29, PIV_DY=56, TIP_DY=20;
const VALVES=[['in',-24,19.5],['ex',25,16.5]]; // kind, dx from bore axis at the valve seat, head radius
const VT=8*Math.PI/180, TX=(dx)=>dx+Math.sign(dx)*(Z_TIP-Z_VFACE)*Math.sin(VT); // valves lean apart like a pent roof: tip x offset
const PK={in:460,ex:270}, WIN=220; // crank degrees: lift peak and duration
const CHLOW=34, IY=350, X_PRIM=1035, chX=s=>s>0?961:1013;
const REBUILT=['crank','pistonR','pistonL','camsR','camsL','camchains','oilpump','balancer'];
const NEW=[];

/* ---- helpers ---- */
// 2D outline given in (y,z) coordinates, extruded along X, centred on x=0
function prismYZ(pts,holes,t){const sh=new THREE.Shape(pts.map(([y,z])=>new THREE.Vector2(-z,y)));
  (holes||[]).forEach(h=>{const p=new THREE.Path(h.map(([y,z])=>new THREE.Vector2(-z,y)));sh.holes.push(p);});
  const g=new THREE.ExtrudeGeometry(sh,{depth:t,bevelEnabled:true,bevelThickness:.6,bevelSize:.6,bevelSegments:1,curveSegments:24});
  g.translate(0,0,-t/2);g.rotateY(Math.PI/2);g.computeVertexNormals();return g;}
const circ=(cy,cz,r,n,rev)=>{const a=[];n=n||40;for(let i=0;i<n;i++){const t=(rev?-1:1)*i/n*Math.PI*2;a.push([cy+r*Math.cos(t),cz+r*Math.sin(t)]);}return a;};
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  pts.forEach(p=>{while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);});
  pts.slice().reverse().forEach(p=>{while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);});return lo.slice(0,-1).concat(up.slice(0,-1));}
// sprocket: Z teeth on pitch radius for an 8 mm chain; optional spokes
function sprocketGeo(Z,t,spokes){const rp=Z*PITCH/(2*Math.PI),pts=[];const N=Z*12;
  for(let i=0;i<N;i++){const th=i/N*Math.PI*2,r=rp+0.4-3.2*Math.cos(Z*th);pts.push([r*Math.cos(th),r*Math.sin(th)]);}
  const holes=[];if(spokes){const ri=rp*0.32,ro=rp-9;for(let k=0;k<spokes;k++){const a0=k/spokes*Math.PI*2+0.32,a1=(k+1)/spokes*Math.PI*2-0.32,h=[];
      for(let i=0;i<=10;i++){const a=a0+(a1-a0)*i/10;h.push([ro*Math.cos(a),ro*Math.sin(a)]);}for(let i=10;i>=0;i--){const a=a0+(a1-a0)*i/10;h.push([ri*Math.cos(a),ri*Math.sin(a)]);}holes.push(h.reverse());}}
  holes.push(circ(0,0,spokes?rp*.14:Math.min(9,rp*.3),24,true));
  return {g:prismYZ(pts,holes,t),rp};}
function gearGeo2(rp,Z,t){return invGear(Z,2*rp/Z,t,{bore:rp*.35});}   /* involute spur gear, see invGear */
function reg(g,id,o){o.traverse(m=>{if(m.isMesh){m.userData.part=id;pickables.push(m);}});g.add(o);return o;}
function M(k,geo,pos){const m=new THREE.Mesh(geo,mat(k,true));if(pos)m.position.set(...pos);return m;}

/* ---- clear the old hand-built internals ---- */
REBUILT.forEach(id=>{const p=P[id];if(!p)return;delete OFFS[id];
  for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.part===id)pickables.splice(i,1);
  while(p.g.children.length)p.g.remove(p.g.children[0]);p.g.position.set(0,0,0);});
/* plug and spark-plug tools sit 28 mm further out: plug tip now in the combustion chamber, not inside the bore */
['plugR','toolSocketR','toolExtR','toolTorqueR','toolAirR','toolGaugeR','dirtR'].forEach(id=>{if(OFFS[id]){OFFS[id]=OFFS[id].slice();OFFS[id][2]+=28;}});
if(OFFS.plugL){OFFS.plugL=OFFS.plugL.slice();OFFS.plugL[2]-=28;}

/* ================= crankshaft ================= */
const gC=P.crank.g,crank=new THREE.Group();crank.position.set(0,CY,0);gC.add(crank);
P.crank.desc='Коленвал (BMW 11 21 7 702 660): два шатунных шейки развёрнуты на 180°, между ними центральная щека, по краям щёки с противовесами. Сзади фланец на маховик и сухое сцепление, спереди конус со звёздочкой цепи Z24 и шкивом ремня генератора. Ход 73 мм.';
{const R=AX.R.x,L=AX.L.x,PW=26;const sh=(x0,x1,r,k)=>{const m=M(k||'steel',new THREE.CylinderGeometry(r,r,x1-x0,32).rotateZ(Math.PI/2),[(x0+x1)/2,0,0]);crank.add(m);return m;};
  sh(662,830,24,'satin');sh(652,664,62,'satin');                      // rear end + flange to clutch housing
  sh(830,862,28);                                                      // rear main journal
  const webCW=(x0,x1,pz)=>{const pts=hull(circ(0,0,34,48).concat(circ(0,pz,27,32)).concat(circ(0,0,70,64).filter(([y,z])=>z*Math.sign(pz)<-10)));
    const m=new THREE.Mesh(prismYZ(pts,null,x1-x0),mat('steel',true));m.position.x=(x0+x1)/2;crank.add(m);};
  webCW(862,R-PW/2,CR_R);                                              // rear web, counterweight opposite right pin
  {const pts=hull(circ(0,CR_R,27,32).concat(circ(0,-CR_R,27,32)));const m=new THREE.Mesh(prismYZ(pts,null,(L-PW/2)-(R+PW/2)),mat('steel',true));m.position.x=(R+L)/2;crank.add(m);}
  webCW(L+PW/2,L+PW/2+16,-CR_R);                                       // front web, counterweight opposite left pin
  [[R,CR_R],[L,-CR_R]].forEach(([x,z])=>{const m=M('chrome',new THREE.CylinderGeometry(23,23,PW,32).rotateZ(Math.PI/2),[x,0,z]);crank.add(m);});
  sh(L+PW/2+16,1010,28);                                               // front main journal
  sh(1010,1104,19,'satin');                                            // tapered nose, alternator pulley on its front end
  const sp=sprocketGeo(24,8);crank.add(M('steel',sp.g,[X_PRIM,0,0]));crank.userData.rp=sp.rp;
}
reg(gC,'crank',crank);

/* ================= pistons + conrods ================= */
const rodShape=(()=>{const pts=[];const B=34,S=17;
  for(let i=0;i<=32;i++){const t=Math.PI*0.70+i/32*Math.PI*0.60;pts.push([B*Math.cos(t),B*Math.sin(t)]);}  // cap arc around y<0
  pts.push([14,-28]);pts.push([ROD-22,-9]);
  for(let i=0;i<=24;i++){const t=-Math.PI*0.55+i/24*Math.PI*1.10;pts.push([ROD+S*Math.cos(t),S*Math.sin(t)]);}
  pts.push([ROD-22,9]);pts.push([14,28]);
  return pts.map(([a,c])=>[a,c]);})();
const pistons={};
['R','L'].forEach(k=>{const {x,s}=AX[k];const id='piston'+k,g=P[id].g;
  P[id].desc='Поршень 101 мм (BMW 11 25), три кольца: два компрессионных и маслосъёмное. На днище четыре выборки под клапаны. Палец вдоль мотоцикла, стопорится кольцами. Шатун 125 мм между осями, нижняя головка разъёмная на двух болтах с вкладышем.';
  const pg=new THREE.Group();g.add(pg);
  const prof=[[0.1,CH],[44,CH],[48,CH-1],[50.5,CH-3],[50.5,12],[49.5,11],[49.5,8],[0.1,8]].map(p=>new THREE.Vector2(p[0],p[1]));
  const crown=new THREE.LatheGeometry(prof,48);crown.rotateX(Math.PI/2);if(s<0)crown.scale(1,1,-1);pg.add(M('alu',crown));
  [CH-6,CH-10.5,CH-15].forEach((h,i)=>{const r=new THREE.TorusGeometry(50.4,i<2?0.9:1.2,6,48);pg.add(M(i<2?'steel':'satin',r,[0,0,s*h]));});
  [[0,Math.PI*0.55],[Math.PI,Math.PI*0.55]].forEach(([a0,len])=>{const sk=new THREE.LatheGeometry([[50.2,-22],[50.5,10],[48.5,10],[48.2,-22]].map(p=>new THREE.Vector2(p[0],p[1])),20,a0-len/2,len);sk.rotateX(Math.PI/2);if(s<0)sk.scale(1,1,-1);pg.add(M('alu',sk));});
  [-1,1].forEach(q=>pg.add(M('alu',new THREE.BoxGeometry(14,30,26),[q*20,0,s*4])));                          // pin bosses
  pg.add(M('steel',new THREE.CylinderGeometry(11,11,62,20).rotateZ(Math.PI/2)));                               // wrist pin
  [-31,31].forEach(q=>pg.add(M('black',new THREE.TorusGeometry(9,1,6,20).rotateY(Math.PI/2),[q,0,0])));       // circlips
  VALVES.forEach(([kind,dx,rv])=>[1,-1].forEach(u=>pg.add(M('case',new THREE.CylinderGeometry(rv+1,rv+1,.8,28).rotateX(Math.PI/2),[dx,u*22,s*(CH+.2)]))));
  const rod=new THREE.Group();g.add(rod);
  rod.add(M('satin',prismYZ(rodShape,[circ(0,0,23.5,40,true),circ(ROD,0,11.5,28,true)],22)));
  [-26,26].forEach(c=>{rod.add(M('steel',new THREE.CylinderGeometry(5.5,5.5,12,6),[0,-30,c]));});         // big-end bolts (heads on the cap)
  rod.add(M('brass',new THREE.CylinderGeometry(23.5,23.5,20,32,1,true).rotateZ(Math.PI/2)));                   // bearing shell
  const spark=new THREE.Mesh(new THREE.SphereGeometry(16,14,10),new THREE.MeshBasicMaterial({color:0xffc83d,transparent:true,opacity:0}));
  spark.position.set(x,CY,s*197);spark.userData.own=true;g.add(spark);
  [pg,rod].forEach(o=>o.traverse(m=>{if(m.isMesh){m.userData.part=id;pickables.push(m);}}));
  pistons[k]={pg,rod,spark,x,s};});

/* ================= cylinder-head valvetrain ================= */
const heads={};
['R','L'].forEach(k=>{const {x:cx,s}=AX[k];const id='cams'+k,g=P[id].g;
  P[id].desc='Клапаны стоят шатром: впускные наклонены назад, выпускные вперёд, поэтому стержни расходятся от поршня к распредвалам. Газораспределение по каталогу BMW: два распредвала (вал I и вал II) лежат вдоль мотоцикла, один над другим, каждый открывает один впускной (сзади) и один выпускной (спереди) клапан. На нижнем валу звёздочка цепи и кольцо датчика распредвала, верхний крутится от нижнего через шестерни 1:1, в два раза медленнее коленвала. Кулачок давит на рокер (у каждого клапана свой рокер на своей оси в корпусе распредвалов), рокер через полусферическую шайбу давит на клапан. Зазор меряют щупом между кулачком и рокером. Ход клапана 10,8 мм.';
  const H={s,cx,cams:[],valves:[]};
  [1,-1].forEach(u=>{const cg=new THREE.Group();cg.position.set(0,CY+u*CAM_DY,s*CAM_Z);g.add(cg);
    const xs=chX(s);
    cg.add(M('steel',new THREE.CylinderGeometry(10,10,xs-(cx-60),20).rotateZ(Math.PI/2),[(xs+cx-60)/2,0,0]));
    [cx-50,cx,cx+46].forEach(xj=>cg.add(M('chrome',new THREE.CylinderGeometry(12,12,10,24).rotateZ(Math.PI/2),[xj,0,0])));
    cg.add(M('brass',gearGeo2(CAM_DY,28,8),[xs-14,0,0]));
    if(u<0){const sp=sprocketGeo(22,7);cg.add(M('steel',sp.g,[xs,0,0]));
      const rr=prismYZ(circ(0,0,24,40).filter(([y,z])=>y>-4),null,3);cg.add(M('black',rr,[xs+7,0,0]));}  // camshaft sensor reluctor
    VALVES.forEach(([kind,dx])=>{const pts=[];for(let i=0;i<120;i++){const th=i/120*Math.PI*2;let d=th*180/Math.PI;if(d>180)d-=360;const cd=d;
        const r=RB+(Math.abs(cd)<WIN/4?(VL/2)*Math.cos(Math.PI*cd/(WIN/2)):0);pts.push([r*Math.cos(th),r*Math.sin(th)]);}
      const lob=new THREE.Group();lob.position.x=cx+TX(dx);lob.rotation.x=-s*Math.PI/2-u*PK[kind]/2*Math.PI/180;cg.add(lob);
      lob.add(M('steel',prismYZ(pts,null,10)));});
    reg(g,id,cg);H.cams.push({g:cg,u});});
  /* camshaft supporting bracket (carrier): bridges across both shafts */
  [cx-50,cx+46].forEach(xb=>{const pts=hull(circ(CY+CAM_DY,s*CAM_Z,17,24).concat(circ(CY-CAM_DY,s*CAM_Z,17,24)).concat(circ(CY+PIV_DY,s*Z_PIV,9,16)).concat(circ(CY-PIV_DY,s*Z_PIV,9,16)));
    const m=new THREE.Mesh(prismYZ(pts,[circ(CY+CAM_DY,s*CAM_Z,12.5,24,true),circ(CY-CAM_DY,s*CAM_Z,12.5,24,true)],8),mat('case',true));m.position.x=xb;reg(g,id,m);});
  /* valves, springs, shims, rockers */
  VALVES.forEach(([kind,dx,rv])=>[1,-1].forEach(u=>{const vx=cx+dx,vy=CY+u*TIP_DY,tx=cx+TX(dx);
    const T=new THREE.Group();T.position.set(vx,vy,s*Z_VFACE);T.rotation.y=Math.sign(dx)*s*VT;g.add(T);   // valve axis, tilted at the seat
    const vg=new THREE.Group();vg.position.set(0,0,0);const vgo=new THREE.Group();vgo.position.set(0,0,-s*Z_VFACE);vgo.add(vg);T.add(vgo);
    const vp=[[0.1,0],[rv,0],[rv,1.4],[rv-3,2.6],[3.6,9],[2.75,14],[2.75,Z_TIP-Z_VFACE-1],[2.4,Z_TIP-Z_VFACE]].map(p=>new THREE.Vector2(p[0],p[1]));
    const vgeo=new THREE.LatheGeometry(vp,28);vgeo.rotateX(Math.PI/2);if(s<0)vgeo.scale(1,1,-1);const vm=M('steel',vgeo,[0,0,s*Z_VFACE]);vg.add(vm);
    vg.add(M('steel',new THREE.CylinderGeometry(11,8,4,20).rotateX(Math.PI/2),[0,0,s*(Z_TIP-8)]));               // upper spring plate + collets
    const shim=new THREE.Mesh(new THREE.SphereGeometry(5,16,8,0,Math.PI*2,0,Math.PI/2),mat('brass',true));shim.rotation.x=s*Math.PI/2;shim.position.z=s*Z_TIP;vg.add(shim);
    const spr=new THREE.Group();spr.position.set(0,0,s*226);vgo.add(spr);
    {const pts=[];const turns=6.5,L=Z_TIP-8-226;for(let i=0;i<=200;i++){const t=i/200,a=t*turns*Math.PI*2;pts.push(new V3(10.5*Math.cos(a),10.5*Math.sin(a),s*t*L));}
      const sp=M('spring',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),220,1.7,6,false));spr.add(sp);spr.userData.L=L;}
    vgo.add(M('satin',new THREE.CylinderGeometry(12,12,2,20).rotateX(Math.PI/2),[0,0,s*225]));                     // lower spring plate
    const piv=new THREE.Group();piv.position.set(tx,CY+u*PIV_DY,s*Z_PIV);g.add(piv);
    const rk=[[7,0],[5.5,4.5],[0,7],[-10,6],[-20,4.6],[-30,4],[-38,2.4],[-43,0],[-44,-3],[-41,-4.6],[-36,-4.4],[-26,-3.4],[-14,-4.5],[-4,-6.8],[4,-5.6]];
    const rmesh=new THREE.Mesh(prismYZ(rk,[circ(0,0,4.6,20,true)],12),mat('satin',true));rmesh.scale.set(1,u*0.9,s);piv.add(rmesh);
    g.add(M('steel',new THREE.CylinderGeometry(4.4,4.4,22,12).rotateZ(Math.PI/2),[tx,CY+u*PIV_DY,s*Z_PIV]));       // rocker shaft
    [T,piv].forEach(o=>o.traverse(m=>{if(m.isMesh){m.userData.part=id;pickables.push(m);}}));
    pickables.push(...g.children.filter(m=>m.isMesh&&!pickables.includes(m)).map(m=>(m.userData.part=id,m)));
    H.valves.push({kind,u,vg,spr,piv});}));
  heads[k]=H;});

/* ================= timing chains ================= */
const gT=P.camchains.g;
P.camchains.desc='Привод ГРМ спереди мотора под крышкой цепей (BMW 11_4277, 11_4267): у каждой цепи светлая натяжная планка на оси, её поджимает гидравлический натяжитель, вкрученный снаружи, а с другой стороны цепь идёт по рёбристой успокоительной планке. звёздочка коленвала Z24 через короткую цепь крутит большую звёздочку Z48 на промежуточном валу под коленвалом, поэтому он вращается в два раза медленнее. От промежуточного вала две цепи идут вверх к головкам и крутят нижние распредвалы (звёздочки Z22 и Z22). На каждой цепи гидравлический натяжитель с подвижным башмаком и неподвижная направляющая. Натягивать вручную ничего не нужно.';
/* chain path around two sprockets. Each straight run can be bowed inward by a curved rail (bow1 on the c1->c2 run, bow2 on the
   c2->c1 run, mm): the chain leaves the sprocket a little further round and follows a smooth curve (cubic Bezier) to the other one,
   like it does on the curved sliding face of the BMW guide and tensioner rails. */
function beltPath(c1,r1,c2,r2,bow1,bow2){const dy=c2[0]-c1[0],dz=c2[1]-c1[1],d=Math.hypot(dy,dz),ph=Math.atan2(dz,dy),b=Math.asin((r1-r2)/d);
  const e=a=>[Math.cos(a),Math.sin(a)],P=(c,r,a)=>[c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)];
  const a1=ph+Math.PI/2+b,a2=ph-Math.PI/2-b;
  function run(cA,rA,cB,rB,al,bow){const p=P(cA,rA,al),q=P(cB,rB,al),L=Math.hypot(q[0]-p[0],q[1]-p[1]),u=[(q[0]-p[0])/L,(q[1]-p[1])/L],n=e(al);
    if(!bow)return {aA:al,aB:al,pts:[p,q],nrm:n};
    const s=(-u[1]*n[0]+u[0]*n[1])<0?1:-1,dl=Math.asin(Math.min(.5,4*bow/L));
    const aA=al+s*dl,aB=al-s*dl,p0=P(cA,rA,aA),p3=P(cB,rB,aB);
    const rot=(v,t)=>[v[0]*Math.cos(t)-v[1]*Math.sin(t),v[0]*Math.sin(t)+v[1]*Math.cos(t)],tA=rot(u,s*dl),tB=rot(u,-s*dl);
    const p1=[p0[0]+tA[0]*L/3,p0[1]+tA[1]*L/3],p2=[p3[0]-tB[0]*L/3,p3[1]-tB[1]*L/3],pts=[];
    for(let i=0;i<=60;i++){const t=i/60,m=1-t;pts.push([m*m*m*p0[0]+3*m*m*t*p1[0]+3*m*t*t*p2[0]+t*t*t*p3[0],m*m*m*p0[1]+3*m*m*t*p1[1]+3*m*t*t*p2[1]+t*t*t*p3[1]]);}
    return {aA,aB,pts,nrm:n};}
  const R1=run(c1,r1,c2,r2,a1,bow1||0),R2=run(c2,r2,c1,r1,a2,bow2||0);
  const arc=(c,r,f,t)=>{const k=Math.max(2,Math.ceil(Math.abs(t-f)*r/1.5)),o=[];for(let i=0;i<=k;i++)o.push(P(c,r,f+(t-f)*i/k));return o;};
  const poly=[].concat(R1.pts,arc(c2,r2,R1.aB,R2.aA).slice(1),R2.pts.slice(1),arc(c1,r1,R2.aB,R1.aA-2*Math.PI).slice(1,-1));
  const cum=[0];for(let i=1;i<=poly.length;i++){const A=poly[i-1],B=poly[i%poly.length];cum.push(cum[i-1]+Math.hypot(B[0]-A[0],B[1]-A[1]));}
  const len=cum[cum.length-1];
  const at=(s)=>{s=((s%len)+len)%len;let lo=0,hi=poly.length;while(hi-lo>1){const m=(lo+hi)>>1;if(cum[m]<=s)lo=m;else hi=m;}
    const A=poly[lo],B=poly[(lo+1)%poly.length],sl=cum[lo+1]-cum[lo]||1,f=(s-cum[lo])/sl,ty=(B[0]-A[0])/sl,tz=(B[1]-A[1])/sl;return [A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f,ty,tz];};
  /* a run as a curve: point at fraction f, offset d along the outward normal */
  const runAt=(R,f,dd)=>{const N=R.pts.length-1,x=Math.min(N-1e-6,Math.max(0,f*N)),i=Math.floor(x),g=x-i,A=R.pts[i],B=R.pts[Math.min(N,i+1)];
    let ty=B[0]-A[0],tz=B[1]-A[1];const l=Math.hypot(ty,tz)||1;ty/=l;tz/=l;let ny=-tz,nz=ty;if(ny*R.nrm[0]+nz*R.nrm[1]<0){ny=-ny;nz=-nz;}
    return [A[0]+(B[0]-A[0])*g+ny*dd,A[1]+(B[1]-A[1])*g+nz*dd,ny,nz];};
  return {len,at,runs:[R1,R2],runAt,n1:e(a1),n2:e(a2)};}
const CHAINS=[];
function chain(x,c1,Z1,c2,Z2,speed,tens,bows){const r1=Z1*PITCH/(2*Math.PI),r2=Z2*PITCH/(2*Math.PI);const bp=beltPath(c1,r1,c2,r2,...(bows||[0,0]));
  const n=Math.round(bp.len/PITCH),pitch=bp.len/n;
  const plate=new THREE.InstancedMesh(new THREE.BoxGeometry(11,5.2,pitch*1.08),mat('steel'),n),roll=new THREE.InstancedMesh(new THREE.CylinderGeometry(2.6,2.6,8,8).rotateZ(Math.PI/2),mat('satin'),n);
  [plate,roll].forEach(m=>{m.userData.part='camchains';gT.add(m);pickables.push(m);});
  /* rails along both straight runs (BMW 11_4277): tensioner rail on one run, pivoting at its end and pressed by the hydraulic
     tensioner screwed in from outside; ribbed guide rail on the other run */
  [[bp.runs[0],tens],[bp.runs[1],!tens]].forEach(([R,isT])=>{const N=24,A=[],B=[];
    const P=(f,d)=>bp.runAt(R,f,d);
    for(let i=0;i<=N;i++){const f=0.1+0.8*i/N,b=1-Math.pow(2*(f-0.5)/0.8,2);
      A.push(P(f,3.6));B.push(P(f,isT?9.5+5*b:9+(i%3===0?5.5:2)));}
    const out=A.concat(B.reverse());const geo=prismYZ(out,null,isT?12:13);
    const rail=M(isT?'ceramic':'brass',geo,[x,0,0]);rail.userData.part='camchains';gT.add(rail);pickables.push(rail);
    if(isT){const pv=P(0.06,8),tp=P(0.42,15);
      const boss=M('steel',new THREE.CylinderGeometry(5,5,16,14).rotateZ(Math.PI/2),[x,pv[0],pv[1]]);boss.userData.part='camchains';gT.add(boss);pickables.push(boss);
      const tg=new THREE.Group();tg.position.set(x,tp[0],tp[1]);tg.quaternion.setFromUnitVectors(new V3(0,1,0),new V3(0,tp[2],tp[3]));
      tg.add(M('chrome',new THREE.CylinderGeometry(4.5,4.5,10,14),[0,4,0]));                                   // plunger on the rail
      tg.add(M('satin',new THREE.CylinderGeometry(8,8,34,18),[0,24,0]));                                        // tensioner body
      for(let k=0;k<6;k++)tg.add(M('satin',new THREE.TorusGeometry(8.2,.8,6,18).rotateX(Math.PI/2),[0,26+k*2.6,0])); // thread M24x1,5
      tg.add(M('steel',new THREE.CylinderGeometry(12.5,12.5,9,6),[0,45.5,0]));                                  // hex head with sealing ring
      tg.traverse(m=>{if(m.isMesh){m.userData.part='camchains';pickables.push(m);}});gT.add(tg);}});
  const c={x,bp,n,pitch,plate,roll,speed,r1};CHAINS.push(c);return c;}
/* intermediate shaft (oil-pump shaft with the cam-chain sprockets) */
const ish=new THREE.Group();ish.position.set(0,IY,0);gT.add(ish);
{ish.add(M('steel',(()=>{const l=new THREE.LatheGeometry([[10.5,760],[13,760],[13,1045],[10.5,1045],[10.5,760]].map(p=>new THREE.Vector2(p[0],p[1])),24);l.rotateZ(-Math.PI/2);return l;})()));   /* hollow: the balance shaft runs inside */
  const big=sprocketGeo(48,6,4);ish.add(M('satin',big.g,[X_PRIM,0,0]));
  [chX(1),chX(-1)].forEach(xx=>{const s22=sprocketGeo(22,7);ish.add(M('steel',s22.g,[xx,0,0]));});
  ish.traverse(m=>{if(m.isMesh){m.userData.part='camchains';pickables.push(m);}});}
/* balance shaft (BMW 11_4209; layout per the BMW R 1200 press kit: the shaft runs inside the hollow intermediate shaft on rolling
   bearings, a spur gear from the crank drives it 1:1, so it turns at crank speed the other way; two weights 180° apart: the front one is
   part of the drive gear Z=60, the rear one is bolted on behind the oil space). 60:60 on the 104 mm crank-to-shaft distance gives module 1,73. */
const BAL=(function(){const g=P.balancer.g;P.balancer.g.visible=true;P.balancer.sys='Двигатель';P.balancer.name='Балансирный вал и его привод';
  P.balancer.desc='BMW 11_4209. Балансирный вал проходит внутри полого промежуточного вала (того, что крутит масляный насос и цепи ГРМ) на своих подшипниках. Спереди на нём шестерня Z=60 на сегментной шпонке под гайкой M12x1,5, её крутит такая же шестерня на носке коленвала: 1 : 1, вал вращается со скоростью коленвала, но в обратную сторону. Противовесов два, развёрнуты на 180°: передний отлит заодно с шестернёй, задний прикручен болтом M8x70 на заднем конце, за масляной полостью. Сзади шариковый подшипник 20x37x9 под стопорным кольцом и сальник 25x37x6,5. Модуль шестерён 1,73 получен из расстояния между осями на модели: оценка.';
  const XG=1058,Z=60,m=2*(CY-IY)/(2*Z);
  const cg=new THREE.Group();cg.position.set(0,CY,0);
  cg.add(M('steel',invGear(Z,m,10,{bore:19}),[XG,0,0]));
  const bg=new THREE.Group();bg.position.set(0,IY,0);
  bg.add(M('chrome',new THREE.CylinderGeometry(8,8,1068-716,16).rotateZ(Math.PI/2),[(1068+716)/2,0,0]));
  bg.add(M('steel',invGear(Z,m,10,{bore:8}),[XG,0,0]));
  const sector=(r0,r1,t)=>{const pts=[];for(let i=0;i<=24;i++){const a=-Math.PI/2+i/24*Math.PI;pts.push([r1*Math.cos(a),r1*Math.sin(a)]);}
    for(let i=24;i>=0;i--){const a=-Math.PI/2+i/24*Math.PI;pts.push([r0*Math.cos(a),r0*Math.sin(a)]);}return prismYZ(pts,null,t);};
  bg.add(M('satin',sector(12,44,8),[XG-9,0,0]));                                   /* front weight on the gear */
  bg.add(M('steel',new THREE.CylinderGeometry(9,9,8,6).rotateZ(Math.PI/2),[1067,0,0]));  /* nut M12x1,5 */
  const rw=M('satin',sector(10,42,16),[726,0,0]);rw.rotation.x=Math.PI;bg.add(rw);   /* rear weight, 180° opposite */
  bg.add(M('chrome',new THREE.CylinderGeometry(4,4,30,10),[726,-20,0]));             /* bolt M8x70 */
  bg.add(M('steel',(()=>{const l=new THREE.LatheGeometry([[10,-4.5],[18.5,-4.5],[18.5,4.5],[10,4.5],[10,-4.5]].map(p=>new THREE.Vector2(p[0],p[1])),32);l.rotateZ(-Math.PI/2);return l;})(),[744,0,0]));
  bg.add(M('black',(()=>{const l=new THREE.LatheGeometry([[12.5,-3.2],[18.5,-3.2],[18.5,3.2],[12.5,3.2],[12.5,-3.2]].map(p=>new THREE.Vector2(p[0],p[1])),32);l.rotateZ(-Math.PI/2);return l;})(),[736,0,0]));
  [cg,bg].forEach(o=>reg(g,'balancer',o));
  function set(theta){const a=-theta*DEG;cg.rotation.x=a;bg.rotation.x=meshAngle(a,Z,Z,Math.atan2(0,IY-CY));}
  return {set};})();
/* ===== alternator drive (BMW 12_2111): crankshaft pulley 12 31 7 694 069 on the crank nose under washer 22 and nut M22x1,5,
   ribbed V-belt 4PK582 (4 ribs, 582 mm effective length) up to the alternator pulley. Both pulleys in one plane at the very front
   of the engine, under the belt guard. Pulley sizes are estimates; the centre distance is solved so the belt is exactly 582 mm.
   The belt runs on the pulleys and moves with them: crank pulley turns with the crank, alternator 40/27 = 1,48 times faster. ===== */
const BELT=(function(){
  const XB=1088, R1=40, R2=27, LEN=582;
  let d=180;for(let i=0;i<20;i++){d=(LEN-Math.PI*(R1+R2)-(R1-R2)*(R1-R2)/d)/2;}           /* open belt length -> centre distance */
  const AY=CY+d;
  ['belt','alternator'].forEach(id=>{const p=P[id];if(!p)return;delete OFFS[id];
    for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.part===id)pickables.splice(i,1);
    while(p.g.children.length)p.g.remove(p.g.children[0]);p.g.position.set(0,0,0);});
  const ribs=(rIn,rOut,w,n)=>{const pr=[];for(let i=0;i<=n*2;i++){const x=-w/2+w*i/(n*2);pr.push([i%2?rIn:rOut,x]);}return pr;};
  /* crank pulley + washer + nut, turning with the crank */
  {const g=new THREE.Group();
    const l=new THREE.LatheGeometry([[19,-12],[26,-12],[26,-7],[R1+1.5,-7]].concat(ribs(R1-1,R1+1.5,14,4).slice(1)).concat([[R1+1.5,7],[19,7]]).map(p=>new THREE.Vector2(p[0],p[1])),48);
    l.rotateZ(-Math.PI/2);g.add(M('satin',l,[XB,0,0]));
    g.add(M('steel',new THREE.CylinderGeometry(18,18,3,24).rotateZ(Math.PI/2),[XB+8.5,0,0]));      /* washer 22 */
    g.add(M('steel',new THREE.CylinderGeometry(17,17,11,6).rotateZ(Math.PI/2),[XB+15.5,0,0]));     /* nut M22x1,5 */
    g.traverse(m=>{if(m.isMesh){m.userData.sub='pulley';m.userData.part='crank';pickables.push(m);}});crank.add(g);}
  /* alternator: body behind its pulley, pulley + fan turn */
  const ga=P.alternator.g;P.alternator.name='Генератор';
  P.alternator.desc='BMW 12_2111: генератор Denso 60 А на трёх болтах M8x25 спереди сверху на картере. Крутится поликлиновым ремнём 4PK582 от шкива на носке коленвала, в 1,48 раза быстрее коленвала. Ток идёт через регулятор на аккумулятор и всю электрику.';
  ga.add(M('black',(()=>{const l=new THREE.LatheGeometry([[0.1,0],[50,0],[54,8],[54,96],[48,104],[0.1,106]].map(p=>new THREE.Vector2(p[0],p[1])),40);l.rotateZ(Math.PI/2);return l;})(),[XB-14,AY,0]));
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;ga.add(M('satin',new THREE.BoxGeometry(90,2,4),[XB-66,AY+Math.sin(a)*54,Math.cos(a)*54]));}
  const ap=new THREE.Group();ap.position.set(XB,AY,0);
  {const l=new THREE.LatheGeometry([[8,-12],[16,-12],[16,-7],[R2+1.5,-7]].concat(ribs(R2-1,R2+1.5,14,4).slice(1)).concat([[R2+1.5,7],[8,7]]).map(p=>new THREE.Vector2(p[0],p[1])),40);
    l.rotateZ(-Math.PI/2);ap.add(M('steel',l));
    ap.add(M('steel',new THREE.CylinderGeometry(9,9,8,6).rotateZ(Math.PI/2),[10,0,0]));
    for(let k=0;k<3;k++){const b=M('satin',new THREE.BoxGeometry(2,16,5),[-13,10*Math.cos(k*2.09),10*Math.sin(k*2.09)]);b.rotation.x=k*2.09;ap.add(b);}}
  ga.add(ap);
  ga.traverse(m=>{if(m.isMesh){m.userData.part='alternator';pickables.push(m);}});
  /* belt: 4 ribs on the inside, flat back; built from short pieces that run along the path */
  const bp=beltPath([CY,0],R1,[AY,0],R2),pitch=bp.len/Math.round(bp.len/4),n=Math.round(bp.len/pitch);
  const seg=new THREE.InstancedMesh(new THREE.BoxGeometry(14,3.2,pitch*1.04),mat('rubber'),n);
  const rib=new THREE.InstancedMesh(new THREE.BoxGeometry(12,1.8,pitch*.5),mat('black'),n);
  [seg,rib].forEach(m=>{m.userData.part='belt';P.belt.g.add(m);pickables.push(m);});
  P.belt.desc='BMW 11 31 8 528 385, поликлиновой ремень 4PK582: 4 ручья, длина 582 мм. Обходит шкив коленвала и шкив генератора, натяжителя нет, натяг задаётся положением генератора. Замена раз в 6 лет или каждые 40 000 км. Порвался: генератор стоит, аккумулятор садится, горит предупреждение напряжения.';
  const _b=new THREE.Object3D(),_n=new V3();
  function set(theta){const D=Math.PI/180,a=-theta*D;ap.rotation.x=a*R1/R2;const off=theta*D*R1;
    for(let i=0;i<n;i++){const [y,z,ty,tz]=bp.at(i*pitch+off);_n.set(0,-tz,ty);   /* normal pointing out of the loop */
      const cy=(CY+AY)/2;if(_n.y*(y-cy)+_n.z*z<0)_n.multiplyScalar(-1);
      _b.position.set(XB,y+_n.y*1.6,z+_n.z*1.6);_b.quaternion.setFromUnitVectors(new V3(0,0,1),new V3(0,ty,tz));_b.updateMatrix();seg.setMatrixAt(i,_b.matrix);
      _b.position.set(XB,y-_n.y*.9,z-_n.z*.9);_b.updateMatrix();rib.setMatrixAt(i,_b.matrix);}
    seg.instanceMatrix.needsUpdate=true;rib.instanceMatrix.needsUpdate=true;}
  set(0);return {set,AY,XB};})();
const PRIM=chain(X_PRIM,[CY,0],24,[IY,0],48,1,true);
/* the lower run of each cam chain is pulled up by the curved rail so that the chain and rail stay inside the cylinder (its underside
   in the scan is at y 370-380 in the chain plane); the upper run is only slightly curved. First number: run c1->c2 (lower on the right
   cylinder, upper on the left), second: the other run. */
const CAMCH={R:chain(chX(1),[IY,0],22,[CY-CAM_DY,CAM_Z],22,.5,false,[CHLOW,6]),L:chain(chX(-1),[IY,0],22,[CY-CAM_DY,-CAM_Z],22,.5,true,[6,CHLOW])};
/* oil pump: twin gerotor at the rear end of the intermediate shaft (BMW 11_4216) */
const gP=P.oilpump.g;P.oilpump.desc='Масляный насос: два героторных насоса (внутренний ротор и наружное кольцо) на заднем конце промежуточного вала, вращаются вдвое медленнее коленвала. Один качает масло под давлением к подшипникам и головкам, второй откачивает. Заборник из поддона снизу.';
const rotors=[];
[778,800].forEach((xx,i)=>{const inner=[];for(let j=0;j<160;j++){const th=j/160*Math.PI*2,r=17+3.2*Math.cos(4*th);inner.push([r*Math.cos(th),r*Math.sin(th)]);}
  const outer=[];for(let j=0;j<160;j++){const th=j/160*Math.PI*2,r=24+3.2*Math.cos(5*th+Math.PI);outer.push([r*Math.cos(th),r*Math.sin(th)]);}
  const gi=new THREE.Group();gi.position.set(xx,IY,0);gP.add(gi);gi.add(M('chrome',prismYZ(inner,[circ(0,0,6,16,true)],14)));
  const go=new THREE.Group();go.position.set(xx,IY+2.4,0);gP.add(go);go.add(M('satin',prismYZ(circ(0,0,33,48),[outer.slice().reverse()],14)));
  rotors.push({gi,go});});
gP.add(M('case',new THREE.CylinderGeometry(40,40,6,32).rotateZ(Math.PI/2),[766,IY,0]));
{const pk=new THREE.CatmullRomCurve3([new V3(790,IY-38,0),new V3(800,IY-80,10),new V3(840,IY-118,20),new V3(900,IY-122,20)]);gP.add(M('steel',new THREE.TubeGeometry(pk,30,6,8,false)));}
gP.traverse(m=>{if(m.isMesh){m.userData.part='oilpump';pickables.push(m);}});

/* ================= kinematics ================= */
const _o=new THREE.Object3D(),DEG=Math.PI/180;
function bump(ph,a,b){ph=((ph%720)+720)%720;if(ph<a||ph>b)return 0;return Math.sin(Math.PI*(ph-a)/(b-a));}
function lift(kind,ph){const pk=PK[kind];return bump(ph,pk-WIN/2,pk+WIN/2)*VL;}
function setChains(th){CHAINS.forEach(c=>{const off=th*DEG*c.speed*(c===PRIM?c.r1:c.r1*1);
    for(let i=0;i<c.n;i++){const [y,z,ty,tz]=c.bp.at(i*c.pitch+off*(c===PRIM?1:1));_o.position.set(c.x,y,z);_o.quaternion.setFromUnitVectors(new V3(0,0,1),new V3(0,ty,tz));_o.updateMatrix();
      c.plate.setMatrixAt(i,_o.matrix);c.roll.setMatrixAt(i,_o.matrix);}
    c.plate.instanceMatrix.needsUpdate=true;c.roll.instanceMatrix.needsUpdate=true;});}
function set(theta,fire){crank.rotation.x=-theta*DEG;ish.rotation.x=-theta*DEG/2;BAL.set(theta);BELT.set(theta);
  rotors.forEach(r=>{r.gi.rotation.x=-theta*DEG/2;r.go.rotation.x=-theta*DEG/2*4/5;});
  setChains(theta);
  ['R','L'].forEach(k=>{const p=pistons[k],s=p.s,a=theta*DEG+(k==='L'?Math.PI:0);
    const py=CR_R*Math.sin(a),pz=CR_R*Math.cos(a),wz=pz+s*Math.sqrt(ROD*ROD-py*py);
    p.pg.position.set(p.x,CY,wz);p.rod.position.set(p.x,CY+py,pz);
    const d=new V3(0,-py,wz-pz).normalize();p.rod.quaternion.setFromUnitVectors(new V3(0,1,0),d);
    const ph=theta+(k==='L'?360:0),H=heads[k];
    H.cams.forEach(c=>c.g.rotation.x=c.u*ph/2*DEG);
    H.valves.forEach(v=>{const L=lift(v.kind,ph);v.vg.position.z=-s*L;v.piv.rotation.x=v.u*s*L/(PIV_DY-TIP_DY);v.spr.scale.z=(v.spr.userData.L-L)/v.spr.userData.L;});
    const q=((ph%720)+720)%720,fl=fire?(q<25?1-q/25:(q>705?1:0)):0;p.spark.material.opacity=fl*.9;p.spark.scale.setScalar(.6+fl*.8);});}
set(0,false);
/* feeler gauge target for valve k (right cylinder): gap between cam base circle and rocker pad */
function gapPoint(i){const [kind,dx]=VALVES[i%2],u=i<2?1:-1;return new V3(AX.R.x+TX(dx),CY+u*CAM_DY,Z_PIV+4.6+0.12);}
return {set,gapPoint,heads,pistons};})();
/* sub tags so the catalog can show just the conrods, pistons, camshafts or valves */
['R','L'].forEach(k=>{E2.pistons[k].rod.userData.sub='rod';E2.pistons[k].pg.userData.sub='piston';
  E2.heads[k].cams.forEach(c=>c.g.userData.sub='cam');E2.heads[k].valves.forEach(v=>[v.vg,v.spr,v.piv].forEach(o=>{if(o)o.userData.sub='valve';}));});

/* ===================== DRY CLUTCH (BMW 21_0195, 21_0307) =====================
   On the crankshaft rear flange, inside the crankcase bell (front of gearbox), coaxial with the crank:
   01 clutch housing with diaphragm-spring fingers, bolted to the crank flange by 5 collar screws M11x1.5 through 02 reinforcement ring;
   04 pressure plate with the starter ring gear on its rim; 05 single friction disc splined to the gearbox input shaft;
   06 cover, bolted to the housing tabs by 6 M6 screws (07, renew on every disassembly).
   Release: lever -> line 01 -> slave cylinder 02 (D=24, rear of gearbox) -> spherical push rod 08 through the hollow input shaft
   -> pushes the centre of the pressure plate forward, the spring lets go, the disc stops while the engine keeps turning. */
const CLU=(function(){
const CY=454,DEG=Math.PI/180;
const X={flange:652,housing:640,plate:626,disc:613,cover:601,slave:392};
const REBUILT=['clutch','clutchSlave'];
REBUILT.forEach(id=>{const p=P[id];if(!p)return;delete OFFS[id];
  for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.part===id)pickables.splice(i,1);
  while(p.g.children.length)p.g.remove(p.g.children[0]);p.g.position.set(0,0,0);});
const M=(k,geo,pos)=>{const m=new THREE.Mesh(geo,mat(k,true));if(pos)m.position.set(...pos);return m;};
function ringYZ(ro,ri,t,n){const s=new THREE.Shape();s.absarc(0,0,ro,0,Math.PI*2,false);const h=new THREE.Path();h.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(h);
  const g=new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:false,curveSegments:n||64});g.translate(0,0,-t/2);g.rotateY(Math.PI/2);return g;}
function shapeYZ(outer,holes,t){const s=new THREE.Shape(outer.map(([a,b])=>new THREE.Vector2(a,b)));(holes||[]).forEach(h=>{const p=new THREE.Path(h.map(([a,b])=>new THREE.Vector2(a,b)));s.holes.push(p);});
  const g=new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:true,bevelThickness:.5,bevelSize:.5,bevelSegments:1,curveSegments:24});g.translate(0,0,-t/2);g.rotateY(Math.PI/2);return g;}
const C=(cy,cz,r,n,rev)=>{const a=[];n=n||32;for(let i=0;i<n;i++){const t=(rev?-1:1)*i/n*Math.PI*2;a.push([cy+r*Math.cos(t),cz+r*Math.sin(t)]);}return a;};
const reg=(g,id,o)=>{o.traverse(m=>{if(m.isMesh){m.userData.part=id;pickables.push(m);}});g.add(o);return o;};
const gC=P.clutch.g;
P.clutch.name='Сухое сцепление (однодисковое)';
P.clutch.desc='Сзади на коленвале, в колоколе картера перед коробкой (BMW 21_0195). На фланец коленвала пятью болтами M11 с усилительным кольцом крепится корпус с лепестками тарельчатой пружины. За ним нажимной диск с зубчатым венцом стартера, затем один ведомый диск с накладками на шлицах первичного вала коробки, сзади крышка на шести болтах M6. Пружина зажимает ведомый диск между нажимным диском и крышкой. Выжимаешь рычаг: шток через полый первичный вал давит в центр нажимного диска, зажим уходит, диск и коробка останавливаются, а двигатель крутится. Сухое: масла внутри нет, накладки боятся масла (течь сальника коленвала или первичного вала убивает диск). Болты M6 крышки по каталогу менять при каждой разборке.';
/* rotating with the crank */
const eng=new THREE.Group();eng.position.set(0,CY,0);gC.add(eng);
{ // 01 housing: dished spring with fingers and tabs
  const out=[];const N=8;for(let i=0;i<N;i++){const a0=i/N*Math.PI*2;for(let j=0;j<=8;j++){const a=a0+j/8*(Math.PI*2/N)*0.62;out.push([118*Math.cos(a),118*Math.sin(a)]);}
    for(let j=0;j<=4;j++){const a=a0+(Math.PI*2/N)*(0.62+j/4*0.38);out.push([104*Math.cos(a),104*Math.sin(a)]);}}
  const holes=[C(0,0,22,24,true)];for(let i=0;i<6;i++){const a=(i+.5)/6*Math.PI*2;holes.push(C(70*Math.cos(a),70*Math.sin(a),20,24,true));}
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;holes.push(C(36*Math.cos(a),36*Math.sin(a),6,12,true));}
  eng.add(M('satin',shapeYZ(out,holes,4),[X.housing,0,0]));
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.24;const t=M('satin',new THREE.BoxGeometry(X.housing-X.cover+4,8,22),[(X.housing+X.cover)/2,112*Math.cos(a),112*Math.sin(a)]);t.rotation.x=a;eng.add(t);}
  eng.add(M('steel',ringYZ(44,22,4),[X.housing+4,0,0]));                          // 02 reinforcement ring
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;eng.add(M('steel',new THREE.CylinderGeometry(8,8,6,6).rotateZ(Math.PI/2),[X.housing-4,36*Math.cos(a),36*Math.sin(a)]));} // 03 collar screws
}
const plate=new THREE.Group();eng.add(plate);
{ // 04 pressure plate with starter ring gear (Z=110)
  const Z=110,pts=[];for(let i=0;i<Z*6;i++){const t=i/(Z*6)*Math.PI*2,r=122+2.2*Math.sign(Math.cos(Z*t));pts.push([r*Math.cos(t),r*Math.sin(t)]);}
  const holes=[C(0,0,26,24,true)];for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const h=[];for(let j=0;j<=6;j++){const aa=a-.08+j/6*.16;h.push([92*Math.cos(aa),92*Math.sin(aa)]);}for(let j=6;j>=0;j--){const aa=a-.05+j/6*.10;h.push([52*Math.cos(aa),52*Math.sin(aa)]);}holes.push(h.reverse());}
  plate.add(M('steel',shapeYZ(pts,holes,7),[X.plate,0,0]));
  plate.add(M('chrome',new THREE.CylinderGeometry(12,12,6,20).rotateZ(Math.PI/2),[X.plate-5,0,0]));     // centre pad for the push rod
}
/* 06 cover with tabs */
{const out=C(0,0,116,96),holes=[C(0,0,84,64,true)];eng.add(M('satin',shapeYZ(out,holes,6),[X.cover,0,0]));
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.24;eng.add(M('steel',new THREE.CylinderGeometry(4.5,4.5,10,6).rotateZ(Math.PI/2),[X.cover-4,112*Math.cos(a),112*Math.sin(a)]));}} // 07 M6 screws
reg(gC,'clutch',eng);
/* turning with the gearbox input shaft */
const out=new THREE.Group();out.position.set(0,CY,0);gC.add(out);
{ // 05 friction disc: steel carrier with 6 windows, two friction rings, splined hub
  const holes=[C(0,0,17,24,true)];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;holes.push(C(58*Math.cos(a),58*Math.sin(a),17,24,true));}
  out.add(M('steel',shapeYZ(C(0,0,98,80),holes,2),[X.disc,0,0]));
  [-3.2,3.2].forEach(d=>out.add(M('gold',ringYZ(98,74,3.4,80),[X.disc+d,0,0])));
  out.add(M('satin',new THREE.CylinderGeometry(22,22,16,24).rotateZ(Math.PI/2),[X.disc,0,0]));
  // gearbox input shaft (hollow) from the disc hub back into the gearbox
  const sh=new THREE.LatheGeometry([[7,0],[13,0],[13,X.disc-410],[7,X.disc-410]].map(p=>new THREE.Vector2(p[0],p[1])),20);sh.rotateZ(Math.PI/2);
  out.add(M('steel',sh,[X.disc,0,0]));
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;out.add(M('steel',new THREE.BoxGeometry(24,2.2,2.2),[X.disc-4,14*Math.cos(a),14*Math.sin(a)]));}  // hub splines
}
reg(gC,'clutch',out);
/* release: push rod + slave cylinder + line to the left handlebar */
const gS=P.clutchSlave.g;P.clutchSlave.layer='drive';
P.clutchSlave.name='Гидропривод сцепления: рабочий цилиндр, шток, магистраль';
P.clutchSlave.desc='BMW 21_0307: рабочий цилиндр D=24 мм стоит сзади на коробке, соосно первичному валу. Его поршень давит сферический шток, шток идёт внутри полого первичного вала вперёд и выжимает нажимной диск. Магистраль идёт к главному цилиндру на левом рычаге руля, на ней пустотелый болт M10x1 с медными шайбами (менять после разборки) и штуцер прокачки с колпачком. В каталоге в этой же группе указано масло Hyspin V10: какая жидкость в приводе именно у тебя, сверь по надписи на крышке бачка на левом рычаге.';
const rod=M('chrome',new THREE.CylinderGeometry(3,3,X.plate-8-X.slave,10).rotateZ(Math.PI/2),[(X.plate-8+X.slave)/2,CY,0]);
const rodG=new THREE.Group();rodG.add(rod);reg(gS,'clutchSlave',rodG);
const slave=new THREE.Group();slave.position.set(X.slave,CY,0);
{slave.add(M('satin',new THREE.CylinderGeometry(20,20,46,24).rotateZ(Math.PI/2),[-23,0,0]));
  slave.add(M('satin',shapeYZ([[-34,-14],[34,-14],[34,14],[-34,14]],[C(-26,0,4,12,true),C(26,0,4,12,true)],6),[0,0,0]));
  slave.add(M('black',new THREE.CylinderGeometry(6,6,14,12),[-30,24,0]));                 // banjo
  slave.add(M('red',new THREE.CylinderGeometry(4,4,10,10),[-14,24,-10]));}                 // bleed nipple cap
reg(gS,'clutchSlave',slave);
{const pts=[[X.slave-30,CY+34,0],[420,560,-90],[520,620,-150],[760,700,-170],[980,880,-200],[1060,990,-230],[1030,1040,-300]].map(p=>new V3(...p));
  reg(gS,'clutchSlave',M('black',new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),80,4,8,false)));}
let pulled=false,amt=0,drv=0,last=null;
function set(theta,dt){amt+=((pulled?1:0)-amt)*Math.min(1,(dt||0.016)*8);
  const dth=last==null?0:theta-last;last=theta;drv+=dth*(1-Math.min(1,amt*1.4));
  eng.rotation.x=-theta*DEG;out.rotation.x=-drv*DEG;
  plate.position.x=amt*4;                              // plate moves 4 mm towards the crank, disc is free
  rodG.position.x=amt*4;slave.position.x=X.slave;
  return drv;}
return {set,toggle:()=>{pulled=!pulled;return pulled;},get pulled(){return pulled;},get amt(){return amt;}};})();

/* ===================== ELECTRICAL HARNESS + UNDER-SEAT (BMW 61_3273 main / rear harness, 12_2129 engine harness,
   61_3928 AGM battery 149x86x143, 61_5758 main relay, 61_5331 light module, 61_5196 B+ jump-start base, 13_1979/13_1705 ECU) ===== */
const ELEC=(function(){
const mk=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r==null?.6:r,metalness:m||0});
const W={trunk:mk(0x1a1b1d,.7),pos:mk(0xc0281f,.5),neg:mk(0x111111,.6),ign:mk(0x2f6fd6,.5),sens:mk(0xd4a017,.5),can:mk(0x3fae55,.5),light:mk(0xe8e8e8,.5),conn:mk(0x2a2c2f,.5)};
function part2(id,name,desc,sys,layer){const g=new THREE.Group();g.name=id;root.add(g);P[id]={id,g,name,desc,sys,layer:layer||'internal',ex:new V3(0,0,0),cur:{off:0,op:0,hl:0},tgt:{off:0,op:0,hl:0},ops:[],home:new V3()};return g;}
const H=part2('harness','Проводка: все магистрали','Основной жгут BMW 61 11 8 569 727 идёт от блока под сиденьем по хребту рамы под баком к рулевой колонке: там фара, приборка, пульты на руле, сигнал, регулятор. Вниз от него моторный жгут: катушки, форсунки, датчики коленвала, распредвала, температуры масла и головок, детонации, лямбда-зонды. Назад хвостовой жгут: фонарь, поворотники, номер. Цвета на модели условные: красный плюс, чёрный масса, синий зажигание, жёлтый датчики, зелёный шина CAN, белый свет.','Электрика');
const tubeM=(pts,r,m,seg)=>{const c=new THREE.CatmullRomCurve3(pts.map(p=>new V3(...p)),false,'centripetal');const t=new THREE.Mesh(new THREE.TubeGeometry(c,seg||48,r,8,false),m);t.userData.part='harness';H.add(t);pickables.push(t);return t;};
const conn=(p,s)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(...(s||[14,10,12])),W.conn);b.position.set(...p);b.userData.part='harness';H.add(b);pickables.push(b);};
const HUB=[250,748,0],SPINE=[[250,748,0],[420,780,0],[600,770,0],[800,800,0],[1000,850,0],[1160,880,0],[1250,890,0]];
tubeM(SPINE,8,W.trunk,90);
// branches: [path, wire material, connector at end?]
const B=[
 // battery and power
 [[[300,752,8],[330,752,26]],'pos'],[[[300,752,-8],[330,752,-26]],'neg'],
 // front: headlight, instrument, switches, horn, regulator, alternator
 [[[1250,890,0],[1285,870,0],[1300,850,0]],'light'],
 [[[1200,882,0],[1205,930,0],[1200,968,0]],'can'],
 [[[1160,880,0],[1120,960,40],[1080,1010,150],[1010,1030,260]],'light'],[[[1160,880,0],[1120,960,-40],[1080,1010,-150],[1010,1030,-260]],'light'],
 [[[1160,880,0],[1175,840,40],[1180,812,70]],'pos'],
 [[[1000,850,0],[1050,760,-60],[1080,700,-82]],'pos'],[[[1080,700,-82],[1060,660,-40],[1035,640,0]],'pos'],
 // fuel pump
 [[[800,800,0],[840,790,10],[850,782,10]],'pos'],
 // engine harness: injectors / throttle bodies, coils, sensors
 [[[620,770,0],[650,650,100],[700,580,190],[720,560,215]],'ign'],[[[620,770,0],[650,650,-100],[700,580,-190],[720,560,-215]],'ign'],
 [[[700,770,0],[780,650,120],[850,560,240],[875,520,300],[880,500,315]],'ign'],[[[700,770,0],[800,650,-120],[900,560,-240],[925,520,-300],[930,500,-315]],'ign'],
 [[[650,700,0],[700,560,20],[820,470,30],[980,400,40],[1050,380,40]],'sens'],                 // crankshaft sensor, front of crankcase
 [[[850,560,240],[870,470,280],[870,430,300]],'sens'],                                        // camshaft sensor, right head
 [[[700,580,190],[800,420,160],[900,380,165]],'sens'],[[[700,580,-190],[820,420,-160],[950,380,-165]],'sens'], // knock + head temperature
 [[[650,700,0],[720,520,-60],[800,360,-120],[860,300,-140]],'sens'],                          // oil temperature
 [[[560,770,0],[560,600,0],[560,525,0]],'sens'],                                              // intake air temperature (airbox)
 [[[650,700,0],[740,480,80],[780,360,110],[800,330,110]],'sens'],[[[650,700,0],[740,480,-80],[790,360,-110],[820,330,-110]],'sens'], // lambda x2
 // rear: ABS, flap servo, wheel speed, side stand, brake light, tail
 [[[420,780,0],[410,700,90],[400,600,140],[395,580,140]],'can'],
 [[[420,780,0],[360,700,-90],[300,620,-150],[290,600,-150]],'ign'],
 [[[395,520,140],[300,450,120],[150,370,100],[60,320,90]],'sens'],
 [[[1000,850,0],[1180,800,60],[1350,620,80],[1440,420,80],[1480,320,80]],'sens'],
 [[[600,770,0],[560,560,-120],[530,360,-140],[520,305,-142]],'sens'],
 [[[420,780,0],[460,600,140],[480,460,180],[485,430,185]],'sens'],
 [[[250,748,0],[100,760,0],[-60,760,0],[-200,730,0],[-290,760,0]],'light'],[[[-200,730,0],[-250,700,80],[-270,690,110]],'light'],[[[-200,730,0],[-250,700,-80],[-270,690,-110]],'light'],
 // diag socket, light module, B+ jump-start base
 [[[250,748,0],[220,730,-40],[200,718,-60]],'can'],[[[250,748,0],[190,745,50],[150,735,60]],'can'],[[[250,748,0],[300,760,60],[305,765,80]],'pos'],
 // engine earth strap battery -> gearbox
 [[[330,752,-26],[360,700,-60],[430,560,-100],[470,520,-104]],'neg']];
B.forEach(([pts,k])=>{tubeM(pts,k==='pos'||k==='neg'?4:3,W[k],36);conn(pts[pts.length-1]);});
/* under-seat units that the scan does not contain */
const U=part2('underseat','Под сиденьем: реле, модуль света, плюсовая клемма','Под сиденьем (BMW 61_3273, 61_5758, 61_5331, 61_5196): аккумулятор AGM 12 В 14 А·ч, 149x86x143 мм, держатель на винте M5; рядом главное реле (600 Вт) в держателе, общий модуль «Свет» (управляет фарой, поворотниками, стопом), блок управления двигателем на кронштейне с тремя резиновыми втулками, разъём диагностики под колпачком и плюсовая клемма B+ для прикуривания под крышкой. Снять сиденье: замок ключом слева сзади.','Электрика');
const ub=(s,p,m,id)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(...s),m);b.position.set(...p);b.userData.part=id||'underseat';(id?P[id].g:U).add(b);pickables.push(b);return b;};
ub([60,22,70],[150,735,60],W.conn);ub([30,8,30],[150,748,60],mk(0x445566,.4,.3));    // light module
ub([22,26,20],[230,735,40],W.conn);                                                     // main relay
ub([24,8,40],[305,766,80],W.pos);ub([10,12,10],[305,775,80],mk(0xc9c9c9,.3,.9));       // B+ base + terminal
return {};})();

/* ===================== SHAFT DRIVE + FINAL DRIVE (BMW 33_1651, 33_1622, 33_1626, 33_1627, 33_1226, 33_1873) =====================
   Gearbox output -> front universal joint (at the swingarm pivot) -> drive shaft with sliding spline (length change as the arm swings)
   -> rear universal joint (at the final-drive pivot) -> pinion (Z11) in tapered/needle bearings, preload by threaded ring + nut M24x1,5, shims
   -> hypoid crown gear (Z32, 32/11 = 2,91) on a grooved ball bearing + needle sleeve -> output flange with 5 lugs -> rear wheel.
   Paralever: final-drive housing pivots on the swingarm end; a torque strut (black rod L=380 mm) links it to the gearbox, so the
   housing does not rotate with drive/brake torque and the bike does not jack up. */
const DRV=(function(){
const DEG=Math.PI/180;
const M=(k,geo,pos)=>{const m=new THREE.Mesh(geo,mat(k,true));if(pos)m.position.set(...pos);return m;};
const reg=(g,id,o)=>{o.traverse(m=>{if(m.isMesh){m.userData.part=id;pickables.push(m);}});g.add(o);return o;};
['driveshaft'].forEach(id=>{const p=P[id];if(!p)return;delete OFFS[id];for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.part===id)pickables.splice(i,1);
  while(p.g.children.length)p.g.remove(p.g.children[0]);p.g.position.set(0,0,0);});
/* geometry measured on the scanned swingarm (orthographic side view): swingarm front pivot on the gearbox (524,341),
   final-drive pivot on the swingarm end (170,285), wheel axle (0,318), torque-strut eyes (112,432) and (490,410).
   Per the BMW Paralever cutaway: the shaft runs straight inside the swingarm tube and its rear joint sits just ahead of the final-drive housing, above the pivot; the pinion then slopes down to the crown wheel at axle height. The sliding spline takes up the small length change. */
const FJ=new V3(524,341,112), RJ=new V3(188,346,148), AX=new V3(0,318,0), PZ=148, CF=134;
function gpart(id,name,desc){const g=new THREE.Group();g.name=id;root.add(g);P[id]={id,g,name,desc,sys:'Трансмиссия',layer:'drive',ex:new V3(0,0,0),cur:{off:0,op:1,hl:0},tgt:{off:0,op:1,hl:0},ops:['fd'],home:new V3()};return g;}
function ujoint(){const g=new THREE.Group();
  [[-1,0],[1,Math.PI/2]].forEach(([s,rot])=>{const y=new THREE.Group();y.rotation.x=rot;g.add(y);
    y.add(M('steel',new THREE.CylinderGeometry(13,13,12,20).rotateZ(Math.PI/2),[s*17,0,0]));
    [-1,1].forEach(q=>y.add(M('steel',new THREE.BoxGeometry(14,5,9),[s*7,q*12,0])));});
  g.add(M('chrome',new THREE.CylinderGeometry(4,4,26,10)));g.add(M('chrome',new THREE.CylinderGeometry(4,4,26,10).rotateX(Math.PI/2)));return g;}
function along(a,b){const g=new THREE.Group();g.position.copy(a);g.quaternion.setFromUnitVectors(new V3(1,0,0),b.clone().sub(a).normalize());return g;}
/* ---- drive shaft (inside the swingarm tube) ---- */
const gS=P.driveshaft.g;P.driveshaft.layer='drive';P.driveshaft.name='Карданный вал';
P.driveshaft.desc='BMW 33 73 9 898 679, внутри маятника. Передний карданный шарнир стоит на оси качания маятника у коробки, задний на конце трубы маятника перед корпусом редуктора, чуть выше его оси качания (так на разрезе BMW Paralever). От заднего шарнира пинион идёт вниз к ведомой шестерне на высоте оси колеса. Между шарнирами шлицевое скользящее соединение (труба и вал), оно компенсирует изменение длины при ходе подвески. Стопорные кольца 22x2,5, шлицы смазывают Klüber LFT 71-402. Пыльники (гофры) спереди и сзади маятника закрывают шарниры.';
const spin=along(FJ,RJ),L=FJ.distanceTo(RJ);gS.add(spin);const rot=new THREE.Group();spin.add(rot);
rot.add(ujoint());rot.add(M('steel',new THREE.CylinderGeometry(15,15,L*.5,24).rotateZ(Math.PI/2),[L*.3,0,0]));
rot.add(M('satin',new THREE.CylinderGeometry(9,9,L*.42,20).rotateZ(Math.PI/2),[L*.72,0,0]));{const j=ujoint();j.position.x=L;rot.add(j);}
reg(gS,'driveshaft',spin);
{const o=along(new V3(547,341,112),FJ);o.add(M('steel',new THREE.CylinderGeometry(11,11,23,16).rotateZ(Math.PI/2),[11.5,0,0]));reg(gS,'driveshaft',o);}
/* pivots: swingarm on gearbox (tapered roller bearings 17x40x13,25 on two pivot pins) and final drive on swingarm end */
const gPv=gpart('pivots','Оси качания: маятник и редуктор','Две оси, на которых всё качается (BMW 33_1226). Спереди маятник висит на коробке на двух пальцах (правый 33 17 2 332 569 и левый) в конических роликовых подшипниках 17x40x13,25, контргайка M24x1,25 на 145 Нм. Сзади корпус редуктора качается на конце маятника на своих пальцах с подшипником: это та большая круглая шайба внизу перед колесом. Каждая ось это два коротких пальца, по одному с каждой стороны, они упираются в стенки корпуса, сквозного пальца нет.');
/* the pivot is two short pins, one from each side, that end at the housing walls: the space between them is open,
   and the universal joint turns in that space exactly on the pivot axis. No pin passes through the joint. */
[[524,341,[[-190,-150],[150,192]]],[170,285,[[70,112],[184,206]]]].forEach(([x,y,pins])=>{const g=new THREE.Group();
  pins.forEach(([z0,z1])=>{g.add(M('chrome',new THREE.CylinderGeometry(8,8,z1-z0,16).rotateX(Math.PI/2),[x,y,(z0+z1)/2]));
    g.add(M('satin',new THREE.CylinderGeometry(20,20,12,24).rotateX(Math.PI/2),[x,y,(Math.abs(z0)<Math.abs(z1)?z0:z1)+(z0<0?-6:6)*(Math.abs(z0)<Math.abs(z1)?1:-1)]));});
  reg(gPv,'pivots',g);});
/* ---- final drive internals, sized to the scanned housing (body radius about 60 mm) ---- */
const gF=gpart('fdgear','Шестерни главной передачи','Внутри корпуса редуктора (BMW 33_1622, 33_1626, 33_1627). Ведущая шестерня (пинион, 11 зубьев) продолжает задний шарнир кардана: пара гипоидная: ось пиниона проходит не через ось колеса, а ниже неё (на модели 22 мм). Из-за этого сдвига зубья у обеих шестерён косые, спиральные, пинион крупнее и прочнее, чем у простой конической пары, и зацепление идёт плавно, с проскальзыванием по зубу. Поэтому нужно именно гипоидное масло с противозадирными присадками. Конический носик пиниона катится по торцевым зубьям ведомой шестерни (32 зуба, 32 : 11 = 2,91). Пинион держат конический роликовый подшипник в резьбовом кольце (уплотнение кольца 58x2,62, сальник 35x47, гайка M24x1,5, шайбы 1,50-2,50 мм задают глубину пиниона) и игольчатый 32x16 за носиком. Ведомая шестерня меньше 138 мм (по кольцу крышки), центральная цапфа уходит в игольчатую втулку крышки мимо пиниона как раз благодаря сдвигу. Ведомая шестерня сидит на полой ступице, которая вращается в большом шариковом подшипнике (наружный диаметр 100 мм, стопорное кольцо 100x3) и игольчатой втулке крышки; со стороны колеса сальник 75x90. Ступица несёт фланец с пятью болтами колеса и тормозной диск: вес колеса и нагрузка идут через этот подшипник на корпус, корпус через ось качания на маятник, маятник на коробку. Зазор в зацеплении задают шайбы 0,70-1,25 мм. Масло Hypoid Axle Oil G3.');
/* Hypoid pair. Sizes from the BMW lists: pinion seal 35x47 and threaded ring O-ring 58 (pinion neck r17,5, bearing r29),
   pilot needle bearing 32x16, ring-gear ball bearing lock ring 100 (bearing OD 100), hub seal 75x90, cover O-ring 138
   (crown OD under 138). Z 32/11. The pinion axis passes HO mm below the crown axis (hypoid offset), its cone apex sits on
   the crown pitch cone, so the pinion's lower generatrix lies on the crown teeth. */
const HO=22, GAM=Math.atan(11/32), TG=Math.tan(GAM), TH=2.6;
const R0=Math.hypot(RJ.x-AX.x,RJ.y-AX.y), d0=new V3(AX.x-RJ.x,AX.y-RJ.y,0).normalize(), al=Math.asin(HO/R0);
const d=d0.clone().applyAxisAngle(new V3(0,0,1),al);                 // turned so the line runs below the axle
{const c=RJ.clone().setZ(0).add(d.clone().multiplyScalar(-RJ.clone().setZ(0).sub(AX).dot(d)));if(c.y>AX.y)d.copy(d0.clone().applyAxisAngle(new V3(0,0,1),-al));}
const SR=-RJ.clone().setZ(0).sub(AX).dot(d);                       // distance RJ -> closest point to the crown axis
const tooth=u=>{const f=u-Math.floor(u),c=Math.abs(f-.25);return Math.min(1,Math.max(0,(0.24-c)/0.1));};  // 0..1 profile, half pitch tooth
function grid(nu,nv,fn,closeU){const pos=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const q=fn(i/nu,j/nv);pos.push(q.x,q.y,q.z);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,e2=c+1;idx.push(a,c,b,b,c,e2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
/* pinion frame: X along the shaft towards the crown, Y = world +Z (towards the cover), so the teeth that touch the crown are at -Y */
const pin=new THREE.Group();pin.position.set(RJ.x,RJ.y,PZ);{const X=d.clone(),Y=new V3(0,0,1),Z=X.clone().cross(Y);pin.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z));}
gF.add(pin);const pinR=new THREE.Group();pin.add(pinR);
const rho=s=>Math.hypot(s,HO);                                     // s measured from the point nearest the crown axis
const XS=s=>SR-s;                                                  // pinion-local x of that point
{const Z=11,S0=40,S1=60,nu=Z*10,nv=10;
  pinR.add(M('steel',grid(nu,nv,(u,v)=>{const s=S0+(S1-S0)*v,a=u*Math.PI*2,r=rho(s)*TG+TH*(2*tooth(u*Z+v*0.35)-1)-0.4;return new V3(XS(s),r*Math.cos(a),r*Math.sin(a));})));
  [S0,S1].forEach((s,k)=>{const cg=new THREE.CircleGeometry(rho(s)*TG-TH,40);cg.rotateY(k?Math.PI/2:-Math.PI/2);pinR.add(M('steel',cg,[XS(s),0,0]));});
  pinR.add(M('steel',new THREE.CylinderGeometry(8,10,8,20).rotateZ(Math.PI/2),[XS(S0)+4,0,0]));                   // pilot spigot
  pinR.add(M('satin',ringYZ2(16,8,10),[XS(S0)+12,0,0]));                                                                // pilot needle bearing 32x16
  pinR.add(M('steel',new THREE.CylinderGeometry(15,17.5,10,24).rotateZ(Math.PI/2),[XS(S1)-5,0,0]));                    // neck
  pinR.add(M('satin',new THREE.CylinderGeometry(29,24,20,28).rotateZ(Math.PI/2),[XS(S1)-22,0,0]));                     // taper roller bearing in the threaded ring
  pinR.add(M('steel',ringYZ2(29,18,6),[XS(S1)-36,0,0]));                                                                // threaded ring
  pinR.add(M('rubber',ringYZ2(23.5,17.5,7.5),[XS(S1)-44,0,0]));                                                         // shaft seal 35x47
  pinR.add(M('steel',new THREE.CylinderGeometry(13,13,9,6).rotateZ(Math.PI/2),[XS(S1)-53,0,0]));                       // nut M24x1,5
  const sl=XS(S1)-57;pinR.add(M('steel',new THREE.CylinderGeometry(11,11,sl-14,16).rotateZ(Math.PI/2),[14+(sl-14)/2,0,0])); // spline stub to the rear joint
}
function ringYZ2(ro,ri,t){const s=new THREE.Shape();s.absarc(0,0,ro,0,Math.PI*2,false);const hp=new THREE.Path();hp.absarc(0,0,ri,0,Math.PI*2,true);s.holes.push(hp);
  const g=new THREE.ExtrudeGeometry(s,{depth:t,bevelEnabled:false,curveSegments:40});g.translate(0,0,-t/2);g.rotateY(Math.PI/2);return g;}
reg(gF,'fdgear',pin);
const crown=new THREE.Group();crown.position.set(AX.x,AX.y,0);gF.add(crown);
{const Z=32,RI=rho(40)-2,RO=rho(60)+2,ZB=118,nu=Z*10,nv=8,zm=r=>PZ-r*TG;
  const top=(u,v)=>{const r=RI+(RO-RI)*v,a=u*Math.PI*2;return new V3(r*Math.cos(a),r*Math.sin(a),zm(r)+TH*(2*tooth(u*Z-v*0.35)-1)+0.4);};
  crown.add(M('steel',grid(nu,nv,top)));                                                                     // spiral face teeth on the pitch cone
  [[RI,0],[RO,1]].forEach(([r,v])=>crown.add(M('steel',grid(nu,1,(u,w)=>{const t=top(u,v);return w?t:new V3(t.x,t.y,ZB);}))));  // inner and outer walls
  const lat=new THREE.LatheGeometry([[30,ZB-12],[64,ZB-12],[64,ZB],[30,ZB]].map(q=>new THREE.Vector2(q[0],q[1])),64);lat.rotateX(Math.PI/2);
  crown.add(M('steel',lat));                                                                                 // crown body
  crown.add(M('satin',new THREE.CylinderGeometry(30,30,ZB-12-70,40).rotateX(Math.PI/2),[0,0,(ZB-12+70)/2]));  // hub to the wheel flange
  crown.add(M('chrome',new THREE.TorusGeometry(40,7,10,48),[0,0,96]));                                         // grooved ball bearing, OD 100
  crown.add(M('rubber',new THREE.TorusGeometry(41,3.5,8,48),[0,0,76]));                                        // hub seal 75x90
  crown.add(M('satin',new THREE.CylinderGeometry(10,10,190-ZB,24).rotateX(Math.PI/2),[0,0,(190+ZB)/2]));       // centre spigot to the cover, clears the offset pinion
  crown.add(M('satin',new THREE.CylinderGeometry(15,15,12,24).rotateX(Math.PI/2),[0,0,182]));                  // needle sleeve in the cover
  const f=new THREE.Shape();const lugs=5;for(let i=0;i<lugs*20;i++){const t=i/(lugs*20)*Math.PI*2,r=46+12*Math.max(0,Math.cos(lugs*t))**3;i?f.lineTo(r*Math.cos(t),r*Math.sin(t)):f.moveTo(r*Math.cos(t),r*Math.sin(t));}
  const fh=new THREE.Path();fh.absarc(0,0,20,0,Math.PI*2,true);f.holes.push(fh);
  const fg=new THREE.ExtrudeGeometry(f,{depth:8,bevelEnabled:false});fg.translate(0,0,62);crown.add(M('satin',fg));
  for(let i=0;i<lugs;i++){const t=i/lugs*Math.PI*2;crown.add(M('chrome',new THREE.CylinderGeometry(6,6,20,6).rotateX(Math.PI/2),[52*Math.cos(t),52*Math.sin(t),60]));}}
reg(gF,'fdgear',crown);
/* ---- Paralever torque strut: upper link between final-drive top eye and the frame/gearbox ---- */
const gR=gpart('strut','Реактивная тяга Paralever','BMW 33 17 7 685 093, чёрная тяга 380 мм над маятником. Задний глаз на верхнем приливе корпуса редуктора (болт M10x60 через резиновую опору), передний на коробке (болт M10x55). Маятник, корпус редуктора и тяга образуют параллелограмм: при газе и торможении корпус не проворачивается вокруг своей оси качания, и мотоцикл не приседает и не подпрыгивает на кардане.');
{const a=new V3(112,432,168),b=new V3(490,410,168);const o=along(a,b),Ls=a.distanceTo(b);o.add(M('black',new THREE.CylinderGeometry(8,8,Ls-30,16).rotateZ(Math.PI/2),[Ls/2,0,0]));
  [0,Ls].forEach(x=>o.add(M('rubber',new THREE.CylinderGeometry(14,14,22,20).rotateX(Math.PI/2),[x,0,0])));reg(gR,'strut',o);}
function set(w){crown.rotation.z=w;rot.rotation.x=-w*32/11;pinR.rotation.x=-w*32/11;}
return {set};})();

Object.values(P).forEach(p=>{p.home.copy(p.g.position);if(OFFS[p.id])p.home.add(new V3(...OFFS[p.id]));
  p.g.traverse(o=>{if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];o.userData.baseOpacity=ms[0].opacity;ms.forEach(q=>q.transparent=true);}});});

/* ---------- highlight / visibility ---------- */
const HL=new THREE.Color(0xf2b705);
function applyPartState(p,dt){
  const c=p.cur,t=p.tgt,k=Math.min(1,FADEDT*(RM?60:6));
  c.off+=(t.off-c.off)*k;c.op+=(t.op-c.op)*k;c.hl+=(t.hl-c.hl)*k;c.sub=(c.sub||0)+((t.sub||0)-(c.sub||0))*k;
  if(!p.exNow)p.exNow=p.ex.clone();p.exNow.lerp(t.exT||p.ex,k);
  p.g.position.copy(p.home).addScaledVector(p.exNow,c.off);applySub(p);
  const pulse=c.hl>0.01?(0.55+0.45*Math.sin(performance.now()/220)):0;
  p.g.visible=c.op>0.02;
  p.g.traverse(o=>{if(!o.material||o.userData.own)return;const ms=Array.isArray(o.material)?o.material:[o.material];
    ms.forEach(q=>{q.opacity=c.op*(o.userData.baseOpacity==null?1:o.userData.baseOpacity);q.depthWrite=c.op>0.9;
      if(q.emissive&&!o.userData.ownEm){const be=q.userData.baseEm;if(be)q.emissive.copy(be).lerp(HL,c.hl*pulse*.85);else q.emissive.copy(HL).multiplyScalar(c.hl*pulse*0.85);}});});
}

/* ---------- camera views (mm) ---------- */
const VIEWS={
  overall:{p:[2700,1300,2700],t:[780,560,0],n:'ОБЩИЙ'},
  engine:{p:[1950,1150,1950],t:[730,430,0],n:'ДВИГАТЕЛЬ'},
  rightSide:{p:[1000,650,1800],t:[770,420,150],n:'ДВИГАТЕЛЬ СПРАВА'},
  leftLow:{p:[800,450,-1600],t:[760,350,-100],n:'ДВИГАТЕЛЬ СЛЕВА'},
  sump:{p:[1600,200,1050],t:[830,280,0],n:'КАРТЕР СНИЗУ'},
  filter:{p:[1650,40,620],t:[1030,250,0],n:'МАСЛЯНЫЙ ФИЛЬТР'},
  headR:{p:[1350,850,1450],t:[770,430,330],n:'ГОЛОВКА СПРАВА'},
  headRclose:{p:[1150,700,1100],t:[770,430,300],n:'ГОЛОВКА СПРАВА, БЛИЗКО'},
  headL:{p:[1350,850,-1450],t:[770,430,-330],n:'ГОЛОВКА СЛЕВА'},
  fd:{p:[-850,600,1200],t:[20,315,110],n:'ГЛАВНАЯ ПЕРЕДАЧА'},
  brakeF:{p:[2150,600,800],t:[1460,390,70],n:'ПЕРЕДНИЕ ТОРМОЗА'},
  brakeR:{p:[-500,420,800],t:[-40,260,60],n:'ЗАДНИЙ ТОРМОЗ'},
  barR:{p:[1500,1500,950],t:[1050,1050,190],n:'РУЛЬ СПРАВА'},
  barL:{p:[1500,1500,-950],t:[1050,1050,-190],n:'РУЛЬ СЛЕВА'},
  clutch:{p:[250,700,750],t:[620,454,0],n:'СЦЕПЛЕНИЕ'},
  underSeat:{p:[260,1650,420],t:[230,735,0],n:'ПОД СИДЕНЬЕМ'},
  resR:{p:[900,900,1250],t:[380,590,165],n:'БАЧОК ЗАДНЕГО ТОРМОЗА'},
  drive:{p:[350,1000,2200],t:[480,400,40],n:'ПРИВОД НА КОЛЕСО'},
  headOpen:{p:[520,760,800],t:[760,420,290],n:'ГОЛОВКА ОТКРЫТА'},
  gapView:{p:[470,560,560],t:[640,416,296],n:'ЗАЗОР КЛАПАНА'},
  wheelTurn:{p:[-700,700,1300],t:[200,380,150],n:'ЗАДНЕЕ КОЛЕСО'},
  wellR:{p:[812,476,700],t:[770,430,250],n:'КОЛОДЕЦ СВЕЧИ СПРАВА'},
  wellX:{p:[1300,760,880],t:[770,430,300],n:'КОЛОДЕЦ В РАЗРЕЗЕ'},
  plugOut:{p:[930,540,860],t:[770,430,500],n:'СВЕЧА СНАРУЖИ'},
  gap:{p:[860,470,620],t:[790,432,490],n:'ЗАЗОР СВЕЧИ'},
  torque:{p:[1350,900,1250],t:[860,430,430],n:'ЗАТЯЖКА'},
  coilsBoth:{p:[1500,1300,0],t:[770,430,0],n:'ОБЕ КАТУШКИ'},
  exhaustL:{p:[250,800,-1900],t:[250,500,-160],n:'ВЫПУСК СЛЕВА'},
  headersFront:{p:[2100,520,1000],t:[880,260,80],n:'КОЛЛЕКТОРЫ СПЕРЕДИ'},
  filler:{p:[1180,880,1080],t:[820,515,290],n:'ЗАЛИВНАЯ ПРОБКА'}
};
['engine','rightSide','leftLow','sump','filter','headR','headRclose','headL','headOpen','gapView','wellR','wellX','plugOut','gap','torque','coilsBoth','headersFront'].forEach(k=>{const V=VIEWS[k];V.p=V.p.map((v,i)=>v+ENG[i]);V.t=V.t.map((v,i)=>v+ENG[i]);});
let fly=null;
function dolly(r){if(Math.abs(r-1)<1e-4)return;const t=fly?fly.t:controls.target,q=fly?fly.p:camera.position;q.sub(t).multiplyScalar(r).add(t);}
function goView(v,instant){const V=VIEWS[v];if(!V)return;document.getElementById('tag3d').textContent='ВИД: '+V.n;
  const p=new V3(...V.p).multiplyScalar(S),t=new V3(...V.t).multiplyScalar(S);
  if(explode>0&&(tab==='bike'||tab==='cat'||SYSDEF[tab]))p.sub(t).multiplyScalar(1+0.9*explode).add(t);
  if(instant||RM){camera.position.copy(p);controls.target.copy(t);fly=null;return;}
  fly={p0:camera.position.clone(),t0:controls.target.clone(),p,t,s:performance.now(),d:900};}

/* ---------- engine animation state ---------- */
let theta=0, speed=1, playing=true, gear=0, cutaway=false, xray=false, cutPlane=false;
function bump(ph,a,b){ph=((ph%720)+720)%720;if(ph<a||ph>b)return 0;return Math.sin(Math.PI*(ph-a)/(b-a));}
const STROKES=['Рабочий ход','Выпуск','Впуск','Сжатие'];
function strokeOf(ph){ph=((ph%720)+720)%720;return Math.floor(ph/180);}
/* cams turn at half crank speed: the chain turns the lower camshaft the same way as the crank, its spur gear turns the upper one the other way.
   Valve lift 10,8 mm (BMW data for this DOHC head). */
function setValvetrain(c,ph){const s=c.s,cr=(ph/2)*Math.PI/180;
  c.cams.forEach(cm=>cm.g.rotation.x=cm.u*cr);
  c.valves.forEach(v=>{const lift=(v.kind==='ex'?bump(ph,160,380):bump(ph,340,580))*10.8;v.g.position.z=-s*lift;v.piv.rotation.x=v.u*s*lift/47;});}
function updateEngine(){
  E2.set(theta,true);const drv=CLU.set(theta,FADEDT||0.016);
  GBX.set(-drv*Math.PI/180,gear,FADEDT||0.016);
}
let wheelSpin=0;
/* wheel rotation: rotate the rear wheel group around its axle */
const wR=P.wheelR.g;const wPivot=new THREE.Group();wPivot.position.set(0,315,0);root.add(wPivot);
while(wR.children.length){const c=wR.children[0];c.position.y-=315;wPivot.add(c);}wR.add(wPivot);root.remove(wPivot);wR.add(wPivot);
const stEls={};
/* ===== Узлы: что входит в каждый, разлёт на детали, разрез ===== */
const SYSDEF={
 engine:{n:'Двигатель',dir:[1,.5,.95],ids:['crankcase','beltcover','throttle','cylL','cylR','headL','headR','coverL','coverR','capL','capR','coilL','coilR','connL','connR','plugL','plugR','camsL','camsR','pistonL','pistonR','crank','camchains','balancer','oilpump','oilfilter','drainplug','sightglass','filler','alternator','belt','starter','sensors','clutch','breather'],ctx:[],always:[]},
 drive:{n:'Привод',dir:[.25,.4,1],ids:['clutchMaster','clutch','clutchSlave','gearbox','gears','shiftMech','shiftLink','driveshaft','pivots','swingarm','strut','finaldrive','fdgear','fdfill','fddrain','wheelR'],ctx:['bars'],always:[],noFrame:['clutchMaster']},
 brakes:{n:'Тормоза',dir:[.75,.55,1],ids:['brakeF','brakeR','resF','resR','abs','brakeLines','rearMaster','wheelSensors'],ctx:['wheelF','wheelR','fork','bars','frame'],always:['resR']},
 elec:{n:'Электрика',dir:[-.55,.75,-1],ids:['harness','underseat','battery','ecu','relays','diag','powerCables','regulator','alternator','starter','coilL','coilR','connL','connR','plugL','plugR','sensors','lambda','flap','abs','wheelSensors','instrument','light','horn','tail','standSwitch','fuelPump','iat','loom'],
   ctx:['frame','tank','seat','crankcase','cylL','cylR','headL','headR','coverL','coverR','gearbox','bars','fork','wheelF','wheelR'],open:true}};
/* hand-built parts that are outside on the real bike: always shown, like the scanned shell */
['oilfilter','drainplug','fdfill','fddrain'].forEach(id=>{if(P[id])P[id].ext=true;});
Object.values(SYSDEF).forEach(S=>{S.set=new Set(S.ids);S.ctxSet=new Set(S.ctx);S.always=S.always||[];});
const SUBK=0.7;                               /* how far the pieces inside one part fly apart, relative to their distance from the part centre */
/* every procedural part: put each child into its own wrapper, so the wrapper can move the child away without touching its animation */
function objBox(o){const b=new THREE.Box3();o.updateMatrixWorld(true);
  o.traverse(m=>{if(!(m.isMesh||m.isLine)||!m.geometry)return;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();const gb=m.geometry.boundingBox;
    if(m.isInstancedMesh){const q=new THREE.Matrix4(),w=new THREE.Matrix4();for(let i=0;i<m.count;i++){m.getMatrixAt(i,q);w.multiplyMatrices(m.matrixWorld,q);b.union(gb.clone().applyMatrix4(w));}}
    else b.union(gb.clone().applyMatrix4(m.matrixWorld));});return b;}
function wrapPart(p){const out=[];
  const rec=g=>{const items=g.children.filter(c=>c.isMesh||c.isLine||c.isGroup||c.type==='Object3D');
    const cs=items.map(c=>{const b=objBox(c);return b.isEmpty()?null:g.worldToLocal(b.getCenter(new V3()));});
    const ok=cs.filter(Boolean);
    if(ok.length>=2){const gc=new THREE.Box3().setFromPoints(ok).getCenter(new V3());
      items.forEach((c,i)=>{if(!cs[i])return;const W=new THREE.Group();W.userData.exw=true;const k=g.children.indexOf(c);g.children.splice(k,1,W);W.parent=g;c.parent=W;W.children.push(c);
        W.userData.dir=cs[i].clone().sub(gc);if(W.userData.dir.length()>200)W.userData.dir.setLength(200);out.push(W);});}
    items.forEach(c=>{if(!c.isMesh&&!c.isLine)rec(c);});};
  rec(p.g);p.wraps=out;}
root.updateMatrixWorld(true);
Object.values(P).forEach(p=>{if(p.layer==='tool'||p.layer==='fx')return;wrapPart(p);});
function applySub(p){const s=p.cur.sub||0;if(Math.abs(s-(p._ls||0))<1e-4)return;p._ls=s;
  if(p.wraps)p.wraps.forEach(W=>W.position.copy(W.userData.dir).multiplyScalar(SUBK*s));
  if(p.scanU)p.scanU.forEach(u=>u.value=SUBK*s);}
/* part boxes at home position (mm), system centres, automatic explode directions and camera views */
const SYSC={};
function partBox(p){const b=new THREE.Box3();p.g.updateMatrixWorld(true);
  p.g.traverse(o=>{if(!(o.isMesh||o.isLine)||o.userData.dead)return;if(p.scan&&!o.userData.scan)return;b.union(objBox(o));});
  if(b.isEmpty())return null;b.min.divideScalar(S);b.max.divideScalar(S);b.translate(p.home.clone().sub(p.g.position));return b;}
function computeSys(){const all=new THREE.Box3(),boxes={};
  Object.values(P).forEach(p=>{if(p.gone||p.layer==='tool'||p.layer==='fx')return;const b=partBox(p);if(b){boxes[p.id]=b;if(p.layer!=='internal'||p.wasBike)all.union(b);}});
  const scopes=Object.assign({bike:{ids:Object.keys(boxes),dir:[1,.45,1],n:'Общий'}},SYSDEF);
  Object.entries(scopes).forEach(([k,Sd])=>{const u=new THREE.Box3();Sd.ids.forEach(id=>{if(boxes[id]&&!(Sd.noFrame&&Sd.noFrame.includes(id)))u.union(boxes[id]);});if(u.isEmpty())return;
    const c=u.getCenter(new V3()),r=u.getSize(new V3()).length()/2;SYSC[k]=c;
    Sd.ids.forEach(id=>{const p=P[id],b=boxes[id];if(!p||!b)return;const v=b.getCenter(new V3()).sub(c);let n=v.length()>1?v.clone().normalize():new V3(0,1,0);
      const shell=!!p.scan;p.sysEx=p.sysEx||{};const e=(Sd.noFrame&&Sd.noFrame.includes(id))?p.ex.clone().multiplyScalar(.4):v.clone().multiplyScalar(shell?1.1:0.5).addScaledVector(n,shell?110:45);if(b.min.y+e.y<15)e.y=15-b.min.y;p.sysEx[k]=e;});
    if(k!=='bike'){const d=new V3(...Sd.dir).normalize();VIEWS['sys_'+k]={p:c.clone().addScaledVector(d,Math.max(700,r*2.7)).toArray(),t:c.toArray(),n:Sd.n.toUpperCase()};}});}
computeSys();
const CLIP=new THREE.Plane(new V3(1,0,0),0);renderer.localClippingEnabled=true;
function setClip(p,on){if(!!p._clip===on)return;p._clip=on;p.g.traverse(o=>{if(!o.isMesh||!o.userData.scan)return;const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.clippingPlanes=on?[CLIP]:null;m.needsUpdate=true;});});}
function updateClip(){if(!cutPlane)return;const c=controls.target.clone();
  const n=c.clone().sub(camera.position);n.y*=0.25;n.normalize();CLIP.normal.copy(n);CLIP.constant=-n.dot(c);}

/* ---------- SERVICE DATA ---------- */
const OPS=[
 {id:'oilLevel',t:'Проверить уровень масла',when:'Каждую третью заправку',diff:1,time:'10 мин',
  keys:'масло уровень окошко долить доливать мин макс расход',
  need:['Масло 15W-50, API SJ или JASO MA2, без молибденовых присадок','Штатный набор: рукоятка отвёртки и крестовая бита'],
  keep:['crankcase','sightglass','filler','cylL','cylR','headL','headR','coverL','coverR','gearbox','oilfilter','drainplug'],
  steps:[
   {h:'Прогрей двигатель',v:'engine',f:['crankcase'],x:'Уровень меряют только на горячем двигателе, после нормальной поездки. На холодном масло ещё не стекло и уровень врёт.'},
   {h:'Поставь мотоцикл ровно',v:'overall',f:['wheelF','wheelR'],x:'Ровная твёрдая площадка, мотоцикл держишь вертикально, не на боковой подножке. Заглуши и подожди 5 минут, пока масло стечёт в картер.',w:'На боковой подножке окошко покажет неправду: мотоцикл наклонён влево.'},
   {h:'Смотри в окошко слева',v:'leftLow',f:['sightglass'],x:'Окошко слева внизу картера. Масло должно быть между MIN и MAX. Между метками ровно 0,5 л.',facts:[['Норма','между MIN и MAX'],['MIN → MAX','0,5 л']]},
   {h:'Если ниже MIN: долей',v:'rightSide',f:['filler'],off:['filler'],x:'Пробка заливной горловины справа сверху. Вставь крестовую биту в рукоятку отвёртки из штатного набора, открути против часовой. Доливай понемногу, за раз не больше 0,5 л.',facts:[['Масло','15W-50'],['Долив макс.','0,5 л']],w:'Выше MAX тоже плохо: лишнее масло выдавливает через сапун. Если перелил, нужно сливать.'},
   {h:'Закрой и перепроверь',v:'leftLow',f:['filler','sightglass'],x:'Закрути пробку рукой до упора, через минуту снова посмотри в окошко.'}
  ]},
 {id:'oilChange',t:'Замена масла и фильтра',when:'Каждые 10 000 км или раз в год',diff:2,time:'45-60 мин',
  keys:'масло замена фильтр слить сливная пробка то техобслуживание',
  need:['Масло 15W-50 API SJ / JASO MA2, 4 л (в двигатель входит до 3,8 л)','Фильтр BMW 11 42 7 673 541 или Hiflofiltro HF164','Новое уплотнительное кольцо сливной пробки','Съёмник фильтра (чашка под твой фильтр)','Динамометрический ключ малого диапазона','Поддон на 5 л, перчатки, ветошь'],
  keep:['crankcase','oilfilter','drainplug','sightglass','filler','gearbox','cylL','cylR','headL','headR','coverL','coverR','beltcover'],
  steps:[
   {h:'Прогрей 5 минут',v:'engine',f:['crankcase'],x:'Тёплое масло жидкое и сливается почти полностью. Не перегревай: под двигателем идут выпускные трубы.',w:'Коллекторы под картером горячие. Перчатки обязательно.'},
   {h:'Мотоцикл ровно, поддон под двигатель',v:'sump',f:['crankcase'],x:'Центральной подножки у Scrambler нет. Лучше всего задний подкат под ось колеса, или держи вертикально с помощником.'},
   {h:'Открой заливную пробку',v:'filler',f:['filler'],off:['filler'],x:'Чёрная круглая пробка сверху на правой крышке клапанов. Очисти вокруг, вставь биту из бортового набора крестом вперёд в рукоятку отвёртки, поставь на замок пробки, поверни против часовой и сними. Открываешь до слива: масло уйдёт быстрее и без бульканья.',facts:[['Инструмент','бита из бортового набора + рукоятка']]},
   {h:'Открути сливную пробку',v:'sump',f:['drainplug'],off:['drainplug'],x:'Пробка внизу картера. Последние витки откручивай пальцами и сразу уводи руку в сторону, масло пойдёт струёй. Сливай минут 10.',facts:[['Резьба','M16x1,5']]},
   {h:'Сними старый фильтр',v:'filter',f:['oilfilter'],off:['oilfilter'],x:'Фильтр снизу спереди картера, вкручен вертикально. Съёмник-чашка, против часовой. Из фильтра тоже течёт, держи поддон под ним.'},
   {h:'Поставь новый фильтр',v:'filter',f:['oilfilter'],x:'Протри посадочное место. Смажь резиновое кольцо нового фильтра свежим маслом, накрути рукой до касания, затем дотяни ключом.',facts:[['Момент','11 Нм','tq']]},
   {h:'Закрути сливную пробку',v:'sump',f:['drainplug'],x:'Новое уплотнительное кольцо, протри пробку, закрути рукой и дотяни динамометром.',facts:[['Момент','32 Нм','tq'],['Кольцо','новое']]},
   {h:'Залей масло',v:'rightSide',f:['filler'],off:['filler'],x:'Залей 3,5 л. Закрой пробку, заведи на минуту, заглуши, подожди 5 минут. Доливай по окошку до середины между MIN и MAX.',facts:[['Объём','до 3,8 л'],['Масло','15W-50']]},
   {h:'Проверь окошко и течи',v:'leftLow',f:['sightglass','drainplug','oilfilter'],x:'Уровень в окошке между MIN и MAX. Посмотри снизу, что пробка и фильтр сухие. Отработку сдай в пункт приёма.',w:'Индикатор ТО на приборе сбрасывается диагностическим тестером (ISTA или сторонний адаптер). На работу мотоцикла не влияет.'}
  ]},
 {id:'spark',t:'Замена свечей',when:'Каждые 20 000 км или если троит',diff:2,time:'30-40 мин',
  keys:'свеча свечи зажигание катушка троит пропуски не заводится дёргается колодец',
  need:['2 свечи NGK MAR8B-JDS','Свечная головка 14 мм тонкостенная, с резинкой или магнитом, привод 3/8"','Удлинитель 3/8", 10-15 см','Трещотка 3/8"','Динамометрический ключ 1/4" на 2-25 Нм (нужно выставить 12 Нм)','Плоский щуп 0,8 мм','Сжатый воздух: компрессор с пистолетом или баллончик','Очки, перчатки','По желанию: диэлектрическая силиконовая смазка'],
  keep:['cylR','headR','coverR','coilR','connR','plugR','wellR','wellL','cylL','headL','coverL','coilL','connL','plugL','crankcase'],
  steps:[
   {h:'Только на холодном двигателе',v:'headR',f:['headR','headL'],x:'Мотоцикл простоял минимум 2-3 часа. Резьба свечи в алюминиевой головке: на горячем двигателе её легко сорвать. Зажигание выключено, ключ вынут. Начинаем с правого цилиндра.',facts:[['Двигатель','холодный']],w:'Сорванная резьба в головке = снятие головки и ремонт. Ни одного движения через силу.'},
   {h:'Сними накладку катушки',v:'headRclose',f:['capR'],off:['capR'],x:'Катушку и её провод закрывает чёрная пластиковая накладка на крышке клапанов. Поддень её за край пластиковой лопаткой и сними на себя. Металлической отвёрткой не лезь: поцарапаешь крышку и сломаешь защёлки.',facts:[['Инструмент','пластиковая лопатка']]},
   {h:'Сними разъём с катушки',v:'headRclose',f:['connR'],off:['connR'],x:'Под накладкой верхушка катушки, на ней пластиковый разъём. Провод от него идёт вниз по каналу под накладкой, снаружи его не видно. Нажми пальцем на защёлку и сними разъём, держа за пластиковый корпус. За провода не тяни.',facts:[['Инструмент','руки']]},
   {h:'Вытащи катушку из колодца',v:'headRclose',f:['coilR'],off:['connR','coilR'],x:'Возьмись за верхушку катушки и тяни строго наружу, по оси цилиндра. Она длинная, около 10 см, внизу резиновый наконечник сидит на свече. Если туго, поворачивай вправо-влево на 10-20 градусов и тяни. Вбок не гни.',facts:[['Ход','~10 см'],['Инструмент','руки']]},
   {h:'Загляни в колодец',v:'wellR',f:['plugR','wellR'],off:['connR','coilR'],show:['dirtR'],x:'Теперь в крышке открытое отверстие: это колодец свечи, глубиной около 12 см. На дне видно шестигранник свечи и белый изолятор. Вокруг на дне песок и грязь, их надо убрать до того, как трогаешь свечу.'},
   {h:'Продуй колодец',v:'wellX',xray:true,f:['dirtR'],off:['connR','coilR'],show:['dirtR','toolAirR'],anim:'blow',x:'Голова и крышка тут показаны прозрачными, чтобы было видно колодец насквозь. Надень очки. Сопло пистолета или трубочку баллончика к краю колодца, короткими нажатиями 3-4 раза. Мусор вылетает наружу. Посвети фонариком: на дне должно быть чисто.',facts:[['Чем','сжатый воздух'],['Нельзя','WD-40, силикон, очиститель']],w:'Ничего не пшикай в колодец. Жидкость стечёт к свече и в цилиндр.'},
   {h:'Выкрути старую свечу',v:'wellX',xray:true,f:['plugR','toolSocketR'],off:['connR','coilR'],show:['toolSocketR'],anim:'unscrew',x:'Головку 14 мм на удлинитель, удлинитель на трещотку, трещотка на «откручивание». Опусти головку в колодец до посадки на шестигранник. Первое усилие тугое, потом свеча идёт легко. Резинка в головке вытащит свечу наружу.',facts:[['Головка','14 мм тонкостенная'],['Удлинитель','3/8", 10-15 см'],['Направление','против часовой']],w:'Динамометром не откручивают, только трещоткой. Если свеча тугая на всём ходу, вкрути на пол-оборота обратно и снова выкручивай.'},
   {h:'Посмотри на старую свечу',v:'plugOut',f:['plugR'],off:['connR','coilR','plugR'],x:'Нагар на свече показывает, как работал цилиндр. Светло-коричневый и сухой: норма. Мокрая, чёрная, пахнет бензином: искры не было. Белая, сухая: бедная смесь или подсос воздуха. Чёрная в масле: кольца или маслосъёмные колпачки, нужен мастер. Трещина на белой керамике: свеча дохлая.'},
   {h:'Проверь зазор новой свечи',v:'gap',f:['toolGaugeR'],off:['connR','coilR','plugR','toolGaugeR'],show:['toolGaugeR'],x:'У MAR8B-JDS два боковых электрода. Щуп 0,8 мм вставляешь между центральным электродом и каждым боковым: должен проходить с лёгким касанием. Новые свечи приходят с правильным зазором.',facts:[['Свеча','NGK MAR8B-JDS'],['Зазор','0,8 мм']],w:'Если зазор не 0,8, электроды не гни, свечу верни в магазин.'},
   {h:'Наживи новую свечу пальцами',v:'wellX',xray:true,f:['plugR','toolExtR'],off:['connR','coilR'],show:['toolExtR'],anim:'screwin',x:'Резьбу ничем не мажь. Вставь свечу в головку, опусти в колодец и крути за удлинитель пальцами по часовой. Свеча должна легко пройти 3-4 оборота и сесть до упора.',facts:[['Чем','пальцы на удлинителе'],['Направление','по часовой'],['Смазка резьбы','нет']],w:'Пошла туго с первого оборота: это перекос. Выкрути и начни заново.'},
   {h:'Затяни динамометром',v:'torque',xray:true,f:['toolTorqueR'],off:['connR','coilR'],show:['toolTorqueR'],anim:'torque',x:'Выставь на ключе 12 Нм. Поставь на удлинитель и тяни за рукоятку плавно, одним движением, до щелчка. После щелчка больше не тянешь.',facts:[['Момент','12 Нм','tq'],['Ключ','1/4", 2-25 Нм'],['Резьба','M10x1']]},
   {h:'Смажь наконечник и поставь катушку',v:'headRclose',f:['coilR'],off:['connR'],x:'Если есть диэлектрическая силиконовая смазка, нанеси тонкий слой на внутреннюю кромку резинового наконечника внизу катушки. Вставь катушку в колодец до упора: почувствуешь, как она села на свечу.',facts:[['Смазка','диэлектрическая, тонко, по желанию']]},
   {h:'Надень разъём до щелчка',v:'headRclose',f:['connR'],off:['capR'],x:'Разъём на верхушку катушки до щелчка защёлки. Провод уложи обратно в канал. Подёргай за корпус: не должен сниматься без нажатия на защёлку.'},
   {h:'Поставь накладку на место',v:'headRclose',f:['capR'],x:'Приложи накладку так, чтобы провод лёг в канал под ней, и прижми ладонью до щелчка защёлок по всему краю.'},
   {h:'Левый цилиндр и пуск',v:'headL',f:['coilL','connL','plugL'],x:'Слева всё то же самое, в том же порядке. Потом заведи: работа ровная, на холостых не трясёт. Если троит, сначала проверь разъёмы катушек, потом работа «Какой цилиндр не работает».'}
  ]},
 {id:'coilSwap',t:'Перекинуть катушки (проверка)',when:'Когда один цилиндр не работает',diff:1,time:'15 мин + остывание',
  keys:'катушка катушки перекинуть поменять местами проверить троит зажигание',
  need:['Малярный скотч и маркер','Пирометр или пульверизатор с водой'],
  keep:['cylR','headR','coverR','coilR','connR','plugR','cylL','headL','coverL','coilL','connL','plugL','crankcase','headers'],
  steps:[
   {h:'Сначала найди мёртвый цилиндр',v:'headersFront',f:['headers'],x:'Холодный пуск на 20-30 секунд, заглуши, пирометром по выпускным трубам в 5-10 см от головок. Холодная труба = неработающий цилиндр. Запиши, левый или правый.'},
   {h:'Сними накладки с обеих',v:'coilsBoth',f:['capL','capR'],off:['capL','capR'],x:'На каждой крышке клапанов чёрная пластиковая накладка закрывает катушку и её провод. Поддень за край пластиковой лопаткой и сними.'},
   {h:'Подпиши катушки',v:'coilsBoth',f:['coilL','coilR'],x:'Наклей на верхушку каждой катушки кусок малярного скотча и подпиши: Л и П. Без этого тест бессмысленный.',facts:[['Чем','скотч, маркер']]},
   {h:'Сними разъёмы с обеих',v:'coilsBoth',f:['connL','connR'],off:['connL','connR'],x:'На каждой нажми защёлку и сними разъём за корпус.'},
   {h:'Вытащи обе катушки',v:'coilsBoth',f:['coilL','coilR'],off:['coilL','coilR'],x:'Каждую тяни строго наружу по оси цилиндра, покачивая на 10-20 градусов. Положи на чистое.'},
   {h:'Поставь крест-накрест',v:'coilsBoth',f:['coilL','coilR'],off:['capL','capR'],x:'Катушку Л вставь в правый цилиндр, катушку П в левый. До упора, до посадки на свечу.'},
   {h:'Разъёмы до щелчка',v:'coilsBoth',f:['connL','connR'],off:['capL','capR'],x:'Каждый разъём на свою катушку до щелчка. Разъёмы не перекидываешь, они остаются на своей стороне.'},
   {h:'Накладки на место',v:'coilsBoth',f:['capL','capR'],x:'Провода в каналы, накладки прижми до щелчка.'},
   {h:'Повтори проверку',v:'headersFront',f:['headers'],x:'Дай двигателю остыть и снова холодный пуск с замером труб. Мёртвый цилиндр переехал на другую сторону: виновата катушка, покупаешь новую. Остался на месте: катушка жива, меняем свечу.'}
  ]},
 {id:'deadCyl',t:'Какой цилиндр не работает',when:'Если троит, дёргается, пропала тяга',diff:2,time:'20 мин',
  keys:'троит троить пропуски один цилиндр не работает дергается дёргается холодный коллектор бензином воняет трясёт вибрация',
  need:['Пирометр (бесконтактный термометр), самый удобный вариант','Или пульверизатор с водой','Перчатки','Всё для операции «Замена свечей»'],
  keep:['headers','collector','silencers','headL','headR','cylL','cylR','coilL','coilR','connL','connR','plugL','plugR','crankcase'],
  steps:[
   {h:'По глушителям не определить',v:'exhaustL',f:['collector','silencers'],x:'Обе трубы коллектора сходятся под двигателем в один сборник с катализатором и лямбда-зондом. Дальше смешанный газ идёт в оба глушителя сразу. Поэтому из какого глушителя пахнет бензином, ничего не говорит: пахнуть будут оба.'},
   {h:'Холодный пуск на 30 секунд',v:'headersFront',f:['headers'],x:'Заведи холодный мотоцикл, дай поработать 20-30 секунд на холостых и заглуши. За это время рабочий цилиндр успеет заметно прогреть свою трубу, а мёртвый нет.'},
   {h:'Сравни температуру труб у головок',v:'headersFront',f:['headers'],x:'Пирометром меряй каждую трубу в 5-10 см от головки. Рабочая уже горячая, неработающая заметно холоднее. Без пирометра: брызни водой из пульверизатора, на рабочей зашипит.',w:'Руками трубы не трогай: рабочая через 30 секунд уже обжигает.'},
   {h:'Поменяй катушки местами',v:'engine',f:['coilL','coilR'],x:'Холодный цилиндр нашёл. Переставь катушку с него на другой цилиндр и наоборот, снова сделай пуск и замер. Проблема переехала на другую сторону: виновата катушка. Осталась на месте: свеча, форсунка или компрессия.'},
   {h:'Посмотри на свечу',v:'headRclose',f:['plugR','plugL'],off:['coilR','coilL'],x:'Выкрути свечу проблемного цилиндра, как в операции «Замена свечей». Мокрая, чёрная, пахнет бензином: искры нет, меняй свечу. Сухая и белая: бедная смесь или подсос воздуха. В масле: к мастеру, это кольца или сальники клапанов.'},
   {h:'Свеча и катушка живы',v:'engine',f:['throttle'],x:'Дальше проверяют разъём форсунки на дросселе этого цилиндра и читают ошибки блока. Напиши мне, что увидел на свече, разберём следующий шаг.'}
  ]},
 {id:'valves',t:'Проверка зазоров клапанов',when:'Каждые 10 000 км',diff:4,time:'1,5-2 часа',
  keys:'клапан клапана зазор зазоры щуп цокает стучит тикает грм распредвал',
  need:['Набор плоских щупов 0,05-1,0 мм с шагом 0,01-0,05','2 новые прокладки крышек клапанов','Головка Torx под болты крышки (размер сверь по болту)','Динамометрический ключ 1/4" на 10 Нм','Задний подкат или помощник, чтобы держать мотоцикл ровно','Бумага и ручка для 8 замеров'],
  flags:['Допуски зазоров взяты по двигателю DOHC 2010-2020. Перед работой сверим с сервисной таблицей BMW по твоему VIN'],
  keep:['cylR','headR','coverR','coilR','connR','plugR','wellR','camsR','cylL','headL','coverL','coilL','connL','plugL','wellL','camsL','crankcase','wheelR','gearbox','finaldrive','swingarm'],
  steps:[
   {h:'Двигатель полностью холодный',v:'engine',f:['headR','headL'],x:'Зазоры меряют только на остывшем двигателе, лучше утром после ночи. На тёплом металл расширен, цифры будут неправильные.'},
   {h:'Сними катушки и свечи',v:'headR',f:['coilR','plugR','coilL','plugL'],off:['coilR','plugR','coilL','plugL'],x:'Как в работе «Замена свечей»: разъём, катушка, продуть колодец, свеча. Без свечей нет компрессии, и двигатель легко провернуть колесом.'},
   {h:'Сними правую крышку клапанов',v:'headR',f:['coverR'],off:['coilR','plugR','coilL','plugL','coverR'],x:'Выкрути болты крышки по кругу, по пол-оборота каждый, чтобы её не перекосило. Сними крышку прямо на себя. Прилипла: постучи ладонью по краю, отвёрткой не поддевай, поцарапаешь плоскость. С внутренней стороны резиновая прокладка, её меняешь на новую.',facts:[['Болты','M6, Torx'],['Прокладка','новая']]},
   {h:'Что внутри головки',v:'headOpen',f:['camsR'],off:['coilR','plugR','coilL','plugL','coverR'],x:'Два распредвала лежат вдоль мотоцикла, один над другим. Верхний открывает два верхних клапана, нижний два нижних. На каждом валу два кулачка: задний для впуска, передний для выпуска. Кулачок давит на рокер (рычаг на оси), рокер давит на клапан. На нижнем валу звёздочка цепи, верхний крутится от нижнего через шестерню. Крышки подшипников на болтах не трогаешь.'},
   {h:'Поставь цилиндр в ВМТ сжатия',v:'headOpen',f:['camsR','wheelR'],off:['coilR','plugR','coilL','plugL','coverR'],anim:'tdc',x:'Включи 5-ю передачу. Медленно крути заднее колесо рукой по ходу движения: распредвалы поворачиваются. Остановись, когда все четыре кулачка правого цилиндра смотрят носами от рокеров. Тогда все четыре клапана закрыты и между круглой частью кулачка и рокером есть щель.',w:'Крути только по ходу движения, назад не надо.'},
   {h:'Меряй щупом каждый клапан',v:'gapView',xray:true,f:['toolFeelerR'],off:['coilR','plugR','coilL','plugL','coverR'],show:['toolFeelerR'],anim:'feel',x:'Щуп заводишь сбоку, плоско, в щель между круглой частью кулачка и площадкой рокера. Подбирай толщину: щуп входит с лёгким сопротивлением, как лист бумаги под книгой. Болтается: бери толще. Не лезет: тоньше. Запиши, какой лезет, для всех четырёх клапанов: впуск верхний и нижний, выпуск верхний и нижний.',facts:[['Впуск, сзади','0,10-0,17 мм','flag'],['Выпуск, спереди','0,34-0,41 мм','flag']]},
   {h:'Проверка «проходит / не проходит»',v:'gapView',xray:true,f:['toolFeelerR'],off:['coilR','plugR','coilL','plugL','coverR'],show:['toolFeelerR'],anim:'feel',x:'Самый надёжный способ для первого раза. Впуск: щуп 0,10 должен проходить, щуп 0,17 уже не должен. Выпуск: 0,34 проходит, 0,41 нет. Если так, клапан в допуске.',w:'Если хоть один зазор вне допуска, регулировка идёт заменой регулировочных шайб со снятием распредвалов. Это следующий уровень: запиши цифры и разберём отдельно.'},
   {h:'Крышку на место',v:'headR',f:['coverR'],off:['coilR','plugR','coilL','plugL'],x:'Протри плоскости головки и крышки. Новая прокладка, крышка ровно на место. Болты сначала рукой, потом динамометром крест-накрест.',facts:[['Момент','10 Нм','tq'],['Порядок','крест-накрест']]},
   {h:'Левый цилиндр',v:'headL',f:['coverL','camsL'],off:['coilR','plugR','coilL','plugL','coverL'],x:'Крути колесо дальше, около одного оборота коленвала: теперь носами от рокеров встанут кулачки левого цилиндра. Меряй так же, крышка на 10 Нм.'},
   {h:'Свечи и катушки на место',v:'engine',f:['plugR','plugL','coilR','coilL'],x:'Свечи 12 Нм, катушки до упора, разъёмы до щелчка. Выключи передачу, убери подкат, заведи и послушай: ровно, без цоканья.'}
  ]},
 {id:'fd',t:'Масло в главной передаче',when:'Раз в 2 года или каждые 20 000 км',diff:2,time:'30 мин',
  keys:'кардан редуктор главная передача задний мост гипоид масло сзади гул шум',
  need:['Hypoid Axle Oil G3 (по каталогу BMW, 83 22 2 460 128, 0,5 л)','Шприц или бутылка с трубкой','2 новых уплотнительных кольца пробок','Динамометрический ключ (20 Нм)'],
  flags:['Объём около 0,18 л взят из данных для R nineT; заливай до нижнего края заливного отверстия, это надёжнее цифры'],
  keep:['finaldrive','fdfill','fddrain','swingarm','wheelR','brakeR','fdgear','driveshaft','strut'],
  steps:[
   {h:'Прокатись 10 минут',v:'drive',f:['finaldrive'],x:'Тёплое масло сливается лучше. Мотоцикл потом ставь вертикально.'},
   {h:'Как устроен привод',v:'fd',xray:true,f:['fdgear','driveshaft','strut'],x:'Коробка крутит карданный вал внутри правой трубы маятника. У вала два карданных шарнира и шлицевое соединение, оно меняет длину, когда маятник ходит. Задний шарнир крутит пинион (11 зубьев), пинион крутит большую гипоидную шестерню (32 зуба), она через фланец с пятью болтами крутит колесо. Масло, которое ты меняешь, смазывает именно эту пару шестерён и её подшипники. Сверху реактивная тяга держит корпус от проворачивания.'},
   {h:'Найди редуктор',v:'fd',f:['finaldrive'],x:'Редуктор в ступице заднего колеса, справа, на конце маятника. Подложи поддон.'},
   {h:'Открути заливную пробку',v:'fd',f:['fdfill'],off:['fdfill'],x:'Сначала заливную: она сбоку на корпусе, сзади и чуть ниже оси колеса. Если не откручивается, сливную не трогай: иначе останешься со слитым редуктором и без возможности залить.',facts:[['Резьба','M12x1,5']]},
   {h:'Открути сливную, слей',v:'fd',f:['fddrain'],off:['fdfill','fddrain'],x:'Сливная пробка внизу корпуса. Посмотри на магнит или на слитое масло: мелкая серая взвесь нормальна, крупная стружка = к мастеру.'},
   {h:'Закрути сливную',v:'fd',f:['fddrain'],off:['fdfill'],x:'Новое кольцо, затяни динамометром.',facts:[['Момент','20 Нм','tq']]},
   {h:'Залей и закрой',v:'fd',f:['fdfill'],x:'Заливай шприцем, пока масло не дойдёт до нижнего края заливного отверстия. Пробка с новым кольцом.',facts:[['Масло','70W-80 гипоид'],['Объём','~0,18 л','flag'],['Момент','20 Нм','tq']]}
  ]},
 {id:'brakes',t:'Тормоза: колодки и жидкость',when:'Каждую третью заправку',diff:1,time:'10 мин',
  keys:'тормоз тормоза колодки диск скрип жидкость dot суппорт бачок',
  need:['Фонарик','Глаза'],
  keep:['brakeF','brakeR','wheelF','wheelR','fork','bars','resF','resR'],
  steps:[
   {h:'Передние колодки',v:'brakeF',f:['brakeF'],x:'Смотри между колесом и вилкой на суппорт, с обеих сторон. На накладке должно остаться не меньше 1 мм, канавки-индикаторы должны быть видны.',facts:[['Минимум','1,0 мм накладки']]},
   {h:'Задние колодки',v:'brakeR',f:['brakeR'],x:'Между колодками торчит ось с тремя кольцами. 3 кольца видно: колодок больше 75%. 2: больше 50%. 1: больше 25%. Ни одного: предел, меняй.'},
   {h:'Бачок передних тормозов',v:'barR',f:['resF'],x:'Справа на руле. Руль прямо, мотоцикл вертикально, бачок горизонтально. Уровень не ниже MIN. По мере износа колодок уровень падает, это нормально.',facts:[['Жидкость','DOT 4']]},
   {h:'Бачок заднего тормоза',v:'resR',f:['resR'],x:'Справа у подножки. Уровень не ниже MIN при вертикальном мотоцикле.',facts:[['Жидкость','DOT 4']],w:'Замена колодок и прокачка на мотоцикле с ABS: в мануале это работа для мастерской. Освоим после базы.'}
  ]},
 {id:'clutch',t:'Сцепление: проверка и рычаг',when:'Перед каждой поездкой и если буксует',diff:1,time:'5 мин',
  keys:'сцепление буксует рычаг выжим ход точка срабатывания диск',
  need:['Ничего, только руки','Для регулировки: ничего, винт крутится рукой'],
  keep:['clutch','clutchSlave','crankcase','gearbox','bars'],
  steps:[
   {h:'Где стоит сцепление',v:'clutch',xray:true,f:['clutch'],x:'Сухое однодисковое сцепление сидит сзади на коленвале, в колоколе картера перед коробкой. Корпус с лепестками пружины привинчен к фланцу коленвала, за ним нажимной диск с венцом стартера, ведомый диск на шлицах первичного вала и крышка. Пружина зажимает ведомый диск, и двигатель крутит коробку.'},
   {h:'Как работает выжим',v:'clutch',xray:true,f:['clutchSlave','clutch'],x:'Рычаг слева давит жидкость в магистраль. Рабочий цилиндр сзади на коробке толкает шток, шток идёт внутри полого первичного вала и давит в центр нажимного диска. Тот отходит на несколько миллиметров, ведомый диск освобождается и останавливается вместе с коробкой. Во вкладке «Двигатель» нажми «Выжать сцепление»: увидишь, как диск встаёт, а двигатель крутится.'},
   {h:'Проверь точку срабатывания',v:'barL',f:['bars','clutchSlave'],x:'По инструкции BMW: нажми рычаг сцепления, должна ощущаться явная точка срабатывания. Если её нет, рычаг проваливается или сцепление не выключается полностью, мотоцикл в сервис: обычно это воздух в приводе или утечка.',w:'Не регулируй рычаг на ходу.'},
   {h:'Отрегулируй рычаг под руку',v:'barL',f:['bars'],x:'На остановленном мотоцикле поверни регулировочный винт рычага с лёгким нажимом сзади. Положение 1: рычаг ближе всего к ручке, положение 5: дальше всего. Винт крутится легче, если отжать рычаг вперёд.'},
   {h:'Признаки износа',v:'clutch',xray:true,f:['clutch'],x:'Буксует на высокой передаче при резком газе: обороты растут, скорость нет. Это износ накладок ведомого диска или масло на нём от сальника коленвала или первичного вала. Сухое сцепление меняют снятием коробки, это работа для сервиса. Болты M6 крышки сцепления при разборке ставят новые.'}
  ]}
];
OPS.forEach(o=>{['L','R'].forEach(k=>{if(o.keep.some(x=>x==='coil'+k))o.keep.push('cap'+k);});o.steps.forEach(s=>{if(s.off)['L','R'].forEach(k=>{if(s.off.some(x=>x==='coil'+k||x==='conn'+k)&&s.off.indexOf('cap'+k)<0)s.off.push('cap'+k);});});});
OPS.forEach(o=>o.keep.concat(o.steps.flatMap(s=>s.f)).forEach(id=>P[id]&&P[id].ops.indexOf(o.id)<0&&P[id].ops.push(o.id)));

/* ---------- CONTOURS: what flows where, end to end ---------- */
const FP=fpt(560);
const CONTOURS=[
 {id:'air',n:'Воздух',c:'#5fb4ff',chain:'Заборник справа → воздуховод под баком → корпус с фильтром → два патрубка → дроссели → впускные клапаны',
  parts:['intakeDuct','airbox','airfilter','iat','throttle','headL','headR','breather','tank'],
  paths:[[[1090,716,112],[980,722,110],[860,712,106],[740,690,100],[668,668,92],[600,640,40],[600,560,100],[614,502,166],[660,502,240],[740,502,250],[860,480,250]],
         [[600,640,-20],[600,560,-100],[614,502,-166],[660,502,-240],[740,502,-250],[860,480,-250]]]},
 {id:'fuel',n:'Топливо',c:'#ffb020',chain:'Бак → насос с фильтром в баке → напорная трубка → распределитель → форсунки → цилиндры. Пары из бака → адсорбер → клапан продувки → дроссель',
  parts:['tank','fuelPump','fuelLine','canister','fuelCap','throttle'],
  paths:[[[820,800,0],[820,736,0],[800,700,-30],[770,660,-40],[742,630,0],[744,622,100],[748,606,190],[748,560,250],[840,480,250]],
         [[742,630,0],[744,622,-100],[748,606,-190],[748,560,-250],[840,480,-250]],
         [[530,705,-30],[470,690,-70],[400,600,-60],[404,540,0],[440,560,160],[600,540,220],[700,532,252]]]},
 {id:'elec',n:'Электрика и зажигание',c:'#ffe34d',chain:'Генератор → регулятор → аккумулятор → предохранители и реле → блок управления → катушки → свечи. Аккумулятор → реле → стартер',
  parts:['harness','underseat','alternator','belt','beltcover','regulator','battery','relays','powerCables','ecu','loom','coilL','coilR','connL','connR','plugL','plugR','starter','sensors','iat','lambda','diag','horn','instrument','light','tail','bars'],
  paths:[[[1072,644,0],[1075,650,-60],[1080,690,-110],[1000,760,-104],[740,700,-128],[600,680,-126],[450,772,-100],[370,745,0]],
         [[370,745,0],[280,745,0],[200,740,0]],
         [[200,740,0],[450,772,100],[600,680,126],[740,700,128],[850,606,300],[890,560,392],[890,508,388],[890,470,330],[890,470,260]],
         [[200,740,0],[450,772,-100],[600,680,-126],[740,700,-128],[850,606,-300],[890,560,-392],[890,508,-388],[890,470,-330],[890,470,-260]],
         [[330,749,-26],[330,700,-90],[420,560,-140],[560,450,-160],[632,442,-170]]]},
 {id:'oil',n:'Смазка и охлаждение',c:'#e2a23b',chain:'Поддон → масляный насос → фильтр → коленвал и головки → радиатор спереди → обратно в поддон',
  parts:['crankcase','oilpump','oilfilter','oilLines','cooler','sightglass','filler','drainplug','breather','cylL','cylR','headL','headR'],
  paths:[[[920,290,0],[980,300,0],[1020,330,0],[1060,340,0],[1060,370,-110],[1085,400,-110],[1105,450,-100],[1110,540,-100],[1105,620,-70],[1105,450,-40],[1090,420,-60],[1060,400,-90],[980,470,0],[890,490,0]],
         [[890,490,0],[890,510,150],[890,520,270]],[[890,490,0],[890,510,-150],[890,520,-270]]]},
 {id:'exh',n:'Выпуск',c:'#ff6a3d',chain:'Выпускные клапаны → коллекторы → сборник с катализатором и лямбда-зондом → заслонка → два глушителя слева',
  parts:['headL','headR','headers','collector','lambda','flap','silencers'],
  paths:[[[900,450,250],[990,440,215],[1080,420,200],[1112,330,170],[1100,230,130],[1040,195,90],[900,190,40],[800,195,0],[650,200,-40],[500,215,-100],[420,240,-125],[335,285,-140],[150,390,-180],[-60,505,-215],[-110,520,-220]],
         [[425,236,-124],[460,340,-148],[390,421,-160],[210,515,-185],[10,612,-203],[-50,640,-210]],
         [[950,450,-250],[1040,440,-215],[1110,410,-200],[1114,320,-170],[1100,230,-130],[1040,195,-90],[900,190,-40],[800,195,0]]]},
 {id:'drive',n:'Трансмиссия',c:'#8fdc5a',chain:'Поршни → коленвал → сухое сцепление → коробка 6 передач → карданный вал → конический редуктор → заднее колесо',
  parts:['crank','pistonL','pistonR','clutch','gearbox','gears','driveshaft','swingarm','finaldrive','wheelR','clutchSlave','shiftLink','balancer','camchains'],
  paths:[[[890,470,170],[890,470,40],[820,470,0],[700,450,0],[640,430,0],[560,480,-28],[540,395,30],[470,395,96],[440,388,100],[60,317,105],[8,315,120],[0,315,40],[0,600,0]]]},
 {id:'brake',n:'Тормоза и ABS',c:'#ff4d6d',chain:'Рычаг и педаль → главные цилиндры → модулятор ABS → суппорты → диски. Датчики колёс → ABS',
  parts:['bars','resF','rearMaster','resR','abs','brakeLines','brakeF','brakeR','wheelSensors','wheelF','wheelR'],
  paths:[[[1100,1060,330],[1042,1056,206],[1100,1000,150],[1150,900,120],[1080,780,140],[800,700,150],[440,660,150],[400,672,120],[700,720,110],[1000,780,90],[1180,820,50],[FP.x+20,FP.y,0],[FP.x+10,FP.y-60,90],[1460,470,106],[1430,420,84]],
         [[FP.x+20,FP.y,0],[FP.x+10,FP.y-60,-90],[1460,470,-106],[1430,420,-84]],
         [[510,380,186],[450,450,176],[480,560,170],[420,622,150],[380,612,130],[300,500,120],[150,380,100],[-60,250,70],[-92,222,64]]]}
];
const SHELL=['tank','crankcase','gearbox','swingarm','finaldrive','airbox','headL','headR','cylL','cylR','coverL','coverR','beltcover','wheelR','wheelF'];
let activeSys=null,hoverId=null;const flowGroup=new THREE.Group();root.add(flowGroup);const FLOW=[];
function setFlow(c){while(flowGroup.children.length){const o=flowGroup.children.pop();o.geometry.dispose();}FLOW.length=0;if(!c)return;
  const mt=new THREE.MeshBasicMaterial({color:c.c,depthTest:false,transparent:true,opacity:1,toneMapped:false});const geo=new THREE.SphereGeometry(10,12,8);
  c.paths.forEach(p=>{const cv=new THREE.CatmullRomCurve3(p.map(q=>new V3(...q)),false,'centripetal');const L=cv.getLength(),n=Math.max(6,Math.round(L/70));
    const im=new THREE.InstancedMesh(geo,mt,n);im.renderOrder=20;flowGroup.add(im);FLOW.push({cv,L,n,im});});}
const _o=new THREE.Object3D();
function stepFlow(now){if(!FLOW.length)return;const t=RM?0:now/1000;FLOW.forEach(f=>{for(let i=0;i<f.n;i++){const u=((i/f.n)+t*220/f.L)%1;f.cv.getPointAt(u,_o.position);_o.updateMatrix();f.im.setMatrixAt(i,_o.matrix);}f.im.instanceMatrix.needsUpdate=true;});}

/* ---------- UI ---------- */
const panel=document.getElementById('panel'),hud=document.getElementById('hud');
let tab='bike',explode=0,autoRot=!RM,picked=null,curOp=null,curStep=0;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const SPECS=[['Двигатель','1170 см³, оппозит, 2 цилиндра'],['Диаметр × ход','101 × 73 мм'],['Мощность','110 л.с. / 7750 об/мин'],['Момент','116 Нм / 6000 об/мин'],['Сжатие','12,0 : 1'],['Охлаждение','воздух + масло'],['Коробка','6 ступеней, сухое сцепление'],['Привод','кардан; первичная 1,737, главная 2,91'],['Выпуск','два глушителя слева'],['Тюнинг','спицованные колёса, два глушителя'],['Колонка','угол 61,5°, вылет 110,6 мм'],['База','1527 мм'],['Бак','~18 л, резерв ~3 л'],['Шины','120/70 R17 · 180/55 R17'],['Давление','2,5 перед · 2,7 зад (2,9 вдвоём)'],['Масло','15W-50, до 3,8 л'],['Свечи','NGK MAR8B-JDS, 0,8 мм'],['Цвет','Monolith matt, чёрный двигатель и рама']];
const SOURCES=[
 ['Пресс-кит BMW R nineT Scrambler','https://www.press.bmwgroup.com/india/article/attachment/T0291595EN/425037'],
 ['Каталог выпуска Scrambler 2017','https://bmwparts.nashvillemotos.com/v-2017-bmw-motorrad-r-ninet-scrambler--base--r/exhaust-system--exhaust-system-parts-with-mounts'],
 ['Руководство владельца BMW R nineT (официальный PDF)','https://manuals.bmw-motorrad.com/manuals/BA-Extern/IN/BA-INTERNET-COM/PDF/R_0J01_RM_0219_01.pdf'],
 ['Регламент ТО Scrambler и Urban G/S 2017-2020','https://maintenanceschedule.com/bmw-r-ninet-scrambler-urban-g-s-2017/'],
 ['Моменты затяжки R nineT (форум bmwmotos.com)','https://www.bmwmotos.com/foro/goto/post?id=8939903'],
 ['Характеристики Scrambler 2020','https://www.motoplanete.us/used-motorcycle/758913/R-NineT-Scrambler/fiche.html'],
 ['Передаточные числа R nineT','https://www.motorcycle.com/specs/bmw/standard/2017/r-ninet/base/detail.html']];

function diffBars(n){let h='<span class="diff" aria-label="Сложность '+n+' из 5">';for(let i=1;i<=5;i++)h+='<i class="'+(i<=n?'on':'')+'"></i>';return h+'</span>';}

const SYSTXT={
 drive:{h:'Привод: от сцепления до колеса',lead:'Сухое однодисковое сцепление сзади на коленвале, шестиступенчатая коробка, карданный вал внутри маятника Paralever, гипоидная главная передача в ступице заднего колеса. Включи передачу и посмотри, как вращение идёт до колеса. Ползунок внизу разбирает узел на детали.',ops:['fd','clutch'],src:'Схемы BMW 21_0195, 23_*, 33_1226, 33_1622, 33_1626, 33_1627, 33_1651, 33_1873.'},
 brakes:{h:'Тормоза и ABS',lead:'Спереди два плавающих диска 320 мм с четырёхпоршневыми суппортами, сзади один диск 265 мм с двухпоршневым плавающим суппортом. Блок ABS сравнивает скорость колёс по датчикам и не даёт колесу заблокироваться. Бачки: передний на правом рычаге руля, задний у правой подножки.',ops:['brakes'],src:'Схемы BMW 34_* и инструкция владельца R nineT Scrambler.'},
 elec:{h:'Электрика',lead:'Генератор 720 Вт спереди на двигателе крутится ремнём от коленвала, через регулятор заряжает аккумулятор AGM 12 В 14 А·ч под сиденьем. Оттуда питание идёт через главное реле на блок управления двигателем, модуль «Свет», приборку, катушки, форсунки и датчики. Цвета жгутов на модели условные.',ops:['spark','coilSwap','deadCyl'],src:'Схемы BMW 61_3273, 61_3928, 61_5758, 61_5331, 61_5196, 12_2129, 13_1979.'}};
function hud3D(){if(!hud)return;
  hud.innerHTML=`<label class="slider" for="ex">Разобрать <input id="ex" type="range" min="0" max="100" value="${Math.round(explode*100)}"></label>
    <button class="chipbtn" id="rot" aria-pressed="${autoRot}">Вращение</button>
    <button class="chipbtn" id="xr" aria-pressed="${xray}">Прозрачно</button>
    <button class="chipbtn" id="home">Общий вид</button>`;
  document.getElementById('ex').oninput=e=>{const o=explode;explode=e.target.value/100;dolly((1+0.9*explode)/(1+0.9*o));if(explode>0&&activeSys){activeSys=null;setFlow(null);panel.querySelectorAll('[data-sys]').forEach(x=>x.setAttribute('aria-pressed','false'));}setTargets();};
  document.getElementById('rot').onclick=e=>{autoRot=!autoRot;e.target.setAttribute('aria-pressed',autoRot);};
  document.getElementById('xr').onclick=e=>{xray=!xray;e.target.setAttribute('aria-pressed',xray);setTargets();};
  document.getElementById('home').onclick=()=>goView(SYSDEF[tab]&&VIEWS['sys_'+tab]?'sys_'+tab:(tab==='engine'?'engine':'overall'));}
function animCtl(){return `<h3>Работа</h3><p class="ctl"><button class="chipbtn" id="play" aria-pressed="${playing}">${playing?'Пауза':'Пуск'}</button>
    <label class="slider" for="spd">Скорость <input id="spd" type="range" min="5" max="300" value="${Math.round(speed*100)}"></label>
    <button class="chipbtn" id="clu" aria-pressed="${CLU.pulled}">${CLU.pulled?'Отпустить сцепление':'Выжать сцепление'}</button></p>
    <h3>Коробка передач</h3>
    <div class="gears" role="group" aria-label="Передача">${['N',1,2,3,4,5,6].map((g,i)=>`<button data-g="${i}" aria-pressed="${gear===i}">${g}</button>`).join('')}</div>
    <p class="ratio" id="ratio"></p><p class="lead" style="font-size:13px">Пока узел разобран ползунком, механизм стоит.</p>`;}
function bindAnimCtl(){
  panel.querySelectorAll('.gears button').forEach(b=>b.onclick=()=>{gear=+b.dataset.g;panel.querySelectorAll('.gears button').forEach(x=>x.setAttribute('aria-pressed',x===b));showRatio();});
  document.getElementById('clu').onclick=e=>{const v=CLU.toggle();e.target.setAttribute('aria-pressed',v);e.target.textContent=v?'Отпустить сцепление':'Выжать сцепление';};
  document.getElementById('play').onclick=e=>{playing=!playing;e.target.textContent=playing?'Пауза':'Пуск';e.target.setAttribute('aria-pressed',playing);};
  document.getElementById('spd').oninput=e=>speed=e.target.value/100;showRatio();}
function partList(k){const ids=SYSDEF[k].ids.filter(id=>P[id]&&!P[id].gone);
  return `<h3>Из чего состоит</h3><ul class="plist">${ids.map(id=>`<li><button class="chipbtn" data-pk="${id}" aria-pressed="${picked===id}">${esc(P[id].name)}</button></li>`).join('')}</ul>`;}
function bindPartList(){panel.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{picked=picked===b.dataset.pk?null:b.dataset.pk;
  panel.querySelectorAll('[data-pk]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.pk===picked));renderPick();setTargets();});}
function renderPanel(){
  if(tab==='dash'){if(window.DASH)DASH.panel(panel);return;}
  if(tab==='cat'){panel.innerHTML='';return;}
  if(tab==='bike'){
    panel.innerHTML=`<h2>Твой R nineT Scrambler</h2>
    <p class="lead">Кузов, рама, двигатель снаружи, вилка, тормоза и руль взяты из подробной 3D-модели R nineT, разбитой на детали. Твоё поверх неё: спицованные колёса и два глушителя слева, как на Scrambler. Тяни, чтобы покрутить. Ползунок внизу разносит мотоцикл на узлы, клик по детали покажет, что это и какие работы с ней связаны.</p>
    <p class="src" id="bodyNote">3D-модель: «BMW R 90 Pure», автор Nieve5677, <a href="https://sketchfab.com/3d-models/bmw-r-90-pure-01cf4b2bbea447fa978b4f57b3ca1db9" target="_blank" rel="noopener">Sketchfab</a>, лицензия CC BY 4.0. Детали разбиты и перекрашены.</p>
    <div id="pickbox"></div>
    <h3>Контуры: как он живёт</h3>
    <p class="lead">Выбери контур: всё остальное станет прозрачным, а по цепочке побежит поток. Внутренние детали контура тоже покажутся.</p>
    <ul class="ctr" role="radiogroup" aria-label="Контур"><li><button data-sys="" role="radio" aria-pressed="${!activeSys}" aria-checked="${!activeSys}"><i style="background:var(--line)"></i><span><b>Весь мотоцикл</b><em>Без контура, все детали как есть</em></span></button></li>${CONTOURS.map(c=>`<li><button data-sys="${c.id}" role="radio" aria-checked="${activeSys===c.id}" aria-pressed="${activeSys===c.id}"><i style="background:${c.c}"></i><span><b>${c.n}</b><em>${c.chain}</em></span></button></li>`).join('')}</ul>
    <h3>Ключевые цифры</h3><dl class="specs">${SPECS.map(s=>`<dt>${s[0]}</dt><dd>${s[1]}</dd>`).join('')}</dl>
    <h3>Что важно знать про модель</h3>
    <p class="lead">Это схема для обслуживания: где стоит деталь, как снимается, чем крутить. Расположение узлов, размеры и цвета по данным BMW, формы деталей приближены к оригиналу. Колёса 17/17, как у тебя.</p>
    <h3>Источники</h3><ul class="src">${SOURCES.map(s=>`<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></li>`).join('')}</ul>`;
    renderPick();
    panel.querySelectorAll('[data-sys]').forEach(b=>b.onclick=()=>setContour(b.dataset.sys||null));
    hud3D();
  }
  else if(tab==='engine'){
    panel.innerHTML=`<h2>Как это работает</h2>
    <p class="lead">Цилиндры торчат в стороны, коленвал идёт вдоль мотоцикла. Оба поршня одновременно уходят наружу и возвращаются, но такты у них сдвинуты на один оборот: пока один горит, второй всасывает.</p>
    <h3>Такты сейчас</h3>
    <div class="strokes"><span></span><span class="h">Левый</span><span class="h">Правый</span>
      ${STROKES.map((s,i)=>`<span>${s}</span><span class="cell" id="sl${i}">${i*180}-${i*180+180}°</span><span class="cell" id="sr${i}">${i*180}-${i*180+180}°</span>`).join('')}
    </div>
    <div class="legend"><span><i style="background:#ffc83d"></i>искра</span><span>клапаны открываются кулачками</span></div>
    ${animCtl()}
    <p class="lead">Дальше вращение идёт по карданному валу внутри маятника на конический редуктор в ступице. Цепи нет, смазывать и тянуть нечего, только масло в редукторе раз в 2 года. Это вкладка «Привод».</p>
    <div id="pickbox"></div>${partList('engine')}
    <h3>Что здесь обслуживаешь ты</h3>
    <ul class="ops">${['spark','valves','oilChange','fd','clutch'].map(id=>{const o=OPS.find(x=>x.id===id);return `<li><button class="op" data-op="${id}"><b>${o.t}</b><span class="sub">${o.when}</span>${diffBars(o.diff)}</button></li>`;}).join('')}</ul>`;
    for(let i=0;i<4;i++){stEls['l'+i]=document.getElementById('sl'+i);stEls['r'+i]=document.getElementById('sr'+i);}
    panel.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>openOp(b.dataset.op));
    bindAnimCtl();bindPartList();renderPick();hud3D();
  }
  else if(SYSDEF[tab]){const T=SYSTXT[tab];
    panel.innerHTML=`<h2>${T.h}</h2><p class="lead">${T.lead}</p>
    ${tab==='drive'?animCtl():''}
    ${tab==='elec'?`<p><button class="chipbtn" id="seatx" aria-pressed="${seatOff}">${seatOff?'Поставить сиденье':'Снять сиденье'}</button></p>`:''}
    <div id="pickbox"></div>${partList(tab)}
    ${T.ops.length?`<h3>Что здесь обслуживаешь ты</h3><ul class="ops">${T.ops.map(id=>{const o=OPS.find(x=>x.id===id);return o?`<li><button class="op" data-op="${id}"><b>${o.t}</b><span class="sub">${o.when}</span>${diffBars(o.diff)}</button></li>`:'';}).join('')}</ul>`:''}
    <p class="src">${T.src}</p>`;
    if(tab==='drive')bindAnimCtl();
    const sx=document.getElementById('seatx');if(sx)sx.onclick=e=>{seatOff=!seatOff;e.target.setAttribute('aria-pressed',seatOff);e.target.textContent=seatOff?'Поставить сиденье':'Снять сиденье';setTargets();if(seatOff)goView('underSeat');};
    panel.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>openOp(b.dataset.op));
    bindPartList();renderPick();hud3D();
  }
  else if(tab==='service'){panel.innerHTML='';return;
    if(!curOp){
      panel.innerHTML=`<h2>Что делаем?</h2>
      <p class="lead">Напиши, что нужно сделать или что не так с мотоциклом. Подберу работу и проведу по шагам на модели.</p>
      <div class="search"><input id="q" placeholder="например: троит, поменять масло, стучит сверху" autocomplete="off" aria-label="Что случилось или что сделать"></div>
      <p class="found" id="found"></p>
      <ul class="ops" id="oplist">${OPS.map(o=>`<li><button class="op" data-op="${o.id}"><b>${o.t}</b><span class="sub">${o.when} · ${o.time}</span>${diffBars(o.diff)}</button></li>`).join('')}</ul>
      <h3>Регламент</h3><dl class="specs">
       <dt>10 000 км / год</dt><dd>масло + фильтр, зазоры</dd>
       <dt>20 000 км</dt><dd>свечи, возд. фильтр, редуктор</dd>
       <dt>2 года</dt><dd>тормозная жидкость, редуктор</dd>
       <dt>6 лет / 40 000</dt><dd>ремень генератора</dd></dl>`;
      const q=document.getElementById('q');
      q.oninput=()=>filterOps(q.value);
      panel.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>openOp(b.dataset.op));
    } else renderStep();
    hud.innerHTML=curOp?`<button class="chipbtn" id="home">Вид шага</button><button class="chipbtn" id="ghost" aria-pressed="true">Остальное прозрачно</button>`:`<button class="chipbtn" id="home">Общий вид</button>`;
    document.getElementById('home').onclick=()=>goView(curOp?curOp.steps[curStep].v:'overall');
    const gh=document.getElementById('ghost');if(gh)gh.onclick=e=>{ghost=!ghost;e.target.setAttribute('aria-pressed',ghost);setTargets();};
  }
}
let ghost=false;
function showRatio(){const el=document.getElementById('ratio');if(!el)return;
  if(!gear){el.textContent='Нейтраль: вторичный вал стоит, колесо не крутится.';return;}
  const r=RATIOS[gear-1],tot=PRIMARY*r*FINAL,kmh=3000/tot*Math.PI*0.63*60/1000;
  el.textContent=`${gear}-я: ${r.toFixed(2).replace('.',',')}. Всего от коленвала до колеса ${tot.toFixed(2).replace('.',',')} : 1. На 3000 об/мин это около ${Math.round(kmh)} км/ч.`;}
function filterOps(v){const w=v.toLowerCase().split(/[^а-яёa-z0-9]+/).filter(x=>x.length>2);const f=document.getElementById('found');
  const m=(t,k)=>k.includes(t)||t.includes(k)||(t.length>4&&k.length>4&&t.slice(0,5)===k.slice(0,5));
  let n=0;document.querySelectorAll('#oplist li').forEach(li=>{const o=OPS.find(x=>x.id===li.firstChild.dataset.op);
    const hit=!w.length||w.some(t=>o.keys.split(' ').some(k=>k.length>2&&m(t,k)));li.hidden=!hit;if(hit)n++;});
  f.textContent=!w.length?'':(n?'Подходит: '+n:'Такой работы пока нет в книге. Напиши мне в чат, разберём и добавлю.');}
function renderPick(){const b=document.getElementById('pickbox');if(!b)return;
  if(!picked){b.innerHTML='';return;}const p=P[picked];
  const ops=p.ops.map(id=>OPS.find(o=>o.id===id)).filter(Boolean);
  b.innerHTML=`<div class="pick"><small>${esc(p.sys)}</small><b>${esc(p.name)}</b><p style="margin:6px 0 0">${esc(p.desc)}</p>
    ${ops.length?`<p class="lead" style="margin:10px 0 6px">Работы с этой деталью:</p><ul class="ops">${ops.map(o=>`<li><button class="op" data-op="${o.id}"><b>${o.t}</b><span class="sub">${o.when}</span>${diffBars(o.diff)}</button></li>`).join('')}</ul>`:''}</div>`;
  b.querySelectorAll('[data-op]').forEach(x=>x.onclick=()=>openOp(x.dataset.op));
  const cats=CAT.partFor(picked);if(cats.length){const d=document.createElement('div');d.innerHTML=`<p class="lead" style="margin:10px 0 6px">Детали BMW по каталогу:</p><ul class="ops">${cats.map(c=>`<li><button class="op" data-cat="${c.id}"><b>${esc(c.t)}</b><span class="sub">${c.id} · ${c.r.length} поз.</span></button></li>`).join('')}</ul>`;b.firstChild.appendChild(d);
    d.querySelectorAll('[data-cat]').forEach(x=>x.onclick=()=>CAT.openDiag(x.dataset.cat));}}
function openOp(id){if(H.openOp)return H.openOp(id);curOp=OPS.find(o=>o.id===id);curStep=0;setTab('service');}
function renderStep(){const o=curOp,s=o.steps[curStep];
  panel.innerHTML=`<div class="step-head"><button class="back" id="back">← Все работы</button></div>
  <h2>${o.t}</h2><p class="lead">${o.when} · ${o.time} · сложность ${o.diff} из 5</p>
  ${curStep===0?`<div class="need"><b>Понадобится</b><ul>${o.need.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>
    ${o.flags?o.flags.map(f=>`<p class="fact flag" style="display:block;margin-top:8px;font-family:var(--f-body)">Сверить: ${esc(f)}</p>`).join(''):''}</div>`:''}
  <div class="stepbox"><div class="stepno">ШАГ ${curStep+1} ИЗ ${o.steps.length}</div><h4>${esc(s.h)}</h4><p>${esc(s.x)}</p>
  ${s.facts?`<div class="facts">${s.facts.map(f=>`<span class="fact ${f[2]||''}">${esc(f[0])}: ${esc(f[1])}${f[2]==='flag'?' · сверить':''}</span>`).join('')}</div>`:''}
  ${s.w?`<div class="warn">${esc(s.w)}</div>`:''}</div>
  <div class="dots">${o.steps.map((_,i)=>`<i class="${i<=curStep?'on':''}"></i>`).join('')}</div>
  <div class="nav"><button id="prev" ${curStep?'':'disabled'}>Назад</button><button id="next" class="primary">${curStep<o.steps.length-1?'Дальше':'Готово'}</button></div>`;
  document.getElementById('back').onclick=()=>{curOp=null;renderPanel();setTargets();goView('overall');};
  document.getElementById('prev').onclick=()=>{if(curStep){curStep--;renderStep();setTargets();goView(curOp.steps[curStep].v);}};
  document.getElementById('next').onclick=()=>{if(curStep<o.steps.length-1){curStep++;renderStep();setTargets();goView(curOp.steps[curStep].v);}else{curOp=null;renderPanel();setTargets();goView('overall');}};
}

function altCoils(){if(!GLB_OK)return;['L','R'].forEach(s=>{let use=false;
  if(tab==='service'&&curOp){const st=curOp.steps[curStep];const L=[].concat(st.f||[],st.off||[],st.show||[]);use=L.some(x=>x==='coil'+s||x==='conn'+s||x==='plug'+s||x==='well'+s);}
  if((tab==='engine'||tab==='elec'||tab==='bike')&&(xray||cutPlane||explode>0.01))use=true;
  ['coil','conn'].forEach(b=>{const p=P[b+s];if(!p)return;p.g.traverse(o=>{if(!o.isMesh)return;if(o.userData.dead){o.visible=false;return;}const scan=!!o.userData.scan;o.visible=scan?!use:use;});});});}
let elecMode=false,seatOff=false;
const ELECSET=new Set(['harness','underseat','battery','ecu','relays','diag','powerCables','regulator','alternator','starter','coilL','coilR','sensors','lambda','flap','abs','wheelSensors','instrument','light','horn','tail','standSwitch','fuelPump','iat']);
const USEAT=new Set(['battery','ecu','relays','diag','powerCables','underseat','harness','abs']);
/* ---------- catalog: show a diagram's parts on the model ----------
   CATSHOW = {label, parts: {partId: [sub tags] | null}}. Only these parts are drawn solid and pulsing; the scanned shell stays as a
   faint outline for orientation, everything else is hidden. A sub tag (rod, piston, cam, valve) keeps only that piece of a part. */
let CATSHOW=null;const catHidden=[];
function subOf(o,root){while(o&&o!==root){if(o.userData&&o.userData.sub)return o.userData.sub;o=o.parent;}return null;}
function applyCatShow(){catHidden.splice(0).forEach(o=>{o.visible=true;});
  if(!CATSHOW)return;
  Object.values(P).forEach(p=>{const t=p.tgt,want=CATSHOW.parts[p.id];
    if(want!==undefined){t.op=1;t.hl=1;t.off=0;t.sub=0;
      if(want&&want.length)p.g.traverse(o=>{if(o.isMesh&&o.visible&&!o.userData.scan){const s=subOf(o,p.g);if(want.indexOf(s)<0){o.visible=false;catHidden.push(o);}}});}
    else{t.hl=0;t.off=0;t.sub=0;t.op=(p.scan&&!p.gone&&p.layer!=='tool'&&p.layer!=='fx')?0.06:0;}});}
function catFocusView(){if(!CATSHOW)return;const b=new THREE.Box3();
  Object.keys(CATSHOW.parts).forEach(id=>{const p=P[id];if(!p)return;p.g.updateMatrixWorld(true);
    p.g.traverse(o=>{if(!o.isMesh||!o.visible||!o.geometry)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
      if(o.isInstancedMesh){const q=new THREE.Matrix4(),w=new THREE.Matrix4();for(let i=0;i<o.count;i+=Math.max(1,o.count>>4)){o.getMatrixAt(i,q);w.multiplyMatrices(o.matrixWorld,q);b.union(o.geometry.boundingBox.clone().applyMatrix4(w));}}
      else b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));});});
  if(b.isEmpty())return;const c=b.getCenter(new V3()),r=Math.max(b.getSize(new V3()).length()/2,1.6);
  const dir=camera.position.clone().sub(controls.target).normalize();if(dir.y<0.15){dir.y=0.35;dir.normalize();}
  const p=c.clone().addScaledVector(dir,Math.max(controls.minDistance+.3,r*3.2));
  document.getElementById('tag3d').textContent='ВИД: '+CATSHOW.label;
  if(RM){camera.position.copy(p);controls.target.copy(c);fly=null;return;}
  fly={p0:camera.position.clone(),t0:controls.target.clone(),p,t:c,s:performance.now(),d:900};}
function setCatShow(v){CATSHOW=v;autoRot=false;if(H.autoRot)H.autoRot(false);
  picked=null;setTargets();if(v)catFocusView();else goView('overall');}
function setTargets(){altCoils();
  Object.values(P).forEach(p=>{const t=p.tgt;t.hl=0;t.off=0;t.op=1;
    t.exT=p.ex;t.sub=0;
    if(tab==='bike'||tab==='cat'){const inner=(p.layer==='internal'||p.hid)&&!(p.gone||p.ext||/^well/.test(p.id));
      t.op=(p.layer==='internal'||p.layer==='tool'||p.layer==='fx'||p.hid)&&!p.ext?0:1;
      if(inner)t.op=(xray||cutPlane)?1:(explode>0.01?Math.min(1,explode*4):0);
      if(xray&&p.scan)t.op=0.16;
      if(p.hid&&picked===p.id)t.op=1;
      t.exT=p.ex.length()>1?p.ex.clone().multiplyScalar(1.2):((p.sysEx&&p.sysEx.bike)||p.ex);t.off=explode;t.sub=explode;if(picked===p.id)t.hl=1;

      if(seatOff){if(p.id==='seat')t.op=0;if(USEAT.has(p.id))t.op=Math.max(t.op,p.id==='harness'?0.9:1);}
      if(activeSys){const C=CONTOURS.find(c=>c.id===activeSys);const inC=C.parts.indexOf(p.id)>=0;t.op=(p.layer==='tool'||p.layer==='fx')?0:(inC?(SHELL.indexOf(p.id)>=0?0.32:1):0.07);t.off=0;t.sub=0;}}
    else if(SYSDEF[tab]){const Sd=SYSDEF[tab],inS=Sd.set.has(p.id);
      t.exT=(p.sysEx&&p.sysEx[tab])||p.ex;
      if(p.layer==='tool'||p.layer==='fx'||p.gone||/^well/.test(p.id))t.op=0;
      else if(inS){const open=xray||cutPlane||Sd.open||p.ext||Sd.always.indexOf(p.id)>=0;
        if(p.scan)t.op=xray?0.16:1;else t.op=open?1:(explode>0.01?Math.min(1,explode*4):0);
        if(tab==='engine'&&/^coil[LR]$/.test(p.id)&&xray)t.op=0.3;
        t.off=explode;t.sub=explode;if(picked===p.id)t.hl=1;}
      else if(Sd.ctxSet.has(p.id))t.op=(tab==='elec'&&seatOff&&p.id==='seat')?0:0.07;
      else t.op=0;}
    else if(tab==='service'){
      if(p.layer==='internal'&&!/^cams|^crank$|^piston/.test(p.id))t.op=0;
      if(/^piston|^crank$/.test(p.id))t.op=0;
      if(curOp){const s=curOp.steps[curStep];
        const keep=curOp.keep.indexOf(p.id)>=0||s.f.indexOf(p.id)>=0;
        if(p.hid&&keep)t.op=1;
        if(p.scan&&s.f.indexOf(p.id)<0&&s.f.some(id=>P[id]&&P[id].hid&&!/^(conn|coil|cap)/.test(id)))t.op=Math.min(t.op,0.3);
        if(ghost&&!keep)t.op=0.1;
        if(!ghost&&occl.has(p.id)&&s.f.indexOf(p.id)<0)t.op=Math.min(t.op,0.14);
        if(p.id==='loom'&&ghost&&!keep)t.op=0.05;
        if(s.xray&&(/^(head|cover|cyl)R$/.test(p.id)||p.id==='crankcase'||p.id==='throttle'))t.op=0.2;
        if(s.xray&&s.f.indexOf('fdgear')>=0&&/^(finaldrive|swingarm|wheelR|brakeR|fdfill|fddrain)$/.test(p.id))t.op=0.2;
        if(/^(head|cyl)[LR]$/.test(p.id)&&(s.off||[]).indexOf('cover'+p.id.slice(-1))>=0)t.op=Math.min(t.op,0.35);
        if(/^cams/.test(p.id))t.op=(s.off||[]).indexOf('cover'+p.id.slice(-1))>=0?1:0;
        const offs=(s.off||[]).concat((s.off||[]).filter(x=>/^coil[LR]$/.test(x)).map(x=>'conn'+x.slice(-1)));
        if(offs.indexOf(p.id)>=0){t.off=0.45;t.op=Math.min(t.op,0.35);if(/^(plug|tool|filler|drainplug|oilfilter|fdfill|fddrain|cap)/.test(p.id))t.op=1;}
        if(s.f.indexOf(p.id)>=0)t.hl=1;
        if(p.layer==='tool'||p.layer==='fx'){t.op=(s.show||[]).indexOf(p.id)>=0?1:0;t.hl=0;}
      } else if(/^cams/.test(p.id))t.op=0;
      if(!curOp&&(p.layer==='tool'||p.layer==='fx'))t.op=0;
    }
  });
  const scopeAll=tab==='bike'||tab==='cat';Object.values(P).forEach(p=>setClip(p,cutPlane&&!!p.scan&&(scopeAll||(SYSDEF[tab]&&SYSDEF[tab].set.has(p.id)))&&!activeSys));
  if(tab==='cat'&&CATSHOW)applyCatShow();else if(catHidden.length)applyCatShow();
  if(hoverId&&P[hoverId]&&P[hoverId].tgt.op>0.5)P[hoverId].tgt.hl=Math.max(P[hoverId].tgt.hl,0.75);
}

const TABS=['bike','engine','drive','brakes','elec','dash','service','cat'];
function setTab(t){if(t!=='cat')CATSHOW=null;tab=t;if(t!=='bike'&&activeSys){activeSys=null;setFlow(null);if(H.contour)H.contour(null);}TABS.forEach(x=>{const el=document.getElementById('t-'+x);if(el)el.setAttribute('aria-selected',x===t);});
  if(t==='dash')picked=null;else if(picked&&SYSDEF[t]&&!SYSDEF[t].set.has(picked))picked=null;
  const dEl=document.getElementById('dash');dEl.hidden=t!=='dash';
  if(t==='dash'){renderPanel();if(window.DASH)DASH.onShow();return;}
  renderPanel();setTargets();
  if(t==='bike'||t==='cat')goView('overall');else if(SYSDEF[t])goView(VIEWS['sys_'+t]?'sys_'+t:(t==='engine'?'engine':'overall'));else goView(curOp?curOp.steps[curStep].v:'overall');
  }

/* ---------- picking ---------- */
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let downXY=null;
canvas.addEventListener('pointerdown',e=>{downXY=[e.clientX,e.clientY];autoRot=false;if(H.autoRot)H.autoRot(false);});
function pickAt(x,y){const r=canvas.getBoundingClientRect();mouse.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);
  ray.setFromCamera(mouse,camera);
  const hits=ray.intersectObjects(pickables.filter(m=>{let o=m;while(o){if(o.visible===false)return false;o=o.parent;}return P[m.userData.part]&&P[m.userData.part].cur.op>0.5;}),false);
  return hits.length?hits[0].object.userData.part:null;}
canvas.addEventListener('pointerup',e=>{if(!downXY||Math.hypot(e.clientX-downXY[0],e.clientY-downXY[1])>8)return;if(H.tap)H.tap(e.clientX,e.clientY,e);});
function select(id){picked=id||null;renderPick();panel.querySelectorAll('[data-pk]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.pk===picked));setTargets();}

/* ---------- hover: highlight + what it is ---------- */
const tipEl=document.getElementById('tip');let lastHover=0;
function hitPart(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);
  const hits=ray.intersectObjects(pickables.filter(m=>{let o=m;while(o){if(o.visible===false)return false;o=o.parent;}const p=P[m.userData.part];return p&&p.cur.op>0.5;}),false);
  return hits.length?hits[0].object.userData.part:null;}
canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||e.buttons)return;const now=performance.now();if(now-lastHover<60)return;lastHover=now;
  const id=hitPart(e);if(id!==hoverId){hoverId=id;setTargets();}
  if(id){const p=P[id];tipEl.innerHTML=`<small>${esc(p.sys||'')}</small><b>${esc(p.name)}</b>${esc(p.desc.length>210?p.desc.slice(0,207)+'...':p.desc)}`;tipEl.hidden=false;
    const r=canvas.getBoundingClientRect();let x=e.clientX-r.left+16,y=e.clientY-r.top+16;if(x+300>r.width)x=e.clientX-r.left-316;if(y+140>r.height)y=e.clientY-r.top-150;tipEl.style.left=Math.max(8,x)+'px';tipEl.style.top=Math.max(8,y)+'px';}
  else tipEl.hidden=true;});
canvas.addEventListener('pointerleave',()=>{tipEl.hidden=true;if(hoverId){hoverId=null;setTargets();}});

/* ---------- resize + loop ---------- */
let insetB=0;/* px of the canvas covered by a bottom sheet: the picture shifts up so the bike stays in the free part */
function applyInset(){const r=canvas.parentElement.getBoundingClientRect();if(insetB>0)camera.setViewOffset(r.width,r.height,0,insetB/2,r.width,r.height);else camera.clearViewOffset();}
function resize(){const r=canvas.parentElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.fov=camera.aspect<1.1?Math.min(68,34*1.1/camera.aspect):34;applyInset();camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(canvas.parentElement);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
let last=performance.now();
let FADEDT=0;const SVC={cam:Math.PI};
let paused=false;/* the app pauses drawing while a full screen covers the 3D */
function loop(now){if(paused){last=now;requestAnimationFrame(loop);return;}FADEDT=Math.min(.5,(now-last)/1000);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(fly){const k=Math.min(1,(now-fly.s)/fly.d),e=ease(k);camera.position.lerpVectors(fly.p0,fly.p,e);controls.target.lerpVectors(fly.t0,fly.t,e);if(k>=1)fly=null;}
  controls.autoRotate=(tab==='bike'||!!SYSDEF[tab])&&autoRot&&!fly;
  const anim=(tab==='engine'||tab==='drive')&&playing&&explode<0.02;updateClip();
  if(anim){theta+=dt*360*speed*(RM?0.3:1);}
  updateEngine();
  if(tab!=='engine'&&tab!=='drive'){E2.set((SVC.cam-Math.PI)*2*180/Math.PI,false);}
  if(anim&&gear&&CLU.amt<0.5){wPivot.rotation.z-=dt*2*Math.PI*speed*(RM?0.3:1)/(PRIMARY*RATIOS[gear-1]*FINAL);}
  DRV.set(wPivot.rotation.z);
  if(tab==='engine'){const ph=[((theta+360)%720+720)%720,((theta%720)+720)%720];
    for(let i=0;i<4;i++){if(stEls['l'+i]){stEls['l'+i].classList.toggle('on',strokeOf(ph[0])===i);stEls['r'+i].classList.toggle('on',strokeOf(ph[1])===i);}}}
  const stp=(tab==='service'&&curOp)?curOp.steps[curStep]:null,A=stp&&stp.anim;
  SVC.cam=Math.PI;
  if(A==='tdc'){const T=RM?4:now/1000,ph=Math.min(1,(T%5)/3.5);SVC.cam=Math.PI*(0.15+0.85*ph);wPivot.rotation.z=-ph*Math.PI*1.4;}
  if(A==='feel'){const T=RM?0:now/1000,i=Math.floor(T/2.2)%4,tp=E2.gapPoint(i);TOOL.feel.position.copy(tp).sub(P.toolFeelerR.g.position).sub(new V3(30,0,291.5));feelLbl[0].visible=i%2===0;feelLbl[1].visible=i%2===1;}
  if(A){const T=RM?0:now/1000,ph=(T%4)/4,set=(id,v)=>{P[id].tgt.off=v;P[id].cur.off=v;};
    if(A==='blow'){set('dirtR',ph*1.1);P.dirtR.tgt.op=P.dirtR.cur.op=Math.max(0,1-ph*1.4);}
    if(A==='unscrew'){const o=Math.max(0,ph-.15)/.85*0.3;set('plugR',o);set('toolSocketR',o);TOOL.socket.rotation.z=-ph*Math.PI*8;}
    if(A==='screwin'){const o=(1-Math.min(1,ph/.8))*0.14;set('plugR',o);set('toolExtR',o);TOOL.ext.rotation.z=ph*Math.PI*6;}
    if(A==='torque'){TOOL.torque.rotation.z=-Math.min(1,ph/.6)*0.5;tql.visible=true;}
  }
  stepFlow(now);
  Object.values(P).forEach(p=>applyPartState(p,dt));
  controls.update();{const under=camera.position.y<0.02;turntable.visible=!under;ticks.visible=!under;if(window.__floorSh)window.__floorSh.visible=!under;}
  renderer.render(scene,camera);requestAnimationFrame(loop);}

/* ---------- start ---------- */
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
let startTab='bike';
/* start after the whole script has run: the catalog module (CAT) is defined further down, and the remembered tab may be the catalog */
queueMicrotask(()=>{resize();setTab(startTab);if(fly){camera.position.copy(fly.p);controls.target.copy(fly.t);fly=null;}
Object.values(P).forEach(p=>{p.cur.op=p.tgt.op;p.cur.off=p.tgt.off;});});

/* ---------- scanned body: detailed 3D model (CC-BY 4.0, Nieve5677 on Sketchfab), split into our parts ---------- */
const GLBMAT={'black.069':'black','chrome.069':'chrome','mattemetal.030':'brushed','clearglass.068':'lensG','white.048':'alu','gray.003':'headcov','blue.048':'blue','carpaint.068':'paint','redglass.068':'lensR','orangeglass.052':'lensA','red.014':'red','rim_second.005':'rimblk','brakedisk.049':'disc','mirror.062':'chrome','tire.068':'rubber','LicPlate_black.021':'black','LicPlate_white.021':'black','LicPlate_blue.021':'black','LicPlate_yellow.021':'black'};
const PARTMAT={crankcase:{'black.069':'case'},cylL:{'black.069':'fin'},cylR:{'black.069':'fin'},headL:{'black.069':'case'},headR:{'black.069':'case'},frame:{'black.069':'frame'},seat:{'black.069':'seat'},headers:{'chrome.069':'pipe'},collector:{'chrome.069':'blast'},wheelF:{'black.069':'rubber'},wheelR:{'black.069':'rubber'},coilL:{'black.069':'coil'},coilR:{'black.069':'coil'}};
function glbMaterial(id,mn){const k=(PARTMAT[id]&&PARTMAT[id][mn])||GLBMAT[mn]||'black';
  if(k==='lensG')return new THREE.MeshStandardMaterial({color:0xdfe8ee,roughness:.05,metalness:0,transparent:true,opacity:.35,envMapIntensity:1.2});
  if(k==='lensR')return new THREE.MeshStandardMaterial({color:0xb01212,roughness:.15,metalness:0,emissive:0x300000});
  if(k==='lensA')return new THREE.MeshStandardMaterial({color:0xe07b00,roughness:.15,metalness:0});
  return mat(k,true);}
var GLB_OK=false;
/* connected pieces of a scanned mesh: vertices with the same quantized position are one point, triangles join points into pieces;
   each vertex gets the centre of its piece, so the shader can push the piece away from the part centre */
function compCentres(qp,qi,P3,nv){const key=new Map(),rep=new Int32Array(nv),par=new Int32Array(nv);
  for(let i=0;i<nv;i++){const k=qp[3*i]+qp[3*i+1]*65536+qp[3*i+2]*4294967296;let r=key.get(k);if(r===undefined){r=i;key.set(k,i);}rep[i]=r;par[i]=i;}
  const f=x=>{while(par[x]!==x){par[x]=par[par[x]];x=par[x];}return x;};
  for(let t=0;t<qi.length;t+=3){const a=f(rep[qi[t]]),b=f(rep[qi[t+1]]);if(a!==b)par[a]=b;const c=f(rep[qi[t+2]]),d=f(b);if(c!==d)par[c]=d;}
  const mn=new Map();for(let i=0;i<nv;i++){const r=f(rep[i]);let e=mn.get(r);if(!e){e=[1e9,1e9,1e9,-1e9,-1e9,-1e9];mn.set(r,e);}
    for(let a=0;a<3;a++){const v=P3[3*i+a];if(v<e[a])e[a]=v;if(v>e[a+3])e[a+3]=v;}}
  const out=new Float32Array(nv*3);for(let i=0;i<nv;i++){const e=mn.get(f(rep[i]));for(let a=0;a<3;a++)out[3*i+a]=(e[a]+e[a+3])/2;}return out;}
function finishScanOffsets(){Object.values(P).forEach(p=>{if(!p.scanU)return;const ms=[];p.g.traverse(o=>{if(o.isMesh&&o.userData.compC)ms.push(o);});
  const b=new THREE.Box3();ms.forEach(m=>{m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox);});const c=b.getCenter(new V3());
  ms.forEach(m=>{const cc=m.userData.compC,off=new Float32Array(cc.length);for(let i=0;i<cc.length;i+=3){let x=cc[i]-c.x,y=cc[i+1]-c.y,z=cc[i+2]-c.z;const L=Math.hypot(x,y,z);if(L>260){x*=260/L;y*=260/L;z*=260/L;}off[i]=x;off[i+1]=y;off[i+2]=z;}
    m.geometry.setAttribute('aOff',new THREE.BufferAttribute(off,3));delete m.userData.compC;});});}
/* loading screen: an outline bike fills up from the bottom while the detailed scan downloads; the simple placeholder bike is never shown */
/* loader: a line-drawn bike, the accent runs along it from the seat over the tank and fork onto the front wheel as the model loads */
function ldRun(f){const a1=document.getElementById('lda1'),a2=document.getElementById('lda2');if(!a1||!a2)return;const L=13,K=0.72;
  const put=(el,pos)=>{el.style.strokeDasharray=L+' 1000';el.style.strokeDashoffset=String(-Math.max(0,Math.min(100-L,pos-L)));el.style.opacity=1;};
  if(f<K){put(a1,L+f/K*(100-L));a2.style.opacity=0;}else{a1.style.opacity=0;put(a2,L+(f-K)/(1-K)*(100-L));}}
window.__garageLoader=ldRun;/* tests drive the loader picture */
function loaderProgress(f){const r=document.getElementById('ldrect'),t=document.getElementById('ldtxt'),l=document.getElementById('loader');if(l)l.style.setProperty('--p',f);ldRun(f);if(r)r.setAttribute('width',330*f);if(!t)return;t.textContent='ЗАГРУЖАЮ МОДЕЛЬ '+Math.round(f*100)+'%';}
/* the loader never gives way to the simple placeholder bike: it waits for the real model, says when the network is slow,
   and offers «Повторить» if the download broke */
let bodyLoading=false,slowT=null;
function loaderSub(t){const e=document.getElementById('ldsub');if(e)e.textContent=t||'';}
function loaderFail(e){console.warn('body',e);bodyLoading=false;clearTimeout(slowT);const t=document.getElementById('ldtxt'),b=document.getElementById('ldRetry');
  if(t)t.textContent='НЕ ЗАГРУЗИЛОСЬ';loaderSub('Проверь интернет и нажми «Повторить»');
  if(b){b.hidden=false;b.onclick=()=>{b.hidden=true;loaderSub('');loaderProgress(0);startBody();};}}
function startBody(){if(bodyLoading||GLB_OK)return;bodyLoading=true;clearTimeout(slowT);
  slowT=setTimeout(()=>{if(!GLB_OK)loaderSub('Медленный интернет, модель большая (5,6 МБ). Ещё грузится');},20000);
  loadBody().then(()=>{bodyLoading=false;if(!GLB_OK)loaderFail('no body');}).catch(loaderFail);}
function loaderDone(){clearTimeout(slowT);window.__r9tLoaded=true;if(H.ready)setTimeout(()=>H.ready(GLB_OK),0);const l=document.getElementById('loader');if(l){l.classList.add('done');setTimeout(()=>l.remove(),600);}}
async function loadBody(){
  let buf;try{const r=await fetch('assets/bike.wasm');if(!r.ok)throw 0;
    const total=+r.headers.get('content-length')||5637773;
    try{const rd=r.body.getReader(),parts=[];let got=0;
      for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);got+=value.length;loaderProgress(Math.min(.95,got/total*.95));}
      const all=new Uint8Array(got);let o=0;parts.forEach(q=>{all.set(q,o);o+=q.length;});buf=all.buffer;}
    catch(e){buf=await (await fetch('assets/bike.wasm')).arrayBuffer();}
    loaderProgress(.97);const u=new Uint8Array(buf,0,2);
    if(u[0]===0x1f&&u[1]===0x8b){if(typeof DecompressionStream==='undefined')throw new Error('no DecompressionStream');buf=await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}}catch(e){loaderFail(e);return;}
  const dv=new DataView(buf),hl=dv.getUint32(0,true),H=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,hl))),base=4+hl;
  const got=new Set(H.map(c=>c.l));got.add('clutchMaster');
  [['capR','справа',1],['capL','слева',-1]].forEach(([id,nm,s])=>{if(P[id])return;part(id,{name:'Накладка катушки, '+nm,desc:'Чёрная пластиковая накладка на крышке клапанов. Под ней верхушка катушки с разъёмом, а провод от разъёма идёт вниз по каналу под этой же накладкой и уходит к жгуту под цилиндром. Снаружи провода не видно.',sys:'Зажигание',layer:'drive',ex:[0,90,s*260]});P[id].home=new V3();});
  ['R','L'].forEach(s=>{if(P['conn'+s])P['conn'+s].ex=new V3(0,20,(s==='R'?1:-1)*110);});
  /* hide our hand-built geometry where the scan has the real part */
  got.forEach(id=>{const p=P[id];if(!p)return;p.scan=true;if(/^(coil|conn)[LR]$/.test(id))return;
    p.g.traverse(o=>{if(o.isMesh&&o!==p.g&&(id!=='wheelF'&&id!=='wheelR'||o.userData.tyre))o.visible=false;});});
  /* the scan glues the hand controls into the handlebar; the piece it calls the front reservoir is the right mirror stem.
     Carve the two master cylinders with their built-in reservoirs (BMW 32_2498 brake, 32_2499 clutch) out of the handlebar by triangle position. */
  const MC=[[1072,1018,112,1152,1078,246],[1066,994,112,1136,1018,246]];
  function relabel(l,qi,P3){if(l==='resF')return [['bars',qi]];if(l!=='bars')return [[l,qi]];
    const out={bars:[],resF:[],clutchMaster:[]};
    for(let t=0;t<qi.length;t+=3){let x=0,y=0,z=0;for(let j=0;j<3;j++){const v=qi[t+j]*3;x+=P3[v];y+=P3[v+1];z+=P3[v+2];}x/=3;y/=3;z/=3;
      const az=Math.abs(z),hit=MC.some(b=>x>b[0]&&x<b[3]&&y>b[1]&&y<b[4]&&az>b[2]&&az<b[5]);
      out[hit?(z>0?'resF':'clutchMaster'):'bars'].push(qi[t],qi[t+1],qi[t+2]);}
    return Object.keys(out).filter(k=>out[k].length).map(k=>[k,new Uint32Array(out[k])]);}
  H.forEach(c=>{if(!P[c.l]||/^LicPlate/.test(c.m))return;   /* number plate replaced by a blank one below */
    const qp=new Uint16Array(buf,base+c.p,c.nv*3),qn=new Int8Array(buf,base+c.n,c.nv*3),qi0=c.i32?new Uint32Array(buf,base+c.i,c.nt*3):new Uint16Array(buf,base+c.i,c.nt*3);
    const P3=new Float32Array(c.nv*3);for(let i=0;i<c.nv*3;i++){const a=i%3;P3[i]=c.lo[a]+qp[i]/65535*c.sc[a];}
    const cc=compCentres(qp,qi0,P3,c.nv),pos=new THREE.BufferAttribute(P3,3),nrm=new THREE.BufferAttribute(qn,3,true);
    relabel(c.l,qi0,P3).forEach(([l,qi])=>{const p=P[l];if(!p)return;
    const g=new THREE.BufferGeometry();g.setAttribute('position',pos);g.setAttribute('normal',nrm);g.setIndex(new THREE.BufferAttribute(qi,1));g.computeBoundingSphere();
    const m=new THREE.Mesh(g,glbMaterial(l,c.m));m.position.copy(p.home).multiplyScalar(-1);
    m.userData.compC=cc;
    {const u={value:0};(p.scanU=p.scanU||[]).push(u);m.material.onBeforeCompile=sh=>{sh.uniforms.uEx=u;sh.vertexShader='attribute vec3 aOff;\nuniform float uEx;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=aOff*uEx;');};}
    m.userData.part=l;m.userData.scan=true;m.userData.baseOpacity=m.material.opacity;m.material.transparent=true;m.castShadow=false;p.g.add(m);pickables.push(m);
    if(l==='silencers'){const m2=new THREE.Mesh(g,m.material);m2.position.copy(m.position).add(new V3(63,124,-12));m2.userData=Object.assign({},m.userData);p.g.add(m2);pickables.push(m2);}});});
  /* blank number plate in the plane of the scanned one: no letters, no flag, no frame print */
  {const p=P.tail,n=new V3(.873,-.488,0).normalize(),w=new V3(.488,.873,0),zz=new V3(0,0,-1);
   const W=220,Hh=174,R=8,sh=new THREE.Shape();sh.moveTo(-W/2+R,-Hh/2);sh.lineTo(W/2-R,-Hh/2);sh.quadraticCurveTo(W/2,-Hh/2,W/2,-Hh/2+R);sh.lineTo(W/2,Hh/2-R);sh.quadraticCurveTo(W/2,Hh/2,W/2-R,Hh/2);
   sh.lineTo(-W/2+R,Hh/2);sh.quadraticCurveTo(-W/2,Hh/2,-W/2,Hh/2-R);sh.lineTo(-W/2,-Hh/2+R);sh.quadraticCurveTo(-W/2,-Hh/2,-W/2+R,-Hh/2);
   const g=new THREE.ExtrudeGeometry(sh,{depth:3,bevelEnabled:true,bevelThickness:.6,bevelSize:.6,bevelSegments:2,curveSegments:6});g.translate(0,0,-1.5);
   const m=new THREE.Mesh(g,mat('black',true));m.matrixAutoUpdate=true;m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(zz,w,n));
   const c=new V3(-288.01,633.46,11.61).addScaledVector(w,.45).addScaledVector(n,-1.6);c.z=0;m.position.copy(c).sub(p.home);
   m.userData.part='tail';m.userData.scan=true;m.userData.baseOpacity=1;m.material.transparent=true;p.g.add(m);pickables.push(m);}
  /* second silencer feed: from the collector outlet up into the upper can */
  {const p=P.silencers,o=p.home;const pts=[[425,236,-124],[452,282,-136],[460,340,-148],[440,394,-155],[390,421,-160]].map(q=>[q[0]-o.x,q[1]-o.y,q[2]-o.z]);
   const t=tube(p.g,pts,27,'pipe',40);t.userData.scan=true;t.material.transparent=true;t.userData.baseOpacity=1;}
  /* coil connector sits under the black cover, its lead runs down the cover channel */
  [['R',1,[885,455],[868,372]],['L',-1,[937,455],[920,372]]].forEach(([s,k,top,bot])=>{const p=P['conn'+s];if(!p)return;
    p.g.traverse(o=>{if(o.isMesh)o.userData.dead=true;});const o=p.home,L=(x,y,z)=>[x-o.x,y-o.y,z-o.z];
    const b=box(p.g,[34,26,22],L(top[0],top[1],k*312),'coil');b.userData.alt=true;
    const lt=box(p.g,[10,6,6],L(top[0],top[1]+15,k*322),'red');lt.userData.alt=true;
    const w=tube(p.g,[L(top[0],top[1]-12,k*312),L(top[0]-6,top[1]-45,k*316),L(bot[0],bot[1],k*314),L(bot[0]-10,bot[1]-25,k*292),L(bot[0]-30,bot[1]-35,k*250)],5,'black',30);w.userData.alt=true;});
  ['crashbars','rack'].forEach(id=>{if(P[id]){P[id].g.visible=false;P[id].gone=true;}});
  for(let i=pickables.length-1;i>=0;i--){const q=P[pickables[i].userData.part];if(q&&q.gone)pickables.splice(i,1);}
  /* hand-built parts with no scanned twin stay inside: shown in contours and service steps */
  const KEEP=new Set(['wheelF','wheelR','capR','capL']);
  Object.values(P).forEach(p=>{if(got.has(p.id)||KEEP.has(p.id))return;if(p.layer==='bike'||p.layer==='drive'){p.hid=true;if(p.layer==='bike'){p.wasBike=true;p.layer='internal';}}});
  finishScanOffsets();GLB_OK=true;loaderProgress(1);setTimeout(loaderDone,250);computeSys();setTargets();if(SYSDEF[tab])goView('sys_'+tab);if(window.__onBody)window.__onBody();}
startBody();
requestAnimationFrame(loop);
/* ===== Каталог BMW: все разделы K23 с номерами деталей, связаны с 3D ===== */
const CAT=(function(){
const GROUPS={'02':'Сервис и жидкости','11':'Двигатель','12':'Электрика двигателя','13':'Впуск и впрыск','16':'Топливо','17':'Маслорадиатор','18':'Выпуск',
 '21':'Сцепление','23':'Коробка передач','31':'Вилка','32':'Руль и органы управления','33':'Маятник, кардан, редуктор','34':'Тормоза и ABS','35':'Педали',
 '36':'Колёса и шины','46':'Рама и кузов','51':'Замки, зеркала, окраска','52':'Сиденье','61':'Электрика и жгуты','62':'Приборная панель','63':'Свет','65':'Сигнализация','71':'Наклейки','77':'Аксессуары BMW'};
/* diagram -> 3D part (by title keywords, group-scoped) */
const MAP=[[/^11.*CRANKSHAFT/,'crank'],[/^11.*CONNECTING ROD|^11.*PISTON/,'pistonR'],[/^11.*CYLINDER HEAD COVER/,'coverR'],[/^11.*CYLINDER HEAD\/|^11.*CONTROL SUPPORT/,'headR'],
 [/^11.*CYLINDER$/,'cylR'],[/^11.*TIMING GEAR|^11.*CAMSHAFT/,'camsR'],[/^11.*TIMING.*CHAIN/,'camchains'],[/^11.*TIMING CHAIN COVER/,'beltcover'],[/^11.*OIL PUMP/,'oilpump'],
 [/^11.*OIL FILTER/,'oilfilter'],[/^11.*COMPENSATING/,'balancer'],[/^11.*(ENGINE HOUSING|CRANKCASE|SHORT ENGINE|^11_\d+ ENGINE$)/,'crankcase'],[/^11.*VENTILATION/,'breather'],
 [/^12.*IGNITION/,'coilR'],[/^12.*STARTER/,'starter'],[/^12.*ALTERNATOR/,'alternator'],[/^12.*WIRING/,'loom'],[/^12.*SENSOR/,'sensors'],
 [/^13.*(SILENCER|FILTER)/,'airbox'],[/^13.*THROTTLE/,'throttle'],[/^13.*INJECTOR/,'fuelLine'],[/^13.*CONTROL UNIT/,'ecu'],[/^13.*MANIFOLD/,'intakeDuct'],
 [/^16.*PUMP/,'fuelPump'],[/^16.*CHARCOAL/,'canister'],[/^16.*LID/,'fuelCap'],[/^16/,'tank'],[/^17/,'cooler'],[/^18.*FLAP/,'flap'],[/^18.*MUFFLER/,'silencers'],[/^18/,'headers'],
 [/^21.*CONTROL/,'clutchSlave'],[/^21/,'clutch'],[/^23.*(SHIFT COMPONENTS|SELECTOR)/,'shiftMech'],[/^23.*SHAFTS/,'gears'],[/^23.*EXTERNAL/,'shiftLink'],[/^23/,'gearbox'],
 [/^31.*(BOTTOM|TOP)/,'triple'],[/^31/,'fork'],[/^32/,'bars'],[/^33.*DRIVE SHAFT/,'driveshaft'],[/^33.*(GEARBOX|PINION|RING GEAR|BEARING)/,'finaldrive'],[/^33.*STRUT/,'shock'],[/^33/,'swingarm'],
 [/^34.*(REAR WHEEL BRAKE|REAR BRAKE)/,'brakeR'],[/^34.*ABS/,'abs'],[/^34.*SPEED/,'wheelSensors'],[/^34/,'brakeF'],[/^35/,'rearMaster'],
 [/^36.*FRONT/,'wheelF'],[/^36/,'wheelR'],[/^46.*(SADDLE|REAR)/,'tail'],[/^46/,'frame'],[/^52/,'seat'],[/^61.*BATTERY/,'battery'],[/^61.*HORN/,'horn'],[/^61/,'loom'],
 [/^62/,'instrument'],[/^63.*TAIL/,'tail'],[/^63/,'light']];
let DATA=null,cur=null,q='',open=null;setTimeout(()=>load(),3000);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* every diagram -> the 3D parts it covers (checked by hand against the part lists); id:tag keeps one piece of a part */
const LINK={"02_0112":"oilfilter drainplug filler sightglass","02_0117":"fork","02_0146":"brakeF brakeR","02_0411":"filler sightglass","11_2806":"pistonR:rod pistonL:rod","11_3595":"cylR cylL","11_3669":"crank","11_4200":"crankcase sightglass","11_4202":"pistonR:piston pistonL:piston","11_4206":"breather","11_4209":"balancer","11_4215":"oilfilter drainplug","11_4216":"oilpump","11_4218":"crankcase","11_4267":"camchains","11_4277":"camchains","11_4289":"coverR coverL","11_4292":"headR headL","11_4293":"headR headL","11_4294":"camsR:valve camsL:valve","11_4432":"beltcover","11_4566":"crankcase cylR cylL headR headL crank pistonR pistonL","11_4589":"crankcase cylR cylL headR headL coverR coverL beltcover crank pistonR pistonL camsR camsL camchains balancer oilpump","11_5104":"crankcase","11_6541":"camsR:cam camsL:cam","11_7101":"coverR coverL","12_1259":"plugR plugL coilR coilL connR connL","12_2110":"starter","12_2111":"alternator belt","12_2129":"harness","12_2359":"sensors","12_2365":"sensors","12_2366":"iat","12_2368":"sensors","12_2412":"sensors","12_2413":"sensors","13_1118":"airbox airfilter intakeDuct","13_1391":"throttle","13_1516":"fuelLine","13_1705":"ecu","13_1876":"throttle","13_1979":"ecu","16_0907":"fuelCap","16_0909":"tank","16_1098":"canister","16_1099":"fuelPump","16_1121":"tank","17_0730":"cooler oilLines","18_0529":"headers collector lambda","18_1206":"flap","18_1870":"silencers","21_0195":"clutch","21_0307":"clutchSlave","23_0964":"shiftLink","23_1108":"gears","23_1109":"shiftMech","23_1110":"shiftMech","23_1114":"gearbox","23_1115":"gearbox gears shiftMech","23_1120":"gearbox","31_1297":"fork","31_1302":"fork","31_1303":"fork","31_1304":"triple","32_2466":"triple","32_2481":"bars","32_2483":"bars throttle","32_2498":"resF","32_2499":"clutchMaster","32_2701":"bars","32_2752":"bars","32_2753":"bars","32_2754":"bars","33_1226":"swingarm pivots","33_1622":"finaldrive fdgear fdfill fddrain","33_1626":"finaldrive fdgear","33_1627":"finaldrive fdgear","33_1651":"driveshaft","33_1873":"strut","33_2050":"shock","34_1393":"brakeR","34_1994":"resF resR clutchMaster","34_2092":"abs","34_2427":"brakeF","34_2434":"rearMaster resR","34_2435":"wheelSensors","34_2436":"wheelSensors","34_2437":"brakeLines","34_2438":"brakeLines","35_0478":"rearMaster","36_2298":"wheelF wheelR","36_2300":"wheelR","36_2301":"wheelF","36_2309":"wheelF","36_2310":"wheelR","36_2575":"wheelF wheelR","46_1535":"frame","46_1553":"throttle","46_1554":"frame seat","46_1556":"tail","46_1829":"airbox","46_1889":"frame","46_1891":"frame","46_1892":"standSwitch","46_1894":"fender","46_1901":"instrument","46_1902":"bars","46_1903":"pegs","46_2027":"pegs","46_2028":"pegs","46_2062":"pegs","51_0602":"bars","51_3316":"bars","51_3485":"bars","51_4053":"bars","51_4093":"fender","51_9980":"fender","52_4240":"seat","61_1998":"harness","61_2484":"harness","61_2485":"harness","61_3019":"diag","61_3065":"horn","61_3273":"harness loom underseat","61_3642":"standSwitch","61_3928":"battery","61_5083":"underseat","61_5196":"underseat","61_5331":"underseat","61_5658":"standSwitch","61_5758":"underseat relays","61_5852":"harness","61_5853":"harness","61_5909":"harness","61_5912":"diag","61_5935":"relays","61_6046":"rearMaster","61_6232":"harness","61_6289":"harness","61_6469":"harness","61_6470":"harness","61_6475":"harness","61_6476":"harness","61_6638":"diag","61_7021":"bars","61_7041":"bars","61_7044":"bars","61_7057":"bars","61_7058":"bars","61_7797":"harness","62_0636":"instrument","62_0642":"instrument","62_0644":"instrument","63_1582":"light","63_1756":"tail","63_1823":"light","63_1824":"tail","63_1827":"tail","63_2131":"light","63_2252":"light","63_2253":"light","63_2308":"tail","65_3038":"underseat","65_3230":"underseat","77_0029":"filler","77_0350":"coverR coverL","77_0351":"coverR coverL","77_0599":"bars","77_0659":"bars","77_0661":"light","77_0781":"tank","77_0835":"headers","77_0836":"coverR coverL","77_0837":"cooler","77_0840":"wheelF","77_0842":"bars","77_0843":"bars resF clutchMaster","77_0844":"pegs","77_0845":"throttle","77_0847":"bars","77_0850":"seat","77_0851":"seat","77_0852":"seat","77_0855":"coverR coverL","77_0859":"silencers","77_0867":"pegs","77_0869":"silencers","77_0870":"silencers","77_0879":"silencers","77_0880":"instrument","77_0882":"instrument","77_0886":"airbox","77_0887":"underseat","77_0912":"coverR coverL","77_0913":"coverR coverL","77_0950":"wheelF","77_0969":"fender","77_0978":"bars","77_0984":"airbox","77_1009":"instrument","77_1030":"light","77_1193":"beltcover","77_1306":"pegs","77_1344":"resF clutchMaster","77_1392":"wheelR","77_1396":"wheelR","77_0885":"triple","77_0857":"tank"};
function linkOf(d){const L=LINK[d.id];if(!L){const k=d.id+' '+d.t;for(const [re,id] of MAP)if(re.test(k)&&P[id])return {[id]:null};return null;}
  const o={};L.split(' ').forEach(x=>{const [id,tag]=x.split(':');if(!P[id]||P[id].gone)return;if(tag){(o[id]=o[id]||[]).push(tag);}else o[id]=null;});
  return Object.keys(o).length?o:null;}
const partOf=d=>{const o=linkOf(d);return o?Object.keys(o)[0]:null;};
async function load(){if(DATA)return DATA;try{DATA=await (await fetch('assets/catalog.json')).json();}catch(e){DATA=[];}return DATA;}
function rowsHTML(d){return `<table class="cat"><thead><tr><th>№</th><th>Номер BMW</th><th>Деталь</th><th>Шт</th></tr></thead><tbody>${d.r.map(r=>`<tr><td>${esc(r[0])}</td><td class="pn">${esc(r[1])}</td><td>${esc(r[2])}${r[4]?`<small>${esc(r[4])}</small>`:''}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table>${d.n&&d.n.length?`<p class="src">${d.n.map(esc).join('<br>')}</p>`:''}`;}
function list(){const ql=q.trim().toLowerCase().replace(/\s+/g,'');
  const hits=DATA.filter(d=>!ql||(d.id+d.t).toLowerCase().replace(/\s+/g,'').includes(ql)||d.r.some(r=>(r[1]+r[2]).toLowerCase().replace(/\s+/g,'').includes(ql)));
  const by={};hits.forEach(d=>{(by[d.id.slice(0,2)]=by[d.id.slice(0,2)]||[]).push(d);});
  return Object.keys(by).sort().map(g=>`<h3>${g} · ${esc(GROUPS[g]||'')}</h3><ul class="ops">${by[g].map(d=>{const pid=partOf(d);return `<li><button class="op catd" data-id="${d.id}"><b>${esc(d.t)}</b><span class="sub">${d.id} · ${d.r.length} поз.${pid?' · есть в 3D':''}</span></button>${open===d.id?`<div class="catbody">${pid?`<button class="chipbtn" data-show="${d.id}" aria-pressed="${!!(CATSHOW&&CATSHOW.id===d.id)}">${CATSHOW&&CATSHOW.id===d.id?'Убрать подсветку':'Показать на модели'}</button> `:'<span class="sub">Этой детали нет на модели (аксессуар или расходник).</span> '}<a class="chipbtn" target="_blank" rel="noopener" href="https://shop.maxbmw.com/fiche/DiagramsMain.aspx?vid=58482#${d.id}">Схема BMW</a>${rowsHTML(d)}</div>`:''}</li>`;}).join('')}</ul>`).join('')||'<p class="lead">Ничего не нашлось.</p>';}
function render(el){if(!DATA){el.innerHTML='<p class="lead">Загружаю каталог...</p>';load().then(()=>render(el));return;}
  el.innerHTML=`<h2>Каталог деталей BMW</h2><p class="lead">Все ${DATA.length} разделов официального каталога для R nineT Scrambler K23 (2015-2020): номер каждой детали, количество, замены номеров и оговорки «только для». Ищи по названию по-английски или по номеру.</p>
   <div class="search"><input id="catq" type="search" placeholder="например 11 12 или SPARK PLUG" value="${esc(q)}" aria-label="Поиск по каталогу"></div><div id="catl">${list()}</div>`;
  const inp=el.querySelector('#catq');inp.oninput=()=>{q=inp.value;el.querySelector('#catl').innerHTML=list();bind(el);};bind(el);}
function show(d){const parts=d&&linkOf(d);setCatShow(parts?{id:d.id,label:d.id+' '+d.t,parts}:null);}
function bind(el){el.querySelectorAll('.catd').forEach(b=>b.onclick=()=>{open=open===b.dataset.id?null:b.dataset.id;
    const d=DATA.find(x=>x.id===open);if(CATSHOW&&(!d||CATSHOW.id!==d.id))show(d&&linkOf(d)?d:null);
    el.querySelector('#catl').innerHTML=list();bind(el);});
  el.querySelectorAll('[data-show]').forEach(b=>b.onclick=()=>{const d=DATA.find(x=>x.id===b.dataset.show);show(CATSHOW&&CATSHOW.id===d.id?null:d);
    el.querySelector('#catl').innerHTML=list();bind(el);});}
return {render,load,linkOf,show,openDiag:(id)=>{if(H.openDiag)return H.openDiag(id);open=id;q='';setTab('cat');},partFor:(id)=>DATA?DATA.filter(d=>{const o=linkOf(d);return o&&id in o;}):[]};})();

/* ===== API for the app shell (app.js): everything the new interface needs, the 3D stays as it was ===== */
/* number plate: canvas texture on the blank plate, rear face */
let plateMesh=null;
function setPlate(txt){txt=String(txt||'').trim().toUpperCase().slice(0,12);
  if(!plateMesh){const p=P.tail;let blank=null;p.g.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.type==='ExtrudeGeometry'&&o.userData.scan)blank=o;});if(!blank)return false;
    const c=document.createElement('canvas');c.width=512;c.height=405;const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=8;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(214,168),new THREE.MeshStandardMaterial({map:tex,roughness:.5,metalness:0,transparent:true}));
    m.userData.baseOpacity=1;m.userData.part='tail';m.position.z=-2.4;m.rotation.y=Math.PI;blank.add(m);plateMesh={m,c,tex};}
  const {m,c,tex}=plateMesh;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);m.visible=!!txt;if(!txt)return true;
  x.fillStyle='#F4F5F2';x.beginPath();x.roundRect?x.roundRect(4,4,504,397,22):x.rect(4,4,504,397);x.fill();x.lineWidth=10;x.strokeStyle='#15181B';x.stroke();
  const parts=txt.split(/\s+/);let l1=txt,l2='';if(txt.length>5&&parts.length>1){l2=parts.pop();l1=parts.join(' ');}
  x.fillStyle='#15181B';x.textAlign='center';x.textBaseline='middle';
  const fit=(t,max,w)=>{let f=max;x.font='700 '+f+'px "Golos Text",Arial,sans-serif';while(x.measureText(t).width>w&&f>30){f-=6;x.font='700 '+f+'px "Golos Text",Arial,sans-serif';}};
  if(l2){fit(l1,150,460);x.fillText(l1,256,128);fit(l2,150,460);x.fillText(l2,256,290);}else{fit(l1,190,460);x.fillText(l1,256,206);}
  tex.needsUpdate=true;return true;}
/* paint: every material made from the 'paint' key (scanned tank and painted covers, headlight shell) */
function setPaint(hex){const col=new THREE.Color(hex||0x5a5e5f);scene.traverse(o=>{if(!o.material)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(q=>{if(q.userData&&q.userData.k==='paint')q.color.copy(col);});});}
function homeView(){if(tab==='cat'&&CATSHOW){catFocusView();return;}if(tab==='service'&&curOp){userCam=false;stepView();return;}
  goView(SYSDEF[tab]&&VIEWS['sys_'+tab]?'sys_'+tab:(tab==='engine'?'engine':'overall'));}
/* contours work like radio buttons: «Весь мотоцикл» or exactly one contour */
function setContour(id){activeSys=id&&CONTOURS.some(c=>c.id===id)?id:null;
  panel.querySelectorAll('[data-sys]').forEach(x=>{const on=(x.dataset.sys||null)===activeSys;x.setAttribute('aria-pressed',on);x.setAttribute('aria-checked',on);});
  setFlow(CONTOURS.find(c=>c.id===activeSys));if(activeSys)explode=0;setTargets();if(H.contour)H.contour(activeSys?CONTOURS.find(c=>c.id===activeSys):null);}
function setExplode(v){const o=explode;explode=Math.max(0,Math.min(1,v));dolly((1+0.9*explode)/(1+0.9*o));
  if(explode>0&&activeSys){setContour(null);return;}setTargets();}
/* still frame of the current view at any size (for the share card) */
/* draw the scene into an offscreen render target and read the pixels back: copying the WebGL canvas with drawImage gives a black
   picture in WebKit (Telegram on iPhone, Safari) unless the drawing buffer is preserved. 1.5x size, scaled down for smooth edges */
function renderToCanvas(w,h){const k=1.5,W=Math.round(w*k),Hh=Math.round(h*k);
  const rt=new THREE.WebGLRenderTarget(W,Hh,{depthBuffer:true});rt.texture.encoding=THREE.sRGBEncoding;
  const prev=renderer.getRenderTarget();renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,camera);
  const px=new Uint8Array(W*Hh*4);renderer.readRenderTargetPixels(rt,0,0,W,Hh,px);renderer.setRenderTarget(prev);rt.dispose();
  const big=document.createElement('canvas');big.width=W;big.height=Hh;const bx=big.getContext('2d'),img=bx.createImageData(W,Hh),row=W*4;
  for(let y=0;y<Hh;y++)img.data.set(px.subarray((Hh-1-y)*row,(Hh-y)*row),y*row);
  for(let i=3;i<img.data.length;i+=4)img.data[i]=255;bx.putImageData(img,0,0);
  const c=document.createElement('canvas');c.width=w;c.height=h;const cx=c.getContext('2d');cx.imageSmoothingQuality='high';cx.drawImage(big,0,0,w,h);return c;}
function snapshot(w,h,view){const vo=camera.view&&camera.view.enabled?Object.assign({},camera.view):null;camera.clearViewOffset();const sz=new THREE.Vector2();renderer.getSize(sz);const pr=renderer.getPixelRatio(),asp=camera.aspect,fov=camera.fov;
  const cp=camera.position.clone(),ct=controls.target.clone();
  if(view){const V=VIEWS[view];camera.position.set(...V.p).multiplyScalar(S);controls.target.set(...V.t).multiplyScalar(S);camera.lookAt(controls.target);}
  camera.aspect=w/h;camera.fov=w/h<1.1?Math.min(68,34*1.1/(w/h)):34;camera.updateProjectionMatrix();
  const c=renderToCanvas(w,h);
  camera.position.copy(cp);controls.target.copy(ct);camera.lookAt(ct);renderer.setPixelRatio(pr);renderer.setSize(sz.x,sz.y,false);camera.aspect=asp;camera.fov=fov;if(vo)camera.setViewOffset(vo.fullWidth,vo.fullHeight,vo.offsetX,vo.offsetY,vo.width,vo.height);camera.updateProjectionMatrix();renderer.render(scene,camera);return c;}
/* operation steps: the camera frames the parts of the step (from the step's preset side), fitted to a phone held upright and to the
   part of the 3D that the sheet leaves free. Once the user turns the view by hand, steps keep that view until «Показать шаг». */
let userCam=false,camDrag=false;const occl=new Set();
/* parts between the camera and the parts of the step fade out, nothing else: the work stays visible from any angle */
function computeOccl(cam){occl.clear();if(!curOp){return;}const ids=stepFocus().ids,b=partsBox(ids);if(b.isEmpty()){setTargets();return;}
  const c=b.getCenter(new V3()),h=b.getSize(new V3()).multiplyScalar(0.3),focus=new Set(ids),pts=[c];
  [[1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],[-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1]].forEach(k=>pts.push(c.clone().add(new V3(h.x*k[0],h.y*k[1],h.z*k[2]))));
  const cand=pickables.filter(m=>{let o=m;while(o){if(o.visible===false)return false;o=o.parent;}const q=P[m.userData.part];return q&&q.tgt.op>0.3;});
  pts.forEach(pt=>{const d=pt.clone().sub(cam),L=d.length();ray.set(cam,d.normalize());ray.far=L;
    for(const hit of ray.intersectObjects(cand,false)){const id=hit.object.userData.part;if(focus.has(id))break;occl.add(id);}});
  ray.far=Infinity;setTargets();}
controls.addEventListener('end',()=>{if(tab==='service'&&curOp&&userCam)computeOccl(camera.position.clone());});
controls.addEventListener('start',()=>{camDrag=true;});
controls.addEventListener('end',()=>{camDrag=false;});
controls.addEventListener('change',()=>{if(camDrag&&tab==='service'&&curOp&&!fly)userCam=true;});
function partsBox(ids){const b=new THREE.Box3();ids.forEach(id=>{const p=P[id];if(!p||p.gone)return;p.g.updateMatrixWorld(true);
  p.g.traverse(m=>{if(!m.isMesh||!m.geometry||m.userData.dead)return;let q=m,ok=true;while(q&&q!==p.g){if(q.visible===false){ok=false;break;}q=q.parent;}if(!ok)return;
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));});});return b;}
/* a step that touches both cylinders is shown on one side only (the right one): the left is the same, the owner repeats it */
function stepFocus(){if(!curOp)return {ids:[],side:null};const f=curOp.steps[curStep].f||[];
  const paired=f.filter(id=>/[LR]$/.test(id)&&f.indexOf(id.slice(0,-1)+(id.endsWith('L')?'R':'L'))>=0);
  if(!paired.length)return {ids:f,side:null};return {ids:f.filter(id=>!(paired.indexOf(id)>=0&&id.endsWith('L'))),side:'R'};}
function stepView(){if(!curOp||userCam)return;const s=curOp.steps[curStep],V=VIEWS[s.v]||VIEWS.overall,F=stepFocus();
  const vp=new V3(...V.p).multiplyScalar(S),vt=new V3(...V.t).multiplyScalar(S),dir0=vp.clone().sub(vt).normalize();
  if(F.side==='R'&&dir0.z<0.55){dir0.set(dir0.x*0.45,Math.max(0.35,dir0.y*0.6),0.85).normalize();}
  const b=partsBox(F.ids);if(b.isEmpty()){goView(s.v);return;}
  const c=b.getCenter(new V3()),sz=b.getSize(new V3()).max(new V3(3.6,3.0,3.6))/* at least a whole cylinder with its head in frame */,h=sz.clone().multiplyScalar(0.5);
  const R=canvas.parentElement.getBoundingClientRect(),H0=Math.max(1,R.height),visH=Math.max(120,H0-insetB);
  const t2=Math.tan(camera.fov*Math.PI/360),tV=t2*visH/H0,tH=t2*R.width/H0;
  const corners=[];for(const i of[-1,1])for(const j of[-1,1])for(const k of[-1,1])corners.push(new V3(h.x*i,h.y*j,h.z*k));
  /* distance that fits the box's corners (not its sphere) for a given viewing direction */
  const need=d=>{const f=d.clone().negate(),right=new V3().crossVectors(f,new V3(0,1,0));if(right.lengthSq()<1e-6)right.set(1,0,0);right.normalize();const up=new V3().crossVectors(right,f).normalize();
    let m=0;corners.forEach(v=>{const x=Math.abs(v.dot(right)),y=Math.abs(v.dot(up)),z=v.dot(d);m=Math.max(m,x/tH+z,y/tV+z);});return m;};
  /* the step's own side first, then the same side turned 35° either way: the one that needs the least distance shows the parts biggest */
  const cands=[0,35,-35].map(a=>dir0.clone().applyAxisAngle(new V3(0,1,0),a*Math.PI/180));
  let best=cands[0],bd=need(best)*0.92;cands.slice(1).forEach(d=>{const n=need(d);if(n<bd){bd=n;best=d;}});
  const dist=Math.max(controls.minDistance+0.3,need(best)*1.2);
  const p=c.clone().addScaledVector(best,dist);document.getElementById('tag3d').textContent='ВИД: '+V.n;computeOccl(p);
  if(RM){camera.position.copy(p);controls.target.copy(c);fly=null;return;}
  fly={p0:camera.position.clone(),t0:controls.target.clone(),p,t:c,s:performance.now(),d:900};}
/* studio shot of a few parts alone (custom cards): other parts, floor and flows hidden for one frame, then everything back */
function partShot(ids,w,h,o){o=o||{};if(o.all)ids=Object.values(P).filter(p=>p.g.visible&&!p.gone&&p.layer!=='tool'&&p.layer!=='fx'&&p.cur.op>0.5).map(p=>p.id);const keep=new Set(ids),vis=[];
  const sv=o2=>{vis.push([o2,o2.visible]);};
  Object.values(P).forEach(p=>{sv(p.g);p.g.visible=keep.has(p.id)&&!p.gone;});
  [turntable,ticks,flowGroup,window.__floorSh].forEach(x=>{if(x){sv(x);x.visible=false;}});
  const mats=[];ids.forEach(id=>{const p=P[id];if(!p)return;p.g.traverse(m=>{if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(q=>{mats.push([q,q.opacity,q.emissive?q.emissive.clone():null,q.depthWrite]);q.opacity=1;q.depthWrite=true;if(q.emissive&&!(q.userData&&q.userData.baseEm))q.emissive.setRGB(0,0,0);else if(q.emissive)q.emissive.copy(q.userData.baseEm);});});});
  const box=new THREE.Box3();ids.forEach(id=>{const p=P[id];if(!p)return;p.g.updateMatrixWorld(true);p.g.traverse(m=>{if(!m.isMesh||!m.visible||!m.geometry||m.userData.dead)return;let ok=true,q=m;while(q){if(q.visible===false){ok=false;break;}q=q.parent;}if(!ok)return;if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld));});});
  const c=box.getCenter(new V3()),rad=Math.max(0.05,box.getSize(new V3()).length()/2);
  const bg0=scene.background,cp=camera.position.clone(),ct=controls.target.clone(),asp=camera.aspect,fov=camera.fov,vo=camera.view&&camera.view.enabled?Object.assign({},camera.view):null;
  const sz=new THREE.Vector2();renderer.getSize(sz);const pr=renderer.getPixelRatio();
  scene.background=new THREE.Color(o.bg||'#F3F4F5');camera.clearViewOffset();camera.aspect=w/h;camera.fov=o.fov||30;camera.updateProjectionMatrix();
  const dir=new V3(...(o.dir||[0.55,0.42,0.72])).normalize(),dist=rad/Math.sin(camera.fov*Math.PI/360)*1.05;
  camera.position.copy(c).addScaledVector(dir,dist);camera.lookAt(c);
  if(o.flat)scene.overrideMaterial=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.DoubleSide});
  /* o.groups: {partId: colour} flat colours per part in one frame (part maps, masks) */
  const swapped=[];if(o.groups){scene.overrideMaterial=null;const cache={};ids.forEach(id=>{const col=o.groups[id]!=null?o.groups[id]:0x000000;const mm=cache[col]||(cache[col]=new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide}));
    P[id].g.traverse(m=>{if(m.isMesh){swapped.push([m,m.material]);m.material=mm;}});});}
  const out=renderToCanvas(w,h);scene.overrideMaterial=null;swapped.forEach(([m,q])=>m.material=q);
  vis.forEach(([x,v])=>x.visible=v);mats.forEach(([q,op,em,dw])=>{q.opacity=op;q.depthWrite=dw;if(em)q.emissive.copy(em);});
  scene.background=bg0;camera.position.copy(cp);controls.target.copy(ct);camera.lookAt(ct);camera.aspect=asp;camera.fov=fov;if(vo)camera.setViewOffset(vo.fullWidth,vo.fullHeight,vo.offsetX,vo.offsetY,vo.width,vo.height);camera.updateProjectionMatrix();
  renderer.setPixelRatio(pr);renderer.setSize(sz.x,sz.y,false);renderer.render(scene,camera);return out;}
window.R9T={partShot,
  P,OPS,VIEWS,SYSDEF,CAT,
  get tab(){return tab;},get ready(){return GLB_OK;},get explode(){return explode;},get autoRot(){return autoRot;},get xray(){return xray;},get op(){return curOp;},get step(){return curStep;},
  setTab,renderPanel,setContour,CONTOURS,get contour(){return activeSys;},pickAt,select,setPlate,setPaint,homeView,setExplode,snapshot,goView,
  setAutoRot(v){autoRot=!!v;},setXray(v){xray=!!v;setTargets();},
  opOpen(id){curOp=OPS.find(o=>o.id===id)||null;curStep=0;userCam=false;setTab('service');if(curOp)stepView();return curOp;},
  opStep(i){if(!curOp)return;curStep=Math.max(0,Math.min(curOp.steps.length-1,i));setTargets();stepView();},
  opClose(){curOp=null;curStep=0;userCam=false;occl.clear();},
  opResetView(){userCam=false;stepView();},
  get userCam(){return userCam;},get stepSide(){return stepFocus().side;},
  get ghost(){return ghost;},setGhost(v){ghost=!!v;setTargets();},
  setPaused(v){paused=!!v;},resize,setInset(px){insetB=Math.max(0,px|0);applyInset();camera.updateProjectionMatrix();}};
window.THREE=THREE;window.__r9t={setTab,openOp,P,goView,setStep:(i)=>{curStep=i;renderStep();setTargets();goView(curOp.steps[i].v);},goViewRaw:(V)=>{camera.position.set(...V.p).multiplyScalar(S);controls.target.set(...V.t).multiplyScalar(S);fly=null;}};
})();
