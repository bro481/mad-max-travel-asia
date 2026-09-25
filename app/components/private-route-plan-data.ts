import type { ServiceItem, ServiceRouteNode, ServiceRoutePlan } from "../../db/service-items";
import type {
  PrivateRouteDetailData,
  PrivateRouteDetailStop,
} from "./private-route-detail-modal";

const textPair = (
  zh?: string,
  en?: string,
  fallback = "",
): [string, string] => [zh || fallback, en || zh || fallback];

const routePlanTitle = (route: ServiceRoutePlan, fallback: string) =>
  route.nameZh || route.name || fallback;

const routePlanDescription = (route: ServiceRoutePlan, fallback: string) =>
  route.descriptionZh || route.description || fallback;

const routePlanTags = (route: ServiceRoutePlan) => {
  const tags = route.tags?.length
    ? route.tags
    : [route.duration, route.tag].filter(Boolean);
  return tags.filter(Boolean).slice(0, 3).map((tag) => [tag, tag] as [string, string]);
};

const routePlanNodes = (route: ServiceRoutePlan): PrivateRouteDetailStop[] => {
  const nodes = route.nodes?.length
    ? route.nodes
    : (route.stops || "")
        .split(/[·、,，]/)
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({ nameZh: name } as ServiceRouteNode));

  return nodes.map((node, index) => ({
    title: textPair(node.nameZh || node.title, node.nameEn, `路线节点 ${index + 1}`),
    note: textPair(
      node.descriptionZh || node.description,
      node.descriptionEn,
      index === 0 ? "从酒店或约定地点出发" : "可根据当天时间灵活调整停留",
    ),
    time: node.stayTime || node.time || "",
    image: node.image || "",
  }));
};

const isLegacyPlaceholderImage = (image?: string) =>
  Boolean(image && /images\.unsplash\.com/.test(image));

const firstRouteNodeImage = (route: ServiceRoutePlan) =>
  route.nodes?.map((node) => node.image).find(Boolean) || "";

export function routePlanToPrivateRoute(
  route: ServiceRoutePlan,
  service: ServiceItem,
  index: number,
): PrivateRouteDetailData {
  const titleZh = routePlanTitle(route, `${service.city}推荐路线 ${index + 1}`);
  const descZh = routePlanDescription(route, "路线仅作参考，可根据您的时间与兴趣灵活调整。");
  const routeKey = route.name || route.nameZh || titleZh;
  return {
    routeId: `${service.slug || service.city}-${routeKey}-${index + 1}`
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-|-$/g, ""),
    title: textPair(titleZh, route.nameEn, titleZh),
    desc: textPair(descZh, route.descriptionEn, descZh),
    duration: textPair(route.duration || "时间灵活", route.duration || "Flexible duration"),
    tags: routePlanTags(route),
    image:
      route.coverImage ||
      (isLegacyPlaceholderImage(route.image) ? firstRouteNodeImage(route) : route.image) ||
      firstRouteNodeImage(route),
    stops: routePlanNodes(route),
  };
}
