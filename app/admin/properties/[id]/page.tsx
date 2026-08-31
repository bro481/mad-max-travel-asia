"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { DestinationRecord } from "../../../../db/destinations";
import type { PropertyRecord } from "../../../../db/properties";
import { AdminDataError, fetchAdminData } from "../fetch-admin-data";
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
      const payload = await fetchAdminData<PropertyEditorPayload>(
        `/api/admin/properties/${params.id}?include=destinations`,
      );
      if (!payload.property) throw new Error("房源不存在");
      setItem(payload.property);
      setDestinations(
        Array.isArray(payload.destinations) ? payload.destinations : [],
      );
    } catch (reason) {
      if (reason instanceof AdminDataError && reason.status === 401) {
        location.href = `/admin/login?return_to=${encodeURIComponent(`/admin/properties/${params.id}`)}`;
        return;
      }
      setError(reason instanceof Error ? reason.message : "房源编辑器暂时无法打开，请重试。");
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
