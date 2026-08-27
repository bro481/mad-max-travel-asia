"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DestinationRecord } from "../../../db/destinations";
import type { ServiceCategory } from "../../../db/services";
import type { ServiceItem } from "../../../db/service-items";
export default function ServiceList() {
  const [items, setItems] = useState<ServiceItem[]>([]),
    [notice, setNotice] = useState(""),
    [activeCity, setActiveCity] = useState("全部"),
    [activeType, setActiveType] = useState("全部"),
    [categories, setCategories] = useState<ServiceCategory[]>([]),
    [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const load = () =>
    fetch("/api/admin/service-items")
      .then(async (r) => {
        if (r.status === 401) {
          location.href = "/admin/login?return_to=%2Fadmin%2Fservices";
          return [];
        }
        if (!r.ok) {
          setNotice("服务数据暂时没有返回，请刷新重试。");
          return [];
        }
        const text = await r.text();
        return text ? JSON.parse(text) : [];
      })
      .then(setItems);
  useEffect(() => {
    load();
    Promise.all([
      fetch("/api/admin/destinations").then(async (r) => {
        if (!r.ok) return [];
        const text = await r.text();
        return text ? JSON.parse(text) : [];
      }),
      fetch("/api/admin/services").then(async (r) => {
        if (!r.ok) return [];
        const text = await r.text();
        return text ? JSON.parse(text) : [];
      }),
    ]).then(([dests, cats]) => {
      setDestinations(dests);
      setCategories(cats);
    });
  }, []);
  const update = async (x: ServiceItem, status: ServiceItem["status"]) => {
    await fetch(`/api/admin/service-items/${x.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...x, status }),
    });
    load();
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
    location.href = `/admin/services/${c.id}`;
  };
  const cities = [
    ...destinations
      .filter((destination) => destination.useForServices && destination.status !== "hidden")
      .sort((a, b) => a.serviceSort - b.serviceSort || a.id - b.id)
      .map((destination) => destination.nameZh),
    ...[...new Set(items.map((x) => x.city))].filter((city) => city && !destinations.some((destination) => destination.nameZh === city)),
  ];
  const kind = (x: ServiceItem) =>
    x.templateType === "transfer" || x.type === "交通接送" ? "接送机" : x.templateType === "route" || x.type === "私人包车" ? "包车" : "当地体验";
  const categoryName = (x: ServiceItem) =>
    categories.find((category) => category.id === x.categoryId)?.nameZh || x.category || "未分类";
  const cityItems = activeCity === "全部" ? items : items.filter((item) => item.city === activeCity);
  const visibleItems = (activeType === "全部" ? cityItems : cityItems.filter((item) => kind(item) === activeType))
    .sort((a, b) => (a.categoryId || 0) - (b.categoryId || 0) || (a.displayOrder || 99) - (b.displayOrder || 99) || a.id - b.id);
  const categoryGroups = categories
    .filter((category) => category.visible !== false && visibleItems.some((item) => item.categoryId === category.id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const orphanCategoryNames = [...new Set(visibleItems.filter((item) => !categories.some((category) => category.id === item.categoryId)).map((x) => categoryName(x)))];
  const cityEnglish = (city: string) => destinations.find((destination) => destination.nameZh === city)?.nameEn || city;
  const moveWithinGroup = async (x: ServiceItem, direction: -1 | 1) => {
    const group = visibleItems.filter((item) => item.city === x.city && item.categoryId === x.categoryId);
    const index = group.findIndex((item) => item.id === x.id);
    const target = group[index + direction];
    if (!target) return;
    const a = { ...x, displayOrder: target.displayOrder || target.id };
    const b = { ...target, displayOrder: x.displayOrder || x.id };
    await Promise.all([
      fetch(`/api/admin/service-items/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) }),
      fetch(`/api/admin/service-items/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }),
    ]);
    load();
  };
  const card = (x: ServiceItem) => (
    <article key={x.id}>
      <div className="service-product-cover">
        {x.images[0] ? (
          <img src={x.images[0]} alt="" />
        ) : (
          <span>
            {x.type === "交通接送"
              ? "🚗"
              : x.type === "私人包车"
                ? "🚙"
                : x.type === "海岛体验"
                  ? "🏝"
                  : "🌆"}
          </span>
        )}
        <i>
          {x.status === "published"
            ? "已上线"
            : x.status === "hidden"
              ? "已隐藏"
              : "草稿"}
        </i>
      </div>
      <div>
        <small>
          {x.city} · {categoryName(x)}
        </small>
        <h4>{x.nameZh}</h4>
        <p>{x.subtitleZh || "服务范围或路线待填写"}</p>
        <b className="service-card-price">{x.priceMode === "咨询报价" ? "价格咨询" : `RM ${x.price} ${x.priceMode === "起价" ? "起" : ""}`}</b>
        <nav>
          <Link href={`/admin/services/${x.id}`}>编辑</Link>
          <a href={`/services/item/${x.slug}`} target="_blank">
            预览
          </a>
          <button onClick={() => copy(x)}>复制</button>
          <button
            onClick={() =>
              update(x, x.status === "published" ? "hidden" : "published")
            }
          >
            {x.status === "published" ? "隐藏" : "上线"}
          </button>
          <button onClick={() => moveWithinGroup(x, -1)}>上移</button>
          <button onClick={() => moveWithinGroup(x, 1)}>下移</button>
        </nav>
      </div>
    </article>
  );
  return (
    <>
      <div className="admin-head">
        <div>
          <p>当地服务</p>
          <h1>服务列表</h1>
          <span>按城市与类型组织服务，用内容、流程和路线促成咨询。</span>
        </div>
        <Link className="admin-primary" href="/admin/services/new">
          ＋ 新建服务
        </Link>
      </div>
      <div className="service-subnav">
        <Link className="active" href="/admin/services">
          服务列表
        </Link>
        <Link href="/admin/services/categories">展示分类</Link>
        <Link href="/admin/services/templates">编辑模板</Link>
        <Link href="/admin/gifts">伴手礼</Link>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <div
        className="service-city-tabs"
        role="tablist"
        aria-label="按地区筛选服务"
      >
        {["全部", ...cities].map((city) => (
          <button
            className={activeCity === city ? "active" : ""}
            key={city}
            onClick={() => setActiveCity(city)}
            role="tab"
            aria-selected={activeCity === city}
          >
            <span>{city}</span>
            {city !== "全部" && <small>{cityEnglish(city)}</small>}
            <i>
              {city === "全部"
                ? items.length
                : items.filter((x) => x.city === city).length}
            </i>
          </button>
        ))}
      </div>
      <div className="service-kind-tabs" role="tablist" aria-label="按服务类型筛选">
        {["全部", "接送机", "包车", "当地体验"].map((type) => (
          <button className={activeType === type ? "active" : ""} onClick={() => setActiveType(type)} key={type}>
            {type}<small>{type === "全部" ? cityItems.length : cityItems.filter((x) => kind(x) === type).length}</small>
          </button>
        ))}
      </div>
      {activeCity === "全部" ? (
        <section className="service-all-view">
          <h2>
            全部服务 <small>{visibleItems.length} 个服务</small>
          </h2>
          <div className="service-product-grid">{visibleItems.map(card)}</div>
        </section>
      ) : (
        <section className="service-city">
          <div className="service-city-heading">
            <div>
              <p>当前地区</p>
              <h2>
                {activeCity} <small>{cityEnglish(activeCity)}</small>
              </h2>
            </div>
            <span>{visibleItems.length} 个服务</span>
          </div>
          {categoryGroups.map((category) => (
            <div className="service-category-group" key={category.id}>
              <h3>
                {category.icon} {category.nameZh}
                <small>
                  {visibleItems.filter((x) => x.categoryId === category.id).length}{" "}
                  个
                </small>
              </h3>
              <div className="service-product-grid">
                {visibleItems.filter((x) => x.categoryId === category.id).map(card)}
              </div>
            </div>
          ))}
          {orphanCategoryNames.map((category) => (
            <div className="service-category-group" key={category}>
              <h3>{category}<small>{visibleItems.filter((x) => categoryName(x) === category).length} 个</small></h3>
              <div className="service-product-grid">{visibleItems.filter((x) => categoryName(x) === category).map(card)}</div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
