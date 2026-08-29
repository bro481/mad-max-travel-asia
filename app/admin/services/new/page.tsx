"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { DestinationRecord } from "../../../../db/destinations";
import type { ServiceCategory } from "../../../../db/services";

type ServiceStructure = {
  icon: string;
  title: string;
  desc: string;
  type: string;
  templateType: "transfer" | "route" | "experience";
  defaultCategory: string;
};

const structures: ServiceStructure[] = [
  { icon: "✈️", title: "接送服务", desc: "机场 / 酒店 / 市区点对点接送", type: "交通接送", templateType: "transfer", defaultCategory: "交通服务" },
  { icon: "🚗", title: "包车 / 路线", desc: "半日、全日、多景点、跨城路线", type: "私人包车", templateType: "route", defaultCategory: "交通服务" },
  { icon: "🏝", title: "当地体验", desc: "海岛、浮潜、自然、文化与一日体验", type: "当地体验", templateType: "experience", defaultCategory: "海岛体验" },
];

export default function NewService() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [city, setCity] = useState("吉隆坡");
  const [draft, setDraft] = useState<{ structure: ServiceStructure; categoryId: number; nameZh: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/destinations").then(async (r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/services").then(async (r) => (r.ok ? r.json() : [])),
    ]).then(([destinationItems, categoryItems]) => {
      const destinationOptions = (Array.isArray(destinationItems) ? destinationItems : [])
        .filter((item: DestinationRecord) => item.useForServices && item.status !== "hidden")
        .sort((a: DestinationRecord, b: DestinationRecord) => a.serviceSort - b.serviceSort || a.id - b.id);
      const categoryOptions = (Array.isArray(categoryItems) ? categoryItems : [])
        .filter((item: ServiceCategory) => item.visible !== false)
        .sort((a: ServiceCategory, b: ServiceCategory) => a.sortOrder - b.sortOrder || a.id - b.id);
      setDestinations(destinationOptions);
      setCategories(categoryOptions);
      if (destinationOptions[0]) setCity(destinationOptions[0].nameZh);
    });
  }, []);

  const destinationOptions = destinations.length ? destinations.map((item) => item.nameZh) : ["吉隆坡", "亚庇", "仙本那", "马六甲", "新加坡"];
  const selectedDestination = destinations.find((item) => item.nameZh === city);
  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === draft?.categoryId) || categories[0],
    [categories, draft?.categoryId],
  );

  const openDraft = (structure: ServiceStructure) => {
    const category = categories.find((item) => item.nameZh === structure.defaultCategory) || categories[0];
    setNotice("");
    setDraft({ structure, categoryId: category?.id || 1, nameZh: "" });
  };

  const create = async () => {
    if (!draft) return;
    const nameZh = draft.nameZh.trim() || defaultServiceName(city, draft.structure.templateType);
    setBusy(true);
    setNotice("正在创建草稿…");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const r = await fetch("/api/admin/service-items", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: draft.structure.type,
          templateType: draft.structure.templateType,
          categoryId: draft.categoryId,
          category: selectedCategory?.nameZh || draft.structure.defaultCategory,
          destinationId: selectedDestination?.id || 0,
          city,
          nameZh,
          nameEn: nameZh,
        }),
      });
      const text = await r.text();
      const x = text ? JSON.parse(text) : null;
      if (!r.ok || !x?.id) throw new Error(x?.error || `创建失败：${r.status}`);
      window.clearTimeout(timeout);
      location.href = `/admin/services/${x.id}`;
    } catch (error) {
      window.clearTimeout(timeout);
      setBusy(false);
      setNotice(error instanceof DOMException && error.name === "AbortError"
        ? "创建超时：数据库连接超过 12 秒没有返回，请检查 DATABASE_URL；按钮已恢复，可以重试。"
        : error instanceof Error ? error.message : "创建失败，请刷新后重试");
    }
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <p>当地服务</p>
          <h1>新建服务</h1>
          <span>先确定目的地和服务结构，再进入对应编辑器。</span>
        </div>
      </div>
      <div className="service-subnav">
        <Link href="/admin/services">服务列表</Link>
        <Link href="/admin/services/categories">展示分类</Link>
        <Link href="/admin/services/templates">编辑模板</Link>
      </div>
      <section className="new-service-flow">
        <label className="new-service-destination">
          <span>① 目的地</span>
          <select value={city} onChange={(event) => setCity(event.target.value)}>
            {destinationOptions.map((name) => (
              <option value={name} key={name}>{name}</option>
            ))}
          </select>
        </label>
        <h2>② 你要新建哪种服务？</h2>
        <div className="service-type-picker compact-picker">
          {structures.map((structure) => (
            <button disabled={busy} onClick={() => openDraft(structure)} key={structure.templateType}>
              <span>{structure.icon}</span>
              <b>{structure.title}</b>
              <small>{structure.desc}</small>
              <i>开始创建 →</i>
            </button>
          ))}
        </div>
      </section>
      <Link className="gift-create-entry" href="/admin/gifts">🎁 新建伴手礼 / 商品 →</Link>
      {draft && (
        <div className="destination-dialog-backdrop">
          <div className="destination-dialog new-service-dialog">
            <button className="dialog-close" onClick={() => setDraft(null)}>×</button>
            <h2>新建{draft.structure.title}</h2>
            <p className="dialog-muted">系统会自动绑定：{city} / {selectedCategory?.nameZh || "展示分类"} / {templateLabel(draft.structure.templateType)}</p>
            <div className="destination-form-grid">
              <label>
                <span>目的地</span>
                <input value={city} readOnly />
              </label>
              <label>
                <span>所属展示分类</span>
                <select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: Number(e.target.value) })}>
                  {(categories.length ? categories : [{ id: 1, nameZh: draft.structure.defaultCategory } as ServiceCategory]).map((category) => (
                    <option value={category.id} key={category.id}>{category.nameZh}</option>
                  ))}
                </select>
              </label>
              <label className="destination-wide">
                <span>服务名称</span>
                <input value={draft.nameZh} onChange={(e) => setDraft({ ...draft, nameZh: e.target.value })} placeholder={defaultServiceName(city, draft.structure.templateType)} />
              </label>
            </div>
            {notice && <p className="dialog-muted">{notice}</p>}
            <div className="dialog-actions">
              <button onClick={() => setDraft(null)}>取消</button>
              <button className="admin-primary" disabled={busy} onClick={create}>
                {busy ? "创建中…" : "创建并编辑"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function templateLabel(type: ServiceStructure["templateType"]) {
  if (type === "transfer") return "接送型";
  if (type === "route") return "路线型";
  return "体验型";
}

function defaultServiceName(city: string, type: ServiceStructure["templateType"]) {
  if (type === "transfer") return `${city}机场接送`;
  if (type === "route") return `${city}私人包车`;
  return `${city}当地体验`;
}
