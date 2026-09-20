"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReferrerRecord } from "../../../db/referrers";

export default function ReferrersPage() {
  const [items, setItems] = useState<ReferrerRecord[]>([]);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");

  const load = () =>
    fetch("/api/admin/referrers", { cache: "no-store" })
      .then((r) => {
        if (r.status === 401) {
          location.href = "/admin/login?return_to=%2Fadmin%2Freferrers";
          return [];
        }
        return r.ok ? r.json() : [];
      })
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));

  useEffect(() => {
    void load();
  }, []);

  const totals = useMemo(
    () => ({
      active: items.filter((x) => x.status === "active").length,
      visits: items.reduce((sum, x) => sum + x.visits, 0),
      inquiries: items.reduce((sum, x) => sum + x.inquiries, 0),
    }),
    [items],
  );

  const create = async () => {
    if (!name.trim()) return;
    setNotice("新增中...");
    const response = await fetch("/api/admin/referrers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      setName("");
      setNotice("已新增司机");
      await load();
    } else {
      setNotice("新增失败，请检查姓名");
    }
  };

  return (
    <>
      <div className="admin-head">
        <div>
          <p>咨询来源</p>
          <h1>司机推广</h1>
          <span>每位司机一个二维码，客户进入同一个完整官网。</span>
        </div>
      </div>

      <div className="referrer-metrics">
        <div>
          <span>启用司机</span>
          <b>{totals.active}</b>
        </div>
        <div>
          <span>推广访问</span>
          <b>{totals.visits}</b>
        </div>
        <div>
          <span>推广咨询</span>
          <b>{totals.inquiries}</b>
        </div>
      </div>

      <div className="referrer-create">
        <label>
          <span>司机姓名</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：张师傅"
          />
        </label>
        <button className="admin-primary" onClick={create}>
          + 新增司机
        </button>
        {notice && <small>{notice}</small>}
      </div>

      <div className="referrer-list">
        <div className="referrer-row referrer-head">
          <span>司机</span>
          <span>ID</span>
          <span>状态</span>
          <span>访问</span>
          <span>咨询</span>
          <span />
        </div>
        {items.map((item) => (
          <Link
            className="referrer-row"
            href={`/admin/referrers/${item.code}`}
            key={item.code}
          >
            <b>{item.name}</b>
            <span>{item.code}</span>
            <span>{item.status === "active" ? "已启用" : "已停用"}</span>
            <span>{item.visits}</span>
            <span>{item.inquiries}</span>
            <em>查看</em>
          </Link>
        ))}
      </div>
      {!items.length && <div className="empty-inquiries">暂无司机推广来源</div>}
    </>
  );
}
