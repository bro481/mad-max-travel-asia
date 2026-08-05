import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { ensureInquiries } from "../../../db/inquiries";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      contact?: string;
      destinations?: string[];
      services?: string[];
      travelTime?: string;
      message?: string;
    };
    if (!body.name || !body.contact)
      return NextResponse.json(
        { error: "Missing contact details" },
        { status: 400 },
      );
    await ensureInquiries();
    await env.DB.prepare(
      "INSERT INTO inquiry_requests (name, contact, destinations, services, travel_time, message, status, source) VALUES (?, ?, ?, ?, ?, ?, '待回复', '网站')",
    )
      .bind(
        body.name,
        body.contact,
        JSON.stringify(body.destinations || []),
        JSON.stringify(body.services || []),
        body.travelTime || null,
        body.message || "",
      )
      .run();
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to save inquiry" },
      { status: 500 },
    );
  }
}
