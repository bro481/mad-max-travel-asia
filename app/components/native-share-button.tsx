"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

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
  type: "link";
  dataUrl: string;
};

declare global {
  interface Window {
    WeixinJSBridge?: {
      invoke?: (name: string, payload: WeChatBridgePayload, callback?: (response: unknown) => void) => void;
      on?: (name: string, callback: () => void) => void;
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
  const [notice, setNotice] = useState("");
  const currentUrl = () => new URL(url || window.location.href, window.location.href).toString();
  const weChatUrl = () => {
    const next = new URL(currentUrl());
    next.searchParams.set("wxshare", "1");
    return next.toString();
  };
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

  const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
    let item = document.querySelector<HTMLMetaElement>(selector);
    if (!item) {
      item = document.createElement("meta");
      item.setAttribute(attr, key);
      document.head.appendChild(item);
    }
    item.setAttribute("content", content);
  };

  function syncDocumentShareMeta(payload: WeChatBridgePayload) {
    document.title = payload.title;
    setMeta('meta[name="description"]', "name", "description", payload.desc);
    setMeta('meta[property="og:title"]', "property", "og:title", payload.title);
    setMeta('meta[property="og:description"]', "property", "og:description", payload.desc);
    setMeta('meta[property="og:image"]', "property", "og:image", payload.img_url);
    setMeta('meta[property="og:url"]', "property", "og:url", payload.link);
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", payload.title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", payload.desc);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", payload.img_url);
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  async function copyShareText(targetUrl: string, targetTitle: string, targetText: string) {
    const content = [targetTitle, targetText, targetUrl].filter(Boolean).join("\n");
    await navigator.clipboard?.writeText(content).catch(() => undefined);
  }

  function shareToWeChat(payload: WeChatBridgePayload) {
    const bridge = window.WeixinJSBridge;
    if (!bridge?.invoke) return false;
    bridge.on?.("menu:share:appmessage", () => {
      bridge.invoke?.("sendAppMessage", payload, () => undefined);
    });
    bridge.on?.("menu:share:timeline", () => {
      bridge.invoke?.("shareTimeline", payload, () => undefined);
    });
    bridge.invoke("sendAppMessage", payload, (response) => {
      const message = String((response as { err_msg?: unknown })?.err_msg || "");
      if (message && !/ok/i.test(message)) showNotice("已准备好当前房源，请点右上角转发给朋友");
    });
    return true;
  }

  async function share(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const targetUrl = isWeChat() ? weChatUrl() : currentUrl();
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
      type: "link" as const,
      dataUrl: "",
    };
    syncDocumentShareMeta(wechatPayload);

    const shareData = {
      title: targetTitle,
      text: targetText,
      url: targetUrl,
    };

    if (navigator.share) {
      const shared = await navigator.share(shareData).then(() => true).catch(() => false);
      if (shared) return;
    }

    if (isWeChat()) {
      if (shareToWeChat(wechatPayload)) {
        showNotice("已准备好当前房源，请点右上角转发给朋友");
        return;
      }
      document.addEventListener("WeixinJSBridgeReady", () => {
        syncDocumentShareMeta(wechatPayload);
        shareToWeChat(wechatPayload);
      }, { once: true });
      await copyShareText(targetUrl, targetTitle, targetText);
      showNotice("已复制当前房源链接，请点右上角转发给朋友");
      return;
    }

    await copyShareText(targetUrl, targetTitle, targetText);
    showNotice("已复制当前房源链接");
  }

  return (
    <span className="native-share-wrap">
      <button className={className} type="button" onClick={share} aria-label={ariaLabel || title || "分享当前页面"}>
        {children || <ShareIcon />}
      </button>
      {notice ? <span className="native-share-notice" role="status">{notice}</span> : null}
    </span>
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
