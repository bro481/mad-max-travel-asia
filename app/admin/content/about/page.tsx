"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import type { DestinationRecord } from "../../../../db/destinations";
import { defaultAboutSettings, type AboutSettings } from "../../../../db/site-settings";

type EditKey = "philosophy" | "team" | "cta" | null;

export default function AboutAdminPage() {
  const [data, setData] = useState<AboutSettings>(defaultAboutSettings);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [editing, setEditing] = useState<EditKey>(null);
  const [editingWay, setEditingWay] = useState<string | null>(null);
  const [editingMoment, setEditingMoment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-settings?key=about", { cache: "no-store" }).then(async (r) => {
        if (r.status === 401) { location.href = "/admin/login?return_to=%2Fadmin%2Fcontent%2Fabout"; return defaultAboutSettings; }
        return r.ok ? r.json() : defaultAboutSettings;
      }),
      fetch("/api/admin/destinations", { cache: "no-store" }).then((r) => r.ok ? r.json() : []),
    ]).then(([settings, items]) => { setData(settings); setDestinations(items); }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/site-settings?key=about", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error();
      setMessage("修改已保存");
    } catch { setMessage("保存失败，请重试"); } finally { setSaving(false); }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); if (!files.length) return [];
    const form = new FormData(); files.forEach((file) => form.append("files", file));
    const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "上传失败");
    event.target.value = ""; return result.urls as string[];
  };

  if (loading) return <div className="admin-loading">正在打开关于我们编辑器…</div>;

  const destinationSettings = destinations.filter((item) => item.status !== "hidden").map((destination, index) => ({
    destination,
    setting: data.destinations.items.find((item) => item.destinationId === destination.id) || { destinationId: destination.id, serviceSummaryZh: destination.introZh, serviceSummaryEn: destination.introEn, visible: true, sortOrder: index },
  })).sort((a, b) => a.setting.sortOrder - b.setting.sortOrder);
  const replaceDestinations = (items: typeof destinationSettings) => setData({ ...data, destinations: { ...data.destinations, items: items.map(({ setting }, index) => ({ ...setting, sortOrder: index })) } });
  const updateWay = (id: string, patch: Record<string, string>) => setData({ ...data, ways: { ...data.ways, items: data.ways.items.map((item) => item.id === id ? { ...item, ...patch } : item) } });

  return <>
    <div className="admin-head about-simple-head"><div><p>内容管理</p><h1>关于我们</h1><span>管理关于我们页面展示内容</span></div><div className="about-admin-actions">{message && <span>{message}</span>}<a className="admin-button" href="/about" target="_blank">预览前台</a><button className="admin-primary" disabled={saving} onClick={() => void save()}>{saving ? "保存中…" : "保存修改"}</button></div></div>
    <main className="about-simple-page">
      <Section number="01" title="顶部介绍" subtitle="品牌介绍与首屏图片">
        <div className="about-hero-editor"><div className="about-fields">
          <Field label="小标题"><input value={data.hero.eyebrow} onChange={(e) => setData({ ...data, hero: { ...data.hero, eyebrow: e.target.value } })}/></Field>
          <Field label="主标题"><textarea rows={3} value={data.hero.titleZh} onChange={(e) => setData({ ...data, hero: { ...data.hero, titleZh: e.target.value } })}/></Field>
          <Field label="介绍"><textarea rows={4} value={data.hero.introZh} onChange={(e) => setData({ ...data, hero: { ...data.hero, introZh: e.target.value } })}/></Field>
          <div className="about-field"><span>标签</span><div className="about-tag-editor">{data.hero.tagsZh.map((tag, index) => <button key={`${tag}-${index}`} onClick={() => setData({ ...data, hero: { ...data.hero, tagsZh: data.hero.tagsZh.filter((_, i) => i !== index) } })}>{tag} ×</button>)}<button onClick={() => { const tag = prompt("输入新标签"); if (tag?.trim()) setData({ ...data, hero: { ...data.hero, tagsZh: [...data.hero.tagsZh, tag.trim()] } }); }}>＋ 添加</button></div></div>
        </div><div className="about-hero-images">{data.hero.images.map((src, index) => <figure key={index}><img src={src} alt=""/><label>更换<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (!url) return; const images = [...data.hero.images] as AboutSettings["hero"]["images"]; images[index] = url; setData({ ...data, hero: { ...data.hero, images } }); }}/></label></figure>)}</div></div>
      </Section>

      <Section number="02" title="服务范围" subtitle={`${destinationSettings.filter((x) => x.setting.visible).length} 个目的地 · ${data.ways.items.length} 个服务步骤`}>
        <SubTitle title="服务目的地" text="名称与服务内容读取目的地管理，这里只决定显示与顺序。"/>
        <div className="about-destination-list">{destinationSettings.map((row, index) => <div key={row.destination.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); replaceDestinations(move(destinationSettings, Number(e.dataTransfer.getData("text/plain")), index)); }}><span className="drag">☰</span><b>{row.destination.nameZh}</b><small>{row.destination.nameEn}</small><label className="admin-switch"><input type="checkbox" checked={row.setting.visible} onChange={(e) => replaceDestinations(destinationSettings.map((item) => item.destination.id === row.destination.id ? { ...item, setting: { ...item.setting, visible: e.target.checked } } : item))}/>页面显示</label></div>)}</div>
        <Link className="about-inline-link" href="/admin/content/destinations">管理目的地 →</Link>
        <SubTitle title="我们怎么帮客人" text="拖动可排序，编号由系统自动生成。"/>
        <div className="about-way-list">{data.ways.items.map((item, index) => <article key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setData({ ...data, ways: { ...data.ways, items: move(data.ways.items, Number(e.dataTransfer.getData("text/plain")), index) } }); }}><span className="drag">☰</span><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{item.titleZh}</strong><p>{item.descriptionZh}</p></div><button onClick={() => setEditingWay(editingWay === item.id ? null : item.id)}>编辑</button>{editingWay === item.id && <div className="about-inline-editor"><Field label="标题"><input value={item.titleZh} onChange={(e) => updateWay(item.id, { titleZh: e.target.value })}/></Field><Field label="说明"><textarea rows={3} value={item.descriptionZh} onChange={(e) => updateWay(item.id, { descriptionZh: e.target.value })}/></Field><button className="danger" onClick={() => setData({ ...data, ways: { ...data.ways, items: data.ways.items.filter((x) => x.id !== item.id) } })}>删除这一项</button></div>}</article>)}</div>
        <button className="about-add-button" onClick={() => { const id = crypto.randomUUID(); setData({ ...data, ways: { ...data.ways, items: [...data.ways.items, { id, titleZh: "新项目", titleEn: "New item", descriptionZh: "", descriptionEn: "" }] } }); setEditingWay(id); }}>＋ 添加一项</button>
      </Section>

      <Section number="03" title="品牌介绍" subtitle="平时较少修改，默认保持收起">
        <Summary eyebrow="我们的方式" title={data.philosophy.titleZh} onClick={() => setEditing(editing === "philosophy" ? null : "philosophy")}/>
        {editing === "philosophy" && <div className="about-inline-editor about-brand-fields"><Field label="标题"><input value={data.philosophy.titleZh} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, titleZh: e.target.value } })}/></Field><Field label="右侧标题"><input value={data.philosophy.sideTitleZh} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, sideTitleZh: e.target.value } })}/></Field><Field label="正文"><textarea rows={6} value={data.philosophy.paragraphsZh.join("\n\n")} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, paragraphsZh: e.target.value.split(/\n\s*\n/).filter(Boolean) } })}/></Field></div>}
        <Summary eyebrow="关于团队" title={data.team.titleZh} onClick={() => setEditing(editing === "team" ? null : "team")}/>
        {editing === "team" && <div className="about-inline-editor about-team-editor"><div className="about-team-image"><img src={data.team.image} alt=""/><label>更换<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (url) setData({ ...data, team: { ...data.team, image: url } }); }}/></label></div><div className="about-fields"><Field label="标题"><input value={data.team.titleZh} onChange={(e) => setData({ ...data, team: { ...data.team, titleZh: e.target.value } })}/></Field><Field label="品牌名称"><input value={data.team.brandName} onChange={(e) => setData({ ...data, team: { ...data.team, brandName: e.target.value } })}/></Field><Field label="小字"><input value={data.team.brandSubtitleZh} onChange={(e) => setData({ ...data, team: { ...data.team, brandSubtitleZh: e.target.value } })}/></Field><Field label="正文"><textarea rows={5} value={data.team.bodyZh} onChange={(e) => setData({ ...data, team: { ...data.team, bodyZh: e.target.value } })}/></Field><div className="about-toggle-row"><label className="admin-switch"><input type="checkbox" checked={data.team.showWechat} onChange={(e) => setData({ ...data, team: { ...data.team, showWechat: e.target.checked } })}/>微信咨询</label><label className="admin-switch"><input type="checkbox" checked={data.team.showWhatsapp} onChange={(e) => setData({ ...data, team: { ...data.team, showWhatsapp: e.target.checked } })}/>WhatsApp</label></div></div></div>}
      </Section>

      <Section number="04" title="真实日常" subtitle="最多 5 张；第一张自动为大图，其余自动为小图">
        <div className="about-moment-manager">{data.moments.items.slice(0, 5).map((item, index) => <figure key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", String(index))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setData({ ...data, moments: { ...data.moments, items: move(data.moments.items, Number(e.dataTransfer.getData("text/plain")), index).map((x, i) => ({ ...x, size: i === 0 ? "large" : "normal" })) } }); }} onClick={() => setEditingMoment(item.id)}><img src={item.image} alt=""/><figcaption>{item.captionZh}</figcaption><span>☰</span></figure>)}</div>
        {editingMoment && (() => { const item = data.moments.items.find((x) => x.id === editingMoment); if (!item) return null; return <div className="about-moment-popover"><b>编辑图片</b><label className="admin-button">更换图片<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (url) setData({ ...data, moments: { ...data.moments, items: data.moments.items.map((x) => x.id === item.id ? { ...x, image: url } : x) } }); }}/></label><Field label="图片角标"><input value={item.captionZh} onChange={(e) => setData({ ...data, moments: { ...data.moments, items: data.moments.items.map((x) => x.id === item.id ? { ...x, captionZh: e.target.value } : x) } })}/></Field><button className="danger" onClick={() => { setData({ ...data, moments: { ...data.moments, items: data.moments.items.filter((x) => x.id !== item.id).map((x, i) => ({ ...x, size: i === 0 ? "large" : "normal" })) } }); setEditingMoment(null); }}>删除图片</button><button onClick={() => setEditingMoment(null)}>完成</button></div>; })()}
        {data.moments.items.length < 5 && <label className="about-add-button">＋ 添加图片<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (url) setData({ ...data, moments: { ...data.moments, items: [...data.moments.items, { id: crypto.randomUUID(), image: url, captionZh: "新图片", captionEn: "New image", size: "normal" }] } }); }}/></label>}
      </Section>

      <Section number="05" title="底部咨询" subtitle={data.cta.titleZh} action={<button onClick={() => setEditing(editing === "cta" ? null : "cta")}>{editing === "cta" ? "收起" : "编辑"}</button>}>
        {editing === "cta" ? <div className="about-inline-editor about-fields"><Field label="标题"><input value={data.cta.titleZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, titleZh: e.target.value } })}/></Field><Field label="说明"><textarea rows={3} value={data.cta.descriptionZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, descriptionZh: e.target.value } })}/></Field><div className="about-fields two"><Field label="主按钮"><input value={data.cta.primaryTextZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, primaryTextZh: e.target.value } })}/><small>固定动作：打开咨询表单</small></Field><Field label="次按钮"><input value={data.cta.secondaryTextZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, secondaryTextZh: e.target.value } })}/><small>固定动作：前往房源</small></Field></div></div> : <p className="about-cta-summary">{data.cta.descriptionZh}</p>}
      </Section>
    </main>
  </>;
}

function Section({ number, title, subtitle, action, children }: { number: string; title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) { return <section className="about-simple-section"><header><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</header><div className="about-simple-content">{children}</div></section>; }
function SubTitle({ title, text }: { title: string; text: string }) { return <div className="about-subtitle"><h3>{title}</h3><p>{text}</p></div>; }
function Summary({ eyebrow, title, onClick }: { eyebrow: string; title: string; onClick: () => void }) { return <div className="about-summary-row"><div><small>{eyebrow}</small><b>{title}</b></div><button onClick={onClick}>编辑</button></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="about-field"><span>{label}</span>{children}</label>; }
function move<T>(items: T[], from: number, to: number) { if (from === to || from < 0 || to < 0) return items; const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; }
