import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../../chatgpt-auth";
import { getReferrerWithStats } from "../../../../../../db/referrers";
import { getReferrerTarget } from "../../../../../../lib/referrer-materials";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  const referrer = await getReferrerWithStats(code);
  if (!referrer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "svg" ? "svg" : "png";
  const target = getReferrerTarget(referrer.code, "general");

  if (format === "png") {
    const png = await QRCode.toBuffer(target, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 2,
      width: 1200,
      color: { dark: "#17232f", light: "#ffffff" },
    });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="madmax-${referrer.code}-qr.png"`,
      },
    });
  }

  const svg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 720,
    color: { dark: "#17232f", light: "#ffffff" },
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="madmax-${referrer.code}-qr.svg"`,
    },
  });
}
