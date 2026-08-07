"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ServiceItem } from "../../../db/service-items";
export default function ServiceList() {
  const [items, setItems] = useState<ServiceItem[]>([]),
    [notice, setNotice] = useState("");
  const load = () =>
    fetch("/api/admin/service-items")
      .then((r) => {
        if (r.status === 401) {
          location.href = "/signin-with-chatgpt?return_to=%2Fadmin%2Fservices";
          return [];
        }
        return r.json();
      })
      .then(setItems);
  useEffect(() => {
    load();
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
    const c = await r.json();
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
  const cities = [...new Set(items.map((x) => x.city))];
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
        <Link href="/admin/services/categories">分类管理</Link>
        <Link href="/admin/services/templates">服务模板</Link>
        <span>旅行方案 · 未来</span>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      {cities.map((city) => (
        <section className="service-city" key={city}>
          <h2>
            {city}
            <small>
              {city === "吉隆坡"
                ? "Kuala Lumpur"
                : city === "亚庇"
                  ? "Kota Kinabalu"
                  : "Semporna"}
            </small>
          </h2>
          {[
            ...new Set(
              items.filter((x) => x.city === city).map((x) => x.category),
            ),
          ].map((category) => (
            <div className="service-category-group" key={category}>
              <h3>
                {category}
                <small>
                  {
                    items.filter(
                      (x) => x.city === city && x.category === category,
                    ).length
                  }{" "}
                  个
                </small>
              </h3>
              <div className="service-product-grid">
                {items
                  .filter((x) => x.city === city && x.category === category)
                  .map((x) => (
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
                          {x.category} · {x.city}
                        </small>
                        <h4>{x.nameZh}</h4>
                        <p>{x.subtitleZh || "副标题待填写"}</p>
                        <nav>
                          <Link href={`/admin/services/${x.id}`}>编辑</Link>
                          <a href={`/services/item/${x.slug}`} target="_blank">
                            预览
                          </a>
                          <button onClick={() => copy(x)}>复制</button>
                          <button
                            onClick={() =>
                              update(
                                x,
                                x.status === "published"
                                  ? "hidden"
                                  : "published",
                              )
                            }
                          >
                            {x.status === "published" ? "隐藏" : "上线"}
                          </button>
                        </nav>
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </>
  );
}
