"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GalleryCarousel } from "./gallery-carousel";

export type PrivateRouteDetailStop = {
  title: [string, string];
  note: [string, string];
  image: string;
  time?: string;
  type?: string;
};

export type PrivateRouteDetailData = {
  routeId?: string;
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
  const stopRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [highlightedStop, setHighlightedStop] = useState<number | null>(focusStopIndex ?? null);
  const imageItems = [
    ...(route.image ? [{ image: route.image, stopIndex: null as number | null }] : []),
    ...route.stops.flatMap((stop, index) => stop.image ? [{ image: stop.image, stopIndex: index }] : []),
  ];
  const images = imageItems.map((item) => item.image);

  const highlightStop = useCallback((stopIndex: number, shouldScroll = true) => {
    if (stopIndex < 0 || stopIndex >= route.stops.length) return;
    setHighlightedStop(stopIndex);
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightedStop(null), 1800);
    if (!shouldScroll) return;
    requestAnimationFrame(() => {
      stopRefs.current[stopIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [route.stops.length]);

  useEffect(() => {
    if (focusStopIndex === null || focusStopIndex === undefined) return;
    highlightStop(focusStopIndex);
  }, [focusStopIndex, highlightStop]);

  useEffect(() => () => {
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
  }, []);

  const handleGalleryIndexChange = (nextIndex: number) => {
    setGalleryIndex(nextIndex);
    const stopIndex = imageItems[nextIndex]?.stopIndex;
    if (stopIndex !== null && stopIndex !== undefined) highlightStop(stopIndex);
  };

  const openStopInGallery = (stopIndex: number) => {
    const mappedIndex = imageItems.findIndex((item) => item.stopIndex === stopIndex);
    const nextIndex = mappedIndex >= 0 ? mappedIndex : Math.min(stopIndex + 1, Math.max(images.length - 1, 0));
    setGalleryIndex(nextIndex);
    highlightStop(stopIndex, false);
    requestAnimationFrame(() => {
      galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

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
        <div className="modal-gallery experience-gallery" ref={galleryRef}>
          {images.length ? (
            <GalleryCarousel
              images={images}
              alt={route.title[languageIndex]}
              blurredBackdrop
              activeIndex={galleryIndex}
              onIndexChange={handleGalleryIndexChange}
              onImageClick={(imageIndex) => {
                const stopIndex = imageItems[imageIndex]?.stopIndex;
                if (stopIndex !== null && stopIndex !== undefined) highlightStop(stopIndex);
              }}
            />
          ) : (
            <div className="private-route-no-image">{lang === "zh" ? "暂未设置路线图片" : "No route images yet"}</div>
          )}
        </div>
        <div className="modal-route experience-modal-route private-route-itinerary-panel">
          <p className="modal-itinerary-title">
            {lang === "zh" ? "路线概览" : "Route overview"}
          </p>
          <p className="private-route-itinerary-intro">
            {lang === "zh"
              ? "以下为参考顺序，实际行程可根据出发时间、交通及个人偏好灵活调整。"
              : "The order below is a reference and can be adjusted around pickup time, traffic and preferences."}
          </p>
          <div className="timeline experience-timeline private-route-timeline">
            {route.stops.map((stop, index) => (
              <button
                type="button"
                className={highlightedStop === index ? "preview-focused-stop" : ""}
                key={`${stop.title[0]}-${index}`}
                ref={(element) => {
                  stopRefs.current[index] = element;
                }}
                onClick={() => openStopInGallery(index)}
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
              </button>
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
          <p className="private-route-adjust-note">
            {lang === "zh"
              ? "行程顺序及停留时间会根据当天交通、景点开放情况及个人喜好灵活调整。"
              : "The final order and stay time can be adjusted around traffic, opening hours and personal preferences."}
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
