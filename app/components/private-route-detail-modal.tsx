"use client";

import { useEffect, useRef } from "react";
import { GalleryCarousel } from "./gallery-carousel";

export type PrivateRouteDetailStop = {
  title: [string, string];
  note: [string, string];
  image: string;
  time?: string;
  type?: string;
};

export type PrivateRouteDetailData = {
  title: [string, string];
  desc: [string, string];
  duration: [string, string];
  tags: Array<[string, string]>;
  image: string;
  stops: PrivateRouteDetailStop[];
};

function stopMeta(stop: PrivateRouteDetailStop, lang: "zh" | "en", index: number) {
  const languageIndex = lang === "zh" ? 0 : 1;
  if (index === 0 && /酒店|接送|出发|pickup|hotel/i.test(stop.title[languageIndex])) {
    return lang === "zh" ? "出发" : "Start";
  }
  return stop.time || (index === 0 ? (lang === "zh" ? "出发" : "Start") : String(index).padStart(2, "0"));
}

function stopTypeLabel(stop: PrivateRouteDetailStop, lang: "zh" | "en", index: number) {
  const title = stop.title[lang === "zh" ? 0 : 1];
  if (index === 0 && /酒店|接送|出发|pickup|hotel/i.test(title)) {
    return lang === "zh" ? "服务节点" : "Service";
  }
  return lang === "zh" ? "游览节点" : "Stop";
}

export function PrivateRouteDetailModal({
  route,
  lang = "zh",
  focusStopIndex,
  onClose,
  onInquire,
}: {
  route: PrivateRouteDetailData;
  lang?: "zh" | "en";
  focusStopIndex?: number | null;
  onClose: () => void;
  onInquire?: () => void;
}) {
  const languageIndex = lang === "zh" ? 0 : 1;
  const stopRefs = useRef<Array<HTMLDivElement | null>>([]);
  const images = [route.image, ...route.stops.map((stop) => stop.image)].filter(Boolean);

  useEffect(() => {
    if (focusStopIndex === null || focusStopIndex === undefined) return;
    requestAnimationFrame(() => {
      stopRefs.current[focusStopIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [focusStopIndex]);

  return (
    <div
      className="route-modal private-route-detail-modal"
      role="dialog"
      aria-modal="true"
      aria-label={route.title[languageIndex]}
      onClick={onClose}
    >
      <div onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={lang === "zh" ? "关闭" : "Close"}>
          ×
        </button>
        <div className="modal-route experience-modal-route">
          <p className="eyebrow">MAD MAX · PRIVATE ROUTE</p>
          <h2>{route.title[languageIndex]}</h2>
          <p className="quick-modal-desc experience-route-lead">{route.desc[languageIndex]}</p>
          <div className="modal-tags">
            <span>{route.duration[languageIndex]}</span>
            {route.tags.map((tag) => (
              <span key={tag[0]}>{tag[languageIndex]}</span>
            ))}
          </div>
          <p className="private-route-service-line">
            {lang === "zh" ? "酒店接送 · 私人用车 · 行程可调整" : "Hotel pickup · Private vehicle · Flexible route"}
          </p>
        </div>
        <div className="modal-gallery experience-gallery">
          {images.length ? (
            <GalleryCarousel images={images} alt={route.title[languageIndex]} blurredBackdrop />
          ) : (
            <div className="private-route-no-image">{lang === "zh" ? "暂未设置路线图片" : "No route images yet"}</div>
          )}
        </div>
        <div className="modal-route experience-modal-route private-route-itinerary-panel">
          <p className="modal-itinerary-title">
            {lang === "zh"
              ? `建议行程 · ${route.duration[0]}`
              : `Suggested route · ${route.duration[1]}`}
          </p>
          <p className="private-route-itinerary-intro">
            {lang === "zh"
              ? "以下为参考顺序，实际行程可根据出发时间、交通及个人偏好灵活调整。"
              : "The order below is a reference and can be adjusted around pickup time, traffic and preferences."}
          </p>
          <div className="timeline experience-timeline private-route-timeline">
            {route.stops.map((stop, index) => (
              <div
                className={focusStopIndex === index ? "preview-focused-stop" : ""}
                key={`${stop.title[0]}-${index}`}
                ref={(element) => {
                  stopRefs.current[index] = element;
                }}
              >
                <time>{stopMeta(stop, lang, index)}</time>
                <i />
                <p>
                  <b>{stop.title[languageIndex]}</b>
                  <small>
                    {[stop.type || stopTypeLabel(stop, lang, index), index === 0 ? "" : stop.time, stop.note[languageIndex]].filter(Boolean).join(" · ")}
                  </small>
                </p>
                {stop.image ? <img src={stop.image} alt="" /> : <span className="private-route-stop-no-image">暂无图片</span>}
              </div>
            ))}
          </div>
          <p className="modal-best-for private-route-best-for">
            <b>{lang === "zh" ? "适合" : "Best for"}</b>
            <span>
              {lang === "zh"
                ? "第一次来吉隆坡 / 想一天看主要地标 / 家庭或朋友同行"
                : "First-time visitors / City landmarks in one day / Families or friends"}
            </span>
          </p>
          <p className="modal-flex-note private-route-price-note">
            {lang === "zh"
              ? "价格根据日期、人数、车型和住宿位置确认。"
              : "Pricing is confirmed by date, group size, vehicle and pickup location."}
          </p>
          {onInquire ? (
            <button className="button" type="button" onClick={onInquire}>
              {lang === "zh" ? "咨询这条路线" : "Ask about this route"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
