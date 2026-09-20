export const PUBLIC_SITE_ORIGIN = "https://madmaxtravel.asia";

export type PosterTemplate = "minimal" | "travel" | "service";
export type PosterTopic = "general" | "stay" | "transfer" | "charter" | "trip";
export type PosterLanguage = "en" | "zh" | "bilingual";
export type PosterSize = "share" | "story";

export const posterSizeMap: Record<PosterSize, { width: number; height: number }> = {
  share: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

const validTemplates: PosterTemplate[] = ["minimal", "travel", "service"];
const validTopics: PosterTopic[] = ["general", "stay", "transfer", "charter", "trip"];
const validLanguages: PosterLanguage[] = ["en", "zh", "bilingual"];
const validSizes: PosterSize[] = ["share", "story"];

export function parsePosterTemplate(value: string | null): PosterTemplate {
  return validTemplates.includes(value as PosterTemplate) ? (value as PosterTemplate) : "minimal";
}

export function parsePosterTopic(value: string | null): PosterTopic {
  return validTopics.includes(value as PosterTopic) ? (value as PosterTopic) : "general";
}

export function parsePosterLanguage(value: string | null): PosterLanguage {
  return validLanguages.includes(value as PosterLanguage) ? (value as PosterLanguage) : "en";
}

export function parsePosterSize(value: string | null): PosterSize {
  return validSizes.includes(value as PosterSize) ? (value as PosterSize) : "share";
}

export function getReferrerTarget(code: string, topic: PosterTopic) {
  const ref = `ref=${encodeURIComponent(code)}`;
  if (topic === "stay") return `${PUBLIC_SITE_ORIGIN}/rooms?${ref}`;
  if (topic === "transfer") return `${PUBLIC_SITE_ORIGIN}/services?${ref}&topic=airport-transfer`;
  if (topic === "charter") return `${PUBLIC_SITE_ORIGIN}/services?${ref}&topic=private-car`;
  if (topic === "trip") return `${PUBLIC_SITE_ORIGIN}/packages?${ref}`;
  return `${PUBLIC_SITE_ORIGIN}/?${ref}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function copyFor(topic: PosterTopic, language: PosterLanguage) {
  const en = {
    general: {
      headline: "Explore Malaysia, effortlessly.",
      subtitle: "Stay · Airport Transfer · Private Car · Local Trips",
      cta: "Scan to plan your trip",
      support: "Local support · Direct booking",
    },
    stay: {
      headline: "Stay in the heart of Kuala Lumpur",
      subtitle: "Comfortable stays near KLCC",
      cta: "Scan to view available stays",
      support: "Curated rooms · Local support",
    },
    transfer: {
      headline: "Landing in Kuala Lumpur?",
      subtitle: "Airport transfer made easy",
      cta: "Scan to book your ride",
      support: "KLIA ⇄ Kuala Lumpur",
    },
    charter: {
      headline: "Private car for your Malaysia trip",
      subtitle: "Flexible rides for families and groups",
      cta: "Scan to plan your route",
      support: "Local drivers · Easy booking",
    },
    trip: {
      headline: "Discover local Malaysia trips",
      subtitle: "Day trips, experiences and easy itineraries",
      cta: "Scan to explore trips",
      support: "Local ideas · Direct booking",
    },
  };
  const zh = {
    general: {
      headline: "轻松规划你的马来西亚行程",
      subtitle: "住宿 · 接送机 · 包车 · 当地行程",
      cta: "扫码咨询行程",
      support: "当地支持 · 直接预订",
    },
    stay: {
      headline: "住在吉隆坡核心区域",
      subtitle: "KLCC 周边舒适住宿",
      cta: "扫码查看房源",
      support: "精选住宿 · 当地支持",
    },
    transfer: {
      headline: "抵达吉隆坡？",
      subtitle: "机场接送更省心",
      cta: "扫码预约接送",
      support: "KLIA ⇄ 吉隆坡市区",
    },
    charter: {
      headline: "马来西亚包车更轻松",
      subtitle: "适合家庭、朋友和自由行",
      cta: "扫码规划路线",
      support: "当地司机 · 直接预订",
    },
    trip: {
      headline: "发现马来西亚当地行程",
      subtitle: "一日游、体验和轻松路线",
      cta: "扫码查看行程",
      support: "当地玩法 · 直接预订",
    },
  };
  if (language === "zh") return zh[topic];
  if (language === "bilingual") {
    return {
      headline: `${en[topic].headline}`,
      subtitle: `${en[topic].subtitle}`,
      cta: `${en[topic].cta}`,
      support: zh[topic].support,
      secondary: zh[topic].headline,
    };
  }
  return en[topic];
}

function text({
  x,
  y,
  value,
  size,
  weight = 500,
  fill = "#17232f",
  anchor = "middle",
  spacing = 0,
}: {
  x: number;
  y: number;
  value: string;
  size: number;
  weight?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  spacing?: number;
}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${spacing}" fill="${fill}">${escapeXml(value)}</text>`;
}

export function buildPosterSvg({
  referrerName,
  code,
  template,
  topic,
  language,
  size,
  qrDataUrl,
}: {
  referrerName: string;
  code: string;
  template: PosterTemplate;
  topic: PosterTopic;
  language: PosterLanguage;
  size: PosterSize;
  qrDataUrl: string;
}) {
  const { width, height } = posterSizeMap[size];
  const copy = copyFor(topic, language);
  const isStory = size === "story";
  const qrSize = isStory ? 450 : 360;
  const qrX = (width - qrSize) / 2;
  const bodyTop = template === "travel" ? Math.round(height * 0.42) : 0;
  const contentTop = template === "travel" ? bodyTop + (isStory ? 105 : 78) : isStory ? 310 : 210;
  const brandY = template === "travel" ? 135 : isStory ? 190 : 150;
  const qrY = contentTop + (isStory ? 330 : 265);
  const ctaY = qrY + qrSize + (isStory ? 92 : 70);
  const recommendY = height - (isStory ? 130 : 92);
  const secondary = "secondary" in copy ? copy.secondary : "";
  const serviceLines =
    template === "service"
      ? [
          ["Stay", "Airport Transfer"],
          ["Private Car", "Local Experiences"],
        ]
      : [];

  const travelHeader =
    template === "travel"
      ? `<rect width="${width}" height="${bodyTop + 28}" fill="#dfe8e1"/>
  <rect width="${width}" height="${bodyTop + 28}" fill="#23342f" opacity=".18"/>
  <path d="M0 ${bodyTop - 170} C220 ${bodyTop - 245} 405 ${bodyTop - 40} 615 ${bodyTop - 116} C790 ${bodyTop - 178} 930 ${bodyTop - 92} ${width} ${bodyTop - 145} L${width} ${bodyTop + 28} L0 ${bodyTop + 28} Z" fill="#f3efe6"/>
  <path d="M0 ${bodyTop - 92} C185 ${bodyTop - 142} 310 ${bodyTop - 42} 470 ${bodyTop - 80} C630 ${bodyTop - 118} 760 ${bodyTop - 40} ${width} ${bodyTop - 90} L${width} ${bodyTop + 28} L0 ${bodyTop + 28} Z" fill="#ffffff" opacity=".82"/>
  <rect x="70" y="70" width="${width - 140}" height="${bodyTop - 140}" rx="34" fill="#ffffff" opacity=".18"/>
  ${text({ x: width / 2, y: 190, value: "MALAYSIA", size: 74, weight: 800, fill: "#ffffff" })}
  ${text({ x: width / 2, y: 250, value: "MAD MAX", size: 32, weight: 800, fill: "#ffffff", spacing: 3 })}`
      : "";

  const minimalBrand =
    template !== "travel"
      ? `${text({ x: width / 2, y: brandY, value: "MAD MAX", size: isStory ? 78 : 62, weight: 800 })}
  ${text({ x: width / 2, y: brandY + 52, value: "MALAYSIA", size: isStory ? 31 : 25, weight: 700, fill: "#24745f", spacing: 4 })}`
      : "";

  const serviceGrid =
    serviceLines.length > 0
      ? `<g>
  <rect x="${width / 2 - 365}" y="${contentTop + 155}" width="730" height="${isStory ? 154 : 124}" rx="24" fill="#f4f7f5" stroke="#dde6e1"/>
  ${text({ x: width / 2 - 190, y: contentTop + 210, value: serviceLines[0][0], size: 32, weight: 800, fill: "#26333d" })}
  ${text({ x: width / 2 + 190, y: contentTop + 210, value: serviceLines[0][1], size: 32, weight: 800, fill: "#26333d" })}
  ${text({ x: width / 2 - 190, y: contentTop + 270, value: serviceLines[1][0], size: 32, weight: 800, fill: "#26333d" })}
  ${text({ x: width / 2 + 190, y: contentTop + 270, value: serviceLines[1][1], size: 32, weight: 800, fill: "#26333d" })}
</g>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#f6f2eb"/>
  ${travelHeader}
  <rect x="${isStory ? 70 : 58}" y="${template === "travel" ? bodyTop : isStory ? 92 : 70}" width="${width - (isStory ? 140 : 116)}" height="${height - (template === "travel" ? bodyTop + 72 : isStory ? 184 : 140)}" rx="34" fill="#ffffff" stroke="#ded8cf"/>
  ${minimalBrand}
  ${text({ x: width / 2, y: contentTop, value: copy.headline, size: isStory ? 54 : 45, weight: 800 })}
  ${secondary ? text({ x: width / 2, y: contentTop + 58, value: secondary, size: isStory ? 31 : 25, weight: 700, fill: "#56636b" }) : ""}
  ${text({ x: width / 2, y: contentTop + (secondary ? 112 : 72), value: copy.subtitle, size: isStory ? 30 : 25, weight: 600, fill: "#647079" })}
  ${serviceGrid}
  <rect x="${qrX - 26}" y="${qrY - 26}" width="${qrSize + 52}" height="${qrSize + 52}" rx="24" fill="#ffffff" stroke="#dfe6e3"/>
  <image href="${qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>
  ${text({ x: width / 2, y: ctaY, value: copy.cta, size: isStory ? 46 : 37, weight: 800 })}
  ${text({ x: width / 2, y: ctaY + (isStory ? 58 : 48), value: copy.support, size: isStory ? 28 : 22, weight: 600, fill: "#24745f" })}
  <line x1="${width / 2 - 210}" y1="${recommendY - 70}" x2="${width / 2 + 210}" y2="${recommendY - 70}" stroke="#e6e0d6" stroke-width="2"/>
  ${text({ x: width / 2, y: recommendY, value: `Recommended by ${referrerName}`, size: isStory ? 31 : 25, weight: 700, fill: "#6a747c" })}
</svg>`;
}
