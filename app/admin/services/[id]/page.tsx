"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { DestinationRecord } from "../../../../db/destinations";
import type { ServiceCategory } from "../../../../db/services";
import type { ServiceItem, ServiceRouteNode, ServiceRoutePlan } from "../../../../db/service-items";
import { TransferEditor } from "./transfer-editor";
const tabs = ["基础信息", "图片", "内容", "行程／路线", "咨询", "发布"];
const inquiry = [
  "日期",
  "人数",
  "出发地点",
  "接送地点",
  "儿童人数",
  "行李数量",
  "特殊需求",
];
export default function ServiceEditor() {
  const { id } = useParams<{ id: string }>(),
    [d, setD] = useState<ServiceItem | null>(null),
    [destinations, setDestinations] = useState<DestinationRecord[]>([]),
    [categories, setCategories] = useState<ServiceCategory[]>([]),
    [tab, setTab] = useState(0),
    [loadError, setLoadError] = useState(""),
    [notice, setNotice] = useState("");
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
    if (!id) {
      setLoadError("缺少服务 ID，无法打开编辑器。");
      return;
    }
    setLoadError("");
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
  if (d.type === "交通接送") return <TransferEditor data={d} onChange={setD} destinations={destinations} categories={categories} />;
  const set = (k: keyof ServiceItem, v: unknown) =>
    setD((x) => (x ? { ...x, [k]: v } : x));
  const save = async (status?: ServiceItem["status"]) => {
    const next = { ...d, status: status || d.status };
    setNotice(status === "published" ? "发布中…" : "保存中…");
    const r = await fetch(`/api/admin/service-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (r.ok) {
      setD(next);
      setNotice(
        status === "published" ? "✓ 发布成功，前台已经更新" : "✓ 草稿已保存",
      );
    } else setNotice("保存失败，请重试");
  };
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const f = new FormData();
    [...files].slice(0, 50).forEach((x) => f.append("files", x));
    setNotice("图片上传中…");
    const r = await fetch("/api/admin/uploads", { method: "POST", body: f }),
      x = await r.json();
    if (r.ok) {
      set("images", [...d.images, ...x.urls]);
      setNotice(`已上传 ${x.urls.length} 张图片`);
    }
  };
  const isTransport = d.type === "交通接送",
    isCar = d.templateType === "route" || d.type === "私人包车",
    hasTimeline = d.templateType === "experience" || ["当地体验", "城市体验", "一日路线", "海岛体验"].includes(d.type);
  const currentCategory = categories.find((category) => category.id === d.categoryId);
  return (
    <>
      <div className="editor-top">
        <div>
          <Link href="/admin/services">← 返回服务列表</Link>
          <h1>{d.nameZh}</h1>
          <span>
            {d.city} / {currentCategory?.nameZh || d.category} / {d.nameZh} · 使用：{templateLabel(d.templateType)}
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
          {tabs.map((x, i) => (
            <button
              className={tab === i ? "active" : ""}
              onClick={() => setTab(i)}
              key={x}
            >
              <i>{i + 1}</i>
              {x}
            </button>
          ))}
        </aside>
        <main className="editor-form">
          {tab === 0 && (
            <>
              <Head
                title="基础信息"
                text="决定服务在列表与详情页中的名称和归属。"
              />
              <div className="field-row">
                <Field n="目的地">
                  <select value={d.city} onChange={(e) => {
                    const destination = destinations.find((item) => item.nameZh === e.target.value);
                    setD((x) => x ? { ...x, city: e.target.value, destinationId: destination?.id || x.destinationId || 0 } : x);
                  }}>
                    {destinationOptions(destinations, d.city).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field n="所属展示分类">
                  <select value={d.categoryId || currentCategory?.id || 1} onChange={(e) => {
                    const category = categories.find((item) => item.id === Number(e.target.value));
                    setD((x) => x ? { ...x, categoryId: Number(e.target.value), category: category?.nameZh || x.category } : x);
                  }}>
                    {categoryOptions(categories, d.categoryId).map((category) => (
                      <option value={category.id} key={category.id}>{category.nameZh}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field n="当前编辑模板">
                <input value={templateLabel(d.templateType)} readOnly />
                <small className="field-help">模板控制编辑器字段，默认不随意更换；如需更换，建议新建对应结构服务。</small>
              </Field>
              <div className="field-row">
                <Field n="中文标题">
                  <input
                    value={d.nameZh}
                    onChange={(e) => set("nameZh", e.target.value)}
                  />
                </Field>
                <Field n="英文标题">
                  <input
                    value={d.nameEn}
                    onChange={(e) => set("nameEn", e.target.value)}
                  />
                </Field>
              </div>
              <div className="field-row">
                <Field n="中文副标题">
                  <input
                    value={d.subtitleZh}
                    onChange={(e) => set("subtitleZh", e.target.value)}
                  />
                </Field>
                <Field n="英文副标题">
                  <input
                    value={d.subtitleEn}
                    onChange={(e) => set("subtitleEn", e.target.value)}
                  />
                </Field>
              </div>
              <Field n="标签（用顿号分隔）">
                <input
                  value={d.tags.join("、")}
                  onChange={(e) =>
                    set("tags", e.target.value.split(/[、,，]/).filter(Boolean))
                  }
                />
              </Field>
            </>
          )}
          {tab === 1 && (
            <>
              <Head
                title="图片"
                text="第一张图片作为服务封面，可批量上传并调整顺序。"
              />
              <label className="service-upload">
                拖拽或选择多张服务图片
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => upload(e.target.files)}
                />
              </label>
              <div className="service-image-list">
                {d.images.map((x, i) => (
                  <div key={x}>
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
                    <button
                      onClick={() =>
                        set(
                          "images",
                          d.images.filter((y) => y !== x),
                        )
                      }
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 2 && (
            <>
              <Head title="内容" text="前台 Hero、简介和关于这个服务。" />
              <Field n="中文介绍">
                <textarea
                  rows={7}
                  value={d.introZh}
                  onChange={(e) => set("introZh", e.target.value)}
                />
              </Field>
              <Field n="英文介绍">
                <textarea
                  rows={7}
                  value={d.introEn}
                  onChange={(e) => set("introEn", e.target.value)}
                />
              </Field>
              {isTransport && (
                <Repeat
                  title="服务流程"
                  items={d.steps}
                  keys={["title", "description"]}
                  labels={["步骤标题", "说明"]}
                  onChange={(x) => set("steps", x)}
                />
              )}
            </>
          )}
          {tab === 3 && (
            <>
              {isCar ? (
                <>
                  <Head
                    title="路线方案"
                    text="每条包车路线拥有独立图片、时长、标签和途经地点。"
                  />
                  <div className="route-section-copy">
                    <Field n="板块标题">
                      <input
                        value={d.routeSectionTitleZh}
                        onChange={(e) => set("routeSectionTitleZh", e.target.value)}
                        placeholder="热门包车方案"
                      />
                    </Field>
                    <Field n="板块说明">
                      <textarea
                        rows={3}
                        value={d.routeSectionIntroZh}
                        onChange={(e) => set("routeSectionIntroZh", e.target.value)}
                        placeholder="以下路线仅作参考，可根据您的时间与兴趣灵活调整。"
                      />
                    </Field>
                  </div>
                  <RoutePlansEditor
                    items={d.routes}
                    serviceImages={d.images}
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
              <Head
                title="咨询设置"
                text="选择客户咨询这项服务时需要提供的信息。"
              />
              <div className="amenity-checks">
                {inquiry.map((x) => (
                  <label key={x}>
                    <input
                      type="checkbox"
                      checked={d.inquiryFields.includes(x)}
                      onChange={(e) =>
                        set(
                          "inquiryFields",
                          e.target.checked
                            ? [...d.inquiryFields, x]
                            : d.inquiryFields.filter((y) => y !== x),
                        )
                      }
                    />
                    <span>{x}</span>
                  </label>
                ))}
              </div>
              <div className="field-row">
                <Field n="价格模式">
                  <select
                    value={d.priceMode}
                    onChange={(e) => set("priceMode", e.target.value)}
                  >
                    <option>咨询报价</option>
                    <option>起价</option>
                    <option>固定价格</option>
                  </select>
                </Field>
                <Field n="计价单位">
                  <select
                    value={d.priceUnit}
                    onChange={(e) => set("priceUnit", e.target.value)}
                  >
                    <option>每次</option>
                    <option>每人</option>
                    <option>每辆</option>
                    <option>每天</option>
                  </select>
                </Field>
              </div>
              {d.priceMode !== "咨询报价" && (
                <Field n="价格 RM">
                  <input
                    type="number"
                    value={d.price}
                    onChange={(e) => set("price", Number(e.target.value))}
                  />
                </Field>
              )}
              <Field n="价格备注">
                <input
                  value={d.priceNote}
                  onChange={(e) => set("priceNote", e.target.value)}
                />
              </Field>
            </>
          )}
          {tab === 5 && (
            <>
              <Head title="发布" text="确认内容后发布到前台。" />
              <div className="publish-check">
                <ul>
                  <li className={d.nameZh ? "ok" : ""}>服务名称</li>
                  <li className={d.images.length ? "ok" : ""}>封面图片</li>
                  <li className={d.introZh ? "ok" : ""}>服务介绍</li>
                  <li className={d.inquiryFields.length ? "ok" : ""}>
                    咨询字段
                  </li>
                </ul>
                <button
                  className="admin-primary"
                  onClick={() => save("published")}
                >
                  发布服务
                </button>
              </div>
            </>
          )}
        </main>
        <aside className="service-live-preview">
          <small>实时预览</small>
          <div>
            {d.images[0] ? (
              <img src={d.images[0]} alt="" />
            ) : (
              <span>添加封面图片</span>
            )}
            <p>
            {d.city} · {d.category}
            </p>
            <h2>{d.nameZh}</h2>
            <b>{d.subtitleZh}</b>
            <div>
              {d.tags.map((x) => (
                <i key={x}>{x}</i>
              ))}
            </div>
          </div>
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
function categoryOptions(items: ServiceCategory[], currentId: number) {
  const configured = items
    .filter((item) => item.visible !== false || item.id === currentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  return configured.length ? configured : [{ id: 1, nameZh: "交通服务" } as ServiceCategory];
}
function Head({ title, text }: { title: string; text: string }) {
  return (
    <div className="block-head">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
function Field({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{n}</span>
      {children}
    </label>
  );
}
function destinationOptions(items: DestinationRecord[], current: string) {
  const configured = items
    .filter((item) => item.useForServices && item.status !== "hidden")
    .sort((a, b) => a.serviceSort - b.serviceSort || a.id - b.id)
    .map((item) => item.nameZh);
  if (current && !configured.includes(current)) return [...configured, current];
  return configured.length ? configured : ["吉隆坡", "亚庇", "仙本那", "马六甲", "新加坡"];
}
function Repeat({
  title,
  items,
  keys,
  labels,
  onChange,
}: {
  title: string;
  items: any[];
  keys: string[];
  labels: string[];
  onChange: (x: any[]) => void;
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
                  onChange(
                    items.map((y, j) =>
                      j === i ? { ...y, [k]: e.target.value } : y,
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
        onClick={() =>
          onChange([...items, Object.fromEntries(keys.map((k) => [k, ""]))])
        }
      >
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
    .map((name) => ({ nameZh: name, descriptionZh: "", image: "", stayTime: "" }));
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
    sortOrder: index + 1,
    stops: "",
    nodes: [
      { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发", descriptionEn: "Depart from your hotel", image, stayTime: "" },
    ],
  };
}
function normalizeRoutePlan(route: ServiceRoutePlan, index: number, fallbackImage = ""): ServiceRoutePlan {
  const tags = routePlanTags(route);
  const nodes = routePlanNodes(route);
  return {
    ...route,
    name: route.name || route.nameZh || `路线 ${index + 1}`,
    nameZh: route.nameZh || route.name || `路线 ${index + 1}`,
    image: route.image || fallbackImage,
    duration: route.duration || "约 8 小时",
    tag: tags[0] || "",
    tags,
    visible: route.visible !== false,
    sortOrder: route.sortOrder || index + 1,
    stops: route.stops || nodes.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · "),
    nodes,
  };
}
function RoutePlansEditor({
  items,
  serviceImages,
  onChange,
}: {
  items: ServiceRoutePlan[];
  serviceImages: string[];
  onChange: (x: ServiceRoutePlan[]) => void;
}) {
  const [editing, setEditing] = useState(0);
  const fallbackImage = serviceImages[0] || "";
  const routes = (items.length ? items : [emptyRoutePlan(0, fallbackImage)]).map((route, index) =>
    normalizeRoutePlan(route, index, fallbackImage),
  );
  const sync = (next: ServiceRoutePlan[]) =>
    onChange(next.map((route, index) => ({ ...route, sortOrder: index + 1 })));
  const update = (index: number, patch: Partial<ServiceRoutePlan>) =>
    sync(routes.map((route, i) => (i === index ? { ...route, ...patch } : route)));
  const updateNode = (routeIndex: number, nodeIndex: number, patch: Partial<ServiceRouteNode>) => {
    const route = routes[routeIndex];
    const nodes = routePlanNodes(route).map((node, i) => (i === nodeIndex ? { ...node, ...patch } : node));
    update(routeIndex, { nodes, stops: nodes.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · ") });
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
    update(routeIndex, { nodes: next, stops: next.map((node) => node.nameZh || node.title || "").filter(Boolean).join(" · ") });
  };
  return (
    <div className="route-plan-editor">
      <div className="route-plan-head">
        <div>
          <h3>路线方案</h3>
          <p>这些是“私人包车”服务内部的推荐路线，不会被创建成独立服务。</p>
        </div>
        <button onClick={() => { sync([...routes, emptyRoutePlan(routes.length, fallbackImage)]); setEditing(routes.length); }}>
          ＋ 添加路线
        </button>
      </div>
      <div className="route-plan-list">
        {routes.map((route, index) => {
          const nodes = routePlanNodes(route);
          return (
            <article className={editing === index ? "route-plan-card editing" : "route-plan-card"} key={`${routePlanName(route)}-${index}`}>
              <div className="route-plan-summary">
                <div className="route-plan-thumb">
                  {route.image ? <img src={route.image} alt="" /> : <span>路线图</span>}
                </div>
                <div>
                  <h4>{routePlanName(route)}</h4>
                  <small>{route.nameEn || "英文名称未填写"}</small>
                  <p>{route.duration || "时长未填"} · {routePlanTags(route).join(" / ") || "暂无标签"} · {nodes.length} 个节点</p>
                  <b>{route.visible === false ? "已隐藏" : "已显示"}</b>
                </div>
                <nav>
                  <button onClick={() => moveRoute(index, index - 1)}>上移</button>
                  <button onClick={() => moveRoute(index, index + 1)}>下移</button>
                  <button onClick={() => setEditing(editing === index ? -1 : index)}>编辑</button>
                  <button onClick={() => { sync([...routes.slice(0, index + 1), { ...route, nameZh: `${routePlanName(route)} - 副本`, name: `${routePlanName(route)} - 副本` }, ...routes.slice(index + 1)]); setEditing(index + 1); }}>复制</button>
                  <button onClick={() => update(index, { visible: route.visible === false })}>{route.visible === false ? "显示" : "隐藏"}</button>
                  <button className="danger" onClick={() => { const next = routes.filter((_, i) => i !== index); setEditing(Math.max(0, index - 1)); sync(next); }}>删除</button>
                </nav>
              </div>
              {editing === index && (
                <div className="route-plan-form">
                  <div className="field-row">
                    <Field n="路线名称">
                      <input value={route.nameZh || ""} onChange={(e) => update(index, { nameZh: e.target.value, name: e.target.value })} />
                    </Field>
                    <Field n="英文名称">
                      <input value={route.nameEn || ""} onChange={(e) => update(index, { nameEn: e.target.value })} />
                    </Field>
                  </div>
                  <Field n="路线副标题 / 简介">
                    <input value={routePlanDescription(route)} onChange={(e) => update(index, { descriptionZh: e.target.value, description: e.target.value })} />
                  </Field>
                  <div className="field-row">
                    <Field n="建议时长">
                      <input value={route.duration || ""} onChange={(e) => update(index, { duration: e.target.value })} />
                    </Field>
                    <Field n="路线标签（用顿号分隔）">
                      <input
                        value={routePlanTags(route).join("、")}
                        onChange={(e) => {
                          const tags = e.target.value.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean);
                          update(index, { tags, tag: tags[0] || "" });
                        }}
                      />
                    </Field>
                  </div>
                  <Field n="封面图片地址">
                    <input value={route.image || ""} onChange={(e) => update(index, { image: e.target.value })} placeholder="可粘贴图片地址，默认使用服务封面" />
                  </Field>
                  <h4>路线节点</h4>
                  <div className="route-node-list">
                    {nodes.map((node, nodeIndex) => (
                      <article className="route-node-card" key={`${node.nameZh || node.title}-${nodeIndex}`}>
                        <strong>{String(nodeIndex + 1).padStart(2, "0")}</strong>
                        <div>
                          <div className="field-row">
                            <Field n="节点名称">
                              <input value={node.nameZh || node.title || ""} onChange={(e) => updateNode(index, nodeIndex, { nameZh: e.target.value, title: e.target.value })} />
                            </Field>
                            <Field n="停留时间（可选）">
                              <input value={node.stayTime || node.time || ""} onChange={(e) => updateNode(index, nodeIndex, { stayTime: e.target.value, time: e.target.value })} />
                            </Field>
                          </div>
                          <Field n="简短说明">
                            <input value={node.descriptionZh || node.description || ""} onChange={(e) => updateNode(index, nodeIndex, { descriptionZh: e.target.value, description: e.target.value })} />
                          </Field>
                          <Field n="节点图片地址">
                            <input value={node.image || ""} onChange={(e) => updateNode(index, nodeIndex, { image: e.target.value })} />
                          </Field>
                        </div>
                        <nav>
                          <button onClick={() => moveNode(index, nodeIndex, nodeIndex - 1)}>↑</button>
                          <button onClick={() => moveNode(index, nodeIndex, nodeIndex + 1)}>↓</button>
                          <button className="danger" onClick={() => {
                            const next = nodes.filter((_, i) => i !== nodeIndex);
                            update(index, { nodes: next, stops: next.map((item) => item.nameZh || item.title || "").filter(Boolean).join(" · ") });
                          }}>删除</button>
                        </nav>
                      </article>
                    ))}
                  </div>
                  <button className="route-node-add" onClick={() => update(index, { nodes: [...nodes, { nameZh: "新节点", descriptionZh: "", image: route.image || fallbackImage, stayTime: "" }] })}>
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
