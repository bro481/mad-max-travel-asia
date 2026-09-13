"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { TravelGuideArticle, TravelGuideBlock, TravelGuideSettings, TravelGuideStatus } from "../../../db/travel-guide-shared";
import { defaultGuideSettings, guideCategories, guideCities } from "../../../db/travel-guide-shared";

type AdminSection = "list" | "editor" | "settings";
type BlockType = TravelGuideBlock["type"];

const emptyArticle: TravelGuideArticle = {
  id: 0,
  slug: "",
  titleZh: "未命名攻略",
  titleEn: "",
  city: "kuala-lumpur",
  category: "城市漫游",
  summaryZh: "",
  summaryEn: "",
  coverImage: "",
  imageLabel: "",
  readMinutes: 4,
  sortOrder: 99,
  featured: false,
  status: "draft",
  contentBlocks: [{ type: "paragraph", text: "" }],
  updatedAt: "",
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function cityName(key: TravelGuideArticle["city"]) {
  return guideCities.find((item) => item.key === key)?.zh || "吉隆坡";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function newBlock(type: BlockType): TravelGuideBlock {
  if (type === "image") return { type, image: "", caption: "" };
  if (type === "gallery") return { type, images: [""], caption: "" };
  if (type === "list") return { type, items: [""] };
  if (type === "divider") return { type };
  return { type, text: "" };
}

export default function AdminTravelGuidesPage() {
  const [items, setItems] = useState<TravelGuideArticle[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [draft, setDraft] = useState<TravelGuideArticle>(() => clone(emptyArticle));
  const [settings, setSettings] = useState<TravelGuideSettings>(defaultGuideSettings);
  const [section, setSection] = useState<AdminSection>("editor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");

  const filtered = useMemo(
    () => items.filter((item) => filterCity === "all" || item.city === filterCity),
    [filterCity, items],
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/admin/travel-guides", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/travel-guides/settings", { cache: "no-store" }).then((response) => response.json()).catch(() => defaultGuideSettings),
    ])
      .then(([articleData, settingsData]) => {
        if (!mounted) return;
        const next = Array.isArray(articleData) ? articleData : [];
        setItems(next);
        setSettings({ ...defaultGuideSettings, ...settingsData });
        if (next[0]) {
          setSelectedId(next[0].id);
          setDraft(clone(next[0]));
        }
      })
      .catch(() => setMessage("旅行攻略数据加载失败"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const setField = <K extends keyof TravelGuideArticle>(key: K, value: TravelGuideArticle[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateBlock = (index: number, block: TravelGuideBlock) => {
    setDraft((current) => ({ ...current, contentBlocks: current.contentBlocks.map((item, i) => (i === index ? block : item)) }));
  };
  const moveBlock = (index: number, dir: -1 | 1) => {
    setDraft((current) => {
      const next = [...current.contentBlocks];
      const target = index + dir;
      if (target < 0 || target >= next.length) return current;
      const [block] = next.splice(index, 1);
      next.splice(target, 0, block);
      return { ...current, contentBlocks: next };
    });
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, apply: (url: string) => void) => {
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
      apply(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      setSaving(false);
    }
  };

  const normalizedDraft = (status?: TravelGuideStatus) => ({
    ...draft,
    slug: draft.slug || slugify(draft.titleEn || draft.titleZh) || `guide-${Date.now()}`,
    readMinutes: Math.max(1, Number(draft.readMinutes || 4)),
    sortOrder: Number(draft.sortOrder || 99),
    status: status || draft.status,
    contentBlocks: draft.contentBlocks.filter((block) => {
      if (block.type === "divider") return true;
      if (block.type === "image") return Boolean(block.image);
      if (block.type === "gallery") return block.images.some(Boolean);
      if (block.type === "list") return block.items.some(Boolean);
      return Boolean(block.text.trim());
    }),
  });

  const refresh = async (id?: number | "new") => {
    const refreshed = await fetch("/api/admin/travel-guides", { cache: "no-store" }).then((response) => response.json());
    const nextItems = Array.isArray(refreshed) ? refreshed : [];
    setItems(nextItems);
    if (id && id !== "new") {
      const saved = nextItems.find((item) => item.id === id);
      if (saved) {
        setSelectedId(saved.id);
        setDraft(clone(saved));
      }
    }
  };

  const saveArticle = async (status?: TravelGuideStatus) => {
    setSaving(true);
    setMessage("");
    try {
      const isNew = selectedId === "new";
      const response = await fetch(isNew ? "/api/admin/travel-guides" : `/api/admin/travel-guides/${selectedId}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedDraft(status)),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");
      const nextId = isNew ? Number(data.id) : selectedId;
      await refresh(nextId);
      setMessage(status === "published" ? "攻略已保存并发布。" : "攻略已保存为草稿。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/travel-guides/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("页面设置保存失败");
      setMessage("页面设置已保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (selectedId === "new") return;
    if (!confirm(`确定删除「${draft.titleZh}」吗？`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/travel-guides/${selectedId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      await refresh();
      setSelectedId("new");
      setDraft(clone(emptyArticle));
      setMessage("已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-guide-page"><p>正在加载旅行攻略...</p></div>;

  return (
    <div className="admin-guide-page">
      <div className="admin-guide-top">
        <div>
          <Link href="/admin">← 旅行攻略</Link>
          <h1>旅行攻略</h1>
          <p>管理前台攻略入口页、城市 Tab 和攻略文章。</p>
        </div>
        <div>
          <Link className="admin-secondary" href="/photography" target="_blank">查看前台</Link>
          <button className="admin-secondary" type="button" onClick={() => { setSelectedId("new"); setDraft(clone(emptyArticle)); setSection("editor"); }}>新建攻略</button>
          <button className="admin-primary" type="button" onClick={() => section === "settings" ? saveSettings() : saveArticle("published")} disabled={saving}>
            {saving ? "保存中..." : section === "settings" ? "保存页面设置" : "保存并发布"}
          </button>
        </div>
      </div>

      {message && <div className="admin-inline-message">{message}</div>}

      <div className="admin-guide-layout">
        <aside className="admin-guide-side">
          <nav>
            <button className={section === "list" ? "active" : ""} type="button" onClick={() => setSection("list")}>攻略列表</button>
            <button className={section === "editor" ? "active" : ""} type="button" onClick={() => setSection("editor")}>新建攻略</button>
            <button className={section === "settings" ? "active" : ""} type="button" onClick={() => setSection("settings")}>页面设置</button>
          </nav>
          <select value={filterCity} onChange={(event) => setFilterCity(event.target.value)}>
            <option value="all">全部城市</option>
            {guideCities.map((city) => <option value={city.key} key={city.key}>{city.zh}</option>)}
          </select>
          <div className="admin-guide-list">
            {filtered.map((item) => (
              <button key={item.id} className={selectedId === item.id ? "active" : ""} type="button" onClick={() => { setSelectedId(item.id); setDraft(clone(item)); setSection("editor"); }}>
                <b>{item.titleZh}</b>
                <small>{cityName(item.city)} · {item.category} · {item.status === "published" ? "已发布" : "草稿"}</small>
              </button>
            ))}
          </div>
        </aside>

        {section === "list" && (
          <section className="admin-guide-panel">
            <h2>攻略列表</h2>
            <div className="guide-table">
              {filtered.map((item) => (
                <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setDraft(clone(item)); setSection("editor"); }}>
                  <img src={item.coverImage || defaultGuideSettings.heroImage} alt="" />
                  <span>
                    <b>{item.titleZh}</b>
                    <small>{cityName(item.city)} · {item.category} · 约 {item.readMinutes} 分钟阅读</small>
                  </span>
                  <em>{item.featured ? "推荐" : ""}</em>
                </button>
              ))}
            </div>
          </section>
        )}

        {section === "editor" && (
          <section className="admin-guide-panel">
            <div className="guide-editor-head">
              <h2>{selectedId === "new" ? "新建攻略" : draft.titleZh}</h2>
              <div>
                <button className="admin-secondary" type="button" onClick={() => saveArticle("draft")} disabled={saving}>保存草稿</button>
                <button className="admin-primary" type="button" onClick={() => saveArticle("published")} disabled={saving}>保存并发布</button>
              </div>
            </div>
            <div className="admin-form-grid guide-form-grid">
              <label><span>中文标题</span><input value={draft.titleZh} onChange={(event) => setField("titleZh", event.target.value)} /></label>
              <label><span>英文标题（可选）</span><input value={draft.titleEn} onChange={(event) => setField("titleEn", event.target.value)} /></label>
              <label><span>所属城市</span><select value={draft.city} onChange={(event) => setField("city", event.target.value as TravelGuideArticle["city"])}>{guideCities.map((city) => <option value={city.key} key={city.key}>{city.zh}</option>)}</select></label>
              <label><span>分类</span><select value={draft.category} onChange={(event) => setField("category", event.target.value as TravelGuideArticle["category"])}>{guideCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
              <label className="wide"><span>一句话简介</span><textarea value={draft.summaryZh} onChange={(event) => setField("summaryZh", event.target.value)} /></label>
              <label className="wide"><span>英文简介（可选）</span><textarea value={draft.summaryEn} onChange={(event) => setField("summaryEn", event.target.value)} /></label>
              <label><span>封面图片</span><input value={draft.coverImage} onChange={(event) => setField("coverImage", event.target.value)} /><input type="file" accept="image/*" onChange={(event) => uploadImage(event, (url) => setField("coverImage", url))} /></label>
              <label><span>图片英文装饰文字</span><input value={draft.imageLabel} onChange={(event) => setField("imageLabel", event.target.value.toUpperCase())} placeholder="KUALA LUMPUR" /></label>
              <label><span>预计阅读时间</span><input type="number" min={1} value={draft.readMinutes} onChange={(event) => setField("readMinutes", Number(event.target.value))} /></label>
              <label><span>排序</span><input type="number" value={draft.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></label>
              <label className="admin-switch"><input type="checkbox" checked={draft.featured} onChange={(event) => setField("featured", event.target.checked)} /> 设为当前城市推荐</label>
              <label><span>Slug</span><input value={draft.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="可留空自动生成" /></label>
            </div>

            {draft.coverImage && <img className="guide-cover-preview" src={draft.coverImage} alt="" />}

            <div className="guide-content-editor">
              <div>
                <h3>文章内容</h3>
                <select value="" onChange={(event) => {
                  if (!event.target.value) return;
                  setField("contentBlocks", [...draft.contentBlocks, newBlock(event.target.value as BlockType)]);
                  event.target.value = "";
                }}>
                  <option value="">添加内容块</option>
                  <option value="heading">标题</option>
                  <option value="paragraph">正文</option>
                  <option value="image">图片</option>
                  <option value="gallery">图集</option>
                  <option value="quote">引用</option>
                  <option value="list">列表</option>
                  <option value="divider">分割线</option>
                </select>
              </div>
              {draft.contentBlocks.map((block, index) => (
                <BlockEditor key={index} block={block} index={index} updateBlock={updateBlock} moveBlock={moveBlock} removeBlock={() => setField("contentBlocks", draft.contentBlocks.filter((_, i) => i !== index))} uploadImage={uploadImage} />
              ))}
            </div>

            {selectedId !== "new" && <button className="admin-danger" type="button" onClick={remove}>删除攻略</button>}
          </section>
        )}

        {section === "settings" && (
          <section className="admin-guide-panel">
            <h2>页面设置</h2>
            <div className="admin-form-grid guide-form-grid">
              <label className="wide"><span>Travel Guide Hero 图片</span><input value={settings.heroImage} onChange={(event) => setSettings({ ...settings, heroImage: event.target.value })} /><input type="file" accept="image/*" onChange={(event) => uploadImage(event, (url) => setSettings((current) => ({ ...current, heroImage: url })))} /></label>
              <label><span>Hero 中文标题</span><input value={settings.heroTitleZh} onChange={(event) => setSettings({ ...settings, heroTitleZh: event.target.value })} /></label>
              <label><span>Hero 英文小标题</span><input value={settings.heroTitleEn} onChange={(event) => setSettings({ ...settings, heroTitleEn: event.target.value })} /></label>
              <label className="wide"><span>Hero 描述</span><textarea value={settings.heroDescriptionZh} onChange={(event) => setSettings({ ...settings, heroDescriptionZh: event.target.value })} /></label>
              <label className="wide"><span>Hero 英文描述</span><textarea value={settings.heroDescriptionEn} onChange={(event) => setSettings({ ...settings, heroDescriptionEn: event.target.value })} /></label>
              <label className="wide"><span>Hero 手写英文装饰文字</span><textarea value={settings.heroScript} onChange={(event) => setSettings({ ...settings, heroScript: event.target.value })} /></label>
            </div>
            {settings.heroImage && <img className="guide-settings-preview" src={settings.heroImage} alt="" />}
          </section>
        )}
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  index,
  updateBlock,
  moveBlock,
  removeBlock,
  uploadImage,
}: {
  block: TravelGuideBlock;
  index: number;
  updateBlock: (index: number, block: TravelGuideBlock) => void;
  moveBlock: (index: number, dir: -1 | 1) => void;
  removeBlock: () => void;
  uploadImage: (event: ChangeEvent<HTMLInputElement>, apply: (url: string) => void) => void;
}) {
  return (
    <article className="guide-block-editor">
      <header>
        <b>{block.type}</b>
        <span>
          <button type="button" onClick={() => moveBlock(index, -1)}>上移</button>
          <button type="button" onClick={() => moveBlock(index, 1)}>下移</button>
          <button type="button" onClick={removeBlock}>删除</button>
        </span>
      </header>
      {("text" in block) && <textarea value={block.text} onChange={(event) => updateBlock(index, { ...block, text: event.target.value } as TravelGuideBlock)} />}
      {block.type === "image" && (
        <label><span>图片</span><input value={block.image} onChange={(event) => updateBlock(index, { ...block, image: event.target.value })} /><input type="file" accept="image/*" onChange={(event) => uploadImage(event, (url) => updateBlock(index, { ...block, image: url }))} /></label>
      )}
      {block.type === "gallery" && (
        <div className="guide-gallery-editor">
          {block.images.map((image, imageIndex) => (
            <label key={imageIndex}><span>图 {imageIndex + 1}</span><input value={image} onChange={(event) => updateBlock(index, { ...block, images: block.images.map((item, i) => i === imageIndex ? event.target.value : item) })} /></label>
          ))}
          <button type="button" onClick={() => updateBlock(index, { ...block, images: [...block.images, ""] })}>添加图片</button>
        </div>
      )}
      {block.type === "list" && (
        <div className="guide-gallery-editor">
          {block.items.map((item, itemIndex) => (
            <input key={itemIndex} value={item} onChange={(event) => updateBlock(index, { ...block, items: block.items.map((value, i) => i === itemIndex ? event.target.value : value) })} />
          ))}
          <button type="button" onClick={() => updateBlock(index, { ...block, items: [...block.items, ""] })}>添加一行</button>
        </div>
      )}
      {"caption" in block && <input value={block.caption || ""} onChange={(event) => updateBlock(index, { ...block, caption: event.target.value } as TravelGuideBlock)} placeholder="图片说明（可选）" />}
    </article>
  );
}
