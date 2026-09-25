"use client";

import { useEffect, useMemo, useState } from "react";

type ProductType = "stay" | "service" | "route" | "package";
type ProductOption = {
  key: string;
  type: ProductType;
  label: string;
  subtitle: string;
};
type ShareRecord = {
  code: string;
  status: "draft" | "shared" | "viewed" | "confirmed" | "expired";
  productType: ProductType;
  productId: string;
  title: string;
  subtitle: string;
  image: string;
  payload: SharePayload;
  createdAt: string;
  viewedAt: string;
};
type SharePayload = {
  customerName?: string;
  startDate?: string;
  endDate?: string;
  useDate?: string;
  people?: string;
  quoteAmount?: string;
  quoteUnit?: string;
  quoteCurrency?: string;
  validUntil?: string;
  note?: string;
  showQuote?: boolean;
  showDates?: boolean;
  showDetails?: boolean;
};

const statusLabels: Record<ShareRecord["status"], string> = {
  draft: "草稿",
  shared: "已分享",
  viewed: "已查看",
  confirmed: "已确认",
  expired: "已失效",
};

const typeLabels: Record<ProductType, string> = {
  stay: "住宿",
  service: "服务",
  route: "路线",
  package: "套餐",
};

const emptyPayload: SharePayload = {
  customerName: "",
  startDate: "",
  endDate: "",
  useDate: "",
  people: "1",
  quoteAmount: "",
  quoteUnit: "晚",
  quoteCurrency: "RM",
  validUntil: "",
  note: "",
  showQuote: true,
  showDates: true,
  showDetails: true,
};

export default function CustomerSharesAdminPage() {
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productType, setProductType] = useState<ProductType>("stay");
  const [productId, setProductId] = useState("");
  const [payload, setPayload] = useState<SharePayload>(emptyPayload);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const shownProducts = useMemo(() => products.filter((item) => item.type === productType), [products, productType]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/customer-shares", { cache: "no-store" }).then(readJson),
      fetch("/api/admin/properties", { cache: "no-store" }).then(readJson),
      fetch("/api/admin/service-items", { cache: "no-store" }).then(readJson),
      fetch("/api/admin/packages", { cache: "no-store" }).then(readJson),
    ]).then(([shareData, propertyData, serviceData, packageData]) => {
      setShares(Array.isArray(shareData) ? shareData : []);
      const stayOptions = (Array.isArray(propertyData) ? propertyData : []).filter((item: any) => item.status === "published").map((item: any) => ({
        type: "stay" as const,
        key: item.slug,
        label: item.nameZh,
        subtitle: [item.city, item.areaZh || item.spaceConfig?.locationDisplayZh].filter(Boolean).join(" · "),
      }));
      const serviceOptions = (Array.isArray(serviceData) ? serviceData : []).filter((item: any) => item.status === "published").flatMap((item: any) => {
        const base = [{
          type: "service" as const,
          key: item.slug,
          label: item.nameZh,
          subtitle: [item.city, item.subtitleZh].filter(Boolean).join(" · "),
        }];
        const routes = (item.routes || []).filter((route: any) => route.visible !== false).map((route: any, index: number) => ({
          type: "route" as const,
          key: `${item.slug}:${index}`,
          label: route.nameZh || route.name || `${item.nameZh}路线 ${index + 1}`,
          subtitle: [item.nameZh, route.duration].filter(Boolean).join(" · "),
        }));
        return [...base, ...routes];
      });
      const packageOptions = (Array.isArray(packageData) ? packageData : []).filter((item: any) => item.status === "published").map((item: any) => ({
        type: "package" as const,
        key: item.slug,
        label: item.nameZh,
        subtitle: [`${item.days}天${item.nights}晚`, item.cityComboZh].filter(Boolean).join(" · "),
      }));
      const nextProducts = [...stayOptions, ...serviceOptions, ...packageOptions];
      setProducts(nextProducts);
      setProductId(nextProducts.find((item) => item.type === "stay")?.key || nextProducts[0]?.key || "");
    });
  }, []);

  useEffect(() => {
    const first = shownProducts[0]?.key || "";
    if (!shownProducts.some((item) => item.key === productId)) setProductId(first);
    setPayload((current) => ({ ...current, quoteUnit: productType === "stay" ? "晚" : "次" }));
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

  function setField<K extends keyof SharePayload>(key: K, value: SharePayload[K]) {
    setPayload((current) => ({ ...current, [key]: value }));
  }

  async function createShare(status: "draft" | "shared" = "shared") {
    if (!productId) return setMessage("请先选择要分享的内容。");
    setBusy(status === "draft" ? "保存草稿中..." : "生成分享中...");
    setMessage("");
    const response = await fetch("/api/admin/customer-shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productType, productId, payload, status }),
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setMessage(data.error || "创建失败。");
    setShares((current) => [data, ...current]);
    setMessage("已生成客户分享。");
    await navigator.clipboard?.writeText(`${location.origin}/share/${data.code}`).catch(() => {});
  }

  async function copyLink(code: string) {
    await navigator.clipboard?.writeText(`${location.origin}/share/${code}`);
    setMessage("客户链接已复制。");
  }

  function reuse(item: ShareRecord) {
    setProductType(item.productType);
    setProductId(item.productId);
    setPayload({ ...emptyPayload, ...item.payload });
    scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateStatus(item: ShareRecord, status: ShareRecord["status"]) {
    const response = await fetch(`/api/admin/customer-shares/${item.code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return;
    const updated = await response.json();
    setShares((current) => current.map((share) => (share.code === item.code ? updated : share)));
  }

  return (
    <div className="customer-share-admin">
      <div className="admin-head">
        <div>
          <p>私域销售工具</p>
          <h1>客户分享</h1>
          <span>找到内容，填写客户日期、人数和报价，生成可直接发微信/WhatsApp 的链接、分享卡和长图。</span>
        </div>
        <a className="admin-secondary" href="/admin">返回工作台</a>
      </div>

      {message && <div className="admin-inline-message">{message}</div>}

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
            <span>分享内容</span>
            <select value={productId} onChange={(event) => setProductId(event.target.value)}>
              {shownProducts.map((item) => (
                <option value={item.key} key={item.key}>
                  {item.label} {item.subtitle ? `｜${item.subtitle}` : ""}
                </option>
              ))}
            </select>
          </label>
          <Field label="客户称呼" value={payload.customerName || ""} onChange={(value) => setField("customerName", value)} />
          {productType === "stay" ? (
            <>
              <Field label="入住日期" type="date" value={payload.startDate || ""} onChange={(value) => setField("startDate", value)} />
              <Field label="退房日期" type="date" value={payload.endDate || ""} onChange={(value) => setField("endDate", value)} />
            </>
          ) : (
            <Field label="使用日期" type="date" value={payload.useDate || ""} onChange={(value) => setField("useDate", value)} />
          )}
          <Field label="人数" type="number" value={payload.people || ""} onChange={(value) => setField("people", value)} />
          <Field label="客户报价" type="number" value={payload.quoteAmount || ""} onChange={(value) => setField("quoteAmount", value)} />
          <Field label="报价单位" value={payload.quoteUnit || ""} onChange={(value) => setField("quoteUnit", value)} />
          <Field label="报价有效期" type="date" value={payload.validUntil || ""} onChange={(value) => setField("validUntil", value)} />
          <label className="wide">
            <span>销售备注</span>
            <textarea rows={3} value={payload.note || ""} onChange={(event) => setField("note", event.target.value)} placeholder="例如：这个房型符合您的预算，塔景也比较好。" />
          </label>
          <div className="share-option-row wide">
            <label><input type="checkbox" checked={payload.showQuote !== false} onChange={(event) => setField("showQuote", event.target.checked)} /> 显示客户报价</label>
            <label><input type="checkbox" checked={payload.showDates !== false} onChange={(event) => setField("showDates", event.target.checked)} /> 显示日期</label>
            <label><input type="checkbox" checked={payload.showDetails !== false} onChange={(event) => setField("showDetails", event.target.checked)} /> 显示详情</label>
          </div>
        </div>
        <div className="share-builder-actions">
          <button type="button" onClick={() => createShare("draft")} disabled={Boolean(busy)}>保存草稿</button>
          <button className="admin-primary" type="button" onClick={() => createShare("shared")} disabled={Boolean(busy)}>{busy || "复制客户链接"}</button>
        </div>
      </section>

      <section className="customer-share-list">
        <div className="customer-share-list-head">
          <h2>最近分享</h2>
          <span>{shares.length} 条记录</span>
        </div>
        {shares.map((item) => (
          <article key={item.code}>
            {item.image ? <img src={item.image} alt="" /> : <span className="share-thumb-empty">MAD</span>}
            <div>
              <small>{typeLabels[item.productType]} · {item.payload.customerName || "未填写客户"} · {item.createdAt?.slice(0, 16).replace("T", " ")}</small>
              <h3>{item.title}</h3>
              <p>{[item.subtitle, item.payload.startDate && item.payload.endDate ? `${item.payload.startDate} - ${item.payload.endDate}` : item.payload.useDate, item.payload.people ? `${item.payload.people}人` : "", item.payload.quoteAmount ? `RM ${item.payload.quoteAmount}/${item.payload.quoteUnit || "次"}` : ""].filter(Boolean).join(" · ")}</p>
            </div>
            <b className={`share-status ${item.status}`}>{statusLabels[item.status]}</b>
            <div className="share-row-actions">
              <button onClick={() => copyLink(item.code)}>复制链接</button>
              <a href={`/share/${item.code}`} target="_blank">查看</a>
              <a href={`/share/${item.code}/card`} target="_blank">分享卡</a>
              <a href={`/share/${item.code}/long-image`} target="_blank">长图</a>
              <button onClick={() => reuse(item)}>复制一个新的</button>
              <select value={item.status} onChange={(event) => updateStatus(item, event.target.value as ShareRecord["status"])}>
                {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
