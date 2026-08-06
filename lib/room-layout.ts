const chineseNumber: Record<string, number> = {
  "一": 1,
  "二": 2,
  "两": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
};

function readCount(title: string, kind: "bedroom" | "bathroom") {
  const token = kind === "bedroom" ? "(?:室|房|卧室)" : "(?:卫|浴|浴室|卫生间)";
  const chinese = title.match(new RegExp(`([一二两三四五六\\d]+)\\s*${token}`, "i"));
  if (chinese) return Number(chinese[1]) || chineseNumber[chinese[1]] || 0;
  const english = title.match(
    new RegExp(`(\\d+)\\s*[- ]?(?:${kind === "bedroom" ? "bed(?:room)?s?|br" : "bath(?:room)?s?"})`, "i"),
  );
  return english ? Number(english[1]) : 0;
}

export function inferRoomCounts(titleZh: string, titleEn = "", bedrooms = 0, bathrooms = 0) {
  const title = `${titleZh} ${titleEn}`;
  const bedroomCount = readCount(title, "bedroom") || bedrooms || 1;
  const bathroomCount = readCount(title, "bathroom") || bathrooms || 1;
  return {
    bedrooms: bedroomCount,
    bathrooms: bedroomCount === 3 && bathroomCount === 2 ? 3 : bathroomCount,
  };
}

export function roomLayoutKey(bedrooms: number, bathrooms: number) {
  return `${bedrooms}-${bathrooms}`;
}

export function roomLayoutLabel(bedrooms: number, bathrooms: number, lang: "zh" | "en") {
  return lang === "zh" ? `${bedrooms}室${bathrooms}卫` : `${bedrooms} bed · ${bathrooms} bath`;
}
