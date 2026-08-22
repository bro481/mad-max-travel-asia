import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ServiceCategory } from "../../../../db/services";
import { serviceCategorySeeds } from "../../../../db/services";

const storePath = join(process.cwd(), ".local-preview", "service-categories.json");

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "category";
}

function seededItems(): ServiceCategory[] {
  return serviceCategorySeeds.map((seed, index) => ({
    id: index + 1,
    slug: seed[0],
    nameZh: seed[1],
    nameEn: seed[2],
    introZh: seed[3],
    introEn: seed[4],
    descriptionZh: seed[5],
    descriptionEn: seed[6],
    image: seed[7],
    itemsZh: [...seed[8]],
    itemsEn: [...seed[9]],
    icon: seed[10],
    sortOrder: seed[11],
    visible: true,
    updatedAt: new Date().toISOString(),
  }));
}

function normalize(item: Partial<ServiceCategory>, fallbackId = 1): ServiceCategory {
  const nameZh = String(item.nameZh || "新展示分类");
  const nameEn = String(item.nameEn || nameZh);
  return {
    id: Number(item.id || fallbackId),
    slug: String(item.slug || slugify(nameEn || nameZh)),
    nameZh,
    nameEn,
    introZh: String(item.introZh || ""),
    introEn: String(item.introEn || ""),
    descriptionZh: String(item.descriptionZh || ""),
    descriptionEn: String(item.descriptionEn || ""),
    image: String(item.image || ""),
    itemsZh: Array.isArray(item.itemsZh) ? item.itemsZh : [],
    itemsEn: Array.isArray(item.itemsEn) ? item.itemsEn : [],
    icon: String(item.icon || "✦"),
    sortOrder: Number(item.sortOrder || 99),
    visible: item.visible !== false,
    updatedAt: String(item.updatedAt || new Date().toISOString()),
  };
}

function loadItems(): ServiceCategory[] {
  if (!existsSync(storePath)) return seededItems();
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8"));
    if (!Array.isArray(parsed)) return seededItems();
    return parsed.map((item, index) => normalize(item, index + 1));
  } catch {
    return seededItems();
  }
}

function saveItems() {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(items, null, 2));
}

let items = loadItems();

export function useLocalServiceCategories() {
  return process.env.NODE_ENV === "development";
}

export function listLocalServiceCategories() {
  items = loadItems();
  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export function createLocalServiceCategory(input: Partial<ServiceCategory>) {
  const id = Math.max(0, ...items.map((item) => item.id)) + 1;
  const base = normalize({ ...input, id }, id);
  let slug = base.slug;
  let n = 1;
  while (items.some((item) => item.slug === slug)) slug = `${base.slug}-${++n}`;
  const next = { ...base, slug, updatedAt: new Date().toISOString() };
  items = [...items, next];
  saveItems();
  return next;
}

export function updateLocalServiceCategory(id: number, input: Partial<ServiceCategory>) {
  const current = items.find((item) => item.id === id);
  if (!current) return null;
  const next = normalize({ ...current, ...input, id, updatedAt: new Date().toISOString() }, id);
  items = items.map((item) => (item.id === id ? next : item));
  saveItems();
  return next;
}

export function deleteLocalServiceCategory(id: number) {
  items = items.filter((item) => item.id !== id);
  saveItems();
}
