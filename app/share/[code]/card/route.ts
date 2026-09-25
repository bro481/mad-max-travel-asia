import QRCode from "qrcode";
import sharp from "sharp";
import { notFound } from "next/navigation";
import { getCustomerShare } from "../../../../db/customer-shares";
import { buildCustomerShareSvg, imageToDataUrl, shareUrl } from "../../../../lib/customer-share-materials";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const item = await getCustomerShare(code);
  if (!item) notFound();
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "svg" ? "svg" : "png";
  const qrSvg = await QRCode.toString(shareUrl(item.code), {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 640,
    color: { dark: "#17232f", light: "#ffffff" },
  });
  const svg = buildCustomerShareSvg({
    item,
    kind: "card",
    qrDataUrl: `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`,
    imageDataUrl: await imageToDataUrl(item.content.image || item.image),
  });
  if (format === "svg") {
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="madmax-share-${item.code}.svg"`,
      },
    });
  }
  const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="madmax-share-${item.code}-card.png"`,
    },
  });
}
