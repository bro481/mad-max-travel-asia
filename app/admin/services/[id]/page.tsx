"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ServiceItem } from "../../../../db/service-items";
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
    [tab, setTab] = useState(0),
    [notice, setNotice] = useState("");
  useEffect(() => {
    fetch(`/api/admin/service-items/${id}`)
      .then(async (r) => {
        if (!r.ok) return null;
        const text = await r.text();
        return text ? JSON.parse(text) : null;
      })
      .then(setD);
  }, [id]);
  if (!d) return <div className="admin-loading">正在打开服务编辑器…</div>;
  if (d.type === "交通接送") return <TransferEditor data={d} onChange={setD} />;
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
    isCar = d.type === "私人包车",
    hasTimeline = ["当地体验", "城市体验", "一日路线", "海岛体验"].includes(d.type);
  return (
    <>
      <div className="editor-top">
        <div>
          <Link href="/admin/services">← 返回服务列表</Link>
          <h1>{d.nameZh}</h1>
          <span>
            {d.type} · {d.city} · {d.status === "published" ? "已上线" : "草稿"}
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
                <Field n="服务类型">
                  <select
                    value={d.type}
                    onChange={(e) => set("type", e.target.value)}
                  >
                    {[
                      "交通接送",
                      "私人包车",
                      "当地体验",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field n="城市">
                  <select
                    value={d.city}
                    onChange={(e) => set("city", e.target.value)}
                  >
                    {["吉隆坡", "亚庇", "仙本那", "马六甲", "新加坡"].map(
                      (x) => (
                        <option key={x}>{x}</option>
                      ),
                    )}
                  </select>
                </Field>
              </div>
              <Field n="分类">
                <input
                  value={d.category}
                  onChange={(e) => set("category", e.target.value)}
                />
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
                  <Repeat
                    title="路线"
                    items={d.routes}
                    keys={[
                      "name",
                      "image",
                      "duration",
                      "tag",
                      "description",
                      "stops",
                    ]}
                    labels={[
                      "路线名称",
                      "图片地址",
                      "时长",
                      "标签",
                      "描述",
                      "途经地点",
                    ]}
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
