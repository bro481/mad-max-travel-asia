"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const returnTo =
      new URLSearchParams(location.search).get("return_to") || "/admin";
    setError("");
    setLoading(true);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, returnTo }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "密码不正确");
      return;
    }
    location.href = payload.returnTo || "/admin";
  }

  return (
    <div className="admin-login-wrap">
      <form className="admin-login-card" onSubmit={submit}>
        <p>Mad Max Travel Asia</p>
        <h1>后台登录</h1>
        <label>
          后台密码
          <input
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="输入后台密码"
            type="password"
          />
        </label>
        {error ? <span>{error}</span> : null}
        <button disabled={loading || !password.trim()}>
          {loading ? "正在登录…" : "进入后台"}
        </button>
      </form>
    </div>
  );
}
