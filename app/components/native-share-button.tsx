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
  children,
  "aria-label": ariaLabel,
}: NativeShareButtonProps) {
  const currentUrl = () => new URL(url || window.location.href, window.location.href).toString();

  async function share(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const targetUrl = currentUrl();
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
    <button className={className} type="button" onClick={share} aria-label={ariaLabel || title || "分享当前页面"}>
      {children || <ShareIcon />}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}
