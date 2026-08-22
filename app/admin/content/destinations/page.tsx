"use client";
import { useEffect, useState } from "react";
import type { DestinationRecord } from "../../../../db/destinations";

type DestinationWithCounts = DestinationRecord & {
  propertyCount: number;
  publishedPropertyCount: number;
  serviceCount: number;
  publishedServiceCount: number;
};

const blank: Omit<DestinationRecord, "id" | "updatedAt"> = {
  slug: "",
  nameZh: "",
  nameEn: "",
  introZh: "",
  introEn: "",
  useForProperties: true,
  useForServices: true,
  propertySort: 99,
  serviceSort: 99,
  onlyShowWithContent: true,
  status: "visible",
};

export default function DestinationsAdmin() {
  const [items, setItems] = useState<DestinationWithCounts[]>([]);
  const [editing, setEditing] = useState<DestinationRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch("/api/admin/destinations")
      .then(async (response) => {
        if (response.status === 401) {
          location.href = "/signin-with-chatgpt?return_to=%2Fadmin%2Fcontent%2Fdestinations";
          return [];
        }
        const text = await response.text();
        return text ? JSON.parse(text) : [];
      })
      .then(setItems);

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing?.nameZh.trim()) {
      setNotice("请先填写中文名称。");
      return;
    }
    setBusy(true);
    const creating = !editing.id;
    const response = await fetch(creating ? "/api/admin/destinations" : `/api/admin/destinations/${editing.id}`, {
      method: creating ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setBusy(false);
    if (!response.ok) {
      const text = await response.text();
      setNotice(text || "保存失败，请刷新后重试。");
      return;
    }
    setNotice("✓ 目的地已保存，房源和当地服务会读取这套数据。");
    setEditing(null);
    load();
  };

  const remove = async (item: DestinationWithCounts) => {
    if (!window.confirm(`确认删除「${item.nameZh}」？如果已关联内容，系统会阻止删除。`)) return;
    const response = await fetch(`/api/admin/destinations/${item.id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setNotice(result.error || "删除失败：该目的地可能仍有关联内容。");
      return;
    }
    setNotice("✓ 已删除目的地。");
    load();
  };

  const toggleHidden = async (item: DestinationWithCounts) => {
    await fetch(`/api/admin/destinations/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status: item.status === "visible" ? "hidden" : "visible" }),
    });
    load();
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <p>内容管理</p>
          <h1>目的地管理</h1>
          <span>房源和当地服务共用同一套目的地，不再在前端写死城市。</span>
        </div>
        <button className="admin-primary" onClick={() => setEditing({ ...blank, id: 0, updatedAt: "" })}>＋ 新增目的地</button>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <section className="destination-admin-card">
        <div className="destination-table header">
          <span>排序</span><span>目的地</span><span>用途</span><span>已关联</span><span>显示条件</span><span>状态</span><span>操作</span>
        </div>
        {items.map((item) => (
          <div className="destination-table" key={item.id}>
            <span><b>房源 {item.propertySort}</b><small>服务 {item.serviceSort}</small></span>
            <span><b>{item.nameZh}</b><small>{item.nameEn}</small><small>{item.slug}</small></span>
            <span>{item.useForProperties ? "房源 ✓" : "房源 —"}<small>{item.useForServices ? "服务 ✓" : "服务 —"}</small></span>
            <span>{item.propertyCount} 房源<small>{item.serviceCount} 服务</small></span>
            <span>{item.onlyShowWithContent ? "有上线内容才显示" : "始终显示"}<small>上线：{item.publishedPropertyCount} 房源 / {item.publishedServiceCount} 服务</small></span>
            <span><i className={item.status}>{item.status === "visible" ? "显示" : "隐藏"}</i></span>
            <span className="destination-actions">
              <button onClick={() => setEditing(item)}>编辑</button>
              <button onClick={() => toggleHidden(item)}>{item.status === "visible" ? "隐藏" : "显示"}</button>
              <button className="danger" onClick={() => remove(item)}>删除</button>
            </span>
          </div>
        ))}
      </section>

      {editing && (
        <div className="admin-modal-layer">
          <section className="admin-dialog destination-dialog">
            <button className="dialog-close" onClick={() => setEditing(null)}>×</button>
            <h2>{editing.id ? "编辑目的地" : "新增目的地"}</h2>
            <div className="destination-form-grid">
              <Field label="中文名称"><input value={editing.nameZh} onChange={(e) => setEditing({ ...editing, nameZh: e.target.value })} placeholder="槟城" /></Field>
              <Field label="英文名称"><input value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} placeholder="Penang" /></Field>
              <Field label="slug（不填则自动生成）"><input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="penang" /></Field>
              <Field label="状态"><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as DestinationRecord["status"] })}><option value="visible">显示</option><option value="hidden">隐藏</option></select></Field>
              <Field label="中文简介"><textarea rows={3} value={editing.introZh} onChange={(e) => setEditing({ ...editing, introZh: e.target.value })} /></Field>
              <Field label="英文简介"><textarea rows={3} value={editing.introEn} onChange={(e) => setEditing({ ...editing, introEn: e.target.value })} /></Field>
              <label className="toggle-line"><input type="checkbox" checked={editing.useForProperties} onChange={(e) => setEditing({ ...editing, useForProperties: e.target.checked })} />用于房源</label>
              <label className="toggle-line"><input type="checkbox" checked={editing.useForServices} onChange={(e) => setEditing({ ...editing, useForServices: e.target.checked })} />用于当地服务</label>
              <Field label="房源排序"><input type="number" value={editing.propertySort} onChange={(e) => setEditing({ ...editing, propertySort: Number(e.target.value) })} /></Field>
              <Field label="服务排序"><input type="number" value={editing.serviceSort} onChange={(e) => setEditing({ ...editing, serviceSort: Number(e.target.value) })} /></Field>
              <label className="toggle-line wide"><input type="checkbox" checked={editing.onlyShowWithContent} onChange={(e) => setEditing({ ...editing, onlyShowWithContent: e.target.checked })} />仅在存在已上线内容时显示</label>
            </div>
            <p className="dialog-note">“全部”不是后台目的地，会由前端固定显示。隐藏目的地不会删除已关联房源和服务。</p>
            <div className="dialog-actions">
              <button onClick={() => setEditing(null)}>取消</button>
              <button className="admin-primary" onClick={save} disabled={busy}>{busy ? "保存中…" : "保存目的地"}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="editor-field"><span>{label}</span>{children}</label>;
}
