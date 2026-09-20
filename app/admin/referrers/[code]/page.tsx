"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ReferrerRecord } from "../../../../db/referrers";

export default function ReferrerDetailPage() {
  const params = useParams<{ code: string }>();
  const [item, setItem] = useState<ReferrerRecord | null>(null);
  const [origin] = useState(() =>
    typeof window === "undefined" ? "https://www.madmaxtravel.asia" : window.location.origin,
  );
  const [notice, setNotice] = useState("");

  useEffect(() => {
    fetch(`/api/admin/referrers/${params.code}`, { cache: "no-store" })
      .then((r) => {
        if (r.status === 401) {
          location.href = `/admin/login?return_to=${encodeURIComponent(`/admin/referrers/${params.code}`)}`;
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(setItem);
  }, [params.code]);

  const link = useMemo(
    () => (item ? `${origin}/?ref=${encodeURIComponent(item.code)}` : ""),
    [item, origin],
  );

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setNotice("推广链接已复制");
  };

  const toggleStatus = async () => {
    if (!item) return;
    const nextStatus = item.status === "active" ? "inactive" : "active";
    const response = await fetch(`/api/admin/referrers/${item.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (response.ok) {
      setItem(await response.json());
      setNotice(nextStatus === "active" ? "已启用" : "已停用");
    }
  };

  if (!item) return <div className="admin-loading">正在打开司机推广资料...</div>;

  return (
    <>
      <div className="lead-top">
        <div>
          <Link href="/admin/referrers">← 返回司机推广</Link>
          <h1>{item.name}</h1>
          <span>
            司机ID：{item.code} · {item.status === "active" ? "已启用" : "已停用"}
          </span>
        </div>
        <button className="admin-secondary" onClick={toggleStatus}>
          {item.status === "active" ? "停用司机" : "启用司机"}
        </button>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}

      <div className="referrer-detail">
        <section className="lead-card">
          <h2>推广链接</h2>
          <div className="referrer-link-box">
            <code>{link}</code>
            <button onClick={copy}>复制链接</button>
          </div>
          <div className="referrer-stats">
            <div>
              <span>访问</span>
              <b>{item.visits}</b>
            </div>
            <div>
              <span>咨询</span>
              <b>{item.inquiries}</b>
            </div>
          </div>
        </section>

        <section className="lead-card referrer-qr-card">
          <h2>推广二维码</h2>
          <img src={`/api/admin/referrers/${item.code}/qr`} alt={`${item.name} 推广二维码`} />
          <div className="referrer-actions">
            <a
              className="admin-secondary"
              href={`/api/admin/referrers/${item.code}/qr`}
              download={`madmax-${item.code}-qr.svg`}
            >
              下载二维码
            </a>
            <button className="admin-secondary" onClick={copy}>
              复制推广链接
            </button>
          </div>
        </section>

        <section className="lead-card referrer-poster-card">
          <h2>二维码海报</h2>
          <img
            src={`/api/admin/referrers/${item.code}/poster`}
            alt={`${item.name} 推广海报`}
          />
          <a
            className="admin-primary"
            href={`/api/admin/referrers/${item.code}/poster`}
            download={`madmax-${item.code}-poster.svg`}
          >
            生成推广海报
          </a>
        </section>
      </div>
    </>
  );
}
