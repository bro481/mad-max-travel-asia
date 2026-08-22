import type { DestinationInput, DestinationRecord } from "../../../../db/destinations";
import { slugifyDestination, staticDestinations } from "../../../../db/destinations";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const storePath = join(process.cwd(), ".local-preview", "destinations.json");

function seededItems(): DestinationRecord[] {
  return staticDestinations.map((item) => ({
    ...item,
    updatedAt: item.updatedAt || new Date().toISOString(),
  }));
}

function loadItems(): DestinationRecord[] {
  if (!existsSync(storePath)) return seededItems();
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8"));
    if (!Array.isArray(parsed)) return seededItems();
    return parsed.map((item) => ({
      ...item,
      id: Number(item.id),
      nameZh: String(item.nameZh || "未命名目的地"),
      nameEn: String(item.nameEn || item.nameZh || "Destination"),
      slug: String(item.slug || slugifyDestination(item.nameEn || item.nameZh || "destination")),
      introZh: String(item.introZh || ""),
      introEn: String(item.introEn || ""),
      useForProperties: item.useForProperties !== false,
      useForServices: item.useForServices !== false,
      propertySort: Number(item.propertySort || 99),
      serviceSort: Number(item.serviceSort || 99),
      onlyShowWithContent: item.onlyShowWithContent !== false,
      status: item.status === "hidden" ? "hidden" : "visible",
      updatedAt: String(item.updatedAt || new Date().toISOString()),
    }));
  } catch {
    return seededItems();
  }
}

function saveItems() {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(items, null, 2));
}

let items: DestinationRecord[] = loadItems();

export function useLocalDestinations() {
  return process.env.NODE_ENV === "development";
}

export function listLocalDestinations() {
  items = loadItems();
  return items;
}

export function createLocalDestination(input: DestinationInput) {
  const id = Math.max(0, ...items.map((item) => item.id)) + 1;
  const nameZh = String(input.nameZh || "新目的地").trim();
  const nameEn = String(input.nameEn || nameZh).trim();
  const base = slugifyDestination(String(input.slug || nameEn || nameZh));
  let slug = base;
  let n = 1;
  while (items.some((item) => item.slug === slug)) slug = `${base}-${++n}`;
  const next: DestinationRecord = {
    id,
    slug,
    nameZh,
    nameEn,
    introZh: String(input.introZh || ""),
    introEn: String(input.introEn || ""),
    useForProperties: input.useForProperties !== false,
    useForServices: input.useForServices !== false,
    propertySort: Number(input.propertySort || 99),
    serviceSort: Number(input.serviceSort || 99),
    onlyShowWithContent: input.onlyShowWithContent !== false,
    status: input.status === "hidden" ? "hidden" : "visible",
    updatedAt: new Date().toISOString(),
  };
  items = [...items, next];
  saveItems();
  return next;
}

export function updateLocalDestination(id: number, input: DestinationInput) {
  const current = items.find((item) => item.id === id);
  if (!current) return null;
  const next: DestinationRecord = {
    ...current,
    ...input,
    slug: input.slug ? slugifyDestination(input.slug) : current.slug,
    updatedAt: new Date().toISOString(),
  };
  items = items.map((item) => (item.id === id ? next : item));
  saveItems();
  return next;
}

export function deleteLocalDestination(id: number) {
  items = items.filter((item) => item.id !== id);
  saveItems();
}
