import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {randomSource} from './model.mjs';
const PALETTE={earth:0xe5ddc9,outer:0xcecfb3,road:0xf2ead9,paver:0xdfd6c1,water:0x76aba5,water2:0x85b9b0,foam:0xb7d3bf,bank:0xc1b79e,wall:0x65706b,stone:0x82908a,brick:0x525e59,plaster:0xd8cdbc,white:0xece3d0,wood:0x675a48,red:0x8e4c3b,door:0x393d36,roof:0x626b65,roof2:0x737b70,ridge:0x8a8d7c,gold:0xbba26b,goldRidge:0xd2bb7d,leaf:0x6f865c,leaf2:0x859768,pine:0x536f5a,trunk:0x807058};
class Batch{
  constructor(group){this.group=group;this.records=new Map();this.tris=new Map();this.materials=new Map();this.matrix=new T.Matrix4();}
  material(name){if(!this.materials.has(name))this.materials.set(name,new T.MeshStandardMaterial({color:PALETTE[name]??name,roughness:.93,metalness:0}));return this.materials.get(name);}
  add(shape,mat,x,y,z,w,h,d,rot=0){const k=shape+':'+mat;if(!this.records.has(k))this.records.set(k,[]);this.records.get(k).push({x,y,z,w,h,d,rot,shape,mat});}
  box(x,y,z,w,h,d,mat,rot=0){this.add('box',mat,x,y,z,w,h,d,rot);}
  ball(x,y,z,w,h,d,mat){this.add('ball',mat,x,y,z,w,h,d);}
  cylinder(x,y,z,r,h,mat){this.add('cylinder',mat,x,y,z,r*2,h,r*2);}
  triangle(mat,...points){if(!this.tris.has(mat))this.tris.set(mat,[]);this.tris.get(mat).push(...points.flat());}
  finish(){
    const gs={box:new T.BoxGeometry(1,1,1),ball:new T.IcosahedronGeometry(.5,1),cylinder:new T.CylinderGeometry(.5,.58,1,7),cone:new T.ConeGeometry(.5,1,7)};
    const obj=new T.Object3D();
    for(const list of this.records.values()){const mesh=new T.InstancedMesh(gs[list[0].shape],this.material(list[0].mat),list.length);list.forEach((v,i)=>{obj.position.set(v.x,v.y,v.z);obj.scale.set(v.w,v.h,v.d);obj.rotation.set(0,v.rot,0);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);});mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();this.group.add(mesh);}
    for(const[mat,values]of this.tris){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(values,3));g.computeVertexNormals();const m=new T.Mesh(g,this.material(mat));m.castShadow=true;m.receiveShadow=true;this.group.add(m);}
  }
}
function roof(batch,x,y,z,w,d,h,rot=0,gold=false){
  const world=(lx,ly,lz)=>[x+lx*Math.cos(rot)+lz*Math.sin(rot),y+ly,z-lx*Math.sin(rot)+lz*Math.cos(rot)];
  const material=gold?'gold':'roof',line=gold?'goldRidge':'ridge';
  // Two curved roof slopes, raised eaves and end corners; tiles stay within the lot.
  for(const side of [-1,1])for(let row=0;row<3;row++){
    const zs=[0,d*.26,d*.43,d*.5],ys=[h,h*.39,h*.08,h*.17];
    for(let column=0;column<8;column++){
      const a=-w/2+w*column/8,b=-w/2+w*(column+1)/8,up=t=>Math.pow(Math.abs(t)/(w/2),6)*h*.18;
      const p1=world(a,ys[row]+up(a),zs[row]*side),p2=world(b,ys[row]+up(b),zs[row]*side),p3=world(b,ys[row+1]+up(b),zs[row+1]*side),p4=world(a,ys[row+1]+up(a),zs[row+1]*side);
      if(side===1){batch.triangle(material,p3,p2,p1);batch.triangle(material,p4,p3,p1);}else{batch.triangle(material,p1,p2,p3);batch.triangle(material,p1,p3,p4);}
    }
  }
  // Fine horizontal tile courses and ridge caps make the roofs legible on close zoom.
  for(const s of [-1,1])for(let j=1;j<=5;j++){const zz=d*.5*j/5,hh=h*(1-j/5)**2+h*.12;const p=world(0,hh+.006,zz*s);batch.box(p[0],p[1],p[2],w*.96,.012,.015,line,rot);}
  for(const s of [-1,1]){const p=world(0,h*.18,s*d*.5);batch.box(...p,w,.035,.026,material,rot);}
  batch.box(x,y+h+.016,z,w*1.01,.035,.055,line,rot);
  for(const s of [-1,1]){const p=world(w*.47*s,h+.045,0);batch.box(...p,.045,.08,.045,line,rot);}
}
export function buildCityScene(city){
  const group=new T.Group(),batch=new Batch(group),rng=randomSource(city.params.seed+'-materials'),W=city.width,H=city.height;
  const xx=x=>x-W/2+.5,zz=y=>y-H/2+.5;
  batch.box(0,-.46,0,W+1.8,.78,H+1.8,'earth');batch.box(0,-.065,0,W+.3,.055,H+.3,'outer');
  city.cells.forEach((v,i)=>{
    const x=i%W,y=(i/W)|0,X=xx(x),Z=zz(y);
    if(v===1)batch.box(X,-.018,Z,1,.045,1,'earth');
    if(v===2||v===4){batch.box(X,-.041,Z,1,.022,1,(x+y)%7?'water':'water2');
      if(v===2&&rng()<.18){batch.box(X-.08,-.022,Z,.4,.009,.014,'foam');batch.box(X+.1,-.022,Z+.07,.18,.009,.012,'foam');}
      for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nv=city.cells[(y+dy)*W+x+dx];if(nv===1||nv===3)batch.box(X+dx*.48,.008,Z+dy*.48,dx?.065:1,.07,dy?.065:1,'bank');}
    }
    if(v===3||v===6){batch.box(X,.014,Z,1,.035,1,'road');if(v===3&&rng()<.33)for(let k=-1;k<=1;k++)batch.box(X,.034,Z+k*.28,.92,.006,.009,'paver');}
    if(v===4){
      batch.box(X,.17,Z,1,.17,.81,'stone');batch.box(X,.268,Z,1,.022,.75,'road');
      for(const s of [-1,1]){batch.box(X,.48,Z+s*.37,1.02,.045,.045,'white');for(const a of [-.4,0,.4])batch.box(X+a,.375,Z+s*.37,.042,.24,.045,'white');}
    }
    if(v===5){
      const alongZ=x===3||x===W-4||(city.cells[y*W+x-1]===0||city.cells[y*W+x+1]===0),rot=alongZ?Math.PI/2:0;
      batch.box(X,.48,Z,1.03,.96,.78,'wall',rot);batch.box(X,.995,Z,1.045,.095,.83,'stone',rot);
      for(const s of [-.34,.34]){batch.box(X+s*Math.cos(rot),1.15,Z-s*Math.sin(rot),.30,.25,.82,'wall',rot);}
      for(const h of [.19,.41,.64,.82])for(const s of [-1,1])batch.box(X+s*Math.sin(rot)*.393,h,Z+s*Math.cos(rot)*.393,1,.018,.012,'brick',rot);
    }
  });
  // Gate towers have an actual clear passage under the lintel.
  for(const g of city.gates){const X=xx(g.x),Z=zz(g.y),rot=g.x===3||g.x===W-4?Math.PI/2:0;
    const b=(x,y,z,w,h,d,m)=>batch.box(X+x*Math.cos(rot)+z*Math.sin(rot),y,Z-x*Math.sin(rot)+z*Math.cos(rot),w,h,d,m,rot);
    b(-.40,.45,0,.21,.9,.85,'wall');b(.40,.45,0,.21,.9,.85,'wall');b(0,.91,0,1.1,.32,.90,'wall');b(0,1.21,0,1.05,.29,.69,'red');
    for(const s of [-1,1]){b(s*.39,1.25,.37,.045,.43,.045,'wood');b(s*.39,1.25,-.37,.045,.43,.045,'wood');}
    roof(batch,X,1.43,Z,1.38,1.14,.30,rot);b(0,1.82,0,.74,.17,.51,'red');roof(batch,X,1.92,Z,1.04,.85,.25,rot);b(0,1.27,.39,.28,.11,.023,'gold');
  }
  for(const b of city.buildings){
    const box=b.bbox||{x:Math.min(...b.cells.map(p=>p.x)),y:Math.min(...b.cells.map(p=>p.y)),w:1,h:1},X=box.x+box.w/2-W/2,Z=box.y+box.h/2-H/2,rot=b.rotation;
    const swapped=Math.abs(Math.sin(rot))>.5,w=(swapped?box.h:box.w)-.16,d=(swapped?box.w:box.h)-.16,gold=b.area===8&&b.variant===1;
    const pt=(x,y,z)=>[X+x*Math.cos(rot)+z*Math.sin(rot),y,Z-x*Math.sin(rot)+z*Math.cos(rot)];
    const boxAt=(x,y,z,a,h,c,m)=>batch.box(...pt(x,y,z),a,h,c,m,rot);
    const hall=(x,z,a,c,height,mat='plaster')=>{
      boxAt(x,height/2+.055,z,a,height,c,mat);boxAt(x,.07,z,a+.025,.07,c+.025,'stone');
      const r=pt(x,height+.055,z);roof(batch,...r,a+.09,c+.09,Math.min(a,c)*.28+.10,rot,gold);
      const doorW=Math.min(.19,a*.27);boxAt(x,.20,z+c*.5+.008,doorW,.29,.023,'door');
      for(const side of [-1,1]){if(a>.57)boxAt(x+side*a*.30,.31,z+c*.5+.011,a*.12,.12,.027,'wood');}
      if(mat==='red')for(const side of [-1,1])boxAt(x+side*a*.42,height*.49,z+c*.53,.037,height,.045,'wood');
    };
    boxAt(0,.037,0,w,.06,d,'paver');
    if(b.area<=2){
      const h=b.height+(b.area===2&&b.variant===2?.18:0);hall(0,-.035,w-.10,d-.18,h,b.variant===1?'white':'plaster');
      if(b.area===2&&b.variant%2===0){boxAt(0,.31,d*.43,w*.73,.035,.13,'wood');for(const s of [-1,1])boxAt(s*w*.34,.16,d*.46,.028,.3,.028,'wood');}
    }else if(w<1.2||d<1.2){hall(0,0,w-.09,d-.12,.48);}
    else{
      const wing=.34,back=.55,mat=b.area===8?'red':'white';
      hall(0,-d/2+back/2+.07,w-.12,back,b.area===8?.68:.47,mat);
      hall(-w/2+wing/2+.05,.12,wing,d-back-.36,.34,'plaster');hall(w/2-wing/2-.05,.12,wing,d-back-.36,.34,'plaster');
      // Courtyard walls and a separate entrance pavilion are contained in the occupied rectangle.
      boxAt(0,.16,d/2-.03,w,.28,.06,'white');hall(0,d/2-.22,Math.min(.66,w*.44),.30,.29,mat);
      boxAt(0,.18,d/2+.012,.18,.30,.065,'door');
      if(b.area===8&&d>3){hall(0,-.15,w*.53,.55,.52,mat);for(const s of [-1,1])boxAt(s*w*.23,.06,d*.13,.08,.035,.6,'stone');}
      boxAt(0,.075,d*.06,.24,.075,.24,'stone');batch.ball(...pt(0,.19,d*.06),.18,.27,.18,'leaf2');
    }
    // Red lanterns at selected shop/courtyard entrances.
    if(b.area>1&&b.variant!==3){for(const s of [-1,1])batch.ball(...pt(s*Math.min(.2,w*.26),.30,d*.46),.065,.095,.065,'red');}
  }
  for(const tree of city.trees){const x=xx(tree.x),z=zz(tree.y),s=tree.scale||1,leaf=tree.kind==='pine'?'pine':rng()<.5?'leaf':'leaf2';
    batch.cylinder(x,.26*s,z,.035*s,.52*s,'trunk');
    if(tree.kind==='pine')for(let j=0;j<3;j++)batch.add('cone',leaf,x,(.49+j*.16)*s,z,(.64-j*.13)*s,.47*s,(.64-j*.13)*s);
    else{
      batch.ball(x,.64*s,z,.65*s,.65*s,.66*s,leaf);
      for(let k=0;k<4;k++){const a=k*Math.PI/2+.6;batch.ball(x+Math.cos(a)*.19*s,.53*s,z+Math.sin(a)*.19*s,.43*s,.45*s,.42*s,leaf);}
      if(tree.kind==='willow')for(let k=0;k<7;k++){const a=k*Math.PI*2/7;batch.ball(x+Math.cos(a)*.28*s,.35*s,z+Math.sin(a)*.28*s,.095*s,.48*s,.12*s,'leaf2');}
    }
  }
  batch.finish();
  group.userData={buildings:city.buildings.length,treeCount:city.trees.length};
  return group;
}
function disposeGroup(group){if(!group)return;const gs=new Set(),ms=new Set();group.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m));});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());group.removeFromParent();}
function makePeople(city){
  const group=new T.Group(),rng=randomSource(city.params.seed+'-people'),walkable=city.walkable,lookup=new Map(walkable.map(p=>[p.x+','+p.y,p]));
  const count=Math.min(54,Math.floor(walkable.length/6)),people=[],dummy=new T.Object3D();
  const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
  const parts={body:new T.InstancedMesh(new T.CylinderGeometry(.043,.073,.15,7),mat,count),head:new T.InstancedMesh(new T.SphereGeometry(.032,7,5),new T.MeshStandardMaterial({color:0xc4a37b}),count),hat:new T.InstancedMesh(new T.ConeGeometry(.05,.035,7),new T.MeshStandardMaterial({color:0x625b48}),count),limbs:new T.InstancedMesh(new T.BoxGeometry(.02,.083,.021),new T.MeshStandardMaterial({color:0x564f43}),count*4)};
  const colors=[0xa55b42,0x556f79,0xb29459,0x7b705f,0x728775,0xd0bda0];
  const options=(p,old)=>{let n=[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>lookup.get((p.x+x)+','+(p.y+y))).filter(Boolean);if(n.length>1&&old)n=n.filter(v=>v.x!==old.x||v.y!==old.y);return n;};
  for(let i=0;i<count;i++){const from=walkable[Math.floor(rng()*walkable.length)],ns=options(from);people.push({from,to:ns[Math.floor(rng()*ns.length)]||from,t:rng(),speed:.19+rng()*.13,phase:rng()*6.28});parts.body.setColorAt(i,new T.Color(colors[i%colors.length]));}
  Object.values(parts).forEach(p=>{p.frustumCulled=false;p.castShadow=true;p.instanceMatrix.setUsage(T.DynamicDrawUsage);group.add(p);});
  const pose=(mesh,i,x,y,z,rx=0,ry=0)=>{dummy.position.set(x,y,z);dummy.rotation.set(rx,ry,0,'YXZ');dummy.scale.set(1,1,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);};
  let time=0;
  const update=dt=>{
    time+=dt;people.forEach((p,i)=>{
      p.t+=dt*p.speed;if(p.t>=1){p.t-=1;const ns=options(p.to,p.from);p.from=p.to;p.to=ns[Math.floor(rng()*ns.length)]||p.from;}
      const x=p.from.x+(p.to.x-p.from.x)*p.t-city.width/2+.5,z=p.from.y+(p.to.y-p.from.y)*p.t-city.height/2+.5,angle=Math.atan2(p.to.x-p.from.x,p.to.y-p.from.y);
      const h=q=>city.cells[q.y*city.width+q.x]===4?.286:.045,y=h(p.from)*(1-p.t)+h(p.to)*p.t,step=Math.sin(time*7+p.phase)*.5;
      pose(parts.body,i,x,y+.15,z,0,angle);pose(parts.head,i,x,y+.26,z);pose(parts.hat,i,x,y+.29,z);
      for(let k=0;k<4;k++){const side=k%2?1:-1,leg=k<2,off=side*(leg?.025:.068),sx=x+Math.cos(angle)*off,sz=z-Math.sin(angle)*off;pose(parts.limbs,i*4+k,sx,y+(leg?.06:.155),sz,side*step*(leg?1:-1),angle);}
    });Object.values(parts).forEach(m=>m.instanceMatrix.needsUpdate=true);
  };
  update(0);return {group,update,count,people};
}
export class CityView{
  constructor(container){
    this.container=container;this.mode='3d';this.paused=false;this.disposed=false;this.time=0;this.onSelect=null;
    this.canvas=document.createElement('canvas');container.append(this.canvas);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    try{
      this.renderer=new T.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
      this.scene=new T.Scene();this.scene.background=new T.Color(0xebe7db);this.camera=new T.PerspectiveCamera(40,1,.15,4000);
      this.scene.add(new T.HemisphereLight(0xfff8e7,0x898d78,2.2));const sun=new T.DirectionalLight(0xffefd2,3.0);sun.position.set(-28,58,34);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:60,bottom:-60,near:1,far:160});sun.shadow.bias=-.0004;sun.shadow.normalBias=.08;this.scene.add(sun);
      this.controls=new OrbitControls(this.camera,this.canvas);this.controls.enableDamping=true;this.controls.dampingFactor=.075;this.controls.minDistance=10;this.controls.maxDistance=360;this.controls.maxPolarAngle=Math.PI*.49;this.controls.minPolarAngle=.08;this.controls.enablePan=true;this.controls.screenSpacePanning=true;
      this.raycaster=new T.Raycaster();this.pointer=new T.Vector2();this.groundPlane=new T.Plane(new T.Vector3(0,1,0),0);this.hit=new T.Vector3();
      this.selection=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0xc7904b,transparent:true,opacity:.26,depthWrite:false}));this.selection.visible=false;this.scene.add(this.selection);
      this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.paused=true;container.dispatchEvent(new CustomEvent('view-error',{detail:'三维画面暂时中断，请刷新页面恢复。'}));});
    }catch(err){this.renderer=null;this.mode='top';this.canvas.remove();this.canvas=document.createElement('canvas');container.append(this.canvas);this.fallbackReason='当前设备未提供三维加速，已切换俯瞰地图。';}
    let down;
    this.canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
    this.canvas.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6)this.selectAt(e.clientX,e.clientY);});
    let previous=performance.now();const frame=now=>{if(this.disposed)return;this.frameId=requestAnimationFrame(frame);const dt=Math.min(.05,(now-previous)/1000);previous=now;if(!this.renderer)return;this.controls.update();if(!this.paused&&this.people&&this.mode!=='lots')this.people.update(dt);this.renderer.render(this.scene,this.camera);};this.frameId=requestAnimationFrame(frame);this.resize();
  }
  setCity(city){
    this.city=city;this.occupancy=new Map();city.buildings.forEach(b=>b.cells.forEach(p=>this.occupancy.set(p.x+','+p.y,b)));
    if(!this.renderer){this.resize();return;}
    disposeGroup(this.world);disposeGroup(this.people?.group);disposeGroup(this.lots);
    this.world=buildCityScene(city);this.scene.add(this.world);this.people=makePeople(city);this.scene.add(this.people.group);
    this.lots=new T.Group();const b=new Batch(this.lots),colors={1:'0x76968c',2:'0xa8a57a',4:'0xbd8b61',8:'0x886f77'};
    city.cells.forEach((v,i)=>b.box(i%city.width-city.width/2+.5,.01,Math.floor(i/city.width)-city.height/2+.5,.98,.03,.98,['outer','earth','water','road','white','wall','red'][v]));
    city.buildings.forEach(building=>building.cells.forEach(p=>b.box(p.x-city.width/2+.5,.048,p.y-city.height/2+.5,.88,.04,.88,Number(colors[building.area]))));
    city.trees.forEach(p=>b.ball(p.x-city.width/2+.5,.07,p.y-city.height/2+.5,.21,.04,.21,'leaf'));b.finish();this.scene.add(this.lots);this.selection.visible=false;this.setMode(this.mode);this.fit();
  }
  setMode(mode){if(!['3d','top','lots'].includes(mode))return;this.mode=!this.renderer&&mode==='3d'?'top':mode;if(this.renderer){if(this.world)this.world.visible=this.mode!=='lots';if(this.people)this.people.group.visible=this.mode!=='lots';if(this.lots)this.lots.visible=this.mode==='lots';this.controls.enableRotate=this.mode==='3d';this.fit();}else this.resize();}
  setPaused(paused){this.paused=!!paused;}
  fit(){if(!this.renderer)return;this.controls.target.set(0,0,0);const span=this.city?Math.max(this.city.width,this.city.height):60;if(this.mode==='3d')this.camera.position.set(span*1.05,span*1.28,span*1.32);else this.camera.position.set(0,span*2.6,.01);this.camera.near=Math.max(.12,span*.002);this.camera.far=Math.max(1200,span*16);this.controls.minDistance=span*.2;this.controls.maxDistance=span*7;this.camera.lookAt(0,0,0);this.camera.updateProjectionMatrix();this.controls.update();this.resize();}
  resize(){
    const w=Math.max(1,this.container.clientWidth),h=Math.max(1,this.container.clientHeight);
    if(this.renderer){this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
    else{this.canvas.width=w*Math.min(devicePixelRatio,2);this.canvas.height=h*Math.min(devicePixelRatio,2);this.drawFallback();}
  }
  drawFallback(){const c=this.city;if(!c)return;const g=this.canvas.getContext('2d'),w=this.canvas.width,h=this.canvas.height,s=Math.min(w/c.width,h/c.height)*.94,ox=(w-c.width*s)/2,oy=(h-c.height*s)/2;this.layout={s,ox,oy};g.clearRect(0,0,w,h);const colors=['#d5d5bd','#e6dfcb','#79ada6','#faf1dc','#a99a7d','#586660','#a15e42'];c.cells.forEach((v,i)=>{g.fillStyle=colors[v];g.fillRect(ox+i%c.width*s,oy+Math.floor(i/c.width)*s,s+.4,s+.4);});c.buildings.forEach(b=>{g.fillStyle=this.mode==='lots'?{1:'#76968c',2:'#a8a57a',4:'#bd8b61',8:'#886f77'}[b.area]:'#5e6860';for(const p of b.cells){g.fillRect(ox+(p.x+.11)*s,oy+(p.y+.11)*s,s*.78,s*.78);g.fillStyle=this.mode==='lots'?g.fillStyle:'#798277';g.fillRect(ox+(p.x+.11)*s,oy+(p.y+.46)*s,s*.78,s*.05);}});c.trees.forEach(t=>{g.fillStyle='#718364';g.beginPath();g.arc(ox+(t.x+.5)*s,oy+(t.y+.5)*s,s*.29,0,Math.PI*2);g.fill();});}
  selectAt(clientX,clientY){if(!this.city)return;const r=this.canvas.getBoundingClientRect();let x,y;
    if(this.renderer){this.pointer.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);if(!this.raycaster.ray.intersectPlane(this.groundPlane,this.hit))return;x=Math.floor(this.hit.x+this.city.width/2);y=Math.floor(this.hit.z+this.city.height/2);}
    else{const {s,ox,oy}=this.layout;x=Math.floor(((clientX-r.left)*this.canvas.width/r.width-ox)/s);y=Math.floor(((clientY-r.top)*this.canvas.height/r.height-oy)/s);}
    const b=this.occupancy.get(x+','+y);if(this.selection){this.selection.visible=!!b;if(b){const q=b.bbox;this.selection.position.set(q.x+q.w/2-this.city.width/2,.16,q.y+q.h/2-this.city.height/2);this.selection.scale.set(q.w,.3,q.h);}}
    if(this.onSelect)this.onSelect(b||null);
  }
  destroy(){this.disposed=true;cancelAnimationFrame(this.frameId);this.resizeObserver.disconnect();this.controls?.dispose();disposeGroup(this.world);disposeGroup(this.people?.group);disposeGroup(this.lots);this.selection?.geometry.dispose();this.selection?.material.dispose();this.renderer?.dispose();this.canvas.remove();}
}
