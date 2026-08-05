"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { InquiryRecord } from "../../../db/inquiries";
const statuses = [
  "全部",
  "待回复",
  "沟通中",
  "已报价",
  "待跟进",
  "已成交",
  "已关闭",
];
const label: Record<string, string> = {
  "Kuala Lumpur": "吉隆坡",
  "Kota Kinabalu": "亚庇",
  Semporna: "仙本那",
  Stay: "住宿",
  "Airport transfer": "机场接送",
  "Private car": "包车",
  "Island activity": "海岛活动",
};
export default function InquiriesPage() {
  const [items, setItems] = useState<InquiryRecord[]>([]);
  const [filter, setFilter] = useState("全部");
  const [query, setQuery] = useState("");
  useEffect(() => {
    fetch("/api/admin/inquiries")
      .then((r) => {
        if (r.status === 401) {
          location.href = "/signin-with-chatgpt?return_to=%2Fadmin%2Finquiries";
          return [];
        }
        return r.json();
      })
      .then(setItems);
  }, []);
  const shown = useMemo(
    () =>
      items.filter(
        (x) =>
          (filter === "全部" || x.status === filter) &&
          (!query ||
            [x.name, x.contact, x.message]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [items, filter, query],
  );
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  return (
    <>
      <div className="admin-head">
        <div>
          <p>销售工作台</p>
          <h1>客户咨询</h1>
          <span>从收到需求到报价、跟进和成交，都在这里完成。</span>
        </div>
      </div>
      <div className="inquiry-metrics">
        <div>
          <span>待回复</span>
          <b>{items.filter((x) => x.status === "待回复").length}</b>
        </div>
        <div>
          <span>沟通中</span>
          <b>{items.filter((x) => x.status === "沟通中").length}</b>
        </div>
        <div>
          <span>今日待跟进</span>
          <b>
            {
              items.filter(
                (x) =>
                  x.nextFollowUp &&
                  x.nextFollowUp <= today &&
                  !["已成交", "已关闭"].includes(x.status),
              ).length
            }
          </b>
        </div>
        <div>
          <span>本月成交</span>
          <b>
            {
              items.filter(
                (x) => x.status === "已成交" && x.dealDate.startsWith(month),
              ).length
            }
          </b>
        </div>
      </div>
      <div className="inquiry-tools">
        <div className="status-tabs">
          {statuses.map((x) => (
            <button
              className={filter === x ? "active" : ""}
              onClick={() => setFilter(x)}
              key={x}
            >
              {x}
              <small>
                {x === "全部"
                  ? items.length
                  : items.filter((i) => i.status === x).length}
              </small>
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索姓名、联系方式或留言"
        />
      </div>
      <div className="inquiry-table">
        <div className="inquiry-row inquiry-table-head">
          <span>客户</span>
          <span>需求摘要</span>
          <span>出行信息</span>
          <span>来源</span>
          <span>状态</span>
          <span>下次跟进</span>
          <span>更新时间</span>
        </div>
        {shown.map((x) => (
          <Link
            href={`/admin/inquiries/${x.id}`}
            className="inquiry-row"
            key={x.id}
          >
            <span>
              <b>{x.name}</b>
              <small>{x.contact}</small>
            </span>
            <span>
              <b>
                {x.services.map((s) => label[s] || s).join("＋") ||
                  "待了解需求"}
              </b>
              <small>{x.message || "暂无补充留言"}</small>
            </span>
            <span>
              {x.destinations.map((d) => label[d] || d).join("、") ||
                "目的地待确认"}
              <small>
                {x.people ? x.people + " 人" : ""} {x.travelTime}
              </small>
            </span>
            <span>{x.source}</span>
            <span>
              <i className={`lead-status s-${x.status}`}>{x.status}</i>
            </span>
            <span
              className={
                x.nextFollowUp && x.nextFollowUp <= today ? "overdue" : ""
              }
            >
              {x.nextFollowUp || "未设置"}
            </span>
            <span>{x.updatedAt.slice(0, 10)}</span>
          </Link>
        ))}
      </div>
      {!shown.length && (
        <div className="empty-inquiries">暂无符合条件的咨询</div>
      )}
    </>
  );
}
