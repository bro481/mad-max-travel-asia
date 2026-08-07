"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ServiceCategory } from "../../../../db/services";
export default function Categories() {
  const [items, setItems] = useState<ServiceCategory[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then(setItems);
  }, []);
  const save = async (x: ServiceCategory) => {
    setNotice("保存中…");
    const r = await fetch(`/api/admin/services/${x.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(x),
    });
    setNotice(r.ok ? "✓ 分类已保存" : "保存失败");
  };
  return (
    <>
      <div className="admin-head">
        <div>
          <p>当地服务</p>
          <h1>分类管理</h1>
          <span>控制前台分类名称、顺序和显示状态。</span>
        </div>
      </div>
      <div className="service-subnav">
        <Link href="/admin/services">服务列表</Link>
        <Link className="active" href="/admin/services/categories">
          分类管理
        </Link>
        <Link href="/admin/services/templates">服务模板</Link>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <div className="category-manage">
        {items.map((x, i) => (
          <article key={x.id}>
            <input
              value={x.nameZh}
              onChange={(e) =>
                setItems((a) =>
                  a.map((y, n) =>
                    n === i ? { ...y, nameZh: e.target.value } : y,
                  ),
                )
              }
            />
            <input
              value={x.nameEn}
              onChange={(e) =>
                setItems((a) =>
                  a.map((y, n) =>
                    n === i ? { ...y, nameEn: e.target.value } : y,
                  ),
                )
              }
            />
            <label>
              <input
                type="checkbox"
                checked={x.visible}
                onChange={(e) =>
                  setItems((a) =>
                    a.map((y, n) =>
                      n === i ? { ...y, visible: e.target.checked } : y,
                    ),
                  )
                }
              />{" "}
              前台显示
            </label>
            <button onClick={() => save(x)}>保存</button>
          </article>
        ))}
      </div>
    </>
  );
}
