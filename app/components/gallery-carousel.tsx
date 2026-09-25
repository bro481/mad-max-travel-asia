"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./gallery-carousel.css";

export function GalleryCarousel({
  images,
  alt,
  compact = false,
  preserveImageQuality = false,
  blurredBackdrop = false,
  activeIndex,
  onIndexChange,
  onImageClick,
}: {
  images: string[];
  alt: string;
  compact?: boolean;
  preserveImageQuality?: boolean;
  blurredBackdrop?: boolean;
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  onImageClick?: (index: number) => void;
}) {
  const clean = useMemo(() => images.filter(Boolean), [images]);
  const [internalIndex, setInternalIndex] = useState(0);
  const [lowResolution, setLowResolution] = useState(false);
  const start = useRef<number | null>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const multi = clean.length > 1;
  const imageKey = clean.join("\0");
  const index = Math.min(activeIndex ?? internalIndex, Math.max(clean.length - 1, 0));

  const setGalleryIndex = useCallback((nextIndex: number) => {
    if (!clean.length) return;
    const normalized = (nextIndex + clean.length) % clean.length;
    if (activeIndex === undefined) setInternalIndex(normalized);
    onIndexChange?.(normalized);
  }, [activeIndex, clean.length, onIndexChange]);

  const move = useCallback((step: number) => {
    if (!clean.length) return;
    setGalleryIndex(index + step);
  }, [clean.length, index, setGalleryIndex]);

  useEffect(() => {
    if (activeIndex === undefined) setInternalIndex(0);
    else onIndexChange?.(0);
    setLowResolution(false);
  // Reset only when the underlying image set changes.
  // Parent callbacks may be recreated during normal interaction and should not
  // snap the gallery back to the first image.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageKey]);

  useEffect(() => {
    const button = thumbnailRefs.current[index];
    button?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!multi) return;
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [imageKey, move, multi]);

  if (!clean.length) return <div className="gallery-carousel gallery-empty" />;

  return (
    <div
      className={`gallery-carousel${compact ? " compact-gallery-carousel" : ""}${blurredBackdrop ? " blurred-backdrop-gallery" : ""}${preserveImageQuality ? " preserve-image-quality" : ""}${lowResolution ? " has-low-resolution" : ""}`}
      onTouchStart={(e) => {
        start.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (start.current === null) return;
        const distance = e.changedTouches[0].clientX - start.current;
        if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1);
        start.current = null;
      }}
    >
      <div className="gallery-stage">
        {(compact || blurredBackdrop) && (
          <img
            key={`${clean[index]}-backdrop-${index}`}
            className="gallery-backdrop"
            src={clean[index]}
            alt=""
            aria-hidden="true"
          />
        )}
        <img
          key={`${clean[index]}-${index}`}
          className={preserveImageQuality && lowResolution ? "gallery-main-image low-resolution" : "gallery-main-image"}
          src={clean[index]}
          alt={`${alt} ${index + 1}`}
          onClick={() => onImageClick?.(index)}
          onLoad={(event) => {
            if (!preserveImageQuality) return;
            const image = event.currentTarget;
            const targetWidth = image.parentElement?.clientWidth || image.clientWidth;
            const targetHeight = image.parentElement?.clientHeight || image.clientHeight;
            setLowResolution(
              image.naturalWidth < targetWidth * 1.35 || image.naturalHeight < targetHeight * 1.35,
            );
          }}
        />
        {multi && (
          <>
            <button
              type="button"
              className="gallery-arrow previous"
              aria-label="上一张图片"
              onClick={() => move(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="gallery-arrow next"
              aria-label="下一张图片"
              onClick={() => move(1)}
            >
              ›
            </button>
            <span className="gallery-count">
              {index + 1} / {clean.length}
            </span>
          </>
        )}
      </div>
      {multi && (
        <div className="gallery-thumbnails">
          {clean.map((image, i) => (
            <button
              type="button"
              key={`${image}-${i}`}
              className={i === index ? "active" : ""}
              aria-label={`查看第 ${i + 1} 张图片`}
              ref={(node) => { thumbnailRefs.current[i] = node; }}
              onClick={() => setGalleryIndex(i)}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
      {multi && compact && (
        <div className="gallery-dots" aria-label="图片分页">
          {clean.map((image, i) => (
            <button
              type="button"
              key={`${image}-dot-${i}`}
              className={i === index ? "active" : ""}
              aria-label={`查看第 ${i + 1} 张图片`}
              onClick={() => setGalleryIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
