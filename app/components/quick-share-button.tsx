"use client";

import { useMemo, useState } from "react";
import type { CustomerShareProductType } from "../../db/customer-shares";

export function QuickShareButton({
  title,
  text,
  productType,
  productId,
  url,
  className = "light-share-button",
  label = "分享 ↗",
}: {
  title: string;
  text: string;
  productType: CustomerShareProductType;
  productId: string;
  url?: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const targetUrl = (() => {
    if (!url) return typeof location !== "undefined" ? location.href : "";
    if (/^https?:\/\//.test(url)) return url;
    return typeof location !== "undefined" ? `${location.origin}${url.startsWith("/") ? url : `/${url}`}` : url;
  })();
  const materialQuery = useMemo(
    () => `type=${encodeURIComponent(productType)}&id=${encodeURIComponent(productId)}&url=${encodeURIComponent(targetUrl)}`,
    [productType, productId, targetUrl],
  );

  async function copyLink() {
    await navigator.clipboard?.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function systemShare() {
    if (navigator.share) {
      await navigator.share({ title, text, url: targetUrl }).catch(() => {});
      return;
    }
    await copyLink();
  }

  return (
    <>
      <button className={className} type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      {open && (
        <div className="quick-share-layer" onClick={() => setOpen(false)}>
          <section className="quick-share-sheet" onClick={(event) => event.stopPropagation()}>
            <button className="quick-share-close" type="button" onClick={() => setOpen(false)} aria-label="关闭分享面板">×</button>
            <small>分享当前内容</small>
            <h2>{title}</h2>
            <p>{text}</p>
            <div className="quick-share-actions">
              <button type="button" onClick={copyLink}>{copied ? "已复制" : "复制链接"}</button>
              <button type="button" onClick={systemShare}>系统分享</button>
              <a href={`/share/quick/card?${materialQuery}`} target="_blank">生成分享卡</a>
              <a href={`/share/quick/long-image?${materialQuery}`} target="_blank">生成长图</a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
