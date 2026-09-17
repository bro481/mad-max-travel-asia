"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import type {
  TravelPackage,
  TravelPackageArrangements,
  TravelPackageDay,
  TravelPackageDayContentBlock,
  TravelPackageDisplayOptions,
  TravelPackageInquirySettings,
  TravelPackagePriceTier,
  TravelPackageSchedule,
} from "../../../db/packages";
import type { DestinationRecord } from "../../../db/destinations";
import type { PropertyRecord } from "../../../db/properties";
import type { ServiceItem } from "../../../db/service-items";

type AdminTab = "basic" | "itinerary" | "arrangements" | "fees" | "english";
type SaveProgress = { active: boolean; percent: number; label: string; error?: string };
type ImageTarget =
  | { type: "cover" }
  | { type: "gallery"; index?: number }
  | { type: "day"; dayIndex: number }
  | { type: "dayGallery"; dayIndex: number; index?: number }
  | { type: "slot"; dayIndex: number; slotIndex: number }
  | { type: "arrangement"; section: "stay" | "vehicle"; index?: number };

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
const emptyContentBlock: TravelPackageDayContentBlock = { titleZh: "", titleEn: "", textZh: "", textEn: "" };
const emptyDay: TravelPackageDay = { titleZh: "", titleEn: "", summaryZh: "", summaryEn: "", descriptionZh: "", descriptionEn: "", coverImage: "", galleryImages: [], galleryCaptionZh: "", galleryCaptionEn: "", contentBlocks: [], schedule: [] };
const emptyArrangements: TravelPackageArrangements = {
  stay: {
    visible: true,
    titleZh: "吉隆坡市区舒适住宿",
    titleEn: "Comfortable Kuala Lumpur city stay",
    nights: "3晚",
    descriptionZh: "根据人数安排合适房型",
    descriptionEn: "Room type matched to group size",
    noteZh: "实际住宿及房型根据人数、入住日期确认。",
    noteEn: "Final stay and room type are confirmed by group size and dates.",
    images: [],
    propertyIds: [],
  },
  vehicle: {
    visible: true,
    titleZh: "按人数安排合适车型",
    titleEn: "Vehicle matched to your group",
    scopeZh: "接机 · 市区行程 · 马六甲往返",
    scopeEn: "Airport pickup · City route · Malacca return",
    descriptionZh: "1–14人均可安排，根据人数与行李安排合适车型。",
    descriptionEn: "1-14 guests can be arranged, with vehicle matched to group size and luggage.",
    images: [],
    serviceIds: [],
  },
  support: {
    visible: true,
    titleZh: "全程中文协助",
    titleEn: "Chinese support throughout",
    descriptionZh: "从抵达到返程，住宿、用车及行程问题均可沟通。",
    descriptionEn: "From arrival to departure, we can help with stay, vehicle and itinerary questions.",
  },
};
const defaultDisplayOptions: TravelPackageDisplayOptions = { heroGallery: true, tags: true, itinerary: true, arrangements: true, fees: true };
const defaultInquirySettings: TravelPackageInquirySettings = {
  buttonTextZh: "咨询这个行程",
  buttonTextEn: "Inquire",
  titleTemplateZh: "【官网咨询｜{套餐名称} {天数}天{晚数}晚】",
  titleTemplateEn: "Website inquiry | {package} {days}D{nights}N",
  promptFields: ["出行人数", "出行日期", "儿童人数", "联系方式", "其他需求"],
};

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
  arrangements: clone(emptyArrangements),
  displayOptions: { ...defaultDisplayOptions },
  priceTiers: [],
  inquirySettings: { ...defaultInquirySettings },
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

async function fetchJson<T>(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), init?.timeoutMs || 30000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof payload?.error === "string" ? payload.error : `服务器返回 ${response.status}`;
      throw new Error(message);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("保存超时：服务器没有在 30 秒内响应，请刷新后台后确认是否已保存。");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
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
  const [saveProgress, setSaveProgress] = useState<SaveProgress>({ active: false, percent: 0, label: "" });
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
      if (target.type === "arrangement") {
        const arrangements = clone(current.arrangements || emptyArrangements);
        const images = [...(arrangements[target.section].images || [])];
        if (typeof target.index === "number") images[target.index] = url;
        else images.push(url);
        arrangements[target.section].images = images.filter(Boolean);
        return { ...current, arrangements };
      }
      const itinerary = current.itinerary.map((day, dayIndex) => {
        if (dayIndex !== target.dayIndex) return day;
        if (target.type === "day") return { ...day, coverImage: url };
        if (target.type === "dayGallery") {
          const galleryImages = [...(day.galleryImages || [])];
          if (typeof target.index === "number") galleryImages[target.index] = url;
          else galleryImages.push(url);
          return { ...day, galleryImages: galleryImages.filter(Boolean), coverImage: day.coverImage || url };
        }
        return { ...day, schedule: (day.schedule || []).map((slot, slotIndex) => (slotIndex === target.slotIndex ? { ...slot, image: url } : slot)) };
      });
      return { ...current, itinerary };
    });
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, target: ImageTarget) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    setSaving(true);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "上传失败");
      const urls = (data.urls || []).filter(Boolean);
      if (!urls.length) throw new Error("上传后没有返回图片地址");
      urls.forEach((url: string) => applyImage(target, url));
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
        galleryImages: (day.galleryImages || []).filter(Boolean),
        contentBlocks: (day.contentBlocks || []).filter((block) => block.titleZh || block.titleEn || block.textZh || block.textEn),
        schedule: (day.schedule || []).filter((slot) =>
          slot.titleZh ||
          slot.titleEn ||
          slot.descriptionZh ||
          slot.descriptionEn ||
          slot.time ||
          slot.image ||
          slot.sourceLabel ||
          slot.sourceId ||
          slot.nodeType,
        ),
      })),
      arrangements: {
        ...draft.arrangements,
        stay: {
          ...draft.arrangements.stay,
          images: (draft.arrangements.stay.images || []).filter(Boolean),
          propertyIds: (draft.arrangements.stay.propertyIds || []).map(Number).filter(Boolean),
        },
        vehicle: {
          ...draft.arrangements.vehicle,
          images: (draft.arrangements.vehicle.images || []).filter(Boolean),
          serviceIds: (draft.arrangements.vehicle.serviceIds || []).map(Number).filter(Boolean),
        },
      },
      priceTiers: draft.priceTiers.filter((tier) => tier.label || tier.price),
      inquirySettings: {
        ...draft.inquirySettings,
        promptFields: draft.inquirySettings.promptFields.filter(Boolean),
      },
    };
  };

  const save = async (status?: TravelPackage["status"]) => {
    setSaving(true);
    setMessage("");
    setSaveProgress({ active: true, percent: 8, label: "正在整理套餐数据..." });
    const payload = normalizedDraft(status);
    try {
      const isNew = selectedId === "new";
      setSaveProgress({ active: true, percent: 28, label: "正在写入数据库..." });
      const data = await fetchJson<{ id?: number; slug?: string; ok?: boolean }>(isNew ? "/api/admin/packages" : `/api/admin/packages/${selectedId}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        timeoutMs: 30000,
      });
      setSaveProgress({ active: true, percent: 68, label: "正在刷新后台列表..." });
      const refreshed = await fetchJson<TravelPackage[]>("/api/admin/packages", { cache: "no-store", timeoutMs: 30000 });
      const nextItems = Array.isArray(refreshed) ? refreshed : [];
      const nextId = isNew ? data.id : selectedId;
      if (typeof nextId !== "number") throw new Error("保存完成，但服务器没有返回套餐 ID，请刷新后台确认。");
      setItems(nextItems);
      setSelectedId(nextId);
      const saved = nextItems.find((item) => item.id === nextId);
      if (saved) setDraft(clone(saved));
      setSaveProgress({ active: true, percent: 100, label: status === "published" ? "已保存并上线，前台缓存已刷新。" : "已保存为草稿。" });
      setMessage(status === "published" ? "已保存并上线，前台套餐页会同步更新。" : "已保存为草稿。");
      window.setTimeout(() => setSaveProgress((current) => current.error ? current : { active: false, percent: 0, label: "" }), 1600);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失败";
      setMessage(errorMessage);
      setSaveProgress({ active: true, percent: 100, label: "保存失败", error: errorMessage });
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
  const updateContentBlock = (dayIndex: number, blockIndex: number, patch: Partial<TravelPackageDayContentBlock>) => {
    updateDraft((current) => ({
      ...current,
      itinerary: current.itinerary.map((day, index) =>
        index === dayIndex
          ? { ...day, contentBlocks: (day.contentBlocks || []).map((block, i) => (i === blockIndex ? { ...block, ...patch } : block)) }
          : day,
      ),
    }));
  };
  const updateArrangement = <S extends keyof TravelPackageArrangements>(
    section: S,
    patch: Partial<TravelPackageArrangements[S]>,
  ) => {
    updateDraft((current) => ({ ...current, arrangements: { ...current.arrangements, [section]: { ...current.arrangements[section], ...patch } } }));
  };
  const updateDisplayOption = (key: keyof TravelPackageDisplayOptions, value: boolean) => {
    setField("displayOptions", { ...draft.displayOptions, [key]: value });
  };
  const updatePriceTier = (index: number, patch: Partial<TravelPackagePriceTier>) => {
    setField("priceTiers", draft.priceTiers.map((tier, tierIndex) => (tierIndex === index ? { ...tier, ...patch } : tier)));
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
      {saveProgress.active && (
        <div className={saveProgress.error ? "package-save-progress error" : "package-save-progress"}>
          <div>
            <b>{saveProgress.label}</b>
            <span>{saveProgress.error || `${saveProgress.percent}%`}</span>
          </div>
          <i><em style={{ width: `${saveProgress.percent}%` }} /></i>
        </div>
      )}

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
              ["arrangements", "套餐安排"],
              ["fees", "费用说明"],
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

              <ImageListEditor
                title="顶部图片 / 套餐图库"
                helper="第一张自动作为封面；前台顶部直接左右滑动显示这些图片。"
                images={Array.from(new Set([draft.coverImage, ...draft.galleryImages].filter(Boolean)))}
                coverImage={draft.coverImage}
                onUpload={(event) => uploadImage(event, { type: "gallery" })}
                onSetCover={(image) => setDraft((current) => ({ ...current, coverImage: image, galleryImages: Array.from(new Set([image, ...current.galleryImages.filter((item) => item !== image)])) }))}
                onRemove={(image) => setDraft((current) => {
                  const galleryImages = current.galleryImages.filter((item) => item !== image);
                  const coverImage = current.coverImage === image ? galleryImages[0] || "" : current.coverImage;
                  return { ...current, coverImage, galleryImages };
                })}
                onMove={(from, to) => {
                  const images = Array.from(new Set([draft.coverImage, ...draft.galleryImages].filter(Boolean)));
                  if (to < 0 || to >= images.length) return;
                  const next = [...images];
                  const [image] = next.splice(from, 1);
                  next.splice(to, 0, image);
                  setDraft((current) => ({ ...current, coverImage: next[0] || "", galleryImages: next }));
                }}
              />

              <div className="package-field-block">
                <span>套餐特色</span>
                <div className="tag-picker">
                  {tagOptions.map((tag) => (
                    <button key={tag} className={draft.tags.includes(tag) ? "active" : ""} type="button" onClick={() => setField("tags", draft.tags.includes(tag) ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag])}>{tag}</button>
                  ))}
                  <button type="button" onClick={() => setField("tags", [...draft.tags, "新标签"])}>+ 添加标签</button>
                </div>
                <small>前台最多显示前 4 个标签。</small>
                <InlineArray value={draft.tags} onChange={(value) => setField("tags", value)} compact />
              </div>

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
                            <label className="wide"><span>折叠摘要</span><input value={day.summaryZh || day.descriptionZh} onChange={(event) => updateDay(index, { summaryZh: event.target.value })} placeholder="专车接机 · 入住市区住宿 · 晚上自由探索" /></label>
                            <label className="wide"><span>副标题 / 旧版说明</span><input value={day.descriptionZh} onChange={(event) => updateDay(index, { descriptionZh: event.target.value })} placeholder="清澈的海水，治愈的蓝" /></label>
                          </div>
                          <ImageCard title="当天主图" image={day.coverImage || ""} onFile={(event) => uploadImage(event, { type: "day", dayIndex: index })} helper="推荐填写；节点图片只给重点体验使用。" />
                          <ContentBlockEditor
                            blocks={day.contentBlocks || []}
                            onChange={(blocks) => updateDay(index, { contentBlocks: blocks })}
                            updateBlock={(blockIndex, patch) => updateContentBlock(index, blockIndex, patch)}
                          />
                          <ImageListEditor
                            title="当日图片"
                            helper="第一张默认作为折叠状态小缩略图；展开后作为当天图片轮播。"
                            images={Array.from(new Set([day.coverImage || "", ...(day.galleryImages || [])].filter(Boolean)))}
                            coverImage={day.coverImage || ""}
                            onUpload={(event) => uploadImage(event, { type: "dayGallery", dayIndex: index })}
                            onSetCover={(image) => updateDay(index, { coverImage: image, galleryImages: Array.from(new Set([image, ...(day.galleryImages || []).filter((item) => item !== image)])) })}
                            onRemove={(image) => {
                              const galleryImages = (day.galleryImages || []).filter((item) => item !== image);
                              updateDay(index, { galleryImages, coverImage: day.coverImage === image ? galleryImages[0] || "" : day.coverImage });
                            }}
                            onMove={(from, to) => {
                              const images = Array.from(new Set([day.coverImage || "", ...(day.galleryImages || [])].filter(Boolean)));
                              if (to < 0 || to >= images.length) return;
                              const next = [...images];
                              const [image] = next.splice(from, 1);
                              next.splice(to, 0, image);
                              updateDay(index, { coverImage: next[0] || "", galleryImages: next });
                            }}
                          />
                          <label className="package-caption-field"><span>图片说明</span><input value={day.galleryCaptionZh || ""} onChange={(event) => updateDay(index, { galleryCaptionZh: event.target.value })} placeholder="接机安排 · 市区住宿 · 晚上自由活动" /></label>
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

          {activeTab === "arrangements" && (
            <div className="package-tab-panel">
              <section className="package-display-options">
                <h3>前台显示控制</h3>
                {[
                  ["heroGallery", "顶部图库"],
                  ["tags", "套餐特色"],
                  ["itinerary", "每日行程"],
                  ["arrangements", "这趟已经帮你安排好"],
                  ["fees", "费用说明"],
                ].map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={Boolean(draft.displayOptions[key as keyof TravelPackageDisplayOptions])}
                      onChange={(event) => updateDisplayOption(key as keyof TravelPackageDisplayOptions, event.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </section>

              <ArrangementBlock
                title="住宿安排"
                enabled={draft.arrangements.stay.visible}
                onToggle={(visible) => updateArrangement("stay", { visible })}
              >
                <div className="admin-form-grid">
                  <label><span>住宿标题</span><input value={draft.arrangements.stay.titleZh} onChange={(event) => updateArrangement("stay", { titleZh: event.target.value })} /></label>
                  <label><span>住宿晚数</span><input value={draft.arrangements.stay.nights} onChange={(event) => updateArrangement("stay", { nights: event.target.value })} placeholder="3晚" /></label>
                  <label><span>住宿说明</span><input value={draft.arrangements.stay.descriptionZh} onChange={(event) => updateArrangement("stay", { descriptionZh: event.target.value })} /></label>
                  <label><span>补充说明</span><input value={draft.arrangements.stay.noteZh} onChange={(event) => updateArrangement("stay", { noteZh: event.target.value })} /></label>
                </div>
                <LinkedPicker
                  title="关联房源"
                  emptyText="未关联房源；仍可使用下方套餐专属住宿图片和说明。"
                  values={draft.arrangements.stay.propertyIds}
                  options={properties.map((property) => ({ id: property.id, label: `${property.city} · ${property.nameZh}` }))}
                  onChange={(propertyIds) => updateArrangement("stay", { propertyIds })}
                />
                <ImageListEditor
                  title="住宿图片"
                  helper="前台住宿模块会左右滑动显示；如为空，会回退展示关联房源或默认房源图片。"
                  images={draft.arrangements.stay.images || []}
                  onUpload={(event) => uploadImage(event, { type: "arrangement", section: "stay" })}
                  onRemove={(image) => updateArrangement("stay", { images: draft.arrangements.stay.images.filter((item) => item !== image) })}
                  onMove={(from, to) => {
                    const next = [...draft.arrangements.stay.images];
                    if (to < 0 || to >= next.length) return;
                    const [image] = next.splice(from, 1);
                    next.splice(to, 0, image);
                    updateArrangement("stay", { images: next });
                  }}
                />
              </ArrangementBlock>

              <ArrangementBlock
                title="行程用车"
                enabled={draft.arrangements.vehicle.visible}
                onToggle={(visible) => updateArrangement("vehicle", { visible })}
              >
                <div className="admin-form-grid">
                  <label><span>标题</span><input value={draft.arrangements.vehicle.titleZh} onChange={(event) => updateArrangement("vehicle", { titleZh: event.target.value })} /></label>
                  <label><span>服务范围</span><input value={draft.arrangements.vehicle.scopeZh} onChange={(event) => updateArrangement("vehicle", { scopeZh: event.target.value })} /></label>
                  <label className="wide"><span>说明</span><input value={draft.arrangements.vehicle.descriptionZh} onChange={(event) => updateArrangement("vehicle", { descriptionZh: event.target.value })} /></label>
                </div>
                <LinkedPicker
                  title="关联当地服务"
                  emptyText="未关联当地服务；仍可填写套餐专属用车说明。"
                  values={draft.arrangements.vehicle.serviceIds}
                  options={services.map((service) => ({ id: service.id, label: `${service.city} · ${service.nameZh}` }))}
                  onChange={(serviceIds) => updateArrangement("vehicle", { serviceIds })}
                />
                <ImageListEditor
                  title="用车图片"
                  helper="如为空，前台会继续使用默认车辆图片。"
                  images={draft.arrangements.vehicle.images || []}
                  onUpload={(event) => uploadImage(event, { type: "arrangement", section: "vehicle" })}
                  onRemove={(image) => updateArrangement("vehicle", { images: draft.arrangements.vehicle.images.filter((item) => item !== image) })}
                  onMove={(from, to) => {
                    const next = [...draft.arrangements.vehicle.images];
                    if (to < 0 || to >= next.length) return;
                    const [image] = next.splice(from, 1);
                    next.splice(to, 0, image);
                    updateArrangement("vehicle", { images: next });
                  }}
                />
              </ArrangementBlock>

              <ArrangementBlock
                title="中文协助"
                enabled={draft.arrangements.support.visible}
                onToggle={(visible) => updateArrangement("support", { visible })}
              >
                <div className="admin-form-grid">
                  <label><span>标题</span><input value={draft.arrangements.support.titleZh} onChange={(event) => updateArrangement("support", { titleZh: event.target.value })} /></label>
                  <label className="wide"><span>说明</span><input value={draft.arrangements.support.descriptionZh} onChange={(event) => updateArrangement("support", { descriptionZh: event.target.value })} /></label>
                </div>
              </ArrangementBlock>
            </div>
          )}

          {activeTab === "fees" && (
            <div className="package-tab-panel">
              <section className="fee-section"><div><h3>费用包含</h3><button type="button" onClick={() => setField("includes", includeTemplate)}>套用模板：标准省心套餐</button></div><SortableTextList value={draft.includes} onChange={(value) => setField("includes", value)} /></section>
              <section className="fee-section"><div><h3>费用不包含</h3><button type="button" onClick={() => setField("excludes", excludeTemplate)}>套用默认</button></div><SortableTextList value={draft.excludes} onChange={(value) => setField("excludes", value)} /></section>
              <details className="package-collapse" open={priceTiersOpen} onToggle={(event) => setPriceTiersOpen(event.currentTarget.open)}>
                <summary>人数价格高级设置</summary>
                <PriceTierEditor
                  tiers={draft.priceTiers}
                  onChange={(priceTiers) => setField("priceTiers", priceTiers)}
                  updateTier={updatePriceTier}
                />
              </details>
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
              <section className="fee-section package-inquiry-settings">
                <div><h3>咨询设置</h3><small>前台固定咨询栏和弹窗复制文案会使用这里。</small></div>
                <div className="admin-form-grid">
                  <label><span>咨询按钮文字</span><input value={draft.inquirySettings.buttonTextZh} onChange={(event) => setField("inquirySettings", { ...draft.inquirySettings, buttonTextZh: event.target.value })} /></label>
                  <label><span>咨询标题模板</span><input value={draft.inquirySettings.titleTemplateZh} onChange={(event) => setField("inquirySettings", { ...draft.inquirySettings, titleTemplateZh: event.target.value })} /></label>
                </div>
                <small>可用变量：{"{套餐名称}"}、{"{天数}"}、{"{晚数}"}、{"{城市}"}</small>
                <SortableTextList value={draft.inquirySettings.promptFields} onChange={(promptFields) => setField("inquirySettings", { ...draft.inquirySettings, promptFields })} />
              </section>
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

function ImageListEditor({
  title,
  helper,
  images,
  coverImage,
  onUpload,
  onSetCover,
  onRemove,
  onMove,
}: {
  title: string;
  helper: string;
  images: string[];
  coverImage?: string;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSetCover?: (image: string) => void;
  onRemove: (image: string, index: number) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <div className="image-list-editor">
      <header>
        <div><b>{title}</b><small>{helper}</small></div>
        <label>+ 上传图片<input type="file" accept="image/*" multiple onChange={onUpload} /></label>
      </header>
      <div>
        {images.map((image, index) => (
          <article key={`${image}-${index}`}>
            <img src={image} alt="" />
            <span>{coverImage === image || (!coverImage && index === 0) ? "★ 封面" : `图${index + 1}`}</span>
            <nav>
              <button type="button" onClick={() => onMove(index, index - 1)} disabled={index === 0}>↑</button>
              <button type="button" onClick={() => onMove(index, index + 1)} disabled={index === images.length - 1}>↓</button>
              {onSetCover && <button type="button" onClick={() => onSetCover(image)}>设封面</button>}
              <button type="button" onClick={() => onRemove(image, index)}>删除</button>
              <button type="button" disabled>裁剪</button>
            </nav>
          </article>
        ))}
        {!images.length && <p className="image-list-empty">还没有图片，上传后会显示在前台轮播。</p>}
      </div>
    </div>
  );
}

function ContentBlockEditor({
  blocks,
  onChange,
  updateBlock,
}: {
  blocks: TravelPackageDayContentBlock[];
  onChange: (blocks: TravelPackageDayContentBlock[]) => void;
  updateBlock: (index: number, patch: Partial<TravelPackageDayContentBlock>) => void;
}) {
  return (
    <div className="content-block-editor">
      <header>
        <div><b>展开详细内容</b><small>用于前台 Day 展开后的“上午 / 下午 / 晚上”等内容段。</small></div>
        <button type="button" onClick={() => onChange([...blocks, { ...emptyContentBlock, sortOrder: blocks.length + 1 }])}>+ 添加内容段</button>
      </header>
      {blocks.map((block, index) => (
        <article key={index}>
          <input value={block.titleZh} onChange={(event) => updateBlock(index, { titleZh: event.target.value })} placeholder="上午 / 下午 / 晚上" />
          <textarea value={block.textZh} onChange={(event) => updateBlock(index, { textZh: event.target.value })} placeholder="从吉隆坡出发前往马六甲..." />
          <nav>
            <button type="button" onClick={() => {
              if (index <= 0) return;
              const next = [...blocks];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              onChange(next);
            }}>上移</button>
            <button type="button" onClick={() => onChange(blocks.filter((_, i) => i !== index))}>删除</button>
          </nav>
        </article>
      ))}
      {!blocks.length && <p>未填写时，前台会继续使用旧版自动生成的内容段。</p>}
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

function SortableTextList({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return (
    <div className="sortable-text-list">
      {value.map((item, index) => (
        <div key={index}>
          <span aria-hidden="true">☰</span>
          <input value={item} onChange={(event) => onChange(value.map((x, i) => (i === index ? event.target.value : x)))} placeholder="填写一项" />
          <button type="button" onClick={() => {
            if (index <= 0) return;
            const next = [...value];
            [next[index - 1], next[index]] = [next[index], next[index - 1]];
            onChange(next);
          }} disabled={index === 0}>上移</button>
          <button type="button" onClick={() => onChange(value.filter((_, i) => i !== index))}>删除</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ""])}>+ 添加一项</button>
    </div>
  );
}

function ArrangementBlock({ title, enabled, onToggle, children }: { title: string; enabled: boolean; onToggle: (enabled: boolean) => void; children: ReactNode }) {
  return (
    <section className="arrangement-block">
      <header>
        <h3>{title}</h3>
        <label><input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} /> 前台显示</label>
      </header>
      {children}
    </section>
  );
}

function LinkedPicker({
  title,
  emptyText,
  values,
  options,
  onChange,
}: {
  title: string;
  emptyText: string;
  values: number[];
  options: { id: number; label: string }[];
  onChange: (values: number[]) => void;
}) {
  return (
    <div className="linked-picker">
      <b>{title}</b>
      <select value="" onChange={(event) => {
        const id = Number(event.target.value);
        if (id && !values.includes(id)) onChange([...values, id]);
      }}>
        <option value="">+ 选择</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <div>
        {values.map((id) => {
          const option = options.find((item) => item.id === id);
          return <button key={id} type="button" onClick={() => onChange(values.filter((value) => value !== id))}>{option?.label || `ID ${id}`} ×</button>;
        })}
        {!values.length && <small>{emptyText}</small>}
      </div>
    </div>
  );
}

function PriceTierEditor({
  tiers,
  onChange,
  updateTier,
}: {
  tiers: TravelPackagePriceTier[];
  onChange: (tiers: TravelPackagePriceTier[]) => void;
  updateTier: (index: number, patch: Partial<TravelPackagePriceTier>) => void;
}) {
  return (
    <div className="price-tier-editor">
      {tiers.map((tier, index) => (
        <div key={index}>
          <input value={tier.label} onChange={(event) => updateTier(index, { label: event.target.value })} placeholder="2人 / 5-6人 / 7-10人" />
          <input type="number" min={0} value={tier.price ?? ""} onChange={(event) => updateTier(index, { price: event.target.value ? Number(event.target.value) : null })} placeholder="价格" />
          <input value={tier.unit || "/人"} onChange={(event) => updateTier(index, { unit: event.target.value })} />
          <label><input type="checkbox" checked={tier.visible !== false} onChange={(event) => updateTier(index, { visible: event.target.checked })} /> 公开</label>
          <button type="button" onClick={() => onChange(tiers.filter((_, i) => i !== index))}>删除</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...tiers, { label: "", price: null, unit: "/人", visible: false }])}>+ 添加人数价格</button>
      <small>当前前台仍只展示参考起价；这些价格可作为内部报价参考，公开项后续可扩展展示。</small>
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
