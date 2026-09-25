"use client";

export type PrivateRouteCardData = {
  title: [string, string];
  duration: [string, string];
  summary: [string, string];
  tags: Array<[string, string]>;
  image: string;
  stops?: Array<{
    title: [string, string];
  }>;
};

export function PrivateRouteCard({
  route,
  lang = "zh",
  onOpen,
}: {
  route: PrivateRouteCardData;
  lang?: "zh" | "en";
  onOpen?: () => void;
}) {
  const l = lang === "zh" ? 0 : 1;
  const stopNames = route.stops?.map((stop) => stop.title[l]).filter(Boolean) ?? [];
  const featuredStops = stopNames.slice(1, 5);
  const extraStops = Math.max(0, stopNames.length - featuredStops.length - 1);
  return (
    <button className="route-card" type="button" onClick={onOpen}>
      <div className="route-card-media">
        {route.image ? <img src={route.image} alt={route.title[l]} loading="lazy" decoding="async" /> : <span>暂无路线封面</span>}
      </div>
      <div className="route-card-body">
        <h3>{route.title[l]}</h3>
        <p>
          <span>{route.duration[l]}</span>
          {route.tags[0]?.[l] ? <span>{route.tags[0][l]}</span> : null}
        </p>
        <small>{route.summary[l]}</small>
        {featuredStops.length ? (
          <small className="route-card-stops">{featuredStops.join(" · ")}</small>
        ) : null}
        <div className="route-card-footer">
          <em>{extraStops > 0 ? (lang === "zh" ? `+ ${extraStops} 个停靠点` : `+ ${extraStops} stops`) : ""}</em>
          <b>{lang === "zh" ? "查看完整路线" : "Full route"} →</b>
        </div>
      </div>
    </button>
  );
}
