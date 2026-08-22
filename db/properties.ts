import { env } from "cloudflare:workers";
import { rooms } from "../app/data";
import { staticDestinations, type DestinationRecord } from "./destinations";
import type {Room,Localized} from "../app/data";

export type StayReminder = { icon:string; text:string };
export type NearbyPlace = { name:string; nameEn?:string; type:string; transport?:string; duration?:string; durationValue?:number; durationUnit?:string; distance:string; icon?:string; visible?:boolean };
export type PropertySpaceConfig = {
  layout:string; area?:string; floor?:string; recommendedGuests?:string; maxGuests?:number;
  recommendedMinGuests?:number; recommendedMaxGuests?:number; priceType?:"fixed"|"from"|"consult";
  livingRooms?:number; locationDisplayZh?:string; locationDisplayEn?:string; internalNote?:string;
  copySourceId?:number; copySourceName?:string; copiedAt?:string;
  checkInTime?:string; checkOutTime?:string; checkInMethod?:string; guestRule?:string;
  useDefaultReminders?:boolean; reminders?:StayReminder[]; nearbyNote?:string;
  currency?:string; priceUnit?:string; showPriceFrom?:boolean; sortOrder?:number; visible?:boolean;
  customAmenities?:{nameZh:string;nameEn?:string;icon:string}[];
};
export type PropertyRecord = {
  id:number; slug:string; nameZh:string; nameEn:string; city:string; areaZh:string; areaEn:string;
  tags:string[]; images:string[]; imageCategories:Record<string,string>; imageOriginals:Record<string,string>; guests:number; bedrooms:number; beds:number; bathrooms:number;
  descriptionZh:string; descriptionEn:string; amenities:string[];
  highlights:{title:string;description:string}[]; suitableFor:string[]; guestQuote:string; guestQuoteAuthor:string; spaceConfig:PropertySpaceConfig; sleepingArrangements:{space:string;bedType:string;width:string;length:string;quantity:number;sleeps:number;customSize?:boolean}[]; nearby:NearbyPlace[];
  priceFrom:number; priceNote:string; status:"published"|"hidden"|"draft"; updatedAt:string;
};

const createSql=`CREATE TABLE IF NOT EXISTS properties (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name_zh TEXT NOT NULL, name_en TEXT NOT NULL,
 city TEXT NOT NULL, area_zh TEXT NOT NULL DEFAULT '', area_en TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '[]',
 images TEXT NOT NULL DEFAULT '[]', image_categories TEXT NOT NULL DEFAULT '{}', image_originals TEXT NOT NULL DEFAULT '{}', guests INTEGER NOT NULL DEFAULT 2, bedrooms INTEGER NOT NULL DEFAULT 1,
 beds INTEGER NOT NULL DEFAULT 1, bathrooms INTEGER NOT NULL DEFAULT 1, description_zh TEXT NOT NULL DEFAULT '',
 description_en TEXT NOT NULL DEFAULT '', amenities TEXT NOT NULL DEFAULT '[]', highlights TEXT NOT NULL DEFAULT '[]',
  nearby TEXT NOT NULL DEFAULT '[]', suitable_for TEXT NOT NULL DEFAULT '[]', guest_quote TEXT NOT NULL DEFAULT '', guest_quote_author TEXT NOT NULL DEFAULT '', space_config TEXT NOT NULL DEFAULT '{}', sleeping_arrangements TEXT NOT NULL DEFAULT '[]', price_from INTEGER NOT NULL DEFAULT 0, price_note TEXT NOT NULL DEFAULT '旺季价格请咨询',
 status TEXT NOT NULL DEFAULT 'draft', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function ensureProperties(){
  await env.DB.prepare(createSql).run();
  for (const sql of ["ALTER TABLE properties ADD COLUMN suitable_for TEXT NOT NULL DEFAULT '[]'", "ALTER TABLE properties ADD COLUMN guest_quote TEXT NOT NULL DEFAULT ''", "ALTER TABLE properties ADD COLUMN guest_quote_author TEXT NOT NULL DEFAULT ''", "ALTER TABLE properties ADD COLUMN space_config TEXT NOT NULL DEFAULT '{}'", "ALTER TABLE properties ADD COLUMN sleeping_arrangements TEXT NOT NULL DEFAULT '[]'"]) { try { await env.DB.prepare(sql).run(); } catch {} }
  const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM properties").first<{total:number}>();
  if((count?.total||0)>0)return;
  for(const room of rooms){
    await env.DB.prepare(`INSERT INTO properties (slug,name_zh,name_en,city,area_zh,area_en,images,guests,bedrooms,beds,bathrooms,description_zh,description_en,amenities,highlights,nearby,suitable_for,guest_quote,guest_quote_author,space_config,sleeping_arrangements,price_from,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(room.id,room.name.zh,room.name.en,room.location.zh,room.area.zh,room.area.en,JSON.stringify(room.images),room.guests,room.bedrooms,room.beds,room.bathrooms,room.description.zh,room.description.en,JSON.stringify(room.amenities.map(x=>x.name.zh)),JSON.stringify(room.highlights.map(x=>({title:x.name.zh,description:""}))),JSON.stringify(room.nearbyPlaces.map(x=>({name:x.name.zh,type:x.category.zh,distance:x.distance.zh}))),JSON.stringify(room.suitableFor||[]),"","",JSON.stringify(room.spaceConfig||{}),JSON.stringify(room.sleepingArrangements||[]),room.priceFrom,"published").run();
  }
}

const parse=(v:string)=>{try{return JSON.parse(v)}catch{return []}};
export function mapProperty(row:Record<string,unknown>):PropertyRecord{return {
  id:Number(row.id),slug:String(row.slug),nameZh:String(row.name_zh),nameEn:String(row.name_en),city:String(row.city),areaZh:String(row.area_zh),areaEn:String(row.area_en),
  tags:parse(String(row.tags)),images:parse(String(row.images)),imageCategories:(()=>{try{return JSON.parse(String(row.image_categories||"{}"))}catch{return {}}})(),imageOriginals:(()=>{try{return JSON.parse(String(row.image_originals||"{}"))}catch{return {}}})(),guests:Number(row.guests),bedrooms:Number(row.bedrooms),beds:Number(row.beds),bathrooms:Number(row.bathrooms),
  descriptionZh:String(row.description_zh),descriptionEn:String(row.description_en),amenities:parse(String(row.amenities)),highlights:parse(String(row.highlights)),suitableFor:parse(String(row.suitable_for||"[]")),guestQuote:String(row.guest_quote||""),guestQuoteAuthor:String(row.guest_quote_author||""),spaceConfig:parse(String(row.space_config||"{}")),sleepingArrangements:parse(String(row.sleeping_arrangements||"[]")),nearby:parse(String(row.nearby)),priceFrom:Number(row.price_from),priceNote:String(row.price_note),status:row.status as PropertyRecord["status"],updatedAt:String(row.updated_at)
}}

export async function listProperties(){await ensureProperties();const result=await env.DB.prepare("SELECT * FROM properties ORDER BY CASE city WHEN '吉隆坡' THEN 1 WHEN '亚庇' THEN 2 ELSE 3 END, id").all();return result.results.map(x=>mapProperty(x as Record<string,unknown>));}
export async function getProperty(id:number){await ensureProperties();const row=await env.DB.prepare("SELECT * FROM properties WHERE id=?").bind(id).first();return row?mapProperty(row as Record<string,unknown>):null;}
export async function getPublishedPropertyBySlug(slug:string){await ensureProperties();const row=await env.DB.prepare("SELECT * FROM properties WHERE slug=? AND status='published'").bind(slug).first();return row?mapProperty(row as Record<string,unknown>):null;}

const cityNamesFromDestinations=(destinations:DestinationRecord[]):Record<string,Localized>=>Object.fromEntries(destinations.map((item)=>[item.nameZh,{zh:item.nameZh,en:item.nameEn||item.nameZh}]));
const amenityEn:Record<string,string>={"高速 WiFi":"High-speed WiFi","空调":"Air Conditioning","热水":"Hot Water","电梯":"Elevator","厨房":"Kitchen","设备齐全的厨房":"Fully Equipped Kitchen","冰箱":"Fridge","微波炉":"Microwave","洗衣机":"Washer","吹风机":"Hair Dryer","智能电视":"Smart TV","免费停车":"Free Parking","收费停车":"Paid Parking","亲子友好":"Family Friendly","适合长住":"Long-stay Ready","情侣友好":"Couple Friendly"};
const amenityIcons:Record<string,string>={"高速 WiFi":"⌁","空调":"❄","热水":"♨","电梯":"⇅","厨房":"⌂","设备齐全的厨房":"⌂","冰箱":"▤","微波炉":"◌","洗衣机":"◉","吹风机":"≈","智能电视":"▣","免费停车":"P","收费停车":"P","亲子友好":"♙","适合长住":"◷","情侣友好":"♡"};
export function propertyToRoom(item:PropertyRecord,destinations:DestinationRecord[]=staticDestinations):Room{const cityNames=cityNamesFromDestinations(destinations);const loc=cityNames[item.city]||{zh:item.city,en:item.city};const localized=(value:string,en?:string):Localized=>({zh:value,en:en||value});const sleep=item.sleepingArrangements||[];const bedrooms=sleep.filter(x=>/卧室|主卧|次卧|卧/.test(x.space||"")).length||Number(item.bedrooms||1);const beds=sleep.reduce((total,x)=>total+Number(x.quantity||0),0)||item.beds;const bathrooms=Number(item.bathrooms||1);const livingRooms=Number(item.spaceConfig?.livingRooms ?? (bedrooms>1?2:1));const sizeByBedroom:Record<number,string>={1:"约55㎡",2:"约78㎡",3:"约110㎡"};const fallbackSpace={layout:`${bedrooms}室${livingRooms}厅${bathrooms}卫`,area:sizeByBedroom[Math.min(bedrooms,3)],floor:bedrooms>2?"12楼":"18楼",recommendedGuests:bedrooms>2?"舒适入住":"2–3人",maxGuests:item.guests,showPriceFrom:true,priceType:"from",priceUnit:"晚",currency:"CNY / 人民币"};const fallbackSleep=[{space:"主卧",bedType:"双人床",width:bedrooms>2?"1.8":"1.5",length:"2.0",quantity:1,sleeps:2},...(item.guests>2?[{space:"客厅",bedType:"沙发床",width:"0.9",length:"2.0",quantity:1,sleeps:Math.min(2,item.guests-2)}]:[])];const custom=(item.spaceConfig?.customAmenities||[]).filter(x=>x.nameZh).map(x=>({name:{zh:x.nameZh,en:x.nameEn||x.nameZh},icon:x.icon||"•"}));const typeIcons:Record<string,string>={景点:"🏙",购物:"🛍",餐饮:"🍜",机场:"✈",交通:"🚇",医疗:"🏥",其他:"📍"};const transportIcons:Record<string,string>={步行:"🚶",驾车:"🚗",公共交通:"🚇"};return {id:item.slug,name:{zh:item.nameZh,en:item.nameEn},location:loc,area:{zh:item.spaceConfig?.locationDisplayZh||item.areaZh,en:item.spaceConfig?.locationDisplayEn||item.areaEn||item.areaZh},image:item.images[0]||"",images:item.images,guests:Number(item.spaceConfig?.maxGuests||item.guests),bedrooms,beds,bathrooms,priceFrom:item.priceFrom,description:{zh:item.descriptionZh,en:item.descriptionEn||item.descriptionZh},amenities:[...item.amenities.map((name)=>({name:{zh:name,en:amenityEn[name]||name},icon:amenityIcons[name]||"•"})),...custom],highlights:item.highlights.map((h,i)=>({name:localized(h.title),icon:["✨","📍","🌅","🌊"][i%4]})),suitableFor:item.suitableFor,guestQuote:item.guestQuote?localized(item.guestQuote):undefined,guestQuoteAuthor:item.guestQuoteAuthor?localized(item.guestQuoteAuthor):undefined,spaceConfig:{...fallbackSpace,...(item.spaceConfig||{})},sleepingArrangements:item.sleepingArrangements?.length?item.sleepingArrangements:fallbackSleep,nearbyPlaces:item.nearby.filter(p=>p.visible!==false).map((p)=>{const value=p.durationValue?`${p.durationValue}${p.durationUnit||"分钟"}`:p.duration;const distance=p.distance||[p.transport,value].filter(Boolean).join("约")||"";return {name:localized(p.name,p.nameEn),category:localized(p.type),distance:localized(distance),icon:transportIcons[p.transport||""]||typeIcons[p.type]||"📍"}})}}
