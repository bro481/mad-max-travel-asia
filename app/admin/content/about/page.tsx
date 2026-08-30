"use client";

import { ChangeEvent, useEffect, useState } from "react";
import type { DestinationRecord } from "../../../../db/destinations";
import {
  defaultAboutSettings,
  type AboutSettings,
} from "../../../../db/site-settings";

const sections = [
  "Hero",
  "服务目的地",
  "我们怎么帮你",
  "我们为什么这样做",
  "真实日常",
  "关于团队",
  "底部 CTA",
  "发布",
] as const;

type Section = (typeof sections)[number];

export default function AboutAdminPage() {
  const [section, setSection] = useState<Section>("Hero");
  const [data, setData] = useState<AboutSettings>(defaultAboutSettings);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-settings?key=about", { cache: "no-store" }).then(
        async (response) => {
          if (response.status === 401) {
            location.href =
              "/admin/login?return_to=%2Fadmin%2Fcontent%2Fabout";
            return defaultAboutSettings;
          }
          return response.ok ? response.json() : defaultAboutSettings;
        },
      ),
      fetch("/api/admin/destinations", { cache: "no-store" }).then((response) =>
        response.ok ? response.json() : [],
      ),
    ])
      .then(([settings, destinationItems]) => {
        setData(settings);
        setDestinations(destinationItems);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (publish = false) => {
    setSaving(true);
    setMessage("");
    const next = { ...data, status: publish ? "published" : data.status } as AboutSettings;
    try {
      const response = await fetch("/api/admin/site-settings?key=about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!response.ok) throw new Error();
      setData(next);
      setMessage(publish ? "关于我们已发布" : "内容已保存");
    } catch {
      setMessage("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return [];
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "上传失败");
    return result.urls as string[];
  };

  if (loading) return <div className="admin-loading">正在打开关于我们编辑器…</div>;

  const destinationSettings = destinations
    .filter((item) => item.status !== "hidden")
    .map((item, index) => {
      const saved = data.destinations.items.find(
        (setting) => setting.destinationId === item.id,
      );
      return {
        destination: item,
        setting: saved || {
          destinationId: item.id,
          serviceSummaryZh: item.introZh,
          serviceSummaryEn: item.introEn,
          visible: true,
          sortOrder: index,
        },
      };
    })
    .sort((a, b) => a.setting.sortOrder - b.setting.sortOrder);

  const updateDestination = (
    destinationId: number,
    patch: Partial<(typeof destinationSettings)[number]["setting"]>,
  ) => {
    const current = destinationSettings.map(({ setting }) =>
      setting.destinationId === destinationId ? { ...setting, ...patch } : setting,
    );
    setData({
      ...data,
      destinations: { ...data.destinations, items: current },
    });
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <p>内容管理</p>
          <h1>关于我们</h1>
          <span>每个模块只控制当前前台对应区域，不改变前台设计。</span>
        </div>
        <div className="about-admin-actions">
          {message && <span>{message}</span>}
          <a className="admin-button" href="/about" target="_blank">查看前台</a>
          <button className="admin-primary" disabled={saving} onClick={() => void save()}>
            {saving ? "保存中…" : "保存内容"}
          </button>
        </div>
      </div>
      <div className="about-admin-layout">
        <nav className="about-admin-nav">
          {sections.map((item, index) => (
            <button className={section === item ? "active" : ""} key={item} onClick={() => setSection(item)}>
              <span>{index + 1}</span>{item}
            </button>
          ))}
        </nav>
        <section className="about-admin-panel">
          {section === "Hero" && <>
            <SectionTitle title="Hero" text="管理前台首屏文字与三张拼图，右侧编号对应实际位置。" />
            <div className="about-admin-columns">
              <div className="about-fields">
                <Field label="小标题"><input value={data.hero.eyebrow} onChange={(e) => setData({ ...data, hero: { ...data.hero, eyebrow: e.target.value } })} /></Field>
                <Field label="中文主标题"><textarea rows={3} value={data.hero.titleZh} onChange={(e) => setData({ ...data, hero: { ...data.hero, titleZh: e.target.value } })} /></Field>
                <Field label="英文主标题"><textarea rows={3} value={data.hero.titleEn} onChange={(e) => setData({ ...data, hero: { ...data.hero, titleEn: e.target.value } })} /></Field>
                <Field label="中文简介"><textarea rows={4} value={data.hero.introZh} onChange={(e) => setData({ ...data, hero: { ...data.hero, introZh: e.target.value } })} /></Field>
                <Field label="英文简介"><textarea rows={4} value={data.hero.introEn} onChange={(e) => setData({ ...data, hero: { ...data.hero, introEn: e.target.value } })} /></Field>
                <Field label="中文标签（每行一个）"><textarea rows={2} value={data.hero.tagsZh.join("\n")} onChange={(e) => setData({ ...data, hero: { ...data.hero, tagsZh: e.target.value.split("\n").filter(Boolean) } })} /></Field>
                <Field label="英文标签（每行一个）"><textarea rows={2} value={data.hero.tagsEn.join("\n")} onChange={(e) => setData({ ...data, hero: { ...data.hero, tagsEn: e.target.value.split("\n").filter(Boolean) } })} /></Field>
                <Field label="图片角标"><input value={data.hero.imageBadgeZh} onChange={(e) => setData({ ...data, hero: { ...data.hero, imageBadgeZh: e.target.value } })} /></Field>
              </div>
              <HeroPreview data={data} upload={upload} setData={setData} />
            </div>
          </>}
          {section === "服务目的地" && <>
            <SectionTitle title="服务目的地" text="目的地名称来自目的地管理，这里只维护展示、顺序和服务摘要。" />
            <ModuleFields visible={data.destinations.visible} setVisible={(visible) => setData({ ...data, destinations: { ...data.destinations, visible } })} eyebrow={data.destinations.eyebrow} setEyebrow={(eyebrow) => setData({ ...data, destinations: { ...data.destinations, eyebrow } })} titleZh={data.destinations.titleZh} titleEn={data.destinations.titleEn} introZh={data.destinations.introZh} introEn={data.destinations.introEn} set={(patch) => setData({ ...data, destinations: { ...data.destinations, ...patch } })} />
            <div className="about-list">
              {destinationSettings.map(({ destination, setting }, index) => <article key={destination.id}>
                <span className="drag">⋮⋮</span><div><b>{destination.nameZh}</b><small>{destination.nameEn}</small></div>
                <input value={setting.serviceSummaryZh} placeholder="服务摘要" onChange={(e) => updateDestination(destination.id, { serviceSummaryZh: e.target.value })} />
                <label className="admin-switch"><input type="checkbox" checked={setting.visible} onChange={(e) => updateDestination(destination.id, { visible: e.target.checked })} />显示</label>
                <div className="order-buttons"><button disabled={!index} onClick={() => updateDestination(destination.id, { sortOrder: Math.max(0, setting.sortOrder - 1) })}>↑</button><button onClick={() => updateDestination(destination.id, { sortOrder: setting.sortOrder + 1 })}>↓</button></div>
              </article>)}
            </div>
          </>}
          {section === "我们怎么帮你" && <>
            <SectionTitle title="我们怎么帮你" text="步骤卡可以增删和调整顺序。" />
            <ModuleFields visible={data.ways.visible} setVisible={(visible) => setData({ ...data, ways: { ...data.ways, visible } })} eyebrow={data.ways.eyebrow} setEyebrow={(eyebrow) => setData({ ...data, ways: { ...data.ways, eyebrow } })} titleZh={data.ways.titleZh} titleEn={data.ways.titleEn} introZh={data.ways.introZh} introEn={data.ways.introEn} set={(patch) => setData({ ...data, ways: { ...data.ways, ...patch } })} />
            <div className="about-card-editor">{data.ways.items.map((item, index) => <article key={item.id}><header><b>{String(index + 1).padStart(2, "0")}</b><div><button disabled={!index} onClick={() => setData({ ...data, ways: { ...data.ways, items: move(data.ways.items, index, index - 1) } })}>↑</button><button disabled={index === data.ways.items.length - 1} onClick={() => setData({ ...data, ways: { ...data.ways, items: move(data.ways.items, index, index + 1) } })}>↓</button><button className="danger" onClick={() => setData({ ...data, ways: { ...data.ways, items: data.ways.items.filter((x) => x.id !== item.id) } })}>删除</button></div></header><Field label="中文标题"><input value={item.titleZh} onChange={(e) => setData({ ...data, ways: { ...data.ways, items: data.ways.items.map((x) => x.id === item.id ? { ...x, titleZh: e.target.value } : x) } })} /></Field><Field label="中文说明"><textarea rows={3} value={item.descriptionZh} onChange={(e) => setData({ ...data, ways: { ...data.ways, items: data.ways.items.map((x) => x.id === item.id ? { ...x, descriptionZh: e.target.value } : x) } })} /></Field></article>)}</div>
            <button className="admin-primary" onClick={() => setData({ ...data, ways: { ...data.ways, items: [...data.ways.items, { id: crypto.randomUUID(), titleZh: "新项目", titleEn: "New item", descriptionZh: "", descriptionEn: "" }] } })}>＋ 添加一项</button>
          </>}
          {section === "我们为什么这样做" && <>
            <SectionTitle title="我们为什么这样做" text="对应前台左右双栏理念说明。" />
            <label className="admin-switch"><input type="checkbox" checked={data.philosophy.visible} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, visible: e.target.checked } })} />显示该模块</label>
            <div className="about-fields two"><Field label="小标题"><input value={data.philosophy.eyebrow} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, eyebrow: e.target.value } })} /></Field><Field label="左侧中文大标题"><textarea rows={3} value={data.philosophy.titleZh} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, titleZh: e.target.value } })} /></Field><Field label="右侧中文标题"><input value={data.philosophy.sideTitleZh} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, sideTitleZh: e.target.value } })} /></Field><Field label="右侧中文正文（段落间空一行）"><textarea rows={8} value={data.philosophy.paragraphsZh.join("\n\n")} onChange={(e) => setData({ ...data, philosophy: { ...data.philosophy, paragraphsZh: e.target.value.split(/\n\s*\n/).filter(Boolean) } })} /></Field></div>
          </>}
          {section === "真实日常" && <>
            <SectionTitle title="真实日常" text="图片独立管理，第一张大图保持现有拼贴布局。" />
            <ModuleFields visible={data.moments.visible} setVisible={(visible) => setData({ ...data, moments: { ...data.moments, visible } })} eyebrow={data.moments.eyebrow} setEyebrow={(eyebrow) => setData({ ...data, moments: { ...data.moments, eyebrow } })} titleZh={data.moments.titleZh} titleEn={data.moments.titleEn} introZh={data.moments.introZh} introEn={data.moments.introEn} set={(patch) => setData({ ...data, moments: { ...data.moments, ...patch } })} />
            <div className="moment-admin-grid">{data.moments.items.map((item, index) => <article key={item.id}><img src={item.image} alt="" /><Field label="中文角标"><input value={item.captionZh} onChange={(e) => setData({ ...data, moments: { ...data.moments, items: data.moments.items.map((x) => x.id === item.id ? { ...x, captionZh: e.target.value } : x) } })} /></Field><label>版式尺寸<select value={item.size} onChange={(e) => setData({ ...data, moments: { ...data.moments, items: data.moments.items.map((x) => x.id === item.id ? { ...x, size: e.target.value as "large" | "normal" } : x) } })}><option value="large">大图</option><option value="normal">普通</option></select></label><footer><label className="admin-button">更换图片<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (url) setData({ ...data, moments: { ...data.moments, items: data.moments.items.map((x) => x.id === item.id ? { ...x, image: url } : x) } }); }} /></label><button disabled={!index} onClick={() => setData({ ...data, moments: { ...data.moments, items: move(data.moments.items, index, index - 1) } })}>↑</button><button disabled={index === data.moments.items.length - 1} onClick={() => setData({ ...data, moments: { ...data.moments, items: move(data.moments.items, index, index + 1) } })}>↓</button><button className="danger" onClick={() => setData({ ...data, moments: { ...data.moments, items: data.moments.items.filter((x) => x.id !== item.id) } })}>删除</button></footer></article>)}</div>
            <label className="admin-primary upload-button">＋ 添加图片<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (url) setData({ ...data, moments: { ...data.moments, items: [...data.moments.items, { id: crypto.randomUUID(), image: url, captionZh: "新图片", captionEn: "New image", size: "normal" }] } }); }} /></label>
          </>}
          {section === "关于团队" && <>
            <SectionTitle title="关于团队" text="咨询入口只控制显示，联系方式来自全局设置。" />
            <div className="about-fields two"><label className="admin-switch"><input type="checkbox" checked={data.team.visible} onChange={(e) => setData({ ...data, team: { ...data.team, visible: e.target.checked } })} />显示该模块</label><Field label="小标题"><input value={data.team.eyebrow} onChange={(e) => setData({ ...data, team: { ...data.team, eyebrow: e.target.value } })} /></Field><Field label="中文主标题"><input value={data.team.titleZh} onChange={(e) => setData({ ...data, team: { ...data.team, titleZh: e.target.value } })} /></Field><Field label="品牌名"><input value={data.team.brandName} onChange={(e) => setData({ ...data, team: { ...data.team, brandName: e.target.value } })} /></Field><Field label="品牌副标题"><input value={data.team.brandSubtitleZh} onChange={(e) => setData({ ...data, team: { ...data.team, brandSubtitleZh: e.target.value } })} /></Field><Field label="中文正文"><textarea rows={6} value={data.team.bodyZh} onChange={(e) => setData({ ...data, team: { ...data.team, bodyZh: e.target.value } })} /></Field><Field label="图片角标"><input value={data.team.imageBadgeZh} onChange={(e) => setData({ ...data, team: { ...data.team, imageBadgeZh: e.target.value } })} /></Field><label className="admin-switch"><input type="checkbox" checked={data.team.showWechat} onChange={(e) => setData({ ...data, team: { ...data.team, showWechat: e.target.checked } })} />显示微信入口</label><label className="admin-switch"><input type="checkbox" checked={data.team.showWhatsapp} onChange={(e) => setData({ ...data, team: { ...data.team, showWhatsapp: e.target.checked } })} />显示 WhatsApp 入口</label><div className="team-image-field"><img src={data.team.image} alt="" /><label className="admin-button">更换左侧图片<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (url) setData({ ...data, team: { ...data.team, image: url } }); }} /></label></div></div>
          </>}
          {section === "底部 CTA" && <>
            <SectionTitle title="底部 CTA" text="主按钮固定打开全局咨询，次按钮可设置站内链接。" />
            <div className="about-fields two"><label className="admin-switch"><input type="checkbox" checked={data.cta.visible} onChange={(e) => setData({ ...data, cta: { ...data.cta, visible: e.target.checked } })} />显示该模块</label><Field label="中文标题"><input value={data.cta.titleZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, titleZh: e.target.value } })} /></Field><Field label="中文说明"><textarea rows={4} value={data.cta.descriptionZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, descriptionZh: e.target.value } })} /></Field><Field label="主按钮文字"><input value={data.cta.primaryTextZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, primaryTextZh: e.target.value } })} /></Field><Field label="次按钮文字"><input value={data.cta.secondaryTextZh} onChange={(e) => setData({ ...data, cta: { ...data.cta, secondaryTextZh: e.target.value } })} /></Field><Field label="次按钮链接"><input value={data.cta.secondaryLink} onChange={(e) => setData({ ...data, cta: { ...data.cta, secondaryLink: e.target.value } })} /></Field></div>
          </>}
          {section === "发布" && <div className="about-publish"><SectionTitle title="发布检查" text="确认页面主要内容齐全后发布。" /><ul><li>✓ Hero 主标题与三张图片</li><li>✓ 服务目的地读取目的地管理</li><li>✓ 我们怎么帮你至少一项</li><li>✓ 真实日常图片</li><li>✓ 团队与底部 CTA</li></ul><p>当前状态：<b>{data.status === "published" ? "已发布" : "草稿"}</b></p><button className="admin-primary" disabled={saving} onClick={() => void save(true)}>发布关于我们</button></div>}
        </section>
      </div>
    </>
  );
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return <div className="about-section-title"><h2>{title}</h2><p>{text}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="about-field"><span>{label}</span>{children}</label>;
}

function ModuleFields({ visible, setVisible, eyebrow, setEyebrow, titleZh, titleEn, introZh, introEn, set }: { visible: boolean; setVisible: (value: boolean) => void; eyebrow: string; setEyebrow: (value: string) => void; titleZh: string; titleEn: string; introZh: string; introEn: string; set: (patch: Record<string, string>) => void }) {
  return <div className="about-fields two"><label className="admin-switch"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />显示该模块</label><Field label="小标题"><input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} /></Field><Field label="中文主标题"><input value={titleZh} onChange={(e) => set({ titleZh: e.target.value })} /></Field><Field label="英文主标题"><input value={titleEn} onChange={(e) => set({ titleEn: e.target.value })} /></Field><Field label="中文简介"><textarea rows={3} value={introZh} onChange={(e) => set({ introZh: e.target.value })} /></Field><Field label="英文简介"><textarea rows={3} value={introEn} onChange={(e) => set({ introEn: e.target.value })} /></Field></div>;
}

function HeroPreview({ data, upload, setData }: { data: AboutSettings; upload: (event: ChangeEvent<HTMLInputElement>) => Promise<string[]>; setData: (data: AboutSettings) => void }) {
  return <aside className="hero-admin-preview"><b>Hero 实时预览</b><div className="hero-preview-copy"><small>{data.hero.eyebrow}</small><h3>{data.hero.titleZh}</h3><p>{data.hero.introZh}</p></div><div className="hero-preview-images">{data.hero.images.map((image, index) => <figure key={`${image}-${index}`}><img src={image} alt="" /><span>{index === 0 ? "主图" : index === 1 ? "右上图片" : "右下图片"}</span><label>更换<input hidden type="file" accept="image/*" onChange={async (e) => { const [url] = await upload(e); if (!url) return; const images = [...data.hero.images] as [string, string, string]; images[index] = url; setData({ ...data, hero: { ...data.hero, images } }); }} /></label></figure>)}</div></aside>;
}
