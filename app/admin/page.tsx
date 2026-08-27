"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function AdminHome() {
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    today: 0,
    pending: 0,
    deals: 0,
  });
  useEffect(() => {
    const readJson = async (response: Response) => {
      if (response.status === 401) {
        location.href = "/admin/login?return_to=%2Fadmin";
        return [];
      }
      if (!response.ok) return [];
      const text = await response.text();
      return text ? JSON.parse(text) : [];
    };
    Promise.all([
      fetch("/api/admin/properties").then(readJson),
      fetch("/api/admin/inquiries").then(readJson),
    ])
      .then(([p, q]) => {
        const today = new Date().toISOString().slice(0, 10),
          month = today.slice(0, 7);
        setStats({
          total: p.length,
          published: p.filter((i: any) => i.status === "published").length,
          today: q.filter((i: any) => i.createdAt.startsWith(today)).length,
          pending: q.filter((i: any) => i.status === "待回复").length,
          deals: q.filter(
            (i: any) => i.status === "已成交" && i.dealDate.startsWith(month),
          ).length,
        });
      })
      .catch(() => {});
  }, []);
  return (
    <>
      <div className="admin-head">
        <div>
          <p>销售工作台</p>
          <h1>今天需要处理什么？</h1>
        </div>
        <Link className="admin-primary" href="/admin/inquiries">
          查看客户咨询
        </Link>
      </div>
      <div className="metrics">
        <div>
          <span>今日咨询</span>
          <b>{stats.today}</b>
          <small>今天新收到的需求</small>
        </div>
        <div>
          <span>待回复</span>
          <b>{stats.pending}</b>
          <small>需要尽快联系</small>
        </div>
        <div>
          <span>本月成交</span>
          <b>{stats.deals}</b>
          <small>本月已确认客户</small>
        </div>
        <div>
          <span>上线房源</span>
          <b>{stats.published}</b>
          <small>共 {stats.total} 套房源</small>
        </div>
      </div>
      <section className="admin-panel quick">
        <div>
          <h2>快捷入口</h2>
          <p>直接进入最常用的工作</p>
        </div>
        <div>
          <Link href="/admin/properties/new">
            新增房源 <b>→</b>
          </Link>
          <Link href="/admin/properties">
            管理房源 <b>→</b>
          </Link>
          <Link href="/admin/inquiries">
            查看咨询 <b>→</b>
          </Link>
        </div>
      </section>
    </>
  );
}
