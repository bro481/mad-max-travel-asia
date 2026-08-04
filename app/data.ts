export type Lang = "en" | "zh";
export type Localized = { zh:string; en:string };
export type IconItem = { name:Localized; icon:string };
export type Room = {
  id:string; name:Localized; location:Localized; area:Localized; image:string; images:string[];
  guests:number; bedrooms:number; beds:number; bathrooms:number;
  description:Localized; amenities:IconItem[]; highlights:IconItem[];
  nearbyPlaces:{name:Localized;category:Localized;distance:Localized;icon:string}[];
};

const u=(id:string,w=1400)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=86`;
const extra=["photo-1600210492486-724fe5c67fb0","photo-1600607687920-4e2a09cf159d","photo-1600566753190-17f0baa2a6c3","photo-1600566753086-00f18fb6b3ea","photo-1600607688969-a5bfcd646154","photo-1615874694520-474822394e73","photo-1600607687939-ce8a6c25118c","photo-1600566753051-f0b89df2dd90"];
const amenity=(en:string,zh:string,icon:string):IconItem=>({name:{zh,en},icon});
const commonAmenities=[amenity("High-speed WiFi","高速 WiFi","⌁"),amenity("Air Conditioning","空调","❄"),amenity("Fully Equipped Kitchen","设备齐全的厨房","⌂"),amenity("Smart TV","智能电视","▣"),amenity("Washer","洗衣机","◉"),amenity("Hair Dryer","吹风机","≈"),amenity("Family Friendly","亲子友好","♙"),amenity("Long-stay Ready","适合长住","◷"),amenity("Free Parking","免费停车","P")];
const placeSets={
  kl:[{name:{zh:"吉隆坡双子塔",en:"Petronas Twin Towers"},category:{zh:"城市地标",en:"City landmark"},distance:{zh:"驾车约 5 分钟",en:"5 mins drive"},icon:"🏙"},{name:{zh:"Pavilion 购物中心",en:"Pavilion Kuala Lumpur"},category:{zh:"购物餐饮",en:"Shopping & dining"},distance:{zh:"驾车约 8 分钟",en:"8 mins drive"},icon:"🛍"},{name:{zh:"吉隆坡国际机场",en:"KLIA Airport"},category:{zh:"机场交通",en:"Airport connection"},distance:{zh:"驾车约 45 分钟",en:"45 mins drive"},icon:"✈"}],
  kk:[{name:{zh:"亚庇海滨",en:"KK Waterfront"},category:{zh:"日落与餐饮",en:"Sunset & dining"},distance:{zh:"驾车约 6 分钟",en:"6 mins drive"},icon:"🌊"},{name:{zh:"哲斯顿港码头",en:"Jesselton Point"},category:{zh:"跳岛出发点",en:"Island departure point"},distance:{zh:"驾车约 9 分钟",en:"9 mins drive"},icon:"⛵"},{name:{zh:"亚庇国际机场",en:"Kota Kinabalu Airport"},category:{zh:"机场交通",en:"Airport connection"},distance:{zh:"驾车约 15 分钟",en:"15 mins drive"},icon:"✈"}],
  semporna:[{name:{zh:"仙本那码头",en:"Semporna Jetty"},category:{zh:"跳岛出发点",en:"Island departure point"},distance:{zh:"驾车约 5 分钟",en:"5 mins drive"},icon:"⛵"},{name:{zh:"仙本那海鲜市场",en:"Seafood Market"},category:{zh:"当地美食",en:"Local seafood"},distance:{zh:"驾车约 8 分钟",en:"8 mins drive"},icon:"🦐"},{name:{zh:"斗湖机场",en:"Tawau Airport"},category:{zh:"机场交通",en:"Airport connection"},distance:{zh:"驾车约 80 分钟",en:"80 mins drive"},icon:"✈"}],
};
const highlights={
  kl:[amenity("City View","城市景观","✨"),amenity("Central Location","市中心位置","📍"),amenity("Free Parking","免费停车","🚗"),amenity("Easy Shopping","购物方便","🛍")],
  kk:[amenity("Sunset Views","日落景观","🌅"),amenity("Near Waterfront","靠近海滨","🌊"),amenity("Easy Parking","停车方便","🚗"),amenity("Island Access","方便跳岛","⛵")],
  semporna:[amenity("Near the Jetty","靠近码头","⛵"),amenity("Island Transfers","可安排跳岛接送","🚤"),amenity("Local Food Nearby","邻近当地美食","🍜"),amenity("Host Support","当地房东协助","💬")],
};

function makeRoom(id:string,nameEn:string,nameZh:string,loc:"kl"|"kk"|"semporna",cover:string,guests:number,bedrooms:number,beds:number,bathrooms:number,descriptionEn:string,descriptionZh:string):Room{
  const location=loc==="kl"?{zh:"吉隆坡",en:"Kuala Lumpur"}:loc==="kk"?{zh:"亚庇",en:"Kota Kinabalu"}:{zh:"仙本那",en:"Semporna"};
  const areaMap:Record<string,Localized>={"kl-city-apartment":{zh:"KLCC 附近",en:"Near KLCC"},"kl-cozy-suite":{zh:"武吉免登",en:"Bukit Bintang"},"kl-family-residence":{zh:"市中心",en:"City Centre"},"kl-modern-loft":{zh:"满家乐",en:"Mont Kiara"},"kk-seaview-suite":{zh:"海滨区",en:"Waterfront"},"kk-cozy-home":{zh:"市中心",en:"City Centre"},"kk-family-loft":{zh:"哲斯顿港附近",en:"Near Jesselton Point"},"kk-ocean-view-villa":{zh:"丹绒亚路",en:"Tanjung Aru"},"semporna-ocean-stay":{zh:"码头附近",en:"Near the Jetty"},"semporna-dive-lodge":{zh:"市中心",en:"Town Centre"},"semporna-family-house":{zh:"安静住宅区",en:"Quiet Residential Area"},"semporna-island-villa":{zh:"海岛区域",en:"Island Area"}};
  const extraDescription=loc==="kl"?{zh:"适合第一次来到吉隆坡的家庭和朋友旅行。房间拥有舒适的生活空间，附近交通便利，可以轻松前往购物中心、餐厅和城市景点。",en:"A welcoming choice for families and friends visiting Kuala Lumpur for the first time, with comfortable living space and easy access to shopping, dining and city sights."}:loc==="kk"?{zh:"适合家庭、情侣和朋友探索亚庇，既方便前往海滨与码头，也能在一天行程后享受轻松舒适的休息空间。",en:"A comfortable base for families, couples and friends exploring Kota Kinabalu, with easy access to the waterfront and a relaxing place to return to."}:{zh:"适合准备跳岛、潜水或轻松度假的旅客，前往码头和当地餐饮都很方便，也可协助安排接送与当地行程。",en:"Ideal for island hopping, diving or a relaxed coastal break, with convenient jetty access and help arranging local transfers and activities."};
  const image=u(cover);
  return {id,name:{zh:nameZh,en:nameEn},location,area:areaMap[id],image,images:[cover,...extra.filter(x=>x!==cover)].map((x,i)=>u(x,i===0?1800:1200)),guests,bedrooms,beds,bathrooms,description:{zh:`${descriptionZh}${extraDescription.zh}`,en:`${descriptionEn} ${extraDescription.en}`},amenities:commonAmenities,highlights:highlights[loc],nearbyPlaces:placeSets[loc]};
}

export const rooms:Room[]=[
  makeRoom("kl-city-apartment","KL City Apartment","吉隆坡城市公寓","kl","photo-1600210492486-724fe5c67fb0",4,2,2,2,"A calm, light-filled city apartment in central Kuala Lumpur. Thoughtfully equipped for families and friends who want an easy, comfortable stay close to the city's best dining and shopping.","位于吉隆坡市中心的明亮舒适公寓，设备齐全，适合家庭和朋友入住，轻松前往城市热门餐厅与购物中心。"),
  makeRoom("kl-cozy-suite","KL Cozy Suite","吉隆坡温馨套房","kl","photo-1600566753086-00f18fb6b3ea",3,1,2,1,"A warm, thoughtfully styled suite for couples and small families, with a comfortable living area and convenient city access.","温暖而精心布置的套房，适合情侣或小家庭，拥有舒适起居空间，前往市区十分方便。"),
  makeRoom("kl-family-residence","KL Family Residence","吉隆坡家庭住宅","kl","photo-1600607687939-ce8a6c25118c",6,3,4,2,"A spacious family residence designed for unhurried time together, with generous bedrooms and a fully equipped kitchen.","宽敞的家庭住宅，卧室舒适并配有完整厨房，适合家人朋友一起享受悠闲时光。"),
  makeRoom("kl-modern-loft","KL Modern Loft","吉隆坡现代阁楼","kl","photo-1600210491369-e753d80a41f3",4,2,2,2,"Clean lines, soft textures and open-plan living make this modern loft a restful base in the heart of Kuala Lumpur.","现代开放式空间结合柔和材质与简洁线条，是探索吉隆坡后放松休息的理想住处。"),
  makeRoom("kk-seaview-suite","KK Seaview Suite","亚庇海景套房","kk","photo-1600607688960-e095ff83135c",4,2,2,2,"Wake to sea views from this bright Kota Kinabalu suite, made for easy mornings and relaxed evenings after exploring Sabah.","在明亮的亚庇海景套房醒来，轻松开启一天，并在探索沙巴之后享受悠闲夜晚。"),
  makeRoom("kk-cozy-home","KK Cozy Home","亚庇温馨之家","kk","photo-1616486338812-3dadae4b4ace",3,1,2,1,"A comfortable local home with warm interiors and a practical layout, ideal for a short city break or longer Sabah stay.","温暖舒适、布局实用的当地住宅，适合亚庇短途度假或较长时间入住。"),
  makeRoom("kk-family-loft","KK Family Loft","亚庇家庭阁楼","kk","photo-1600566753051-f0b89df2dd90",6,3,4,2,"Roomy, welcoming and close to the waterfront, this loft gives families a simple, comfortable home base in KK.","宽敞温馨且靠近海滨，为家庭旅客提供一个简单舒适的亚庇落脚点。"),
  makeRoom("kk-ocean-view-villa","KK Ocean View Villa","亚庇海景别墅","kk","photo-1600047509807-ba8f99d2cdde",4,2,2,2,"A private villa with generous sea-facing spaces, soft natural light and a breezy atmosphere for a slower Sabah stay.","拥有宽敞海景空间与柔和自然光的私人别墅，适合享受慢节奏的沙巴假期。"),
  makeRoom("semporna-ocean-stay","Semporna Ocean Stay","仙本那海边住宿","semporna","photo-1544551763-46a013bb70d5",4,2,2,1,"A simple coastal stay for island-bound travellers, with easy access to Semporna jetty and local connections.","为跳岛旅客准备的舒适海边住宿，方便前往仙本那码头及连接当地交通。"),
  makeRoom("semporna-dive-lodge","Semporna Dive Lodge","仙本那潜水小屋","semporna","photo-1600607687644-c7171b42498f",3,1,2,1,"A laid-back lodge for divers and island explorers, offering a comfortable place to reset between sea days.","专为潜水客和跳岛旅客打造的悠闲小屋，让你在海上行程之间舒适休息。"),
  makeRoom("semporna-family-house","Semporna Family House","仙本那家庭之家","semporna","photo-1600585154340-be6161a56a0c",6,3,4,2,"A welcoming family house with room to gather, rest and prepare for island adventures around Semporna.","温馨宽敞的家庭住宅，适合相聚休息，并为仙本那跳岛行程做好准备。"),
  makeRoom("semporna-island-villa","Semporna Island Villa","仙本那海岛别墅","semporna","photo-1507525428034-b723cf961d3e",4,2,2,2,"An intimate island escape surrounded by clear water and tropical calm, with local boat transfers arranged for a seamless stay.","被清澈海水与热带宁静环绕的精致海岛别墅，可协助安排当地船只接送。"),
];

export const services=[
  {name:{en:"Airport Transfer",zh:"机场接送"},description:{en:"Airport pickup and drop-off in KL, KK and Tawau.",zh:"提供吉隆坡、亚庇及斗湖机场接送。"},image:u("photo-1549317661-bd32c8ce0db2")},
  {name:{en:"Private Car",zh:"私人包车"},description:{en:"Flexible itinerary with an experienced local driver.",zh:"当地司机接送，行程灵活安排。"},image:u("photo-1550355291-bbee04a92027")},
  {name:{en:"Island Transfer",zh:"海岛接送"},description:{en:"Boat transfer to islands and popular destinations.",zh:"提供热门海岛及目的地船只接送。"},image:u("photo-1544550285-f813152fb2fd")},
  {name:{en:"Day Trip",zh:"一日游"},description:{en:"Melaka day trip, Singapore transfer and more.",zh:"马六甲一日游、新加坡接送及更多服务。"},image:u("photo-1596422846543-75c6fc197f07")},
];
