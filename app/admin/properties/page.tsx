"use client";

import { useCallback, useEffect, useState } from "react";
import type { DestinationRecord } from "../../../db/destinations";
import type { PropertyRecord } from "../../../db/properties";
import { AdminDataError, fetchAdminData } from "./fetch-admin-data";
import { PropertyList } from "./property-list";

type PropertyPayload = {
  properties: PropertyRecord[];
  destinations: DestinationRecord[];
};

export default function PropertiesPage() {
  const [items, setItems] = useState<PropertyRecord[] | null>(null);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const load = useCallback(async () => {
    setError("");
    try {
      const payload = await fetchAdminData<PropertyPayload>(
        "/api/admin/properties?include=destinations",
      );
      if (!Array.isArray(payload.properties)) throw new Error("房源数据格式异常");
      setItems(payload.properties);
      setDestinations(
        Array.isArray(payload.destinations) ? payload.destinations : [],
      );
    } catch (reason) {
      if (reason instanceof AdminDataError && reason.status === 401) {
        location.href = "/admin/login?return_to=%2Fadmin%2Fproperties";
        return;
      }
      setError(reason instanceof Error ? reason.message : "房源后台暂时无法连接，请重试。");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  if (items)
    return <PropertyList initialItems={items} destinations={destinations} />;

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
        "正在进入房源后台…"
      )}
    </div>
  );
}
