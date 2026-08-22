import { env } from "cloudflare:workers";
import { rooms } from "../app/data";
import type {Room,Localized} from "../app/data";
import {inferRoomCounts} from "../lib/room-layout";

export type PropertyRecord = {
  id:number; slug:string; nameZh:string; nameEn:string; city:string; areaZh:string; areaEn:string;
  tags:string[]; images:string[]; imageCategories:Record<string,string>; imageOriginals:Record<string,string>; guests:number; bedrooms:number; beds:number; bathrooms:number;
  descriptionZh:string; descriptionEn:string; amenities:string[];
  highlights:{title:string;description:string}[]; suitableFor:string[]; guestQuote:string; guestQuoteAuthor:string; spaceConfig:{layout:string;area?:string;floor?:string;recommendedGuests?:string;maxGuests?:number}; sleepingArrangements:{space:string;bedType:string;width:string;length:string;quantity:number;sleeps:number}[]; nearby:{name:string;type:string;distance:string}[];
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

const cityNames:Record<string,Localized>={"吉隆坡":{zh:"吉隆坡",en:"Kuala Lumpur"},"亚庇":{zh:"亚庇",en:"Kota Kinabalu"},"仙本那":{zh:"仙本那",en:"Semporna"}};
const amenityEn:Record<string,string>={"高速 WiFi":"High-speed WiFi","空调":"Air Conditioning","设备齐全的厨房":"Fully Equipped Kitchen","洗衣机":"Washer","免费停车":"Free Parking","电视":"TV","吹风机":"Hair Dryer","亲子友好":"Family Friendly"};
export function propertyToRoom(item:PropertyRecord):Room{const loc=cityNames[item.city]||{zh:item.city,en:item.city};const localized=(value:string):Localized=>({zh:value,en:value});const counts=inferRoomCounts(item.nameZh,item.nameEn,item.bedrooms,item.bathrooms);const sizeByBedroom:Record<number,string>={1:"约55㎡",2:"约78㎡",3:"约110㎡"};const fallbackSpace={layout:`${counts.bedrooms}室${counts.bedrooms>1?2:1}厅${counts.bathrooms}卫`,area:sizeByBedroom[Math.min(counts.bedrooms,3)],floor:counts.bedrooms>2?"12楼":"18楼",recommendedGuests:counts.bedrooms>2?"舒适入住":"2–3人",maxGuests:item.guests};const fallbackSleep=[{space:"主卧",bedType:"双人床",width:counts.bedrooms>2?"1.8":"1.5",length:"2.0",quantity:1,sleeps:2},...(item.guests>2?[{space:"客厅",bedType:"沙发床",width:"0.9",length:"2.0",quantity:1,sleeps:Math.min(2,item.guests-2)}]:[])];return {id:item.slug,name:{zh:item.nameZh,en:item.nameEn},location:loc,area:{zh:item.areaZh,en:item.areaEn||item.areaZh},image:item.images[0]||"",images:item.images,guests:item.guests,bedrooms:counts.bedrooms,beds:item.beds,bathrooms:counts.bathrooms,priceFrom:item.priceFrom,description:{zh:item.descriptionZh,en:item.descriptionEn||item.descriptionZh},amenities:item.amenities.map((name,i)=>({name:{zh:name,en:amenityEn[name]||name},icon:["⌁","❄","⌂","◉","P","▣","≈","♙"][i%8]})),highlights:item.highlights.map((h,i)=>({name:localized(h.title),icon:["✨","📍","🌅","🌊"][i%4]})),suitableFor:item.suitableFor,guestQuote:item.guestQuote?localized(item.guestQuote):undefined,guestQuoteAuthor:item.guestQuoteAuthor?localized(item.guestQuoteAuthor):undefined,spaceConfig:{...fallbackSpace,...(item.spaceConfig||{})},sleepingArrangements:item.sleepingArrangements?.length?item.sleepingArrangements:fallbackSleep,nearbyPlaces:item.nearby.map((p,i)=>({name:localized(p.name),category:localized(p.type),distance:localized(p.distance),icon:["⌂","▱","✈","⛵"][i%4]}))}}
