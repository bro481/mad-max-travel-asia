export type TravelGuideStatus = "draft" | "published";
export type TravelGuideCity = "kuala-lumpur" | "kota-kinabalu" | "semporna" | "melaka";
export type TravelGuideCategory = "城市漫游" | "行程参考" | "美食推荐" | "住宿推荐" | "购物指南";

export type TravelGuideBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; image: string; caption?: string }
  | { type: "gallery"; images: string[]; caption?: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "divider" };

export type TravelGuideSettings = {
  heroImage: string;
  heroTitleZh: string;
  heroTitleEn: string;
  heroDescriptionZh: string;
  heroDescriptionEn: string;
  heroScript: string;
};

export type TravelGuideArticle = {
  id: number;
  slug: string;
  titleZh: string;
  titleEn: string;
  city: TravelGuideCity;
  category: TravelGuideCategory;
  summaryZh: string;
  summaryEn: string;
  coverImage: string;
  imageLabel: string;
  readMinutes: number;
  sortOrder: number;
  featured: boolean;
  status: TravelGuideStatus;
  contentBlocks: TravelGuideBlock[];
  updatedAt: string;
};

export const guideCities = [
  { key: "kuala-lumpur", zh: "吉隆坡", en: "Kuala Lumpur" },
  { key: "kota-kinabalu", zh: "亚庇", en: "Kota Kinabalu" },
  { key: "semporna", zh: "仙本那", en: "Semporna" },
  { key: "melaka", zh: "马六甲", en: "Melaka" },
] as const;

export const guideCategories: TravelGuideCategory[] = ["城市漫游", "行程参考", "美食推荐", "住宿推荐", "购物指南"];

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=86`;

export const defaultGuideSettings: TravelGuideSettings = {
  heroImage: image("photo-1596422846543-75c6fc197f07"),
  heroTitleZh: "旅行攻略",
  heroTitleEn: "TRAVEL GUIDE",
  heroDescriptionZh: "用更慢的节奏，遇见更真实的马来西亚。",
  heroDescriptionEn: "Meet the real Malaysia at a slower pace.",
  heroScript: "More\nThan a Trip",
};
