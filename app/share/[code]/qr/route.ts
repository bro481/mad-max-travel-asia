import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { getCustomerShare } from "../../../../db/customer-shares";
import { shareUrl } from "../../../../lib/customer-share-materials";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const item = await getCustomerShare(code);
  if (!item) notFound();
  const format = new URL(request.url).searchParams.get("format") === "svg" ? "svg" : "png";
  const target = shareUrl(item.code);
  if (format === "svg") {
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
      },
    });
  }
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
      "Content-Disposition": `attachment; filename="madmax-share-${item.code}-qr.png"`,
    },
  });
}
