"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ServiceCategory } from "../../../../db/services";
import type { ServiceItem } from "../../../../db/service-items";

const blankCategory: Partial<ServiceCategory> = {
  nameZh: "",
  nameEn: "",
  icon: "✦",
  sortOrder: 99,
  visible: true,
};

export default function Categories() {
  const [items, setItems] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [editing, setEditing] = useState<Partial<ServiceCategory> | null>(null);
  const [notice, setNotice] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const load = () =>
    Promise.all([
      fetch("/api/admin/services").then(async (r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/service-items").then(async (r) => (r.ok ? r.json() : [])),
    ]).then(([categories, serviceItems]) => {
      setItems(Array.isArray(categories) ? categories : []);
      setServices(Array.isArray(serviceItems) ? serviceItems : []);
    });

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    services
      .filter((service) => service.status === "published")
      .forEach((service) =>
        map.set(service.categoryId || 0, (map.get(service.categoryId || 0) || 0) + 1),
      );
    return map;
  }, [services]);

  const save = async () => {
    if (!editing?.nameZh) {
      setNotice("请先填写分类中文名称。");
      return;
    }
    setNotice("保存中…");
    const isNew = !editing.id;
    const r = await fetch(isNew ? "/api/admin/services" : `/api/admin/services/${editing.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setNotice(r.ok ? "✓ 分类已保存" : "保存失败，请刷新后重试");
    if (r.ok) {
      setEditing(null);
      load();
    }
  };

  const remove = async (item: ServiceCategory) => {
    if ((counts.get(item.id) || 0) > 0) {
      setNotice(`当前分类关联 ${counts.get(item.id)} 个已发布服务，请先移动这些服务到其他分类。`);
      return;
    }
    if (!confirm(`确认删除「${item.nameZh}」？`)) return;
    const r = await fetch(`/api/admin/services/${item.id}`, { method: "DELETE" });
    setNotice(r.ok ? "✓ 已删除分类" : "删除失败");
    if (r.ok) load();
  };

  const quickHide = async (item: ServiceCategory) => {
    const r = await fetch(`/api/admin/services/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, visible: !item.visible }),
    });
    setNotice(r.ok ? "✓ 状态已更新" : "状态更新失败");
    if (r.ok) load();
  };

  const swapOrder = async (targetId: number) => {
    if (!draggingId || draggingId === targetId) return;
    const source = items.find((item) => item.id === draggingId);
    const target = items.find((item) => item.id === targetId);
    setDraggingId(null);
    if (!source || !target) return;
    const nextSource = { ...source, sortOrder: target.sortOrder || target.id };
    const nextTarget = { ...target, sortOrder: source.sortOrder || source.id };
    await Promise.all([
      fetch(`/api/admin/services/${nextSource.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextSource) }),
      fetch(`/api/admin/services/${nextTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nextTarget) }),
    ]);
    setNotice("✓ 分类排序已更新");
    load();
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <p>当地服务</p>
          <h1>分类管理</h1>
          <span>控制前台服务页里的“交通服务 / 海岛体验 / 自然体验”等分组；空分类会在前台自动隐藏。</span>
        </div>
        <button className="admin-primary" onClick={() => setEditing(blankCategory)}>
          ＋ 新增分类
        </button>
      </div>
      <div className="service-subnav">
        <Link href="/admin/services">服务列表</Link>
        <Link className="active" href="/admin/services/categories">
          分类管理
        </Link>
        <Link href="/admin/settings">页面设置</Link>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <section className="category-table-card">
        <div className="category-table row head">
          <span>拖拽</span>
          <span>分类</span>
          <span>英文</span>
          <span>前台状态</span>
          <span>状态</span>
          <span>操作</span>
        </div>
        {[...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id).map((item) => {
          const publishedCount = counts.get(item.id) || 0;
          return (
          <div
            className={`category-table row ${draggingId === item.id ? "dragging" : ""}`}
            draggable
            key={item.id}
            onDragStart={() => setDraggingId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => swapOrder(item.id)}
          >
            <span className="drag-handle">≡</span>
            <b>
              <i>{item.icon}</i>
              {item.nameZh}
            </b>
            <span>{item.nameEn}</span>
            <span>{publishedCount ? `${publishedCount} 个已发布服务` : "0 个已发布服务 · 前台自动隐藏"}</span>
            <span className={item.visible ? "status-on" : "status-off"}>
              {item.visible ? "显示" : "隐藏"}
            </span>
            <nav>
              <button onClick={() => setEditing(item)}>编辑</button>
              <button onClick={() => quickHide(item)}>{item.visible ? "隐藏" : "显示"}</button>
              <button onClick={() => remove(item)}>删除</button>
            </nav>
          </div>
        )})}
      </section>
      {editing && (
        <div className="destination-dialog-backdrop">
          <div className="destination-dialog category-dialog">
            <button className="dialog-close" onClick={() => setEditing(null)}>
              ×
            </button>
            <h2>{editing.id ? "编辑分类" : "新增分类"}</h2>
            <div className="destination-form-grid">
              <label>
                <span>中文名称</span>
                <input value={editing.nameZh || ""} onChange={(e) => setEditing({ ...editing, nameZh: e.target.value })} placeholder="交通服务" />
              </label>
              <label>
                <span>英文名称</span>
                <input value={editing.nameEn || ""} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} placeholder="Transport" />
              </label>
              <label>
                <span>小图标</span>
                <input value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="✈️" />
              </label>
              <label>
                <span>排序值</span>
                <input type="number" value={editing.sortOrder || 99} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
                <small>日常请直接拖拽分类排序；这里保留给精确调整。</small>
              </label>
              <label className="destination-wide">
                <span>前台显示</span>
                <select value={editing.visible === false ? "hidden" : "visible"} onChange={(e) => setEditing({ ...editing, visible: e.target.value === "visible" })}>
                  <option value="visible">显示</option>
                  <option value="hidden">隐藏</option>
                </select>
              </label>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setEditing(null)}>取消</button>
              <button className="admin-primary" onClick={save}>
                保存分类
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
