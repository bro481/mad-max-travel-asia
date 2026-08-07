"use client";
import Link from "next/link";
import { useState } from "react";
const templates = [
  ["🚗", "机场接送模板", "交通接送", "交通服务"],
  ["🚙", "私人包车模板", "私人包车", "包车服务"],
  ["🌆", "城市体验模板", "城市体验", "城市体验"],
  ["🗺", "一日路线模板", "一日路线", "一日路线"],
  ["🏝", "海岛体验模板", "海岛体验", "海岛体验"],
];
export default function Templates() {
  const [busy, setBusy] = useState("");
  const use = async (name: string, type: string, category: string) => {
    setBusy(name);
    const r = await fetch("/api/admin/service-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        category,
        nameZh: name.replace("模板", ""),
        nameEn: type,
      }),
    });
    const x = await r.json();
    location.href = `/admin/services/${x.id}`;
  };
  return (
    <>
      <div className="admin-head">
        <div>
          <p>当地服务</p>
          <h1>服务模板</h1>
          <span>从预设结构开始，减少重复填写。</span>
        </div>
      </div>
      <div className="service-subnav">
        <Link href="/admin/services">服务列表</Link>
        <Link href="/admin/services/categories">分类管理</Link>
        <Link className="active" href="/admin/services/templates">
          服务模板
        </Link>
      </div>
      <div className="template-grid">
        {templates.map(([icon, name, type, category]) => (
          <article key={name}>
            <span>{icon}</span>
            <h2>{name}</h2>
            <p>
              {type === "私人包车"
                ? "包含路线方案编辑器"
                : type.includes("体验") || type === "一日路线"
                  ? "包含时间线行程编辑器"
                  : "包含三步服务流程与咨询字段"}
            </p>
            <button disabled={!!busy} onClick={() => use(name, type, category)}>
              {busy === name ? "正在创建…" : "使用模板"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
