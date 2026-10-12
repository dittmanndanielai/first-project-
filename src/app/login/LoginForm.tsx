"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <label htmlFor="password" className="vh">
        Password
      </label>
      <div className="qc-box" style={{ background: "var(--fill)" }}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="qc-input"
          placeholder="Password"
        />
      </div>
      <button type="submit" className="ctrl ctrl-main on" style={{ height: 46, justifyContent: "center" }} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {state.error ? (
        <div role="alert" style={{ fontSize: 13, color: "var(--danger)", textAlign: "center" }}>
          {state.error}
        </div>
      ) : null}
    </form>
  );
}
