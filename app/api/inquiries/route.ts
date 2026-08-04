import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

const createSql = `CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  travel_date TEXT NOT NULL,
  people INTEGER NOT NULL,
  requirements TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function POST(request:Request) {
  try {
    const body=await request.json() as {name?:string;contact?:string;date?:string;people?:string|number;requirements?:string[];message?:string};
    if(!body.name||!body.contact||!body.date||!body.people) return NextResponse.json({error:"Missing required fields"},{status:400});
    await env.DB.prepare(createSql).run();
    await env.DB.prepare("INSERT INTO inquiries (name, contact, travel_date, people, requirements, message) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(body.name,body.contact,body.date,Number(body.people),JSON.stringify(body.requirements||[]),body.message||"").run();
    return NextResponse.json({ok:true},{status:201});
  } catch { return NextResponse.json({error:"Unable to save inquiry"},{status:500}); }
}
