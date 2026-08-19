"use client";
import { FormEvent, useState } from "react";
import type { ServiceItem } from "../../../../db/service-items";
import { ServiceMenu } from "../../../service-menu";
export function ServiceProductDetail({ service: s }: { service: ServiceItem }) {
  const [sent, setSent] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget,
      d = new FormData(f);
    const details = s.inquiryFields
      .map((field) => `${field}：${d.get(field) || "未填写"}`)
      .join("\n");
    const r = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: d.get("name"),
        contact: d.get("contact"),
        destinations: [s.city],
        services: [s.nameZh],
        travelTime: d.get("日期") || "",
        message: `服务咨询：${s.nameZh}\n${details}\n补充需求：${d.get("message") || "无"}`,
      }),
    });
    if (r.ok) setSent(true);
  };
  return (
    <>
      <header>
        <a className="logo" href="/">
          <span className="logo-mark">⌂</span>
          <span>
            <b>MAD MAX</b>
            <small>MALAYSIA STAY</small>
          </span>
        </a>
        <nav>
          <a href="/#stays">房源</a>
          <ServiceMenu lang="zh" active />
          <a href="/#about">关于我们</a>
          <a href="/#contact">联系我们</a>
        </nav>
      </header>
      <main className="service-product-detail">
        <section className="service-product-hero">
          {s.images[0] && <img src={s.images[0]} alt={s.nameZh} />}
          <div>
            <p>
              {s.city} · {s.category}
            </p>
            <h1>{s.nameZh}</h1>
            <h2>{s.subtitleZh}</h2>
            <div>
              {s.tags.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
          </div>
        </section>
        <div className="service-product-body">
          <article>
            <section>
              <h2>关于这个服务</h2>
              <p>
                {s.introZh ||
                  "告诉我们你的计划，我们会根据日期、人数和路线确认合适安排。"}
              </p>
            </section>
            {s.steps.length > 0 && (
              <section>
                <h2>服务流程</h2>
                <div className="service-step-grid">
                  {s.steps.map((x, i) => (
                    <div key={i}>
                      <b>0{i + 1}</b>
                      <h3>{x.title}</h3>
                      <p>{x.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {s.routes.length > 0 && (
              <section>
                <h2>热门路线方案</h2>
                <div className="route-grid">
                  {s.routes.map((x, i) => (
                    <article key={i}>
                      {x.image && <img src={x.image} alt="" />}
                      <span>
                        {x.duration} · {x.tag}
                      </span>
                      <h3>{x.name}</h3>
                      <p>{x.description}</p>
                      <small>{x.stops}</small>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {s.timeline.length > 0 && (
              <section>
                <h2>行程安排</h2>
                <div className="journey-timeline">
                  {s.timeline.map((x, i) => (
                    <div key={i}>
                      <time>{x.time}</time>
                      <span />
                      <section>
                        <h3>{x.title}</h3>
                        <p>{x.description}</p>
                      </section>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
          <aside>
            <h2>咨询这项服务</h2>
            <p>请告诉我们以下信息，我们会尽快联系确认。</p>
            {sent ? (
              <div className="inquiry-success">
                <b>✓ 已收到咨询</b>
                <p>我们会尽快联系您。</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <label>
                  怎么称呼您？
                  <input required name="name" />
                </label>
                <label>
                  微信 / WhatsApp
                  <input required name="contact" />
                </label>
                {s.inquiryFields.map((x) => (
                  <label key={x}>
                    {x}
                    <input name={x} />
                  </label>
                ))}
                <label>
                  补充需求
                  <textarea name="message" rows={4} />
                </label>
                <button className="button">提交咨询</button>
              </form>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
