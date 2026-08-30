/* eslint-disable react-hooks/static-components */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import "./inquiry-modal.css";
import { DateInput } from "./date-input";

export type InquiryKind =
  | "accommodation"
  | "airport-transfer"
  | "private-charter"
  | "experience"
  | "gift";

type InquiryModalProps = {
  kind: InquiryKind;
  title?: string;
  maxGuests?: number;
  onClose: () => void;
};

const WECHAT_ID = "MADMAX_STAY";

const meta = {
  accommodation: { eyebrow: "STAY REQUEST", heading: "告诉我你的住宿安排", action: "生成住宿需求", service: "住宿咨询" },
  "airport-transfer": { eyebrow: "TRANSFER REQUEST", heading: "告诉我你的接送安排", action: "生成接送需求", service: "机场接送" },
  "private-charter": { eyebrow: "PRIVATE CAR · 私人包车", heading: "告诉我你的包车安排", action: "生成包车需求", service: "私人包车" },
  experience: { eyebrow: "EXPERIENCE REQUEST", heading: "告诉我你的出行安排", action: "生成出行需求", service: "当地体验" },
  gift: { eyebrow: "MALAYSIA PICKS · 马来西亚好物", heading: "告诉我你想要的好物", action: "整理我的好物需求", service: "马来西亚好物" },
} as const;

async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const area = document.createElement("textarea");
    area.value = text; document.body.appendChild(area); area.select();
    document.execCommand("copy"); area.remove();
  }
}

export function InquiryModal({ kind, title, maxGuests = 14, onClose }: InquiryModalProps) {
  const info = meta[kind];
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logged, setLogged] = useState(false);
  const [form, setForm] = useState({
    direction: "机场 → 酒店", date: "", endDate: "", flight: "", place: "",
    adults: 2, children: 0, luggage: 2, routeMode: title ? "推荐路线" : "自由安排",
    wishes: "", special: "", quantity: 1, location: "还在马来西亚", delivery: "住宿期间领取", city: "",
  });
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setCopied(false); setForm((current) => ({ ...current, [key]: value }));
  };
  const lines = useMemo(() => {
    const head = `【官网咨询｜${title || info.service}】`;
    if (kind === "airport-transfer") return [head, `方向：${form.direction}`, `日期：${form.date || "待补充"}`, `航班：${form.flight || "稍后补充"}`, `接送地点：${form.place || "待补充"}`, `人数：${form.adults} 人`, `行李：${form.luggage} 件`];
    if (kind === "accommodation") return [head, `入住：${form.date || "待补充"}`, `退房：${form.endDate || "待补充"}`, `成人：${form.adults} 人`, `儿童：${form.children} 人`, title ? `正在咨询：${title}` : "", `补充需求：${form.wishes || "无"}`];
    if (kind === "private-charter") return [head, `日期：${form.date || "待补充"}`, `人数：${form.adults} 人`, `出发地点：${form.place || "待补充"}`, title ? `已选择路线：${title}` : `安排方式：${form.routeMode}`, `想去的地方：${form.wishes || "待沟通"}`, `特殊需求：${form.special || "无"}`];
    if (kind === "experience") return [head, title ? `已选择：${title}` : "", `出行日期：${form.date || "待补充"}`, `成人：${form.adults} 人`, `儿童：${form.children} 人`, `住宿地点：${form.place || "待补充"}`, `补充需求：${form.wishes || "无"}`];
    return [head, `商品：${title || "请推荐"} × ${form.quantity}`, `目前：${form.location}`, `获取方式：${form.delivery}`, form.location === "已经回国" ? `所在城市：${form.city || "待补充"}` : "", `备注：${form.wishes || "无"}`];
  }, [form, info.service, kind, title]);
  const requestText = lines.filter(Boolean).join("\n");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setGenerated(true); setCopied(false);
    if (!logged) {
      setLogged(true);
      void fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: "官网访客（未留联系方式）", contact: "待添加微信", services: [title || info.service], travelTime: form.date, message: requestText,
      }) }).catch(() => setLogged(false));
    }
  };
  const Stepper = ({ label, field, max }: { label: string; field: "adults" | "children" | "luggage" | "quantity"; max?: number }) => <div><span>{label}</span><div className="inquiry-stepper"><button type="button" onClick={() => set(field, Math.max(field === "children" || field === "luggage" ? 0 : 1, form[field] - 1))}>−</button><b>{form[field]}</b><button type="button" onClick={() => set(field, Math.min(max || 99, form[field] + 1))}>+</button></div></div>;
  const DateField = ({ label, field, placeholder }: { label: string; field: "date" | "endDate"; placeholder: string }) => {
    const value = form[field];
    return <label className="inquiry-date-field"><span>{label}</span><DateInput value={value} label={label} placeholder={placeholder} onChange={(nextValue) => set(field, nextValue)} /></label>;
  };

  return <div className="inquiry-layer" role="dialog" aria-modal="true" aria-label={info.heading} onMouseDown={(event) => event.stopPropagation()} onClick={onClose}>
    <div className="inquiry-card" onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <button className="inquiry-close" type="button" onClick={onClose} aria-label="关闭">×</button>
      {generated ? <section className="inquiry-result">
        <p className="eyebrow">REQUEST READY</p><h2>需求整理好了</h2>
        <p>{kind === "private-charter" ? "我们会根据当天时间帮你确认具体安排。" : kind === "gift" ? "我们会帮你确认库存、价格和获取方式。" : "我们会根据这些信息帮你确认具体安排。"}</p><pre>{requestText}</pre>
        <div className="inquiry-actions"><button className="primary" onClick={async () => { await copyText(requestText); setCopied(true); }}>{copied ? "需求已复制，请添加微信" : "复制需求并添加微信 →"}</button></div>
        <button className="inquiry-back" onClick={() => setGenerated(false)}>← 返回修改</button>
        <div className="inquiry-wechat"><span>微信号</span><b>{WECHAT_ID}</b><small>添加微信后，把刚刚复制的需求发给我们即可。</small></div>
      </section> : <form onSubmit={submit}>
        <p className="eyebrow">{info.eyebrow}</p><h2>{info.heading}</h2><p>填好后自动整理需求，再添加微信发送给我们。</p>
        {title && <div className="inquiry-selected"><span>{kind === "accommodation" ? "正在咨询" : kind === "private-charter" ? "已选择路线" : kind === "gift" ? "商品" : "已选择"}</span><b>{title}</b></div>}
        {kind === "airport-transfer" && <><label><span>接送方向</span><div className="inquiry-options">{["机场 → 酒店", "酒店 → 机场"].map((x) => <button type="button" className={form.direction === x ? "active" : ""} onClick={() => set("direction", x)} key={x}>{x}</button>)}</div></label><div className="inquiry-grid inquiry-grid-fields"><DateField label="日期" field="date" placeholder="请选择接送日期"/><label><span>航班号（可稍后补）</span><input placeholder="例如 MH123" value={form.flight} onChange={(e) => set("flight", e.target.value)} /></label></div><label><span>接送地点</span><input placeholder="酒店名称 / 地址" value={form.place} onChange={(e) => set("place", e.target.value)} /></label><div className="inquiry-grid inquiry-grid-compact"><Stepper label="人数" field="adults" max={maxGuests}/><Stepper label="行李" field="luggage" /></div></>}
        {kind === "accommodation" && <><div className="inquiry-grid inquiry-grid-fields"><DateField label="入住日期" field="date" placeholder="请选择入住日期"/><DateField label="退房日期" field="endDate" placeholder="请选择退房日期"/></div><div className="inquiry-grid inquiry-grid-compact"><Stepper label="成人" field="adults" max={maxGuests}/><Stepper label="儿童" field="children" /></div></>}
        {kind === "private-charter" && <><div className="inquiry-grid inquiry-grid-fields"><DateField label="日期" field="date" placeholder="请选择包车日期"/><Stepper label="人数" field="adults" /></div><label><span>出发地点</span><input placeholder="酒店 / 民宿名称或区域" value={form.place} onChange={(e) => set("place", e.target.value)} /></label>{!title && <label><span>想怎么玩</span><div className="inquiry-options">{["推荐路线", "自由安排"].map((x) => <button type="button" className={form.routeMode === x ? "active" : ""} onClick={() => set("routeMode", x)} key={x}>{x}</button>)}</div></label>}</>}
        {kind === "experience" && <><DateField label="出行日期" field="date" placeholder="请选择出行日期"/><div className="inquiry-grid inquiry-grid-compact"><Stepper label="成人" field="adults"/><Stepper label="儿童" field="children"/></div><label><span>住宿地点（可选）</span><input value={form.place} onChange={(e) => set("place", e.target.value)} /></label></>}
        {kind === "gift" && <><Stepper label="数量" field="quantity"/><label><span>你现在</span><div className="inquiry-options">{["还在马来西亚", "已经回国"].map((x) => <button type="button" className={form.location === x ? "active" : ""} onClick={() => { set("location", x); set("delivery", x === "还在马来西亚" ? "住宿期间领取" : "邮寄到国内"); }} key={x}>{x}</button>)}</div></label><label><span>获取方式</span><select value={form.delivery} onChange={(e) => set("delivery", e.target.value)}>{form.location === "还在马来西亚" ? <><option>住宿期间领取</option><option>接送/包车时领取</option><option>其他</option></> : <><option>邮寄到国内</option><option>其他方式咨询</option></>}</select></label>{form.location === "已经回国" && <label><span>所在城市（可选）</span><input placeholder="例如：上海" value={form.city} onChange={(e) => set("city", e.target.value)} /></label>}</>}
        {kind !== "airport-transfer" && <label><span>{kind === "private-charter" ? (title ? "还有特别想去的地方吗？（可选）" : "想去的地方（可选）") : "补充需求（可选）"}</span><textarea rows={3} placeholder={kind === "private-charter" ? (title ? "例如：想加双子塔、想去吃榴莲，也可以留空" : "例如：双子塔、黑风洞、茨厂街……") : ""} value={form.wishes} onChange={(e) => set("wishes", e.target.value)} /></label>}
        {kind === "private-charter" && <label><span>特殊需求（可选）</span><textarea rows={2} placeholder="例如：儿童座椅、行动不便、携带大件行李" value={form.special} onChange={(e) => set("special", e.target.value)} /></label>}
        <button className="button inquiry-generate" type="submit">{info.action} →</button><small className="inquiry-next">下一步：复制需求并发送微信咨询</small>
      </form>}
    </div>
  </div>;
}
