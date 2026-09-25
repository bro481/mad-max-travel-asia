"use client";

import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

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
  const [wechatGuideOpen, setWechatGuideOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = () => new URL(url || window.location.href, window.location.href).toString();

  async function copyCurrentUrl() {
    const targetUrl = currentUrl();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(targetUrl).catch(() => fallbackCopy(targetUrl));
    } else {
      fallbackCopy(targetUrl);
    }
    setCopied(true);
  }

  async function share(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const targetUrl = currentUrl();
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    if (isWechat) {
      window.WeixinJSBridge?.call?.("showOptionMenu");
      setCopied(false);
      setWechatGuideOpen(true);
      return;
    }
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
    <>
      <button className={className} type="button" onClick={share} aria-label={ariaLabel || title || "分享当前页面"}>
        {children || <ShareIcon />}
      </button>
      {wechatGuideOpen && (
        <div className="wechat-share-guide" role="dialog" aria-modal="true" onClick={() => setWechatGuideOpen(false)}>
          <div onClick={(event) => event.stopPropagation()}>
            <button type="button" className="wechat-share-guide-close" onClick={() => setWechatGuideOpen(false)} aria-label="关闭">×</button>
            <small>微信分享</small>
            <h2>{title || "分享当前页面"}</h2>
            {text ? <p>{text}</p> : null}
            <div className="wechat-share-guide-steps">
              <span>1. 点右上角「···」</span>
              <span>2. 选择「转发给朋友」或「分享到朋友圈」</span>
            </div>
            <button type="button" className="wechat-share-copy" onClick={copyCurrentUrl}>
              {copied ? "链接已复制" : "复制链接"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

declare global {
  interface Window {
    WeixinJSBridge?: {
      call?: (name: string) => void;
    };
  }
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}
