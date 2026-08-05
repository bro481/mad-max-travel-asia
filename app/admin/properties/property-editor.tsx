"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { PropertyRecord } from "../../../db/properties";
const steps = [
  "基础信息",
  "图片",
  "空间信息",
  "介绍",
  "设施",
  "亮点",
  "周边",
  "参考价格",
  "发布",
];
const blank: Omit<PropertyRecord, "id" | "updatedAt"> = {
  slug: "",
  nameZh: "",
  nameEn: "",
  city: "吉隆坡",
  areaZh: "",
  areaEn: "",
  tags: [],
  images: [],
  imageCategories: {},
  imageOriginals: {},
  guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  descriptionZh: "",
  descriptionEn: "",
  amenities: [],
  highlights: [],
  nearby: [],
  priceFrom: 0,
  priceNote: "旺季价格请咨询",
  status: "draft",
};
const amenityOptions = [
  "高速 WiFi",
  "空调",
  "设备齐全的厨房",
  "洗衣机",
  "免费停车",
  "电视",
  "吹风机",
  "亲子友好",
];
export function PropertyEditor({ initial }: { initial?: PropertyRecord }) {
  const [data, setData] = useState(initial || blank);
  const [propertyId, setPropertyId] = useState<number | null>(
    initial?.id ?? null,
  );
  const [step, setStep] = useState(0);
  const [savingMode, setSavingMode] = useState<"draft" | "published" | null>(
    null,
  );
  const [saveNotice, setSaveNotice] = useState<{
    type: "success" | "error";
    message: string;
    href?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageMessage, setImageMessage] = useState("");
  const [importCode, setImportCode] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [brightness, setBrightness] = useState(112);
  const [contrast, setContrast] = useState(103);
  const [saturation, setSaturation] = useState(106);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const set = (key: string, value: unknown) =>
    setData((x) => ({ ...x, [key]: value }));
  const save = async (status?: PropertyRecord["status"]) => {
    const mode = status === "published" ? "published" : "draft";
    setSavingMode(mode);
    setSaveNotice(null);
    const next = { ...data, status: status || data.status };
    try {
      let id = propertyId;
      let saved = next;
      if (!id) {
        const response = await fetch("/api/admin/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        const created = (await response.json()) as {
          id?: number;
          slug?: string;
          error?: string;
        };
        if (!response.ok || !created.id)
          throw new Error(created.error || "无法创建房源");
        id = created.id;
        saved = { ...next, slug: created.slug || next.slug };
      }
      const response = await fetch(`/api/admin/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(result.error || "服务器未能保存房源");
      }
      setPropertyId(id);
      setData(saved);
      window.history.replaceState({}, "", `/admin/properties/${id}`);
      setSaveNotice({
        type: "success",
        message:
          mode === "published"
            ? "发布成功，前台房源已经更新。"
            : "草稿保存成功。",
        href:
          mode === "published" && saved.slug
            ? `/rooms/${saved.slug}`
            : undefined,
      });
    } catch (error) {
      setSaveNotice({
        type: "error",
        message: `${mode === "published" ? "发布" : "保存"}失败：${error instanceof Error ? error.message : "请稍后重试"}`,
      });
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
    const form = new FormData();
    list.forEach((f) => form.append("files", f));
    const r = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const result = await r.json();
    if (!r.ok) {
      setImageMessage(result.error || "上传失败");
      setUploading(false);
      return;
    }
    const urls = result.urls as string[];
    if (replaceAt !== undefined) {
      const next = [...data.images];
      next[replaceAt] = urls[0];
      set("images", next);
    } else set("images", [...data.images, ...urls]);
    setImageMessage(`已上传 ${urls.length} 张图片`);
    setUploading(false);
  };
  const createImportCode = async () => {
    const r = await fetch("/api/admin/import-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: initial?.id }),
    });
    const result = await r.json();
    if (r.ok) {
      setImportCode(result.code);
      setImageMessage("导入码已生成，10 分钟内有效");
    } else setImageMessage("请先登录后台再生成导入码");
  };
  const checkImport = async () => {
    if (!importCode) return;
    const r = await fetch(`/api/admin/import-sessions?code=${importCode}`);
    const result = await r.json();
    if (!r.ok) {
      setImageMessage("导入码无效或已过期");
      return;
    }
    const incoming = (result.images || []) as string[];
    const merged = [
      ...data.images,
      ...incoming.filter((x) => !data.images.includes(x)),
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
      setBrightness(115);
      setContrast(104);
      setSaturation(108);
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
            (x) => (x ? resolve(x) : reject(new Error("图片生成失败"))),
            "image/jpeg",
            0.9,
          ),
        );
        files.push(
          new File([blob], `adjusted-${i + 1}.jpg`, { type: "image/jpeg" }),
        );
      }
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const uploadedResponse = await fetch("/api/admin/uploads", {
        method: "POST",
        body: form,
      });
      const result = await uploadedResponse.json();
      if (!uploadedResponse.ok)
        throw new Error(result.error || "上传处理后的图片失败");
      const replacements = new Map(
        selectedImages.map((src, i) => [src, result.urls[i] as string]),
      );
      const nextImages = data.images.map((src) => replacements.get(src) || src);
      const nextCategories = { ...(data.imageCategories || {}) };
      const nextOriginals = { ...(data.imageOriginals || {}) };
      selectedImages.forEach((src, i) => {
        const newSrc = result.urls[i];
        if (nextCategories[src]) nextCategories[newSrc] = nextCategories[src];
        nextOriginals[newSrc] = nextOriginals[src] || src;
      });
      setData((x) => ({
        ...x,
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
    const restorable = selectedImages.filter(
      (src) => data.imageOriginals?.[src],
    );
    if (!restorable.length) {
      setImageMessage("所选图片没有可恢复的原图");
      return;
    }
    const restored = new Map(
      restorable.map((src) => [src, data.imageOriginals[src]]),
    );
    const nextImages = data.images.map((src) => restored.get(src) || src);
    const nextCategories = { ...(data.imageCategories || {}) };
    restorable.forEach((src) => {
      const original = data.imageOriginals[src];
      if (nextCategories[src]) nextCategories[original] = nextCategories[src];
    });
    setData((x) => ({
      ...x,
      images: nextImages,
      imageCategories: nextCategories,
    }));
    setSelectedImages([]);
    setImageMessage(`已恢复 ${restorable.length} 张原图，请保存房源使修改生效`);
  };
  const move = (i: number, d: number) => {
    const a = [...data.images],
      j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    set("images", a);
  };
  const completeness = useMemo(
    () =>
      Math.round(
        ([
          data.nameZh,
          data.nameEn,
          data.areaZh,
          data.images.length,
          data.descriptionZh,
          data.amenities.length,
          data.priceFrom,
        ].filter(Boolean).length /
          7) *
          100,
      ),
    [data],
  );
  return (
    <div className="editor-page">
      <div className="editor-top">
        <div>
          <Link href="/admin/properties">← 返回房源列表</Link>
          <h1>{initial ? data.nameZh || "编辑房源" : "新增房源"}</h1>
          <span>
            完成度 {completeness}% ·{" "}
            {data.status === "published"
              ? "已上线"
              : data.status === "hidden"
                ? "已隐藏"
                : "草稿"}
          </span>
        </div>
        <div>
          <button
            className="admin-secondary"
            onClick={() => save()}
            disabled={savingMode !== null}
          >
            {savingMode === "draft" ? "保存中…" : "保存草稿"}
          </button>
          <button
            className="admin-primary"
            onClick={() => save("published")}
            disabled={savingMode !== null}
          >
            {savingMode === "published" ? "发布中…" : "发布房源"}
          </button>
        </div>
      </div>
      {saveNotice && (
        <div
          className={`save-notice ${saveNotice.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{saveNotice.type === "success" ? "✓" : "!"}</span>
          <strong>{saveNotice.message}</strong>
          {saveNotice.href && (
            <a href={saveNotice.href} target="_blank" rel="noreferrer">
              查看前台
            </a>
          )}
          <button onClick={() => setSaveNotice(null)} aria-label="关闭提示">
            ×
          </button>
        </div>
      )}
      <div className="editor-layout">
        <aside className="step-nav">
          {steps.map((x, i) => (
            <button
              className={step === i ? "active" : i < step ? "done" : ""}
              onClick={() => setStep(i)}
              key={x}
            >
              <i>{i < step ? "✓" : i + 1}</i>
              {x}
            </button>
          ))}
        </aside>
        <section className="editor-form">
          {step === 0 && (
            <Block title="基础信息" desc="顾客最先看到的名称、地区和标签。">
              <Field label="中文名称">
                <input
                  value={data.nameZh}
                  onChange={(e) => set("nameZh", e.target.value)}
                />
              </Field>
              <Field label="英文名称">
                <input
                  value={data.nameEn}
                  onChange={(e) => set("nameEn", e.target.value)}
                />
              </Field>
              <div className="field-row">
                <Field label="城市">
                  <select
                    value={data.city}
                    onChange={(e) => set("city", e.target.value)}
                  >
                    {["吉隆坡", "亚庇", "仙本那"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="区域">
                  <input
                    value={data.areaZh}
                    onChange={(e) => set("areaZh", e.target.value)}
                    placeholder="例如 KLCC"
                  />
                </Field>
              </div>
              <Field label="标签（用逗号分隔）">
                <input
                  value={data.tags.join(", ")}
                  onChange={(e) =>
                    set(
                      "tags",
                      e.target.value
                        .split(/[,，]/)
                        .map((x) => x.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="家庭, 海景, 情侣"
                />
              </Field>
            </Block>
          )}
          {step === 1 && (
            <Block
              title="图片管理"
              desc="支持拖拽或多选批量上传，单次最多 50 张；第一张图片默认作为房源封面。"
            >
              <input
                ref={fileInput}
                className="hidden-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                onChange={(e) => e.target.files && upload(e.target.files)}
              />
              <input
                ref={replaceInput}
                className="hidden-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => {
                  if (e.target.files && replaceIndex !== null)
                    upload(e.target.files, replaceIndex);
                  e.target.value = "";
                }}
              />
              <div
                className={`upload-drop ${uploading ? "busy" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  upload(e.dataTransfer.files);
                }}
              >
                <b>⇧</b>
                <h3>拖拽图片到这里批量上传</h3>
                <p>支持 JPG、PNG、WebP、AVIF，单张不超过 15MB</p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                >
                  选择多张图片
                </button>
              </div>
              <div className="airbnb-import extension-import">
                <div>
                  <b>从当前 Airbnb 页面导入</b>
                  <small>通过浏览器扩展读取你已打开的房源页面</small>
                </div>
                <ol>
                  <li>
                    <a
                      href="/downloads/my-malaysia-airbnb-importer.zip"
                      download
                    >
                      下载并安装图片导入扩展
                    </a>
                  </li>
                  <li>打开 Airbnb 房源的“显示所有照片”页面</li>
                  <li>生成导入码，在扩展中输入并开始导入</li>
                </ol>
                <div>
                  {importCode ? (
                    <strong className="pair-code">{importCode}</strong>
                  ) : (
                    <button onClick={createImportCode}>生成一次性导入码</button>
                  )}
                  {importCode && (
                    <button onClick={checkImport}>检查导入结果</button>
                  )}
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
                    <button onClick={() => preset("bright")}>透亮</button>
                    <button onClick={() => preset("natural")}>自然</button>
                    <button onClick={() => preset("warm")}>暖色</button>
                  </div>
                </div>
                <div className="filter-sliders">
                  <label>
                    亮度 <b>{brightness}%</b>
                    <input
                      type="range"
                      min="80"
                      max="135"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    对比度 <b>{contrast}%</b>
                    <input
                      type="range"
                      min="85"
                      max="125"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                    />
                  </label>
                  <label>
                    饱和度 <b>{saturation}%</b>
                    <input
                      type="range"
                      min="80"
                      max="135"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="filter-actions">
                  <button
                    onClick={() =>
                      setSelectedImages(
                        selectedImages.length === data.images.length
                          ? []
                          : [...data.images],
                      )
                    }
                  >
                    {selectedImages.length === data.images.length
                      ? "取消全选"
                      : "全选图片"}
                  </button>
                  <div>
                    <button
                      className="restore-filter"
                      onClick={restoreOriginals}
                      disabled={!selectedImages.length}
                    >
                      恢复原图
                    </button>
                    <button
                      className="apply-filter"
                      onClick={applyFilters}
                      disabled={uploading || !selectedImages.length}
                    >
                      {uploading ? "处理中…" : "应用到所选图片"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="media-toolbar">
                <b>房源图库</b>
                <span>{data.images.length} 张 · 勾选后可批量调色</span>
              </div>
              <div className="image-list">
                {data.images.map((src, i) => (
                  <div
                    className={selectedImages.includes(src) ? "selected" : ""}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", String(i))
                    }
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const from = Number(e.dataTransfer.getData("text/plain"));
                      if (Number.isNaN(from) || from === i) return;
                      const next = [...data.images];
                      const [picked] = next.splice(from, 1);
                      next.splice(i, 0, picked);
                      set("images", next);
                    }}
                    key={`${src}-${i}`}
                  >
                    <label className="image-select">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(src)}
                        onChange={(e) =>
                          setSelectedImages(
                            e.target.checked
                              ? [...selectedImages, src]
                              : selectedImages.filter((x) => x !== src),
                          )
                        }
                      />
                      <span>✓</span>
                    </label>
                    <img
                      src={src}
                      alt=""
                      style={{
                        filter: selectedImages.includes(src)
                          ? `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                          : "none",
                      }}
                    />
                    <span>
                      <b>{i === 0 ? "★ 房源封面" : `图片 ${i + 1}`}</b>
                      <select
                        value={data.imageCategories?.[src] || "未分类"}
                        onChange={(e) =>
                          set("imageCategories", {
                            ...(data.imageCategories || {}),
                            [src]: e.target.value,
                          })
                        }
                      >
                        {[
                          "未分类",
                          "外观",
                          "客厅",
                          "卧室",
                          "浴室",
                          "厨房",
                          "景观",
                          "设施",
                          "周边",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </span>
                    <div>
                      <button onClick={() => move(i, -1)} disabled={i === 0}>
                        ↑
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === data.images.length - 1}
                      >
                        ↓
                      </button>
                      {i > 0 && (
                        <button
                          onClick={() =>
                            set("images", [
                              src,
                              ...data.images.filter((_, n) => n !== i),
                            ])
                          }
                        >
                          设封面
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReplaceIndex(i);
                          replaceInput.current?.click();
                        }}
                      >
                        替换
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          set(
                            "images",
                            data.images.filter((_, n) => n !== i),
                          );
                          setSelectedImages((x) => x.filter((y) => y !== src));
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Block>
          )}
          {step === 2 && (
            <Block
              title="空间信息"
              desc="使用统一数字字段，让前台信息保持一致。"
            >
              <div className="stat-inputs">
                {[
                  ["guests", "入住人数"],
                  ["bedrooms", "卧室"],
                  ["beds", "床"],
                  ["bathrooms", "浴室"],
                ].map(([k, l]) => (
                  <Field label={l} key={k}>
                    <input
                      type="number"
                      min="0"
                      value={Number(data[k as keyof typeof data])}
                      onChange={(e) => set(k, Number(e.target.value))}
                    />
                  </Field>
                ))}
              </div>
            </Block>
          )}
          {step === 3 && (
            <Block title="房源介绍" desc="分别维护中文与英文介绍。">
              <Field label="关于这个房源">
                <textarea
                  rows={7}
                  value={data.descriptionZh}
                  onChange={(e) => set("descriptionZh", e.target.value)}
                />
              </Field>
              <Field label="About this place">
                <textarea
                  rows={7}
                  value={data.descriptionEn}
                  onChange={(e) => set("descriptionEn", e.target.value)}
                />
              </Field>
            </Block>
          )}
          {step === 4 && (
            <Block title="设施" desc="选择已有设施，前台会显示统一名称和图标。">
              <div className="amenity-checks">
                {amenityOptions.map((x) => (
                  <label key={x}>
                    <input
                      type="checkbox"
                      checked={data.amenities.includes(x)}
                      onChange={(e) =>
                        set(
                          "amenities",
                          e.target.checked
                            ? [...data.amenities, x]
                            : data.amenities.filter((a) => a !== x),
                        )
                      }
                    />
                    <span>{x}</span>
                  </label>
                ))}
              </div>
            </Block>
          )}
          {step === 5 && (
            <Repeater
              title="亮点"
              hint="例如：城市景观 / 晚上可以看到 KLCC 夜景"
              items={data.highlights}
              onChange={(x) => set("highlights", x)}
              labels={["标题", "描述"]}
            />
          )}
          {step === 6 && (
            <Repeater
              title="周边"
              hint="记录附近景点、类型和距离"
              items={data.nearby}
              onChange={(x) => set("nearby", x)}
              labels={["地点名称", "类型", "距离"]}
            />
          )}
          {step === 7 && (
            <Block title="参考价格" desc="这里只展示起价，不形成订单或库存。">
              <Field label="Starting from">
                <div className="price-input">
                  <span>RM</span>
                  <input
                    type="number"
                    value={data.priceFrom}
                    onChange={(e) => set("priceFrom", Number(e.target.value))}
                  />
                  <span>/ night</span>
                </div>
              </Field>
              <Field label="价格备注">
                <input
                  value={data.priceNote}
                  onChange={(e) => set("priceNote", e.target.value)}
                />
              </Field>
            </Block>
          )}
          {step === 8 && (
            <Block
              title="发布检查"
              desc="保存草稿不会出现在前台；发布后顾客即可浏览。"
            >
              <div className="publish-check">
                <b>{completeness}%</b>
                <span>房源资料完成度</span>
                <ul>
                  <li className={data.nameZh ? "ok" : ""}>中英文名称</li>
                  <li className={data.images.length ? "ok" : ""}>
                    至少一张图片
                  </li>
                  <li className={data.descriptionZh ? "ok" : ""}>房源介绍</li>
                  <li className={data.priceFrom ? "ok" : ""}>参考价格</li>
                </ul>
                <button
                  className="admin-primary"
                  onClick={() => save("published")}
                >
                  确认并发布
                </button>
              </div>
            </Block>
          )}
          <div className="editor-next">
            <button disabled={step === 0} onClick={() => setStep((x) => x - 1)}>
              上一步
            </button>
            {step < steps.length - 1 && (
              <button
                className="admin-primary"
                onClick={() => setStep((x) => x + 1)}
              >
                下一步
              </button>
            )}
          </div>
        </section>
        <aside className="live-preview">
          <span>实时预览</span>
          <div className="preview-card">
            {data.images[0] ? (
              <img
                src={data.images[0]}
                alt=""
                style={{
                  filter: selectedImages.includes(data.images[0])
                    ? `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                    : "none",
                }}
              />
            ) : (
              <div className="empty-cover">添加封面图片</div>
            )}
            <div>
              <small>
                📍 {data.city}
                {data.areaZh ? ` · ${data.areaZh}` : ""}
              </small>
              <h2>{data.nameZh || "房源中文名称"}</h2>
              <p>
                {data.guests} 位客人 · {data.bedrooms} 间卧室 · {data.beds} 张床
                · {data.bathrooms} 间浴室
              </p>
              <b>
                {data.priceFrom
                  ? `RM ${data.priceFrom} / night 起`
                  : "参考价格待填写"}
              </b>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Block({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="block-head">
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      {children}
    </>
  );
}
function Repeater({
  title,
  hint,
  items,
  onChange,
  labels,
}: {
  title: string;
  hint: string;
  items: Record<string, string>[];
  onChange: (x: Record<string, string>[]) => void;
  labels: string[];
}) {
  const keys =
    title === "亮点" ? ["title", "description"] : ["name", "type", "distance"];
  return (
    <>
      <div className="block-head">
        <h2>{title}</h2>
        <p>{hint}</p>
      </div>
      <div className="repeater">
        {items.map((item, i) => (
          <div key={i}>
            {keys.map((k, n) => (
              <Field label={labels[n]} key={k}>
                <input
                  value={item[k] || ""}
                  onChange={(e) =>
                    onChange(
                      items.map((x, j) =>
                        j === i ? { ...x, [k]: e.target.value } : x,
                      ),
                    )
                  }
                />
              </Field>
            ))}
            <button onClick={() => onChange(items.filter((_, j) => j !== i))}>
              删除
            </button>
          </div>
        ))}
        <button
          className="add-row"
          onClick={() =>
            onChange([...items, Object.fromEntries(keys.map((k) => [k, ""]))])
          }
        >
          ＋ 添加{title}
        </button>
      </div>
    </>
  );
}
