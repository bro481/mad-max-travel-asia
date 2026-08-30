"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { DestinationRecord } from "../../../../db/destinations";
import type { PropertyRecord } from "../../../../db/properties";
import { PropertyEditor } from "../property-editor";

type PropertyEditorPayload = {
  property: PropertyRecord;
  destinations: DestinationRecord[];
};

export default function EditProperty() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<PropertyRecord | null>(null);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(
        `/api/admin/properties/${params.id}?include=destinations`,
        { signal: AbortSignal.timeout(12000), cache: "no-store" },
      );
      if (response.status === 401) {
        location.href = `/admin/login?return_to=${encodeURIComponent(`/admin/properties/${params.id}`)}`;
        return;
      }
      if (!response.ok) throw new Error(`服务器返回 ${response.status}`);
      const payload = (await response.json()) as PropertyEditorPayload;
      if (!payload.property) throw new Error("房源不存在");
      setItem(payload.property);
      setDestinations(
        Array.isArray(payload.destinations) ? payload.destinations : [],
      );
    } catch (reason) {
      setError(
        reason instanceof DOMException && reason.name === "TimeoutError"
          ? "房源编辑器连接超时，请重试。"
          : "房源编辑器暂时无法打开，请重试。",
      );
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  if (item)
    return <PropertyEditor initial={item} destinations={destinations} />;

  return (
    <div className="admin-loading">
      {error ? (
        <div style={{ display: "grid", gap: 16, justifyItems: "start" }}>
          <b>{error}</b>
          <button
            type="button"
            className="admin-button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            重新加载
          </button>
        </div>
      ) : (
        "正在加载房源…"
      )}
    </div>
  );
}
