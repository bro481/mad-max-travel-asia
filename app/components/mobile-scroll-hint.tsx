"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

export function MobileScrollHint({ children, className = "" }: { children: ReactNode; className?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  const update = useCallback(() => {
    const node = scroller.current;
    if (!node) return;
    setHasMore(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const node = scroller.current;
    if (!node) return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [children, update]);

  return (
    <div className={`mobile-scroll-shell${hasMore ? " has-more" : ""} ${className}`.trim()}>
      <div ref={scroller} className="mobile-scroll-track" onScroll={update}>{children}</div>
      <span className="mobile-scroll-more" aria-hidden="true">›</span>
    </div>
  );
}
