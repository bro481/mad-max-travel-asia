"use client";

import { useEffect, useMemo, useState } from "react";

type ProductType = "stay" | "service" | "route" | "package";
type Stage = "first" | "quoted" | "comparing" | "booking";
type Tone = "normal" | "shorter" | "warmer";
type ProductOption = { key: string; type: ProductType; label: string; subtitle: string; image?: string };
type Generated = { text: string; url: string; content: { title: string; subtitle: string; image: string } };

const typeLabels: Record<ProductType, string> = { stay: "住宿 / 房型", service: "包车 / 接送 / 服务", route: "路线", package: "套餐" };
const stageLabels: Record<Stage, string> = { first: "第一次推荐", quoted: "已经问过价格", comparing: "正在比较", booking: "准备预订" };
const concernMap: Record<ProductType, string[]> = {
  stay: ["预算", "景观", "位置", "泳池", "空间", "交通", "亲子", "方便", "安静"],
  service: ["预算", "中文沟通", "酒店接送", "方便", "行程轻松", "人数", "行李", "时间"],
  route: ["预算", "中文沟通", "行程轻松", "景点", "亲子", "拍照", "时间", "交通"],
  package: ["预算", "住宿", "交通", "行程轻松", "亲子", "时间", "城市", "方便"],
};

export default function CustomerSharesAdminPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productType, setProductType] = useState<ProductType>("stay");
  const [productId, setProductId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useDate, setUseDate] = useState("");
  const [people, setPeople] = useState("1人");
  const [quoteText, setQuoteText] = useState("");
  const [stage, setStage] = useState<Stage>("first");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const shownProducts = useMemo(() => products.filter((item) => item.type === productType), [products, productType]);
  const selected = shownProducts.find((item) => item.key === productId);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/properties", { cache: "no-store" }).then(readJson),
      fetch("/api/admin/service-items", { cache: "no-store" }).then(readJson),
      fetch("/api/admin/packages", { cache: "no-store" }).then(readJson),
    ]).then(([propertyData, serviceData, packageData]) => {
      const stayOptions = (Array.isArray(propertyData) ? propertyData : []).filter((item: any) => item.status === "published").map((item: any) => ({
        type: "stay" as const,
        key: item.slug,
        label: item.nameZh,
        subtitle: [item.city, item.areaZh || item.spaceConfig?.locationDisplayZh].filter(Boolean).join(" · "),
        image: item.images?.[0],
      }));
      const serviceOptions = (Array.isArray(serviceData) ? serviceData : []).filter((item: any) => item.status === "published").flatMap((item: any) => {
        const base = [{
          type: "service" as const,
          key: item.slug,
          label: item.nameZh,
          subtitle: [item.city, item.subtitleZh].filter(Boolean).join(" · "),
          image: item.coverImage || item.images?.[0],
        }];
        const routes = (item.routes || []).filter((route: any) => route.visible !== false).map((route: any, index: number) => ({
          type: "route" as const,
          key: `${item.slug}:${index}`,
          label: route.nameZh || route.name || `${item.nameZh}路线 ${index + 1}`,
          subtitle: [item.nameZh, route.duration].filter(Boolean).join(" · "),
          image: route.coverImage || route.image || route.nodes?.find((node: any) => node.image)?.image || item.coverImage || item.images?.[0],
        }));
        return [...base, ...routes];
      });
      const packageOptions = (Array.isArray(packageData) ? packageData : []).filter((item: any) => item.status === "published").map((item: any) => ({
        type: "package" as const,
        key: item.slug,
        label: item.nameZh,
        subtitle: [`${item.days}天${item.nights}晚`, item.cityComboZh].filter(Boolean).join(" · "),
        image: item.coverImage || item.galleryImages?.[0],
      }));
      const nextProducts = [...stayOptions, ...serviceOptions, ...packageOptions];
      setProducts(nextProducts);
      setProductId(nextProducts.find((item) => item.type === "stay")?.key || nextProducts[0]?.key || "");
    });
  }, []);

  useEffect(() => {
    const first = shownProducts[0]?.key || "";
    if (!shownProducts.some((item) => item.key === productId)) setProductId(first);
    setConcerns([]);
    setGenerated(null);
  }, [productType, shownProducts, productId]);

  async function readJson(response: Response) {
    if (response.status === 401) {
      location.href = "/admin/login?return_to=%2Fadmin%2Fcustomer-shares";
      return [];
    }
    if (!response.ok) return [];
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  }

  function toggleConcern(value: string) {
    setConcerns((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function generate(tone: Tone = "normal") {
    if (!productId) return setMessage("请先选择要推荐给客户的内容。");
    setBusy(tone === "shorter" ? "正在精简..." : tone === "warmer" ? "正在调整语气..." : "正在生成...");
    setMessage("");
    const response = await fetch("/api/admin/customer-shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productType, productId, customerName, startDate, endDate, useDate, people, quoteText, concerns, stage, context, tone }),
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setMessage(data.error || "生成失败。");
    setGenerated(data);
    setMessage("已生成，可以直接复制发送给客户。");
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard?.writeText(value);
    setMessage(`${label}已复制。`);
  }

  const fullText = generated ? `${generated.text}\n\n${generated.url}` : "";

  return (
    <div className="customer-share-admin send-assistant-admin">
      <div className="admin-head">
        <div>
          <p>私域销售工具</p>
          <h1>客户发送助手</h1>
          <span>选择一个真实内容，补充客户上下文，生成可直接发微信的自然介绍文字和详情页链接。</span>
        </div>
        <a className="admin-secondary" href="/admin">返回工作台</a>
      </div>

      {message && <div className="admin-inline-message">{message}</div>}

      <div className="send-assistant-layout">
        <section className="customer-share-builder">
          <div className="share-type-tabs">
            {(Object.keys(typeLabels) as ProductType[]).map((type) => (
              <button type="button" className={productType === type ? "active" : ""} onClick={() => setProductType(type)} key={type}>
                {typeLabels[type]}
              </button>
            ))}
          </div>
          <div className="share-builder-grid">
            <label className="wide">
              <span>要发送给客户的内容</span>
              <select value={productId} onChange={(event) => setProductId(event.target.value)}>
                {shownProducts.map((item) => <option value={item.key} key={item.key}>{item.label}{item.subtitle ? `｜${item.subtitle}` : ""}</option>)}
              </select>
            </label>
            {selected && <div className="send-product-preview wide">{selected.image ? <img src={selected.image} alt="" /> : <span>MAD</span>}<div><b>{selected.label}</b><small>{selected.subtitle}</small></div></div>}
            <Field label="客户称呼（选填）" value={customerName} onChange={setCustomerName} placeholder="王女士" />
            {productType === "stay" ? (
              <>
                <Field label="入住日期" type="date" value={startDate} onChange={setStartDate} />
                <Field label="退房日期" type="date" value={endDate} onChange={setEndDate} />
              </>
            ) : <Field label="使用日期" type="date" value={useDate} onChange={setUseDate} />}
            <Field label="人数" value={people} onChange={setPeople} placeholder="1人 / 2成人1儿童" />
            <Field label="客户报价（选填）" value={quoteText} onChange={setQuoteText} placeholder="RM500 / 晚" />
            <label>
              <span>当前沟通阶段</span>
              <select value={stage} onChange={(event) => setStage(event.target.value as Stage)}>
                {Object.entries(stageLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </label>
            <div className="concern-picker wide">
              <span>客户比较在意什么（多选）</span>
              <div>{concernMap[productType].map((item) => <button className={concerns.includes(item) ? "active" : ""} type="button" onClick={() => toggleConcern(item)} key={item}>{item}</button>)}</div>
            </div>
            <label className="wide">
              <span>补充情况（选填）</span>
              <textarea rows={3} value={context} onChange={(event) => setContext(event.target.value)} placeholder="例如：客户一个人旅行，希望安静一些，预算500左右。" />
            </label>
          </div>
          <div className="share-builder-actions">
            <button className="admin-primary" type="button" onClick={() => generate("normal")} disabled={Boolean(busy)}>{busy || "生成客户介绍文字"}</button>
          </div>
        </section>

        <section className="send-result-panel">
          <div className="customer-share-list-head">
            <h2>客户介绍文字</h2>
            {generated && <button type="button" onClick={() => generate("normal")}>重新生成</button>}
          </div>
          <textarea value={generated?.text || ""} onChange={(event) => setGenerated((current) => current ? { ...current, text: event.target.value } : current)} placeholder="生成后这里会出现可直接发给客户的微信介绍文字。" rows={15} />
          <div className="share-row-actions">
            <button type="button" onClick={() => generate("shorter")} disabled={!generated || Boolean(busy)}>精简一点</button>
            <button type="button" onClick={() => generate("warmer")} disabled={!generated || Boolean(busy)}>更亲切一点</button>
            <button type="button" onClick={() => generated && copy(generated.text, "文字")} disabled={!generated}>复制文字</button>
          </div>
          <div className="send-link-box">
            <b>详情页链接</b>
            <input readOnly value={generated?.url || ""} placeholder="生成后自动读取原始公开详情页链接" />
            <button type="button" onClick={() => generated && copy(generated.url, "链接")} disabled={!generated}>复制链接</button>
          </div>
          <button className="admin-primary copy-all-button" type="button" onClick={() => copy(fullText, "文字和链接")} disabled={!generated}>复制全部</button>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
