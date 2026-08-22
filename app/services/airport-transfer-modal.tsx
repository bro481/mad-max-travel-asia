"use client";

import { useMemo, useState } from "react";
import { GalleryCarousel } from "../components/gallery-carousel";
import "./airport-transfer-modal.css";

export type AirportTransferPreview = {
  title: string;
  subtitle: string;
  tags: string[];
  images: string[];
  maxGuests: number;
  guestNote: string;
  vehicles: {
    image: string;
    name: string;
    people: string;
    luggage?: string;
    note: string;
  }[];
  questions: string[];
};

type TransferRequest = {
  direction: "机场 → 酒店" | "酒店 → 机场";
  date: string;
  flight: string;
  address: string;
  people: number;
  luggage: number;
};

const WECHAT_ID = "MADMAX_STAY";

export function AirportTransferModal({
  data,
  onClose,
}: {
  data: AirportTransferPreview;
  onClose: () => void;
}) {
  const images = data.images.filter(Boolean);
  const [requestOpen, setRequestOpen] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [wechatCopied, setWechatCopied] = useState(false);
  const [request, setRequest] = useState<TransferRequest>({
    direction: "机场 → 酒店",
    date: "",
    flight: "",
    address: "",
    people: 2,
    luggage: 2,
  });
  const requestText = useMemo(
    () =>
      [
        `【官网咨询｜${data.title}】`,
        `接送方向：${request.direction}`,
        `日期：${request.date || "待补充"}`,
        `航班号：${request.flight || "待补充"}`,
        `接送地点：${request.address || "待补充"}`,
        `同行人数：${request.people} 人`,
        `行李数量：${request.luggage} 件`,
      ].join("\n"),
    [data.title, request]
  );
  const updateRequest = <K extends keyof TransferRequest>(
    key: K,
    value: TransferRequest[K]
  ) => {
    setCopied(false);
    setWechatCopied(false);
    setRequest((current) => ({ ...current, [key]: value }));
  };
  const copyRequest = async () => {
    try {
      await navigator.clipboard.writeText(requestText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = requestText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
  };
  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(WECHAT_ID);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = WECHAT_ID;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setWechatCopied(true);
  };

  return (
    <div
      className="service-quick-modal airport-transfer-modal"
      role="dialog"
      aria-modal="true"
      aria-label={data.title}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div className={`quick-modal-visual ${images.length > 1 ? "has-gallery" : ""}`}>
          <GalleryCarousel images={images} alt={data.title} compact />
          <p className="airport-visual-eyebrow">MAD MAX · LOCAL SERVICE</p>
          <div className="airport-visual-copy">
            <span>专属安排</span>
            <b>轻松出发，安心抵达</b>
            <small>专业司机 · 准时接送 · 舒适出行</small>
          </div>
        </div>
        <section className="airport-modal-content">
          <p className="eyebrow">MAD MAX · LOCAL SERVICE</p>
          <h2>{data.title}</h2>
          <p className="quick-modal-desc">{data.subtitle}</p>
          <div className="quick-modal-tags airport-modal-tags">
            {data.tags.slice(0, 3).map((x, i) => (
              <span key={x}>
                {i === 0 ? "⌖" : i === 1 ? "▢" : "◷"} {x}
              </span>
            ))}
          </div>
          <div className="airport-capacity">
            <span>♙</span>
            <div>
              <b>1–{data.maxGuests} 人均可安排</b>
              <small>告诉我们人数和行李，我们会帮你安排合适的车型。</small>
            </div>
          </div>
          <div className="airport-vehicles-heading">
            <h3>可安排车型</h3>
          </div>
          <div className="airport-vehicle-grid">
            {data.vehicles.slice(0, 4).map((v, i) => (
              <article key={v.name + i}>
                {v.image && <img src={v.image} alt={v.name} />}
                <b>{v.name}</b>
                <span>
                  {[
                    "1–3人 · 少量行李",
                    "4–6人 · 家庭出行",
                    "7–10人 · 多人出行",
                    "最高14人 · 按需安排",
                  ][i] || `${v.people}${v.luggage ? ` · ${v.luggage}` : ""}`}
                </span>
              </article>
            ))}
          </div>
          <div className="quick-modal-info airport-modal-info">
            <h3>咨询时告诉我们</h3>
            <ul>
              {data.questions.slice(0, 4).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <button
            className="button airport-open-request"
            type="button"
            onClick={() => {
              setRequestOpen(true);
              setGenerated(false);
              setCopied(false);
              setWechatCopied(false);
            }}
          >
            咨询这项服务
          </button>
        </section>
        {requestOpen && (
          <div
            className="airport-request-layer"
            role="dialog"
            aria-modal="true"
            aria-label="填写接送需求"
            onClick={() => setRequestOpen(false)}
          >
            <div className="airport-request-card" onClick={(e) => e.stopPropagation()}>
              <button
                className="airport-request-close"
                type="button"
                onClick={() => setRequestOpen(false)}
                aria-label="关闭需求卡"
              >
                ×
              </button>
              {generated ? (
                <div className="airport-request-result">
                  <p className="eyebrow">REQUEST READY</p>
                  <h3>接送需求已整理好</h3>
                  <p>复制后添加微信发送给我们，我们会直接根据这些信息确认车型和价格。</p>
                  <pre>{requestText}</pre>
                  <div className="airport-request-actions">
                    <button type="button" onClick={copyRequest}>
                      {copied ? "已复制" : "复制需求"}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setCopied(false);
                        setWechatCopied(false);
                        setGenerated(false);
                      }}
                    >
                      返回修改
                    </button>
                    <button type="button" className="primary" onClick={copyWechat}>
                      {wechatCopied ? "微信号已复制" : "添加微信"}
                    </button>
                  </div>
                  <div className="airport-wechat">
                    <div className="airport-wechat-qr">
                      <b>微信</b>
                      <small>二维码</small>
                    </div>
                    <div>
                      <span>微信号</span>
                      <b>{WECHAT_ID}</b>
                      <small>复制需求后扫码或搜索微信号添加</small>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  className="airport-request-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setGenerated(true);
                    setCopied(false);
                  }}
                >
                  <p className="eyebrow">TRANSFER REQUEST</p>
                  <h3>告诉我你的接送安排</h3>
                  <p>填好后自动整理需求 → 添加微信发送 → 更快确认车型和价格。</p>
                  <label className="airport-direction-field">
                    <span>接送方向</span>
                    <div>
                      {(["机场 → 酒店", "酒店 → 机场"] as const).map((direction) => (
                        <button
                          key={direction}
                          type="button"
                          className={request.direction === direction ? "active" : ""}
                          onClick={() => updateRequest("direction", direction)}
                        >
                          {direction}
                        </button>
                      ))}
                    </div>
                  </label>
                  <div className="airport-request-grid">
                    <label>
                      <span>日期</span>
                      <input
                        type="date"
                        value={request.date}
                        onChange={(e) => updateRequest("date", e.target.value)}
                      />
                    </label>
                    <label>
                      <span>航班号</span>
                      <input
                        value={request.flight}
                        placeholder="例如 MH123"
                        onChange={(e) => updateRequest("flight", e.target.value)}
                      />
                    </label>
                  </div>
                  <label>
                    <span>接送地点</span>
                    <input
                      value={request.address}
                      placeholder="酒店名称 / 地址"
                      onChange={(e) => updateRequest("address", e.target.value)}
                    />
                  </label>
                  <div className="airport-stepper-grid">
                    <div>
                      <span>人数</span>
                      <div className="airport-stepper">
                        <button
                          type="button"
                          onClick={() => updateRequest("people", Math.max(1, request.people - 1))}
                        >
                          −
                        </button>
                        <b>{request.people} 人</b>
                        <button
                          type="button"
                          onClick={() =>
                            updateRequest("people", Math.min(data.maxGuests, request.people + 1))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <span>行李</span>
                      <div className="airport-stepper">
                        <button
                          type="button"
                          onClick={() => updateRequest("luggage", Math.max(0, request.luggage - 1))}
                        >
                          −
                        </button>
                        <b>{request.luggage} 件</b>
                        <button
                          type="button"
                          onClick={() => updateRequest("luggage", request.luggage + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button className="button airport-generate-request" type="submit">
                    生成接送需求 →
                  </button>
                  <small className="airport-request-next">
                    下一步：添加微信并发送需求
                  </small>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
