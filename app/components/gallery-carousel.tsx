"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./gallery-carousel.css";

export function GalleryCarousel({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const clean = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);
  const start = useRef<number | null>(null);
  const multi = clean.length > 1;
  const imageKey = clean.join("\0");

  const move = useCallback((step: number) => {
    if (!clean.length) return;
    setIndex((current) => (current + step + clean.length) % clean.length);
  }, [clean.length]);

  useEffect(() => {
    setIndex(0);
  }, [imageKey]);

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
      className="gallery-carousel"
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
        <img src={clean[index]} alt={`${alt} ${index + 1}`} />
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
              onClick={() => setIndex(i)}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
