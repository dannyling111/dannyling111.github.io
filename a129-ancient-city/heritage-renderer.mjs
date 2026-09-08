import * as T from './vendor/three.module.js';
import {getAsset} from './heritage-assets.mjs';
const C={sand:0xe1d6be,pave:0xd2c9b5,water:0x719f98,ripple:0xa8c7bc,wood:0x65503a,dark:0x3d4239,wall:0x9a4938,plaster:0xd0c1a7,roof:0x65655b,gold:0xc49a42,edge:0xd4ae61,white:0xe0d9c6,stone:0x85847a,bronze:0x566456,leaf:0x6f835a,leaf2:0x869369,trunk:0x766146,cloth:0xc7ab80};
class Kit{
 constructor(group){this.g=group;this.materials=new Map();this.geometries=new Map();}
 mat(c){const key=String(c);if(!this.materials.has(key))this.materials.set(key,new T.MeshStandardMaterial({color:C[c]??c,roughness:.91,side:T.DoubleSide}));return this.materials.get(key);}
 mesh(geo,c,x=0,y=0,z=0){const m=new T.Mesh(geo,this.mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;this.g.add(m);return m;}
 primitive(type){if(!this.geometries.has(type))this.geometries.set(type,type==='ball'?new T.IcosahedronGeometry(.5,1):type==='cyl'?new T.CylinderGeometry(.5,.5,1,8):type==='cone'?new T.ConeGeometry(.5,1,8):new T.BoxGeometry(1,1,1));return this.geometries.get(type);}
 box(x,y,z,w,h,d,c,ry=0,rz=0){const m=this.mesh(this.primitive('box'),c,x,y,z);m.scale.set(Math.max(.002,w),Math.max(.002,h),Math.max(.002,d));m.rotation.set(0,ry,rz);return m;}
 ball(x,y,z,w,h,d,c){const m=this.mesh(this.primitive('ball'),c,x,y,z);m.scale.set(w,h,d);return m;}
 cyl(x,y,z,r,h,c){const m=this.mesh(this.primitive('cyl'),c,x,y,z);m.scale.set(r*2,h,r*2);return m;}
 cone(x,y,z,w,h,d,c){const m=this.mesh(this.primitive('cone'),c,x,y,z);m.scale.set(w,h,d);return m;}
 beam(a,b,r,c,rect=false){const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa),center=aa.add(bb).multiplyScalar(.5),m=this.mesh(this.primitive(rect?'box':'cyl'),c,...center.toArray());m.scale.set(r,delta.length(),r);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
 surface(vertices,c){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return this.mesh(g,c);}
}
function tri(out,a,b,c){const n=new T.Vector3().subVectors(new T.Vector3(...b),new T.Vector3(...a)).cross(new T.Vector3().subVectors(new T.Vector3(...c),new T.Vector3(...a)));if(n.y<0)out.push(...a,...c,...b);else out.push(...a,...b,...c);}
function hip(k,x,y,z,w,d,h,color='gold',ridge=.56){
 const verts=[],rows=[0,.27,.58,.82,1],side=(s,t,u)=>{const half=w*(ridge+(1-ridge)*t)/2,xx=u*half,zz=s*d*t/2;return [x+xx,y+h*Math.pow(1-t,1.6)+h*.10*Math.pow(t,6)+h*.085*Math.pow(Math.abs(u)*t,7),z+zz];};
 for(const s of [-1,1])for(let r=0;r<rows.length-1;r++)for(let j=0;j<12;j++){const a=side(s,rows[r],-1+j/6),b=side(s,rows[r],-1+(j+1)/6),c=side(s,rows[r+1],-1+(j+1)/6),e=side(s,rows[r+1],-1+j/6);tri(verts,a,b,c);tri(verts,a,c,e);}
 if(ridge<.99)for(const s of [-1,1])for(let j=0;j<rows.length-1;j++){const a=side(-1,rows[j],s),b=side(1,rows[j],s),c=side(1,rows[j+1],s),e=side(-1,rows[j+1],s);tri(verts,a,b,c);tri(verts,a,c,e);}
 k.surface(verts,color);k.box(x,y+h+.06,z,w*ridge,.14,.22,color==='roof'?'stone':'edge');
 // Curved parallel tile ribs follow the exact surface, including raised eaves.
 for(const s of [-1,1])for(let j=0;j<=8;j++){const u=-.98+1.96*j/8;for(let r=1;r<rows.length;r++){const a=side(s,rows[r-1],u),b=side(s,rows[r],u);a[1]+=.045;b[1]+=.045;k.beam(a,b,Math.min(.085,w/180),color==='roof'?'stone':'edge',true);}}
 for(const s of [-1,1]){k.ball(x+s*w*ridge*.49,y+h+.24,z,.26,.42,.26,color==='roof'?'stone':'edge');}
}
function pyramidal(k,x,y,z,w,d,h,color='gold'){hip(k,x,y,z,w,d,h,color,0);k.ball(x,y+h+.20,z,.35,.4,.35,'edge');}
function balustrade(k,x,y,z,w,c='white'){const n=Math.max(2,Math.min(18,Math.round(w/2.2)));k.box(x,y+.75,z,w,.13,.18,c);k.box(x,y+.20,z,w,.13,.18,c);for(let i=0;i<=n;i++){const xx=x-w/2+i*w/n;k.box(xx,y+.5,z,.22,1,.22,c);k.ball(xx,y+1.09,z,.3,.23,.3,c);if(i<n)k.box(xx+w/n/2,y+.46,z,w/n-.26,.45,.09,c);}}
function terrace(k,w,d,h){for(let j=0;j<3;j++){const f=1-j*.055,hh=h/3;k.box(0,hh*(j+.5),0,w*f,hh,d*f,'white');k.box(0,hh*(j+1),0,w*f+.12,.10,d*f+.12,'plaster');}
 const sw=w*.23,stepD=d*.15,steps=9;for(let j=0;j<steps;j++)k.box(0,h*(j+1)/steps/2,d*.49-stepD*j/steps,sw,h*(j+1)/steps,stepD/steps+.02,'white');
 for(const s of [-1,1]){balustrade(k,s*(w*.27+sw*.25),h,d*.43,w*.28);balustrade(k,0,h,-d*.43,w*.88);}
}
function hall(k,w,d,h,p={},type='hip',baseY=0,x=0,z=0){
 const color=p.roofColor||'gold',body=p.wallColor||'wall',base=h*.10,bodyH=h*.44,bays=Math.max(3,Math.min(11,Math.round(p.bays||5))),double=type==='double';
 k.box(x,baseY+base/2,z,w*.86,base,d*.85,'white');k.box(x,baseY+base+bodyH/2,z,w*.73,bodyH,d*.65,body);
 for(let i=0;i<=bays;i++){const xx=x-w*.39+i*w*.78/bays;for(const s of [-1,1]){k.cyl(xx,baseY+base+bodyH*.52,z+s*d*.37,Math.max(.09,w/170),bodyH*1.05,'wall');k.box(xx,baseY+base+bodyH*.96,z+s*d*.37,w/(bays+1)*.6,.18,d*.10,'wood');}}
 for(let i=0;i<bays;i++){const xx=x-w*.35+(i+.5)*w*.70/bays;k.box(xx,baseY+base+bodyH*.42,z+d*.331,w*.53/bays,bodyH*.77,.05,'dark');for(const off of [-1,0,1])k.box(xx+off*w*.13/bays,baseY+base+bodyH*.48,z+d*.337,.045,bodyH*.60,.04,'wood');}
 k.box(x,baseY+base+bodyH*.89,z+d*.38,w*.39,.65,.12,'dark');
 const roofY=baseY+base+bodyH;
 if(type==='pyramid')pyramidal(k,x,roofY,z,w,d,h*.40,color);
 else if(type==='xieshan'){hip(k,x,roofY,z,w,d,h*.19,color,.53);hip(k,x,roofY+h*.12,z,w*.70,d*.72,h*.27,color,1);for(const s of [-1,1]){const q=x+s*w*.35;triangularGable(k,q,roofY+h*.13,z,d*.56,h*.22,body);}}
 else if(double){hip(k,x,roofY,z,w,d,h*.25,color,.57);k.box(x,roofY+h*.21,z,w*.59,h*.13,d*.43,body);hip(k,x,roofY+h*.27,z,w*.87,d*.78,h*.26,color,.57);}
 else hip(k,x,roofY,z,w,d,h*.39,color,1);
 for(let n=0;n<5;n++)k.box(x,baseY+base*(n+1)/10,z+d*.44+(4-n)*d*.018,w*.20,base*(n+1)/5,d*.023,'white');
}
function triangularGable(k,x,y,z,d,h,c){k.surface([x,y,z-d/2,x,y+h,z,x,y,z+d/2],c);}
function archPortal(k,w,d,h,color='wall',gap=.25){const shape=new T.Shape(),r=w*gap*.5,shoulder=h*.40;shape.moveTo(-w/2,0);shape.lineTo(-r,0);shape.lineTo(-r,shoulder);for(let j=0;j<=16;j++){const a=Math.PI-j*Math.PI/16;shape.lineTo(Math.cos(a)*r,shoulder+Math.sin(a)*r);}shape.lineTo(r,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h);shape.lineTo(-w/2,h);shape.closePath();return k.mesh(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,curveSegments:12}),color,0,0,-d/2);}

function shop(k,w,d,h,p,id){const levels=id==='song-winehouse'?2:1,bodyH=h*.68,roofH=h*.3;
 k.box(0,.2,0,w*.92,.4,d*.9,'stone');k.box(0,bodyH/2, -d*.06,w*.84,bodyH,d*.68,p.wallColor||'plaster');
 const bays=id==='song-house'?3:5;for(let j=0;j<bays;j++){const x=-w*.34+(j+.5)*w*.68/bays;k.box(x,bodyH*.36,d*.285,w*.52/bays,bodyH*.65,.07,'dark');k.cyl(x-w*.31/bays,bodyH*.4,d*.36,.11,bodyH*.8,'wood');}
 hip(k,0,bodyH,0,w,d,roofH,p.roofColor||'roof',1);
 if(levels===2){k.box(0,bodyH*.55,d*.20,w*.9,.25,d*.38,'wood');hip(k,0,bodyH*.48,0,w*.99,d*.98,h*.19,p.roofColor||'roof',1);balustrade(k,0,bodyH*.55,d*.38,w*.87,'wood');}
 if(id!=='song-house'){
 const y=levels===2?bodyH*.35:bodyH*.64;for(const s of [-1,1])k.cyl(s*w*.37,y/2,d*.44,.09,y,'wood');k.box(0,y,d*.37,w*.84,.18,d*.20,'cloth',0,-.025);
 k.box(w*.35,y+.7,d*.455,.18,2,.13,'wood');k.box(w*.35,y+.65,d*.458,1.3,1.1,.13,'plaster');k.box(w*.35,y+.65,d*.535,.18,.85,.03,'dark');
 for(const s of [-1,1]){k.ball(s*w*.25,y-.5,d*.45,.48,.67,.48,'wall');k.cyl(s*w*.25,y-.9,d*.45,.07,.26,'edge');}
 if(id==='song-teahouse')for(const sx of [-1,1]){k.cyl(sx*w*.22,.75,d*.38,.7,.17,'wood');k.cyl(sx*w*.22,.4,d*.38,.10,.7,'wood');}
 }
}
function bridge(k,w,d,h,wood){const n=18,rise=h*(wood?.60:.43),rail=Math.min(1.4,h*.23),deck=x=>.18+rise*(1-Math.pow(2*x/w,2)),material=wood?'wood':'white';
 for(let j=0;j<n;j++){const x=-w/2+j*w/n,x2=x+w/n,yy=deck((x+x2)/2),angle=Math.atan2(deck(x2)-deck(x),x2-x);k.box((x+x2)/2,yy,0,w/n*1.02,wood?.22:.35,d,wood?'wood':'white',0,angle);
 for(const s of [-1,1]){k.beam([x,deck(x)+rail,s*d*.46],[x2,deck(x2)+rail,s*d*.46],wood?.13:.18,material,true);k.box(x,deck(x)+rail/2,s*d*.46,wood?.15:.23,rail,.19,material);if(!wood)k.ball(x,deck(x)+rail+.12,s*d*.46,.33,.27,.33,'white');}
 if(wood){for(const s of [-1,1]){k.beam([x,deck(x)-.5,s*d*.39],[x2,deck(x2)-.5,s*d*.39],.48,'wood',true);if(j%2===0&&j<n-2)k.beam([x,deck(x)-.9,-d*.40],[x2+w/n,deck(x2+w/n)-.9,d*.40],.27,'wood',true);}k.box((x+x2)/2,yy-.55,0,.30,.30,d*1.01,'wood');}}
 if(!wood){const shape=new T.Shape();for(let j=0;j<=n;j++){const x=-w/2+j*w/n;const y=deck(x)-.15;j?shape.lineTo(x,y):shape.moveTo(x,y);}for(let j=n;j>=0;j--){const x=-w/2+j*w/n;shape.lineTo(x,Math.max(-.2,deck(x)-Math.max(.8,h*.22)));}shape.closePath();k.mesh(new T.ExtrudeGeometry(shape,{depth:d*.91,bevelEnabled:false}), 'white',0,0,-d*.455);}
}
function boat(k,w,d,h,cargo){const ring=[[-.08,-.5],[.40,-.35],[.5,.20],[.33,.43],[0,.5],[-.33,.43],[-.5,.20],[-.40,-.35]],verts=[];for(let j=0;j<ring.length;j++){const a=ring[j],b=ring[(j+1)%ring.length];const topA=[a[0]*w,.5,a[1]*d],topB=[b[0]*w,.5,b[1]*d],lowA=[a[0]*w*.6,-.45,a[1]*d*.88],lowB=[b[0]*w*.6,-.45,b[1]*d*.88];verts.push(...topA,...topB,...lowB,...topA,...lowB,...lowA);}
 k.surface(verts,'wood');k.box(0,.42,0,w*.79,.20,d*.7,'cloth');k.box(0,1,0,w*.69,1.0,d*.40,'wood');hip(k,0,1.53,0,w*.85,d*.49,1.05,'cloth',1);
 if(cargo){k.beam([0,.5,-d*.18],[0,h*.98,-d*.18],.16,'wood');const sail=new T.Shape();sail.moveTo(-w*.42,h*.43);sail.lineTo(w*.42,h*.40);sail.lineTo(w*.30,h*.91);sail.lineTo(-w*.29,h*.91);sail.closePath();const m=k.mesh(new T.ShapeGeometry(sail),'cloth',0,0,-d*.18);for(let j=0;j<5;j++)k.box(0,h*(.46+j*.09),-d*.184,w*(.8-j*.03),.06,.06,'wood');for(const x of [-w*.22,w*.22])for(const z of [d*.25,d*.34])k.box(x,1,z,w*.29,.9,d*.08,'plaster');}
 else{k.beam([0,.6,-d*.44],[w*.7,.9,-d*.21],.10,'wood');}
}
function tree(k,w,d,h,id){k.cyl(0,h*.26,0,w*.045,h*.52,'trunk');if(id==='pine'){for(let j=0;j<4;j++)k.cone(0,h*(.42+j*.14),0,w*(.92-j*.16),h*.36,d*(.92-j*.16),j%2?'leaf':'leaf2');}else{for(let j=0;j<5;j++){const a=j*2.4,r=w*.20,x=Math.cos(a)*r,z=Math.sin(a)*d*.20;const y=h*(.63+(j%2)*.11);k.beam([0,h*.32,0],[x,y,z],w*.055,'trunk');k.ball(x,y,z,w*.58,h*.39,d*.58,j%2?'leaf2':'leaf');}
 if(id==='willow')for(let j=0;j<14;j++){const a=j*Math.PI*2/14,x=Math.cos(a)*w*.40,z=Math.sin(a)*d*.40;k.beam([x*.63,h*.76,z*.63],[x,h*.38,z],w*.018,'leaf');k.ball(x,h*.40,z,w*.09,h*.47,d*.08,'leaf2');}}
}
function person(k,w,d,h,p){const robe=p.robeColor||'wood';k.cone(0,h*.53,0,w*.50,h*.40,d*.45,robe);k.box(0,h*.63,0,w*.34,h*.24,d*.34,robe);k.ball(0,h*.85,0,w*.39,h*.15,d*.39,0xc1a17a);k.cyl(0,h*.94,0,w*.22,h*.035,'dark');k.ball(0,h*.98,0,w*.14,h*.05,d*.14,'dark');for(const s of [-1,1]){const leg=k.box(s*w*.13,h*.22,0,w*.13,h*.39,d*.17,'dark');leg.name=s<0?'leg-left':'leg-right';const arm=k.box(s*w*.30,h*.52,0,w*.13,h*.32,d*.13,robe,0,s*.12);arm.name=s<0?'arm-left':'arm-right';}}
function horseCart(k,w,d,h){const cartZ=-d*.23;k.box(0,h*.35,cartZ,w*.79,.20,d*.43,'wood');for(const s of [-1,1]){k.box(s*w*.40,h*.51,cartZ,.13,h*.33,d*.43,'wood');const wheel=k.mesh(new T.TorusGeometry(h*.21,.10,5,16),'wood',s*w*.48,h*.24,cartZ);wheel.rotation.y=Math.PI/2;for(let j=0;j<8;j++){const a=j*Math.PI/4;k.beam([s*w*.48,h*.24,cartZ],[s*w*.48,h*.24+Math.cos(a)*h*.21,cartZ+Math.sin(a)*h*.21],.06,'wood');}k.beam([s*w*.25,h*.32,0],[s*w*.20,h*.30,d*.36],.07,'wood');}
 k.ball(0,h*.45,d*.25,w*.49,h*.35,d*.33,'wood');k.beam([0,h*.47,d*.34],[0,h*.70,d*.44],w*.19,'wood');k.ball(0,h*.74,d*.44,w*.28,h*.18,d*.16,'wood');for(const s of [-1,1])for(const t of [-1,1])k.beam([s*w*.15,h*.39,d*(.24+t*.09)],[s*w*.17,.05,d*(.25+t*.10)],w*.065,'dark');for(const s of [-1,1])k.cone(s*w*.07,h*.87,d*.43,w*.06,h*.16,d*.07,'dark');}
export function buildAssetScene(assetId,params={}){
 const a=getAsset(assetId);if(!a)throw new RangeError('未知资源 '+assetId);const p={...a.parameters,...params};for(const dim of ['w','d','h'])p[dim]=Number.isFinite(p[dim])&&p[dim]>0?Math.min(2000,p[dim]):a.defaultSize[dim];const {w,d,h}=p,g=new T.Group(),k=new Kit(g);g.userData={assetId,parameters:{...p},version:a.version};
 if(assetId.startsWith('song-'))shop(k,w,d,h,p,assetId);
 else if(['willow','pine','scholar-tree'].includes(assetId))tree(k,w,d,h,assetId);
 else if(assetId==='person')person(k,w,d,h,p);
 else if(assetId==='horse-cart')horseCart(k,w,d,h);
 else if(assetId==='hongqiao-bridge'||assetId==='stone-arch-bridge')bridge(k,w,d,h,assetId==='hongqiao-bridge');
 else if(assetId==='canal-boat'||assetId==='cargo-boat')boat(k,w,d,h,assetId==='cargo-boat');
 else if(assetId==='double-eave-hall')hall(k,w,d,h,p,'double');
 else if(assetId==='xieshan-hall')hall(k,w,d,h,p,'xieshan');
 else if(assetId==='zanjian-pavilion')hall(k,w,d,h,p,'pyramid');
 else if(assetId==='courtyard-house')hall(k,w,d,h,p,'gable');
 else if(assetId==='white-stone-terrace')terrace(k,w,d,h);
 else if(assetId==='stone-balustrade'){balustrade(k,0,0,0,w);g.scale.y=h/1.22;g.scale.z=d/.3;}
 else if(assetId==='market-stall'){for(const x of [-w*.43,w*.43])for(const z of [-d*.43,d*.43])k.cyl(x,h*.43,z,.08,h*.86,'wood');hip(k,0,h*.85,0,w,d,h*.15,p.roofColor||'cloth',1);k.box(0,h*.35,0,w*.87,.13,d*.72,'wood');for(let j=0;j<5;j++)k.ball(-w*.32+j*w*.16,h*.48,0,w*.13,h*.16,d*.30,j%2?'plaster':'cloth');}
 else if(assetId==='city-wall'||assetId==='palace-wall'){k.box(0,h*.45,0,w,h*.9,d,assetId==='city-wall'?'stone':'wall');if(assetId==='palace-wall')hip(k,0,h*.86,0,w,d,h*.13,'gold',1);else{const n=Math.min(60,Math.max(3,Math.round(w/2.8)));for(let j=0;j<n;j++)k.box(-w/2+(j+.5)*w/n,h*.94,0,w/n*.58,h*.12,d,'stone');k.box(0,h*.89,0,w,.2,d*1.02,'white');}}
 else if(assetId==='city-gate'){archPortal(k,w,d*.84,h*.53,p.wallColor||'stone',.26);hall(k,w*.86,d,h*.49,{...p,bays:7},'double',h*.52);}
 else if(assetId==='wumen-gate'){
 // Central gate passage + southern wings form an actual U, with five roof groups.
 const baseH=h*.33,barZ=-d*.27,portalGroup=new T.Group(),pk=new Kit(portalGroup);archPortal(pk,w*.74,d*.33,baseH,'wall',.19);portalGroup.position.z=barZ;g.add(portalGroup);
 for(const s of [-1,1]){k.box(s*w*.41,baseH/2,d*.04,w*.16,baseH,d*.91,'wall');hall(k,w*.14,d*.72,h*.24,p,'gable',baseH,s*w*.41,d*.04);for(const t of [-1,1]){const x=s*w*.41,z=d*(t<0?-.35:.39);k.box(x,baseH+h*.13,z,w*.16,h*.26,d*.25,'wall');pyramidal(k,x,baseH+h*.27,z,w*.23,d*.34,h*.17,'gold');pyramidal(k,x,baseH+h*.42,z,w*.19,d*.27,h*.14,'gold');}}
 hall(k,Math.min(60.05,w*.49),Math.min(25,d*.44),h*.62,{...p,bays:9},'double',baseH,0,barZ);
 }
 else if(assetId==='corner-tower'){k.box(0,h*.13,0,w*.72,h*.26,d*.72,'stone');hall(k,w,d*.71,h*.45,p,'double',h*.24);const cross=new T.Group(),ck=new Kit(cross);hall(ck,d,w*.64,h*.37,p,'xieshan',h*.39);cross.rotation.y=Math.PI/2;g.add(cross);pyramidal(k,0,h*.80,0,w*.55,d*.55,h*.19,'gold');}
 else if(assetId==='bronze-incense'){for(let j=0;j<3;j++){const a=j*Math.PI*2/3;k.beam([Math.cos(a)*w*.22,0,Math.sin(a)*d*.22],[Math.cos(a)*w*.17,h*.38,Math.sin(a)*d*.17],w*.12,'bronze');}k.ball(0,h*.48,0,w*.80,h*.54,d*.80,'bronze');k.cone(0,h*.78,0,w*.93,h*.26,d*.93,'bronze');k.ball(0,h*.96,0,w*.18,h*.15,d*.18,'bronze');for(const s of [-1,1]){const ring=k.mesh(new T.TorusGeometry(w*.20,w*.04,5,10),'bronze',s*w*.40,h*.62,0);ring.rotation.y=Math.PI/2;}}
 else if(assetId==='stone-lion'){k.box(0,h*.10,0,w,.2*h,d,'white');k.ball(0,h*.44,0,w*.71,h*.58,d*.59,'stone');k.ball(0,h*.77,d*.12,w*.78,h*.40,d*.48,'stone');for(const s of [-1,1]){k.box(s*w*.20,h*.27,d*.25,w*.20,h*.35,d*.40,'stone');k.ball(s*w*.34,h*.89,d*.09,w*.25,h*.22,d*.20,'stone');k.ball(s*w*.15,h*.80,d*.355,w*.06,h*.045,d*.04,'dark');}k.ball(0,h*.72,d*.34,w*.46,h*.19,d*.23,'stone');}
 else if(assetId==='garden-rock'){for(let j=0;j<7;j++){const x=Math.sin(j*2.1)*w*.23,z=Math.cos(j*2.1)*d*.25;k.ball(x,h*(.20+(j%3)*.12),z,w*(.34+(j%2)*.14),h*(.4+(j%3)*.14),d*.43,j%2?'stone':'white');}}
 else if(assetId==='field-plot'){k.box(0,h/2,0,w,h,d,0x9c9972);for(let j=0;j<12;j++)k.box(-w*.46+j*w*.083,h+.025,0,w*.038,.08,d*.94,j%2?'leaf':'sand');}
 else hall(k,w,d,h,p,'gable');
 const bounds=new T.Box3().setFromObject(g);g.scale.x*=Math.min(1,w/(2*Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x),.001)));g.scale.z*=Math.min(1,d/(2*Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z),.001)));g.scale.y*=Math.min(1,h/Math.max(bounds.max.y,.001));
 return g;
}
function polygon(k,points,color,y){const shape=new T.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const m=k.mesh(new T.ShapeGeometry(shape),color,0,y,0);m.rotation.x=-Math.PI/2;return m;}
function mergeStatic(group){
 const records=new Map(),geometries=new Set(),materials=new Set();group.updateMatrixWorld(true);group.traverse(n=>{if(!n.isMesh)return;geometries.add(n.geometry);const mat=n.material;materials.add(mat);const key=mat.color.getHexString(),rec=records.get(key)||{positions:[],normals:[],material:mat};records.set(key,rec);const p=n.geometry.getAttribute('position'),normal=n.geometry.getAttribute('normal'),index=n.geometry.index,v=new T.Vector3(),nn=new T.Vector3(),nm=new T.Matrix3().getNormalMatrix(n.matrixWorld);for(let j=0;j<(index?index.count:p.count);j++){const q=index?index.getX(j):j;v.fromBufferAttribute(p,q).applyMatrix4(n.matrixWorld);rec.positions.push(v.x,v.y,v.z);if(normal)nn.fromBufferAttribute(normal,q).applyMatrix3(nm).normalize();else nn.set(0,1,0);rec.normals.push(nn.x,nn.y,nn.z);}});
 const merged=new T.Group();for(const rec of records.values()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(rec.positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(rec.normals,3));geo.computeBoundingSphere();const m=new T.Mesh(geo,rec.material.clone());m.castShadow=true;m.receiveShadow=true;merged.add(m);}geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());return merged;
}
export function bridgeDeckHeight(map,x,z){for(const i of map.instances){if(!i.assetId.includes('bridge'))continue;const dx=x-i.x,dz=z-i.z,c=Math.cos(i.rotation),s=Math.sin(i.rotation),along=dx*c+dz*s,side=-dx*s+dz*c;if(Math.abs(along)<=i.w/2&&Math.abs(side)<=i.d/2)return .35+i.h*(i.assetId==='hongqiao-bridge'?.60:.43)*(1-Math.pow(2*along/i.w,2));}return .20;}
export function buildHeritageScene(map){
 const g=new T.Group(),staticGroup=new T.Group(),k=new Kit(staticGroup);g.userData={mapId:map.id,instances:map.instances,motionNodes:[]};k.box(0,-2.3,0,map.bounds.width,4,map.bounds.depth,'sand');
 for(const p of map.plazas)k.box(p.x,-.14,p.z,p.w,.20,p.d,'pave');
 for(const water of map.water){polygon(k,water.points,'water',-.02);for(let j=0;j<water.points.length;j++){const a=water.points[j],b=water.points[(j+1)%water.points.length];k.beam([a[0],.02,a[1]],[b[0],.02,b[1]],.44,'stone',true);}}
 for(const r of map.roads)for(let j=1;j<r.points.length;j++){const a=r.points[j-1],b=r.points[j],len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(len/4));for(let n=0;n<steps;n++){const t=(n+.5)/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;if(bridgeDeckHeight(map,x,z)>.25)continue;k.box(x,.03,z,len/steps+.03,.08,r.width,'pave',-Math.atan2(b[1]-a[1],b[0]-a[0]));}}
 for(const w of map.walls){const wall=buildAssetScene(map.id==='forbidden-city'?'palace-wall':'city-wall',{w:Math.hypot(w.x2-w.x1,w.z2-w.z1),d:w.thickness,h:w.height});wall.position.set((w.x1+w.x2)/2,0,(w.z1+w.z2)/2);wall.rotation.y=-Math.atan2(w.z2-w.z1,w.x2-w.x1);staticGroup.add(wall);}
 for(const i of map.instances){const obj=buildAssetScene(i.assetId,{...i.parameters,w:i.w,d:i.d,h:i.h});obj.position.set(i.x,i.assetId==='person'?bridgeDeckHeight(map,i.x,i.z):0,i.z);obj.rotation.y=-i.rotation;obj.userData={...i};
 if(['double-eave-hall','xieshan-hall','zanjian-pavilion'].includes(i.assetId)){const platform=map.instances.find(p=>p.assetId==='white-stone-terrace'&&Math.abs(p.x-i.x)<.01&&Math.abs(p.z-i.z)<.01);if(platform)obj.position.y=platform.h;}
 // A small set of walkers stays separate from material-batched architecture.
 if(i.assetId==='person'&&g.userData.motionNodes.length<32){g.add(obj);g.userData.motionNodes.push(obj);}else staticGroup.add(obj);
 }
 g.add(mergeStatic(staticGroup));return g;
}
