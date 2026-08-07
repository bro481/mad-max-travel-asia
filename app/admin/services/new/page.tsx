"use client";
import { useState } from "react";
const types = [
  ["🚗", "交通接送", "交通服务"],
  ["🚙", "私人包车", "包车服务"],
  ["🌆", "城市体验", "城市体验"],
  ["🗺", "一日路线", "一日路线"],
  ["🏝", "海岛体验", "海岛体验"],
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
          <h1>创建当地服务</h1>
          <span>先选择类型，编辑器会显示对应的流程、路线或时间线。</span>
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
                ? "机场与点对点接送"
                : type === "私人包车"
                  ? "多个路线方案"
                  : type.includes("体验")
                    ? "时间线行程编辑器"
                    : "小行程编辑器"}
            </small>
            <i>开始创建 →</i>
          </button>
        ))}
      </div>
    </>
  );
}
