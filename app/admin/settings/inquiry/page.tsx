"use client";

import { ChangeEvent, useEffect, useState } from "react";
import {
  defaultInquirySettings,
  type InquirySettings,
} from "../../../../db/site-settings";

const sections = ["主要联系方式", "咨询完成页", "咨询文案规则"] as const;

export default function InquirySettingsPage() {
  const [section, setSection] = useState<(typeof sections)[number]>("主要联系方式");
  const [data, setData] = useState<InquirySettings>(defaultInquirySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings?key=inquiry", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          location.href =
            "/admin/login?return_to=%2Fadmin%2Fsettings%2Finquiry";
          return defaultInquirySettings;
        }
        return response.ok ? response.json() : defaultInquirySettings;
      })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/site-settings?key=inquiry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error();
      setMessage("全站咨询设置已保存");
    } catch {
      setMessage("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const uploadQr = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("files", file);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const result = await response.json();
    if (response.ok && result.urls?.[0])
      setData({ ...data, contacts: { ...data.contacts, wechatQr: result.urls[0] } });
  };

  if (loading) return <div className="admin-loading">正在加载咨询设置…</div>;

  return <>
    <div className="admin-head"><div><p>设置</p><h1>咨询与联系方式</h1><span>住宿、接送、包车、体验、跟拍和伴手礼共用这一份设置。</span></div><div className="about-admin-actions">{message && <span>{message}</span>}<button className="admin-primary" disabled={saving} onClick={() => void save()}>{saving ? "保存中…" : "保存设置"}</button></div></div>
    <div className="about-admin-layout settings-layout"><nav className="about-admin-nav">{sections.map((item, index) => <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}><span>{index + 1}</span>{item}</button>)}</nav><section className="about-admin-panel">
      {section === "主要联系方式" && <><div className="about-section-title"><h2>主要联系方式</h2><p>这里是全站唯一的微信、WhatsApp、电话与邮箱来源。</p></div><div className="about-fields two">
        <label className="admin-switch"><input type="checkbox" checked={data.contacts.wechatEnabled} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, wechatEnabled: e.target.checked } })} />启用微信</label>
        <Field label="微信号"><input value={data.contacts.wechatId} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, wechatId: e.target.value } })} /></Field>
        <Field label="微信显示名称"><input value={data.contacts.wechatName} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, wechatName: e.target.value } })} /></Field>
        <div className="qr-field">{data.contacts.wechatQr ? <img src={data.contacts.wechatQr} alt="微信二维码" /> : <span>暂未上传二维码</span>}<label className="admin-button">上传微信二维码<input hidden type="file" accept="image/*" onChange={uploadQr} /></label></div>
        <label className="admin-switch"><input type="checkbox" checked={data.contacts.whatsappEnabled} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, whatsappEnabled: e.target.checked } })} />启用 WhatsApp</label>
        <Field label="默认国家区号"><input value={data.contacts.whatsappCountryCode} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, whatsappCountryCode: e.target.value } })} /></Field>
        <Field label="WhatsApp 号码"><input value={data.contacts.whatsappNumber} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, whatsappNumber: e.target.value } })} /></Field>
        <Field label="电话"><input value={data.contacts.phone} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, phone: e.target.value } })} /></Field>
        <Field label="邮箱"><input type="email" value={data.contacts.email} onChange={(e) => setData({ ...data, contacts: { ...data.contacts, email: e.target.value } })} /></Field>
      </div></>}
      {section === "咨询完成页" && <><div className="about-section-title"><h2>咨询完成页</h2><p>控制所有业务生成需求后的第二步，微信号自动读取主要联系方式。</p></div><div className="about-fields two"><Field label="小标题"><input value={data.completion.eyebrow} onChange={(e) => setData({ ...data, completion: { ...data.completion, eyebrow: e.target.value } })} /></Field><Field label="主标题"><input value={data.completion.title} onChange={(e) => setData({ ...data, completion: { ...data.completion, title: e.target.value } })} /></Field><Field label="说明"><textarea rows={4} value={data.completion.description} onChange={(e) => setData({ ...data, completion: { ...data.completion, description: e.target.value } })} /></Field><Field label="主按钮文字"><input value={data.completion.copyButton} onChange={(e) => setData({ ...data, completion: { ...data.completion, copyButton: e.target.value } })} /></Field><Field label="返回按钮文字"><input value={data.completion.backButton} onChange={(e) => setData({ ...data, completion: { ...data.completion, backButton: e.target.value } })} /></Field><Field label="底部提示"><textarea rows={3} value={data.completion.footerHint} onChange={(e) => setData({ ...data, completion: { ...data.completion, footerHint: e.target.value } })} /></Field></div><div className="completion-preview"><small>{data.completion.eyebrow}</small><h3>{data.completion.title}</h3><p>{data.completion.description}</p><button>{data.completion.copyButton}</button><span>微信号：{data.contacts.wechatId || "未设置"}</span></div></>}
      {section === "咨询文案规则" && <><div className="about-section-title"><h2>咨询文案规则</h2><p>所有业务自动使用“【来源前缀｜当前对象名称】”。</p></div><div className="about-fields"><Field label="咨询来源前缀"><input value={data.copyRules.sourcePrefix} onChange={(e) => setData({ ...data, copyRules: { sourcePrefix: e.target.value } })} /></Field></div><div className="copy-rule-preview"><b>自动生成示例</b><code>【{data.copyRules.sourcePrefix || "官网咨询"}｜吉隆坡城市公寓】</code><code>【{data.copyRules.sourcePrefix || "官网咨询"}｜吉隆坡机场接送】</code><code>【{data.copyRules.sourcePrefix || "官网咨询"}｜吉隆坡经典一日游】</code></div></>}
    </section></div>
  </>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="about-field"><span>{label}</span>{children}</label>;
}
