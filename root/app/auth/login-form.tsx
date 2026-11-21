"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { field, label, primaryBtn } from "../ui";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="stagger mt-10 space-y-5 rounded-lg border border-line bg-card p-6">
      <div><label className={label} htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required className={`${field} bg-night`} /></div>
      <div><label className={label} htmlFor="password">Palavra-passe</label><input id="password" name="password" type="password" autoComplete="current-password" required className={`${field} bg-night`} /></div>
      {state.error && <p role="alert" className="text-sm text-[oklch(75%_.15_30)]">{state.error}</p>}
      <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "A entrar…" : "Entrar"}</button>
    </form>
  );
}
