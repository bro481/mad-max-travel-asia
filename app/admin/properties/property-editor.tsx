"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { Room } from "../../data";
import { RoomDetailModal } from "../../home-page";
import type { DestinationRecord } from "../../../db/destinations";
import type { PropertyRecord, PropertySpaceConfig } from "../../../db/properties";

type StepKey = "basic" | "room" | "images" | "amenities" | "stay" | "nearby" | "publish";
type PreviewTab = "card" | "modal";
type ModalTab = "intro" | "amenities" | "stay" | "nearby";

const steps: { key: StepKey; label: string; preview?: ModalTab }[] = [
  { key: "basic", label: "基本信息" },
  { key: "room", label: "房型信息", preview: "intro" },
  { key: "images", label: "图片", preview: "intro" },
  { key: "amenities", label: "设施", preview: "amenities" },
  { key: "stay", label: "入住须知", preview: "stay" },
  { key: "nearby", label: "周边", preview: "nearby" },
  { key: "publish", label: "价格与发布" },
];

const amenityGroups = [
  { title: "基础设施", items: [["⌁", "高速 WiFi"], ["❄", "空调"], ["♨", "热水"], ["⇅", "电梯"]] },
  { title: "生活设施", items: [["⌂", "厨房"], ["▤", "冰箱"], ["◌", "微波炉"], ["◉", "洗衣机"], ["≈", "吹风机"], ["▣", "智能电视"]] },
  { title: "适合人群", items: [["♙", "亲子友好"], ["◷", "适合长住"], ["♡", "情侣友好"]] },
];

const amenityTemplates = {
  公寓基础设施: ["高速 WiFi", "空调", "热水", "电梯", "厨房", "冰箱", "微波炉", "洗衣机", "吹风机", "智能电视"],
  民宿基础设施: ["高速 WiFi", "空调", "热水", "厨房", "冰箱", "吹风机"],
} as const;

const destinationAreas: Record<string, string[]> = {
  吉隆坡: ["KLCC", "武吉免登", "市中心", "Mont Kiara", "Cheras"],
  亚庇: ["市中心", "丹绒亚路", "加雅街", "亚庇机场附近"],
  仙本那: ["镇中心", "码头附近", "海岛度假区"],
};

const bedDefaults: Record<string, { width: string; length: string; sleeps: number }> = {
  单人床: { width: "0.9", length: "2.0", sleeps: 1 },
  双人床: { width: "1.5", length: "2.0", sleeps: 2 },
  "Queen Bed": { width: "1.5", length: "2.0", sleeps: 2 },
  "King Bed": { width: "1.8", length: "2.0", sleeps: 2 },
  沙发床: { width: "0.9", length: "2.0", sleeps: 1 },
  榻榻米: { width: "1.2", length: "2.0", sleeps: 1 },
  其他: { width: "", length: "", sleeps: 1 },
};

const reminderTypes = [
  { key: "noSmoking", label: "禁止吸烟", icon: "🚭", text: "室内请勿吸烟" },
  { key: "noParty", label: "禁止聚会", icon: "🎉", text: "请勿举办聚会" },
  { key: "clean", label: "保持整洁", icon: "🧹", text: "请保持室内整洁" },
  { key: "noPets", label: "禁止宠物", icon: "🐾", text: "不允许携带宠物" },
  { key: "custom", label: "自定义", icon: "•", text: "" },
];

const nearbyTypeIcons: Record<string, string> = { 景点: "🏙", 购物: "🛍", 餐饮: "🍜", 机场: "✈", 交通: "🚇", 医疗: "🏥", 其他: "📍" };
const transportIcons: Record<string, string> = { 步行: "🚶", 驾车: "🚗", 公共交通: "🚇" };

const defaultReminders = [
  { icon: "🚭", text: "室内请勿吸烟" },
  { icon: "🎉", text: "请勿举办聚会" },
  { icon: "🧹", text: "请保持室内整洁" },
  { icon: "🐾", text: "不允许携带宠物" },
];

const blank: Omit<PropertyRecord, "id" | "updatedAt"> = {
  slug: "",
  nameZh: "",
  nameEn: "",
  city: "吉隆坡",
  areaZh: "KLCC",
  areaEn: "",
  tags: ["市中心", "近商圈"],
  images: [],
  imageCategories: {},
  imageOriginals: {},
  guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  descriptionZh: "",
  descriptionEn: "",
  amenities: amenityGroups.flatMap((group) => group.items.map((item) => item[1])),
  highlights: [],
  suitableFor: ["家庭", "情侣"],
  guestQuote: "",
  guestQuoteAuthor: "",
  spaceConfig: {
    layout: "1室1厅1卫",
    area: "约55㎡",
    floor: "",
    livingRooms: 1,
    recommendedGuests: "2–3人",
    recommendedMinGuests: 2,
    recommendedMaxGuests: 3,
    maxGuests: 3,
    checkInTime: "15:00后",
    checkOutTime: "11:00前",
    checkInMethod: "确认后发送入住说明",
    guestRule: "最多3位客人",
    useDefaultReminders: true,
    reminders: defaultReminders,
    currency: "CNY / 人民币",
    priceUnit: "晚",
    showPriceFrom: true,
    priceType: "from",
    visible: true,
  },
  sleepingArrangements: [
    { space: "主卧", bedType: "双人床", width: "1.5", length: "2.0", quantity: 1, sleeps: 2 },
  ],
  nearby: [],
  priceFrom: 0,
  priceNote: "价格随入住日期调整",
  status: "draft",
};

const statusText = (status: PropertyRecord["status"]) =>
  status === "published" ? "已上线" : status === "hidden" ? "已隐藏" : "草稿";
const normalizeFloor = (value?: string) => {
  const v = (value || "").trim();
  return v && !v.endsWith("楼") ? `${v}楼` : v;
};
const bedroomCountFromSleep = (items: PropertyRecord["sleepingArrangements"]) =>
  items.filter((item) => /卧室|主卧|次卧|卧/.test(item.space || "")).length;
const bedCountFromSleep = (items: PropertyRecord["sleepingArrangements"]) =>
  items.reduce((total, item) => total + Number(item.quantity || 0), 0);
const layoutText = (bedrooms: number, livingRooms: number, bathrooms: number) =>
  `${Math.max(0, bedrooms)}室${Math.max(0, livingRooms)}厅${Math.max(0, bathrooms)}卫`;
const formatPriceSuffix = (space?: PropertySpaceConfig) => {
  const unit = (space?.priceUnit || "晚").replace("/", "");
  if (space?.priceType === "consult") return "价格咨询";
  return `${space?.priceType === "fixed" || space?.showPriceFrom === false ? "" : "起 "}/ ${unit}`.trim();
};
const fallbackDestinationOptions: DestinationRecord[] = [
  { id: 1, slug: "kuala-lumpur", nameZh: "吉隆坡", nameEn: "Kuala Lumpur", introZh: "", introEn: "", useForProperties: true, useForServices: true, propertySort: 1, serviceSort: 1, onlyShowWithContent: true, status: "visible", updatedAt: "" },
  { id: 2, slug: "kota-kinabalu", nameZh: "亚庇", nameEn: "Kota Kinabalu", introZh: "", introEn: "", useForProperties: true, useForServices: true, propertySort: 2, serviceSort: 2, onlyShowWithContent: true, status: "visible", updatedAt: "" },
  { id: 3, slug: "semporna", nameZh: "仙本那", nameEn: "Semporna", introZh: "", introEn: "", useForProperties: true, useForServices: true, propertySort: 3, serviceSort: 3, onlyShowWithContent: true, status: "visible", updatedAt: "" },
];
const amenityEn: Record<string, string> = {
  "高速 WiFi": "High-speed WiFi", 空调: "Air Conditioning", 热水: "Hot Water", 电梯: "Elevator",
  厨房: "Kitchen", 冰箱: "Fridge", 微波炉: "Microwave", 洗衣机: "Washer", 吹风机: "Hair Dryer",
  智能电视: "Smart TV", 免费停车: "Free Parking", 收费停车: "Paid Parking", 亲子友好: "Family Friendly",
  适合长住: "Long-stay Ready", 情侣友好: "Couple Friendly",
};
const amenityIcon = new Map(amenityGroups.flatMap((group) => group.items.map(([icon, name]) => [name, icon])));

function buildRoom(data: PropertyRecord, destinationOptions: DestinationRecord[] = fallbackDestinationOptions): Room {
  const space = data.spaceConfig || {};
  const custom = (space.customAmenities || []).filter((item) => item.nameZh);
  const derivedBedrooms = bedroomCountFromSleep(data.sleepingArrangements) || Number(data.bedrooms || 0);
  const derivedBeds = bedCountFromSleep(data.sleepingArrangements) || Number(data.beds || 0);
  const visibleNearby = data.nearby.filter((place) => place.visible !== false);
  return {
    id: data.slug || "preview-room",
    name: { zh: data.nameZh || "房源中文名称", en: data.nameEn || "Room name" },
    location: { zh: data.city, en: destinationOptions.find((item) => item.nameZh === data.city)?.nameEn || data.city },
    area: { zh: space.locationDisplayZh || data.areaZh || "位置待填写", en: space.locationDisplayEn || data.areaEn || data.areaZh || "Area" },
    image: data.images[0] || "",
    images: data.images.length ? data.images : [],
    guests: Number(space.maxGuests || data.guests || 0),
    bedrooms: derivedBedrooms,
    beds: derivedBeds,
    bathrooms: data.bathrooms,
    priceFrom: data.priceFrom || 0,
    description: { zh: data.descriptionZh || "", en: data.descriptionEn || data.descriptionZh || "" },
    amenities: [
      ...data.amenities.map((name) => ({ name: { zh: name, en: amenityEn[name] || name }, icon: amenityIcon.get(name) || "•" })),
      ...custom.map((item) => ({ name: { zh: item.nameZh, en: item.nameEn || item.nameZh }, icon: item.icon || "•" })),
    ],
    highlights: [],
    suitableFor: data.suitableFor || [],
    spaceConfig: { ...space, priceNote: data.priceNote } as Room["spaceConfig"],
    sleepingArrangements: data.sleepingArrangements,
    nearbyPlaces: visibleNearby.map((place) => ({
      name: { zh: place.name, en: place.nameEn || place.name },
      category: { zh: place.type, en: place.type },
      distance: { zh: place.distance || formatNearbyDistance(place), en: place.duration || "" },
      icon: transportIcons[place.transport || ""] || nearbyTypeIcons[place.type] || "📍",
    })),
  };
}

function formatNearbyDistance(place: PropertyRecord["nearby"][number]) {
  const value = place.durationValue ? `${place.durationValue}${place.durationUnit || "分钟"}` : place.duration || "";
  return [place.transport, value].filter(Boolean).join("约");
}
const timeValue = (value?: string) => (value || "").match(/\d{1,2}:\d{2}/)?.[0] || "";

export function PropertyEditor({ initial, destinations = fallbackDestinationOptions }: { initial?: PropertyRecord; destinations?: DestinationRecord[] }) {
  const destinationOptions = useMemo(() => {
    const configured = destinations.filter((item) => item.useForProperties && item.status !== "hidden").sort((a, b) => a.propertySort - b.propertySort || a.id - b.id);
    const includesCurrent = initial?.city && !configured.some((item) => item.nameZh === initial.city);
    return includesCurrent ? [...configured, { ...fallbackDestinationOptions[0], id: -1, nameZh: initial.city, nameEn: initial.city }] : configured.length ? configured : fallbackDestinationOptions;
  }, [destinations, initial]);
  const [data, setData] = useState<PropertyRecord>(() => ({
    ...(initial || blank),
    spaceConfig: { ...blank.spaceConfig, ...(initial?.spaceConfig || {}) },
    sleepingArrangements: initial?.sleepingArrangements?.length ? initial.sleepingArrangements : blank.sleepingArrangements,
  } as PropertyRecord));
  const [propertyId, setPropertyId] = useState<number | null>(initial?.id ?? null);
  const [step, setStepState] = useState(0);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("card");
  const [modalTab, setModalTab] = useState<ModalTab>("intro");
  const [previewPanelOpen, setPreviewPanelOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savingMode, setSavingMode] = useState<"draft" | "published" | null>(null);
  const [saveNotice, setSaveNotice] = useState<{ type: "success" | "error"; message: string; href?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const [importCode, setImportCode] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [brightness, setBrightness] = useState(118);
  const [contrast, setContrast] = useState(94);
  const [saturation, setSaturation] = useState(104);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);

  const set = (key: keyof PropertyRecord, value: unknown) => setData((x) => ({ ...x, [key]: value }));
  const setSpace = (patch: Partial<PropertySpaceConfig>) => setData((x) => ({ ...x, spaceConfig: { ...(x.spaceConfig || {}), ...patch } }));
  const currentStep = steps[step];
  const room = useMemo(() => buildRoom(data, destinationOptions), [data, destinationOptions]);
  const livingRooms = Number(data.spaceConfig?.livingRooms || 1);
  const derivedBedrooms = bedroomCountFromSleep(data.sleepingArrangements) || Number(data.bedrooms || 0);
  const beds = bedCountFromSleep(data.sleepingArrangements);
  const layout = layoutText(derivedBedrooms, livingRooms, Number(data.bathrooms || 0));
  const imageMinimum = 5;

  const setStep = (next: number) => {
    setStepState(next);
    const preview = steps[next]?.preview;
    if (preview) {
      setPreviewTab("modal");
      setModalTab(preview);
    }
  };

  const prepareData = (status?: PropertyRecord["status"]) => ({
    ...data,
    status: status || data.status,
    beds,
    bedrooms: derivedBedrooms,
    guests: Number(data.spaceConfig?.maxGuests || data.guests || 0),
    spaceConfig: {
      ...(data.spaceConfig || {}),
      layout,
      floor: normalizeFloor(data.spaceConfig?.floor),
      guestRule: `最多${Number(data.spaceConfig?.maxGuests || data.guests || 0)}位客人`,
      priceNote: data.priceNote,
      visible: (status || data.status) === "published",
    },
  });

  const save = async (status?: PropertyRecord["status"]) => {
    const mode = status === "published" ? "published" : "draft";
    setSavingMode(mode);
    setSaveNotice(null);
    const next = prepareData(status);
    try {
      let id = propertyId;
      let saved = next;
      if (!id) {
        const response = await fetch("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
        if (response.status === 401) {
          location.href = `/admin/login?return_to=${encodeURIComponent(location.pathname)}`;
          return;
        }
        const created = (await response.json()) as { id?: number; slug?: string; error?: string };
        if (!response.ok || !created.id) throw new Error(created.error || "无法创建房源");
        id = created.id;
        saved = { ...next, slug: created.slug || next.slug };
      }
      const response = await fetch(`/api/admin/properties/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saved) });
      if (response.status === 401) {
        location.href = `/admin/login?return_to=${encodeURIComponent(location.pathname)}`;
        return;
      }
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error || "服务器未能保存房源");
      }
      setPropertyId(id);
      setData(saved);
      window.history.replaceState({}, "", `/admin/properties/${id}`);
      setSaveNotice({ type: "success", message: status === "published" ? "已保存并更新前台。" : "已保存。", href: status === "published" && saved.slug ? `/rooms/${saved.slug}` : undefined });
    } catch (error) {
      setSaveNotice({ type: "error", message: `${status === "published" ? "发布" : "保存"}失败：${error instanceof Error ? error.message : "请稍后重试"}` });
    } finally {
      setSavingMode(null);
    }
  };

  const upload = async (files: FileList | File[], replaceAt?: number) => {
    const list = Array.from(files);
    if (!list.length) return;
    if (list.length > 50) {
      setImageMessage("单次最多上传 50 张图片");
      return;
    }
    setUploading(true);
    setImageMessage(`正在上传 ${list.length} 张图片…`);
    try {
      const form = new FormData();
      list.forEach((f) => form.append("files", f));
      const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
      if (response.status === 401) {
        location.href = `/admin/login?return_to=${encodeURIComponent(location.pathname)}`;
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setImageMessage(result.error || "上传失败");
        return;
      }
      const urls = result.urls as string[];
      set("images", replaceAt !== undefined ? data.images.map((src, i) => (i === replaceAt ? urls[0] : src)) : [...data.images, ...urls]);
      setImageMessage(`已上传 ${urls.length} 张图片`);
    } catch (error) {
      setImageMessage(`上传失败：${error instanceof Error ? error.message : "请求没有返回"}`);
    } finally {
      setUploading(false);
    }
  };

  const createImportCode = async () => {
    const response = await fetch("/api/admin/import-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: propertyId || initial?.id }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setImportCode(result.code);
      setImageMessage("导入码已生成，10 分钟内有效");
    } else {
      setImageMessage("请先登录后台再生成导入码");
    }
  };

  const checkImport = async () => {
    if (!importCode) return;
    const response = await fetch(`/api/admin/import-sessions?code=${importCode}`);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setImageMessage("导入码无效或已过期");
      return;
    }
    const incoming = (result.images || []) as string[];
    const merged = [
      ...data.images,
      ...incoming.filter((src) => !data.images.includes(src)),
    ];
    set("images", merged);
    setImageMessage(
      incoming.length
        ? `已接收 ${incoming.length} 张 Airbnb 图片${result.completed ? "，导入完成" : "，仍在上传中"}`
        : "尚未收到图片，请在 Airbnb 页面使用扩展开始导入",
    );
  };

  const preset = (name: "bright" | "natural" | "warm") => {
    if (name === "bright") {
      setBrightness(118);
      setContrast(94);
      setSaturation(104);
    } else if (name === "warm") {
      setBrightness(108);
      setContrast(103);
      setSaturation(112);
    } else {
      setBrightness(105);
      setContrast(102);
      setSaturation(103);
    }
  };

  const applyFilters = async () => {
    if (!selectedImages.length) {
      setImageMessage("请先勾选要调色的图片");
      return;
    }
    setUploading(true);
    setImageMessage(`正在处理 ${selectedImages.length} 张图片…`);
    try {
      const files: File[] = [];
      for (let i = 0; i < selectedImages.length; i++) {
        const src = selectedImages[i];
        const response = await fetch(src);
        if (!response.ok) throw new Error(`第 ${i + 1} 张图片读取失败`);
        const bitmap = await createImageBitmap(await response.blob());
        const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("浏览器不支持图片处理");
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (value) => (value ? resolve(value) : reject(new Error("图片生成失败"))),
            "image/jpeg",
            0.9,
          ),
        );
        files.push(new File([blob], `adjusted-${i + 1}.jpg`, { type: "image/jpeg" }));
      }
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const uploadedResponse = await fetch("/api/admin/uploads", { method: "POST", body: form });
      if (uploadedResponse.status === 401) {
        location.href = `/admin/login?return_to=${encodeURIComponent(location.pathname)}`;
        return;
      }
      const result = await uploadedResponse.json().catch(() => ({}));
      if (!uploadedResponse.ok) throw new Error(result.error || "上传处理后的图片失败");
      const replacements = new Map(selectedImages.map((src, i) => [src, result.urls[i] as string]));
      const nextImages = data.images.map((src) => replacements.get(src) || src);
      const nextCategories = { ...(data.imageCategories || {}) };
      const nextOriginals = { ...(data.imageOriginals || {}) };
      selectedImages.forEach((src, i) => {
        const nextSrc = result.urls[i];
        if (nextCategories[src]) nextCategories[nextSrc] = nextCategories[src];
        nextOriginals[nextSrc] = nextOriginals[src] || src;
      });
      setData((current) => ({
        ...current,
        images: nextImages,
        imageCategories: nextCategories,
        imageOriginals: nextOriginals,
      }));
      setSelectedImages([]);
      setImageMessage(`已完成 ${result.urls.length} 张图片调色`);
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : "批量调色失败");
    } finally {
      setUploading(false);
    }
  };

  const restoreOriginals = () => {
    const restorable = selectedImages.filter((src) => data.imageOriginals?.[src]);
    if (!restorable.length) {
      setImageMessage("所选图片没有可恢复的原图");
      return;
    }
    const restored = new Map(restorable.map((src) => [src, data.imageOriginals[src]]));
    const nextImages = data.images.map((src) => restored.get(src) || src);
    const nextCategories = { ...(data.imageCategories || {}) };
    restorable.forEach((src) => {
      const original = data.imageOriginals[src];
      if (nextCategories[src]) nextCategories[original] = nextCategories[src];
    });
    setData((current) => ({ ...current, images: nextImages, imageCategories: nextCategories }));
    setSelectedImages([]);
    setImageMessage(`已恢复 ${restorable.length} 张原图，请保存房源使修改生效`);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= data.images.length) return;
    const next = [...data.images];
    const [picked] = next.splice(from, 1);
    next.splice(to, 0, picked);
    set("images", next);
  };
  const updateSleep = (index: number, patch: Partial<PropertyRecord["sleepingArrangements"][number]>) =>
    set("sleepingArrangements", data.sleepingArrangements.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const moveSleep = (index: number, direction: number) => {
    const to = index + direction;
    if (to < 0 || to >= data.sleepingArrangements.length) return;
    const next = [...data.sleepingArrangements];
    [next[index], next[to]] = [next[to], next[index]];
    set("sleepingArrangements", next);
  };
  const changeBedType = (index: number, bedType: string) => {
    const defaults = bedDefaults[bedType] || bedDefaults["其他"];
    updateSleep(index, {
      bedType,
      width: data.sleepingArrangements[index]?.customSize ? data.sleepingArrangements[index].width : defaults.width,
      length: data.sleepingArrangements[index]?.customSize ? data.sleepingArrangements[index].length : defaults.length,
      sleeps: defaults.sleeps,
    });
  };
  const applyAmenityTemplate = (name: keyof typeof amenityTemplates) =>
    set("amenities", [...new Set([...data.amenities.filter((item) => item === "免费停车" || item === "收费停车"), ...amenityTemplates[name]])]);
  const parkingValue = data.amenities.includes("免费停车") ? "免费停车" : data.amenities.includes("收费停车") ? "收费停车" : "无";
  const setParking = (parking: string) => {
    const base = data.amenities.filter((item) => item !== "免费停车" && item !== "收费停车");
    set("amenities", parking === "无" ? base : [...base, parking]);
  };
  const publishChecks = [
    { label: "基本信息完整", ok: Boolean(data.nameZh && data.city && (data.spaceConfig?.locationDisplayZh || data.areaZh)) },
    { label: "房型信息完整", ok: Boolean(derivedBedrooms && data.bathrooms && data.sleepingArrangements.length) },
    { label: `已上传${data.images.length}张图片`, ok: Boolean(data.images[0]), warn: data.images.length > 0 && data.images.length < imageMinimum ? `当前仅${data.images.length}张图片，建议至少${imageMinimum}张` : "" },
    { label: `已选择${data.amenities.length}项设施`, ok: data.amenities.length > 0 },
    { label: "已设置入住须知", ok: Boolean(data.spaceConfig?.checkInTime && data.spaceConfig?.checkOutTime) },
    { label: `已添加${data.nearby.filter((place) => place.visible !== false).length}个周边地点`, ok: data.nearby.filter((place) => place.visible !== false).length > 0 },
    { label: data.spaceConfig?.priceType === "consult" || !data.priceFrom ? "价格咨询" : "已设置价格", ok: data.spaceConfig?.priceType === "consult" || Boolean(data.priceFrom) },
  ];

  return (
    <div className="editor-page property-editor-page">
      <div className="editor-top">
        <div>
          <Link href="/admin/properties">← 返回房源列表</Link>
          <h1>{data.nameZh || (initial ? "编辑房源" : "新增房源")}</h1>
          <span>{statusText(data.status)} · 最后更新于 {initial?.updatedAt ? "刚刚" : "尚未保存"}</span>
        </div>
        <div>
          <button className="admin-secondary" onClick={() => setPreviewOpen(true)}>预览弹窗</button>
          <button className="admin-secondary" onClick={() => save()} disabled={savingMode !== null}>{savingMode === "draft" ? "保存中…" : "保存"}</button>
          <button className="admin-primary" onClick={() => save("published")} disabled={savingMode !== null}>
            {savingMode === "published" ? "更新中…" : data.status === "published" ? "保存并更新" : "发布房源"}
          </button>
        </div>
      </div>

      {saveNotice && <div className={`save-notice ${saveNotice.type}`} role="status"><span>{saveNotice.type === "success" ? "✓" : "!"}</span><strong>{saveNotice.message}</strong>{saveNotice.href && <a href={saveNotice.href} target="_blank" rel="noreferrer">查看前台</a>}<button onClick={() => setSaveNotice(null)} aria-label="关闭提示">×</button></div>}

      <div className={`editor-layout property-editor-layout ${previewPanelOpen ? "preview-expanded" : "preview-collapsed"}`}>
        <aside className="step-nav">
          {steps.map((item, index) => {
            const state = stepState(item.key, data, imageMinimum);
            return (
              <button className={[step === index ? "active" : "", state.done ? "done" : "", state.warn ? "warn" : ""].filter(Boolean).join(" ")} onClick={() => setStep(index)} key={item.key}>
                <i>{state.done ? "✓" : state.warn ? "!" : index + 1}</i>
                <span>{item.label}</span>
                {state.meta && <em>{state.meta}</em>}
              </button>
            );
          })}
        </aside>

        <section className="editor-form">
          {currentStep.key === "basic" && (
            <Block title="基本信息" desc="控制房源弹窗顶部名称、位置，以及后台筛选用标签。">
              <Field label="中文名称"><input value={data.nameZh} onChange={(e) => set("nameZh", e.target.value)} placeholder="吉隆坡温馨套房" /></Field>
              <Field label="英文名称"><input value={data.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="KL Cozy Suite" /></Field>
              <div className="field-row">
                <Field label="目的地"><select value={data.city} onChange={(e) => { const city = e.target.value; setData((current) => ({ ...current, city, areaZh: destinationAreas[city]?.[0] || current.areaZh || "", spaceConfig: { ...(current.spaceConfig || {}), locationDisplayZh: "" } })); }}>{destinationOptions.map((destination) => <option key={destination.slug || destination.nameZh} value={destination.nameZh}>{destination.nameZh}</option>)}</select></Field>
                <Field label="所在区域">
                  {destinationAreas[data.city]?.length ? (
                    <select value={data.areaZh} onChange={(e) => set("areaZh", e.target.value)}>
                      {destinationAreas[data.city].map((area) => <option key={area}>{area}</option>)}
                    </select>
                  ) : (
                    <input value={data.areaZh} onChange={(e) => set("areaZh", e.target.value)} placeholder="例如 George Town / 市中心" />
                  )}
                </Field>
              </div>
              <Field label="位置展示文案"><input value={data.spaceConfig?.locationDisplayZh || ""} onChange={(e) => setSpace({ locationDisplayZh: e.target.value })} placeholder="市中心 · 近 Pavilion" /></Field>
              <TagEditor title="展示标签" values={data.tags} onChange={(tags) => set("tags", tags)} placeholder="市中心 / 近商圈 / 景观好 / 高楼层" />
              <TagEditor title="适合人群" values={data.suitableFor || []} onChange={(tags) => set("suitableFor", tags)} placeholder="家庭 / 情侣 / 长住 / 朋友出行" />
              <Field label="简短说明（选填）"><textarea rows={3} value={data.descriptionZh} onChange={(e) => set("descriptionZh", e.target.value)} placeholder="如果前台后续需要一句简介，可以填这里。" /></Field>
              <Field label="后台备注"><textarea rows={3} value={data.spaceConfig?.internalNote || ""} onChange={(e) => setSpace({ internalNote: e.target.value })} placeholder="仅后台可见，例如：周末价格高，适合2-3人。" /></Field>
            </Block>
          )}

          {currentStep.key === "room" && (
            <Block title="房型信息" desc="直接对应前台弹窗的“房型信息” Tab。">
              <h3 className="form-section-title">空间配置</h3>
              <div className="generated-preview room-identity">
                <span>卧室 <b>{derivedBedrooms}</b></span>
                <span>床位 <b>{beds}</b></span>
                <span>户型 <b>{layout}</b></span>
                <small>卧室和床位由下方睡眠安排自动统计。</small>
              </div>
              <div className="stat-inputs compact-space">
                <Field label="客厅"><input type="number" min="0" value={livingRooms} onChange={(e) => setSpace({ livingRooms: Number(e.target.value) })} /></Field>
                <Field label="浴室数量"><input type="number" min="0" value={data.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} /></Field>
                <Field label="房屋面积"><div className="input-suffix"><input value={(data.spaceConfig?.area || "").replace(/㎡|约/g, "")} onChange={(e) => setSpace({ area: e.target.value ? `约${e.target.value}㎡` : "" })} /><span>㎡</span></div></Field>
                <Field label="最大入住人数"><input type="number" min="1" value={data.spaceConfig?.maxGuests || data.guests} onChange={(e) => setSpace({ maxGuests: Number(e.target.value) })} /></Field>
                <Field label="推荐最低人数"><input type="number" min="1" value={data.spaceConfig?.recommendedMinGuests || ""} onChange={(e) => setSpace({ recommendedMinGuests: Number(e.target.value), recommendedGuests: `${Number(e.target.value) || ""}–${data.spaceConfig?.recommendedMaxGuests || ""}人` })} /></Field>
                <Field label="推荐最高人数"><input type="number" min="1" value={data.spaceConfig?.recommendedMaxGuests || ""} onChange={(e) => setSpace({ recommendedMaxGuests: Number(e.target.value), recommendedGuests: `${data.spaceConfig?.recommendedMinGuests || ""}–${Number(e.target.value) || ""}人` })} /></Field>
                <Field label="所在楼层"><input value={(data.spaceConfig?.floor || "").replace("楼", "")} onChange={(e) => setSpace({ floor: e.target.value })} placeholder="18" /></Field>
              </div>
              <div className="generated-preview">前台将显示：<b>{layout}</b> · 最多{data.spaceConfig?.maxGuests || data.guests}人 · 推荐{data.spaceConfig?.recommendedGuests || "未设置"}</div>
              <div className="repeater-head"><div><h3>睡眠安排</h3><p>设置每个卧室或睡眠区域的床型和可入住人数。</p></div><button className="add-row" onClick={() => set("sleepingArrangements", [...data.sleepingArrangements, { space: "次卧", bedType: "双人床", width: "1.5", length: "2.0", quantity: 1, sleeps: 2 }])}>＋ 添加睡眠区域</button></div>
              <div className="sleep-card-list">{data.sleepingArrangements.map((item, index) => <article className="sleep-card" key={index}><div className="sleep-card-top"><b>{item.space || `睡眠区域 ${index + 1}`}</b><div><button onClick={() => moveSleep(index, -1)}>↑</button><button onClick={() => moveSleep(index, 1)}>↓</button><button className="danger" onClick={() => set("sleepingArrangements", data.sleepingArrangements.filter((_, i) => i !== index))}>删除</button></div></div><div className="field-row"><Field label="区域名称"><select value={["主卧", "次卧", "客厅"].includes(item.space) ? item.space : "其他"} onChange={(e) => updateSleep(index, { space: e.target.value === "其他" ? "" : e.target.value })}>{["主卧", "次卧", "客厅", "其他"].map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="自定义名称"><input value={item.space} onChange={(e) => updateSleep(index, { space: e.target.value })} placeholder="楼上卧室" /></Field></div><div className="field-row three"><Field label="床型"><select value={item.bedType} onChange={(e) => changeBedType(index, e.target.value)}>{Object.keys(bedDefaults).map((x) => <option value={x} key={x}>{x}{x !== "其他" ? `（${bedDefaults[x].width} × ${bedDefaults[x].length}m）` : ""}</option>)}</select></Field><Field label="数量"><input type="number" min="1" value={item.quantity} onChange={(e) => updateSleep(index, { quantity: Number(e.target.value) })} /></Field><Field label="可睡人数"><input type="number" min="1" value={item.sleeps} onChange={(e) => updateSleep(index, { sleeps: Number(e.target.value) })} /></Field></div><label className="toggle-line compact-toggle"><input type="checkbox" checked={Boolean(item.customSize)} onChange={(e) => updateSleep(index, { customSize: e.target.checked })} />自定义床尺寸</label>{item.customSize && <div className="field-row"><Field label="床宽"><input value={item.width} onChange={(e) => updateSleep(index, { width: e.target.value })} placeholder="1.5" /></Field><Field label="床长"><input value={item.length} onChange={(e) => updateSleep(index, { length: e.target.value })} placeholder="2.0" /></Field></div>}<div className="generated-preview sleep-summary">前台将显示：{item.space || "睡眠区域"} · {item.width || "-"}m × {item.length || "-"}m {item.bedType} × {item.quantity} · 可睡{item.sleeps}人</div></article>)}</div>
            </Block>
          )}

          {currentStep.key === "images" && (
            <Block title="图片管理" desc="支持拖拽或多选批量上传，单次最多 50 张；第一张图片默认作为房源封面。">
              <input ref={fileInput} className="hidden-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={(e) => e.target.files && upload(e.target.files)} />
              <input ref={replaceInput} className="hidden-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => { if (e.target.files && replaceIndex !== null) upload(e.target.files, replaceIndex); e.target.value = ""; }} />
              <div className={`upload-drop ${uploading ? "busy" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
                <b>⇧</b>
                <h3>拖拽图片到这里批量上传</h3>
                <p>支持 JPG、PNG、WebP、AVIF，单张不超过 15MB</p>
                <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}>选择多张图片</button>
              </div>
              <div className="airbnb-import extension-import">
                <div>
                  <b>从当前 Airbnb 页面导入</b>
                  <small>通过浏览器扩展读取你已打开的房源页面</small>
                </div>
                <ol>
                  <li><a href="/downloads/my-malaysia-airbnb-importer.zip" download>下载并安装图片导入扩展</a></li>
                  <li>打开 Airbnb 房源的“显示所有照片”页面</li>
                  <li>生成导入码，在扩展中输入并开始导入</li>
                </ol>
                <div>
                  {importCode ? <strong className="pair-code">{importCode}</strong> : <button type="button" onClick={createImportCode}>生成一次性导入码</button>}
                  {importCode && <button type="button" onClick={checkImport}>检查导入结果</button>}
                </div>
              </div>
              {imageMessage && <p className="image-message">{imageMessage}</p>}
              <div className="batch-filter">
                <div className="filter-head">
                  <div>
                    <b>批量调色</b>
                    <small>已选择 {selectedImages.length} 张图片</small>
                  </div>
                  <div>
                    <button type="button" onClick={() => preset("bright")}>透亮</button>
                    <button type="button" onClick={() => preset("natural")}>自然</button>
                    <button type="button" onClick={() => preset("warm")}>暖色</button>
                  </div>
                </div>
                <div className="filter-sliders">
                  <label>亮度 <b>{brightness}%</b><input type="range" min="80" max="135" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></label>
                  <label>对比度 <b>{contrast}%</b><input type="range" min="85" max="125" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></label>
                  <label>饱和度 <b>{saturation}%</b><input type="range" min="80" max="135" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} /></label>
                </div>
                <div className="filter-actions">
                  <button type="button" onClick={() => setSelectedImages(selectedImages.length === data.images.length ? [] : [...data.images])}>{selectedImages.length === data.images.length ? "取消全选" : "全选图片"}</button>
                  <div>
                    <button type="button" className="restore-filter" onClick={restoreOriginals} disabled={!selectedImages.length}>恢复原图</button>
                    <button type="button" className="apply-filter" onClick={applyFilters} disabled={uploading || !selectedImages.length}>{uploading ? "处理中…" : "应用到所选图片"}</button>
                  </div>
                </div>
              </div>
              <div className="media-toolbar">
                <b>房源图库</b>
                <span>{data.images.length} 张 · 勾选后可批量调色</span>
              </div>
              <div className="image-list">
                {data.images.map((src, i) => (
                  <div className={selectedImages.includes(src) ? "selected" : ""} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData("text/plain")); if (Number.isNaN(from) || from === i) return; moveImage(from, i); }} key={`${src}-${i}`}>
                    <label className="image-select">
                      <input type="checkbox" checked={selectedImages.includes(src)} onChange={(e) => setSelectedImages(e.target.checked ? [...selectedImages, src] : selectedImages.filter((item) => item !== src))} />
                      <span>✓</span>
                    </label>
                    <img src={src} alt="" style={{ filter: selectedImages.includes(src) ? `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)` : "none" }} />
                    <span>
                      <b>{i === 0 ? "★ 房源封面" : `图片 ${i + 1}`}</b>
                      <select value={data.imageCategories?.[src] || "未分类"} onChange={(e) => set("imageCategories", { ...(data.imageCategories || {}), [src]: e.target.value })}>
                        {["未分类", "外观", "客厅", "卧室", "浴室", "厨房", "景观", "设施", "周边"].map((name) => <option key={name}>{name}</option>)}
                      </select>
                    </span>
                    <div>
                      <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0}>↑</button>
                      <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === data.images.length - 1}>↓</button>
                      {i > 0 && <button type="button" onClick={() => set("images", [src, ...data.images.filter((_, index) => index !== i)])}>设封面</button>}
                      <button type="button" onClick={() => { setReplaceIndex(i); replaceInput.current?.click(); }}>替换</button>
                      <button type="button" className="danger" onClick={() => { set("images", data.images.filter((_, index) => index !== i)); setSelectedImages((current) => current.filter((item) => item !== src)); }}>删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </Block>
          )}

          {currentStep.key === "amenities" && (
            <Block title="设施" desc="勾选哪个，前台设施 Tab 就显示哪个。默认常用设施已选中。">
              <div className="template-actions">
                <span>套用设施模板</span>
                {Object.keys(amenityTemplates).map((name) => <button type="button" onClick={() => applyAmenityTemplate(name as keyof typeof amenityTemplates)} key={name}>{name}</button>)}
              </div>
              {amenityGroups.map((group) => <div className="amenity-group" key={group.title}><h3>{group.title}</h3><div className="amenity-card-grid">{group.items.map(([icon, name]) => <label key={name}><input type="checkbox" checked={data.amenities.includes(name)} onChange={(e) => set("amenities", e.target.checked ? [...data.amenities, name] : data.amenities.filter((x) => x !== name))} /><span><i>{icon}</i>{name}</span></label>)}</div></div>)}
              <div className="amenity-group">
                <h3>停车</h3>
                <div className="radio-card-grid">
                  {["无", "免费停车", "收费停车"].map((name) => <label key={name}><input type="radio" name="parking" checked={parkingValue === name} onChange={() => setParking(name)} /><span>{name}</span></label>)}
                </div>
              </div>
              <CustomAmenities value={data.spaceConfig?.customAmenities || []} onChange={(customAmenities) => setSpace({ customAmenities })} />
            </Block>
          )}

          {currentStep.key === "stay" && (
            <Block title="入住须知" desc="对应前台弹窗的“入住须知” Tab。">
              <h3 className="form-section-title">入住信息</h3>
              <div className="stat-inputs compact-space"><Field label="入住时间"><input type="time" value={timeValue(data.spaceConfig?.checkInTime) || "15:00"} onChange={(e) => setSpace({ checkInTime: `${e.target.value}后` })} /></Field><Field label="退房时间"><input type="time" value={timeValue(data.spaceConfig?.checkOutTime) || "11:00"} onChange={(e) => setSpace({ checkOutTime: `${e.target.value}前` })} /></Field><Field label="入住方式"><input value={data.spaceConfig?.checkInMethod || ""} onChange={(e) => setSpace({ checkInMethod: e.target.value })} placeholder="确认后发送入住说明" /></Field><div className="readonly-field"><span>入住人数</span><b>最多{data.spaceConfig?.maxGuests || data.guests}位客人</b><small>自动读取房型信息，不在这里重复维护。</small></div></div>
              <div className="repeater-head"><div><h3>入住提醒</h3><p>每套房可以独立维护，也可以使用默认提醒。</p></div><label className="toggle-line"><input type="checkbox" checked={data.spaceConfig?.useDefaultReminders !== false} onChange={(e) => setSpace({ useDefaultReminders: e.target.checked, reminders: e.target.checked ? defaultReminders : data.spaceConfig?.reminders || [] })} />使用默认入住提醒</label></div>
              <ReminderEditor value={data.spaceConfig?.reminders || defaultReminders} onChange={(reminders) => setSpace({ reminders, useDefaultReminders: false })} />
            </Block>
          )}

          {currentStep.key === "nearby" && (
            <Block title="周边" desc="结构化维护周边地点，而不是写一大段自由文字。">
              <div className="repeater-head"><div><h3>周边地点</h3><p>前端会按这里的顺序展示，可保留资料但隐藏不展示。</p></div><button className="add-row" onClick={() => set("nearby", [...data.nearby, { name: "", nameEn: "", type: "景点", transport: "驾车", duration: "5分钟", durationValue: 5, durationUnit: "分钟", distance: "驾车约5分钟", visible: true }])}>＋ 添加地点</button></div>
              <div className="nearby-editor-list">{data.nearby.map((place, index) => <article key={index}><div className="sleep-card-top"><b>{place.name || `地点 ${index + 1}`}</b><div><label className="inline-toggle"><input type="checkbox" checked={place.visible !== false} onChange={(e) => updateNearby(data, set, index, { visible: e.target.checked })} />前台显示</label><button onClick={() => moveNearby(data, set, index, -1)}>↑</button><button onClick={() => moveNearby(data, set, index, 1)}>↓</button><button className="danger" onClick={() => set("nearby", data.nearby.filter((_, i) => i !== index))}>删除</button></div></div><div className="field-row"><Field label="名称"><input value={place.name} onChange={(e) => updateNearby(data, set, index, { name: e.target.value })} /></Field><Field label="英文名称"><input value={place.nameEn || ""} onChange={(e) => updateNearby(data, set, index, { nameEn: e.target.value })} /></Field></div><div className="field-row three"><Field label="类别"><select value={place.type} onChange={(e) => updateNearby(data, set, index, { type: e.target.value })}>{["景点", "购物", "餐饮", "机场", "交通", "医疗", "其他"].map((x) => <option value={x} key={x}>{nearbyTypeIcons[x]} {x}</option>)}</select></Field><Field label="交通方式"><select value={place.transport || "驾车"} onChange={(e) => updateNearby(data, set, index, { transport: e.target.value, distance: formatNearbyDistance({ ...place, transport: e.target.value }) })}>{["步行", "驾车", "公共交通"].map((x) => <option value={x} key={x}>{transportIcons[x]} {x}</option>)}</select></Field><Field label="所需时间"><div className="duration-field"><input type="number" min="1" value={place.durationValue || Number((place.duration || "").match(/\d+/)?.[0] || 5)} onChange={(e) => { const durationValue = Number(e.target.value); updateNearby(data, set, index, { durationValue, duration: `${durationValue}${place.durationUnit || "分钟"}`, distance: formatNearbyDistance({ ...place, durationValue }) }); }} /><select value={place.durationUnit || "分钟"} onChange={(e) => { const durationUnit = e.target.value; const durationValue = place.durationValue || Number((place.duration || "").match(/\d+/)?.[0] || 5); updateNearby(data, set, index, { durationUnit, duration: `${durationValue}${durationUnit}`, distance: formatNearbyDistance({ ...place, durationValue, durationUnit }) }); }}><option>分钟</option><option>小时</option></select></div></Field></div><div className="generated-preview sleep-summary">前台将显示：{transportIcons[place.transport || ""] || nearbyTypeIcons[place.type] || "📍"} {place.name || "地点"} · {formatNearbyDistance(place)}</div></article>)}</div>
              <Field label="周边补充说明"><textarea rows={3} value={data.spaceConfig?.nearbyNote || ""} onChange={(e) => setSpace({ nearbyNote: e.target.value })} placeholder="位于武吉免登核心区域，周边购物、餐饮和交通方便。" /></Field>
            </Block>
          )}

          {currentStep.key === "publish" && (
            <Block title="价格与发布" desc="参考价格和发布状态放在一起，保存草稿不受发布检查限制。">
              <h3 className="form-section-title">价格</h3>
              <div className="field-row three"><Field label="价格类型"><select value={data.spaceConfig?.priceType || (data.spaceConfig?.showPriceFrom === false ? "fixed" : "from")} onChange={(e) => setSpace({ priceType: e.target.value as PropertySpaceConfig["priceType"], showPriceFrom: e.target.value === "from" })}><option value="from">起价</option><option value="fixed">固定价</option><option value="consult">价格咨询</option></select></Field><Field label="币种"><select value={data.spaceConfig?.currency || "CNY / 人民币"} onChange={(e) => setSpace({ currency: e.target.value })}><option>CNY / 人民币</option><option>MYR</option></select></Field><Field label="计价单位"><select value={(data.spaceConfig?.priceUnit || "晚").replace("/", "")} onChange={(e) => setSpace({ priceUnit: e.target.value })}><option>晚</option><option>月</option><option>人</option></select></Field></div>
              <Field label="价格"><div className="price-input"><span>¥</span><input type="number" disabled={data.spaceConfig?.priceType === "consult"} value={data.priceFrom || ""} onChange={(e) => set("priceFrom", Number(e.target.value))} /><span>{formatPriceSuffix(data.spaceConfig)}</span></div></Field>
              <Field label="价格说明"><input value={data.priceNote || ""} onChange={(e) => set("priceNote", e.target.value)} placeholder="价格随入住日期调整" /></Field>
              <h3 className="form-section-title">发布设置</h3>
              <Field label="状态"><select value={data.status} onChange={(e) => set("status", e.target.value as PropertyRecord["status"])}><option value="draft">草稿（后台保存，不显示）</option><option value="published">已上线（前台显示）</option><option value="hidden">已隐藏（保留数据，不显示）</option></select></Field>
              <details className="advanced-settings"><summary>高级设置</summary><Field label="排序权重"><input type="number" value={data.spaceConfig?.sortOrder || 0} onChange={(e) => setSpace({ sortOrder: Number(e.target.value) })} /></Field><small>大量房源排序建议在列表页拖拽调整，这里仅保留兼容字段。</small></details>
              <div className="publish-check compact-check"><ul>{publishChecks.map((item) => <li className={item.ok ? "ok" : item.warn ? "warn" : ""} key={item.label}>{item.label}{item.warn && <small>{item.warn}</small>}</li>)}</ul></div>
            </Block>
          )}
        </section>

        <aside className={`live-preview property-live-preview ${previewPanelOpen ? "expanded" : "collapsed"}`}>
          {!previewPanelOpen ? (
            <div className="preview-collapsed-card">
              <span>实时预览</span>
              <button type="button" onClick={() => setPreviewPanelOpen(true)}>打开实时预览</button>
              <small>{currentStep.preview ? `将定位到：${currentStep.label}` : "查看列表卡片或详情弹窗"}</small>
            </div>
          ) : (
            <>
              <div className="preview-panel-head"><b>实时预览</b><button type="button" onClick={() => setPreviewPanelOpen(false)}>收起</button></div>
              <div className="preview-tabs"><button className={previewTab === "card" ? "active" : ""} onClick={() => setPreviewTab("card")}>列表卡片</button><button className={previewTab === "modal" ? "active" : ""} onClick={() => setPreviewTab("modal")}>详情弹窗</button></div>
              {previewTab === "card" ? <PropertyCardPreview data={data} layout={layout} /> : <div className="inline-room-modal-preview"><RoomDetailModal room={room} lang="zh" initialTab={modalTab} onClose={() => setPreviewTab("card")} /></div>}
              <small className="unsaved-hint">编辑后记得点顶部保存。</small>
            </>
          )}
        </aside>
      </div>

      {previewOpen && <RoomDetailModal room={room} lang="zh" initialTab={modalTab} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}

function stepState(key: StepKey, data: PropertyRecord, imageMinimum: number) {
  if (key === "basic") return { done: Boolean(data.nameZh && data.city && (data.spaceConfig?.locationDisplayZh || data.areaZh)), meta: data.areaZh || data.city };
  if (key === "room") {
    const bedrooms = bedroomCountFromSleep(data.sleepingArrangements) || Number(data.bedrooms || 0);
    const beds = bedCountFromSleep(data.sleepingArrangements);
    return { done: Boolean(bedrooms && data.bathrooms && data.sleepingArrangements.length), meta: `${bedrooms}室 · ${beds}床` };
  }
  if (key === "images") return { done: data.images.length >= imageMinimum, warn: data.images.length > 0 && data.images.length < imageMinimum, meta: `${data.images.length}/${imageMinimum}` };
  if (key === "amenities") return { done: data.amenities.length > 0, meta: `${data.amenities.length}项` };
  if (key === "stay") return { done: Boolean(data.spaceConfig?.checkInTime && data.spaceConfig?.checkOutTime), meta: data.spaceConfig?.checkInTime || "" };
  if (key === "nearby") {
    const visible = data.nearby.filter((place) => place.visible !== false).length;
    return { done: visible > 0, meta: `${visible}项` };
  }
  return { done: data.spaceConfig?.priceType === "consult" || Boolean(data.priceFrom), meta: statusText(data.status) };
}

function PropertyCardPreview({ data, layout }: { data: PropertyRecord; layout: string }) {
  const area = data.spaceConfig?.locationDisplayZh || data.areaZh || "区域待填写";
  const max = data.spaceConfig?.maxGuests || data.guests;
  const unit = (data.spaceConfig?.priceUnit || "晚").replace("/", "");
  const priceType = data.spaceConfig?.priceType || (data.spaceConfig?.showPriceFrom === false ? "fixed" : "from");
  const price = priceType === "consult" || !data.priceFrom ? "价格咨询" : `¥${data.priceFrom}${priceType === "from" ? " 起" : ""} / ${unit}`;
  return <div className="preview-card">{data.images[0] ? <img src={data.images[0]} alt="" /> : <div className="empty-cover">添加封面图片</div>}<div><small>📍 {data.city} · {area}</small><h2>{data.nameZh || "房源中文名称"}</h2><p>{layout} · 最多{max}人</p><b>{price}</b></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="editor-field"><span>{label}</span>{children}</label>;
}
function Block({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return <><div className="block-head"><h2>{title}</h2><p>{desc}</p></div>{children}</>;
}

function TagEditor({ title, values, onChange, placeholder }: { title: string; values: string[]; onChange: (x: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  return <div className="tag-admin-editor"><span>{title}</span><div>{values.map((value, index) => <button type="button" key={`${value}-${index}`} onClick={() => onChange(values.filter((_, i) => i !== index))}>{value} ×</button>)}</div><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { e.preventDefault(); onChange([...values, draft.trim()]); setDraft(""); } }} placeholder={placeholder} /><button type="button" className="add-row" onClick={() => { if (!draft.trim()) return; onChange([...values, draft.trim()]); setDraft(""); }}>＋ 添加</button></div>;
}

function CustomAmenities({ value, onChange }: { value: NonNullable<PropertySpaceConfig["customAmenities"]>; onChange: (x: NonNullable<PropertySpaceConfig["customAmenities"]>) => void }) {
  return <div className="custom-amenities"><div className="repeater-head"><div><h3>自定义设施</h3><p>如果常用库没有，可以在这里补充。</p></div><button className="add-row" onClick={() => onChange([...value, { nameZh: "", nameEn: "", icon: "•" }])}>＋ 添加自定义设施</button></div>{value.map((item, index) => <div className="field-row three" key={index}><Field label="中文名称"><input value={item.nameZh} onChange={(e) => onChange(value.map((x, i) => i === index ? { ...x, nameZh: e.target.value } : x))} /></Field><Field label="英文名称"><input value={item.nameEn || ""} onChange={(e) => onChange(value.map((x, i) => i === index ? { ...x, nameEn: e.target.value } : x))} /></Field><Field label="图标"><input value={item.icon} onChange={(e) => onChange(value.map((x, i) => i === index ? { ...x, icon: e.target.value } : x))} /></Field></div>)}</div>;
}

function ReminderEditor({ value, onChange }: { value: { icon: string; text: string }[]; onChange: (x: { icon: string; text: string }[]) => void }) {
  return <div className="reminder-list">{value.map((item, index) => {
    const matched = reminderTypes.find((type) => type.icon === item.icon && (!type.text || type.text === item.text));
    return <div key={index}><select value={matched?.key || "custom"} onChange={(e) => { const type = reminderTypes.find((option) => option.key === e.target.value) || reminderTypes[reminderTypes.length - 1]; onChange(value.map((x, i) => i === index ? { icon: type.icon, text: type.text || x.text } : x)); }}>{reminderTypes.map((type) => <option value={type.key} key={type.key}>{type.label}</option>)}</select>{(matched?.key || "custom") === "custom" && <input value={item.icon} onChange={(e) => onChange(value.map((x, i) => i === index ? { ...x, icon: e.target.value } : x))} />}<input value={item.text} onChange={(e) => onChange(value.map((x, i) => i === index ? { ...x, text: e.target.value } : x))} /><button onClick={() => onChange(value.filter((_, i) => i !== index))}>删除</button></div>;
  })}<button className="add-row" onClick={() => onChange([...value, { icon: "•", text: "" }])}>＋ 新增提醒</button></div>;
}

function updateNearby(data: PropertyRecord, set: (key: keyof PropertyRecord, value: unknown) => void, index: number, patch: Partial<PropertyRecord["nearby"][number]>) {
  set("nearby", data.nearby.map((item, i) => i === index ? { ...item, ...patch } : item));
}
function moveNearby(data: PropertyRecord, set: (key: keyof PropertyRecord, value: unknown) => void, index: number, direction: number) {
  const to = index + direction;
  if (to < 0 || to >= data.nearby.length) return;
  const next = [...data.nearby];
  [next[index], next[to]] = [next[to], next[index]];
  set("nearby", next);
}
