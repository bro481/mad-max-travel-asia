import { NextResponse } from "next/server";
import {
  getActiveReferrer,
  incrementReferrerVisit,
  normalizeReferrerCode,
} from "../../../../db/referrers";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      ref?: string;
      firstUrl?: string;
      firstAt?: string;
      countVisit?: boolean;
    };
    const code = normalizeReferrerCode(body.ref || "");
    if (!code) return NextResponse.json({ ok: false, active: false });
    const referrer = body.countVisit
      ? await incrementReferrerVisit(code)
      : await getActiveReferrer(code);
    if (!referrer) return NextResponse.json({ ok: false, active: false });
    return NextResponse.json({
      ok: true,
      active: true,
      referrer: {
        id: referrer.code,
        name: referrer.name,
        firstUrl: body.firstUrl || "",
        firstAt: body.firstAt || "",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, active: false }, { status: 400 });
  }
}
