import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../../chatgpt-auth";
import { getReferrerWithStats } from "../../../../../../db/referrers";

const PUBLIC_SITE_ORIGIN = "https://madmaxtravel.asia";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  const referrer = await getReferrerWithStats(code);
  if (!referrer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const target = `${PUBLIC_SITE_ORIGIN}/?ref=${encodeURIComponent(referrer.code)}`;
  const svg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 720,
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="madmax-${referrer.code}-qr.svg"`,
    },
  });
}
