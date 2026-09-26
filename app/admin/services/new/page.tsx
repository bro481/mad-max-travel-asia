"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DestinationRecord } from "../../../../db/destinations";
import type { ServiceCategory } from "../../../../db/services";

type ServiceType = {
  label: string;
  type: string;
  templateType: "transfer" | "route" | "experience";
  defaultCategory: string;
  hint: string;
};

const serviceTypes: ServiceType[] = [
  { label: "机场 / 酒店接送", type: "交通接送", templateType: "transfer", defaultCategory: "交通服务", hint: "自动使用接送型字段和咨询表单" },
  { label: "私人包车 / 热门路线", type: "私人包车", templateType: "route", defaultCategory: "交通服务", hint: "自动使用车型、热门路线和路线节点" },
  { label: "当地体验 / 一日游", type: "当地体验", templateType: "experience", defaultCategory: "海岛体验", hint: "自动使用体验行程与服务图片" },
];

export default function NewService() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [nameZh, setNameZh] = useState("");
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState(serviceTypes[1].type);

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
      setDestinationId(destinationOptions[0]?.id || null);
      setCategoryId(categoryOptions.find((item: ServiceCategory) => item.nameZh === "交通服务")?.id || categoryOptions[0]?.id || null);
    });
  }, []);

  const serviceType = useMemo(
    () => serviceTypes.find((item) => item.type === selectedType) || serviceTypes[1],
    [selectedType],
  );
  const destination = destinations.find((item) => item.id === destinationId);
  const category = categories.find((item) => item.id === categoryId);

  useEffect(() => {
    const defaultCategory = categories.find((item) => item.nameZh === serviceType.defaultCategory);
    if (defaultCategory) setCategoryId(defaultCategory.id);
  }, [serviceType, categories]);

  const create = async () => {
    if (!destination) {
      setNotice("请先选择城市。");
      return;
    }
    if (!category) {
      setNotice("请先选择服务分类。");
      return;
    }
    const title = nameZh.trim() || defaultServiceName(destination.nameZh, serviceType.templateType);
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
          type: serviceType.type,
          templateType: serviceType.templateType,
          categoryId: category.id,
          category: category.nameZh,
          destinationId: destination.id,
          city: destination.nameZh,
          nameZh: title,
          nameEn: title,
        }),
      });
      const text = await r.text();
      const x = text ? JSON.parse(text) : null;
      if (!r.ok || !x?.id) throw new Error(x?.error || `创建失败：${r.status}`);
      window.clearTimeout(timeout);
      router.push(`/admin/services/${x.id}`);
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
          <span>填写运营人员能理解的基础信息，系统会自动绑定对应编辑结构。</span>
        </div>
      </div>
      <div className="service-subnav">
        <Link href="/admin/services">服务列表</Link>
        <Link href="/admin/services/categories">分类管理</Link>
        <Link href="/admin/settings">页面设置</Link>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <section className="new-service-panel">
        <label>
          <span>服务名称</span>
          <input value={nameZh} onChange={(event) => setNameZh(event.target.value)} placeholder={destination ? defaultServiceName(destination.nameZh, serviceType.templateType) : "吉隆坡私人包车"} />
        </label>
        <div className="new-service-grid">
          <label>
            <span>城市</span>
            <select value={destinationId ?? ""} disabled={!destinations.length} onChange={(event) => setDestinationId(Number(event.target.value))}>
              {!destinations.length ? <option value="">正在读取城市…</option> : null}
              {destinations.map((item) => <option value={item.id} key={item.id}>{item.nameZh}</option>)}
            </select>
          </label>
          <label>
            <span>服务分类</span>
            <select value={categoryId ?? ""} disabled={!categories.length} onChange={(event) => setCategoryId(Number(event.target.value))}>
              {!categories.length ? <option value="">正在读取分类…</option> : null}
              {categories.map((item) => <option value={item.id} key={item.id}>{item.nameZh}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="new-service-type-list">
          <legend>服务类型</legend>
          {serviceTypes.map((item) => (
            <label className={selectedType === item.type ? "active" : ""} key={item.type}>
              <input type="radio" checked={selectedType === item.type} onChange={() => setSelectedType(item.type)} />
              <b>{item.label}</b>
              <small>{item.hint}</small>
            </label>
          ))}
        </fieldset>
        <div className="new-service-actions">
          <Link href="/admin/services">取消</Link>
          <button className="admin-primary" disabled={busy} onClick={create}>{busy ? "创建中…" : "创建并编辑"}</button>
        </div>
      </section>
    </>
  );
}

function defaultServiceName(city: string, type: ServiceType["templateType"]) {
  if (type === "transfer") return `${city}机场接送`;
  if (type === "route") return `${city}私人包车`;
  return `${city}当地体验`;
}
