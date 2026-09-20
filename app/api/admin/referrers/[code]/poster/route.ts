import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../../chatgpt-auth";
import { getReferrerWithStats } from "../../../../../../db/referrers";

const PUBLIC_SITE_ORIGIN = "https://madmaxtravel.asia";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
  const qr = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
  });
  const qrData = `data:image/svg+xml;base64,${btoa(qr)}`;
  const poster = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <rect width="900" height="1200" fill="#f6f3ed"/>
  <rect x="54" y="54" width="792" height="1092" rx="24" fill="#ffffff" stroke="#d9d3c9"/>
  <text x="450" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#1f2933">MAD MAX</text>
  <text x="450" y="226" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" letter-spacing="4" fill="#267a63">MALAYSIA STAY</text>
  <text x="450" y="308" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#1f2933">住宿 · 接送机 · 包车 · 当地行程</text>
  <image href="${qrData}" x="270" y="402" width="360" height="360"/>
  <text x="450" y="835" text-anchor="middle" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="#1f2933">扫码查看马来西亚当地服务</text>
  <text x="450" y="895" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#75808c">${escapeXml(referrer.name)}专属入口</text>
  <text x="450" y="1015" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" fill="#9aa2aa">${escapeXml(target)}</text>
</svg>`;
  return new Response(poster, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="madmax-${referrer.code}-poster.svg"`,
    },
  });
}
