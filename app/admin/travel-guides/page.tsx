"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { TravelGuideArticle, TravelGuideBlock, TravelGuideSettings, TravelGuideStatus } from "../../../db/travel-guide-shared";
import { defaultGuideSettings, guideCategories, guideCities } from "../../../db/travel-guide-shared";

type AdminSection = "list" | "editor" | "settings";
type BlockType = TravelGuideBlock["type"];
type SaveState = "saved" | "dirty" | "saving";

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

const specialBlocks: { label: string; text: string }[] = [
  { label: "当地提醒", text: "当地提醒：" },
  { label: "注意事项", text: "注意事项：" },
  { label: "地点信息", text: "地点信息：" },
  { label: "费用参考", text: "费用参考：" },
  { label: "交通建议", text: "交通建议：" },
  { label: "MAD MAX推荐", text: "MAD MAX 推荐：" },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function cityName(key: TravelGuideArticle["city"]) {
  return guideCities.find((item) => item.key === key)?.zh || "吉隆坡";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function newBlock(type: BlockType, presetText = ""): TravelGuideBlock {
  if (type === "image") return { type, image: "", caption: "" };
  if (type === "gallery") return { type, images: [""], captions: [""], alts: [""] };
  if (type === "list") return { type, items: [presetText] };
  if (type === "divider") return { type };
  return { type, text: presetText };
}

function textFromBlocks(blocks: TravelGuideBlock[]) {
  return blocks
    .map((block) => {
      if ("text" in block) return block.text;
      if (block.type === "list") return block.items.join(" ");
      if (block.type === "image") return block.caption || "";
      if (block.type === "gallery") return [block.caption, ...(block.captions || [])].filter(Boolean).join(" ");
      return "";
    })
    .join(" ");
}

function estimateReadMinutes(blocks: TravelGuideBlock[]) {
  const compact = textFromBlocks(blocks).replace(/\s+/g, "");
  return Math.max(1, Math.ceil(compact.length / 420));
}

function statusLabel(status: TravelGuideStatus) {
  return status === "published" ? "已发布" : "草稿";
}

export default function AdminTravelGuidesPage() {
  const [items, setItems] = useState<TravelGuideArticle[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<TravelGuideArticle>(() => clone(emptyArticle));
  const [settings, setSettings] = useState<TravelGuideSettings>(defaultGuideSettings);
  const [section, setSection] = useState<AdminSection>("list");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [focusedBlock, setFocusedBlock] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const didLoadDraft = useRef(false);

  const estimatedReadMinutes = useMemo(() => estimateReadMinutes(draft.contentBlocks), [draft.contentBlocks]);

  const filtered = useMemo(
    () => items.filter((item) => {
      const keyword = search.trim().toLowerCase();
      const matchSearch = !keyword || [item.titleZh, item.titleEn, item.summaryZh, item.summaryEn].some((value) => value.toLowerCase().includes(keyword));
      return (
        matchSearch &&
        (filterCity === "all" || item.city === filterCity) &&
        (filterCategory === "all" || item.category === filterCategory) &&
        (filterStatus === "all" || item.status === filterStatus)
      );
    }),
    [filterCategory, filterCity, filterStatus, items, search],
  );

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/admin/travel-guides", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/travel-guides/settings", { cache: "no-store" }).then((response) => response.json()).catch(() => defaultGuideSettings),
    ])
      .then(([articleData, settingsData]) => {
        if (!mounted) return;
        setItems(Array.isArray(articleData) ? articleData : []);
        setSettings({ ...defaultGuideSettings, ...settingsData });
      })
      .catch(() => setMessage("旅行攻略数据加载失败"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!didLoadDraft.current) {
      didLoadDraft.current = true;
      return;
    }
    if (section !== "editor") return;
    setSaveState("dirty");
  }, [draft, section]);

  useEffect(() => {
    if (section !== "editor" || selectedId === "new" || selectedId === null || saveState !== "dirty") return;
    const timer = window.setTimeout(() => {
      void saveArticle("draft", { quiet: true });
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [draft, saveState, section, selectedId]);

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
      setFocusedBlock(target);
      return { ...current, contentBlocks: next };
    });
  };

  const insertBlock = (type: BlockType, presetText = "", afterIndex = focusedBlock) => {
    setDraft((current) => {
      const next = [...current.contentBlocks];
      const index = Math.min(Math.max(afterIndex + 1, 0), next.length);
      next.splice(index, 0, newBlock(type, presetText));
      window.setTimeout(() => setFocusedBlock(index), 0);
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
    readMinutes: estimatedReadMinutes,
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
        didLoadDraft.current = false;
        setSelectedId(saved.id);
        setDraft(clone(saved));
      }
    }
  };

  const saveArticle = async (status?: TravelGuideStatus, options?: { quiet?: boolean }) => {
    setSaving(true);
    setSaveState("saving");
    if (!options?.quiet) setMessage("");
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
      await refresh(nextId || undefined);
      setSaveState("saved");
      setLastSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
      if (!options?.quiet) setMessage(status === "published" ? "攻略已保存并发布。" : "攻略已保存为草稿。");
    } catch (error) {
      setSaveState("dirty");
      if (!options?.quiet) setMessage(error instanceof Error ? error.message : "保存失败");
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
    if (selectedId === "new" || selectedId === null) return;
    if (!confirm(`确定删除「${draft.titleZh}」吗？`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/travel-guides/${selectedId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败");
      await refresh();
      setSelectedId(null);
      setDraft(clone(emptyArticle));
      setSection("list");
      setMessage("已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSaving(false);
    }
  };

  const openArticle = (item: TravelGuideArticle) => {
    didLoadDraft.current = false;
    setSelectedId(item.id);
    setDraft(clone(item));
    setFocusedBlock(0);
    setSaveState("saved");
    setSection("editor");
  };

  const createArticle = () => {
    didLoadDraft.current = false;
    setSelectedId("new");
    setDraft(clone(emptyArticle));
    setFocusedBlock(0);
    setSaveState("saved");
    setSection("editor");
  };

  if (loading) return <div className="admin-guide-page"><p>正在加载旅行攻略...</p></div>;

  return (
    <div className={`admin-guide-page guide-mode-${section}`}>
      <div className="admin-guide-top">
        <div>
          <Link href="/admin">← 管理后台</Link>
          <h1>{section === "editor" ? draft.titleZh || "新建攻略" : "旅行攻略"}</h1>
          <p>{section === "editor" ? `${cityName(draft.city)} · ${draft.category} · 约 ${estimatedReadMinutes} 分钟阅读` : "攻略列表 → 打开某篇攻略 → 自由编辑文章"}</p>
        </div>
        <div>
          {section !== "editor" && <button className="admin-secondary" type="button" onClick={() => setSection("list")}>攻略管理</button>}
          {section !== "settings" && <button className="admin-secondary" type="button" onClick={() => setSection("settings")}>页面设置</button>}
          <Link className="admin-secondary" href="/photography" target="_blank">查看前台</Link>
          {section === "editor" ? (
            <>
              <button className="admin-secondary" type="button" onClick={() => saveArticle("draft")} disabled={saving}>保存草稿</button>
              <button className="admin-primary" type="button" onClick={() => saveArticle("published")} disabled={saving}>{saving ? "保存中..." : "保存并发布"}</button>
            </>
          ) : section === "settings" ? (
            <button className="admin-primary" type="button" onClick={saveSettings} disabled={saving}>{saving ? "保存中..." : "保存页面设置"}</button>
          ) : (
            <button className="admin-primary" type="button" onClick={createArticle}>+ 新建攻略</button>
          )}
        </div>
      </div>

      {message && <div className="admin-inline-message">{message}</div>}

      {section === "list" && (
        <section className="admin-guide-panel guide-list-manager">
          <div className="guide-manager-head">
            <div>
              <h2>攻略管理</h2>
              <p>只保留一个主列表，点击文章进入独立编辑页。</p>
            </div>
            <button className="admin-primary" type="button" onClick={createArticle}>+ 新建攻略</button>
          </div>
          <div className="guide-toolbar">
            <select value={filterCity} onChange={(event) => setFilterCity(event.target.value)}>
              <option value="all">全部城市</option>
              {guideCities.map((city) => <option value={city.key} key={city.key}>{city.zh}</option>)}
            </select>
            <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
              <option value="all">全部分类</option>
              {guideCategories.map((category) => <option value={category} key={category}>{category}</option>)}
            </select>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索攻略..." />
          </div>
          <div className="guide-admin-table">
            <div className="guide-admin-row head">
              <span>封面</span><span>标题</span><span>城市</span><span>分类</span><span>状态</span><span>更新</span><span>操作</span>
            </div>
            {filtered.map((item) => (
              <div className="guide-admin-row" key={item.id}>
                <img src={item.coverImage || defaultGuideSettings.heroImage} alt="" />
                <div>
                  <b>{item.titleZh}</b>
                  <small>{item.summaryZh || item.titleEn || "暂无简介"}</small>
                </div>
                <span>{cityName(item.city)}</span>
                <span>{item.category}</span>
                <em className={item.status === "published" ? "on" : ""}>{statusLabel(item.status)}</em>
                <span>{item.updatedAt ? item.updatedAt.slice(0, 10) : "-"}</span>
                <nav>
                  <button type="button" onClick={() => openArticle(item)}>编辑</button>
                  <Link href={`/photography/${item.slug}`} target="_blank">预览</Link>
                </nav>
              </div>
            ))}
          </div>
        </section>
      )}

      {section === "editor" && (
        <section className="admin-guide-panel guide-editor-page">
          <div className="guide-editor-main-head">
            <button type="button" onClick={() => setSection("list")}>← 返回攻略列表</button>
            <div className={`guide-save-state ${saveState}`}>
              {saveState === "saving" ? "保存中..." : saveState === "dirty" ? "有未保存更改" : lastSavedAt ? `已保存 ${lastSavedAt}` : "已保存"}
            </div>
          </div>

          <div className="guide-edit-section">
            <h2>基础信息</h2>
            <div className="admin-form-grid guide-form-grid">
              <label><span>中文标题</span><input value={draft.titleZh} onChange={(event) => setField("titleZh", event.target.value)} /></label>
              <label><span>英文标题（可选）</span><input value={draft.titleEn} onChange={(event) => setField("titleEn", event.target.value)} /></label>
              <label><span>所属城市</span><select value={draft.city} onChange={(event) => setField("city", event.target.value as TravelGuideArticle["city"])}>{guideCities.map((city) => <option value={city.key} key={city.key}>{city.zh}</option>)}</select></label>
              <label><span>分类</span><select value={draft.category} onChange={(event) => setField("category", event.target.value as TravelGuideArticle["category"])}>{guideCategories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
              <label className="wide"><span>一句话简介</span><textarea value={draft.summaryZh} onChange={(event) => setField("summaryZh", event.target.value)} /></label>
              <label className="wide"><span>英文简介（可选）</span><textarea value={draft.summaryEn} onChange={(event) => setField("summaryEn", event.target.value)} /></label>
            </div>
            <div className="guide-cover-field">
              <div>{draft.coverImage ? <img src={draft.coverImage} alt="" /> : <span>封面图片</span>}</div>
              <section>
                <b>封面图片</b>
                <p>用于攻略列表和详情页顶部展示。建议横图，后台统一固定比例预览。</p>
                <label><input type="file" accept="image/*" onChange={(event) => uploadImage(event, (url) => setField("coverImage", url))} />更换图片</label>
                <input value={draft.coverImage} onChange={(event) => setField("coverImage", event.target.value)} placeholder="图片地址（可选）" />
              </section>
            </div>
            <details className="advanced-settings guide-advanced">
              <summary>高级设置</summary>
              <div className="admin-form-grid guide-form-grid">
                <label><span>图片英文装饰文字</span><input value={draft.imageLabel} onChange={(event) => setField("imageLabel", event.target.value.toUpperCase())} placeholder="KUALA LUMPUR" /></label>
                <label><span>URL Slug</span><input value={draft.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="可留空自动生成" /></label>
                <label><span>排序</span><input type="number" value={draft.sortOrder} onChange={(event) => setField("sortOrder", Number(event.target.value))} /></label>
                <label><span>预计阅读时间</span><input readOnly value={`自动计算：约 ${estimatedReadMinutes} 分钟`} /></label>
                <label className="admin-switch"><input type="checkbox" checked={draft.featured} onChange={(event) => setField("featured", event.target.checked)} /> 设为当前城市推荐</label>
              </div>
            </details>
          </div>

          <div className="guide-edit-section">
            <div className="guide-editor-toolbar">
              <div>
                <h2>文章正文</h2>
                <p>像写文章一样连续编辑；图片、提醒和分割线会插入到当前段落后面。</p>
              </div>
              <nav>
                <button type="button" onClick={() => insertBlock("paragraph")}>正文</button>
                <button type="button" onClick={() => insertBlock("heading")}>H2</button>
                <button type="button" onClick={() => insertBlock("list")}>列表</button>
                <button type="button" onClick={() => insertBlock("image")}>图片</button>
                <button type="button" onClick={() => insertBlock("gallery")}>图集</button>
                <button type="button" onClick={() => insertBlock("divider")}>分割线</button>
              </nav>
            </div>
            <div className="guide-special-toolbar">
              {specialBlocks.map((item) => <button key={item.label} type="button" onClick={() => insertBlock("quote", item.text)}>{item.label}</button>)}
            </div>
            <div className="guide-free-editor">
              {draft.contentBlocks.map((block, index) => (
                <FlowBlock
                  key={index}
                  active={focusedBlock === index}
                  block={block}
                  index={index}
                  updateBlock={updateBlock}
                  moveBlock={moveBlock}
                  removeBlock={() => setField("contentBlocks", draft.contentBlocks.filter((_, i) => i !== index))}
                  uploadImage={uploadImage}
                  onFocus={() => setFocusedBlock(index)}
                />
              ))}
              <button className="guide-add-paragraph" type="button" onClick={() => insertBlock("paragraph", "", draft.contentBlocks.length - 1)}>+ 继续写正文</button>
            </div>
          </div>

          {selectedId !== "new" && <button className="admin-danger" type="button" onClick={remove}>删除攻略</button>}
        </section>
      )}

      {section === "settings" && (
        <section className="admin-guide-panel guide-settings-page">
          <h2>页面设置</h2>
          <p>只管理旅行攻略入口页，不影响单篇文章内容。</p>
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

      {section === "editor" && (
        <div className="guide-sticky-save">
          <span>{saveState === "dirty" ? "有未保存更改" : saveState === "saving" ? "保存中..." : lastSavedAt ? `已保存 ${lastSavedAt}` : "已保存"}</span>
          <Link href={draft.slug ? `/photography/${draft.slug}` : "/photography"} target="_blank">预览</Link>
          <button type="button" onClick={() => saveArticle("draft")} disabled={saving}>保存</button>
        </div>
      )}
    </div>
  );
}

function FlowBlock({
  block,
  index,
  active,
  updateBlock,
  moveBlock,
  removeBlock,
  uploadImage,
  onFocus,
}: {
  block: TravelGuideBlock;
  index: number;
  active: boolean;
  updateBlock: (index: number, block: TravelGuideBlock) => void;
  moveBlock: (index: number, dir: -1 | 1) => void;
  removeBlock: () => void;
  uploadImage: (event: ChangeEvent<HTMLInputElement>, apply: (url: string) => void) => void;
  onFocus: () => void;
}) {
  return (
    <article className={`guide-flow-block ${block.type} ${active ? "active" : ""}`} onFocus={onFocus} onClick={onFocus}>
      <aside>
        <button type="button" aria-label="上移" onClick={() => moveBlock(index, -1)}>↑</button>
        <button type="button" aria-label="下移" onClick={() => moveBlock(index, 1)}>↓</button>
        <button type="button" aria-label="删除" onClick={removeBlock}>×</button>
      </aside>

      {block.type === "heading" && <input className="guide-flow-heading" value={block.text} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} placeholder="小标题，例如：最推荐的时间" />}
      {block.type === "paragraph" && <textarea value={block.text} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} placeholder="继续写正文..." />}
      {block.type === "quote" && <textarea value={block.text} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} placeholder="当地提醒、注意事项、交通建议..." />}
      {block.type === "divider" && <hr />}
      {block.type === "list" && (
        <div className="guide-flow-list">
          {block.items.map((item, itemIndex) => (
            <input key={itemIndex} value={item} onChange={(event) => updateBlock(index, { ...block, items: block.items.map((value, i) => i === itemIndex ? event.target.value : value) })} placeholder="一条实用信息" />
          ))}
          <button type="button" onClick={() => updateBlock(index, { ...block, items: [...block.items, ""] })}>+ 添加一行</button>
        </div>
      )}
      {block.type === "image" && (
        <div className="guide-flow-image">
          {block.image ? <img src={block.image} alt="" /> : <span>图片</span>}
          <div>
            <label><input type="file" accept="image/*" onChange={(event) => uploadImage(event, (url) => updateBlock(index, { ...block, image: url }))} />上传/替换</label>
            <input value={block.caption || ""} onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })} placeholder="图片说明（可选）" />
          </div>
        </div>
      )}
      {block.type === "gallery" && (
        <div className="guide-flow-gallery">
          <div>
            {block.images.map((image, imageIndex) => (
              <figure key={imageIndex}>
                {image ? <img src={image} alt="" /> : <span>图 {imageIndex + 1}</span>}
                <input type="file" accept="image/*" onChange={(event) => uploadImage(event, (url) => updateBlock(index, { ...block, images: block.images.map((item, i) => i === imageIndex ? url : item) }))} />
                <button type="button" onClick={() => updateBlock(index, { ...block, images: block.images.filter((_, i) => i !== imageIndex), captions: (block.captions || []).filter((_, i) => i !== imageIndex), alts: (block.alts || []).filter((_, i) => i !== imageIndex) })}>删除</button>
              </figure>
            ))}
          </div>
          <button type="button" onClick={() => updateBlock(index, { ...block, images: [...block.images, ""], captions: [...(block.captions || []), ""], alts: [...(block.alts || []), ""] })}>+ 添加图片</button>
          <input value={block.caption || ""} onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })} placeholder="图集说明（可选）" />
        </div>
      )}
    </article>
  );
}
