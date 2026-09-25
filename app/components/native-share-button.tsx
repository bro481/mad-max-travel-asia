"use client";

import type { MouseEvent, ReactNode } from "react";

type NativeShareButtonProps = {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
};

export function NativeShareButton({
  title,
  text,
  url,
  className = "light-share-button",
  children = "分享 ↗",
  "aria-label": ariaLabel,
}: NativeShareButtonProps) {
  async function share(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const targetUrl = new URL(url || window.location.href, window.location.href).toString();
    const shareData = {
      title: title || document.title,
      text,
      url: targetUrl,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(targetUrl).catch(() => undefined);
  }

  return (
    <button className={className} type="button" onClick={share} aria-label={ariaLabel || String(children)}>
      {children}
    </button>
  );
}
