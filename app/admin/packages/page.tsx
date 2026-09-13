"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { TravelPackage, TravelPackageDay } from "../../../db/packages";

const emptyDay: TravelPackageDay = { titleZh: "", titleEn: "", descriptionZh: "", descriptionEn: "" };

const emptyPackage: TravelPackage = {
  id: 0,
  slug: "",
  nameZh: "未命名套餐",
  nameEn: "Untitled Package",
  days: 4,
  nights: 3,
  cityComboZh: "",
  cityComboEn: "",
  summaryZh: "",
  summaryEn: "",
  coverImage: "",
  startingPrice: 0,
  peakPrice: null,
  itinerary: [{ ...emptyDay }],
  includes: ["行程规划", "当地中文沟通协助"],
  excludes: ["机票", "个人消费"],
  accommodationNoteZh: "",
  accommodationNoteEn: "",
  transferNoteZh: "",
  transferNoteEn: "",
  notesZh: "",
  notesEn: "",
  priceNoteZh: "价格为参考起价，不含机票，旺季和节假日价格可能调整。",
  priceNoteEn: "Prices are starting references, excluding flights. Peak dates may vary.",
  status: "draft",
  sortOrder: 99,
  updatedAt: "",
};

export default function AdminPackagesPage() {
  const [items, setItems] = useState<TravelPackage[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [draft, setDraft] = useState<TravelPackage>(emptyPackage);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/packages", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) return;
        const next = Array.isArray(data) ? data : [];
        setItems(next);
        const first = next[0];
        if (first) {
          setSelectedId(first.id);
          setDraft(first);
        }
      })
      .catch(() => setMessage("套餐数据加载失败"))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedId === "new") setDraft(emptyPackage);
    else if (selected) setDraft(selected);
  }, [selected, selectedId]);

  const setField = <K extends keyof TravelPackage>(key: K, value: TravelPackage[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const uploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("files", file);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "上传失败");
      setField("coverImage", data.urls?.[0] || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const isNew = selectedId === "new";
      const response = await fetch(isNew ? "/api/admin/packages" : `/api/admin/packages/${selectedId}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");
      const refreshed = await fetch("/api/admin/packages", { cache: "no-store" }).then((r) => r.json());
      setItems(Array.isArray(refreshed) ? refreshed : []);
      if (isNew) setSelectedId(data.id);
      setMessage("已保存，前台套餐页会同步更新。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (selectedId === "new") return;
    if (!confirm("确定删除这个套餐吗？")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/packages/${selectedId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      const next = items.filter((item) => item.id !== selectedId);
      setItems(next);
      setSelectedId(next[0]?.id || "new");
      setMessage("已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-packages-page">
      <div className="admin-page-top">
        <div>
          <p>新增模块</p>
          <h1>省心套餐</h1>
          <span>按天数管理套餐，前台会自动归类到 4 / 5 / 6 / 7 / 8 天。</span>
        </div>
        <div>
          <a className="admin-secondary" href="/packages" target="_blank">查看前台</a>
          <button className="admin-secondary" onClick={() => setSelectedId("new")}>新增套餐</button>
          <button className="admin-primary" onClick={save} disabled={saving}>{saving ? "保存中..." : "保存套餐"}</button>
        </div>
      </div>

      {message && <div className="admin-inline-message">{message}</div>}
      {loading ? <p>正在加载套餐...</p> : (
        <div className="admin-package-editor">
          <aside className="admin-package-list">
            {items.map((item) => (
              <button key={item.id} className={selectedId === item.id ? "active" : ""} onClick={() => setSelectedId(item.id)}>
                <img src={item.coverImage || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=500&q=80"} alt="" />
                <span>
                  <b>{item.nameZh}</b>
                  <small>{item.days}天{item.nights}晚 · ¥ {item.startingPrice || 0} 起 · {item.status === "published" ? "上线" : "草稿"}</small>
                </span>
              </button>
            ))}
          </aside>

          <section className="admin-package-form">
            <h2>{selectedId === "new" ? "新增套餐" : draft.nameZh}</h2>
            <div className="admin-form-grid">
              <label><span>中文名称</span><input value={draft.nameZh} onChange={(event) => setField("nameZh", event.target.value)} /></label>
              <label><span>英文名称</span><input value={draft.nameEn} onChange={(event) => setField("nameEn", event.target.value)} /></label>
              <label><span>Slug</span><input value={draft.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="保存新套餐时可留空自动生成" /></label>
              <label><span>状态</span><select value={draft.status} onChange={(event) => setField("status", event.target.value as TravelPackage["status"])}><option value="draft">草稿</option><option value="published">上线</option></select></label>
              <label><span>天数</span><input type="number" min={1} value={draft.days} onChange={(event) => setField("days", Number(event.target.value))} /></label>
              <label><span>晚数</span><input type="number" min={0} value={draft.nights} onChange={(event) => setField("nights", Number(event.target.value))} /></label>
              <label><span>排序</span><input type="number" value={draft.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></label>
              <label><span>参考起价 ¥</span><input type="number" min={0} value={draft.startingPrice} onChange={(event) => setField("startingPrice", Number(event.target.value))} /></label>
              <label><span>中文城市组合</span><input value={draft.cityComboZh} onChange={(event) => setField("cityComboZh", event.target.value)} /></label>
              <label><span>英文城市组合</span><input value={draft.cityComboEn} onChange={(event) => setField("cityComboEn", event.target.value)} /></label>
              <label><span>中文列表简介</span><input value={draft.summaryZh} onChange={(event) => setField("summaryZh", event.target.value)} /></label>
              <label><span>英文列表简介</span><input value={draft.summaryEn} onChange={(event) => setField("summaryEn", event.target.value)} /></label>
            </div>
            <label className="admin-cover-field">
              <span>封面图</span>
              <input value={draft.coverImage} onChange={(event) => setField("coverImage", event.target.value)} placeholder="图片 URL 或上传后自动填入" />
              <input type="file" accept="image/*" onChange={uploadCover} />
              {draft.coverImage && <img src={draft.coverImage} alt="" />}
            </label>

            <PackageArray title="套餐包含" value={draft.includes} onChange={(value) => setField("includes", value)} />
            <PackageArray title="不包含" value={draft.excludes} onChange={(value) => setField("excludes", value)} />

            <h3>每日行程</h3>
            <div className="admin-itinerary-list">
              {draft.itinerary.map((day, index) => (
                <div className="admin-itinerary-item" key={index}>
                  <strong>DAY {String(index + 1).padStart(2, "0")}</strong>
                  <input placeholder="中文标题" value={day.titleZh} onChange={(event) => setItinerary(index, "titleZh", event.target.value, draft, setField)} />
                  <input placeholder="英文标题" value={day.titleEn} onChange={(event) => setItinerary(index, "titleEn", event.target.value, draft, setField)} />
                  <textarea placeholder="中文说明" value={day.descriptionZh} onChange={(event) => setItinerary(index, "descriptionZh", event.target.value, draft, setField)} />
                  <textarea placeholder="英文说明" value={day.descriptionEn} onChange={(event) => setItinerary(index, "descriptionEn", event.target.value, draft, setField)} />
                  <button type="button" onClick={() => setField("itinerary", draft.itinerary.filter((_, i) => i !== index))}>删除这天</button>
                </div>
              ))}
              <button type="button" onClick={() => setField("itinerary", [...draft.itinerary, { ...emptyDay }])}>+ 增加一天</button>
            </div>

            <div className="admin-form-grid">
              <label><span>住宿说明（中文）</span><textarea value={draft.accommodationNoteZh} onChange={(event) => setField("accommodationNoteZh", event.target.value)} /></label>
              <label><span>Accommodation note</span><textarea value={draft.accommodationNoteEn} onChange={(event) => setField("accommodationNoteEn", event.target.value)} /></label>
              <label><span>接送安排（中文）</span><textarea value={draft.transferNoteZh} onChange={(event) => setField("transferNoteZh", event.target.value)} /></label>
              <label><span>Transfer note</span><textarea value={draft.transferNoteEn} onChange={(event) => setField("transferNoteEn", event.target.value)} /></label>
              <label><span>注意事项（中文）</span><textarea value={draft.notesZh} onChange={(event) => setField("notesZh", event.target.value)} /></label>
              <label><span>Notes</span><textarea value={draft.notesEn} onChange={(event) => setField("notesEn", event.target.value)} /></label>
              <label><span>价格说明（中文）</span><textarea value={draft.priceNoteZh} onChange={(event) => setField("priceNoteZh", event.target.value)} /></label>
              <label><span>Price note</span><textarea value={draft.priceNoteEn} onChange={(event) => setField("priceNoteEn", event.target.value)} /></label>
            </div>
            {selectedId !== "new" && <button className="admin-danger" type="button" onClick={remove}>删除套餐</button>}
          </section>
        </div>
      )}
    </div>
  );
}

function setItinerary(
  index: number,
  key: keyof TravelPackageDay,
  value: string,
  draft: TravelPackage,
  setField: <K extends keyof TravelPackage>(key: K, value: TravelPackage[K]) => void,
) {
  setField("itinerary", draft.itinerary.map((day, i) => (i === index ? { ...day, [key]: value } : day)));
}

function PackageArray({ title, value, onChange }: { title: string; value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="admin-package-array">
      <h3>{title}</h3>
      {value.map((item, index) => (
        <label key={index}>
          <input value={item} onChange={(event) => onChange(value.map((x, i) => (i === index ? event.target.value : x)))} />
          <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))}>删除</button>
        </label>
      ))}
      <button type="button" onClick={() => onChange([...value, ""])}>+ 添加</button>
    </div>
  );
}
