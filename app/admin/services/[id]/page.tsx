"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import type { DestinationRecord } from "../../../../db/destinations";
import type { ServiceCategory } from "../../../../db/services";
import type {
  ServiceItem,
  ServiceRouteNode,
  ServiceRoutePlan,
} from "../../../../db/service-items";
import { TransferEditor } from "./transfer-editor";

const defaultTabs = ["基础信息", "图片", "内容", "行程／路线", "咨询", "发布"];
const routeTabs = ["基础信息", "图片", "车型与价格", "路线方案", "咨询设置", "发布"];
const inquiryRequiredDefaults = ["日期", "人数", "出发地点", "想去的路线 / 景点"];
const inquiryOptionalDefaults = ["接送地点", "儿童人数", "行李数量", "特殊需求"];

export default function ServiceEditor() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<ServiceItem | null>(null);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [tab, setTab] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const readJson = async <T,>(url: string, fallback: T): Promise<T> => {
      const r = await fetch(url, { cache: "no-store" });
      const text = await r.text();
      if (!r.ok) {
        let message = text;
        try {
          message = JSON.parse(text)?.error || text;
        } catch {}
        throw new Error(`${url} 返回 ${r.status}${message ? `：${message}` : ""}`);
      }
      return text ? JSON.parse(text) : fallback;
    };
    Promise.all([
      readJson<ServiceItem | null>(`/api/admin/service-items/${id}`, null),
      readJson<DestinationRecord[]>("/api/admin/destinations", []),
      readJson<ServiceCategory[]>("/api/admin/services", []),
    ])
      .then(([item, dests, cats]) => {
        if (!active) return;
        if (!item) {
          setLoadError(`找不到这个服务：${id}`);
          return;
        }
        setD(item);
        setDestinations(dests);
        setCategories(cats);
      })
      .catch((error: Error) => {
        if (!active) return;
        setLoadError(error.message || "服务编辑器加载失败。");
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loadError)
    return (
      <div className="admin-loading">
        <h2>服务编辑器打不开</h2>
        <p>{loadError}</p>
        <Link href="/admin/services">← 返回服务列表</Link>
      </div>
    );
  if (!d) return <div className="admin-loading">正在打开服务编辑器…</div>;
  if (d.type === "交通接送")
    return (
      <TransferEditor
        data={d}
        onChange={setD}
        destinations={destinations}
        categories={categories}
      />
    );

  const isCar = d.templateType === "route" || d.type === "私人包车";
  const hasTimeline =
    d.templateType === "experience" ||
    ["当地体验", "城市体验", "一日路线", "海岛体验"].includes(d.type);
  const activeTabs = isCar ? routeTabs : defaultTabs;
  const currentCategory = categories.find((category) => category.id === d.categoryId);
  const currentDestination = destinations.find(
    (destination) => destination.id === d.destinationId || destination.nameZh === d.city,
  );
  const set = (k: keyof ServiceItem, v: unknown) =>
    setD((x) => (x ? { ...x, [k]: v } : x));
  const setMany = (patch: Partial<ServiceItem>) =>
    setD((x) => (x ? { ...x, ...patch } : x));

  const save = async (status?: ServiceItem["status"]) => {
    const next = { ...d, status: status || d.status };
    setNotice(status === "published" ? "发布中…" : "保存中…");
    const r = await fetch(`/api/admin/service-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (r.ok) {
      const text = await r.text();
      setD(text ? JSON.parse(text) : next);
      setNotice(status === "published" ? "✓ 发布成功，前台已经更新" : "✓ 草稿已保存");
    } else {
      const text = await r.text();
      setNotice(text || "保存失败，请重试");
    }
  };

  const upload = async (files: FileList | null, onUrls?: (urls: string[]) => void) => {
    if (!files?.length) return;
    const form = new FormData();
    [...files].slice(0, 50).forEach((x) => form.append("files", x));
    setNotice("图片上传中…");
    const r = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const text = await r.text();
    const x = text ? JSON.parse(text) : { urls: [] };
    if (r.ok) {
      if (onUrls) {
        onUrls(x.urls);
      } else {
        set("images", [...d.images, ...x.urls]);
      }
      setNotice(`已上传 ${x.urls.length} 张图片`);
    } else {
      setNotice(x?.error || "图片上传失败");
    }
  };

  const checks = publishChecks(d, isCar);

  return (
    <>
      <div className="editor-top">
        <div>
          <Link href="/admin/services">← 返回服务列表</Link>
          <h1>{d.nameZh}</h1>
          <span>
            当地服务 / {currentDestination?.nameZh || d.city} / {currentCategory?.nameZh || d.category} / {d.nameZh}
          </span>
        </div>
        <div>
          <button className="admin-secondary" onClick={() => save()}>
            保存草稿
          </button>
          <button className="admin-primary" onClick={() => save("published")}>
            发布服务
          </button>
        </div>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <div className="service-editor-layout">
        <aside>
          {activeTabs.map((x, i) => (
            <button className={tab === i ? "active" : ""} onClick={() => setTab(i)} key={x}>
              <i>{i + 1}</i>
              {x}
            </button>
          ))}
        </aside>
        <main className="editor-form">
          {tab === 0 && (
            <>
              <Head title="基础信息" text="控制服务归属、前台卡片文案和详情顶部基础内容。" />
              <div className="service-belonging-card">
                <div>
                  <small>目的地</small>
                  <strong>{currentDestination?.nameZh || d.city}</strong>
                </div>
                <div>
                  <small>展示分类</small>
                  <strong>{currentCategory?.nameZh || d.category}</strong>
                </div>
                <div>
                  <small>编辑模板</small>
                  <strong>{templateLabel(d.templateType)}</strong>
                  <em>已锁定</em>
                </div>
              </div>
              <div className="field-row">
                <Field n="目的地">
                  <select
                    value={d.city}
                    onChange={(e) => {
                      const destination = destinations.find((item) => item.nameZh === e.target.value);
                      setMany({
                        city: e.target.value,
                        destinationId: destination?.id || d.destinationId || 0,
                      });
                    }}
                  >
                    {destinationOptions(destinations, d.city).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field n="所属展示分类">
                  <select
                    value={d.categoryId || currentCategory?.id || 1}
                    onChange={(e) => {
                      const category = categories.find((item) => item.id === Number(e.target.value));
                      setMany({
                        categoryId: Number(e.target.value),
                        category: category?.nameZh || d.category,
                      });
                    }}
                  >
                    {categoryOptions(categories, d.categoryId).map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.nameZh}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field n="当前编辑模板">
                <input value={templateLabel(d.templateType)} readOnly />
                <small className="field-help">
                  模板控制后台字段结构，默认不随意更换；如果要换结构，建议新建对应类型服务。
                </small>
              </Field>
              <div className="field-row">
                <Field n="中文标题">
                  <input value={d.nameZh} onChange={(e) => set("nameZh", e.target.value)} />
                </Field>
                <Field n="英文标题">
                  <input value={d.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
                </Field>
              </div>
              <div className="field-row">
                <Field n="中文副标题">
                  <input value={d.subtitleZh} onChange={(e) => set("subtitleZh", e.target.value)} />
                </Field>
                <Field n="英文副标题">
                  <input value={d.subtitleEn} onChange={(e) => set("subtitleEn", e.target.value)} />
                </Field>
              </div>
              <Field n={isCar ? "卡片标签（最多 3 个）" : "标签（用顿号分隔）"}>
                <input
                  value={d.tags.join("、")}
                  onChange={(e) =>
                    set(
                      "tags",
                      e.target.value
                        .split(/[、,，]/)
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                        .slice(0, isCar ? 3 : 12),
                    )
                  }
                  placeholder={isCar ? "中文沟通、行程灵活、舒适安全" : ""}
                />
                {isCar && <small className="field-help">这里就是前台服务卡片下面的小胶囊卖点。</small>}
              </Field>
              <div className="field-row">
                <Field n="中文简短介绍">
                  <textarea
                    rows={3}
                    value={d.introZh}
                    onChange={(e) => set("introZh", e.target.value)}
                    placeholder="半日 / 全天包车，可根据时间和兴趣自由安排路线。"
                  />
                </Field>
                <Field n="英文简短介绍">
                  <textarea rows={3} value={d.introEn} onChange={(e) => set("introEn", e.target.value)} />
                </Field>
              </div>
              {isCar && <ServiceHighlights items={d.steps} onChange={(x) => set("steps", x)} />}
            </>
          )}
          {tab === 1 && (
            <>
              <Head title="图片" text="第一张图片作为服务封面，可批量上传并调整顺序。" />
              <label className="service-upload">
                拖拽或选择多张服务图片
                <input type="file" multiple accept="image/*" onChange={(e) => upload(e.target.files)} />
              </label>
              <div className="service-image-list">
                {d.images.map((x, i) => (
                  <div key={`${x}-${i}`}>
                    <img src={x} alt="" />
                    <b>{i === 0 ? "★ 封面" : `图片 ${i + 1}`}</b>
                    <button
                      disabled={i === 0}
                      onClick={() => {
                        const a = [...d.images];
                        [a[i - 1], a[i]] = [a[i], a[i - 1]];
                        set("images", a);
                      }}
                    >
                      ↑
                    </button>
                    <button onClick={() => set("images", d.images.filter((_, n) => n !== i))}>删除</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 2 &&
            (isCar ? (
              <VehiclePricingEditor
                items={d.vehicles}
                serviceImages={d.images}
                onUpload={(files, done) => upload(files, done)}
                onChange={(x) => set("vehicles", x)}
              />
            ) : (
              <>
                <Head title="内容" text="服务简介和前台说明。" />
                <Field n="中文介绍">
                  <textarea rows={7} value={d.introZh} onChange={(e) => set("introZh", e.target.value)} />
                </Field>
                <Field n="英文介绍">
                  <textarea rows={7} value={d.introEn} onChange={(e) => set("introEn", e.target.value)} />
                </Field>
              </>
            ))}
          {tab === 3 && (
            <>
              {isCar ? (
                <>
                  <Head title="路线方案" text="管理私人包车下方的“热门包车方案”，路线不是独立服务。" />
                  <RouteSectionCopy
                    title={d.routeSectionTitleZh}
                    intro={d.routeSectionIntroZh}
                    onChange={(patch) => setMany(patch)}
                  />
                  <RoutePlansEditor
                    items={d.routes}
                    serviceImages={d.images}
                    onUpload={(files, done) => upload(files, done)}
                    onChange={(x) => set("routes", x)}
                  />
                </>
              ) : hasTimeline ? (
                <>
                  <Head title="行程安排" text="体验类服务使用时间线编辑器。" />
                  <Repeat
                    title="时间线"
                    items={d.timeline}
                    keys={["time", "title", "description"]}
                    labels={["时间", "行程标题", "说明"]}
                    onChange={(x) => set("timeline", x)}
                  />
                </>
              ) : (
                <>
                  <Head title="服务流程" text="设置客户从咨询到出发的步骤。" />
                  <Repeat
                    title="步骤"
                    items={d.steps}
                    keys={["title", "description"]}
                    labels={["标题", "说明"]}
                    onChange={(x) => set("steps", x)}
                  />
                </>
              )}
            </>
          )}
          {tab === 4 && (
            <>
              <Head title="咨询设置" text="这里只维护客户需要提供的信息；价格统一在“车型与价格”里维护。" />
              <InquiryPicker
                fields={d.inquiryFields}
                required={d.inquiryRequired}
                onChange={(fields, required) => setMany({ inquiryFields: fields, inquiryRequired: required })}
              />
            </>
          )}
          {tab === 5 && (
            <>
              <Head title="发布" text="确认内容后发布到前台。" />
              <div className="publish-check">
                <ul>
                  {checks.map((check) => (
                    <li className={check.ok ? "ok" : ""} key={check.label}>
                      {check.ok ? "✓" : "⚠"} {check.label}
                    </li>
                  ))}
                </ul>
                <button className="admin-primary" onClick={() => save("published")}>
                  发布服务
                </button>
              </div>
            </>
          )}
        </main>
        <aside className="service-live-preview">
          <small>{previewTitle(activeTabs[tab])}</small>
          <PreviewCard data={d} category={currentCategory} tabName={activeTabs[tab]} />
        </aside>
      </div>
    </>
  );
}

function templateLabel(type: ServiceItem["templateType"]) {
  if (type === "transfer") return "接送型";
  if (type === "route") return "路线型";
  return "体验型";
}

function destinationOptions(items: DestinationRecord[], current: string) {
  const configured = items
    .filter((item) => item.useForServices && item.status !== "hidden")
    .sort((a, b) => a.serviceSort - b.serviceSort || a.id - b.id)
    .map((item) => item.nameZh);
  if (current && !configured.includes(current)) return [...configured, current];
  return configured.length ? configured : ["吉隆坡", "亚庇", "仙本那", "马六甲", "新加坡"];
}

function categoryOptions(items: ServiceCategory[], currentId: number) {
  const configured = items
    .filter((item) => item.visible !== false || item.id === currentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  return configured.length
    ? configured
    : ([
        { id: 1, nameZh: "交通服务", sortOrder: 1, visible: true },
      ] as ServiceCategory[]);
}

function Head({ title, text }: { title: string; text: string }) {
  return (
    <div className="block-head">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Field({ n, children }: { n: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{n}</span>
      {children}
    </label>
  );
}

function ServiceHighlights({
  items,
  onChange,
}: {
  items: ServiceItem["steps"];
  onChange: (x: ServiceItem["steps"]) => void;
}) {
  const highlights = items.length
    ? items
    : [
        { title: "中文司机", description: "沟通更轻松" },
        { title: "行程灵活", description: "可按时间与兴趣调整" },
        { title: "酒店接送", description: "减少交通衔接麻烦" },
      ];
  return (
    <div className="service-repeat compact">
      <h3>服务亮点</h3>
      {highlights.map((item, index) => (
        <div key={`${item.title}-${index}`}>
          <Field n="亮点">
            <input
              value={item.title}
              onChange={(e) =>
                onChange(highlights.map((x, i) => (i === index ? { ...x, title: e.target.value } : x)))
              }
            />
          </Field>
          <Field n="说明">
            <input
              value={item.description}
              onChange={(e) =>
                onChange(highlights.map((x, i) => (i === index ? { ...x, description: e.target.value } : x)))
              }
            />
          </Field>
          <button onClick={() => onChange(highlights.filter((_, i) => i !== index))}>删除</button>
        </div>
      ))}
      <button onClick={() => onChange([...highlights, { title: "新亮点", description: "" }])}>＋ 添加亮点</button>
    </div>
  );
}

function RouteSectionCopy({
  title,
  intro,
  onChange,
}: {
  title: string;
  intro: string;
  onChange: (patch: Partial<ServiceItem>) => void;
}) {
  const [custom, setCustom] = useState(Boolean(title || intro));
  const defaultTitle = "热门包车方案";
  const defaultIntro = "以下路线仅作参考，可根据您的时间与兴趣灵活调整。";
  return (
    <div className="route-section-copy">
      <label className="route-inline-check">
        <input type="checkbox" checked={custom} onChange={(e) => setCustom(e.target.checked)} />
        <span>使用自定义板块文案</span>
      </label>
      {!custom ? (
        <div className="route-copy-default">
          <b>{defaultTitle}</b>
          <p>{defaultIntro}</p>
        </div>
      ) : (
        <>
          <Field n="板块标题">
            <input
              value={title || defaultTitle}
              onChange={(e) => onChange({ routeSectionTitleZh: e.target.value })}
              placeholder={defaultTitle}
            />
          </Field>
          <Field n="板块说明">
            <textarea
              rows={3}
              value={intro || defaultIntro}
              onChange={(e) => onChange({ routeSectionIntroZh: e.target.value })}
              placeholder={defaultIntro}
            />
          </Field>
        </>
      )}
    </div>
  );
}

function emptyVehicle(index: number, image = ""): ServiceItem["vehicles"][number] {
  return {
    image,
    nameZh: index === 0 ? "舒适轿车" : "新车型",
    nameEn: index === 0 ? "Sedan" : "",
    people: index === 0 ? "1–3 人" : "",
    luggage: index === 0 ? "2–3 件" : "",
    description: index === 0 ? "少人数出行" : "",
    price: 0,
    halfDayPrice: 0,
    fullDayPrice: 0,
    priceMode: "起价",
    visible: true,
    internalNote: "",
  };
}

function VehiclePricingEditor({
  items,
  serviceImages,
  onUpload,
  onChange,
}: {
  items: ServiceItem["vehicles"];
  serviceImages: string[];
  onUpload: (files: FileList | null, done: (urls: string[]) => void) => void;
  onChange: (x: ServiceItem["vehicles"]) => void;
}) {
  const [editing, setEditing] = useState(0);
  const vehicles = items.length ? items : [emptyVehicle(0, serviceImages[0] || "")];
  const update = (index: number, patch: Partial<ServiceItem["vehicles"][number]>) =>
    onChange(vehicles.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  return (
    <div className="vehicle-price-editor">
      <Head title="车型与价格" text="包车服务的核心设置：车型、人数、行李与半日/全天价格。" />
      <div className="route-plan-head">
        <div>
          <h3>可安排车型</h3>
          <p>价格不固定时可设为“咨询报价”，前台就不会显示 ¥0。</p>
        </div>
        <button onClick={() => { onChange([...vehicles, emptyVehicle(vehicles.length, serviceImages[0] || "")]); setEditing(vehicles.length); }}>
          ＋ 添加车型
        </button>
      </div>
      <div className="vehicle-price-list">
        {vehicles.map((vehicle, index) => (
          <article className={editing === index ? "vehicle-price-card editing" : "vehicle-price-card"} key={`${vehicle.nameZh}-${index}`}>
            <div className="vehicle-price-summary">
              <div className="route-plan-thumb">
                {vehicle.image ? <img src={vehicle.image} alt="" /> : <span>车辆</span>}
              </div>
              <div>
                <h4>{vehicle.nameZh || "未命名车型"}</h4>
                <small>{vehicle.nameEn || "英文名称未填写"}</small>
                <p>
                  {vehicle.people || "人数未填"} · {vehicle.luggage || "行李未填"}
                </p>
                <b>
                  {vehicle.priceMode === "咨询报价"
                    ? "价格咨询"
                    : `半日 ¥${vehicle.halfDayPrice || vehicle.price || 0} 起 · 全天 ¥${vehicle.fullDayPrice || 0} 起`}
                </b>
              </div>
              <nav>
                <button onClick={() => setEditing(editing === index ? -1 : index)}>编辑</button>
                <button onClick={() => update(index, { visible: vehicle.visible === false })}>
                  {vehicle.visible === false ? "显示" : "隐藏"}
                </button>
                <button className="danger" onClick={() => onChange(vehicles.filter((_, i) => i !== index))}>
                  删除
                </button>
              </nav>
            </div>
            {editing === index && (
              <div className="vehicle-price-form">
                <div className="field-row">
                  <Field n="中文车型名">
                    <input value={vehicle.nameZh} onChange={(e) => update(index, { nameZh: e.target.value })} />
                  </Field>
                  <Field n="英文车型名">
                    <input value={vehicle.nameEn} onChange={(e) => update(index, { nameEn: e.target.value })} />
                  </Field>
                </div>
                <div className="field-row">
                  <Field n="建议人数">
                    <input value={vehicle.people} onChange={(e) => update(index, { people: e.target.value })} />
                  </Field>
                  <Field n="建议行李">
                    <input value={vehicle.luggage} onChange={(e) => update(index, { luggage: e.target.value })} />
                  </Field>
                </div>
                <Field n="适用说明">
                  <input value={vehicle.description} onChange={(e) => update(index, { description: e.target.value })} />
                </Field>
                <Field n="车辆图片">
                  <ImageChooser
                    value={vehicle.image}
                    images={serviceImages}
                    onUpload={(files) => onUpload(files, (urls) => update(index, { image: urls[0] || vehicle.image }))}
                    onChange={(url) => update(index, { image: url })}
                  />
                </Field>
                <div className="field-row">
                  <Field n="价格模式">
                    <select value={vehicle.priceMode || "起价"} onChange={(e) => update(index, { priceMode: e.target.value })}>
                      <option>起价</option>
                      <option>固定价格</option>
                      <option>咨询报价</option>
                    </select>
                  </Field>
                  <Field n="半日价格 ¥">
                    <input
                      type="number"
                      value={vehicle.halfDayPrice || ""}
                      onChange={(e) => update(index, { halfDayPrice: Number(e.target.value), price: Number(e.target.value) })}
                    />
                  </Field>
                </div>
                <Field n="全天价格 ¥">
                  <input
                    type="number"
                    value={vehicle.fullDayPrice || ""}
                    onChange={(e) => update(index, { fullDayPrice: Number(e.target.value) })}
                  />
                </Field>
                <label className="route-inline-check">
                  <input
                    type="checkbox"
                    checked={vehicle.visible !== false}
                    onChange={(e) => update(index, { visible: e.target.checked })}
                  />
                  <span>前台显示</span>
                </label>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function InquiryPicker({
  fields,
  required,
  onChange,
}: {
  fields: string[];
  required: string[];
  onChange: (fields: string[], required: string[]) => void;
}) {
  const allRequired = Array.from(new Set([...inquiryRequiredDefaults, ...required]));
  const allOptional = Array.from(
    new Set([...inquiryOptionalDefaults, ...fields.filter((field) => !allRequired.includes(field))]),
  );
  const toggleField = (field: string, next: boolean) => {
    const nextFields = next ? Array.from(new Set([...fields, field])) : fields.filter((item) => item !== field);
    const nextRequired = next ? required : required.filter((item) => item !== field);
    onChange(nextFields, nextRequired);
  };
  const toggleRequired = (field: string, next: boolean) => {
    const nextFields = Array.from(new Set([...fields, field]));
    const nextRequired = next ? Array.from(new Set([...required, field])) : required.filter((item) => item !== field);
    onChange(nextFields, nextRequired);
  };
  return (
    <div className="inquiry-groups">
      <InquiryGroup
        title="必填"
        items={allRequired}
        fields={fields}
        required={required}
        onToggleField={toggleField}
        onToggleRequired={toggleRequired}
      />
      <InquiryGroup
        title="可选"
        items={allOptional}
        fields={fields}
        required={required}
        onToggleField={toggleField}
        onToggleRequired={toggleRequired}
      />
    </div>
  );
}

function InquiryGroup({
  title,
  items,
  fields,
  required,
  onToggleField,
  onToggleRequired,
}: {
  title: string;
  items: string[];
  fields: string[];
  required: string[];
  onToggleField: (field: string, next: boolean) => void;
  onToggleRequired: (field: string, next: boolean) => void;
}) {
  return (
    <section className="inquiry-group">
      <h3>{title}</h3>
      {items.map((item) => (
        <div key={item}>
          <label>
            <input type="checkbox" checked={fields.includes(item)} onChange={(e) => onToggleField(item, e.target.checked)} />
            <span>{item}</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={required.includes(item)}
              disabled={!fields.includes(item)}
              onChange={(e) => onToggleRequired(item, e.target.checked)}
            />
            <span>必填</span>
          </label>
        </div>
      ))}
    </section>
  );
}

function Repeat({
  title,
  items,
  keys,
  labels,
  onChange,
}: {
  title: string;
  items: Record<string, string>[];
  keys: string[];
  labels: string[];
  onChange: (x: Record<string, string>[]) => void;
}) {
  return (
    <div className="service-repeat">
      <h3>{title}</h3>
      {items.map((x, i) => (
        <div key={i}>
          {keys.map((k, n) => (
            <Field n={labels[n]} key={k}>
              <input
                value={x[k] || ""}
                onChange={(e) =>
                  onChange(items.map((y, j) => (j === i ? { ...y, [k]: e.target.value } : y)))
                }
              />
            </Field>
          ))}
          <button onClick={() => onChange(items.filter((_, j) => j !== i))}>删除</button>
        </div>
      ))}
      <button onClick={() => onChange([...items, Object.fromEntries(keys.map((k) => [k, ""]))])}>
        ＋ 新增{title}
      </button>
    </div>
  );
}

function routePlanName(route: ServiceRoutePlan) {
  return route.nameZh || route.name || "未命名路线";
}

function routePlanDescription(route: ServiceRoutePlan) {
  return route.descriptionZh || route.description || "";
}

function routePlanTags(route: ServiceRoutePlan) {
  const tags = Array.isArray(route.tags) ? route.tags.filter(Boolean) : [];
  if (tags.length) return tags;
  return route.tag ? [route.tag] : [];
}

function routePlanNodes(route: ServiceRoutePlan): ServiceRouteNode[] {
  if (Array.isArray(route.nodes) && route.nodes.length) return route.nodes;
  return String(route.stops || "")
    .split(/[·,，、]/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ nameZh: name, descriptionZh: "", image: "", stayTime: "", type: guessNodeType(name) }));
}

function emptyRoutePlan(index: number, image = ""): ServiceRoutePlan {
  return {
    name: `新路线 ${index + 1}`,
    nameZh: `新路线 ${index + 1}`,
    nameEn: "",
    description: "",
    descriptionZh: "",
    descriptionEn: "",
    image,
    duration: "约 8 小时",
    tag: "推荐路线",
    tags: ["推荐路线"],
    visible: true,
    recommended: false,
    sortOrder: index + 1,
    stops: "",
    nodes: [
      {
        nameZh: "酒店接送",
        nameEn: "Hotel pickup",
        descriptionZh: "从酒店出发",
        descriptionEn: "Depart from your hotel",
        image,
        stayTime: "",
        type: "接送",
      },
    ],
  };
}

function normalizeRoutePlan(route: ServiceRoutePlan, index: number, fallbackImage = ""): ServiceRoutePlan {
  const tags = routePlanTags(route);
  const nodes = routePlanNodes(route).map((node) => ({ ...node, type: node.type || guessNodeType(node.nameZh || node.title || "") }));
  return {
    ...route,
    name: route.name || route.nameZh || `路线 ${index + 1}`,
    nameZh: route.nameZh || route.name || `路线 ${index + 1}`,
    image: route.image || fallbackImage,
    duration: route.duration || "约 8 小时",
    tag: tags[0] || "",
    tags,
    visible: route.visible !== false,
    recommended: Boolean(route.recommended),
    sortOrder: route.sortOrder || index + 1,
    stops: route.stops || nodes.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · "),
    nodes,
  };
}

function RoutePlansEditor({
  items,
  serviceImages,
  onUpload,
  onChange,
}: {
  items: ServiceRoutePlan[];
  serviceImages: string[];
  onUpload: (files: FileList | null, done: (urls: string[]) => void) => void;
  onChange: (x: ServiceRoutePlan[]) => void;
}) {
  const [editing, setEditing] = useState(0);
  const fallbackImage = serviceImages[0] || "";
  const routes = useMemo(
    () =>
      (items.length ? items : [emptyRoutePlan(0, fallbackImage)]).map((route, index) =>
        normalizeRoutePlan(route, index, fallbackImage),
      ),
    [items, fallbackImage],
  );
  const sync = (next: ServiceRoutePlan[]) =>
    onChange(next.map((route, index) => ({ ...route, sortOrder: index + 1 })));
  const update = (index: number, patch: Partial<ServiceRoutePlan>) =>
    sync(routes.map((route, i) => (i === index ? { ...route, ...patch } : route)));
  const updateNode = (routeIndex: number, nodeIndex: number, patch: Partial<ServiceRouteNode>) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route).map((node, i) => (i === nodeIndex ? { ...node, ...patch } : node));
    update(routeIndex, {
      nodes,
      stops: nodes.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · "),
    });
  };
  const moveRoute = (from: number, to: number) => {
    if (to < 0 || to >= routes.length) return;
    const next = [...routes];
    [next[from], next[to]] = [next[to], next[from]];
    setEditing(to);
    sync(next);
  };
  const moveNode = (routeIndex: number, from: number, to: number) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route);
    if (to < 0 || to >= nodes.length) return;
    const next = [...nodes];
    [next[from], next[to]] = [next[to], next[from]];
    update(routeIndex, {
      nodes: next,
      stops: next.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · "),
    });
  };
  return (
    <div className="route-plan-editor">
      <div className="route-plan-head">
        <div>
          <h3>路线方案</h3>
          <p>这些是“私人包车”服务内部的推荐路线，不会被创建成独立服务。</p>
        </div>
        <button
          onClick={() => {
            sync([...routes, emptyRoutePlan(routes.length, fallbackImage)]);
            setEditing(routes.length);
          }}
        >
          ＋ 添加路线
        </button>
      </div>
      <div className="route-plan-list">
        {routes.map((route, index) => {
          const nodes = routePlanNodes(route);
          return (
            <article
              className={editing === index ? "route-plan-card editing" : "route-plan-card"}
              key={`${routePlanName(route)}-${index}`}
            >
              <div className="route-plan-summary">
                <div className="route-plan-thumb">
                  {route.image ? <img src={route.image} alt="" /> : <span>路线图</span>}
                </div>
                <div>
                  <h4>
                    {route.recommended ? <i>热门</i> : null}
                    {routePlanName(route)}
                  </h4>
                  <small>{route.nameEn || "英文名称未填写"}</small>
                  <p>
                    {route.duration || "时长未填"} · {routePlanTags(route).join(" / ") || "暂无标签"} · {nodes.length} 个节点
                  </p>
                  <b>{route.visible === false ? "已隐藏" : "已显示"}</b>
                </div>
                <nav>
                  <button onClick={() => moveRoute(index, index - 1)}>上移</button>
                  <button onClick={() => moveRoute(index, index + 1)}>下移</button>
                  <button onClick={() => setEditing(editing === index ? -1 : index)}>编辑</button>
                  <button
                    onClick={() => {
                      sync([
                        ...routes.slice(0, index + 1),
                        {
                          ...route,
                          nameZh: `${routePlanName(route)} - 副本`,
                          name: `${routePlanName(route)} - 副本`,
                        },
                        ...routes.slice(index + 1),
                      ]);
                      setEditing(index + 1);
                    }}
                  >
                    复制
                  </button>
                  <button onClick={() => update(index, { visible: route.visible === false })}>
                    {route.visible === false ? "显示" : "隐藏"}
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      const next = routes.filter((_, i) => i !== index);
                      setEditing(Math.max(0, index - 1));
                      sync(next);
                    }}
                  >
                    删除
                  </button>
                </nav>
              </div>
              {editing === index && (
                <div className="route-plan-form">
                  <div className="field-row">
                    <Field n="路线名称">
                      <input
                        value={route.nameZh || ""}
                        onChange={(e) => update(index, { nameZh: e.target.value, name: e.target.value })}
                      />
                    </Field>
                    <Field n="英文名称">
                      <input value={route.nameEn || ""} onChange={(e) => update(index, { nameEn: e.target.value })} />
                    </Field>
                  </div>
                  <Field n="路线副标题 / 简介">
                    <input
                      value={routePlanDescription(route)}
                      onChange={(e) => update(index, { descriptionZh: e.target.value, description: e.target.value })}
                    />
                  </Field>
                  <div className="field-row">
                    <Field n="建议时长">
                      <input value={route.duration || ""} onChange={(e) => update(index, { duration: e.target.value })} />
                    </Field>
                    <Field n="路线标签（用顿号分隔）">
                      <input
                        value={routePlanTags(route).join("、")}
                        onChange={(e) => {
                          const tags = e.target.value
                            .split(/[、,，]/)
                            .map((tag) => tag.trim())
                            .filter(Boolean);
                          update(index, { tags, tag: tags[0] || "" });
                        }}
                      />
                    </Field>
                  </div>
                  <label className="route-inline-check">
                    <input
                      type="checkbox"
                      checked={Boolean(route.recommended)}
                      onChange={(e) => update(index, { recommended: e.target.checked })}
                    />
                    <span>热门推荐</span>
                  </label>
                  <Field n="封面图片">
                    <ImageChooser
                      value={route.image || ""}
                      images={serviceImages}
                      onUpload={(files) => onUpload(files, (urls) => update(index, { image: urls[0] || route.image }))}
                      onChange={(url) => update(index, { image: url })}
                    />
                  </Field>
                  <h4>路线节点</h4>
                  <div className="route-node-list">
                    {nodes.map((node, nodeIndex) => (
                      <article className="route-node-card" key={`${node.nameZh || node.title}-${nodeIndex}`}>
                        <strong>{String(nodeIndex + 1).padStart(2, "0")}</strong>
                        <div>
                          <div className="field-row">
                            <Field n="节点名称">
                              <input
                                value={node.nameZh || node.title || ""}
                                onChange={(e) =>
                                  updateNode(index, nodeIndex, {
                                    nameZh: e.target.value,
                                    title: e.target.value,
                                    type: node.type || guessNodeType(e.target.value),
                                  })
                                }
                              />
                            </Field>
                            <Field n="节点类型">
                              <select
                                value={node.type || guessNodeType(node.nameZh || node.title || "")}
                                onChange={(e) => updateNode(index, nodeIndex, { type: e.target.value })}
                              >
                                <option>接送</option>
                                <option>景点</option>
                                <option>用餐</option>
                                <option>自由活动</option>
                                <option>返程</option>
                              </select>
                            </Field>
                          </div>
                          <div className="field-row">
                            <Field n="停留时间（可选）">
                              <input
                                value={node.stayTime || node.time || ""}
                                onChange={(e) => updateNode(index, nodeIndex, { stayTime: e.target.value, time: e.target.value })}
                              />
                            </Field>
                            <Field n="简短说明">
                              <input
                                value={node.descriptionZh || node.description || ""}
                                onChange={(e) =>
                                  updateNode(index, nodeIndex, { descriptionZh: e.target.value, description: e.target.value })
                                }
                              />
                            </Field>
                          </div>
                          <Field n="节点图片">
                            <ImageChooser
                              value={node.image || ""}
                              images={serviceImages}
                              onUpload={(files) =>
                                onUpload(files, (urls) => updateNode(index, nodeIndex, { image: urls[0] || node.image }))
                              }
                              onChange={(url) => updateNode(index, nodeIndex, { image: url })}
                            />
                          </Field>
                        </div>
                        <nav>
                          <button onClick={() => moveNode(index, nodeIndex, nodeIndex - 1)}>↑</button>
                          <button onClick={() => moveNode(index, nodeIndex, nodeIndex + 1)}>↓</button>
                          <button
                            className="danger"
                            onClick={() => {
                              const next = nodes.filter((_, i) => i !== nodeIndex);
                              update(index, {
                                nodes: next,
                                stops: next.map((item) => item.nameZh || item.title || "").filter(Boolean).join(" · "),
                              });
                            }}
                          >
                            删除
                          </button>
                        </nav>
                      </article>
                    ))}
                  </div>
                  <button
                    className="route-node-add"
                    onClick={() =>
                      update(index, {
                        nodes: [
                          ...nodes,
                          {
                            nameZh: "新节点",
                            descriptionZh: "",
                            image: route.image || fallbackImage,
                            stayTime: "",
                            type: "景点",
                          },
                        ],
                      })
                    }
                  >
                    ＋ 添加节点
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ImageChooser({
  value,
  images,
  onUpload,
  onChange,
}: {
  value: string;
  images: string[];
  onUpload: (files: FileList | null) => void;
  onChange: (url: string) => void;
}) {
  return (
    <div className="route-image-chooser">
      <div className="route-image-preview">{value ? <img src={value} alt="" /> : <span>未选择图片</span>}</div>
      <label className="route-image-upload">
        上传图片
        <input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files)} />
      </label>
      {images.length ? (
        <div className="route-gallery-picks">
          {images.slice(0, 8).map((image, index) => (
            <button
              className={image === value ? "active" : ""}
              onClick={() => onChange(image)}
              key={`${image}-${index}`}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function guessNodeType(name: string) {
  if (/接|酒店|出发|送/.test(name)) return "接送";
  if (/餐|午|晚|吃|美食/.test(name)) return "用餐";
  if (/自由|购物|逛/.test(name)) return "自由活动";
  if (/返|回/.test(name)) return "返程";
  return "景点";
}

function publishChecks(d: ServiceItem, isCar: boolean) {
  const visibleRoutes = (d.routes || []).filter((route) => route.visible !== false);
  const visibleVehicles = (d.vehicles || []).filter((vehicle) => vehicle.visible !== false);
  return [
    { label: "服务名称", ok: Boolean(d.nameZh) },
    { label: "目的地与分类", ok: Boolean(d.city && d.categoryId) },
    { label: "封面图片", ok: Boolean(d.images[0]) },
    ...(isCar
      ? [
          { label: "至少 1 个车型", ok: visibleVehicles.length > 0 },
          { label: "至少 1 条路线", ok: visibleRoutes.length > 0 },
          {
            label: "价格设置",
            ok: visibleVehicles.some((vehicle) => vehicle.priceMode === "咨询报价" || vehicle.halfDayPrice || vehicle.fullDayPrice || vehicle.price),
          },
        ]
      : []),
    { label: "咨询字段", ok: Boolean(d.inquiryFields.length) },
  ];
}

function previewTitle(tabName: string) {
  if (tabName === "车型与价格") return "车型卡预览";
  if (tabName === "路线方案") return "热门包车方案预览";
  if (tabName === "咨询设置") return "咨询字段预览";
  return "服务卡片预览";
}

function PreviewCard({
  data,
  category,
  tabName,
}: {
  data: ServiceItem;
  category?: ServiceCategory;
  tabName: string;
}) {
  if (tabName === "车型与价格") {
    const vehicles = (data.vehicles || []).filter((vehicle) => vehicle.visible !== false);
    return (
      <div>
        <h2>可安排车型</h2>
        {vehicles.slice(0, 3).map((vehicle, index) => (
          <p key={`${vehicle.nameZh}-${index}`}>
            <b>{vehicle.nameZh}</b>
            <br />
            {vehicle.people} · {vehicle.priceMode === "咨询报价" ? "价格咨询" : `半日 ¥${vehicle.halfDayPrice || vehicle.price || 0} 起`}
          </p>
        ))}
      </div>
    );
  }
  if (tabName === "路线方案") {
    return (
      <div>
        <h2>{data.routeSectionTitleZh || "热门包车方案"}</h2>
        {(data.routes || [])
          .filter((route) => route.visible !== false)
          .slice(0, 3)
          .map((route, index) => (
            <p key={`${routePlanName(route)}-${index}`}>
              <b>{route.recommended ? "热门 · " : ""}{routePlanName(route)}</b>
              <br />
              {route.duration} · {routePlanNodes(route).length} 个节点
            </p>
          ))}
      </div>
    );
  }
  if (tabName === "咨询设置") {
    return (
      <div>
        <h2>咨询时需要提供</h2>
        {data.inquiryFields.slice(0, 8).map((field) => (
          <i key={field}>{field}</i>
        ))}
      </div>
    );
  }
  return (
    <div>
      {data.images[0] ? <img src={data.images[0]} alt="" /> : <span>添加封面图片</span>}
      <p>
        {data.city} · {category?.nameZh || data.category}
      </p>
      <h2>{data.nameZh}</h2>
      <b>{data.subtitleZh}</b>
      <div>
        {data.tags.map((x) => (
          <i key={x}>{x}</i>
        ))}
      </div>
    </div>
  );
}
