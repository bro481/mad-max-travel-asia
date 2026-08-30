"use client";

import { useEffect, useState } from "react";
import {
  defaultInquirySettings,
  type InquirySettings,
} from "../../db/site-settings";

let cached: InquirySettings | null = null;
let pending: Promise<InquirySettings> | null = null;

function load() {
  if (cached) return Promise.resolve(cached);
  if (!pending)
    pending = fetch("/api/site-settings?key=inquiry")
      .then((response) => response.ok ? response.json() : defaultInquirySettings)
      .then((value) => (cached = value))
      .catch(() => defaultInquirySettings)
      .finally(() => { pending = null; });
  return pending;
}

export function useInquirySettings() {
  const [settings, setSettings] = useState<InquirySettings>(
    cached || defaultInquirySettings,
  );
  useEffect(() => { void load().then(setSettings); }, []);
  return settings;
}

