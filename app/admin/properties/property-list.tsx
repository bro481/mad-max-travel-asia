"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { DestinationRecord } from "../../../db/destinations";
import type { PropertyRecord, PropertySpaceConfig } from "../../../db/properties";

type CopyField =
  | "basic"
  | "layout"
  | "area"
  | "guests"
  | "sleeping"
  | "description"
  | "amenities"
  | "stay"
  | "nearby"
  | "price"
  | "images";
type SyncField =
  | "layout"
  | "area"
  | "guests"
  | "sleeping"
  | "floor"
  | "priceFrom"
  | "priceUnit"
  | "priceNote"
  | "basic"
  | "description"
  | "tags"
  | "amenities"
  | "stay"
  | "nearby"
  | "images";
type BulkField = "priceFrom" | "priceType" | "priceNote" | "status" | "city" | "areaZh" | "locationDisplayZh" | "maxGuests";

type BulkForm = {
  priceFrom: string;
  priceType: "from" | "fixed" | "consult";
  priceNote: string;
  status: PropertyRecord["status"];
  city: string;
  areaZh: string;
  locationDisplayZh: string;
  maxGuests: string;
};

const copyFields: { key: CopyField; label: string }[] = [
  { key: "basic", label: "基本信息" },
  { key: "layout", label: "户型" },
  { key: "area", label: "房屋面积" },
  { key: "guests", label: "入住人数" },
  { key: "sleeping", label: "睡眠安排 / 床型" },
  { key: "description", label: "房源介绍" },
  { key: "amenities", label: "设施" },
  { key: "stay", label: "入住须知" },
  { key: "nearby", label: "周边" },
  { key: "price", label: "价格" },
  { key: "images", label: "图片" },
];

const defaultCopyFields: CopyField[] = copyFields.map((field) => field.key).filter((key) => key !== "images");
const publicCopyFields: CopyField[] = ["basic", "description", "amenities", "stay", "nearby"];

const syncGroups: { title: string; fields: { key: SyncField; label: string }[] }[] = [
  {
    title: "房型信息",
    fields: [
      { key: "layout", label: "户型" },
      { key: "area", label: "房屋面积" },
      { key: "guests", label: "入住人数" },
      { key: "sleeping", label: "睡眠安排 / 床型" },
      { key: "floor", label: "所在楼层" },
    ],
  },
  {
    title: "价格",
    fields: [
      { key: "priceFrom", label: "起价" },
      { key: "priceUnit", label: "价格单位" },
      { key: "priceNote", label: "价格说明" },
    ],
  },
  {
    title: "内容",
    fields: [
      { key: "basic", label: "基本信息" },
      { key: "description", label: "房源介绍" },
      { key: "tags", label: "标签" },
      { key: "amenities", label: "设施" },
      { key: "stay", label: "入住须知" },
      { key: "nearby", label: "周边" },
    ],
  },
  { title: "图片", fields: [{ key: "images", label: "图片" }] },
];

const statusLabel = (status: PropertyRecord["status"]) =>
  status === "published" ? "已上线" : status === "hidden" ? "已隐藏" : "草稿";

const layoutOf = (item: PropertyRecord) => {
  if (item.spaceConfig?.layout) return item.spaceConfig.layout;
  const livingRooms = item.spaceConfig?.livingRooms ?? (item.bedrooms > 1 ? 2 : 1);
  return `${item.bedrooms}室${livingRooms}厅${item.bathrooms}卫`;
};

const areaOf = (item: PropertyRecord) =>
  item.spaceConfig?.locationDisplayZh || item.areaZh || "区域待填写";

const priceOf = (item: PropertyRecord) => {
  const type = item.spaceConfig?.priceType || (item.spaceConfig?.showPriceFrom === false ? "fixed" : "from");
  if (type === "consult" || !item.priceFrom) return "价格咨询";
  const unit = (item.spaceConfig?.priceUnit || "晚").replace("/", "");
  return `¥${item.priceFrom}${type === "from" ? " 起" : ""} / ${unit}`;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "stay";

const cloneSpace = (space: PropertySpaceConfig = {}) => JSON.parse(JSON.stringify(space)) as PropertySpaceConfig;

const copyValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function applyCopyFields(source: PropertyRecord, fields: CopyField[], nextId?: number): Partial<PropertyRecord> {
  const draft: Partial<PropertyRecord> = {
    city: source.city,
    status: "draft",
    spaceConfig: {
      copySourceId: source.id,
      copySourceName: source.nameZh,
      copiedAt: new Date().toISOString(),
    } as PropertySpaceConfig,
  };
  const space = cloneSpace(source.spaceConfig);
  const nextSpace = cloneSpace(draft.spaceConfig);
  if (fields.includes("basic")) {
    draft.city = source.city;
    draft.areaZh = source.areaZh;
    draft.areaEn = source.areaEn;
    nextSpace.locationDisplayZh = space.locationDisplayZh;
    nextSpace.locationDisplayEn = space.locationDisplayEn;
    nextSpace.internalNote = space.internalNote;
  }
  if (fields.includes("layout")) {
    draft.bedrooms = source.bedrooms;
    draft.bathrooms = source.bathrooms;
    nextSpace.layout = space.layout;
    nextSpace.livingRooms = space.livingRooms;
  }
  if (fields.includes("area")) nextSpace.area = space.area;
  if (fields.includes("guests")) {
    draft.guests = source.guests;
    nextSpace.maxGuests = space.maxGuests;
    nextSpace.recommendedGuests = space.recommendedGuests;
    nextSpace.recommendedMinGuests = space.recommendedMinGuests;
    nextSpace.recommendedMaxGuests = space.recommendedMaxGuests;
  }
  if (fields.includes("sleeping")) {
    draft.sleepingArrangements = copyValue(source.sleepingArrangements);
    draft.beds = source.beds;
  }
  if (fields.includes("description")) {
    draft.descriptionZh = source.descriptionZh;
    draft.descriptionEn = source.descriptionEn;
  }
  if (fields.includes("amenities")) {
    draft.amenities = copyValue(source.amenities);
    nextSpace.customAmenities = copyValue(space.customAmenities || []);
  }
  if (fields.includes("stay")) {
    nextSpace.checkInTime = space.checkInTime;
    nextSpace.checkOutTime = space.checkOutTime;
    nextSpace.checkInMethod = space.checkInMethod;
    nextSpace.guestRule = space.guestRule;
    nextSpace.useDefaultReminders = space.useDefaultReminders;
    nextSpace.reminders = copyValue(space.reminders || []);
  }
  if (fields.includes("nearby")) {
    draft.nearby = copyValue(source.nearby);
    nextSpace.nearbyNote = space.nearbyNote;
  }
  if (fields.includes("price")) {
    draft.priceFrom = source.priceFrom;
    draft.priceNote = source.priceNote;
    nextSpace.currency = space.currency;
    nextSpace.priceUnit = space.priceUnit;
    nextSpace.showPriceFrom = space.showPriceFrom;
    nextSpace.priceType = space.priceType;
  }
  if (fields.includes("images")) {
    draft.images = copyValue(source.images);
    draft.imageCategories = copyValue(source.imageCategories || {});
    draft.imageOriginals = copyValue(source.imageOriginals || {});
  } else {
    draft.images = [];
    draft.imageCategories = {};
    draft.imageOriginals = {};
  }
  draft.spaceConfig = { ...nextSpace };
  if (nextId) draft.id = nextId;
  return draft;
}

function applySyncField(target: PropertyRecord, source: PropertyRecord, fields: SyncField[]) {
  const next: PropertyRecord = copyValue(target);
  const sourceSpace = cloneSpace(source.spaceConfig);
  const nextSpace = cloneSpace(next.spaceConfig);
  if (fields.includes("layout")) {
    next.bedrooms = source.bedrooms;
    next.bathrooms = source.bathrooms;
    nextSpace.layout = sourceSpace.layout;
    nextSpace.livingRooms = sourceSpace.livingRooms;
  }
  if (fields.includes("area")) nextSpace.area = sourceSpace.area;
  if (fields.includes("guests")) {
    next.guests = source.guests;
    nextSpace.maxGuests = sourceSpace.maxGuests;
    nextSpace.recommendedGuests = sourceSpace.recommendedGuests;
    nextSpace.recommendedMinGuests = sourceSpace.recommendedMinGuests;
    nextSpace.recommendedMaxGuests = sourceSpace.recommendedMaxGuests;
    nextSpace.guestRule = sourceSpace.guestRule;
  }
  if (fields.includes("sleeping")) {
    next.sleepingArrangements = copyValue(source.sleepingArrangements);
    next.beds = source.beds;
  }
  if (fields.includes("floor")) nextSpace.floor = sourceSpace.floor;
  if (fields.includes("priceFrom")) next.priceFrom = source.priceFrom;
  if (fields.includes("priceUnit")) {
    nextSpace.currency = sourceSpace.currency;
    nextSpace.priceUnit = sourceSpace.priceUnit;
    nextSpace.showPriceFrom = sourceSpace.showPriceFrom;
    nextSpace.priceType = sourceSpace.priceType;
  }
  if (fields.includes("priceNote")) next.priceNote = source.priceNote;
  if (fields.includes("basic")) {
    next.city = source.city;
    next.areaZh = source.areaZh;
    next.areaEn = source.areaEn;
    nextSpace.locationDisplayZh = sourceSpace.locationDisplayZh;
    nextSpace.locationDisplayEn = sourceSpace.locationDisplayEn;
  }
  if (fields.includes("description")) {
    next.descriptionZh = source.descriptionZh;
    next.descriptionEn = source.descriptionEn;
  }
  if (fields.includes("tags")) {
    next.tags = copyValue(source.tags);
    next.suitableFor = copyValue(source.suitableFor || []);
  }
  if (fields.includes("amenities")) {
    next.amenities = copyValue(source.amenities);
    nextSpace.customAmenities = copyValue(sourceSpace.customAmenities || []);
  }
  if (fields.includes("stay")) {
    nextSpace.checkInTime = sourceSpace.checkInTime;
    nextSpace.checkOutTime = sourceSpace.checkOutTime;
    nextSpace.checkInMethod = sourceSpace.checkInMethod;
    nextSpace.guestRule = sourceSpace.guestRule;
    nextSpace.useDefaultReminders = sourceSpace.useDefaultReminders;
    nextSpace.reminders = copyValue(sourceSpace.reminders || []);
  }
  if (fields.includes("nearby")) {
    next.nearby = copyValue(source.nearby);
    nextSpace.nearbyNote = sourceSpace.nearbyNote;
  }
  if (fields.includes("images")) {
    next.images = copyValue(source.images);
    next.imageCategories = copyValue(source.imageCategories || {});
    next.imageOriginals = copyValue(source.imageOriginals || {});
  }
  next.spaceConfig = nextSpace;
  return next;
}

function applyBulkEdit(target: PropertyRecord, enabled: BulkField[], form: BulkForm) {
  const next: PropertyRecord = copyValue(target);
  const nextSpace = cloneSpace(next.spaceConfig);
  if (enabled.includes("priceFrom")) next.priceFrom = Math.max(0, Number(form.priceFrom || 0));
  if (enabled.includes("priceType")) {
    nextSpace.priceType = form.priceType;
    nextSpace.showPriceFrom = form.priceType === "from";
  }
  if (enabled.includes("priceNote")) next.priceNote = form.priceNote.trim();
  if (enabled.includes("status")) {
    next.status = form.status;
    nextSpace.visible = form.status === "published";
  }
  if (enabled.includes("city")) next.city = form.city;
  if (enabled.includes("areaZh")) {
    next.areaZh = form.areaZh.trim();
    if (!next.areaEn) next.areaEn = form.areaZh.trim();
  }
  if (enabled.includes("locationDisplayZh")) nextSpace.locationDisplayZh = form.locationDisplayZh.trim();
  if (enabled.includes("maxGuests")) {
    const guests = Math.max(1, Number(form.maxGuests || 1));
    next.guests = guests;
    nextSpace.maxGuests = guests;
  }
  next.spaceConfig = nextSpace;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function PropertyList({ initialItems, destinations = [] }: { initialItems: PropertyRecord[]; destinations?: DestinationRecord[] }) {
  const [items, setItems] = useState(initialItems);
  const [city, setCity] = useState("全部");
  const [layout, setLayout] = useState("全部房型");
  const [selected, setSelected] = useState<number[]>([]);
  const [copying, setCopying] = useState<PropertyRecord | null>(null);
  const [copySelected, setCopySelected] = useState<CopyField[]>(defaultCopyFields);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncSourceId, setSyncSourceId] = useState<number | null>(null);
  const [syncFields, setSyncFields] = useState<SyncField[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFields, setBulkFields] = useState<BulkField[]>([]);
  const [bulkForm, setBulkForm] = useState<BulkForm>({
    priceFrom: "",
    priceType: "from",
    priceNote: "",
    status: "published",
    city: "吉隆坡",
    areaZh: "",
    locationDisplayZh: "",
    maxGuests: "",
  });
  const [busy, setBusy] = useState("");

  const propertyDestinations = useMemo(() => {
    const configured = destinations
      .filter((destination) => destination.useForProperties && destination.status !== "hidden")
      .sort((a, b) => a.propertySort - b.propertySort || a.id - b.id)
      .map((destination) => destination.nameZh);
    const unknown = Array.from(new Set(items.map((item) => item.city))).filter((name) => name && !configured.includes(name));
    return [...configured, ...unknown];
  }, [destinations, items]);
  const cities = ["全部", ...propertyDestinations];
  const layouts = useMemo(() => ["全部房型", ...Array.from(new Set(items.map(layoutOf))).sort()], [items]);
  const shown = items.filter((item) => (city === "全部" || item.city === city) && (layout === "全部房型" || layoutOf(item) === layout));
  const selectedItems = items.filter((item) => selected.includes(item.id));
  const syncSource = selectedItems.find((item) => item.id === syncSourceId) || selectedItems[0];
  const syncTargets = selectedItems.filter((item) => item.id !== syncSource?.id);

  const update = async (item: PropertyRecord, status: PropertyRecord["status"]) => {
    const next = { ...item, status, spaceConfig: { ...(item.spaceConfig || {}), visible: status === "published" } };
    setItems((current) => current.map((existing) => (existing.id === item.id ? next : existing)));
    await fetch(`/api/admin/properties/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  };

  const deleteItem = async (item: PropertyRecord) => {
    if (!window.confirm(`确认删除「${item.nameZh}」？删除后不可从前台恢复。`)) return;
    setBusy("正在删除…");
    await fetch(`/api/admin/properties/${item.id}`, { method: "DELETE" });
    setItems((current) => current.filter((existing) => existing.id !== item.id));
    setBusy("");
  };

  const createCopy = async () => {
    if (!copying) return;
    setBusy("正在创建副本…");
    const response = await fetch("/api/admin/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameZh: `${copying.nameZh} - 副本`,
        nameEn: `${copying.nameEn || copying.nameZh} Copy`,
        city: copying.city,
        slug: `${slugify(copying.slug || copying.nameEn || copying.nameZh)}-copy-${Date.now().toString(36)}`,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as { id?: number; slug?: string; error?: string };
    if (!response.ok || !result.id) {
      setBusy("");
      alert(result.error || "创建副本失败");
      return;
    }
    const copyPayload = {
      id: result.id,
      slug: result.slug || `${copying.slug}-copy`,
      nameZh: `${copying.nameZh} - 副本`,
      nameEn: `${copying.nameEn || copying.nameZh} Copy`,
      city: copying.city,
      areaZh: "",
      areaEn: "",
      tags: [],
      images: [],
      imageCategories: {},
      imageOriginals: {},
      guests: 2,
      bedrooms: 1,
      beds: 0,
      bathrooms: 1,
      descriptionZh: "",
      descriptionEn: "",
      amenities: [],
      highlights: [],
      suitableFor: [],
      guestQuote: "",
      guestQuoteAuthor: "",
      spaceConfig: {},
      sleepingArrangements: [],
      nearby: [],
      priceFrom: 0,
      priceNote: "",
      status: "draft",
      updatedAt: new Date().toISOString(),
      ...applyCopyFields(copying, copySelected, result.id),
    } as PropertyRecord;
    await fetch(`/api/admin/properties/${result.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copyPayload),
    });
    location.href = `/admin/properties/${result.id}?copied=1`;
  };

  const runSync = async () => {
    if (!syncSource || !syncTargets.length || !syncFields.length) return;
    if (!window.confirm(`确认将所选内容同步到另外 ${syncTargets.length} 个房源？`)) return;
    setBusy("正在同步…");
    const updated = syncTargets.map((target) => applySyncField(target, syncSource, syncFields));
    await Promise.all(
      updated.map((item) =>
        fetch(`/api/admin/properties/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }),
      ),
    );
    setItems((current) => current.map((item) => updated.find((next) => next.id === item.id) || item));
    setSelected([]);
    setSyncOpen(false);
    setSyncFields([]);
    setBusy("");
  };

  const runBulkEdit = async () => {
    if (!selectedItems.length || !bulkFields.length) return;
    if (!window.confirm(`确认批量修改 ${selectedItems.length} 个房源？只会修改你勾选的项目。`)) return;
    setBusy("正在批量修改…");
    const updated = selectedItems.map((item) => applyBulkEdit(item, bulkFields, bulkForm));
    await Promise.all(
      updated.map((item) =>
        fetch(`/api/admin/properties/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }),
      ),
    );
    setItems((current) => current.map((item) => updated.find((next) => next.id === item.id) || item));
    setSelected([]);
    setBulkOpen(false);
    setBulkFields([]);
    setBusy("");
  };

  const batchHide = async () => {
    if (!selectedItems.length) return;
    setBusy("正在隐藏…");
    const updated = selectedItems.map((item) => ({ ...item, status: "hidden" as const, spaceConfig: { ...(item.spaceConfig || {}), visible: false } }));
    await Promise.all(updated.map((item) => fetch(`/api/admin/properties/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) })));
    setItems((current) => current.map((item) => updated.find((next) => next.id === item.id) || item));
    setSelected([]);
    setBusy("");
  };

  const toggleSelected = (id: number) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  const toggleCopyField = (field: CopyField) =>
    setCopySelected((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  const toggleSyncField = (field: SyncField) =>
    setSyncFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));
  const toggleBulkField = (field: BulkField) =>
    setBulkFields((current) => (current.includes(field) ? current.filter((item) => item !== field) : [...current, field]));

  return (
    <>
      <div className="admin-head">
        <div>
          <p>展示内容管理</p>
          <h1>房源管理</h1>
          <span>一张卡片对应一个独立房源；用复制和同步减少重复维护。</span>
        </div>
        <Link className="admin-primary" href="/admin/properties/new">＋ 新增房源</Link>
      </div>

      <div className="city-tabs">
        {cities.map((name) => (
          <button className={city === name ? "active" : ""} onClick={() => { setCity(name); setSelected([]); }} key={name}>
            {name}
            <small>{name === "全部" ? items.length : items.filter((item) => item.city === name).length}</small>
          </button>
        ))}
      </div>

      <div className="layout-filter">
        {layouts.map((name) => (
          <button className={layout === name ? "active" : ""} onClick={() => { setLayout(name); setSelected([]); }} key={name}>
            {name}
            <small>{name === "全部房型" ? shown.length : items.filter((item) => (city === "全部" || item.city === city) && layoutOf(item) === name).length}</small>
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="bulk-toolbar">
          <strong>已选择 {selected.length} 个房源</strong>
          <button onClick={() => { setSyncSourceId(selected[0]); setSyncOpen(true); }} disabled={selected.length < 2}>同步信息</button>
          <button onClick={() => setBulkOpen(true)}>批量修改</button>
          <button onClick={batchHide}>批量隐藏</button>
          <button onClick={() => setSelected([])}>取消选择</button>
          {busy && <span>{busy}</span>}
        </div>
      )}

      <div className="property-grid">
        {shown.map((item) => {
          const maxGuests = item.spaceConfig?.maxGuests || item.guests;
          const isSelected = selected.includes(item.id);
          return (
            <article className={`property-admin-card selectable-card ${isSelected ? "selected" : ""}`} key={item.id}>
              <label className="card-select">
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelected(item.id)} />
                <span>✓</span>
              </label>
              <div className="property-cover">
                {item.images[0] ? <img src={item.images[0]} alt="" /> : <span>暂无图片</span>}
                <i className={item.status}>{statusLabel(item.status)}</i>
              </div>
              <div className="property-card-body">
                <small>📍 {item.city} · {areaOf(item)}</small>
                <h2>{item.nameZh}</h2>
                <p>{layoutOf(item)} · 最多{maxGuests}人</p>
                <b>{priceOf(item)}</b>
                {item.spaceConfig?.copySourceName && <em className="copy-source">来自复制：{item.spaceConfig.copySourceName}</em>}
                <div className="card-actions">
                  <Link href={`/admin/properties/${item.id}`}>编辑</Link>
                  <Link target="_blank" href={`/rooms/${item.slug}`}>预览</Link>
                  <button onClick={() => { setCopying(item); setCopySelected(defaultCopyFields); }}>复制</button>
                  <div className="more-actions">
                    <button>更多</button>
                    <span>
                      <button onClick={() => update(item, item.status === "published" ? "hidden" : "published")}>{item.status === "published" ? "隐藏" : "上线"}</button>
                      <button onClick={() => deleteItem(item)}>删除</button>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {copying && (
        <div className="admin-modal-layer">
          <section className="admin-dialog copy-dialog">
            <button className="dialog-close" onClick={() => setCopying(null)}>×</button>
            <h2>复制房源</h2>
            <p>来源房源：<b>{copying.nameZh}</b></p>
            <div className="copy-mode-grid">
              <button className={copySelected.length === defaultCopyFields.length && !copySelected.includes("images") ? "active" : ""} onClick={() => setCopySelected(defaultCopyFields)}>
                <b>完整复制</b>
                <small>复制除图片外全部内容</small>
              </button>
              <button onClick={() => setCopySelected(publicCopyFields)}>
                <b>仅复制公共信息</b>
                <small>介绍、设施、入住须知、周边及位置类信息</small>
              </button>
            </div>
            <div className="copy-check-grid">
              {copyFields.map((field) => <label key={field.key}><input type="checkbox" checked={copySelected.includes(field.key)} onChange={() => toggleCopyField(field.key)} /><span>{field.label}</span></label>)}
            </div>
            <p className="dialog-note">默认不复制图片，避免不同房源误用同一套照片。创建后会进入草稿编辑页。</p>
            <div className="dialog-actions">
              <button onClick={() => setCopying(null)}>取消</button>
              <button className="admin-primary" onClick={createCopy} disabled={Boolean(busy)}>{busy || "创建副本"}</button>
            </div>
          </section>
        </div>
      )}

      {syncOpen && syncSource && (
        <div className="admin-modal-layer">
          <section className="admin-dialog sync-dialog">
            <button className="dialog-close" onClick={() => setSyncOpen(false)}>×</button>
            <h2>同步房源信息</h2>
            <FieldLite label="选择来源房源">
              <select value={syncSource.id} onChange={(e) => setSyncSourceId(Number(e.target.value))}>
                {selectedItems.map((item) => <option value={item.id} key={item.id}>{item.nameZh}</option>)}
              </select>
            </FieldLite>
            <p>将同步到另外 <b>{syncTargets.length}</b> 个房源。</p>
            <div className="sync-groups">
              {syncGroups.map((group) => <div key={group.title}><h3>{group.title}</h3>{group.fields.map((field) => <label key={field.key}><input type="checkbox" checked={syncFields.includes(field.key)} onChange={() => toggleSyncField(field.key)} /><span>{field.label}</span></label>)}</div>)}
            </div>
            <p className="dialog-note">只会覆盖本次勾选的字段，未勾选的信息不会改变。图片允许同步，但默认不勾选。</p>
            <div className="dialog-actions">
              <button onClick={() => setSyncOpen(false)}>取消</button>
              <button className="admin-primary" onClick={runSync} disabled={Boolean(busy) || !syncFields.length || !syncTargets.length}>确认同步到 {syncTargets.length} 个房源</button>
            </div>
          </section>
        </div>
      )}

      {bulkOpen && (
        <div className="admin-modal-layer">
          <section className="admin-dialog bulk-edit-dialog">
            <button className="dialog-close" onClick={() => setBulkOpen(false)}>×</button>
            <h2>批量修改</h2>
            <p>将直接给已选中的 <b>{selectedItems.length}</b> 个房源设置新值。和“同步信息”不同，这里不需要选择来源房源。</p>

            <div className="bulk-edit-grid">
              <BulkEditField
                checked={bulkFields.includes("priceFrom")}
                label="起价"
                onToggle={() => toggleBulkField("priceFrom")}
              >
                <div className="inline-input">
                  <span>¥</span>
                  <input type="number" min="0" value={bulkForm.priceFrom} onChange={(e) => setBulkForm((current) => ({ ...current, priceFrom: e.target.value }))} placeholder="例如 550" />
                </div>
              </BulkEditField>
              <BulkEditField
                checked={bulkFields.includes("priceType")}
                label="价格类型"
                onToggle={() => toggleBulkField("priceType")}
              >
                <select value={bulkForm.priceType} onChange={(e) => setBulkForm((current) => ({ ...current, priceType: e.target.value as BulkForm["priceType"] }))}>
                  <option value="from">起价</option>
                  <option value="fixed">固定价</option>
                  <option value="consult">价格咨询</option>
                </select>
              </BulkEditField>
              <BulkEditField
                checked={bulkFields.includes("priceNote")}
                label="价格说明"
                onToggle={() => toggleBulkField("priceNote")}
              >
                <input value={bulkForm.priceNote} onChange={(e) => setBulkForm((current) => ({ ...current, priceNote: e.target.value }))} placeholder="价格随入住日期调整" />
              </BulkEditField>
              <BulkEditField
                checked={bulkFields.includes("status")}
                label="发布状态"
                onToggle={() => toggleBulkField("status")}
              >
                <select value={bulkForm.status} onChange={(e) => setBulkForm((current) => ({ ...current, status: e.target.value as PropertyRecord["status"] }))}>
                  <option value="published">已上线</option>
                  <option value="draft">草稿</option>
                  <option value="hidden">已隐藏</option>
                </select>
              </BulkEditField>
              <BulkEditField
                checked={bulkFields.includes("city")}
                label="目的地"
                onToggle={() => toggleBulkField("city")}
              >
                <select value={bulkForm.city} onChange={(e) => setBulkForm((current) => ({ ...current, city: e.target.value }))}>
                  {propertyDestinations.map((name) => <option value={name} key={name}>{name}</option>)}
                </select>
              </BulkEditField>
              <BulkEditField
                checked={bulkFields.includes("areaZh")}
                label="所在区域"
                onToggle={() => toggleBulkField("areaZh")}
              >
                <input value={bulkForm.areaZh} onChange={(e) => setBulkForm((current) => ({ ...current, areaZh: e.target.value }))} placeholder="例如 KLCC附近" />
              </BulkEditField>
              <BulkEditField
                checked={bulkFields.includes("locationDisplayZh")}
                label="位置展示文案"
                onToggle={() => toggleBulkField("locationDisplayZh")}
              >
                <input value={bulkForm.locationDisplayZh} onChange={(e) => setBulkForm((current) => ({ ...current, locationDisplayZh: e.target.value }))} placeholder="例如 KLCC附近 · 市中心" />
              </BulkEditField>
              <BulkEditField
                checked={bulkFields.includes("maxGuests")}
                label="最大入住人数"
                onToggle={() => toggleBulkField("maxGuests")}
              >
                <input type="number" min="1" value={bulkForm.maxGuests} onChange={(e) => setBulkForm((current) => ({ ...current, maxGuests: e.target.value }))} placeholder="例如 4" />
              </BulkEditField>
            </div>

            <p className="dialog-note">只会修改左侧已勾选的项目；没有勾选的字段会保持原样。图片不会被批量修改。</p>
            <div className="dialog-actions">
              <button onClick={() => setBulkOpen(false)}>取消</button>
              <button className="admin-primary" onClick={runBulkEdit} disabled={Boolean(busy) || !bulkFields.length}>确认修改 {selectedItems.length} 个房源</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function FieldLite({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="editor-field"><span>{label}</span>{children}</label>;
}

function BulkEditField({ checked, label, onToggle, children }: { checked: boolean; label: string; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className={`bulk-edit-field ${checked ? "active" : ""}`}>
      <label>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span>{label}</span>
      </label>
      <div>{children}</div>
    </div>
  );
}
