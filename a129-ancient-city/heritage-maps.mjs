import {getAsset} from './heritage-assets.mjs';
export const SOURCES=[
{id:'scroll',title:'故宫博物院｜张择端清明上河图卷（宋本）',url:'https://www.dpm.org.cn/collection/paint/228226.html',notes:'采用张择端本的右郊野、中河桥、左城门街市顺序；绘画不是测绘图，距离及隐藏面不能唯一反推。'},
{id:'palace-layout',title:'故宫博物院｜紫禁城总布局',url:'https://www.dpm.org.cn/Explore.html',notes:'城框南北961米、东西753米、墙高10米、护城河宽52米；单体坐标依导览图推定。'},
{id:'buildings',title:'故宫博物院｜建筑群',url:'https://www.dpm.org.cn/explore/buildings.html',notes:'中轴外朝三殿、内廷三宫、东西六宫和御花园的空间关系。'},
{id:'official-map',title:'故宫博物院｜官方导览平面图',url:'https://img.dpm.org.cn/static/themes/image/xf/map3.jpg',notes:'用城框归一化估计单体位置，图像存在投影形变，不称测量坐标。'},
{id:'wumen',title:'故宫博物院｜午门',url:'https://www.dpm.org.cn/explore/building/236454.html',notes:'凹字平面与五凤楼；正楼面阔60.05米、进深25米。总体组合尺寸为推定。'},
{id:'zhonghe',title:'故宫博物院｜中和殿',url:'https://www.dpm.org.cn/explore/building/236464.html',notes:'方形三间，单檐四角攒尖顶，不能使用长方形重檐模型。'},
{id:'taihe',title:'故宫博物院｜太和殿',url:'https://www.dpm.org.cn/explore/building/236465.html',notes:'面阔十一间、重檐庑殿顶及三层台基。'},
{id:'jinshui',title:'故宫博物院｜内金水桥',url:'https://www.dpm.org.cn/architectural_art/246281.html',notes:'五座并列的白石单孔拱桥；建模坐标和桥体细部推定。'}
];
export const MAP_CATALOG=[{id:'qingming-scroll',name:'清明上河图 · 汴河春市',description:'张择端宋本 · 叙事空间复原'},{id:'forbidden-city',name:'故宫 · 紫禁城',description:'明清宫城 · 中轴与院落布局'}];
export function footprint(o){const c=Math.cos(o.rotation||0),s=Math.sin(o.rotation||0);return [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,z])=>[o.x+x*o.w*c-z*o.d*s,o.z+x*o.w*s+z*o.d*c]);}
export function pointInPolygon([x,z],p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!=(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
export function polygonsIntersect(a,b){if(a.some(p=>pointInPolygon(p,b))||b.some(p=>pointInPolygon(p,a)))return true;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){const a0=a[i],a1=a[(i+1)%a.length],b0=b[j],b1=b[(j+1)%b.length];if(cross(a0,a1,b0)*cross(a0,a1,b1)<-1e-8&&cross(b0,b1,a0)*cross(b0,b1,a1)<-1e-8)return true;}return false;}
const roadPolygons=r=>r.points.slice(1).map((b,i)=>{const a=r.points[i];return footprint({x:(a[0]+b[0])/2,z:(a[1]+b[1])/2,w:Math.hypot(b[0]-a[0],b[1]-a[1]),d:r.width,rotation:Math.atan2(b[1]-a[1],b[0]-a[0])});});
const solids=new Set('song-house song-shop song-winehouse song-teahouse double-eave-hall xieshan-hall zanjian-pavilion courtyard-house temple-hall'.split(' '));
function base(id,width,depth){return {schema:'a129-heritage/v1',id,name:MAP_CATALOG.find(m=>m.id===id).name,version:1,bounds:{width,depth},coordinateSystem:'x-east/z-south/metres',sources:id==='qingming-scroll'?['scroll']:SOURCES.filter(s=>s.id!=='scroll').map(s=>s.id),reconstruction:{basis:'依据故宫博物院馆藏说明、建筑介绍与官方导览图复原',limitations:['坐标、单体尺寸（除明确引用者外）、街市密度和隐藏立面均为推定。','绘画散点透视与导览图不能替代完整测绘，未宣称100%还原。','细部纹样、完整斗拱与画中每个人物尚未逐项考据。'],measured:false},instances:[],water:[],roads:[],walls:[],plazas:[],landmarks:[]};}
function helpers(m){let n=0;const add=(assetId,name,x,z,w,d,h,extra={})=>{const a=getAsset(assetId);const i={id:extra.id||`${assetId}-${++n}`,assetId,name,x,z,w:w||a.defaultSize.w,d:d||a.defaultSize.d,h:h||a.defaultSize.h,rotation:0,evidence:'inferred',sourceIds:[...a.sourceIds],parameters:{...a.parameters},...extra};m.instances.push(i);return i;};const road=(id,points,width=8)=>m.roads.push({id,name:id,points,width});const wall=(id,x1,z1,x2,z2,height=6,thickness=2)=>m.walls.push({id,x1,z1,x2,z2,height,thickness});const land=(id,name,x,z,items=[])=>m.landmarks.push({id,name,x,z,instanceIds:items.map(i=>i.id),evidence:'documented',sourceIds:[m.id==='qingming-scroll'?'scroll':'official-map']});const legal=i=>{const p=footprint(i);return p.every(([x,z])=>Math.abs(x)<m.bounds.width/2&&Math.abs(z)<m.bounds.depth/2)&&!m.water.some(w=>polygonsIntersect(p,w.points)||pointInPolygon([i.x,i.z],w.points))&&!m.roads.flatMap(roadPolygons).some(r=>polygonsIntersect(p,r))&&!m.instances.filter(j=>solids.has(j.assetId)).some(j=>polygonsIntersect(p,footprint(j))||pointInPolygon([i.x,i.z],footprint(j)));};const fill=(asset,name,x,z,w,d,h,extra={})=>{const i={assetId:asset,x,z,w,d,h,rotation:extra.rotation||0};return legal(i)?add(asset,name,x,z,w,d,h,extra):null;};return {add,road,wall,land,fill,legal};}
function palace(){const m=base('forbidden-city',920,1120);m.enclosure={width:753,depth:961,wallHeight:10,moatWidth:52};const {add,road,wall,land,fill}=helpers(m);
 const rect=(id,name,x1,z1,x2,z2)=>m.water.push({id,name,points:[[x1,z1],[x2,z1],[x2,z2],[x1,z2]]});
 rect('moat-west','西护城河',-431,-534,-379,534);rect('moat-east','东护城河',379,-534,431,534);rect('moat-north','北护城河',-379,-534,379,-483);rect('moat-south-west','南护城河西段',-379,483,-85,535);rect('moat-south-east','南护城河东段',85,483,379,535);
 m.water.push({id:'inner-jinshui',name:'内金水河（推定曲线）',points:[[-320,361],[-180,398],[-100,407],[110,407],[198,390],[330,337],[335,353],[200,410],[114,429],[-106,429],[-190,416],[-325,377]]});
 // Four gates remain open in enclosure walls; peripheral movement avoids the halls.
 for(const sx of [-1,1]){wall(`outer-${sx}-a`,sx*376.5,-480.5,sx*376.5,358,10,7);wall(`outer-${sx}-b`,sx*376.5,394,sx*376.5,480.5,10,7);wall(`outer-n-${sx}`,sx*18,-480.5,sx*376.5,-480.5,10,7);wall(`outer-s-${sx}`,sx*69,480.5,sx*376.5,480.5,10,7);road(`side-walk-${sx}`,[[sx*74,394],[sx*74,-445]],8);}
 add('city-gate','东华门',376,376,24,20,23,{rotation:Math.PI/2});add('city-gate','西华门',-376,376,24,20,23,{rotation:Math.PI/2});for(const x of [-370,370])for(const z of [-474,474])add('corner-tower',`${x<0?'西':'东'}${z<0?'北':'南'}角楼`,x,z,22,22,27);
 const anchor=[['wumen','午门','wumen-gate',466,130,62,38],['taihe-gate','太和门','city-gate',337,60,25,24],['taihe-hall','太和殿','double-eave-hall',151,64,36,27],['zhonghe-hall','中和殿','zanjian-pavilion',88,25,25,19],['baohe-hall','保和殿','xieshan-hall',34,49,26,23],['qianqing-gate','乾清门','city-gate',-62,42,20,17],['qianqing-palace','乾清宫','double-eave-hall',-189,47,25,22],['jiaotai-hall','交泰殿','zanjian-pavilion',-236,19,19,16],['kunning-palace','坤宁宫','xieshan-hall',-285,43,24,18],['imperial-garden','御花园','zanjian-pavilion',-369,23,23,17],['shenwu-gate','神武门','city-gate',-468,44,22,25]];
 for(const [id,name,asset,z,w,d,h]of anchor){const i=add(asset,name,0,z,w,d,h,{id});if(id==='taihe-hall')i.parameters={...i.parameters,bays:11};land(id,name,0,z,[i]);if(asset.includes('hall')||asset==='zanjian-pavilion')add('white-stone-terrace',name+'台基',0,z,w+9,d+9,id==='taihe-hall'?6:2);}
 road('午门前庭通行',[[0,505],[0,448]],10);for(let k=-2;k<=2;k++){add('stone-arch-bridge','内金水桥'+(k+3),k*18,418,30,8,5,{rotation:Math.PI/2});road('金水桥通行'+k,[[k*18,448],[k*18,376]],5);}
 // Halls have connected side routes and courtyard walks; no line crosses their footprints.
 for(const z of [448,376,298,204,-18,-100,-335,-424])road('庭院横路'+z,[[-74,z],[74,z]],8);
 for(const [x,z,w,d,name]of [[0,244,140,90,'太和门广场'],[0,-115,136,90,'乾清宫前庭'],[-228,275,128,140,'武英殿院'],[221,271,132,145,'文华殿院'],[0,-378,136,91,'御花园']])m.plazas.push({id:name,x,z,w,d});
 const compound=(prefix,name,x,z,w=44,d=24)=>{const main=fill('xieshan-hall',name,x,z,w,d,18);for(const dz of [-34,34]){fill('courtyard-house',name+'配殿',x,z+dz,w*.82,11,10);wall(prefix+'-end'+dz,x-w*.7,z+dz*1.25,x+w*.7,z+dz*1.25,4,1.5);}for(const sx of [-1,1]){fill('courtyard-house',name+'厢房',x+sx*(w*.62),z,12,37,9);wall(prefix+'-side'+sx,x+sx*w*.82,z-43,x+sx*w*.82,z+43,4,1.5);}return main;};
 compound('wenhua','文华殿',215,305,43,25);compound('wuying','武英殿',-233,305,43,25);compound('nansan','南三所',277,170,38,22);compound('cining','慈宁宫',-250,-77,48,23);compound('shoukang','寿康宫',-327,-104,32,19);compound('huangji','皇极殿',281,-92,48,28);compound('ningshou','宁寿宫',281,-208,43,23);compound('yangxing','养性殿',281,-317,39,20);
 const west=[['咸福宫',-164,-320],['长春宫',-164,-263],['太极殿',-164,-208],['储秀宫',-102,-320],['翊坤宫',-102,-263],['永寿宫',-102,-208]],east=[['景仁宫',102,-208],['承乾宫',102,-263],['钟粹宫',102,-320],['延禧宫',160,-208],['永和宫',160,-263],['景阳宫',160,-320]];
 for(const [name,x,z]of [...west,...east]){fill('xieshan-hall',name,x,z,35,17,12);fill('courtyard-house',name+'后殿',x,z-19,29,10,9);for(const sx of [-1,1])fill('courtyard-house',name+'侧廊',x+sx*23,z+6,8,30,7);wall(name+'南墙',x-27,z+24,x+27,z+24,4,1);}
 for(const x of [-59,59])for(const z of [-398,-350])fill('zanjian-pavilion','御花园亭',x,z,12,12,12);
 for(let x=-52;x<=52;x+=13)for(let z=-414;z<=-348;z+=13){if(Math.abs(x)<19&&Math.abs(z+369)<23)continue;fill((x+z)%3===0?'garden-rock':'pine','御花园松石',x,z,7,7,10);}
 // Additional orderly peripheral service courts use deterministic legal placement.
 for(const x of [-323,-278,-190,-135,135,185,278,326])for(const z of [90,146,202,382,-399])fill('courtyard-house','宫城附属院宇（位置推定）',x,z,29,15,10);
 for(const x of [-344,344])for(let z=-425;z<440;z+=39)fill('pine','宫城松柏',x,z,8,8,13);
 for(const z of [204,-18,-100,-335])for(const x of [-41,41]){add('bronze-incense','庭院铜炉',x,z+12,3,3,4);add('stone-lion','宫门石狮',x/2,z+13,2.4,3,3.4);}
 for(let k=0;k<64;k++){const x=k%2?74:-74,z=-431+(k*37)%856;add('person','游人（示意）',x,z,.7,.7,1.7);}
 for(const i of m.instances)if(i.assetId==='city-gate'){i.parameters={...i.parameters,roofColor:'#c49a42',wallColor:'#9a4938'};i.sourceIds=['buildings','official-map'];}
 // Court boundaries are interrupted at the existing cross passages.
 for(const x of [-67,67]){let start=-438;for(const gap of [-424,-335,-100,-18,204,298,376]){if(gap-6>start)wall('axis-'+x+'-'+gap,x,start,x,gap-6,5,1.4);start=gap+6;}wall('axis-'+x+'-end',x,start,x,394,5,1.4);}
 return m;
}
function scroll(){const m=base('qingming-scroll',1640,590);const {add,road,wall,land,fill}=helpers(m);
 const river=[[[-805,43],[-630,36],[-420,36],[-220,50],[-100,62],[90,43],[280,68],[450,151],[620,165],[800,182],[800,256],[610,235],[430,221],[260,138],[90,113],[-100,132],[-225,120],[-425,106],[-625,106],[-805,113]]];m.water.push({id:'bian-river',name:'汴河（画卷叙事形态，尺度推定）',points:river[0]});
 road('城郊大道',[[-790,-92],[-540,-92],[-300,-110],[-130,-115],[95,-98],[300,-106],[530,-131],[786,-128]],13);road('虹桥引道',[[95,-98],[95,11]],12);road('虹桥通行',[[95,12],[95,137]],12);road('南岸驿路',[[95,137],[170,172],[288,186],[385,254],[760,283]],10);road('城内次街',[[-730,-202],[-585,-175],[-440,-210],[-290,-205]],9);road('城门联街',[[-530,-88],[-530,-180]],10);road('郊野小路',[[530,-128],[552,-42],[724,-9]],7);
 const bridge=add('hongqiao-bridge','虹桥',95,79,89,21,15,{rotation:Math.PI/2});land('hongqiao','虹桥与汴河',95,79,[bridge]);const gate=add('city-gate','东角子门（通常识读）',-243,-112,33,26,29,{rotation:Math.PI/2});land('city-gate','城门与入城街道',-243,-112,[gate]);wall('宋城墙北',-243,-291,-243,-130,16,7);wall('宋城墙南',-243,-94,-243,26,16,7);
 land('countryside','城郊田野与行旅',665,-152,[]);land('market','城内街市',-577,-92,[]);
 const types=['song-house','song-shop','song-house','song-teahouse','song-shop','song-winehouse'];let k=0;
 for(const z of [-247,-208,-167,-132,-65,-27,8])for(let x=-777;x<793;x+=30){k++;if(x>360&&z< -170)continue;if(x>530&&z> -70)continue;const a=types[k%types.length],w=a==='song-winehouse'?21:15+(k%3)*3,d=a==='song-winehouse'?17:11+(k%2)*3;fill(a,`${getAsset(a).label}（画意推定）`,x+Math.sin(k*2.7)*7,z+Math.sin(k*1.4)*6,w,d,a==='song-winehouse'?16:8+(k%3)*2);}
 for(let x=470;x<795;x+=55)for(const z of [-223,-185])fill('field-plot','郊野田畦',x,z,42,25,.5);
 // Southern river bank supports distinct service clusters, never water houses.
 for(let x=-762;x<40;x+=37)for(const z of [143,181,224])fill(k++%3?'song-house':'song-shop','南岸民舍',x,z,21,15,9);
 for(const [x,z]of [[-720,69],[-610,75],[-436,72],[-320,85],[-145,100],[33,83],[132,79],[252,105],[465,185],[615,197],[731,215]])add(x%2?'cargo-boat':'canal-boat','汴河舟船',x,z,x%2?8:5,x%2?26:17,x%2?10:5,{rotation:Math.PI/2});
 for(let x=-765;x<760;x+=25){for(const z of [-45,19])fill('market-stall','沿街摊棚',x,z,5,4,3.5);}
 for(let x=-772;x<785;x+=45){const z=x<300?135:257;fill('willow','汴河岸柳',x,z,8,8,12);}
 for(let x=426;x<790;x+=40)fill('scholar-tree','郊野树木',x,-37-(x%3)*13,11,11,13);
 for(let j=0;j<130;j++){const r=m.roads[j%m.roads.length],idx=j%(r.points.length-1),a=r.points[idx],b=r.points[idx+1],t=((j*37)%97)/100;add('person','市民与行旅',a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,.7,.7,1.7);}
 for(const x of [-673,-364,218,483,701])add('horse-cart','行旅车马',x,-115,3,6,3.4,{rotation:Math.PI/2});
 m.plazas.push({id:'虹桥北岸桥市',x:95,z:-15,w:105,d:38});return m;
}
export function createHeritageMap(id){if(id==='forbidden-city')return palace();if(id==='qingming-scroll')return scroll();throw new RangeError('未知历史地图：'+id);}
export function validateHeritageMap(m){const errors=[],warnings=[];const fail=s=>errors.push(s);try{
 if(!m||typeof m!=='object'||m.schema!=='a129-heritage/v1'||!MAP_CATALOG.some(x=>x.id===m.id))throw Error('地图标识或schema无效');
 const finite=(n)=>typeof n==='number'&&Number.isFinite(n),positive=n=>finite(n)&&n>0;const validText=s=>typeof s==='string'&&s.length>0&&s.length<=300;
 if(!positive(m.bounds?.width)||!positive(m.bounds?.depth)||m.bounds.width>50000||m.bounds.depth>50000)throw Error('地图范围无效');
 if(m.coordinateSystem!=='x-east/z-south/metres'||!validText(m.name)||m.version!==1||m.reconstruction?.measured!==false||!validText(m.reconstruction?.basis)||!Array.isArray(m.reconstruction?.limitations)||!m.reconstruction.limitations.length)throw Error('地图元数据或精度声明无效');
 for(const k of ['instances','water','roads','walls','plazas','landmarks','sources'])if(!Array.isArray(m[k])||m[k].length>10000)throw Error(k+'数组无效或过大');
 if(m.instances.length>5000||m.water.length>300||m.roads.length>1000)throw Error('地图元素超出导入限制');
 const known=new Set(SOURCES.map(s=>s.id)),refs=a=>Array.isArray(a)&&a.length>0&&a.length<=30&&a.every(s=>known.has(s));if(!refs(m.sources))throw Error('地图来源无效');
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite)&&Math.abs(p[0])<=m.bounds.width/2&&Math.abs(p[1])<=m.bounds.depth/2;
 const unique=(list,label)=>{const ids=new Set();for(const o of list){if(!o||!validText(o.id)||ids.has(o.id))throw Error(label+'存在重复或无效ID');ids.add(o.id);}return ids;};
 unique(m.water,'水域');unique(m.roads,'道路');unique(m.walls,'墙');unique(m.plazas,'广场');unique(m.landmarks,'地标');
 for(const w of m.water)if(!validText(w.name)||!Array.isArray(w.points)||w.points.length<3||w.points.length>500||!w.points.every(point))throw Error('水域多边形无效');
 for(const r of m.roads)if(!positive(r.width)||r.width>300||!Array.isArray(r.points)||r.points.length<2||r.points.length>500||!r.points.every(point)||r.points.slice(1).some((p,j)=>p[0]===r.points[j][0]&&p[1]===r.points[j][1]))throw Error('道路结构无效');
 for(const w of m.walls)if(!point([w.x1,w.z1])||!point([w.x2,w.z2])||!positive(w.height)||!positive(w.thickness)||w.x1===w.x2&&w.z1===w.z2)throw Error('城墙结构无效');
 for(const p of m.plazas)if(!point([p.x,p.z])||!positive(p.w)||!positive(p.d))throw Error('庭院结构无效');
 const ids=unique(m.instances,'实例'),rp=m.roads.flatMap(roadPolygons),occupied=[];
 for(const i of m.instances){const a=getAsset(i.assetId);if(!a||!validText(i.name)||!point([i.x,i.z])||!finite(i.rotation)||!['documented','inferred'].includes(i.evidence)||!refs(i.sourceIds)||!['w','d','h'].every(k=>positive(i[k])&&i[k]<2000))throw Error('实例元数据无效：'+i.id);
 if(!i.parameters||typeof i.parameters!=='object'||Array.isArray(i.parameters)||JSON.stringify(i.parameters).length>8000)throw Error('实例参数无效');
 const inspect=(v,depth=0)=>{if(depth>8)throw Error('参数嵌套过深');if(typeof v==='number'&&!finite(v))throw Error('参数有非有限值');if(v&&typeof v==='object')Object.values(v).forEach(x=>inspect(x,depth+1));};inspect(i.parameters);
 const p=footprint(i);if(!p.every(point))fail(i.id+'足迹越界');const wet=m.water.some(w=>pointInPolygon([i.x,i.z],w.points)),touch=m.water.some(w=>polygonsIntersect(p,w.points));
 if(a.placement==='water'&&!wet)fail(i.id+'舟船不在水域');if(a.placement==='bridge'&&!wet&&!touch)fail(i.id+'桥未跨水');
 if(solids.has(i.assetId)){if(wet||touch)fail(i.id+'建筑占用水域');if(rp.some(r=>polygonsIntersect(p,r)||pointInPolygon([i.x,i.z],r)))fail(i.id+'建筑阻断道路');if(occupied.some(j=>polygonsIntersect(p,j.p)||pointInPolygon([i.x,i.z],j.p)))fail(i.id+'建筑相互重叠');occupied.push({p,id:i.id});}}
 for(const l of m.landmarks)if(!validText(l.name)||!point([l.x,l.z])||!Array.isArray(l.instanceIds)||!l.instanceIds.every(id=>ids.has(id))||!refs(l.sourceIds)||!['documented','inferred'].includes(l.evidence))throw Error('地标引用无效');
 warnings.push('资料复原：坐标与多数单体尺寸为推定，尚无完整测绘或逐物考据。');
 }catch(e){fail(e.message||'无法解析地图结构');}return {ok:errors.length===0,errors,warnings};}
