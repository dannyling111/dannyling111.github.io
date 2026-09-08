import {generateCity,validateCity,normalizeParams,randomSource,DEFAULTS} from './model.mjs';
import {CityView} from './view.mjs';
import {createHeritageMap,validateHeritageMap,SOURCES} from './heritage-maps.mjs';
import {HeritageView} from './heritage-view.mjs';
import {ASSET_LIBRARY,getAsset} from './heritage-assets.mjs';
import {buildAssetScene} from './heritage-renderer.mjs';
const $=id=>document.getElementById(id),fields=['seed','size','water','density','greenery','streetSpacing','largeLots'];
let view=new CityView($('viewport')),mapMode='random',selectedAsset=null;let city,validation,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,working=false,toastTimer,mapSerial=0;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3300);}
function displayRanges(){for(const key of fields){const e=$(key),output=$(key+'-value');if(output){output.value=e.value+(key==='streetSpacing'?' 格':'');e.style.setProperty('--fill',((+e.value-+e.min)/(+e.max-+e.min)*100)+'%');}}}
function fill(p){fields.forEach(k=>$(k).value=p[k]);displayRanges();}
function togglePanel(open){$('settings').classList.toggle('open',open);$('panel-backdrop').hidden=!open;$('open-panel-btn').setAttribute('aria-expanded',String(open));}
function bridgeCount(c){const unseen=new Set(c.bridges.map(p=>p.x+','+p.y));let n=0;while(unseen.size){n++;const [start]=unseen,q=[start];unseen.delete(start);for(let i=0;i<q.length;i++){const[x,y]=q[i].split(',').map(Number);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const k=(x+dx)+','+(y+dy);if(unseen.delete(k))q.push(k);}}}return n;}
function showValidation(){const list=$('checks-list');list.replaceChildren();for(const c of (validation.checks||[{ok:validation.ok,detail:'数据结构、足迹、水域、道路与来源检查'}])){const row=document.createElement('div');row.className='check-row'+(c.ok?'':' failed');const label=document.createElement('span');label.textContent=c.detail;const mark=document.createElement('span');mark.textContent=c.ok?'✓ 通过':'× 未通过';row.append(label,mark);list.append(row);}}
function setView(mode){view.setMode(mode);document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view.mode);b.setAttribute('aria-pressed',String(b.dataset.view===view.mode));});$('lots-legend').hidden=view.mode!=='lots'||mapMode!=='random';const mobile=matchMedia('(max-width:760px)').matches;$('gesture-help').textContent=view.mode==='3d'?(mobile?'单指旋转 · 双指缩放 / 平移 · 轻点建筑':'拖动旋转 · 滚轮缩放 · 右键平移 · 点击建筑查看地块'):(mobile?'双指缩放 / 平移 · 轻点建筑查看占地':'滚轮缩放 · 右键平移 · 点击建筑查看占地');}
function syncPause(){view.setPaused(paused||document.hidden);$('pause-btn').innerHTML=paused?'<svg viewBox="0 0 24 24"><path d="m9 5 10 7-10 7z"/></svg>':'<svg viewBox="0 0 24 24"><path d="M9 5v14M15 5v14"/></svg>';$('pause-btn').title=paused?'继续行人':'暂停行人';$('pause-btn').setAttribute('aria-label',paused?'继续行人':'暂停行人');$('pause-btn').setAttribute('aria-pressed',String(paused));}
async function generate(input){
  const ticket=++mapSerial;working=true;$('loading').hidden=false;$('generate-btn').disabled=true;
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,15)));
  if(ticket!==mapSerial)return false;
  try{
    const start=performance.now(),p=normalizeParams(input||Object.fromEntries(fields.map(k=>[k,$(k).value]))),next=generateCity(p),v=validateCity(next);
    if(!v.ok)throw Error('布局检查未通过：'+v.errors.join('；'));
    if(mapMode!=='random'){view.destroy();view=new CityView($('viewport'));mapMode='random';wireSelect();} $('map-select').value='random';toggleMapPanels();view.setCity(next);city=next;validation=v;fill(p);setView(view.mode);syncPause();$('building-info').hidden=true;
    const rng=randomSource(p.seed),names=['清溪','望川','临溪','云津','南浦','栖霞','松陵','长宁'];$('city-name').textContent=p.seed==='清溪-1086'?'清溪府':names[Math.floor(rng()*names.length)]+({small:'县',medium:'府',large:'城'}[p.size]);
    $('map-description').textContent=p.water===0?'阡陌入城 · 坊巷井然':p.greenery>75?'曲水疏林 · 庭院深深':'河湖入城 · 街巷相生';
    $('map-dimensions').textContent=`${city.width*6} × ${city.height*6} m`;
    $('stat-buildings').textContent=city.stats.buildings;$('stat-trees').textContent=city.stats.trees;$('stat-bridges').textContent=bridgeCount(city);$('stat-area').textContent=(city.stats.occupied*36/10000).toFixed(2)+' ha';
    [1,2,4,8].forEach(a=>$('count-'+a).textContent=city.buildings.filter(b=>b.area===a).length+' 处');
    $('validation-summary').textContent=`${v.checks.length} 项布局检查通过`;showValidation();$('status').textContent=`种子 ${p.seed} · 用时 ${(performance.now()-start).toFixed(0)} ms`;
    $('parameter-note').classList.remove('dirty');$('parameter-note').textContent='参数修改后，点击「生成古城」。';
    $('return-map-btn').hidden=true;document.querySelector('[data-view="3d"]').disabled=!!view.fallbackReason;$('view-notice').hidden=!view.fallbackReason;
    if(view.fallbackReason){$('view-notice').textContent=view.fallbackReason;$('view-notice').hidden=false;document.querySelector('[data-view="3d"]').disabled=true;}
    return true;
  }catch(err){toast(err.message||'生成失败，请换一个种子重试。');$('status').textContent=err.message;return false;}finally{if(ticket===mapSerial){working=false;$('loading').hidden=true;$('generate-btn').disabled=false;}}
}
fields.forEach(k=>$(k).addEventListener('input',()=>{displayRanges();$('parameter-note').classList.add('dirty');$('parameter-note').textContent='参数已修改 · 点击上方生成古城';document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('selected'));}));
$('generate-btn').onclick=()=>{togglePanel(false);generate();};$('seed').addEventListener('keydown',e=>{if(e.key==='Enter')generate();});
$('random-seed-btn').onclick=()=>{$('seed').value='江南-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase();generate();};
const presets={water:{water:48,density:66,greenery:58,streetSpacing:9,largeLots:44},capital:{water:22,density:82,greenery:33,streetSpacing:7,largeLots:65},garden:{water:62,density:34,greenery:92,streetSpacing:11,largeLots:78}};
document.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{const p=normalizeParams({...Object.fromEntries(fields.map(k=>[k,$(k).value])),...presets[b.dataset.preset]});fill(p);document.querySelectorAll('[data-preset]').forEach(q=>q.classList.toggle('selected',q===b));generate(p);});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('fit-btn').onclick=()=>view.fit();$('pause-btn').onclick=()=>{paused=!paused;syncPause();};document.addEventListener('visibilitychange',syncPause);
$('open-panel-btn').onclick=()=>togglePanel(true);$('close-panel-btn').onclick=$('panel-backdrop').onclick=()=>togglePanel(false);
function openRules(){if(!$('rules-dialog').open)$('rules-dialog').showModal();}
['help-btn','rules-mobile-btn','validation-btn'].forEach(k=>$(k).onclick=openRules);$('close-rules-btn').onclick=()=>$('rules-dialog').close();$('rules-dialog').addEventListener('click',e=>{if(e.target===$('rules-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
function wireSelect(){view.onSelect=b=>{$('building-info').hidden=!b;if(!b)return;$('building-name').textContent=b.name||getAsset(b.assetId)?.label;$('building-detail').textContent=mapMode==='random'?`${b.id} · ${b.area} 格 · ${b.area*36} m² · ${b.bbox.w} × ${b.bbox.h}`:`${b.id||b.assetId} · ${b.w||getAsset(b.assetId)?.defaultSize.w} × ${b.d||getAsset(b.assetId)?.defaultSize.d} m · 坐标与尺寸推定`;$('building-info').querySelector('.checked').textContent=mapMode==='random'?'临街入口已连通':'据资料复原 · 参见来源';};}wireSelect();$('close-info').onclick=()=>{$('building-info').hidden=true;if(view.selection)view.selection.visible=false;};
$('export-btn').onclick=()=>{if(!city)return;if(mapMode!=='random'){downloadJSON(city,city.id+'.json');return;}const data={format:'ancient-city',version:1,generatorVersion:'1.0.0',params:city.params,city},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='ancient-city-'+city.params.seed.replace(/[^\w\u4e00-\u9fff-]/g,'-')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('地图已导出，导入可复现同一座城。');};
$('import-input').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>5e6)throw Error('地图文件不能超过 5 MB。');const data=JSON.parse(await f.text());if(data.schema==='a129-heritage/v1'){const v=validateHeritageMap(data);if(!v.ok)throw Error(v.errors.join('；'));showHeritage(data.id,data);togglePanel(false);toast('历史地图已载入。');return;}if(data.format!=='ancient-city'||data.version!==1||!data.params||typeof data.params!=='object')throw Error('请选择本生成器导出的 JSON 地图。');if(data.city&&!validateCity(data.city).ok)throw Error('存档的地图数据损坏，未载入。');const imported=await generate(data.params);if(imported){togglePanel(false);toast('已按存档的种子与参数复现地图。');}}catch(err){toast(err instanceof SyntaxError?'文件不是有效的 JSON 地图。':err.message);}finally{e.target.value='';}};
$('viewport').addEventListener('view-error',e=>{toast(e.detail);$('view-notice').textContent=e.detail;$('view-notice').hidden=false;});
window.addEventListener('pagehide',e=>{if(!e.persisted)view.destroy();});
fill(DEFAULTS);syncPause();generate(DEFAULTS);

function downloadJSON(data,name){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function toggleMapPanels(){const heritage=mapMode!=='random';$('random-panel').hidden=heritage;$('heritage-panel').hidden=!heritage;document.querySelector('.seedbox').hidden=heritage;$('generate-btn').hidden=heritage;$('map-precision').textContent=heritage?'据资料复原 · 坐标推定':'程序化古城 · 非历史复原';$('lots-legend').hidden=heritage||view.mode!=='lots';}
function showHeritage(id,input){$('return-map-btn').hidden=true;const next=input||createHeritageMap(id),v=validateHeritageMap(next);if(!v.ok)throw Error(v.errors.join('；'));mapSerial++;working=false;$('loading').hidden=true;$('generate-btn').disabled=false;view.destroy();view=new HeritageView($('viewport'));mapMode=id;city=next;validation=v;wireSelect();view.setCity(next);$('map-select').value=id;toggleMapPanels();syncPause();$('city-name').textContent=next.name;$('map-description').textContent=id==='forbidden-city'?'中轴礼序 · 内外朝院落':'右郊野 · 中虹桥 · 左城门街市';$('map-dimensions').textContent=`${next.bounds.width} × ${next.bounds.depth} m（场景）`;$('stat-buildings').textContent=next.instances.filter(i=>['宫殿','民居','街市'].includes(getAsset(i.assetId).category)).length;$('stat-trees').textContent=next.instances.filter(i=>getAsset(i.assetId).category==='植物').length;$('stat-bridges').textContent=next.instances.filter(i=>getAsset(i.assetId).placement==='bridge').length;$('stat-area').textContent='推定';$('validation-summary').textContent='历史布局检查通过';$('status').textContent=`固定布局 · ${next.instances.length} 个资源实例`;showValidation();$('building-info').hidden=true;const landmarks=$('heritage-landmarks');landmarks.replaceChildren();for(const l of next.landmarks){const b=document.createElement('button');b.textContent=l.name;b.onclick=()=>{if(view.preview)restoreMap();view.focusLandmark(l.id);togglePanel(false);};landmarks.append(b);}const sources=$('heritage-sources');sources.replaceChildren();for(const sid of next.sources){const source=SOURCES.find(s=>s.id===sid),p=document.createElement('p'),a=document.createElement('a');a.textContent=source.title;a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a,document.createTextNode(' '+source.notes));sources.append(p);}$('view-notice').hidden=!view.fallbackReason;if(view.fallbackReason)$('view-notice').textContent=view.fallbackReason;document.querySelector('[data-view="3d"]').disabled=!!view.fallbackReason;setView(view.mode);}
$('map-select').onchange=e=>{try{if(e.target.value==='random')generate();else showHeritage(e.target.value);}catch(err){toast(err.message);}};
const categories=[...new Set(ASSET_LIBRARY.map(a=>a.category))];for(const c of categories){const o=document.createElement('option');o.value=c;o.textContent=c;$('asset-category').append(o);}
function showAssets(){const q=$('asset-search').value.trim().toLowerCase(),cat=$('asset-category').value,list=$('asset-list');list.replaceChildren();for(const a of ASSET_LIBRARY.filter(a=>(cat==='all'||a.category===cat)&&[a.label,a.description,...a.tags].join(' ').toLowerCase().includes(q))){const b=document.createElement('button');b.textContent=a.label;b.onclick=()=>{selectedAsset=a;if(mapMode==='random')showHeritage('forbidden-city');view.previewAsset(a.id);$('return-map-btn').hidden=false;['w','d','h'].forEach(k=>$('asset-'+k).value=a.defaultSize[k]);$('asset-parameters').hidden=false;$('asset-preview').textContent=`${a.label} · ${a.defaultSize.w} × ${a.defaultSize.d} × ${a.defaultSize.h} m（推定） · ${a.description}`;$('asset-export-btn').disabled=false;$('city-name').textContent=a.label;$('map-description').textContent='资源库预览 · 地图与预览复用同一模型';togglePanel(false);};list.append(b);}if(!list.children.length)list.textContent='没有匹配的资源。';}
$('asset-search').oninput=showAssets;$('asset-category').onchange=showAssets;$('asset-export-btn').onclick=()=>{
 if(!selectedAsset)return;
 let parameters;try{parameters=assetParameters();}catch(e){toast(e.message);return;}const model=buildAssetScene(selectedAsset.id,parameters);
 model.updateMatrixWorld(true);
 downloadJSON({schema:'a129-heritage-asset/v1',version:1,asset:selectedAsset,parameters,sourceRecords:SOURCES.filter(s=>selectedAsset.sourceIds.includes(s.id)),threeObject:model.toJSON()},selectedAsset.id+'.json');
 const gs=new Set(),ms=new Set();model.traverse(n=>{if(n.geometry)gs.add(n.geometry);if(n.material)ms.add(n.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());toast('资源参数与可复用三维模型已导出。');
};
function assetParameters(){const p={...selectedAsset.parameters};for(const k of ['w','d','h']){const v=Number($('asset-'+k).value);if(!Number.isFinite(v)||v<=0||v>2000)throw Error('资源尺寸须在0–2000米之间。');p[k]=v;}return p;}
$('asset-apply-btn').onclick=()=>{try{
 if(!selectedAsset)return;
 const parameters=assetParameters();
 if(mapMode==='random')showHeritage('forbidden-city');
 view.previewAsset(selectedAsset.id,parameters);
 $('return-map-btn').hidden=false;
 $('city-name').textContent=selectedAsset.label;
 $('map-description').textContent='资源库预览 · 地图与预览复用同一模型';
}catch(e){toast(e.message);}};
function restoreMap(){if(mapMode==='random')generate();else showHeritage(city.id,city);$('return-map-btn').hidden=true;}
$('return-map-btn').onclick=restoreMap;
showAssets();
// Stable entry links for the two fixed historical scenes.
const initialMap=new URLSearchParams(window.location.search).get('map');
if(['qingming-scroll','forbidden-city'].includes(initialMap))showHeritage(initialMap);
