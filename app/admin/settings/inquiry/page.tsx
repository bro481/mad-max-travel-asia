"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { defaultInquirySettings, type InquirySettings } from "../../../../db/site-settings";

export default function InquirySettingsPage() {
  const [data, setData] = useState<InquirySettings>(defaultInquirySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { fetch("/api/admin/site-settings?key=inquiry", { cache: "no-store" }).then(async (r) => {
    if (r.status === 401) { location.href = "/admin/login?return_to=%2Fadmin%2Fsettings%2Finquiry"; return defaultInquirySettings; }
    return r.ok ? r.json() : defaultInquirySettings;
  }).then(setData).finally(() => setLoading(false)); }, []);

  const save = async () => {
    setSaving(true); setMessage("");
    try { const r = await fetch("/api/admin/site-settings?key=inquiry", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!r.ok) throw new Error(); setMessage("咨询设置已保存"); }
    catch { setMessage("保存失败，请重试"); } finally { setSaving(false); }
  };
  const uploadQr = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return; const form = new FormData(); form.append("files", file);
    const r = await fetch("/api/admin/uploads", { method: "POST", body: form }); const result = await r.json();
    if (r.ok && result.urls?.[0]) setData({ ...data, contacts: { ...data.contacts, wechatQr: result.urls[0] } });
    event.target.value = "";
  };
  if (loading) return <div className="admin-loading">正在加载咨询设置…</div>;
  const prefix = data.copyRules.sourcePrefix || "官网咨询";

  return <>
    <div className="admin-head about-simple-head"><div><p>设置</p><h1>咨询设置</h1><span>全站咨询共用这一份联系方式和完成页文案</span></div><div className="about-admin-actions">{message && <span>{message}</span>}<button className="admin-primary" disabled={saving} onClick={() => void save()}>{saving ? "保存中…" : "保存设置"}</button></div></div>
    <main className="inquiry-simple-page">
      <SettingSection title="联系方式" text="微信与 WhatsApp 是全站唯一来源">
        <div className="inquiry-contact-grid">
          <div className="inquiry-contact-fields"><h3>微信</h3><Field label="微信号"><input value={data.contacts.wechatId} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, wechatId: e.target.value } })}/></Field><label className="admin-switch"><input type="checkbox" checked={data.contacts.wechatEnabled} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, wechatEnabled: e.target.checked } })}/>启用微信咨询</label></div>
          <div className="inquiry-qr-preview">{data.contacts.wechatQr ? <img src={data.contacts.wechatQr} alt="微信二维码"/> : <span>暂未上传二维码</span>}<label className="admin-button">更换<input hidden type="file" accept="image/*" onChange={uploadQr}/></label></div>
          <div className="inquiry-contact-fields"><h3>WhatsApp</h3><Field label="号码"><input placeholder="+60 XXXXXXXX" value={`${data.contacts.whatsappCountryCode} ${data.contacts.whatsappNumber}`.trim()} onChange={(e) => { const value = e.target.value.trim(); const match = value.match(/^(\+\d{1,3})\s*/); setData({ ...data, contacts: { ...data.contacts, whatsappCountryCode: match?.[1] || data.contacts.whatsappCountryCode, whatsappNumber: value.replace(/^\+\d{1,3}\s*/, "") } }); }}/></Field><label className="admin-switch"><input type="checkbox" checked={data.contacts.whatsappEnabled} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, whatsappEnabled: e.target.checked } })}/>启用 WhatsApp</label></div>
        </div>
      </SettingSection>
      <SettingSection title="咨询完成页" text="控制所有住宿、接送、包车、体验和商品咨询的第二步">
        <div className="inquiry-completion-layout"><div className="about-fields"><Field label="小标题"><input value={data.completion.eyebrow} onChange={(e) => setData({ ...data, completion: { ...data.completion, eyebrow: e.target.value } })}/></Field><Field label="标题"><input value={data.completion.title} onChange={(e) => setData({ ...data, completion: { ...data.completion, title: e.target.value } })}/></Field><Field label="说明"><textarea rows={3} value={data.completion.description} onChange={(e) => setData({ ...data, completion: { ...data.completion, description: e.target.value } })}/></Field><div className="about-fields two"><Field label="主按钮"><input value={data.completion.copyButton} onChange={(e) => setData({ ...data, completion: { ...data.completion, copyButton: e.target.value } })}/></Field><Field label="返回按钮"><input value={data.completion.backButton} onChange={(e) => setData({ ...data, completion: { ...data.completion, backButton: e.target.value } })}/></Field></div><Field label="底部提示"><input value={data.completion.footerHint} onChange={(e) => setData({ ...data, completion: { ...data.completion, footerHint: e.target.value } })}/></Field></div>
          <aside className="inquiry-live-preview"><small>效果预览</small><em>{data.completion.eyebrow}</em><h3>{data.completion.title}</h3><p>{data.completion.description}</p><div className="inquiry-preview-request">【{prefix}｜吉隆坡经典一日游】<br/>日期：10月16日<br/>人数：2人<br/>出发地点：吉隆坡市区</div><button>{data.completion.copyButton}</button><span>微信号　<b>{data.contacts.wechatId || "未设置"}</b></span><small>{data.completion.footerHint}</small></aside>
        </div>
      </SettingSection>
      <SettingSection title="咨询文案" text="系统自动使用同一个来源名称生成所有咨询标题">
        <div className="inquiry-copy-setting"><Field label="来源名称"><input value={data.copyRules.sourcePrefix} onChange={(e) => setData({ ...data, copyRules: { sourcePrefix: e.target.value } })}/></Field><div><small>生成示例</small><code>【{prefix}｜吉隆坡经典一日游】</code></div></div>
      </SettingSection>
    </main>
  </>;
}

function SettingSection({ title, text, children }: { title: string; text: string; children: React.ReactNode }) { return <section className="inquiry-simple-section"><header><h2>{title}</h2><p>{text}</p></header>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="about-field"><span>{label}</span>{children}</label>; }
