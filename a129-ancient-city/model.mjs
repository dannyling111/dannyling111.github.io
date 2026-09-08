export const CATALOG = [
  {kind:'cottage',name:'独门小宅',area:1,shapes:[[1,1]]},
  {kind:'shop',name:'沿街铺面',area:2,shapes:[[2,1],[1,2]]},
  {kind:'courtyard',name:'四合院',area:4,shapes:[[2,2],[1,4],[4,1]]},
  {kind:'compound',name:'书院大宅',area:8,shapes:[[2,4],[4,2]]}
];
export const DEFAULTS={seed:'清溪-1086',size:'medium',water:48,density:66,greenery:58,streetSpacing:9,largeLots:44};
export function normalizeParams(input){
  const p=input&&typeof input==='object'?input:{};
  const n=(k,a,b)=>{const v=Number(p[k]??DEFAULTS[k]);return Math.max(a,Math.min(b,Number.isFinite(v)?v:DEFAULTS[k]));};
  return {seed:String(p.seed??DEFAULTS.seed).slice(0,80)||DEFAULTS.seed,size:['small','medium','large'].includes(p.size)?p.size:DEFAULTS.size,water:n('water',0,100),density:n('density',0,100),greenery:n('greenery',0,100),streetSpacing:n('streetSpacing',6,12),largeLots:n('largeLots',0,100)};
}
export function randomSource(seed){let a=2166136261;for(const c of String(seed))a=Math.imul(a^c.charCodeAt(0),16777619);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
const walk=v=>v===3||v===4||v===6;
const key=p=>p.y+','+p.x;
function connected(points){if(!points.length)return false;const all=new Set(points.map(key)),seen=new Set([key(points[0])]),q=[points[0]];for(let i=0;i<q.length;i++)for(const[dX,dY]of dirs){const p={x:q[i].x+dX,y:q[i].y+dY},k=key(p);if(all.has(k)&&!seen.has(k)){seen.add(k);q.push(p);}}return seen.size===all.size;}
class Heap{
  constructor(){this.a=[];}
  push(v){const a=this.a;let i=a.length;a.push(v);while(i){let p=(i-1)>>1;if(a[p][0]<=v[0])break;a[i]=a[p];i=p;}a[i]=v;}
  pop(){const a=this.a,r=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[c][0]>=last[0])break;a[i]=a[c];i=c;}a[i]=last;}return r;}
}
export function generateCity(input){
  const params=normalizeParams(input),rng=randomSource(params.seed),[width,height]={small:[46,38],medium:[58,46],large:[70,54]}[params.size];
  const cells=Array(width*height).fill(0),idx=(x,y)=>y*width+x;
  const inside=(x,y)=>x>=3&&y>=3&&x<width-3&&y<height-3&&x+y>=11&&(width-1-x)+y>=11&&x+(height-1-y)>=11&&(width-1-x)+(height-1-y)>=11;
  const phase=rng()*6.28,river=y=>width*.68+Math.sin(y*.16+phase)*2.5+Math.sin(y*.31+phase)*.65;
  const lake={x:width*(.26+rng()*.07),y:height*(.29+rng()*.13),rx:1.4+params.water*.052,ry:1+params.water*.035};
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    let v=inside(x,y)?1:0;
    if(params.water>0&&(Math.abs(x-river(y))<.65+params.water*.024||((x-lake.x)/lake.rx)**2+((y-lake.y)/lake.ry)**2<1))v=2;
    if(inside(x,y)&&dirs.some(([a,b])=>!inside(x+a,y+b)))v=5;
    cells[idx(x,y)]=v;
  }
  const gates=[{x:width>>1,y:3},{x:width>>1,y:height-4},{x:3,y:height>>1},{x:width-4,y:height>>1}];
  for(const p of gates)cells[idx(p.x,p.y)]=6;
  // Bridges are laid only over the river; later roads can cross water only here.
  if(params.water>0)for(const y of [Math.round(height*.30),Math.round(height*.66)]){
    let x=Math.round(river(y));if(cells[idx(x,y)]!==2)continue;
    let l=x,r=x;while(l>4&&cells[idx(l-1,y)]===2)l--;while(r<width-5&&cells[idx(r+1,y)]===2)r++;
    for(x=l;x<=r;x++)cells[idx(x,y)]=4;
  }
  const nearest=(x,y)=>{for(let rad=0;rad<8;rad++)for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){
    const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;const v=cells[idx(xx,yy)];if(v===1||walk(v))return {x:xx,y:yy};}return null;};
  const anchor=nearest(width>>1,height>>1);
  const route=(s,t)=>{
    if(!s||!t)return;const start=idx(s.x,s.y),end=idx(t.x,t.y),dist=new Float64Array(cells.length).fill(Infinity),parent=new Int32Array(cells.length).fill(-1),heap=new Heap();
    dist[start]=0;heap.push([0,start]);
    while(heap.a.length){const [cost,i]=heap.pop();if(cost>dist[i]+1e-8)continue;if(i===end)break;const x=i%width,y=(i/width)|0;
      for(const[dx,dy]of dirs){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=width||yy>=height)continue;const j=idx(xx,yy),v=cells[j];if(v!==1&&!walk(v))continue;
        const d=cost+(walk(v)?.87:1);if(d<dist[j]){dist[j]=d;parent[j]=i;heap.push([d,j]);}}
    }
    if(!Number.isFinite(dist[end]))return;
    for(let j=end;j!==-1;j=parent[j]){if(cells[j]===1)cells[j]=3;if(j===start)break;}
  };
  for(const g of gates)route(g,anchor);
  const spacing=Math.round(params.streetSpacing),xs=[],ys=[];
  for(let x=8;x<width-7;x+=spacing)xs.push(x+Math.floor(rng()*3)-1);
  for(let y=8;y<height-7;y+=spacing)ys.push(y+Math.floor(rng()*3)-1);
  const nodes=ys.map(y=>xs.map(x=>nearest(x,y)));
  for(let yi=0;yi<nodes.length;yi++)for(let xi=0;xi<xs.length;xi++){
    const p=nodes[yi][xi];if(xi)route(nodes[yi][xi-1],p);if(yi)route(nodes[yi-1][xi],p);if(!xi&&!yi)route(p,anchor);
  }
  // Connect every bridge to the street graph, including those missed by a lane.
  for(let i=0;i<cells.length;i++)if(cells[i]===4)route({x:i%width,y:(i/width)|0},anchor);
  const reachable=new Set(),q=[idx(anchor.x,anchor.y)];reachable.add(q[0]);
  for(let n=0;n<q.length;n++){const i=q[n],x=i%width,y=(i/width)|0;for(const[dx,dy]of dirs){const xx=x+dx,yy=y+dy,j=idx(xx,yy);if(xx>=0&&yy>=0&&xx<width&&yy<height&&walk(cells[j])&&!reachable.has(j)){reachable.add(j);q.push(j);}}}
  for(let i=0;i<cells.length;i++)if(walk(cells[i])&&!reachable.has(i)){if(cells[i]===6)throw Error('城门连接失败');cells[i]=cells[i]===4?2:1;}
  const occupied=new Set(),buildings=[],trees=[];
  const candidates=new Map();
  for(const c of CATALOG){const list=[];for(const [w,h]of c.shapes)for(let y=4;y<height-h-3;y++)for(let x=4;x<width-w-3;x++){
    const lot=[];let valid=true;for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){const p={x:x+dx,y:y+dy};if(cells[idx(p.x,p.y)]!==1)valid=false;lot.push(p);}if(!valid)continue;
    const fronts=[];for(const p of lot)for(const[dx,dy]of dirs){const f={x:p.x+dx,y:p.y+dy};if(walk(cells[idx(f.x,f.y)]))fronts.push({door:p,front:f,rotation:Math.atan2(dx,dy),score:Math.abs(p.x-(x+(w-1)/2))+Math.abs(p.y-(y+(h-1)/2))});}
    if(!fronts.length)continue;fronts.sort((a,b)=>a.score-b.score);list.push({cells:lot,bbox:{x,y,w,h},...fronts[0],rank:rng()});
  }list.sort((a,b)=>a.rank-b.rank);candidates.set(c.area,list);}
  const budget=Math.floor(cells.filter(v=>v===1).length*params.density/100*.65);
  const add=(area,limit)=>{const cat=CATALOG.find(c=>c.area===area);let used=0;for(const c of candidates.get(area)){
    if(used>=limit||occupied.size+area>budget)break;if(c.cells.some(p=>occupied.has(idx(p.x,p.y))))continue;
    c.cells.forEach(p=>occupied.add(idx(p.x,p.y)));const id='B'+String(buildings.length+1).padStart(3,'0'),variant=Math.floor(rng()*4);
    buildings.push({id,kind:cat.kind,name:area===8?['清溪书院','承恩寺','望川府署','藏书院'][variant]:cat.name,area,cells:c.cells,bbox:c.bbox,door:c.door,front:c.front,rotation:c.rotation,variant,height:.34+rng()*.16});used++;
  }};
  if(budget>24){add(8,1);add(4,1);add(2,1);add(1,1);}
  add(8,Math.floor(budget*(.07+params.largeLots*.0046)/8));add(4,Math.floor(budget*.25/4));add(2,Math.floor(budget*.29/2));add(1,budget);
  for(let y=4;y<height-4;y++)for(let x=4;x<width-4;x++){const i=idx(x,y);if(cells[i]!==1||occupied.has(i))continue;const waterside=dirs.some(([dx,dy])=>cells[idx(x+dx,y+dy)]===2);if(rng()<params.greenery/100*(waterside?.58:.19))trees.push({x,y,kind:waterside?'willow':rng()<.38?'pine':'broadleaf',scale:.68+rng()*.42});}
  const walkable=[],bridges=[];for(let i=0;i<cells.length;i++){const p={x:i%width,y:(i/width)|0};if(walk(cells[i]))walkable.push(p);if(cells[i]===4)bridges.push(p);}
  const stats={buildings:buildings.length,trees:trees.length,roads:cells.filter(v=>v===3).length,bridges:bridges.length,gates:gates.length,water:cells.filter(v=>v===2).length,land:cells.filter(v=>v===1).length,occupied:occupied.size,walkable:walkable.length};
  return {version:1,params,width,height,cellSize:6,cells,buildings,trees,gates,bridges,walkable,stats};
}
export function validateCity(city){
  const checks=[],errors=[];
  const check=(id,ok,detail)=>{checks.push({id,ok:!!ok,detail});if(!ok)errors.push(detail);};
  try{
    const c=city;const valid=!!c&&c.version===1&&Number.isInteger(c.width)&&Number.isInteger(c.height)&&c.width>0&&c.height>0&&c.width*c.height<=20000&&Array.isArray(c.cells)&&c.cells.length===c.width*c.height&&c.cells.every(v=>Number.isInteger(v)&&v>=0&&v<=6)&&['buildings','trees','gates','bridges','walkable'].every(k=>Array.isArray(c[k]));
    check('schema',valid,'地图结构与版本');if(!valid)return {ok:false,checks,errors};
    const point=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<c.width&&p.y<c.height;
    const cell=p=>point(p)?c.cells[p.y*c.width+p.x]:-1,occ=new Set(),ids=new Set();let footprint=true,dry=true,overlap=true,access=true;
    for(const b of c.buildings){if(!b||!Array.isArray(b.cells)){footprint=false;continue;}const own=new Set(b.cells.map(key));
      const xs=b.cells.map(p=>p.x),ys=b.cells.map(p=>p.y);
      footprint&&=[1,2,4,8].includes(b.area)&&b.cells.length===b.area&&own.size===b.area&&b.cells.every(point)&&connected(b.cells)&&(Math.max(...xs)-Math.min(...xs)+1)*(Math.max(...ys)-Math.min(...ys)+1)===b.area&&Number.isFinite(b.rotation);
      if(ids.has(b.id))overlap=false;ids.add(b.id);
      for(const p of b.cells){dry&&=cell(p)===1;const k=key(p);if(occ.has(k))overlap=false;occ.add(k);}
      access&&=point(b.door)&&point(b.front)&&own.has(key(b.door))&&Math.abs(b.door.x-b.front.x)+Math.abs(b.door.y-b.front.y)===1&&walk(cell(b.front));
    }
    check('footprint',footprint,'1 / 2 / 4 / 8 格占地与连续性');check('dry',dry,'建筑避开水域、道路与城墙');check('overlap',overlap,'建筑地块互不重叠');check('frontage',access,'每栋建筑均有邻接街道的入口');
    const expectedWalk=[],expectedBridge=[],expectedGate=[];const counts=Array(7).fill(0);
    c.cells.forEach((v,i)=>{counts[v]++;const p={x:i%c.width,y:(i/c.width)|0};if(walk(v))expectedWalk.push(p);if(v===4)expectedBridge.push(p);if(v===6)expectedGate.push(p);});
    const same=(a,b)=>a.every(point)&&a.length===b.length&&new Set(a.map(key)).size===a.length&&a.every(p=>b.some(t=>t.x===p.x&&t.y===p.y));
    check('network',connected(expectedWalk),'所有道路、桥与城门连成一个通行网络');
    check('entities',same(c.walkable,expectedWalk)&&same(c.bridges,expectedBridge)&&same(c.gates,expectedGate),'通行列表与地形一致');
    const treeSet=new Set();let trees=true;for(const t of c.trees){const k=key(t);trees&&=cell(t)===1&&!occ.has(k)&&!treeSet.has(k);treeSet.add(k);}check('trees',trees,'树木避开建筑、水域和道路');
    const expected={buildings:c.buildings.length,trees:c.trees.length,roads:counts[3],bridges:counts[4],gates:counts[6],water:counts[2],land:counts[1],occupied:occ.size,walkable:expectedWalk.length};
    check('stats',Object.entries(expected).every(([k,v])=>c.stats?.[k]===v)&&c.cellSize===6,'面积、数量与尺度核算');
  }catch{check('malformed',false,'地图数据损坏');}
  return {ok:errors.length===0,checks,errors};
}
