"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ReferrerRecord } from "../../../../db/referrers";

const PUBLIC_SITE_ORIGIN = "https://madmaxtravel.asia";

const templates = [
  { value: "minimal", label: "极简品牌" },
  { value: "travel", label: "旅行氛围" },
  { value: "service", label: "服务推广" },
] as const;

const topics = [
  { value: "general", label: "综合" },
  { value: "stay", label: "住宿" },
  { value: "transfer", label: "接送" },
  { value: "charter", label: "包车" },
  { value: "trip", label: "当地行程" },
] as const;

const languages = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "bilingual", label: "中英双语" },
] as const;

const sizes = [
  { value: "share", label: "1080 × 1350" },
  { value: "story", label: "1080 × 1920" },
] as const;

type TemplateValue = (typeof templates)[number]["value"];
type TopicValue = (typeof topics)[number]["value"];
type LanguageValue = (typeof languages)[number]["value"];
type SizeValue = (typeof sizes)[number]["value"];

export default function ReferrerDetailPage() {
  const params = useParams<{ code: string }>();
  const [item, setItem] = useState<ReferrerRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [template, setTemplate] = useState<TemplateValue>("minimal");
  const [topic, setTopic] = useState<TopicValue>("general");
  const [language, setLanguage] = useState<LanguageValue>("en");
  const [size, setSize] = useState<SizeValue>("share");

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

  const link = useMemo(() => {
    if (!item) return "";
    const ref = `ref=${encodeURIComponent(item.code)}`;
    if (topic === "stay") return `${PUBLIC_SITE_ORIGIN}/rooms?${ref}`;
    if (topic === "transfer") return `${PUBLIC_SITE_ORIGIN}/services?${ref}&topic=airport-transfer`;
    if (topic === "charter") return `${PUBLIC_SITE_ORIGIN}/services?${ref}&topic=private-car`;
    if (topic === "trip") return `${PUBLIC_SITE_ORIGIN}/packages?${ref}`;
    return `${PUBLIC_SITE_ORIGIN}/?${ref}`;
  }, [item, topic]);

  const posterQuery = useMemo(() => {
    return `template=${template}&topic=${topic}&lang=${language}&size=${size}`;
  }, [language, size, template, topic]);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setNotice("推广链接已复制");
  };

  const sharePoster = async () => {
    if (!item) return;
    const response = await fetch(`/api/admin/referrers/${item.code}/poster?${posterQuery}&format=png`);
    const blob = await response.blob();
    const file = new File([blob], `madmax-${item.code}-poster.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "MAD MAX Malaysia" });
      setNotice("已打开系统分享");
      return;
    }
    window.location.href = `/api/admin/referrers/${item.code}/poster?${posterQuery}&format=png`;
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

      <section className="lead-card referrer-hero-card">
        <div>
          <small>推广数据</small>
          <h2>
            {item.name}
            <span>{item.status === "active" ? "已启用" : "已停用"}</span>
          </h2>
          <p>司机ID {item.code}</p>
        </div>
        <div className="referrer-stats referrer-stats-inline">
          <div>
            <span>访问</span>
            <b>{item.visits}</b>
          </div>
          <div>
            <span>咨询</span>
            <b>{item.inquiries}</b>
          </div>
          <div>
            <span>成交</span>
            <b>{item.deals}</b>
          </div>
          <div>
            <span>成交额</span>
            <b>RM {item.dealAmount.toFixed(0)}</b>
          </div>
        </div>
      </section>

      <div className="referrer-material-layout">
        <section className="lead-card referrer-tools-card">
          <div className="section-heading">
            <small>推广物料</small>
            <h2>基础工具</h2>
          </div>

          <div className="referrer-link-box">
            <label>专属推广链接</label>
            <code>{link}</code>
            <div className="referrer-actions">
              <button onClick={copy}>复制链接</button>
            </div>
          </div>

          <div className="referrer-qr-compact">
            <img
              src={`/api/admin/referrers/${item.code}/qr?format=svg`}
              alt={`${item.name} 推广二维码`}
            />
            <div>
              <b>推广二维码</b>
              <p>二维码指向完整官网，自动带上 {item.name} 的推广来源。</p>
              <div className="referrer-actions">
                <a
                  className="admin-secondary"
                  href={`/api/admin/referrers/${item.code}/qr?format=png`}
                  download={`madmax-${item.code}-qr.png`}
                >
                  保存二维码图片
                </a>
                <button className="admin-secondary" onClick={copy}>
                  复制推广链接
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="lead-card referrer-poster-studio">
          <div className="section-heading">
            <small>推广海报</small>
            <h2>给司机直接保存和转发</h2>
          </div>

          <div className="poster-controls">
            <ControlGroup
              label="模板"
              options={templates}
              value={template}
              onChange={setTemplate}
            />
            <ControlGroup label="推广内容" options={topics} value={topic} onChange={setTopic} />
            <ControlGroup
              label="语言"
              options={languages}
              value={language}
              onChange={setLanguage}
            />
            <ControlGroup label="尺寸" options={sizes} value={size} onChange={setSize} />
          </div>

          <div className="poster-preview-wrap">
            <img
              className={size === "story" ? "poster-preview poster-preview-story" : "poster-preview"}
              src={`/api/admin/referrers/${item.code}/poster?${posterQuery}&format=svg`}
              alt={`${item.name} 推广海报预览`}
            />
          </div>

          <div className="referrer-actions poster-downloads">
            <button className="admin-primary" onClick={sharePoster}>
              保存到手机
            </button>
            <a
              className="admin-secondary"
              href={`/api/admin/referrers/${item.code}/poster?${posterQuery}&format=png`}
              download={`madmax-${item.code}-poster.png`}
            >
              下载高清 PNG
            </a>
            <a
              className="admin-secondary"
              href={`/api/admin/referrers/${item.code}/poster?${posterQuery}&format=jpg`}
              download={`madmax-${item.code}-poster.jpg`}
            >
              下载 JPG
            </a>
          </div>
        </section>
      </div>
    </>
  );
}

function ControlGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            key={option.value}
            className={value === option.value ? "is-active" : ""}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
