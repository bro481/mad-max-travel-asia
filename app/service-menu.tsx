"use client";

import Link from "next/link";
import { useState } from "react";

type Lang = "zh" | "en";

const entries = {
  zh: [
    {
      href: "/services",
      title: "出行与体验",
      desc: "接送 · 包车 · 海岛 · 当地体验",
    },
    {
      href: "/photography",
      title: "旅行攻略",
      desc: "城市漫游 · 美食 · 住宿建议",
    },
    {
      href: "/travel-photography",
      title: "大马跟拍",
      desc: "旅拍 · 城市照片 · 海岛记录",
    },
    {
      href: "/picks",
      title: "马来西亚好物",
      desc: "精选当地好物与伴手礼",
    },
  ],
  en: [
    {
      href: "/services",
      title: "Travel & Experiences",
      desc: "Transfers · Private cars · Islands · Local experiences",
    },
    {
      href: "/photography",
      title: "Travel Guide",
      desc: "City walks · Food · Stay notes",
    },
    {
      href: "/travel-photography",
      title: "Travel Photography",
      desc: "Portraits · City shoots · Island stories",
    },
    {
      href: "/picks",
      title: "Malaysia Picks",
      desc: "Curated local goods and souvenirs",
    },
  ],
};

export function ServiceMenu({
  lang,
  active = false,
}: {
  lang: Lang;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const label = lang === "zh" ? "当地服务" : "Local Services";

  return (
    <span className={`service-menu ${open ? "open" : ""}`}>
      <Link className={active ? "active-nav" : ""} href="/services">
        {label}
      </Link>
      <button
        aria-expanded={open}
        aria-label={lang === "zh" ? "展开当地服务菜单" : "Open local services menu"}
        className="service-menu-toggle"
        type="button"
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
      >
        ⌄
      </button>
      <div className="service-menu-panel">
        <p>{label}</p>
        {entries[lang].map((item) => (
          <Link href={item.href} key={item.href}>
            <span>
              <b>{item.title}</b>
              <small>{item.desc}</small>
            </span>
            <i>→</i>
          </Link>
        ))}
      </div>
    </span>
  );
}
