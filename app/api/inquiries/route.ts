import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { ensureInquiries } from "../../../db/inquiries";
import { validateReferrerForInquiry } from "../../../db/referrers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      contact?: string;
      destinations?: string[];
      services?: string[];
      travelTime?: string;
      message?: string;
      referrerId?: string;
      referrerFirstUrl?: string;
      referrerFirstAt?: string;
    };
    if (!body.name || !body.contact)
      return NextResponse.json(
        { error: "Missing contact details" },
        { status: 400 },
      );
    await ensureInquiries();
    const referrer = await validateReferrerForInquiry(body.referrerId);
    const source = referrer ? `${referrer.name} · ${referrer.code}` : "官网自然访问";
    await env.DB.prepare(
      "INSERT INTO inquiry_requests (name, contact, destinations, services, travel_time, message, status, source, referrer_id, referrer_name, referrer_first_url, referrer_first_at) VALUES (?, ?, ?, ?, ?, ?, '待回复', ?, ?, ?, ?, ?)",
    )
      .bind(
        body.name,
        body.contact,
        JSON.stringify(body.destinations || []),
        JSON.stringify(body.services || []),
        body.travelTime || null,
        body.message || "",
        source,
        referrer?.code || "",
        referrer?.name || "",
        referrer ? body.referrerFirstUrl || "" : "",
        referrer ? body.referrerFirstAt || "" : "",
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
