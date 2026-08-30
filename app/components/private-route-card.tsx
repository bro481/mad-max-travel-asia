"use client";

export type PrivateRouteCardData = {
  title: [string, string];
  duration: [string, string];
  summary: [string, string];
  tags: Array<[string, string]>;
  image: string;
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
  return (
    <button className="route-card" type="button" onClick={onOpen}>
      <div className="route-card-media">
        {route.image ? <img src={route.image} alt={route.title[l]} /> : <span>暂无路线封面</span>}
      </div>
      <div className="route-card-body">
        <h3>{route.title[l]}</h3>
        <p>
          <span>{route.duration[l]}</span>
          {route.tags[0]?.[l] ? <span>{route.tags[0][l]}</span> : null}
        </p>
        <div className="route-card-footer">
          <small>{route.summary[l]}</small>
          <b>{lang === "zh" ? "查看路线" : "View route"} →</b>
        </div>
      </div>
    </button>
  );
}
