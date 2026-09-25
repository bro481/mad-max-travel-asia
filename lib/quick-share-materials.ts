import QRCode from "qrcode";
import sharp from "sharp";
import type { CustomerShareProductType, CustomerShareRecord } from "../db/customer-shares";
import { resolveCustomerShareContent } from "./customer-share-content";
import { buildCustomerShareSvg, imageToDataUrl } from "./customer-share-materials";

export async function buildQuickShareImage({
  type,
  id,
  url,
  kind,
  format,
}: {
  type: CustomerShareProductType;
  id: string;
  url?: string;
  kind: "card" | "long";
  format: "svg" | "png";
}) {
  const content = await resolveCustomerShareContent(type, id);
  if (!content) return null;
  const target = url || content.url;
  const item: CustomerShareRecord = {
    id: 0,
    code: "quick",
    status: "shared",
    productType: type,
    productId: id,
    productSlug: content.slug,
    title: content.title,
    subtitle: content.subtitle,
    image: content.image,
    targetUrl: target,
    content: { ...content, url: target },
    payload: {
      quoteCurrency: "RM",
      quoteUnit: type === "stay" ? "晚" : "次",
      showQuote: false,
      showDates: false,
      showDetails: true,
    },
    viewedAt: "",
    createdAt: "",
    updatedAt: "",
  };
  const qrSvg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 640,
    color: { dark: "#17232f", light: "#ffffff" },
  });
  const svg = buildCustomerShareSvg({
    item,
    kind,
    qrDataUrl: `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString("base64")}`,
    imageDataUrl: await imageToDataUrl(content.image),
  });
  if (format === "svg") return { content, body: svg, contentType: "image/svg+xml; charset=utf-8" };
  const buffer = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  return { content, body: new Uint8Array(buffer), contentType: "image/png" };
}
