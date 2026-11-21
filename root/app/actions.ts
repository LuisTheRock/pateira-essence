"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { serviceClient, createClient, requireOrganizer } from "../lib/supabase";
import { check, str } from "../lib/validate";
import { STATUSES } from "./ui";

export type FormState = { ok?: boolean; error?: string; values?: Record<string, string> };

// Cloudflare Turnstile. Without a secret it is skipped in dev only; in production a missing key rejects everyone.
async function humanOk(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({ secret, response: token }) });
    return (await r.json()).success === true;
  } catch { return false; }
}

export async function submitReservation(_: FormState, f: FormData): Promise<FormState> {
  if (str(f, "website")) return { ok: true }; // honeypot: pretend success to bots
  const { values, qtd, error: bad } = check(f, true);
  if (bad) return { error: bad, values };
  if (!(await humanOk(str(f, "cf-turnstile-response")))) return { error: "Não conseguimos confirmar que não és um robô. Atualiza a página e tenta novamente.", values };

  const { error } = await serviceClient().from("reservations").insert({ ...values, qtd });
  if (error?.code === "REJ00") return { error: "Já existe um pedido com este telemóvel. Fala com a organização no Instagram.", values }; // same text for every rejection: reveals nothing about the other request
  if (error) return { error: "Não foi possível registar este pedido. Tenta novamente ou fala com a organização no Instagram.", values };
  return { ok: true };
}

export async function login(_: { error?: string }, f: FormData): Promise<{ error?: string }> {
  const { error } = await (await createClient()).auth.signInWithPassword({ email: str(f, "email"), password: String(f.get("password") ?? "") });
  if (error) return { error: "Email ou palavra-passe incorretos." };
  redirect("/admin");
}

export async function logout() {
  await (await createClient()).auth.signOut();
  redirect("/auth");
}

export async function updateReservation(f: FormData) {
  const supabase = await requireOrganizer();
  const status = str(f, "status");
  const notas = str(f, "notas");
  if (!Object.hasOwn(STATUSES, status) || notas.length > 1000) throw new Error("Dados inválidos");
  const { data, error } = await supabase.from("reservations").update({ status, notas: notas || null }).eq("id", str(f, "id")).select("id");
  if (error) throw new Error(error.message);
  if (!data.length) throw new Error("Pedido não encontrado");
  revalidatePath("/admin");
}

export async function updateReservationInfo(_: { ok?: boolean; error?: string }, f: FormData): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await requireOrganizer();
  const { values, qtd, error: invalid } = check(f);
  if (invalid) return { error: invalid };
  const { data, error } = await supabase.from("reservations").update({ ...values, qtd }).eq("id", str(f, "id")).select("id");
  if (error?.code === "23505") return { error: "Esse telemóvel já tem outro pedido." }; // unique index on telemovel
  if (error || !data.length) return { error: "Não foi possível guardar. Tenta novamente." };
  revalidatePath("/admin");
  return { ok: true };
}
