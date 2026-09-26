"use client";

import type { MouseEvent, ReactNode } from "react";

type NativeShareButtonProps = {
  title?: string;
  text?: string;
  url?: string;
  image?: string;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
};

type WeChatBridgePayload = {
  appid: string;
  title: string;
  desc: string;
  link: string;
  img_url: string;
  img_width: string;
  img_height: string;
};

declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke?: (name: string, payload: WeChatBridgePayload, callback?: (response: unknown) => void) => void;
    };
  }
}

export function NativeShareButton({
  title,
  text,
  url,
  image,
  className = "light-share-button",
  children,
  "aria-label": ariaLabel,
}: NativeShareButtonProps) {
  const currentUrl = () => new URL(url || window.location.href, window.location.href).toString();
  const absoluteUrl = (value?: string) => {
    const next = value || "";
    if (!next) return "";
    return new URL(next, window.location.href).toString();
  };
  const metaContent = (selector: string) => document.querySelector<HTMLMetaElement>(selector)?.content || "";
  const shareImage = () => absoluteUrl(image || metaContent('meta[property="og:image"]') || metaContent('meta[name="twitter:image"]'));
  const shareText = () => text || metaContent('meta[property="og:description"]') || metaContent('meta[name="description"]') || "";
  const shareTitle = () => title || metaContent('meta[property="og:title"]') || document.title;
  const isWeChat = () => /MicroMessenger/i.test(navigator.userAgent);

  function shareToWeChat(payload: WeChatBridgePayload) {
    const bridge = window.WeixinJSBridge;
    if (!bridge?.invoke) return false;
    bridge.invoke("sendAppMessage", payload, () => undefined);
    return true;
  }

  async function share(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const targetUrl = currentUrl();
    const targetTitle = shareTitle();
    const targetText = shareText();
    const targetImage = shareImage();
    const wechatPayload = {
      appid: "",
      title: targetTitle,
      desc: targetText,
      link: targetUrl,
      img_url: targetImage,
      img_width: "120",
      img_height: "120",
    };

    if (isWeChat()) {
      if (shareToWeChat(wechatPayload)) return;
      document.addEventListener("WeixinJSBridgeReady", () => shareToWeChat(wechatPayload), { once: true });
      return;
    }

    const shareData = {
      title: targetTitle,
      text: targetText,
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
