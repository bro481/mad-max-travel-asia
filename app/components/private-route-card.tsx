"use client";

import { NativeShareButton } from "./native-share-button";

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
  share,
}: {
  route: PrivateRouteCardData;
  lang?: "zh" | "en";
  onOpen?: () => void;
  share?: {
    title: string;
    text?: string;
    url: string;
  };
}) {
  const l = lang === "zh" ? 0 : 1;
  const stopNames = route.stops?.map((stop) => stop.title[l]).filter(Boolean) ?? [];
  const travelStops = stopNames.filter((name) => !/酒店|接送|返回|hotel|pickup|return/i.test(name));
  const featuredStops = (travelStops.length ? travelStops : stopNames).slice(0, 4);
  const stopCount = (travelStops.length || stopNames.length);
  const card = (
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
        {featuredStops.length ? (
          <small className="route-card-stops">
            {featuredStops.join(" · ")}
            {stopCount > featuredStops.length ? "……" : ""}
          </small>
        ) : (
          <small className="route-card-summary">{route.summary[l]}</small>
        )}
        <b>{lang === "zh" ? "查看完整路线" : "View full route"} →</b>
      </div>
    </button>
  );
  if (!share) return card;
  return (
    <div className="route-card-shell">
      <NativeShareButton className="route-card-share-button" title={share.title} text={share.text} url={share.url} aria-label={`${share.title} 分享`}>
        ↗
      </NativeShareButton>
      {card}
    </div>
  );
}
