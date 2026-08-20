"use client";
import { useState } from "react";
const types = [
  ["✈", "交通接送", "接送机"],
  ["🚗", "私人包车", "包车"],
  ["🏝", "当地体验", "当地体验 / 一日游"],
];
export default function NewService() {
  const [busy, setBusy] = useState(false);
  const create = async (type: string, category: string) => {
    setBusy(true);
    const r = await fetch("/api/admin/service-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        category,
        nameZh: `新建${type}`,
        nameEn: `New ${type}`,
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
          <h1>新建什么？</h1>
          <span>先选择业务类型，接下来只显示这类服务真正需要的字段。</span>
        </div>
      </div>
      <div className="service-type-picker">
        {types.map(([icon, type, category]) => (
          <button
            disabled={busy}
            onClick={() => create(type, category)}
            key={type}
          >
            <span>{icon}</span>
            <b>{type}</b>
            <small>
              {type === "交通接送"
                ? "机场、接送区域与车型价格"
                : type === "私人包车"
                  ? "路线、景点图片与车型"
                  : "图库、行程、包含与注意事项"}
            </small>
            <i>开始创建 →</i>
          </button>
        ))}
      </div>
      <Link className="gift-create-entry" href="/admin/gifts">🎁 新建伴手礼 / 商品 →</Link>
    </>
  );
}
