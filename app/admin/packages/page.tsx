"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { TravelPackage, TravelPackageDay, TravelPackageSchedule } from "../../../db/packages";
import type { DestinationRecord } from "../../../db/destinations";
import type { PropertyRecord } from "../../../db/properties";
import type { ServiceItem } from "../../../db/service-items";

type AdminTab = "basic" | "itinerary" | "fees" | "english";
type ImageTarget =
  | { type: "cover" }
  | { type: "gallery"; index?: number }
  | { type: "day"; dayIndex: number }
  | { type: "slot"; dayIndex: number; slotIndex: number };

const nodeTypes = [
  { value: "transport", label: "交通", icon: "🚗" },
  { value: "stay", label: "住宿", icon: "🏨" },
  { value: "experience", label: "体验", icon: "🌴" },
  { value: "food", label: "餐饮", icon: "🍴" },
  { value: "flight", label: "航班", icon: "✈️" },
  { value: "free", label: "自由活动", icon: "☀️" },
  { value: "note", label: "普通内容", icon: "📍" },
] as const;

const tagOptions = ["中文服务", "私人接送", "精选住宿", "家庭友好", "轻松行程", "海岛体验"];
const includeTemplate = ["住宿", "行程内接送", "行程所列体验", "中文旅行顾问服务"];
const excludeTemplate = ["往返机票", "未列明餐食", "个人消费", "旅游保险"];
const defaultNotes = {
  accommodation: "酒店及项目以最终确认预订时实时库存为准。",
  transfer: "行程可能根据天气、交通及当地实际情况调整。",
  price: "旺季和节假日价格可能调整。",
  notes: "具体安排以顾问最终确认版本为准。",
};

const emptySchedule: TravelPackageSchedule = {
  time: "",
  titleZh: "",
  titleEn: "",
  descriptionZh: "",
  descriptionEn: "",
  image: "",
  nodeType: "note",
  sourceType: "manual",
};
const emptyDay: TravelPackageDay = { titleZh: "", titleEn: "", descriptionZh: "", descriptionEn: "", coverImage: "", schedule: [] };

const emptyPackage: TravelPackage = {
  id: 0,
  slug: "",
  nameZh: "未命名套餐",
  nameEn: "",
  days: 4,
  nights: 3,
  cityComboZh: "",
  cityComboEn: "",
  summaryZh: "",
  summaryEn: "",
  heroTextZh: "",
  heroTextEn: "",
  subtitleZh: "",
  subtitleEn: "",
  tags: ["中文服务", "私人接送", "精选住宿"],
  galleryImages: [],
  coverImage: "",
  startingPrice: 0,
  peakPrice: null,
  itinerary: [{ ...emptyDay }],
  includes: includeTemplate,
  excludes: excludeTemplate,
  accommodationNoteZh: "",
  accommodationNoteEn: "",
  transferNoteZh: "",
  transferNoteEn: "",
  notesZh: "",
  notesEn: "",
  priceNoteZh: "价格为参考起价，不含机票，旺季和节假日价格可能调整。",
  priceNoteEn: "",
  status: "draft",
  sortOrder: 99,
  updatedAt: "",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function money(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function compactName(item: TravelPackage) {
  return item.cityComboZh || item.nameZh || "未命名套餐";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseCities(item: TravelPackage, destinations: DestinationRecord[]) {
  const names = item.cityComboZh.split("+").map((part) => part.trim()).filter(Boolean);
  return names.map((name) => destinations.find((destination) => destination.nameZh === name)).filter((x): x is DestinationRecord => Boolean(x));
}

function completionIssues(item: TravelPackage) {
  const issues: string[] = [];
  if (!item.nameZh.trim()) issues.push("缺套餐名称");
  if (!item.cityComboZh.trim()) issues.push("未选择城市");
  if (!item.coverImage.trim()) issues.push("缺封面图");
  if (!item.startingPrice) issues.push("未设置起价");
  if (!item.includes.filter(Boolean).length) issues.push("缺费用包含");
  if (!item.excludes.filter(Boolean).length) issues.push("缺费用不包含");
  item.itinerary.forEach((day, index) => {
    if (!day.titleZh.trim()) issues.push(`DAY ${String(index + 1).padStart(2, "0")} 缺标题`);
    if (!day.coverImage?.trim()) issues.push(`DAY ${String(index + 1).padStart(2, "0")} 缺主图`);
  });
  return issues;
}

export default function AdminPackagesPage() {
  const [items, setItems] = useState<TravelPackage[]>([]);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [draft, setDraft] = useState<TravelPackage>(() => clone(emptyPackage));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("basic");
  const [activeDay, setActiveDay] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [otherNotesOpen, setOtherNotesOpen] = useState(false);
  const [priceTiersOpen, setPriceTiersOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [dragDay, setDragDay] = useState<number | null>(null);

  const selected = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);
  const selectedCities = useMemo(() => parseCities(draft, destinations), [draft, destinations]);
  const issues = useMemo(() => completionIssues(draft), [draft]);
  const completion = Math.max(0, Math.round(((8 - Math.min(issues.length, 8)) / 8) * 100));
  const hasChanges = useMemo(() => {
    if (selectedId === "new") return JSON.stringify(draft) !== JSON.stringify(emptyPackage);
    return selected ? JSON.stringify(draft) !== JSON.stringify(selected) : false;
  }, [draft, selected, selectedId]);
  const filteredItems = useMemo(() => items.filter((item) => {
    const keyword = search.trim().toLowerCase();
    const matchesSearch = !keyword || [item.nameZh, item.nameEn, item.cityComboZh, item.cityComboEn].some((value) => value.toLowerCase().includes(keyword));
    const matchesFilter = filter === "all" || (filter === "draft" ? item.status !== "published" : item.days === Number(filter));
    return matchesSearch && matchesFilter;
  }), [filter, items, search]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/admin/packages", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/destinations?view=options", { cache: "no-store" }).then((response) => response.json()).catch(() => []),
      fetch("/api/admin/properties", { cache: "no-store" }).then((response) => response.json()).catch(() => []),
      fetch("/api/admin/service-items", { cache: "no-store" }).then((response) => response.json()).catch(() => []),
    ])
      .then(([packageData, destinationData, propertyData, serviceData]) => {
        if (!mounted) return;
        const next = Array.isArray(packageData) ? packageData : [];
        setItems(next);
        setDestinations(Array.isArray(destinationData) ? destinationData : []);
        setProperties(Array.isArray(propertyData) ? propertyData : []);
        setServices(Array.isArray(serviceData) ? serviceData : []);
        const first = next[0];
        if (first) {
          setSelectedId(first.id);
          setDraft(clone(first));
        }
      })
      .catch(() => setMessage("套餐数据加载失败"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const resetEditorChrome = () => {
    setActiveTab("basic");
    setActiveDay(0);
    setMenuOpen(false);
  };

  const choosePackage = (item: TravelPackage) => {
    setSelectedId(item.id);
    setDraft(clone(item));
    resetEditorChrome();
  };

  const startNewPackage = () => {
    setSelectedId("new");
    setDraft(clone(emptyPackage));
    resetEditorChrome();
  };

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!hasChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  const setField = <K extends keyof TravelPackage>(key: K, value: TravelPackage[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateDraft = (updater: (current: TravelPackage) => TravelPackage) => setDraft((current) => updater(clone(current)));

  const updateCities = (cities: DestinationRecord[]) => {
    setDraft((current) => {
      const cityComboZh = cities.map((city) => city.nameZh).join(" + ");
      const cityComboEn = cities.map((city) => city.nameEn).join(" + ");
      const nameZh = !current.nameZh || current.nameZh === current.cityComboZh || current.nameZh === "未命名套餐" ? cityComboZh || current.nameZh : current.nameZh;
      const nameEn = !current.nameEn || current.nameEn === current.cityComboEn ? cityComboEn : current.nameEn;
      return { ...current, cityComboZh, cityComboEn, nameZh, nameEn };
    });
  };

  const applyImage = (target: ImageTarget, url: string) => {
    updateDraft((current) => {
      if (target.type === "cover") return { ...current, coverImage: url, galleryImages: Array.from(new Set([url, ...current.galleryImages])) };
      if (target.type === "gallery") {
        const galleryImages = [...current.galleryImages];
        if (typeof target.index === "number") galleryImages[target.index] = url;
        else galleryImages.push(url);
        return { ...current, galleryImages: galleryImages.filter(Boolean) };
      }
      const itinerary = current.itinerary.map((day, dayIndex) => {
        if (dayIndex !== target.dayIndex) return day;
        if (target.type === "day") return { ...day, coverImage: url };
        return { ...day, schedule: (day.schedule || []).map((slot, slotIndex) => (slotIndex === target.slotIndex ? { ...slot, image: url } : slot)) };
      });
      return { ...current, itinerary };
    });
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, target: ImageTarget) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const form = new FormData();
    form.append("files", file);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "上传失败");
      const url = data.urls?.[0] || "";
      if (!url) throw new Error("上传后没有返回图片地址");
      applyImage(target, url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setSaving(false);
    }
  };

  const normalizedDraft = (status?: TravelPackage["status"]) => {
    const nameEn = draft.nameEn || draft.cityComboEn || draft.nameZh || "Untitled Package";
    const slug = draft.slug || slugify(nameEn) || slugify(draft.cityComboEn) || `package-${Date.now()}`;
    return {
      ...draft,
      slug,
      nameEn,
      nights: Math.max(0, Number(draft.nights ?? draft.days - 1)),
      status: status || draft.status,
      galleryImages: draft.galleryImages.filter(Boolean),
      includes: draft.includes.filter(Boolean),
      excludes: draft.excludes.filter(Boolean),
      itinerary: draft.itinerary.map((day) => ({
        ...day,
        schedule: (day.schedule || []).filter((slot) => slot.titleZh || slot.titleEn || slot.time || slot.image),
      })),
    };
  };

  const save = async (status?: TravelPackage["status"]) => {
    setSaving(true);
    setMessage("");
    const payload = normalizedDraft(status);
    try {
      const isNew = selectedId === "new";
      const response = await fetch(isNew ? "/api/admin/packages" : `/api/admin/packages/${selectedId}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");
      const refreshed = await fetch("/api/admin/packages", { cache: "no-store" }).then((r) => r.json());
      const nextItems = Array.isArray(refreshed) ? refreshed : [];
      const nextId = isNew ? data.id : selectedId;
      setItems(nextItems);
      setSelectedId(nextId);
      const saved = nextItems.find((item) => item.id === nextId);
      if (saved) setDraft(clone(saved));
      setMessage(status === "published" ? "已保存并上线。" : "已保存为草稿。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (selectedId === "new") return;
    if (!confirm(`确定删除「${compactName(draft)}」吗？\n删除后无法恢复。`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/packages/${selectedId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      const next = items.filter((item) => item.id !== selectedId);
      setItems(next);
      if (next[0]) choosePackage(next[0]);
      else startNewPackage();
      setMessage("已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  const copyPackage = async () => {
    if (selectedId === "new") return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/packages/${selectedId}/copy`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "复制失败");
      const refreshed = await fetch("/api/admin/packages", { cache: "no-store" }).then((r) => r.json());
      const nextItems = Array.isArray(refreshed) ? refreshed : [];
      setItems(nextItems);
      setSelectedId(data.id);
      const copied = nextItems.find((item) => item.id === data.id);
      if (copied) setDraft(clone(copied));
      resetEditorChrome();
      setMessage("已复制为草稿套餐，可以直接修改城市、天数、行程和价格。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "复制失败");
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (index: number, patch: Partial<TravelPackageDay>) => {
    updateDraft((current) => ({ ...current, itinerary: current.itinerary.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)) }));
  };
  const updateSlot = (dayIndex: number, slotIndex: number, patch: Partial<TravelPackageSchedule>) => {
    updateDraft((current) => ({
      ...current,
      itinerary: current.itinerary.map((day, index) =>
        index === dayIndex
          ? { ...day, schedule: (day.schedule || []).map((slot, i) => (i === slotIndex ? { ...slot, ...patch } : slot)) }
          : day,
      ),
    }));
  };
  const moveDay = (from: number, to: number) => {
    if (to < 0 || to >= draft.itinerary.length || from === to) return;
    updateDraft((current) => {
      const itinerary = [...current.itinerary];
      const [day] = itinerary.splice(from, 1);
      itinerary.splice(to, 0, day);
      return { ...current, itinerary };
    });
    setActiveDay(to);
  };

  const sourceServices = services.filter((service) => !draft.cityComboZh || draft.cityComboZh.includes(service.city));
  const sourceProperties = properties.filter((property) => !draft.cityComboZh || draft.cityComboZh.includes(property.city));

  if (loading) return <div className="admin-packages-page"><p>正在加载套餐...</p></div>;

  return (
    <div className="admin-packages-page admin-packages-redesign">
      <div className="package-editor-top">
        <div className="package-editor-title">
          <a href="/admin">← 省心套餐</a>
          <h1>{selectedId === "new" ? "新建省心套餐" : compactName(draft)}</h1>
          <p>{draft.days}天{draft.nights}晚 · ¥{money(draft.startingPrice)}起 · {draft.status === "published" ? "上线" : "草稿"}</p>
        </div>
        <div className="package-editor-actions">
          {hasChanges && <span className="unsaved-dot">● 有未保存修改</span>}
          <button className="admin-secondary" type="button" onClick={() => setPreviewOpen(true)}>预览</button>
          <button className="admin-secondary" type="button" onClick={() => save("draft")} disabled={saving}>{saving ? "保存中..." : "保存草稿"}</button>
          <button className="admin-primary" type="button" onClick={() => save("published")} disabled={saving}>保存并上线</button>
          <div className="package-more-wrap">
            <button className="admin-secondary icon-button" type="button" onClick={() => setMenuOpen((open) => !open)}>•••</button>
            {menuOpen && (
              <div className="package-more-menu">
                <button type="button" onClick={copyPackage} disabled={selectedId === "new" || saving}>复制套餐</button>
                <button type="button" onClick={startNewPackage}>新建套餐</button>
                <button type="button" onClick={() => save("draft")} disabled={saving}>下线</button>
                <button className="danger" type="button" onClick={remove} disabled={selectedId === "new" || saving}>删除套餐</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {message && <div className="admin-inline-message">{message}</div>}

      <div className="admin-package-editor">
        <aside className="admin-package-list">
          <input className="package-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索套餐" />
          <div className="package-list-filters">
            {["all", "4", "5", "6", "draft"].map((value) => (
              <button key={value} className={filter === value ? "active" : ""} type="button" onClick={() => setFilter(value)}>
                {value === "all" ? "全部" : value === "draft" ? "草稿" : `${value}天`}
              </button>
            ))}
          </div>
          {filteredItems.map((item) => (
            <button key={item.id} className={selectedId === item.id ? "active" : ""} type="button" onClick={() => choosePackage(item)}>
              <span>
                <b>{compactName(item)}</b>
                <small>{item.days}天{item.nights}晚 · ¥{money(item.startingPrice)}起</small>
                <em>{item.status === "published" ? "● 上线" : "○ 草稿"}</em>
              </span>
            </button>
          ))}
        </aside>

        <section className="admin-package-form package-workspace">
          <div className="package-completion">
            <strong>完成度 {completion}%</strong>
            <div><span style={{ width: `${completion}%` }} /></div>
            {issues.slice(0, 3).map((issue) => <small key={issue}>⚠ {issue}</small>)}
          </div>

          <nav className="package-editor-tabs" aria-label="套餐编辑区">
            {[
              ["basic", "基本信息"],
              ["itinerary", "每日行程"],
              ["fees", "费用与说明"],
              ["english", "英文"],
            ].map(([key, label]) => (
              <button key={key} className={activeTab === key ? "active" : ""} type="button" onClick={() => setActiveTab(key as AdminTab)}>{label}</button>
            ))}
          </nav>

          {activeTab === "basic" && (
            <div className="package-tab-panel">
              <div className="admin-form-grid">
                <label><span>套餐名称</span><input value={draft.nameZh} onChange={(event) => setField("nameZh", event.target.value)} placeholder="吉隆坡 + 马六甲" /></label>
                <label><span>参考起价</span><div className="price-input"><b>¥</b><input type="number" min={0} value={draft.startingPrice} onChange={(event) => setField("startingPrice", Number(event.target.value))} /><em>/ 人起</em></div></label>
              </div>

              <div className="package-field-block">
                <span>城市</span>
                <div className="city-chip-row">
                  {selectedCities.map((city) => <button key={city.id} type="button" onClick={() => updateCities(selectedCities.filter((item) => item.id !== city.id))}>{city.nameZh} ×</button>)}
                  <select value="" onChange={(event) => {
                    const city = destinations.find((item) => String(item.id) === event.target.value);
                    if (city && !selectedCities.some((item) => item.id === city.id)) updateCities([...selectedCities, city]);
                  }}>
                    <option value="">+ 添加城市</option>
                    {destinations.filter((city) => city.status !== "hidden").map((city) => <option key={city.id} value={city.id}>{city.nameZh}</option>)}
                  </select>
                </div>
                <small>前台自动生成：{draft.cityComboZh || "中文城市组合"} / {draft.cityComboEn || "英文城市组合"}</small>
              </div>

              <div className="admin-form-grid">
                <label><span>天数</span><select value={draft.days} onChange={(event) => {
                  const days = Number(event.target.value);
                  setDraft((current) => ({ ...current, days, nights: Math.max(0, days - 1) }));
                }}>{[3, 4, 5, 6, 7, 8, 9, 10].map((days) => <option key={days} value={days}>{days}天{days - 1}晚</option>)}</select></label>
                <label><span>自定义晚数</span><input type="number" min={0} value={draft.nights} onChange={(event) => setField("nights", Number(event.target.value))} /></label>
                <label className="wide"><span>一句话简介</span><input value={draft.summaryZh} onChange={(event) => setField("summaryZh", event.target.value)} placeholder="城市经典 + 古城慢游，一次体验两种马来西亚。" /></label>
              </div>

              <ImageCard title="封面图" image={draft.coverImage} onFile={(event) => uploadImage(event, { type: "cover" })} helper="上传或从下方已有图片库中设置为封面。" />

              <div className="package-field-block">
                <span>套餐特色</span>
                <div className="tag-picker">
                  {tagOptions.map((tag) => (
                    <button key={tag} className={draft.tags.includes(tag) ? "active" : ""} type="button" onClick={() => setField("tags", draft.tags.includes(tag) ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag])}>{tag}</button>
                  ))}
                  <button type="button" onClick={() => setField("tags", [...draft.tags, "新标签"])}>+ 添加标签</button>
                </div>
                <InlineArray value={draft.tags} onChange={(value) => setField("tags", value)} compact />
              </div>

              <details className="package-collapse" open={galleryOpen} onToggle={(event) => setGalleryOpen(event.currentTarget.open)}>
                <summary>更多图片</summary>
                <div className="gallery-grid-editor">
                  {draft.galleryImages.map((image, index) => (
                    <div key={`${image}-${index}`}>
                      {image ? <img src={image} alt="" /> : <span />}
                      <button type="button" onClick={() => setField("coverImage", image)}>设为封面</button>
                      <button type="button" onClick={() => setField("galleryImages", draft.galleryImages.filter((_, i) => i !== index))}>删除</button>
                      <label>更换<input type="file" accept="image/*" onChange={(event) => uploadImage(event, { type: "gallery", index })} /></label>
                    </div>
                  ))}
                  <label className="gallery-add">+ 上传图片<input type="file" accept="image/*" onChange={(event) => uploadImage(event, { type: "gallery" })} /></label>
                </div>
              </details>

              <details className="package-collapse" open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}>
                <summary>高级设置</summary>
                <div className="admin-form-grid">
                  <label><span>Slug</span><input value={draft.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="默认按英文套餐名自动生成" /></label>
                  <label><span>详情页副标题</span><input value={draft.subtitleZh} onChange={(event) => setField("subtitleZh", event.target.value)} /></label>
                  <label className="wide"><span>Hero 氛围文案</span><textarea value={draft.heroTextZh} onChange={(event) => setField("heroTextZh", event.target.value)} /></label>
                </div>
              </details>
            </div>
          )}

          {activeTab === "itinerary" && (
            <div className="package-tab-panel">
              <div className="day-toolbar">
                <button type="button" onClick={() => setField("itinerary", [...draft.itinerary, { ...emptyDay }])}>+ 增加一天</button>
                <button type="button" disabled>从其他套餐导入</button>
                <small>导入结构已预留，后续可接套餐 Day 复用。</small>
              </div>
              <div className="day-card-list">
                {draft.itinerary.map((day, index) => {
                  const open = activeDay === index;
                  const dayIssues = [!day.titleZh && "缺标题", !day.coverImage && "缺主图"].filter(Boolean);
                  return (
                    <article
                      key={index}
                      className={open ? "day-card open" : "day-card"}
                      draggable
                      onDragStart={() => setDragDay(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => { if (dragDay !== null) moveDay(dragDay, index); setDragDay(null); }}
                    >
                      <button className="day-card-summary" type="button" onClick={() => setActiveDay(open ? -1 : index)}>
                        <b>DAY {String(index + 1).padStart(2, "0")}</b>
                        <span>{day.titleZh || "未命名的一天"}</span>
                        <em>{dayIssues.length ? `⚠ ${dayIssues.join(" / ")}` : "✓"}</em>
                      </button>
                      {open && (
                        <div className="day-card-body">
                          <div className="admin-form-grid">
                            <label><span>主题标题</span><input value={day.titleZh} onChange={(event) => updateDay(index, { titleZh: event.target.value })} placeholder="海岛的一天" /></label>
                            <label><span>城市</span><input value={draft.cityComboZh} readOnly /></label>
                            <label className="wide"><span>副标题</span><input value={day.descriptionZh} onChange={(event) => updateDay(index, { descriptionZh: event.target.value })} placeholder="清澈的海水，治愈的蓝" /></label>
                          </div>
                          <ImageCard title="当天主图" image={day.coverImage || ""} onFile={(event) => uploadImage(event, { type: "day", dayIndex: index })} helper="推荐填写；节点图片只给重点体验使用。" />
                          <ScheduleEditor day={day} dayIndex={index} properties={sourceProperties} services={sourceServices} updateSlot={updateSlot} updateDay={updateDay} uploadImage={uploadImage} />
                          <div className="day-card-actions">
                            <button type="button" onClick={() => moveDay(index, index - 1)}>上移</button>
                            <button type="button" onClick={() => moveDay(index, index + 1)}>下移</button>
                            <button type="button" onClick={() => setField("itinerary", [...draft.itinerary.slice(0, index + 1), clone(day), ...draft.itinerary.slice(index + 1)])}>复制这一天</button>
                            <button type="button" onClick={() => { setField("itinerary", draft.itinerary.filter((_, i) => i !== index)); setActiveDay(Math.max(0, index - 1)); }}>删除这一天</button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "fees" && (
            <div className="package-tab-panel">
              <section className="fee-section"><div><h3>费用包含</h3><button type="button" onClick={() => setField("includes", includeTemplate)}>套用模板：标准省心套餐</button></div><InlineArray value={draft.includes} onChange={(value) => setField("includes", value)} /></section>
              <section className="fee-section"><div><h3>费用不包含</h3><button type="button" onClick={() => setField("excludes", excludeTemplate)}>套用默认</button></div><InlineArray value={draft.excludes} onChange={(value) => setField("excludes", value)} /></section>
              <details className="package-collapse" open={priceTiersOpen} onToggle={(event) => setPriceTiersOpen(event.currentTarget.open)}><summary>人数价格高级设置</summary><div className="price-tier-placeholder"><span>2人 ¥2280/人</span><span>3人 ¥1980/人</span><span>4人 ¥1880/人</span><small>暂为结构预留，当前仍保存参考起价。</small></div></details>
              <details className="package-collapse" open={otherNotesOpen} onToggle={(event) => setOtherNotesOpen(event.currentTarget.open)}>
                <summary>其他说明</summary>
                <label className="default-note-check"><input type="checkbox" onChange={(event) => { if (event.target.checked) updateDraft((current) => ({ ...current, accommodationNoteZh: defaultNotes.accommodation, transferNoteZh: defaultNotes.transfer, priceNoteZh: defaultNotes.price, notesZh: defaultNotes.notes })); }} /> 使用默认说明</label>
                <div className="admin-form-grid">
                  <label><span>住宿说明</span><textarea value={draft.accommodationNoteZh} onChange={(event) => setField("accommodationNoteZh", event.target.value)} /></label>
                  <label><span>接送说明</span><textarea value={draft.transferNoteZh} onChange={(event) => setField("transferNoteZh", event.target.value)} /></label>
                  <label><span>价格说明</span><textarea value={draft.priceNoteZh} onChange={(event) => setField("priceNoteZh", event.target.value)} /></label>
                  <label><span>注意事项</span><textarea value={draft.notesZh} onChange={(event) => setField("notesZh", event.target.value)} /></label>
                </div>
              </details>
            </div>
          )}

          {activeTab === "english" && (
            <div className="package-tab-panel">
              <button type="button" className="admin-secondary" onClick={() => { setField("nameEn", draft.nameEn || draft.cityComboEn || draft.nameZh); setMessage("已按现有英文城市名生成基础英文占位，完整 AI 翻译后续接入。"); }}>根据中文生成英文</button>
              <div className="admin-form-grid english-grid">
                <label><span>英文套餐名称</span><input value={draft.nameEn} onChange={(event) => setField("nameEn", event.target.value)} /></label>
                <label><span>英文一句话简介</span><input value={draft.summaryEn} onChange={(event) => setField("summaryEn", event.target.value)} /></label>
                <label><span>Detail subtitle</span><input value={draft.subtitleEn} onChange={(event) => setField("subtitleEn", event.target.value)} /></label>
                <label><span>Hero copy</span><textarea value={draft.heroTextEn} onChange={(event) => setField("heroTextEn", event.target.value)} /></label>
              </div>
              <div className="english-day-list">
                {draft.itinerary.map((day, dayIndex) => (
                  <details key={dayIndex}>
                    <summary>DAY {String(dayIndex + 1).padStart(2, "0")} · {day.titleZh || "未命名"}</summary>
                    <div className="admin-form-grid">
                      <label><span>英文 Day 标题</span><input value={day.titleEn} onChange={(event) => updateDay(dayIndex, { titleEn: event.target.value })} /></label>
                      <label><span>英文 Day 副标题</span><input value={day.descriptionEn} onChange={(event) => updateDay(dayIndex, { descriptionEn: event.target.value })} /></label>
                    </div>
                    {(day.schedule || []).map((slot, slotIndex) => (
                      <div className="admin-form-grid" key={slotIndex}>
                        <label><span>英文节点内容</span><input value={slot.titleEn} onChange={(event) => updateSlot(dayIndex, slotIndex, { titleEn: event.target.value })} /></label>
                        <label><span>英文节点说明</span><input value={slot.descriptionEn || ""} onChange={(event) => updateSlot(dayIndex, slotIndex, { descriptionEn: event.target.value })} /></label>
                      </div>
                    ))}
                  </details>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {previewOpen && <PreviewDrawer item={draft} mode={previewMode} setMode={setPreviewMode} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}

function ImageCard({ title, image, helper, onFile }: { title: string; image: string; helper: string; onFile: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="image-card-field">
      <div>{image ? <img src={image} alt="" /> : <span>暂无图片</span>}</div>
      <section>
        <b>{title}</b>
        <small>{helper}</small>
        <p><label>更换图片<input type="file" accept="image/*" onChange={onFile} /></label><button type="button" disabled>调整裁剪</button></p>
      </section>
    </div>
  );
}

function InlineArray({ value, onChange, compact = false }: { value: string[]; onChange: (value: string[]) => void; compact?: boolean }) {
  return (
    <div className={compact ? "inline-array compact" : "inline-array"}>
      {value.map((item, index) => (
        <label key={index}>
          <input value={item} onChange={(event) => onChange(value.map((x, i) => (i === index ? event.target.value : x)))} />
          <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))}>删除</button>
          {index > 0 && <button type="button" onClick={() => { const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}>上移</button>}
        </label>
      ))}
      {!compact && <button type="button" onClick={() => onChange([...value, ""])}>+ 添加</button>}
    </div>
  );
}

function ScheduleEditor({ day, dayIndex, properties, services, updateSlot, updateDay, uploadImage }: {
  day: TravelPackageDay;
  dayIndex: number;
  properties: PropertyRecord[];
  services: ServiceItem[];
  updateSlot: (dayIndex: number, slotIndex: number, patch: Partial<TravelPackageSchedule>) => void;
  updateDay: (index: number, patch: Partial<TravelPackageDay>) => void;
  uploadImage: (event: ChangeEvent<HTMLInputElement>, target: ImageTarget) => void;
}) {
  const schedule = day.schedule || [];
  const addSource = (slotIndex: number, raw: string) => {
    if (!raw) return;
    const [kind, id] = raw.split(":");
    if (kind === "property") {
      const item = properties.find((property) => String(property.id) === id);
      if (!item) return;
      updateSlot(dayIndex, slotIndex, {
        sourceType: "property",
        sourceId: item.id,
        sourceLabel: item.nameZh,
        nodeType: "stay",
        titleZh: item.nameZh,
        titleEn: item.nameEn,
        descriptionZh: [item.areaZh, `${item.bedrooms}房`, `${item.guests}人`].filter(Boolean).join(" · "),
        descriptionEn: item.descriptionEn,
        image: item.images[0] || "",
      });
    }
    if (kind === "service") {
      const item = services.find((service) => String(service.id) === id);
      if (!item) return;
      updateSlot(dayIndex, slotIndex, {
        sourceType: "service",
        sourceId: item.id,
        sourceLabel: item.nameZh,
        nodeType: item.templateType === "transfer" ? "transport" : "experience",
        titleZh: item.nameZh,
        titleEn: item.nameEn,
        descriptionZh: item.subtitleZh || item.introZh,
        descriptionEn: item.subtitleEn || item.introEn,
        image: item.coverImage || item.images[0] || "",
      });
    }
  };

  return (
    <div className="schedule-editor">
      <h3>行程安排</h3>
      {schedule.map((slot, slotIndex) => (
        <article key={slotIndex} className="schedule-node">
          <div className="schedule-node-head">
            <select value={slot.nodeType || "note"} onChange={(event) => updateSlot(dayIndex, slotIndex, { nodeType: event.target.value as TravelPackageSchedule["nodeType"] })}>{nodeTypes.map((type) => <option key={type.value} value={type.value}>{type.icon} {type.label}</option>)}</select>
            <input value={slot.time || ""} onChange={(event) => updateSlot(dayIndex, slotIndex, { time: event.target.value })} placeholder="07:00 / 上午 / 晚上 / 可留空" />
            <select value="" onChange={(event) => addSource(slotIndex, event.target.value)}>
              <option value="">内容来源：手动 / 已有服务 / 已有房源</option>
              <optgroup label="已有房源">{properties.map((property) => <option key={property.id} value={`property:${property.id}`}>{property.city} · {property.nameZh}</option>)}</optgroup>
              <optgroup label="当地服务">{services.map((service) => <option key={service.id} value={`service:${service.id}`}>{service.city} · {service.nameZh}</option>)}</optgroup>
            </select>
          </div>
          <div className="admin-form-grid">
            <label><span>项目名称</span><input value={slot.titleZh} onChange={(event) => updateSlot(dayIndex, slotIndex, { titleZh: event.target.value, sourceType: slot.sourceType || "manual" })} placeholder="环滩岛一日游" /></label>
            <label><span>简短说明</span><input value={slot.descriptionZh || ""} onChange={(event) => updateSlot(dayIndex, slotIndex, { descriptionZh: event.target.value })} placeholder="浮潜、海岛午餐、自由活动" /></label>
          </div>
          <div className="schedule-node-foot">
            {slot.image ? <img src={slot.image} alt="" /> : <span>节点图片可选</span>}
            <label>上传图片<input type="file" accept="image/*" onChange={(event) => uploadImage(event, { type: "slot", dayIndex, slotIndex })} /></label>
            {slot.sourceLabel && <small>引用：{slot.sourceLabel}</small>}
            <button type="button" onClick={() => updateDay(dayIndex, { schedule: schedule.filter((_, i) => i !== slotIndex) })}>删除</button>
          </div>
        </article>
      ))}
      <button type="button" onClick={() => updateDay(dayIndex, { schedule: [...schedule, { ...emptySchedule, sortOrder: schedule.length + 1 }] })}>+ 添加行程</button>
    </div>
  );
}

function PreviewDrawer({ item, mode, setMode, onClose }: {
  item: TravelPackage;
  mode: "mobile" | "desktop";
  setMode: (mode: "mobile" | "desktop") => void;
  onClose: () => void;
}) {
  return (
    <div className="package-preview-layer" role="dialog" aria-modal="true">
      <aside className="package-preview-drawer">
        <header>
          <div><b>预览</b><small>默认优先手机版，不离开后台。</small></div>
          <nav>
            <button className={mode === "mobile" ? "active" : ""} type="button" onClick={() => setMode("mobile")}>手机版</button>
            <button className={mode === "desktop" ? "active" : ""} type="button" onClick={() => setMode("desktop")}>桌面版</button>
            <button type="button" onClick={onClose}>关闭</button>
          </nav>
        </header>
        <div className={mode === "mobile" ? "preview-phone" : "preview-desktop"}>
          <section className="preview-hero">
            {item.coverImage && <img src={item.coverImage} alt="" />}
            <div><small>{item.cityComboEn || "MALAYSIA PACKAGE"}</small><h2>{item.nameZh}</h2><p>{item.summaryZh}</p><b>¥{money(item.startingPrice)} / 人起</b></div>
          </section>
          <section className="preview-days">
            {item.itinerary.map((day, index) => (
              <article key={index}><b>DAY {String(index + 1).padStart(2, "0")} · {day.titleZh || "未命名的一天"}</b><p>{day.descriptionZh}</p>{(day.schedule || []).slice(0, 3).map((slot, slotIndex) => <span key={slotIndex}>{slot.time && `${slot.time} `}{slot.titleZh}</span>)}</article>
            ))}
          </section>
        </div>
      </aside>
    </div>
  );
}
