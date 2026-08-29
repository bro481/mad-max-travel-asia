"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  PrivateRouteDetailModal,
  type PrivateRouteDetailData,
} from "../../../components/private-route-detail-modal";
import type { DestinationRecord } from "../../../../db/destinations";
import type { ServiceCategory } from "../../../../db/services";
import type {
  ServiceItem,
  ServiceRouteNode,
  ServiceRoutePlan,
} from "../../../../db/service-items";
import { TransferEditor } from "./transfer-editor";

const defaultTabs = ["基础信息", "图片", "内容", "行程／路线", "咨询", "发布"];
const routeTabs = ["基础信息", "服务图片", "车型与价格", "热门路线", "咨询与发布"];
const inquiryFieldOptions = ["日期", "人数", "出发地点", "接送地点", "想去的地方", "儿童人数", "行李数量", "特殊需求"];

export default function ServiceEditor() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<ServiceItem | null>(null);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [tab, setTab] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragServiceImageIndex, setDragServiceImageIndex] = useState<number | null>(null);

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
  const frontendHref = serviceFrontendHref(d);
  const set = (k: keyof ServiceItem, v: unknown) =>
    setD((x) => (x ? { ...x, [k]: v } : x));
  const setMany = (patch: Partial<ServiceItem>) =>
    setD((x) => (x ? { ...x, ...patch } : x));

  const save = async (status?: ServiceItem["status"]) => {
    const inquiry = isCar ? normalizeInquiryConfig(d.inquiryFields, d.inquiryRequired) : null;
    const next = {
      ...d,
      ...(inquiry ? { inquiryFields: inquiry.fields, inquiryRequired: inquiry.required } : {}),
      status: status || d.status,
    };
    setNotice(status === "published" ? "发布中…" : "保存中…");
    try {
      const r = await fetch(`/api/admin/service-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (r.ok) {
        setD(next);
        setNotice(status === "published" ? "✓ 发布成功，前台已经更新" : "✓ 草稿已保存");
      } else {
        const text = await r.text();
        let message = text;
        try {
          message = JSON.parse(text)?.error || text;
        } catch {}
        setNotice(message || "保存失败，请重试");
      }
    } catch (error) {
      setNotice(`${status === "published" ? "发布" : "保存"}失败：${error instanceof Error ? error.message : "请求没有返回"}`);
    }
  };

  const upload = async (files: FileList | null, onUrls?: (urls: string[]) => void) => {
    if (!files?.length) return;
    const form = new FormData();
    [...files].slice(0, 50).forEach((x) => form.append("files", x));
    setNotice("图片上传中…");
    try {
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
    } catch (error) {
      setNotice(`图片上传失败：${error instanceof Error ? error.message : "请求没有返回"}`);
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
          <a className="admin-secondary" href={frontendHref} target="_blank" rel="noreferrer">
            查看前台
          </a>
          <button className="admin-secondary" onClick={() => save()}>
            保存草稿
          </button>
          <button className="admin-primary" onClick={() => save("published")}>
            发布服务
          </button>
        </div>
      </div>
      {notice && (
        <p className="lead-notice">
          {notice}
          {notice.startsWith("✓") && d.status === "published" && (
            <a href={frontendHref} target="_blank" rel="noreferrer">
              查看前台 →
            </a>
          )}
        </p>
      )}
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
                <Field n={isCar ? "中文服务名称" : "中文标题"}>
                  <input value={d.nameZh} onChange={(e) => set("nameZh", e.target.value)} />
                </Field>
                <Field n={isCar ? "英文服务名称" : "英文标题"}>
                  <input value={d.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
                </Field>
              </div>
              <div className="field-row">
                <Field n={isCar ? "中文服务短介绍" : "中文副标题"}>
                  <input value={d.subtitleZh} onChange={(e) => set("subtitleZh", e.target.value)} />
                </Field>
                <Field n={isCar ? "英文服务短介绍" : "英文副标题"}>
                  <input value={d.subtitleEn} onChange={(e) => set("subtitleEn", e.target.value)} />
                </Field>
              </div>
              <Field n={isCar ? "服务标签（最多 3 个）" : "标签（用顿号分隔）"}>
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
                <Field n={isCar ? "中文服务详细介绍" : "中文简短介绍"}>
                  <textarea
                    rows={3}
                    value={d.introZh}
                    onChange={(e) => set("introZh", e.target.value)}
                    placeholder="半日 / 全天包车，可根据时间和兴趣自由安排路线。"
                  />
                </Field>
                <Field n={isCar ? "英文服务详细介绍" : "英文简短介绍"}>
                  <textarea rows={3} value={d.introEn} onChange={(e) => set("introEn", e.target.value)} />
                </Field>
              </div>
              {isCar && <ServiceHighlights items={d.steps} onChange={(x) => set("steps", x)} />}
            </>
          )}
          {tab === 1 && (
            <>
              <Head title={isCar ? "服务图片" : "图片"} text={isCar ? `这里管理${d.nameZh}服务本身的图片，不管理具体路线或景点图片。第一张用于服务卡和详情主图。` : "第一张图片作为服务封面，可批量上传并调整顺序。"} />
              <label className="service-upload">
                拖拽或选择多张服务图片
                <input type="file" multiple accept="image/*" onChange={(e) => upload(e.target.files)} />
              </label>
              <div className="service-image-list">
                {d.images.map((x, i) => (
                  <div
                    className={dragServiceImageIndex === i ? "dragging" : ""}
                    draggable
                    key={`${x}-${i}`}
                    onDragStart={() => setDragServiceImageIndex(i)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragServiceImageIndex === null || dragServiceImageIndex === i) return;
                      const next = [...d.images];
                      const [moving] = next.splice(dragServiceImageIndex, 1);
                      next.splice(i, 0, moving);
                      set("images", next);
                      setDragServiceImageIndex(null);
                    }}
                    onDragEnd={() => setDragServiceImageIndex(null)}
                  >
                    <span className="route-drag-handle" aria-hidden="true">≡</span>
                    <img src={x} alt="" />
                    <b>{i === 0 ? "★ 封面" : `图片 ${i + 1}`}</b>
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
                  <Head title="热门路线" text="管理私人包车详情页中的“热门包车方案”。Route 属于当前 Service，不是独立服务。" />
                  <RouteSectionCopy
                    title={d.routeSectionTitleZh}
                    intro={d.routeSectionIntroZh}
                    onChange={(patch) => setMany(patch)}
                  />
                  <RoutePlansEditor
                    items={d.routes}
                    frontendHref={frontendHref}
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
              <Head title="咨询与发布" text="统一设置咨询字段、检查发布条件，并从这里保存或发布。" />
              <h3 className="editor-section-title">咨询字段</h3>
              <InquiryPicker
                fields={d.inquiryFields}
                required={d.inquiryRequired}
                onChange={(fields, required) => setMany({ inquiryFields: fields, inquiryRequired: required })}
              />
              <h3 className="editor-section-title">发布检查</h3>
              <div className="publish-check">
                <ul>
                  {checks.map((check) => (
                    <li className={check.ok ? "ok" : ""} key={check.label}>
                      {check.ok ? "✓" : "⚠"} {check.label}
                    </li>
                  ))}
                </ul>
                <div className="publish-actions">
                  <button className="admin-secondary" onClick={() => save()}>保存草稿</button>
                  <button className="admin-primary" onClick={() => save("published") }>发布服务</button>
                  <a className="admin-secondary publish-front-link" href={frontendHref} target="_blank" rel="noreferrer">查看前台页面</a>
                </div>
              </div>
            </>
          )}
        </main>
        <aside className="service-live-preview">
          {tab === 0 || tab === 1 ? <ServiceCardPreview data={d} category={currentCategory} /> : null}
          {tab === 2 ? <VehicleCardPreview data={d} /> : null}
          {tab === 3 ? <RouteCardPreview data={d} /> : null}
          {tab === 4 ? <InquiryPublishPreview data={d} /> : null}
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

function serviceFrontendHref(item: ServiceItem) {
  if (item.templateType === "route" || item.type === "私人包车") {
    const city = item.city === "吉隆坡" ? "kl" : item.city === "马六甲" ? "melaka" : "kk";
    return `/services/private-car?city=${city}&service=${encodeURIComponent(item.slug)}`;
  }
  return `/services?service=${encodeURIComponent(item.slug)}`;
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
    <details className="route-section-copy route-section-collapsed">
      <summary>板块设置</summary>
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
    </details>
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
                    images={[]}
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
  const aliases: Record<string, string> = {
    "计划日期": "日期",
    "同行人数": "人数",
    "想去的路线 / 景点": "想去的地方",
    "想去的路线/景点": "想去的地方",
  };
  const normalizedFields = Array.from(new Set(fields.map((field) => aliases[field] || field))).filter((field) => inquiryFieldOptions.includes(field));
  const normalizedRequired = Array.from(new Set(required.map((field) => aliases[field] || field))).filter((field) => inquiryFieldOptions.includes(field));
  const toggleField = (field: string, next: boolean) => {
    const nextFields = next ? Array.from(new Set([...normalizedFields, field])) : normalizedFields.filter((item) => item !== field);
    const nextRequired = next ? normalizedRequired : normalizedRequired.filter((item) => item !== field);
    onChange(nextFields, nextRequired);
  };
  const toggleRequired = (field: string, next: boolean) => {
    const nextFields = Array.from(new Set([...normalizedFields, field]));
    const nextRequired = next ? Array.from(new Set([...normalizedRequired, field])) : normalizedRequired.filter((item) => item !== field);
    onChange(nextFields, nextRequired);
  };
  return (
    <div className="inquiry-unified-list">
      <div className="inquiry-unified-head"><b>字段</b><span>是否显示</span><span>是否必填</span></div>
      {inquiryFieldOptions.map((field) => (
        <div key={field}>
          <b>{field}</b>
          <label><input type="checkbox" checked={normalizedFields.includes(field)} onChange={(event) => toggleField(field, event.target.checked)} /><span>显示</span></label>
          <label><input type="checkbox" checked={normalizedRequired.includes(field)} disabled={!normalizedFields.includes(field)} onChange={(event) => toggleRequired(field, event.target.checked)} /><span>必填</span></label>
        </div>
      ))}
    </div>
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

function emptyRoutePlan(index: number): ServiceRoutePlan {
  return {
    name: `新路线 ${index + 1}`,
    nameZh: `新路线 ${index + 1}`,
    nameEn: "",
    description: "",
    descriptionZh: "",
    descriptionEn: "",
    image: "",
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
        image: "",
        stayTime: "",
        type: "接送",
      },
    ],
  };
}

function normalizeRoutePlan(route: ServiceRoutePlan, index: number): ServiceRoutePlan {
  const tags = routePlanTags(route);
  const nodes = routePlanNodes(route).map((node) => ({ ...node, type: node.type || guessNodeType(node.nameZh || node.title || "") }));
  return {
    ...route,
    name: route.name || route.nameZh || `路线 ${index + 1}`,
    nameZh: route.nameZh || route.name || `路线 ${index + 1}`,
    image: route.image || "",
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
  frontendHref,
  onUpload,
  onChange,
}: {
  items: ServiceRoutePlan[];
  frontendHref: string;
  onUpload: (files: FileList | null, done: (urls: string[]) => void) => void;
  onChange: (x: ServiceRoutePlan[]) => void;
}) {
  const [editingRouteIndex, setEditingRouteIndex] = useState<number | null>(null);
  const [routeTab, setRouteTab] = useState<"basic" | "nodes">("basic");
  const [tagDraft, setTagDraft] = useState("");
  const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);
  const [dragRouteIndex, setDragRouteIndex] = useState<number | null>(null);
  const [dragNodeIndex, setDragNodeIndex] = useState<number | null>(null);
  const [routePreview, setRoutePreview] = useState<{ focusStopIndex: number | null } | null>(null);
  const routes = useMemo(
    () =>
      (items.length ? items : [emptyRoutePlan(0)]).map((route, index) =>
        normalizeRoutePlan(route, index),
      ),
    [items],
  );
  const sync = (next: ServiceRoutePlan[]) =>
    onChange(next.map((route, index) => ({ ...route, sortOrder: index + 1 })));
  const update = (index: number, patch: Partial<ServiceRoutePlan>) =>
    sync(routes.map((route, i) => (i === index ? { ...route, ...patch } : route)));
  const activeRoute = editingRouteIndex === null ? null : routes[editingRouteIndex] || null;
  const activeNodes = activeRoute ? routePlanNodes(activeRoute) : [];
  const activeNode =
    editingNodeIndex === null ? null : activeNodes[Math.min(editingNodeIndex, Math.max(activeNodes.length - 1, 0))] || null;
  const closeRouteEditor = () => {
    setRoutePreview(null);
    setEditingRouteIndex(null);
    setEditingNodeIndex(null);
    setRouteTab("basic");
  };
  const openRouteEditor = (index: number, tab: "basic" | "nodes" = "basic", nodeIndex: number | null = null) => {
    setEditingRouteIndex(index);
    setRouteTab(tab);
    setEditingNodeIndex(nodeIndex);
    setTagDraft("");
  };
  const cleanRouteTags = (route: ServiceRoutePlan) =>
    routePlanTags(route).filter((tag) => !/^约?\s*\d+(?:[–—-]\d+)?\s*(?:小时|分钟|天)$/.test(tag));
  const previewRoute: PrivateRouteDetailData | null = activeRoute
    ? {
        title: [routePlanName(activeRoute), activeRoute.nameEn || routePlanName(activeRoute)],
        desc: [
          routePlanDescription(activeRoute) || "路线仅作参考，可根据您的时间与兴趣灵活调整。",
          activeRoute.descriptionEn || routePlanDescription(activeRoute) || "Route details can be adjusted around your plans.",
        ],
        duration: [activeRoute.duration || "时间灵活", activeRoute.duration || "Flexible duration"],
        tags: cleanRouteTags(activeRoute).map((tag) => [tag, tag]),
        image: activeRoute.image || "",
        stops: activeNodes.map((node, index) => ({
          title: [
            node.nameZh || node.title || `路线节点 ${index + 1}`,
            node.nameEn || node.nameZh || node.title || `Route stop ${index + 1}`,
          ],
          note: [
            node.descriptionZh || node.description || "可根据当天时间灵活调整停留。",
            node.descriptionEn || node.descriptionZh || node.description || "Timing can be adjusted on the day.",
          ],
          image: node.image || "",
          time: node.stayTime || node.time || "",
          type: node.type || guessNodeType(node.nameZh || node.title || ""),
        })),
      }
    : null;
  const setRouteTags = (tags: string[]) =>
    update(editingRouteIndex!, { tags, tag: tags[0] || "" });
  const addRouteTag = () => {
    if (editingRouteIndex === null) return;
    const value = tagDraft.trim();
    const current = cleanRouteTags(routes[editingRouteIndex]);
    if (!value || current.includes(value)) return setTagDraft("");
    setRouteTags([...current, value]);
    setTagDraft("");
  };
  const updateNode = (routeIndex: number, nodeIndex: number, patch: Partial<ServiceRouteNode>) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route).map((node, i) => (i === nodeIndex ? { ...node, ...patch } : node));
    update(routeIndex, {
      nodes,
      stops: nodes.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · "),
    });
  };
  const reorderRoute = (from: number, to: number) => {
    if (to < 0 || to >= routes.length) return;
    const next = [...routes];
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);
    setEditingRouteIndex((current) => {
      if (current === null) return current;
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
    sync(next);
  };
  const reorderNode = (routeIndex: number, from: number, to: number) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route);
    if (to < 0 || to >= nodes.length) return;
    const next = [...nodes];
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);
    setEditingNodeIndex((current) => {
      if (current === null) return current;
      if (current === from) return to;
      if (from < current && to >= current) return current - 1;
      if (from > current && to <= current) return current + 1;
      return current;
    });
    update(routeIndex, {
      nodes: next,
      stops: next.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · "),
    });
  };
  const copyRoute = (index: number) => {
    const route = routes[index];
    sync([
      ...routes.slice(0, index + 1),
      {
        ...route,
        nameZh: `${routePlanName(route)} - 副本`,
        name: `${routePlanName(route)} - 副本`,
        recommended: false,
      },
      ...routes.slice(index + 1),
    ]);
    openRouteEditor(index + 1);
  };
  const removeRoute = (index: number) => {
    sync(routes.filter((_, i) => i !== index));
    if (editingRouteIndex === index) closeRouteEditor();
  };
  const addNode = (routeIndex: number) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route);
    update(routeIndex, {
      nodes: [
        ...nodes,
        {
          nameZh: "新节点",
          nameEn: "",
          descriptionZh: "",
          descriptionEn: "",
          image: "",
          stayTime: "",
          type: "景点",
        },
      ],
    });
    setRouteTab("nodes");
    setEditingNodeIndex(nodes.length);
  };
  const copyNode = (routeIndex: number, nodeIndex: number) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route);
    const node = nodes[nodeIndex];
    const next = [
      ...nodes.slice(0, nodeIndex + 1),
      { ...node, nameZh: `${node.nameZh || node.title || "节点"} - 副本`, title: `${node.nameZh || node.title || "节点"} - 副本` },
      ...nodes.slice(nodeIndex + 1),
    ];
    update(routeIndex, {
      nodes: next,
      stops: next.map((item) => item.nameZh || item.title || "").filter(Boolean).join(" · "),
    });
    setEditingNodeIndex(nodeIndex + 1);
  };
  const removeNode = (routeIndex: number, nodeIndex: number) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route);
    const next = nodes.filter((_, i) => i !== nodeIndex);
    update(routeIndex, {
      nodes: next,
      stops: next.map((item) => item.nameZh || item.title || "").filter(Boolean).join(" · "),
    });
    setEditingNodeIndex((current) => {
      if (current === null) return current;
      if (next.length === 0) return null;
      if (current >= next.length) return next.length - 1;
      return current;
    });
  };

  return (
    <div className="route-plan-editor">
      <div className="route-plan-head">
        <div>
          <h3>热门路线</h3>
          <p>管理“私人包车”下的推荐路线。路线不是独立服务，点编辑后再维护单条路线和节点。</p>
        </div>
        <button
          onClick={() => {
            sync([...routes, emptyRoutePlan(routes.length)]);
            openRouteEditor(routes.length);
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
              className={dragRouteIndex === index ? "route-plan-card compact dragging" : "route-plan-card compact"}
              key={`${routePlanName(route)}-${index}`}
              draggable
              onDragStart={() => setDragRouteIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragRouteIndex !== null && dragRouteIndex !== index) reorderRoute(dragRouteIndex, index);
                setDragRouteIndex(null);
              }}
              onDragEnd={() => setDragRouteIndex(null)}
            >
              <div className="route-plan-summary">
                <span className="route-drag-handle" aria-hidden="true">
                  ≡
                </span>
                <div className="route-plan-thumb">
                  {route.image ? <img src={route.image} alt="" /> : <span>路线图</span>}
                </div>
                <div className="route-plan-main">
                  <h4>
                    {routePlanName(route)}
                    {route.recommended ? <i>★ 推荐</i> : null}
                  </h4>
                  <small>
                    {route.duration || "时长未填"} · {nodes.length} 个节点 · {route.visible === false ? "已隐藏" : "已显示"}
                  </small>
                  <p>{routePlanDescription(route) || "路线简介未填写"}</p>
                </div>
                <nav>
                  <button onClick={() => openRouteEditor(index)}>编辑</button>
                  <details className="route-actions-menu">
                    <summary aria-label="更多路线操作">•••</summary>
                    <div>
                      <button onClick={() => copyRoute(index)}>复制</button>
                      <button onClick={() => update(index, { visible: route.visible === false })}>
                        {route.visible === false ? "显示" : "隐藏"}
                      </button>
                      <button className="danger" onClick={() => removeRoute(index)}>删除</button>
                    </div>
                  </details>
                </nav>
              </div>
            </article>
          );
        })}
      </div>
      {activeRoute && editingRouteIndex !== null && (
        <div className="route-editor-backdrop" role="dialog" aria-modal="true">
          <div className="route-editor-modal">
            <header className="route-editor-header">
              <div>
                <small>路线编辑器</small>
                <h3>{routePlanName(activeRoute)}</h3>
                <p>
                  {activeRoute.duration || "时长未填"} · {activeNodes.length} 个节点 ·{" "}
                  {activeRoute.visible === false ? "已隐藏" : "前台显示"}
                </p>
              </div>
              <button onClick={closeRouteEditor} aria-label="关闭路线编辑器">
                ×
              </button>
            </header>
            <div className="route-editor-tabs">
              {[
                ["basic", "基本信息"],
                ["nodes", "路线节点"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={routeTab === key ? "active" : ""}
                  onClick={() => setRouteTab(key as "basic" | "nodes")}
                >
                  {label}
                </button>
              ))}
            </div>
            {routeTab === "basic" && (
              <div className="route-editor-body route-editor-grid">
                <div className="route-panel-form">
                  <div className="field-row">
                    <Field n="中文路线名称">
                      <input
                        value={activeRoute.nameZh || ""}
                        onChange={(e) =>
                          update(editingRouteIndex, {
                            nameZh: e.target.value,
                            name: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field n="英文路线名称">
                      <input
                        value={activeRoute.nameEn || ""}
                        onChange={(e) => update(editingRouteIndex, { nameEn: e.target.value })}
                      />
                    </Field>
                  </div>
                  <Field n="路线副标题 / 简介">
                    <input
                      value={routePlanDescription(activeRoute)}
                      onChange={(e) =>
                        update(editingRouteIndex, {
                          descriptionZh: e.target.value,
                          description: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <div className="field-row">
                    <Field n="建议时长">
                      <input
                        value={activeRoute.duration || ""}
                        onChange={(e) => update(editingRouteIndex, { duration: e.target.value })}
                      />
                    </Field>
                    <Field n="路线标签">
                      <div className="route-tag-editor">
                        {cleanRouteTags(activeRoute).map((tag) => (
                          <span key={tag}>
                            {tag}
                            <button
                              type="button"
                              aria-label={`删除标签 ${tag}`}
                              onClick={() => setRouteTags(cleanRouteTags(activeRoute).filter((item) => item !== tag))}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          value={tagDraft}
                          placeholder="输入标签后回车"
                          onChange={(e) => setTagDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addRouteTag();
                            }
                          }}
                        />
                        <button type="button" onClick={addRouteTag}>＋ 添加</button>
                      </div>
                    </Field>
                  </div>
                  <div className="route-switch-row">
                    <label className="route-inline-check">
                      <input
                        type="checkbox"
                        checked={Boolean(activeRoute.recommended)}
                        onChange={(e) => update(editingRouteIndex, { recommended: e.target.checked })}
                      />
                      <span>前台重点推荐</span>
                    </label>
                    <label className="route-inline-check">
                      <input
                        type="checkbox"
                        checked={activeRoute.visible !== false}
                        onChange={(e) => update(editingRouteIndex, { visible: e.target.checked })}
                      />
                      <span>前台显示</span>
                    </label>
                  </div>
                  <Field n="路线封面">
                    <div className="route-cover-compact">
                      <ImageChooser
                        value={activeRoute.image || ""}
                        images={[]}
                        onUpload={(files) =>
                          onUpload(files, (urls) => update(editingRouteIndex, { image: urls[0] || activeRoute.image }))
                        }
                        onChange={(url) => update(editingRouteIndex, { image: url })}
                      />
                      <button type="button" className="route-cover-remove" onClick={() => update(editingRouteIndex, { image: "" })}>
                        删除封面
                      </button>
                      <small>建议比例 16:9，右侧可实时查看前台卡片效果。</small>
                    </div>
                  </Field>
                </div>
                <aside className="route-card-preview">
                  <small>前台路线卡预览</small>
                  <div className="route-preview-card">
                    <div className="route-preview-image">
                      {activeRoute.image ? <img src={activeRoute.image} alt="" /> : <span>封面图</span>}
                    </div>
                    <h4>{routePlanName(activeRoute)}</h4>
                    <p>
                      {activeRoute.duration || "约 8 小时"}　
                      {cleanRouteTags(activeRoute).slice(0, 1).join("") || "推荐路线"}
                    </p>
                    <b>{routePlanDescription(activeRoute) || "路线简介会显示在这里"}</b>
                    <em>查看路线 →</em>
                  </div>
                </aside>
              </div>
            )}
            {routeTab === "nodes" && (
              <div className="route-editor-body route-node-workspace">
                <div>
                  <div className="route-node-toolbar">
                    <div>
                      <h4>路线节点</h4>
                      <p>每个节点对应前端路线弹窗里的一个行程点；拖拽整行调整顺序。</p>
                    </div>
                    <div className="route-node-toolbar-actions">
                      <a className="secondary" href={`${frontendHref}&route=${editingRouteIndex}`} target="_blank" rel="noreferrer">查看前台</a>
                      <button className="secondary" onClick={() => setRoutePreview({ focusStopIndex: null })}>草稿预览</button>
                      <button onClick={() => addNode(editingRouteIndex)}>＋ 添加节点</button>
                    </div>
                  </div>
                  <div className="route-node-list compact">
                    {activeNodes.map((node, nodeIndex) => (
                      <article
                        className={editingNodeIndex === nodeIndex ? "route-node-row active" : "route-node-row"}
                        key={`${node.nameZh || node.title}-${nodeIndex}`}
                        draggable
                        onDragStart={() => setDragNodeIndex(nodeIndex)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (dragNodeIndex !== null && dragNodeIndex !== nodeIndex) {
                            reorderNode(editingRouteIndex, dragNodeIndex, nodeIndex);
                          }
                          setDragNodeIndex(null);
                        }}
                        onDragEnd={() => setDragNodeIndex(null)}
                        onClick={() => setEditingNodeIndex(nodeIndex)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") setEditingNodeIndex(nodeIndex);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <span className="route-drag-handle" aria-hidden="true">
                          ≡
                        </span>
                        <strong>{String(nodeIndex + 1).padStart(2, "0")}</strong>
                        <div className="route-node-mini-thumb">
                          {node.image ? <img src={node.image} alt="" /> : <span>图</span>}
                        </div>
                        <div>
                          <h5>{node.nameZh || node.title || "未命名节点"}</h5>
                          <p>
                            {node.type || guessNodeType(node.nameZh || node.title || "")}
                            {node.stayTime || node.time ? ` · ${node.stayTime || node.time}` : ""} ·{" "}
                            {node.descriptionZh || node.description || "暂无说明"}
                          </p>
                        </div>
                        <nav>
                          <button onClick={(event) => { event.stopPropagation(); copyNode(editingRouteIndex, nodeIndex); }}>复制</button>
                          <button className="danger" onClick={(event) => { event.stopPropagation(); removeNode(editingRouteIndex, nodeIndex); }}>
                            删除
                          </button>
                        </nav>
                      </article>
                    ))}
                  </div>
                </div>
                <aside className="route-node-side-panel">
                  {activeNode && editingNodeIndex !== null ? (
                    <>
                      <h4 className="route-node-editor-title">
                        <small>节点 {String(editingNodeIndex + 1).padStart(2, "0")}</small>
                        <span>·</span>
                        {activeNode.nameZh || activeNode.title || "未命名节点"}
                      </h4>
                      <button
                        type="button"
                        className="route-current-node-preview"
                        onClick={() => setRoutePreview({ focusStopIndex: editingNodeIndex })}
                      >
                        查看当前节点效果 ↗
                      </button>
                      <Field n="节点名称">
                        <input
                          value={activeNode.nameZh || activeNode.title || ""}
                          onChange={(e) =>
                            updateNode(editingRouteIndex, editingNodeIndex, {
                              nameZh: e.target.value,
                              title: e.target.value,
                              type: activeNode.type || guessNodeType(e.target.value),
                            })
                          }
                        />
                      </Field>
                      <div className="field-row">
                        <Field n="节点类型">
                          <select
                            value={activeNode.type || guessNodeType(activeNode.nameZh || activeNode.title || "")}
                            onChange={(e) => updateNode(editingRouteIndex, editingNodeIndex, { type: e.target.value })}
                          >
                            <option>接送</option>
                            <option>景点</option>
                            <option>餐饮</option>
                            <option>购物</option>
                            <option>自由活动</option>
                            <option>其他</option>
                          </select>
                        </Field>
                        <Field n="停留时间">
                          <input
                            value={activeNode.stayTime || activeNode.time || ""}
                            onChange={(e) =>
                              updateNode(editingRouteIndex, editingNodeIndex, {
                                stayTime: e.target.value,
                                time: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <Field n="简短说明">
                        <textarea
                          value={activeNode.descriptionZh || activeNode.description || ""}
                          onChange={(e) =>
                            updateNode(editingRouteIndex, editingNodeIndex, {
                              descriptionZh: e.target.value,
                              description: e.target.value,
                            })
                          }
                        />
                      </Field>
                      <Field n="节点图片">
                        <ImageChooser
                          value={activeNode.image || ""}
                          images={[]}
                          onUpload={(files) =>
                            onUpload(files, (urls) =>
                              updateNode(editingRouteIndex, editingNodeIndex, { image: urls[0] || activeNode.image }),
                            )
                          }
                          onChange={(url) => updateNode(editingRouteIndex, editingNodeIndex, { image: url })}
                        />
                      </Field>
                    </>
                  ) : (
                    <div className="route-node-placeholder">
                      <b>选择一个节点</b>
                      <p>点击左侧任意节点，这里只显示该节点的图片和字段。</p>
                    </div>
                  )}
                </aside>
              </div>
            )}
            <footer className="route-editor-footer">
              <span>保存后将更新当前路线；发布到前台仍需点击「发布服务」。</span>
              <button onClick={closeRouteEditor}>保存路线</button>
            </footer>
            {routePreview && previewRoute ? (
              <RouteDetailPreview route={previewRoute} focusStopIndex={routePreview.focusStopIndex} onClose={() => setRoutePreview(null)} />
            ) : null}
          </div>
        </div>
      )}
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
  if (/餐|午|晚|吃|美食/.test(name)) return "餐饮";
  if (/购物|商场|买/.test(name)) return "购物";
  if (/自由|逛/.test(name)) return "自由活动";
  if (/返|回/.test(name)) return "接送";
  return "景点";
}

function publishChecks(d: ServiceItem, isCar: boolean) {
  const visibleRoutes = (d.routes || []).filter((route) => route.visible !== false);
  const visibleVehicles = (d.vehicles || []).filter((vehicle) => vehicle.visible !== false);
  return [
    { label: "服务名称", ok: Boolean(d.nameZh) },
    { label: "目的地与分类", ok: Boolean(d.city && d.categoryId) },
    { label: "服务封面", ok: Boolean(d.images[0]) },
    ...(isCar
      ? [
          { label: "至少 1 个车型", ok: visibleVehicles.length > 0 },
          { label: "至少 1 条前台显示路线", ok: visibleRoutes.length > 0 },
        ]
      : []),
    { label: "咨询字段", ok: Boolean(d.inquiryFields.length) },
  ];
}

function ServiceCardPreview({ data, category }: { data: ServiceItem; category?: ServiceCategory }) {
  return <div className="typed-preview"><small>服务卡片预览</small><div className="typed-preview-card">{data.images[0] ? <img src={data.images[0]} alt="" /> : <span>添加服务封面图</span>}<p>{data.city} · {category?.nameZh || data.category}</p><h2>{data.nameZh}</h2><b>{data.subtitleZh}</b><div>{data.tags.slice(0, 2).map((tag) => <i key={tag}>{tag}</i>)}</div></div></div>;
}

function VehicleCardPreview({ data }: { data: ServiceItem }) {
    const vehicles = (data.vehicles || []).filter((vehicle) => vehicle.visible !== false);
    return (
      <div className="typed-preview"><small>车型卡片预览</small><div className="typed-preview-card">
        <h2>可安排车型</h2>
        {vehicles.slice(0, 3).map((vehicle, index) => (
          <p key={`${vehicle.nameZh}-${index}`}>
            <b>{vehicle.nameZh}</b>
            <br />
            {vehicle.people} · {vehicle.priceMode === "咨询报价" ? "价格咨询" : `半日 ¥${vehicle.halfDayPrice || vehicle.price || 0} 起`}
          </p>
        ))}
      </div></div>
    );
}

function RouteCardPreview({ data }: { data: ServiceItem }) {
    return (
      <div className="typed-preview"><small>路线卡片预览</small><div className="typed-preview-card">
        <h2>{data.routeSectionTitleZh || "热门包车方案"}</h2>
        {(data.routes || [])
          .filter((route) => route.visible !== false)
          .slice(0, 3)
          .map((route, index) => (
            <p key={`${routePlanName(route)}-${index}`}>
              <b>{route.recommended ? "热门 · " : ""}{routePlanName(route)}</b>
              <br />
              {route.duration} · {routePlanTags(route).slice(0, 1).join("") || `${routePlanNodes(route).length} 个节点`}
              <br />{routePlanDescription(route) || "路线简介未填写"}<br />查看路线 →
            </p>
          ))}
      </div></div>
    );
}

function InquiryPublishPreview({ data }: { data: ServiceItem }) {
    return (
      <div className="typed-preview"><small>咨询字段预览</small><div className="typed-preview-card">
        <h2>咨询时需要提供</h2>
        {data.inquiryFields.slice(0, 8).map((field) => (
          <i key={field}>{field}</i>
        ))}
      </div></div>
    );
}

function RouteDetailPreview({ route, focusStopIndex, onClose }: { route: PrivateRouteDetailData; focusStopIndex: number | null; onClose: () => void }) {
  return <PrivateRouteDetailModal route={route} focusStopIndex={focusStopIndex} onClose={onClose} />;
}

function normalizeInquiryConfig(fields: string[], required: string[]) {
  const aliases: Record<string, string> = { "计划日期": "日期", "同行人数": "人数", "想去的路线 / 景点": "想去的地方", "想去的路线/景点": "想去的地方" };
  const normalize = (items: string[]) => Array.from(new Set(items.map((item) => aliases[item] || item))).filter((item) => inquiryFieldOptions.includes(item));
  const nextFields = normalize(fields);
  return { fields: nextFields, required: normalize(required).filter((item) => nextFields.includes(item)) };
}
