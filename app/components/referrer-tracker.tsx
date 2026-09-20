"use client";

import { useEffect } from "react";
import { captureReferrerFromUrl } from "./referrer-attribution";

export function ReferrerTracker() {
  useEffect(() => {
    void captureReferrerFromUrl();
  }, []);
  return null;
}
