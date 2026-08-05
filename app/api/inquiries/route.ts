import {env} from "cloudflare:workers";
import {NextResponse} from "next/server";

const createSql=`CREATE TABLE IF NOT EXISTS inquiry_requests (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 contact TEXT NOT NULL,
 destinations TEXT NOT NULL,
 services TEXT NOT NULL,
 travel_time TEXT,
 message TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function POST(request:Request){
 try{const body=await request.json() as {name?:string;contact?:string;destinations?:string[];services?:string[];travelTime?:string;message?:string};if(!body.name||!body.contact)return NextResponse.json({error:"Missing contact details"},{status:400});await env.DB.prepare(createSql).run();await env.DB.prepare("INSERT INTO inquiry_requests (name, contact, destinations, services, travel_time, message) VALUES (?, ?, ?, ?, ?, ?)").bind(body.name,body.contact,JSON.stringify(body.destinations||[]),JSON.stringify(body.services||[]),body.travelTime||null,body.message||"").run();return NextResponse.json({ok:true},{status:201})}catch{return NextResponse.json({error:"Unable to save inquiry"},{status:500})}
}
