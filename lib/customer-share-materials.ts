import type { CustomerShareRecord } from "../db/customer-shares";
import { PUBLIC_ORIGIN } from "./customer-share-content";

export type ShareMaterialKind = "card" | "long";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text({
  x,
  y,
  value,
  size,
  weight = 600,
  fill = "#17232f",
  anchor = "start",
}: {
  x: number;
  y: number;
  value: string;
  size: number;
  weight?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`;
}

function wrapLines(value: string, max = 18, lines = 2) {
  const source = value.trim();
  if (!source) return [];
  const result: string[] = [];
  let current = "";
  for (const char of source) {
    if (current.length >= max) {
      result.push(current);
      current = "";
      if (result.length >= lines) break;
    }
    current += char;
  }
  if (current && result.length < lines) result.push(current);
  return result;
}

export function shareUrl(code: string) {
  return `${PUBLIC_ORIGIN}/share/${encodeURIComponent(code)}`;
}

export function formatDateRange(item: CustomerShareRecord) {
  const { startDate, endDate, useDate } = item.payload;
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (useDate) return useDate;
  if (startDate) return startDate;
  return "";
}

export function quoteLabel(item: CustomerShareRecord) {
  if (!item.payload.showQuote || !item.payload.quoteAmount) return item.content.priceLabel || "价格请咨询";
  const currency = item.payload.quoteCurrency || "RM";
  const unit = item.payload.quoteUnit || (item.productType === "stay" ? "晚" : "次");
  return `${currency} ${item.payload.quoteAmount} / ${unit}`;
}

export function totalQuoteLabel(item: CustomerShareRecord) {
  const amount = Number(item.payload.quoteAmount || 0);
  if (!amount || !item.payload.startDate || !item.payload.endDate || item.productType !== "stay") return "";
  const nights = Math.max(
    1,
    Math.round((new Date(item.payload.endDate).getTime() - new Date(item.payload.startDate).getTime()) / 86400000),
  );
  return `共 ${nights} 晚 · ${item.payload.quoteCurrency || "RM"} ${amount * nights}`;
}

export function buildCustomerShareSvg({
  item,
  qrDataUrl,
  imageDataUrl,
  kind,
}: {
  item: CustomerShareRecord;
  qrDataUrl: string;
  imageDataUrl: string;
  kind: ShareMaterialKind;
}) {
  const isLong = kind === "long";
  const width = 1080;
  const height = isLong ? 1920 : 1350;
  const date = formatDateRange(item);
  const quote = quoteLabel(item);
  const total = totalQuoteLabel(item);
  const people = item.payload.people ? `${item.payload.people} 位入住 / 使用` : "";
  const highlights = item.content.highlights.slice(0, isLong ? 8 : 5);
  const details = item.content.details.slice(0, isLong ? 10 : 4);
  const note = item.payload.note || item.content.description;
  const titleLines = wrapLines(item.title, 15, 2);
  const noteLines = wrapLines(note, 24, isLong ? 4 : 2);
  const qrSize = isLong ? 245 : 210;
  const qrY = height - (isLong ? 340 : 280);

  const detailRows = details
    .map((detail, index) => {
      const y = isLong ? 1040 + index * 68 : 845 + index * 54;
      return `${text({ x: 92, y, value: detail.label, size: isLong ? 28 : 23, fill: "#7b858c", weight: 700 })}
${text({ x: 320, y, value: detail.value.slice(0, 24), size: isLong ? 30 : 24, fill: "#26333d", weight: 800 })}`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f7f2eb"/>
  <rect x="52" y="52" width="${width - 104}" height="${height - 104}" rx="36" fill="#fffdf9" stroke="#e3d8cc"/>
  ${text({ x: 92, y: 130, value: "MAD MAX", size: 43, weight: 900 })}
  ${text({ x: 92, y: 170, value: "MALAYSIA STAY", size: 19, weight: 800, fill: "#24745f" })}
  <rect x="92" y="215" width="896" height="${isLong ? 475 : 420}" rx="28" fill="#e7e2da"/>
  ${imageDataUrl ? `<image href="${imageDataUrl}" x="92" y="215" width="896" height="${isLong ? 475 : 420}" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>` : ""}
  <defs><clipPath id="coverClip"><rect x="92" y="215" width="896" height="${isLong ? 475 : 420}" rx="28"/></clipPath></defs>
  ${titleLines.map((line, index) => text({ x: 92, y: (isLong ? 770 : 720) + index * 56, value: line, size: 47, weight: 900 })).join("\n")}
  ${text({ x: 92, y: isLong ? 892 : 835, value: item.subtitle.slice(0, 32), size: 28, weight: 800, fill: "#65717a" })}
  ${date ? text({ x: 92, y: isLong ? 962 : 895, value: date, size: 31, weight: 850 }) : ""}
  ${people ? text({ x: 92, y: isLong ? 1010 : 936, value: people, size: 27, weight: 750, fill: "#65717a" }) : ""}
  <rect x="${isLong ? 625 : 646}" y="${isLong ? 850 : 760}" width="${isLong ? 300 : 300}" height="118" rx="22" fill="#17232f"/>
  ${text({ x: isLong ? 655 : 676, y: isLong ? 895 : 805, value: "本次报价", size: 22, weight: 800, fill: "#d8c0a4" })}
  ${text({ x: isLong ? 655 : 676, y: isLong ? 945 : 855, value: quote.slice(0, 18), size: 35, weight: 900, fill: "#ffffff" })}
  ${total ? text({ x: isLong ? 655 : 676, y: isLong ? 995 : 906, value: total, size: 22, weight: 800, fill: "#d8c0a4" }) : ""}
  <line x1="92" y1="${isLong ? 1090 : 970}" x2="988" y2="${isLong ? 1090 : 970}" stroke="#eadfd4" stroke-width="2"/>
  ${isLong ? detailRows : ""}
  ${!isLong ? text({ x: 92, y: 1040, value: highlights.join(" · ").slice(0, 42), size: 25, weight: 800, fill: "#49565f" }) : ""}
  ${isLong ? text({ x: 92, y: 1740, value: highlights.join(" · ").slice(0, 46), size: 27, weight: 850, fill: "#49565f" }) : ""}
  ${noteLines.map((line, index) => text({ x: 92, y: (isLong ? 1240 : 1100) + index * 42, value: line, size: 25, weight: 650, fill: "#66727a" })).join("\n")}
  <rect x="${width - 92 - qrSize}" y="${qrY}" width="${qrSize}" height="${qrSize}" rx="22" fill="#ffffff" stroke="#e2e8e5"/>
  <image href="${qrDataUrl}" x="${width - 76 - qrSize}" y="${qrY + 16}" width="${qrSize - 32}" height="${qrSize - 32}"/>
  ${text({ x: 92, y: qrY + 70, value: isLong ? "扫码查看完整详情" : "查看完整照片与详情", size: 34, weight: 900 })}
  ${text({ x: 92, y: qrY + 116, value: "或直接联系 MAD MAX", size: 25, weight: 700, fill: "#24745f" })}
  ${item.payload.validUntil ? text({ x: 92, y: qrY + 174, value: `报价有效至 ${item.payload.validUntil}`, size: 22, weight: 700, fill: "#8b6f54" }) : ""}
  ${text({ x: width / 2, y: height - 92, value: "MAD MAX Malaysia Stay", size: 24, weight: 800, fill: "#7b858c", anchor: "middle" })}
</svg>`;
}

export async function imageToDataUrl(url: string) {
  if (!url) return "";
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const type = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}
