"use client";

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

export function AirportTransferModal({
  data,
  onClose,
}: {
  data: AirportTransferPreview;
  onClose: () => void;
}) {
  const images = data.images.filter(Boolean);

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
          <GalleryCarousel images={images} alt={data.title} />
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
              <b>1–{data.maxGuests}人均可安排</b>
              <small>{data.guestNote}</small>
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
                <span>{v.people}</span>
                <small>
                  {v.note}
                  {v.luggage ? ` · ${v.luggage}` : ""}
                </small>
              </article>
            ))}
          </div>
          <p className="airport-vehicle-note">
            ▱ 告诉我们人数和行李数量，我们会为您安排合适车型。
          </p>
          <div className="quick-modal-flow airport-modal-flow">
            <div>
              <b>01</b>
              <span>告诉我们行程</span>
            </div>
            <i />
            <div>
              <b>02</b>
              <span>匹配车型</span>
            </div>
            <i />
            <div>
              <b>03</b>
              <span>安心出发</span>
            </div>
          </div>
          <div className="quick-modal-info airport-modal-info">
            <h3>咨询时告诉我们</h3>
            <ul>
              {data.questions.slice(0, 4).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <a className="button" href="/#contact">
            咨询这项服务
          </a>
        </section>
      </div>
    </div>
  );
}
