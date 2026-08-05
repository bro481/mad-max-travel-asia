import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureProperties, getProperty } from "../../../../../db/properties";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){if(!await getChatGPTUser())return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;const item=await getProperty(Number(id));return item?NextResponse.json(item):NextResponse.json({error:"Not found"},{status:404});}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!await getChatGPTUser())return NextResponse.json({error:"Unauthorized"},{status:401});await ensureProperties();const {id}=await params;const b=await request.json() as Record<string,unknown>;
 const json=(key:string)=>JSON.stringify(b[key]||[]);
 await env.DB.prepare(`UPDATE properties SET name_zh=?,name_en=?,city=?,area_zh=?,area_en=?,tags=?,images=?,image_categories=?,image_originals=?,guests=?,bedrooms=?,beds=?,bathrooms=?,description_zh=?,description_en=?,amenities=?,highlights=?,nearby=?,price_from=?,price_note=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
 .bind(String(b.nameZh),String(b.nameEn),String(b.city),String(b.areaZh||""),String(b.areaEn||""),json("tags"),json("images"),JSON.stringify(b.imageCategories||{}),JSON.stringify(b.imageOriginals||{}),Number(b.guests),Number(b.bedrooms),Number(b.beds),Number(b.bathrooms),String(b.descriptionZh||""),String(b.descriptionEn||""),json("amenities"),json("highlights"),json("nearby"),Number(b.priceFrom),String(b.priceNote||""),String(b.status||"draft"),Number(id)).run();
 return NextResponse.json({ok:true});
}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await getChatGPTUser())return NextResponse.json({error:"Unauthorized"},{status:401});const {id}=await params;await env.DB.prepare("DELETE FROM properties WHERE id=?").bind(Number(id)).run();return NextResponse.json({ok:true});}
