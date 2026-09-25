import { withPublicDataTimeout } from "./public-data-timeout";
import type { CustomerShareContent, CustomerShareProductType } from "../db/customer-shares";
import { getPublishedPropertyBySlug, propertyToRoom, staticPropertyRecords } from "../db/properties";
import { getServiceItemBySlug, staticServiceItemRecords, type ServiceItem, type ServiceRoutePlan } from "../db/service-items";
import { getTravelPackage, staticTravelPackages } from "../db/packages";

export const PUBLIC_ORIGIN = "https://www.madmaxtravel.asia";

function absoluteUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${PUBLIC_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function imageFrom(values: Array<string | undefined | null>) {
  return absoluteUrl(compact(values)[0] || "/og.png");
}

export async function resolveCustomerShareContent(type: CustomerShareProductType, id: string): Promise<CustomerShareContent | null> {
  if (type === "stay") return resolveStay(id);
  if (type === "service") return resolveService(id);
  if (type === "route") return resolveRoute(id);
  if (type === "package") return resolvePackage(id);
  return null;
}

async function resolveStay(slug: string): Promise<CustomerShareContent | null> {
  const fallback = () => staticPropertyRecords().find((item) => item.slug === slug) || null;
  const property = await withPublicDataTimeout(getPublishedPropertyBySlug(slug), fallback, `Customer share property: ${slug}`);
  if (!property) return null;
  const room = propertyToRoom(property);
  const layout = room.spaceConfig?.layout || `${room.bedrooms}房${room.bathrooms}卫`;
  const subtitle = compact([layout, room.area.zh, room.location.zh]).join(" · ");
  return {
    type: "stay",
    id: slug,
    slug,
    title: room.name.zh,
    subtitle,
    description: room.description.zh,
    image: imageFrom(room.images),
    url: `${PUBLIC_ORIGIN}/rooms/${encodeURIComponent(slug)}`,
    priceLabel: room.priceFrom ? `RM ${room.priceFrom} / 晚起` : "价格请咨询",
    highlights: compact([
      `${room.bedrooms}房${room.bathrooms}卫`,
      room.area.zh,
      `最多${room.guests}人`,
      ...room.amenities.slice(0, 4).map((item) => item.name.zh),
    ]).slice(0, 6),
    gallery: room.images.map(absoluteUrl).slice(0, 8),
    details: [
      { label: "房型", value: layout },
      { label: "入住人数", value: `最多 ${room.guests} 位` },
      { label: "位置", value: `${room.location.zh} · ${room.area.zh}` },
      { label: "公开价格", value: room.priceFrom ? `RM ${room.priceFrom} / 晚起` : "请咨询" },
    ],
    ctaLabel: "咨询这个房型",
  };
}

async function serviceBySlug(slug: string) {
  return withPublicDataTimeout(
    getServiceItemBySlug(slug),
    () => staticServiceItemRecords().find((item) => item.slug === slug && item.status === "published") || null,
    `Customer share service: ${slug}`,
  );
}

function serviceHeroImage(service: ServiceItem) {
  const routeImage = service.routes
    .map((route) => route.coverImage || route.image || route.nodes?.find((node) => node.image)?.image || "")
    .find(Boolean);
  return imageFrom([service.coverImage, service.images[0], service.gallery?.[0], routeImage]);
}

function serviceHighlights(service: ServiceItem) {
  return compact([
    service.subtitleZh,
    service.city,
    service.category,
    ...service.tags,
    service.price ? `RM ${service.price} ${service.priceUnit}` : "",
  ]).slice(0, 6);
}

async function resolveService(slug: string): Promise<CustomerShareContent | null> {
  const service = await serviceBySlug(slug);
  if (!service) return null;
  return {
    type: "service",
    id: slug,
    slug,
    title: service.nameZh,
    subtitle: compact([service.subtitleZh, service.city]).join(" · "),
    description: service.introZh || "告诉我们日期、人数和大概路线，我们帮你确认合适安排。",
    image: serviceHeroImage(service),
    url: `${PUBLIC_ORIGIN}/services/item/${encodeURIComponent(slug)}`,
    priceLabel: service.price ? `RM ${service.price} / ${service.priceUnit}` : service.priceMode || "咨询报价",
    highlights: serviceHighlights(service),
    gallery: compact([service.coverImage, ...service.images, ...(service.gallery || [])]).map(absoluteUrl).slice(0, 8),
    details: [
      { label: "目的地", value: service.city },
      { label: "服务类型", value: service.type },
      { label: "服务范围", value: service.subtitleZh || service.category },
      { label: "公开价格", value: service.price ? `RM ${service.price} / ${service.priceUnit}` : service.priceMode || "请咨询" },
    ],
    ctaLabel: service.type === "私人包车" ? "咨询这个包车" : service.type === "交通接送" ? "咨询这个接送" : "咨询这个体验",
  };
}

function routeTitle(route: ServiceRoutePlan) {
  return route.nameZh || route.name || "路线方案";
}

async function resolveRoute(id: string): Promise<CustomerShareContent | null> {
  const [slug, routeIndexRaw] = id.split(":");
  const service = await serviceBySlug(slug);
  if (!service) return null;
  const routeIndex = Number(routeIndexRaw || 0);
  const visibleRoutes = service.routes.filter((route) => route.visible !== false);
  const route = visibleRoutes[Number.isFinite(routeIndex) ? routeIndex : 0];
  if (!route) return null;
  const image = route.coverImage || route.image || route.nodes?.find((node) => node.image)?.image || serviceHeroImage(service);
  const stops = route.nodes?.map((node) => node.nameZh || node.title).filter(Boolean).join(" · ") || route.stops || "";
  return {
    type: "route",
    id,
    slug: `${slug}-${routeIndex}`,
    title: routeTitle(route),
    subtitle: compact([route.duration, route.tags?.[0] || route.tag, service.city]).join(" · "),
    description: route.descriptionZh || route.description || service.introZh || "",
    image: imageFrom([image]),
    url: `${PUBLIC_ORIGIN}/services/item/${encodeURIComponent(slug)}?route=${routeIndex}`,
    priceLabel: service.price ? `RM ${service.price} / ${service.priceUnit}` : service.priceMode || "咨询报价",
    highlights: compact([route.duration, ...(route.tags || []), stops]).slice(0, 6),
    gallery: compact([image, ...(route.nodes || []).map((node) => node.image), ...service.images]).map(absoluteUrl).slice(0, 8),
    details: [
      { label: "路线", value: routeTitle(route) },
      { label: "时长", value: route.duration || "按当天安排" },
      { label: "停靠点", value: stops || "可按兴趣调整" },
      { label: "所属服务", value: service.nameZh },
    ],
    ctaLabel: "咨询这个路线",
  };
}

async function resolvePackage(slug: string): Promise<CustomerShareContent | null> {
  const fallback = () => staticTravelPackages().find((item) => item.slug === slug) || null;
  const item = await withPublicDataTimeout(getTravelPackage(slug), fallback, `Customer share package: ${slug}`);
  if (!item) return null;
  return {
    type: "package",
    id: slug,
    slug,
    title: item.nameZh,
    subtitle: compact([`${item.days}天${item.nights}晚`, item.cityComboZh]).join(" · "),
    description: item.summaryZh || item.heroTextZh || "",
    image: imageFrom([item.coverImage, item.galleryImages[0]]),
    url: `${PUBLIC_ORIGIN}/packages/${encodeURIComponent(slug)}`,
    priceLabel: item.startingPrice ? `RM ${item.startingPrice} 起` : "套餐价格请咨询",
    highlights: compact([`${item.days}天${item.nights}晚`, item.cityComboZh, ...item.tags]).slice(0, 6),
    gallery: compact([item.coverImage, ...item.galleryImages]).map(absoluteUrl).slice(0, 8),
    details: [
      { label: "天数", value: `${item.days}天${item.nights}晚` },
      { label: "城市", value: item.cityComboZh },
      { label: "公开价格", value: item.startingPrice ? `RM ${item.startingPrice} 起` : "请咨询" },
    ],
    ctaLabel: "咨询这个套餐",
  };
}
