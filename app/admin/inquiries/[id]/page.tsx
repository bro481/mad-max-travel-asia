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
  return (
    <>
      <div className="lead-top">
        <div>
          <Link href="/admin/inquiries">← 返回咨询列表</Link>
          <h1>{data.name}</h1>
          <span>
            咨询 #{data.id} · 来自{data.source}
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
        </aside>
        <main className="lead-card lead-demand">
          <h2>客户需求</h2>
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
          <Field label="原始留言／需求备注">
            <textarea
              rows={6}
              value={data.message}
              onChange={(e) => update("message", e.target.value)}
            />
          </Field>
          <Section title="报价记录">
            <Lines
              items={data.quotes as any[]}
              onChange={(x) => update("quotes", x)}
              showCost={false}
            />
            <div className="lead-total">
              报价总额 <b>RM {quoteTotal.toFixed(2)}</b>
            </div>
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
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option>微信</option>
              <option>WhatsApp</option>
              <option>电话</option>
              <option>邮件</option>
            </select>
            <textarea
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              placeholder="记录本次沟通和客户反馈"
              rows={4}
            />
            <button
              onClick={() => {
                if (!followup.trim()) return;
                const next = {
                  ...data,
                  followups: [
                    {
                      channel,
                      content: followup,
                      at: new Date().toISOString(),
                    },
                    ...data.followups,
                  ],
                };
                setData(next);
                setFollowup("");
                save(next);
              }}
            >
              ＋ 添加跟进记录
            </button>
          </div>
          <div className="follow-timeline">
            {data.followups.map((x: any, i) => (
              <div key={i}>
                <i />
                <small>
                  {new Date(x.at).toLocaleString("zh-CN")} · {x.channel}
                </small>
                <p>{x.content}</p>
              </div>
            ))}
            <div>
              <i />
              <small>{new Date(data.createdAt).toLocaleString("zh-CN")}</small>
              <p>收到网站咨询</p>
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
