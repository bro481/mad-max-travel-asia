"use client";

import type { PrivateRouteDetailData } from "./private-route-detail-modal";

export function PrivateRoutePlanCard({
  route,
  lang = "zh",
  onOpen,
}: {
  route: PrivateRouteDetailData;
  lang?: "zh" | "en";
  onOpen: () => void;
}) {
  const languageIndex = lang === "zh" ? 0 : 1;

  return (
    <article>
      <img src={route.image} alt="" />
      <div>
        <div>
          <span>{route.duration[languageIndex]}</span>
          {route.tags[0] ? <span>{route.tags[0][languageIndex]}</span> : null}
        </div>
        <h4>{route.title[languageIndex]}</h4>
        <p>{route.desc[languageIndex]}</p>
        <button type="button" onClick={onOpen}>
          {lang === "zh" ? "查看路线 →" : "View route →"}
        </button>
      </div>
    </article>
  );
}
