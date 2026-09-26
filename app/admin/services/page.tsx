"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DestinationRecord } from "../../../db/destinations";
import type { ServiceCategory } from "../../../db/services";
import type { ServiceItem } from "../../../db/service-items";

const typeOptions = ["全部类型", "接送机", "包车", "当地体验"];
const statusOptions = ["全部状态", "已发布", "草稿", "已隐藏"];

export default function ServiceList() {
  const [items, setItems] = useState<ServiceItem[]>([]);
  const [notice, setNotice] = useState("");
  const [cityFilter, setCityFilter] = useState("全部城市");
  const [categoryFilter, setCategoryFilter] = useState("全部分类");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [statusFilter, setStatusFilter] = useState("全部状态");
  const [query, setQuery] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);

  const load = () =>
    fetch("/api/admin/service-items")
      .then(async (r) => {
        if (r.status === 401) {
          location.href = "/admin/login?return_to=%2Fadmin%2Fservices";
          return [];
        }
        if (!r.ok) {
          const result = (await r.json().catch(() => ({}))) as { error?: string };
          setNotice(result.error || "服务数据暂时没有返回，请刷新重试。");
          return [];
        }
        const text = await r.text();
        return text ? JSON.parse(text) : [];
      })
      .then(setItems);

  useEffect(() => {
    load();
    Promise.all([
      fetch("/api/admin/destinations").then(async (r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/services").then(async (r) => (r.ok ? r.json() : [])),
    ]).then(([dests, cats]) => {
      setDestinations(Array.isArray(dests) ? dests : []);
      setCategories(Array.isArray(cats) ? cats : []);
    });
  }, []);

  const cities = useMemo(
    () => [
      ...destinations
        .filter((destination) => destination.useForServices && destination.status !== "hidden")
        .sort((a, b) => a.serviceSort - b.serviceSort || a.id - b.id)
        .map((destination) => destination.nameZh),
      ...[...new Set(items.map((x) => x.city))].filter((city) => city && !destinations.some((destination) => destination.nameZh === city)),
    ],
    [destinations, items],
  );

  const kind = (x: ServiceItem) =>
    x.templateType === "transfer" || x.type === "交通接送" ? "接送机" : x.templateType === "route" || x.type === "私人包车" ? "包车" : "当地体验";

  const categoryName = (x: ServiceItem) =>
    categories.find((category) => category.id === x.categoryId)?.nameZh || x.category || "未分类";

  const statusLabel = (x: ServiceItem) =>
    x.status === "published" ? "已发布" : x.status === "hidden" ? "已隐藏" : "草稿";

  const frontHref = (x: ServiceItem) => {
    if (x.templateType === "route" || x.type === "私人包车") {
      const city = x.city === "吉隆坡" ? "kl" : x.city === "马六甲" ? "melaka" : "kk";
      return `/services/private-car?city=${city}&service=${encodeURIComponent(x.slug)}`;
    }
    return `/services?service=${encodeURIComponent(x.slug)}`;
  };

  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items
      .filter((item) => cityFilter === "全部城市" || item.city === cityFilter)
      .filter((item) => categoryFilter === "全部分类" || categoryName(item) === categoryFilter)
      .filter((item) => typeFilter === "全部类型" || kind(item) === typeFilter)
      .filter((item) => statusFilter === "全部状态" || statusLabel(item) === statusFilter)
      .filter((item) => {
        if (!keyword) return true;
        return [item.nameZh, item.nameEn, item.subtitleZh, item.city, item.category, item.slug]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => (a.categoryId || 0) - (b.categoryId || 0) || (a.displayOrder || 99) - (b.displayOrder || 99) || a.id - b.id);
  }, [items, cityFilter, categoryFilter, typeFilter, statusFilter, query, categories]);

  const updateStatus = async (x: ServiceItem, status: ServiceItem["status"]) => {
    setNotice("保存中…");
    const r = await fetch(`/api/admin/service-items/${x.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...x, status }),
    });
    setNotice(r.ok ? "✓ 状态已更新" : "状态更新失败，请刷新后重试");
    if (r.ok) load();
  };

  const copy = async (x: ServiceItem) => {
    setNotice("正在复制…");
    const r = await fetch("/api/admin/service-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...x,
        nameZh: x.nameZh + "（副本）",
        nameEn: x.nameEn + " Copy",
        slug: x.slug + "-copy",
      }),
    });
    const text = await r.text();
    const c = text ? JSON.parse(text) : null;
    if (!c?.id) {
      setNotice("复制失败，请刷新后重试。");
      return;
    }
    await fetch(`/api/admin/service-items/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...x,
        id: c.id,
        slug: c.slug,
        nameZh: x.nameZh + "（副本）",
        status: "draft",
      }),
    });
    window.location.assign(`/admin/services/${c.id}`);
  };

  const remove = async (x: ServiceItem) => {
    if (!window.confirm(`确定删除「${x.nameZh}」吗？删除后不可恢复。`)) return;
    setNotice("正在删除…");
    const r = await fetch(`/api/admin/service-items/${x.id}`, { method: "DELETE" });
    if (!r.ok) {
      const result = (await r.json().catch(() => ({}))) as { error?: string };
      setNotice(result.error || "删除失败，请刷新后重试。");
      return;
    }
    setNotice("✓ 服务已删除");
    load();
  };

  const swapOrder = async (targetId: number) => {
    if (!draggingId || draggingId === targetId) return;
    const source = items.find((item) => item.id === draggingId);
    const target = items.find((item) => item.id === targetId);
    setDraggingId(null);
    if (!source || !target) return;
    if (source.city !== target.city || source.categoryId !== target.categoryId) {
      setNotice("排序只在同城市、同分类内生效；跨分类请先编辑服务归属。");
      return;
    }
    const nextSource = { ...source, displayOrder: target.displayOrder || target.id };
    const nextTarget = { ...target, displayOrder: source.displayOrder || source.id };
    await Promise.all([
      fetch(`/api/admin/service-items/${nextSource.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextSource) }),
      fetch(`/api/admin/service-items/${nextTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextTarget) }),
    ]);
    setNotice("✓ 排序已更新");
    load();
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <p>当地服务</p>
          <h1>服务列表</h1>
          <span>用一个紧凑列表管理服务，日常只处理编辑、预览、复制和上下线。</span>
        </div>
        <Link className="admin-primary" href="/admin/services/new">
          ＋ 新建服务
        </Link>
      </div>
      <div className="service-subnav">
        <Link className="active" href="/admin/services">服务列表</Link>
        <Link href="/admin/services/categories">分类管理</Link>
        <Link href="/admin/settings">页面设置</Link>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <section className="service-list-tools" aria-label="服务筛选">
        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
          <option>全部城市</option>
          {cities.map((city) => <option key={city}>{city}</option>)}
        </select>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option>全部分类</option>
          {categories.map((category) => <option key={category.id}>{category.nameZh}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          {typeOptions.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statusOptions.map((status) => <option key={status}>{status}</option>)}
        </select>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索服务名称、城市、slug..." />
      </section>
      <section className="service-table-card">
        <div className="service-table-head">
          <h2>当地服务</h2>
          <span>{visibleItems.length} / {items.length} 个服务</span>
        </div>
        <div className="service-table-row service-table-title">
          <span>服务</span>
          <span>城市</span>
          <span>分类</span>
          <span>类型</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        {visibleItems.map((item) => (
          <div
            className={`service-table-row ${draggingId === item.id ? "dragging" : ""}`}
            draggable
            key={item.id}
            onDragStart={() => setDraggingId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => swapOrder(item.id)}
          >
            <div className="service-table-name">
              <span className="drag-handle">≡</span>
              {item.images[0] ? <img src={item.images[0]} alt="" /> : <i>{kind(item).slice(0, 1)}</i>}
              <div>
                <b>{item.nameZh}</b>
                <small>{item.subtitleZh || item.slug}</small>
              </div>
            </div>
            <span>{item.city || "未设置"}</span>
            <span>{categoryName(item)}</span>
            <span>{kind(item)}</span>
            <span className={item.status === "published" ? "status-on" : item.status === "hidden" ? "status-off" : "status-draft"}>{statusLabel(item)}</span>
            <nav className="service-row-actions">
              <Link href={`/admin/services/${item.id}`}>编辑</Link>
              <a href={frontHref(item)} target="_blank" rel="noreferrer">预览</a>
              <button className="delete-inline" type="button" onClick={() => remove(item)}>删除</button>
              <details>
                <summary>···</summary>
                <div>
                  <button onClick={() => copy(item)}>复制服务</button>
                  <button onClick={() => updateStatus(item, item.status === "published" ? "hidden" : "published")}>
                    {item.status === "published" ? "隐藏服务" : "发布服务"}
                  </button>
                </div>
              </details>
            </nav>
          </div>
        ))}
        {!visibleItems.length && <p className="empty-state">没有符合筛选条件的服务。</p>}
      </section>
    </>
  );
}
