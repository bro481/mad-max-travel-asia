import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureProperties, getProperty } from "../../../../../db/properties";
import { inferRoomCounts } from "../../../../../lib/room-layout";
import {
  deleteLocalProperty,
  getLocalProperty,
  updateLocalProperty,
  useLocalProperties,
} from "../local-dev-store";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){if(!await getChatGPTUser())return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;if(useLocalProperties()){const item=getLocalProperty(Number(id));return item?NextResponse.json(item):NextResponse.json({error:"Not found"},{status:404});}const item=await getProperty(Number(id));return item?NextResponse.json(item):NextResponse.json({error:"Not found"},{status:404});}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await getChatGPTUser())return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;const b=await request.json() as Record<string,unknown>;if(useLocalProperties()){updateLocalProperty(Number(id),b as any);return NextResponse.json({ok:true});}await ensureProperties();
 const json=(key:string)=>JSON.stringify(b[key]||[]);
 const counts=inferRoomCounts(String(b.nameZh||""),String(b.nameEn||""),Number(b.bedrooms),Number(b.bathrooms));
 await env.DB.prepare(`UPDATE properties SET name_zh=?,name_en=?,city=?,area_zh=?,area_en=?,tags=?,images=?,image_categories=?,image_originals=?,guests=?,bedrooms=?,beds=?,bathrooms=?,description_zh=?,description_en=?,amenities=?,highlights=?,nearby=?,suitable_for=?,guest_quote=?,guest_quote_author=?,space_config=?,sleeping_arrangements=?,price_from=?,price_note=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
 .bind(String(b.nameZh),String(b.nameEn),String(b.city),String(b.areaZh||""),String(b.areaEn||""),json("tags"),json("images"),JSON.stringify(b.imageCategories||{}),JSON.stringify(b.imageOriginals||{}),Number(b.guests),counts.bedrooms,Number(b.beds),counts.bathrooms,String(b.descriptionZh||""),String(b.descriptionEn||""),json("amenities"),json("highlights"),json("nearby"),json("suitableFor"),String(b.guestQuote||""),String(b.guestQuoteAuthor||""),JSON.stringify(b.spaceConfig||{}),json("sleepingArrangements"),Number(b.priceFrom),String(b.priceNote||""),String(b.status||"draft"),Number(id)).run();
 return NextResponse.json({ok:true});
}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await getChatGPTUser())return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;if(useLocalProperties()){deleteLocalProperty(Number(id));return NextResponse.json({ok:true});}await env.DB.prepare("DELETE FROM properties WHERE id=?").bind(Number(id)).run();return NextResponse.json({ok:true});}
