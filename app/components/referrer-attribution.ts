"use client";

export type SavedReferrer = {
  id: string;
  name: string;
  firstUrl: string;
  firstAt: string;
  expiresAt: number;
};

const STORAGE_KEY = "madmax_referrer";
const VISIT_PREFIX = "madmax_referrer_visit_";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const VISIT_COOLDOWN = 24 * 60 * 60 * 1000;

export function readSavedReferrer() {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "null",
    ) as SavedReferrer | null;
    if (!saved?.id || !saved.expiresAt || saved.expiresAt <= Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return saved;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function referrerPayload() {
  const saved = readSavedReferrer();
  return saved
    ? {
        referrerId: saved.id,
        referrerName: saved.name,
        referrerFirstUrl: saved.firstUrl,
        referrerFirstAt: saved.firstAt,
      }
    : {};
}

export async function captureReferrerFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const rawRef = url.searchParams.get("ref");
  const current = readSavedReferrer();
  if (!rawRef) return;

  const ref = rawRef.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  if (!ref) return;

  const visitKey = `${VISIT_PREFIX}${ref}`;
  const lastVisit = Number(window.localStorage.getItem(visitKey) || 0);
  const countVisit = Date.now() - lastVisit > VISIT_COOLDOWN;
  const firstAt = new Date().toISOString();
  const firstUrl = `${url.pathname}${url.search}`;

  try {
    const response = await fetch("/api/referrers/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref, firstAt, firstUrl, countVisit }),
    });
    const data = await response.json();
    if (!data?.active || !data?.referrer?.id) {
      if (current?.id === ref) window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (countVisit) window.localStorage.setItem(visitKey, String(Date.now()));
    const next: SavedReferrer = {
      id: data.referrer.id,
      name: data.referrer.name,
      firstUrl,
      firstAt,
      expiresAt: Date.now() + THIRTY_DAYS,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Referrer capture should never interrupt normal browsing.
  }
}
