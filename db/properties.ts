import { env } from "cloudflare:workers";
import { rooms } from "../app/data";

export type PropertyRecord = {
  id:number; slug:string; nameZh:string; nameEn:string; city:string; areaZh:string; areaEn:string;
  tags:string[]; images:string[]; guests:number; bedrooms:number; beds:number; bathrooms:number;
  descriptionZh:string; descriptionEn:string; amenities:string[];
  highlights:{title:string;description:string}[]; nearby:{name:string;type:string;distance:string}[];
  priceFrom:number; priceNote:string; status:"published"|"hidden"|"draft"; updatedAt:string;
};

const createSql=`CREATE TABLE IF NOT EXISTS properties (
 id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name_zh TEXT NOT NULL, name_en TEXT NOT NULL,
 city TEXT NOT NULL, area_zh TEXT NOT NULL DEFAULT '', area_en TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '[]',
 images TEXT NOT NULL DEFAULT '[]', guests INTEGER NOT NULL DEFAULT 2, bedrooms INTEGER NOT NULL DEFAULT 1,
 beds INTEGER NOT NULL DEFAULT 1, bathrooms INTEGER NOT NULL DEFAULT 1, description_zh TEXT NOT NULL DEFAULT '',
 description_en TEXT NOT NULL DEFAULT '', amenities TEXT NOT NULL DEFAULT '[]', highlights TEXT NOT NULL DEFAULT '[]',
 nearby TEXT NOT NULL DEFAULT '[]', price_from INTEGER NOT NULL DEFAULT 0, price_note TEXT NOT NULL DEFAULT '旺季价格请咨询',
 status TEXT NOT NULL DEFAULT 'draft', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function ensureProperties(){
  await env.DB.prepare(createSql).run();
  const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM properties").first<{total:number}>();
  if((count?.total||0)>0)return;
  for(const room of rooms){
    await env.DB.prepare(`INSERT INTO properties (slug,name_zh,name_en,city,area_zh,area_en,images,guests,bedrooms,beds,bathrooms,description_zh,description_en,amenities,highlights,nearby,price_from,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(room.id,room.name.zh,room.name.en,room.location.zh,room.area.zh,room.area.en,JSON.stringify(room.images),room.guests,room.bedrooms,room.beds,room.bathrooms,room.description.zh,room.description.en,JSON.stringify(room.amenities.map(x=>x.name.zh)),JSON.stringify(room.highlights.map(x=>({title:x.name.zh,description:""}))),JSON.stringify(room.nearbyPlaces.map(x=>({name:x.name.zh,type:x.category.zh,distance:x.distance.zh}))),room.priceFrom,"published").run();
  }
}

const parse=(v:string)=>{try{return JSON.parse(v)}catch{return []}};
export function mapProperty(row:Record<string,unknown>):PropertyRecord{return {
  id:Number(row.id),slug:String(row.slug),nameZh:String(row.name_zh),nameEn:String(row.name_en),city:String(row.city),areaZh:String(row.area_zh),areaEn:String(row.area_en),
  tags:parse(String(row.tags)),images:parse(String(row.images)),guests:Number(row.guests),bedrooms:Number(row.bedrooms),beds:Number(row.beds),bathrooms:Number(row.bathrooms),
  descriptionZh:String(row.description_zh),descriptionEn:String(row.description_en),amenities:parse(String(row.amenities)),highlights:parse(String(row.highlights)),nearby:parse(String(row.nearby)),priceFrom:Number(row.price_from),priceNote:String(row.price_note),status:row.status as PropertyRecord["status"],updatedAt:String(row.updated_at)
}}

export async function listProperties(){await ensureProperties();const result=await env.DB.prepare("SELECT * FROM properties ORDER BY CASE city WHEN '吉隆坡' THEN 1 WHEN '亚庇' THEN 2 ELSE 3 END, id").all();return result.results.map(x=>mapProperty(x as Record<string,unknown>));}
export async function getProperty(id:number){await ensureProperties();const row=await env.DB.prepare("SELECT * FROM properties WHERE id=?").bind(id).first();return row?mapProperty(row as Record<string,unknown>):null;}
