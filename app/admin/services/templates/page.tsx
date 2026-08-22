"use client";
import Link from "next/link";

const templates = [
  ["✈️", "接送型", "transfer", "用于机场接送、酒店 / 市区点对点接送。", "基础信息 · 接送范围 · 车型 · 图片 · 咨询规则"],
  ["🚗", "路线型", "route", "用于私人包车、跨城接送、多景点路线。", "基础信息 · 时长 · 路线节点 · 车型 · 价格 · 咨询"],
  ["🏝", "体验型", "experience", "用于海岛、浮潜、红树林、城市文化与一日体验。", "基础信息 · 体验时长 · 行程节点 · 包含 / 不包含 · 注意事项"],
];

export default function Templates() {
  return (
    <>
      <div className="admin-head">
        <div>
          <p>当地服务</p>
          <h1>编辑模板</h1>
          <span>模板只控制后台编辑器结构，不控制前台展示分类。</span>
        </div>
      </div>
      <div className="service-subnav">
        <Link href="/admin/services">服务列表</Link>
        <Link href="/admin/services/categories">展示分类</Link>
        <Link className="active" href="/admin/services/templates">
          编辑模板
        </Link>
      </div>
      <section className="template-principle">
        <h2>模板不是分类</h2>
        <p>“交通服务 / 海岛体验”属于展示分类；“接送型 / 路线型 / 体验型”只决定编辑页出现哪些字段。具体服务创建时会自动绑定模板，编辑页默认不随便切换。</p>
      </section>
      <div className="template-grid">
        {templates.map(([icon, name, key, desc, fields]) => (
          <article key={key}>
            <span>{icon}</span>
            <h2>{name}</h2>
            <p>{desc}</p>
            <small>{fields}</small>
          </article>
        ))}
      </div>
    </>
  );
}
