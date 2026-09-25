"use client";

import { useState } from "react";

export function ShareButton({ title, text, url }: { title: string; text: string; url?: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const target = url || location.href;
    if (navigator.share) {
      await navigator.share({ title, text, url: target }).catch(() => {});
      return;
    }
    await navigator.clipboard?.writeText(target);
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }
  return (
    <button className="light-share-button" type="button" onClick={share}>
      {done ? "已复制" : "分享 ↗"}
    </button>
  );
}
