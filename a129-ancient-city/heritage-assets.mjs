/** Shared, versioned, metre-based architectural assets. Shape provenance ≠ measured geometry. */
export const ASSET_VERSION='1.0.0';
const entries=[
['song-house','宋式民居','民居',[12,9,8],'land','街巷 乡村 悬山 灰瓦','朴素木构民居，屋顶和开间参数为推定。','scroll'],
['song-shop','沿街商铺','街市',[12,8,8],'land','店铺 招幌 沿街','开敞铺面与挑檐，取宋画街市意象。','scroll'],
['song-winehouse','酒楼','街市',[19,15,15],'land','酒楼 彩楼 欢门','双层酒楼与招牌，细部按画意推定。','scroll'],
['song-teahouse','茶肆','街市',[17,12,10],'land','茶馆 茶棚 木构','临街饮茶休憩建筑。','scroll'],
['market-stall','摊棚','街市',[4,3,3.2],'roadside','棚架 商贩 摊位','木柱与布棚组合，可调整棚面色与宽度。','scroll'],
['hongqiao-bridge','虹桥','桥梁',[64,16,13],'bridge','木拱 叠梁 无墩 虹桥','张择端原本的木拱桥形制，跨度与结构细分为推定。','scroll'],
['stone-arch-bridge','白石单孔拱桥','桥梁',[26,7,5],'bridge','金水桥 汉白玉 栏板','白石单孔拱桥，可用于五座并列内金水桥。','jinshui'],
['canal-boat','客舟','舟车',[4.5,14,5],'water','篷船 汴河 舟','窄船体与篷舱，尺寸推定。','scroll'],
['cargo-boat','漕运货船','舟车',[8,27,10],'water','货船 桅杆 船工','货船、舱篷与桅杆，按画意重建。','scroll'],
['horse-cart','马车','舟车',[3,6,3.4],'road','车轮 车马 运输','马、双轮、车厢组成的可复用交通物件。','scroll'],
['person','行人','人物',[.7,.7,1.7],'road','人物 行人 宋服','几何化人物，动作与服饰为推定。','scroll'],
['willow','垂柳','植物',[8,8,11],'land','柳树 河岸 春树','枝垂的河岸柳树。','scroll'],
['pine','松柏','植物',[7,7,12],'land','松 柏 御花园 常青','分层针叶树冠，园林填充。','buildings'],
['scholar-tree','国槐','植物',[9,9,12],'land','槐 树冠 街道','高干阔叶树，适合街巷和庭院。','scroll'],
['city-gate','城门楼','门墙',[28,18,25],'gate','城门 东角子门 城楼','下层留通道，上层门楼；宋图城门名称依通常识读。','scroll'],
['city-wall','城墙段','门墙',[40,7,14],'wall','城墙 垛口 防御','砖石城墙和垛口。','scroll'],
['palace-wall','宫墙段','门墙',[40,3,8],'wall','红墙 黄瓦 宫墙','朱红墙身与黄色瓦顶。','buildings'],
['wumen-gate','午门五凤楼','宫殿',[130,62,38],'gate','午门 凹形 五凤楼 翼楼','凹字台基、中央重檐楼、两翼和四座方亭的组合。','wumen'],
['corner-tower','紫禁城角楼','宫殿',[22,22,27],'wall','角楼 复合屋顶 重檐','城墙四角角楼，复杂屋顶用参数构件近似。','buildings'],
['double-eave-hall','重檐庑殿','宫殿',[60,32,25],'land','太和殿 庑殿 重檐 金瓦','两层檐、四坡正脊，开间可调整。','taihe'],
['xieshan-hall','歇山殿堂','宫殿',[42,22,18],'land','歇山 宫殿 保和殿','带山花的歇山屋面。','buildings'],
['zanjian-pavilion','四角攒尖殿亭','宫殿',[20,20,17],'land','中和殿 攒尖 方形 亭','方形单檐四角攒尖；中和殿使用此形制。','zhonghe'],
['white-stone-terrace','汉白玉台基','附属',[72,40,5],'land','台基 三台 台阶','可组合成多层须弥台基与阶梯。','taihe'],
['stone-balustrade','白石栏杆','附属',[24,1,1.4],'land','栏杆 望柱 汉白玉','望柱、扶手与栏板。','jinshui'],
['courtyard-house','院落侧厢','宫殿',[24,12,9],'land','六宫 院落 厢房','较小单檐殿宇，用于两侧厢房，院落布局由地图数据控制。','buildings'],
['bronze-incense','铜香炉','附属',[3,3,3.8],'land','铜炉 香炉 院落','三足器身与盖，庭院陈设。','buildings'],
['stone-lion','石狮','附属',[2.4,3,3.4],'land','石狮 宫门','底座与蹲狮概形，雕刻细部推定。','buildings'],
['garden-rock','园林叠石','园林',[7,5,6],'land','假山 叠石 御花园','园林叠石组，轮廓参数化。','buildings'],
['field-plot','田畦','园林',[24,13,.4],'land','田地 郊野 农田','宋画右侧郊野的田畦意象。','scroll']
];
export const ASSET_LIBRARY=entries.map(([id,label,category,size,placement,tags,description,source])=>({id,label,category,periods:source==='scroll'?['北宋（画卷场景）']:['明清'],tags:tags.split(' '),description,defaultSize:{w:size[0],d:size[1],h:size[2]},parameters:{bays:5,roofColor:source==='scroll'?'#68665b':'#c89b45',wallColor:source==='scroll'?'#b6a58c':'#954c3e'},placement,sourceIds:[source],evidence:'inferred',version:ASSET_VERSION}));
export function getAsset(id){return ASSET_LIBRARY.find(a=>a.id===id);}
