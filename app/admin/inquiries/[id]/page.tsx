"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { InquiryRecord } from "../../../../db/inquiries";
const emptyLine = { item: "", quantity: 1, price: 0, cost: 0 };
export default function InquiryDetail() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<InquiryRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [followup, setFollowup] = useState("");
  const [channel, setChannel] = useState("微信");
  const [followupResult, setFollowupResult] = useState("已联系");
  useEffect(() => {
    fetch(`/api/admin/inquiries/${params.id}`)
      .then((r) => r.json())
      .then(setData);
  }, [params.id]);
  const save = async (next = data) => {
    if (!next) return;
    setNotice("保存中…");
    const r = await fetch(`/api/admin/inquiries/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setNotice(r.ok ? "✓ 已保存" : "保存失败，请重试");
  };
  const update = (key: keyof InquiryRecord, value: unknown) =>
    setData((x) => (x ? { ...x, [key]: value } : x));
  const quoteTotal = useMemo(
    () =>
      data?.quotes.reduce(
        (n: any, x: any) => n + Number(x.quantity || 0) * Number(x.price || 0),
        0,
      ) || 0,
    [data],
  );
  const quoteVersions = useMemo(() => data?.quoteVersions || [], [data]);
  const revenue = useMemo(
    () =>
      data?.financials.reduce(
        (n: any, x: any) => n + Number(x.price || 0),
        0,
      ) || 0,
    [data],
  );
  const cost = useMemo(
    () =>
      data?.financials.reduce((n: any, x: any) => n + Number(x.cost || 0), 0) ||
      0,
    [data],
  );
  if (!data) return <div className="admin-loading">正在打开客户档案…</div>;
  const toggle = (key: "services" | "tags", value: string) =>
    update(
      key,
      data[key].includes(value)
        ? data[key].filter((x) => x !== value)
        : [...data[key], value],
    );
  const primaryService = data.services[0] || "待确认服务";
  const missingFields = getMissingFields(data);
  const saveQuoteVersion = () => {
    const nextVersion = {
      version: `V${quoteVersions.length + 1}`,
      total: quoteTotal,
      items: data.quotes,
      at: new Date().toISOString(),
    };
    const next = {
      ...data,
      status: data.status === "待回复" || data.status === "跟进中" ? "已报价" : data.status,
      quoteVersions: [nextVersion, ...quoteVersions],
      followups: [
        {
          channel: "系统",
          result: "已发送报价",
          content: `保存报价 ${nextVersion.version}，总额 RM ${quoteTotal.toFixed(2)}`,
          at: new Date().toISOString(),
          owner: data.owner || "未分配",
        },
        ...data.followups,
      ],
    };
    setData(next);
    save(next);
  };
  return (
    <>
      <div className="lead-top">
        <div>
          <Link href="/admin/inquiries">← 返回咨询列表</Link>
          <h1>{data.name}</h1>
          <span>
            咨询 #{data.id} · 推荐来源：{data.referrerName || "自然咨询"} · 负责人：{data.owner || "未分配"}
          </span>
        </div>
        <div>
          <select
            value={data.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {["待回复", "沟通中", "已报价", "待跟进", "已成交", "已关闭"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
          <button className="admin-primary" onClick={() => save()}>
            保存客户档案
          </button>
        </div>
      </div>
      {notice && <p className="lead-notice">{notice}</p>}
      <div className="lead-layout">
        <aside className="lead-card">
          <h2>客户信息</h2>
          <Field label="姓名">
            <input
              value={data.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <Field label="微信 / WhatsApp / 电话">
            <input
              value={data.contact}
              onChange={(e) => update("contact", e.target.value)}
            />
          </Field>
          <Field label="销售负责人">
            <input
              value={data.owner}
              onChange={(e) => update("owner", e.target.value)}
              placeholder="例如 Amy"
            />
          </Field>
          <div className="field-row">
            <Field label="国家／地区">
              <input
                value={data.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </Field>
            <Field label="沟通语言">
              <select
                value={data.language}
                onChange={(e) => update("language", e.target.value)}
              >
                <option>中文</option>
                <option>English</option>
                <option>马来语</option>
              </select>
            </Field>
          </div>
          <h3>客户标签</h3>
          <div className="lead-checks">
            {[
              "家庭出行",
              "情侣",
              "朋友同行",
              "高意向",
              "价格敏感",
              "老客户",
              "需要中文服务",
            ].map((x) => (
              <button
                className={data.tags.includes(x) ? "active" : ""}
                onClick={() => toggle("tags", x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <h3>来源归因</h3>
          <div className="lead-source-box">
            <SourceLine label="推荐人">
              {data.referrerId ? (
                <Link href={`/admin/referrers/${data.referrerId}`}>
                  {data.referrerName || "司机来源"} →
                </Link>
              ) : (
                <b>自然咨询</b>
              )}
            </SourceLine>
            <SourceLine label="推广码">
              <b>{data.referrerId || "无"}</b>
              {data.referrerId && <small>{data.referrerType || "司机推广"}</small>}
            </SourceLine>
            <SourceLine label="咨询渠道">
              <select
                value={data.inquiryChannel}
                onChange={(e) => update("inquiryChannel", e.target.value)}
              >
                <option>官网</option>
                <option>微信</option>
                <option>WhatsApp</option>
                <option>电话</option>
                <option>人工录入</option>
              </select>
            </SourceLine>
            <SourceLine label="首次进入">
              <b>
                {data.referrerFirstAt
                  ? new Date(data.referrerFirstAt).toLocaleString("zh-CN")
                  : "未记录"}
              </b>
            </SourceLine>
            <SourceLine label="提交咨询">
              <b>{new Date(data.createdAt).toLocaleString("zh-CN")}</b>
            </SourceLine>
            {data.referrerFirstUrl && (
              <details>
                <summary>查看来源详情</summary>
                <code>{data.referrerFirstUrl}</code>
              </details>
            )}
          </div>
        </aside>
        <main className="lead-card lead-demand">
          <h2>客户需求</h2>
          <div className="demand-overview">
            <div>
              <small>需求概览</small>
              <b>{primaryService}</b>
              <p>
                {data.people || data.children
                  ? `${data.people || 0} 成人${data.children ? ` · ${data.children} 儿童` : ""}`
                  : "人数待确认"}
                {" · "}
                {data.travelTime || "出行时间待确认"}
                {" · "}
                {data.destinations.join("、") || "目的地待确认"}
              </p>
            </div>
            <div>
              <small>还需确认 {missingFields.length} 项</small>
              <div>
                {missingFields.length
                  ? missingFields.map((item) => <span key={item}>{item}</span>)
                  : <span>信息已基本完整</span>}
              </div>
            </div>
          </div>
          <div className="field-row">
            <Field label="目的地">
              <input
                value={data.destinations.join("、")}
                onChange={(e) =>
                  update(
                    "destinations",
                    e.target.value.split(/[、,，]/).filter(Boolean),
                  )
                }
              />
            </Field>
            <Field label="出行日期／时间">
              <input
                value={data.travelTime}
                onChange={(e) => update("travelTime", e.target.value)}
              />
            </Field>
          </div>
          <div className="field-row three">
            <Field label="成人">
              <input
                type="number"
                value={data.people}
                onChange={(e) => update("people", Number(e.target.value))}
              />
            </Field>
            <Field label="儿童">
              <input
                type="number"
                value={data.children}
                onChange={(e) => update("children", Number(e.target.value))}
              />
            </Field>
            <Field label="房间">
              <input
                type="number"
                value={data.rooms}
                onChange={(e) => update("rooms", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="预算">
            <input
              value={data.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="例如 RM 3,000"
            />
          </Field>
          <h3>需要的服务</h3>
          <div className="lead-checks">
            {[
              "住宿",
              "机场接送",
              "包车",
              "一日游",
              "潜水／跳岛",
              "门票",
              "其他",
            ].map((x) => (
              <button
                className={data.services.includes(x) ? "active" : ""}
                onClick={() => toggle("services", x)}
                key={x}
              >
                {x}
              </button>
            ))}
          </div>
          <details className="original-message" open={false}>
            <summary>原始咨询内容</summary>
            <Field label="原始留言／需求备注">
              <textarea
                rows={6}
                value={data.message}
                onChange={(e) => update("message", e.target.value)}
              />
            </Field>
          </details>
          <Section title="报价记录">
            <Lines
              items={data.quotes as any[]}
              onChange={(x) => update("quotes", x)}
              showCost={false}
            />
            <div className="lead-total">
              报价总额 <b>RM {quoteTotal.toFixed(2)}</b>
            </div>
            <div className="quote-version-actions">
              <button onClick={saveQuoteVersion}>保存为报价版本</button>
              <span>客户改需求时，保存新版本，不覆盖旧报价。</span>
            </div>
            {!!quoteVersions.length && (
              <div className="quote-version-list">
                {quoteVersions.map((quote: any, index) => (
                  <div key={`${quote.version}-${quote.at || index}`}>
                    <b>{quote.version || `V${quoteVersions.length - index}`}</b>
                    <span>RM {Number(quote.total || 0).toFixed(2)}</span>
                    <small>
                      {quote.at ? new Date(quote.at).toLocaleString("zh-CN") : "时间未记录"}
                      {index === 0 ? " · 当前报价" : ""}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </Section>
          {data.status === "已成交" && (
            <Section title="成交与利润">
              <div className="field-row">
                <Field label="成交日期">
                  <input
                    type="date"
                    value={data.dealDate}
                    onChange={(e) => update("dealDate", e.target.value)}
                  />
                </Field>
                <Field label="收款状态">
                  <select
                    value={data.paymentStatus}
                    onChange={(e) => update("paymentStatus", e.target.value)}
                  >
                    <option>未收款</option>
                    <option>部分收款</option>
                    <option>已收款</option>
                  </select>
                </Field>
              </div>
              <Lines
                items={data.financials as any[]}
                onChange={(x) => update("financials", x)}
                showCost
              />
              <div className="profit-summary">
                <span>
                  总收入 <b>RM {revenue.toFixed(2)}</b>
                </span>
                <span>
                  总成本 <b>RM {cost.toFixed(2)}</b>
                </span>
                <span>
                  预计利润 <b>RM {(revenue - cost).toFixed(2)}</b>
                </span>
              </div>
            </Section>
          )}
        </main>
        <aside className="lead-card lead-follow">
          <h2>销售跟进</h2>
          <Field label="下次跟进时间">
            <input
              type="datetime-local"
              value={data.nextFollowUp}
              onChange={(e) => update("nextFollowUp", e.target.value)}
            />
          </Field>
          <div className="follow-compose">
            <label>
              <span>本次跟进结果</span>
              <select
                value={followupResult}
                onChange={(e) => setFollowupResult(e.target.value)}
              >
                <option>已联系</option>
                <option>客户未回复</option>
                <option>已补充需求</option>
                <option>已发送报价</option>
                <option>等待客户确认</option>
                <option>客户要求修改</option>
                <option>暂缓</option>
                <option>已成交</option>
                <option>无效客户</option>
              </select>
            </label>
            <label>
              <span>沟通方式</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option>微信</option>
              <option>WhatsApp</option>
              <option>电话</option>
              <option>邮件</option>
              <option>其他</option>
            </select>
            </label>
            <textarea
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              placeholder="例如：已给客户发送机场接送报价 RM120，客户表示需要先确认航班。"
              rows={4}
            />
            <button
              onClick={() => {
                if (!followup.trim()) return;
                const nextStatus =
                  followupResult === "已发送报价"
                    ? "已报价"
                    : followupResult === "已成交"
                      ? "已成交"
                      : followupResult === "无效客户"
                        ? "已关闭"
                        : data.status === "待回复"
                          ? "跟进中"
                          : data.status;
                const next = {
                  ...data,
                  status: nextStatus,
                  followups: [
                    {
                      channel,
                      result: followupResult,
                      content: followup,
                      at: new Date().toISOString(),
                      owner: data.owner || "未分配",
                    },
                    ...data.followups,
                  ],
                };
                setData(next);
                setFollowup("");
                save(next);
              }}
            >
              ＋ 保存跟进记录
            </button>
          </div>
          <div className="follow-timeline">
            {data.followups.map((x: any, i) => (
              <div key={i}>
                <i />
                <small>
                  {new Date(x.at).toLocaleString("zh-CN")} · {x.owner || data.owner || "未分配"} · {x.channel}
                </small>
                {x.result && <b>{x.result}</b>}
                <p>{x.content}</p>
              </div>
            ))}
            <div>
              <i />
              <small>{new Date(data.createdAt).toLocaleString("zh-CN")}</small>
              <b>收到网站咨询</b>
              <p>
                来源：{data.referrerId ? `${data.referrerName || "司机来源"} · ${data.referrerId}` : "官网自然访问"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
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
    <label className="lead-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lead-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function SourceLine({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="source-line">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}
function getMissingFields(data: InquiryRecord) {
  const missing = [];
  if (!data.travelTime || /待补充|待确认|稍后/.test(data.travelTime)) missing.push("出行日期");
  if (!data.destinations.length) missing.push("目的地");
  if (!data.people && !data.children) missing.push("人数");
  if (!data.contact || /待添加|未留|待补充/.test(data.contact)) missing.push("联系方式");
  if (data.services.some((item) => /接送|机场/.test(item)) && /航班.*稍后|航班.*待补|航班：稍后|航班：待补/.test(data.message)) missing.push("航班号");
  if (/酒店|接送地点|住宿地点/.test(data.message) && /待补充|待确认/.test(data.message)) missing.push("酒店/接送地点");
  if (!data.budget && data.services.some((item) => /住宿|套餐|包车/.test(item))) missing.push("预算");
  return [...new Set(missing)].slice(0, 6);
}
function Lines({
  items,
  onChange,
  showCost,
}: {
  items: any[];
  onChange: (x: any[]) => void;
  showCost: boolean;
}) {
  return (
    <div className="quote-lines">
      <div className="quote-head">
        <span>项目</span>
        {!showCost && <span>数量</span>}
        <span>{showCost ? "收入" : "单价"}</span>
        {showCost && <span>成本</span>}
        <span />
      </div>
      {items.map((x, i) => (
        <div key={i}>
          <input
            value={x.item || ""}
            onChange={(e) =>
              onChange(
                items.map((y, n) =>
                  n === i ? { ...y, item: e.target.value } : y,
                ),
              )
            }
          />
          {!showCost && (
            <input
              type="number"
              value={x.quantity || 0}
              onChange={(e) =>
                onChange(
                  items.map((y, n) =>
                    n === i ? { ...y, quantity: Number(e.target.value) } : y,
                  ),
                )
              }
            />
          )}
          <input
            type="number"
            value={x.price || 0}
            onChange={(e) =>
              onChange(
                items.map((y, n) =>
                  n === i ? { ...y, price: Number(e.target.value) } : y,
                ),
              )
            }
          />
          {showCost && (
            <input
              type="number"
              value={x.cost || 0}
              onChange={(e) =>
                onChange(
                  items.map((y, n) =>
                    n === i ? { ...y, cost: Number(e.target.value) } : y,
                  ),
                )
              }
            />
          )}
          <button onClick={() => onChange(items.filter((_, n) => n !== i))}>
            ×
          </button>
        </div>
      ))}
      <button
        className="add-line"
        onClick={() => onChange([...items, { ...emptyLine }])}
      >
        ＋ 添加项目
      </button>
    </div>
  );
}
