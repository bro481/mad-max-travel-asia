import QRCode from "qrcode";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../../chatgpt-auth";
import { getReferrerWithStats } from "../../../../../../db/referrers";
import {
  buildPosterSvg,
  getReferrerTarget,
  parsePosterLanguage,
  parsePosterSize,
  parsePosterTemplate,
  parsePosterTopic,
} from "../../../../../../lib/referrer-materials";

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
  const template = parsePosterTemplate(url.searchParams.get("template"));
  const topic = parsePosterTopic(url.searchParams.get("topic"));
  const language = parsePosterLanguage(url.searchParams.get("lang"));
  const size = parsePosterSize(url.searchParams.get("size"));
  const requestedFormat = url.searchParams.get("format");
  const format = requestedFormat === "jpg" || requestedFormat === "jpeg" ? "jpg" : requestedFormat === "svg" ? "svg" : "png";
  const target = getReferrerTarget(referrer.code, topic);
  const qrSvg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 640,
    color: { dark: "#17232f", light: "#ffffff" },
  });
  const qrDataUrl = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`;
  const poster = buildPosterSvg({
    referrerName: referrer.name,
    code: referrer.code,
    template,
    topic,
    language,
    size,
    qrDataUrl,
  });

  const filenameBase = `madmax-${referrer.code}-poster-${template}-${topic}-${language}-${size}`;
  if (format === "svg") {
    return new Response(poster, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${filenameBase}.svg"`,
      },
    });
  }

  const image = sharp(Buffer.from(poster));
  const buffer =
    format === "jpg"
      ? await image.jpeg({ quality: 92, mozjpeg: true }).toBuffer()
      : await image.png({ compressionLevel: 9 }).toBuffer();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": format === "jpg" ? "image/jpeg" : "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${filenameBase}.${format}"`,
    },
  });
}
