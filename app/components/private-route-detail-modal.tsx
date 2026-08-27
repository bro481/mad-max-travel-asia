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
        <div className="modal-gallery experience-gallery">
          {images.length ? (
            <GalleryCarousel images={images} alt={route.title[languageIndex]} compact />
          ) : (
            <div className="private-route-no-image">{lang === "zh" ? "暂未设置路线图片" : "No route images yet"}</div>
          )}
        </div>
        <div className="modal-route experience-modal-route">
          <p className="eyebrow">MAD MAX · ROUTE PLAN</p>
          <h2>{route.title[languageIndex]}</h2>
          <p className="quick-modal-desc experience-route-lead">{route.desc[languageIndex]}</p>
          <div className="modal-tags">
            <span>{route.duration[languageIndex]}</span>
            {route.tags.map((tag) => (
              <span key={tag[0]}>{tag[languageIndex]}</span>
            ))}
          </div>
          <p className="modal-itinerary-title">{lang === "zh" ? "路线节点" : "Route stops"}</p>
          <div className="timeline experience-timeline private-route-timeline">
            {route.stops.map((stop, index) => (
              <div
                className={focusStopIndex === index ? "preview-focused-stop" : ""}
                key={`${stop.title[0]}-${index}`}
                ref={(element) => {
                  stopRefs.current[index] = element;
                }}
              >
                <time>{String(index + 1).padStart(2, "0")}</time>
                <i />
                <p>
                  <b>{stop.title[languageIndex]}</b>
                  <small>
                    {[stop.type, stop.time, stop.note[languageIndex]].filter(Boolean).join(" · ")}
                  </small>
                </p>
                {stop.image ? <img src={stop.image} alt="" /> : <span className="private-route-stop-no-image">暂无图片</span>}
              </div>
            ))}
          </div>
          <p className="modal-flex-note">
            {lang === "zh"
              ? "这条路线可作为参考，也可以根据兴趣、天气和时间现场调整。"
              : "This route is a reference and can be adjusted around your interests, weather and time."}
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
