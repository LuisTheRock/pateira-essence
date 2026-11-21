import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { logout, updateReservation, updateReservationInfo } from "../actions";
import { requireOrganizer } from "../../lib/supabase";
import DialogLink from "../dialog-link";
import { BADGE, field, h2, label as lbl, STATUSES } from "../ui";
import EditForm from "./edit-form";
import SaveButton from "./save-button";

export const metadata: Metadata = { title: "Pré-reservas · Pateira Essence", robots: { index: false, follow: false } };

const PAGE = 25;
type Params = { status?: string; q?: string; page?: string };
type Status = keyof typeof STATUSES;
const dialogCls = "m-auto max-h-[85svh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-line bg-card p-6 text-cream backdrop:bg-black/70";
const action = "btn rounded-full border border-input px-3 py-1.5 text-xs uppercase tracking-widest text-gold hover:brightness-125";
const save = "btn rounded-full bg-gold px-8 py-3 text-xs font-medium uppercase tracking-widest text-night hover:brightness-110";
const when = (d: string) => new Date(d).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

async function List({ params }: { params: Promise<Params> }) {
  await connection(); // request-time only: Supabase reads the clock, which can't be prerendered
  const sp = await params;
  const status = sp.status && (sp.status === "todos" || sp.status in STATUSES) ? sp.status : "pendente";
  const q = (sp.q ?? "").replace(/[,()%*_\\"]/g, " ").trim().slice(0, 60); // strip chars that break PostgREST's or() syntax
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);

  const supabase = await requireOrganizer(); // proxy.ts already did the network check on this request

  let rows = supabase.from("reservations").select("*", { count: "exact" });
  if (status !== "todos") rows = rows.eq("status", status);
  if (q) rows = rows.or(`nome.ilike.%${q}%,instagram.ilike.%${q}%,telemovel.ilike.%${q}%`);
  const [{ data, count, error }, qtds, tabCounts] = await Promise.all([
    rows.order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1),
    // same filters as `rows`, summed in SQL (see reservations_bracelets in schema.sql)
    supabase.rpc("reservations_bracelets", { p_status: status, p_q: q }),
    supabase.rpc("reservations_counts"),
  ]);
  if (error) return <p role="alert" className="text-sm text-muted">Erro ao carregar: {error.message}</p>;

  const counts: Record<string, number> = Object.fromEntries((tabCounts.data ?? []).map((r: { status: string; n: number }) => [r.status, Number(r.n)]));
  const bracelets = Number(qtds.data ?? 0);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (o: Params) => {
    const p = new URLSearchParams({ status, ...(q && { q }), ...o });
    if (p.get("page") === "1") p.delete("page");
    return `/admin?${p}`;
  };
  const tabs: [string, string, number][] = [...Object.entries(STATUSES).map(([k, t]) => [k, t, (counts[k] ?? 0)] as [string, string, number]), ["todos", "Todos", total]];

  return (
    <>
      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {tabs.map(([k, t, n]) => (
          <Link key={k} href={href({ status: k, page: "1" })} aria-current={status === k ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-widest transition-colors duration-200 ${status === k ? "border-gold bg-gold text-night" : "border-input text-muted hover:text-cream"}`}>
            {t} <span className="opacity-70">{n}</span>
          </Link>
        ))}
      </nav>

      <form action="/admin" className="mt-4 flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={q} type="search" placeholder="Pesquisar nome, Instagram ou telemóvel" aria-label="Pesquisar" className={`${field} bg-night`} />
        <button className="btn rounded-md border border-input px-5 text-xs uppercase tracking-widest text-gold hover:brightness-125">Pesquisar</button>
      </form>

      <p className="mt-6 text-sm text-muted">{count ?? 0} {count === 1 ? "pedido" : "pedidos"} · {bracelets} {bracelets === 1 ? "pulseira" : "pulseiras"}{q && <> para “{q}”</>}</p>

      {data.length === 0 ? (
        <p className="mt-4 rounded-lg border border-line bg-card p-6 text-center text-muted">Sem pedidos.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-widest text-muted">
              <tr>
                <th className="hidden px-4 py-3 font-normal sm:table-cell">Data</th>
                <th className="px-4 py-3 font-normal">Nome</th>
                <th className="hidden px-4 py-3 font-normal sm:table-cell">Instagram</th>
                <th className="hidden px-4 py-3 font-normal md:table-cell">Telemóvel</th>
                <th className="px-4 py-3 font-normal">Qtd</th>
                <th className="hidden px-4 py-3 font-normal sm:table-cell">Estado</th>
                <th className="px-4 py-3 font-normal"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-night/60">
                  <td className="hidden whitespace-nowrap px-4 py-3 text-muted sm:table-cell">{when(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="font-display text-lg text-cream">{r.nome}{r.notas && <span role="img" aria-label="Tem notas" className="ml-1.5 text-xs text-gold">●</span>}</p>
                    <p className="text-xs text-muted sm:hidden">@{r.instagram}</p>
                    <span className={`mt-2 inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs sm:hidden ${BADGE[r.status as Status]}`}>{STATUSES[r.status as Status]}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell"><a className="text-gold underline" href={`https://www.instagram.com/${encodeURIComponent(r.instagram)}/`}>@{r.instagram}</a></td>
                  <td className="hidden px-4 py-3 text-muted md:table-cell">{r.telemovel}</td>
                  <td className="px-4 py-3 tabular-nums">{r.qtd}</td>
                  <td className="hidden px-4 py-3 sm:table-cell"><span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs ${BADGE[r.status as Status]}`}>{STATUSES[r.status as Status]}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <DialogLink target={`e-${r.id}`} className={action}>Editar</DialogLink>
                      <DialogLink target={`s-${r.id}`} className={action}>Estado</DialogLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          {page > 1 ? <Link className="text-gold underline" href={href({ page: String(page - 1) })}>← Anterior</Link> : <span />}
          <span>Página {page} de {pages}</span>
          {page < pages ? <Link className="text-gold underline" href={href({ page: String(page + 1) })}>Seguinte →</Link> : <span />}
        </div>
      )}

      {data.map((r) => (
        <div key={r.id}>
          <dialog id={`e-${r.id}`} aria-label={`Editar ${r.nome}`} className={dialogCls}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-display text-2xl">Editar dados</p><p className="mt-1 text-xs text-muted">Pedido de {when(r.created_at)}</p></div>
              <form method="dialog"><button aria-label="Fechar" className="btn -mr-2 flex h-10 w-10 items-center justify-center rounded-md text-2xl text-muted hover:text-gold">×</button></form>
            </div>
            <EditForm action={updateReservationInfo} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={r.id} />
              <div><label className={lbl} htmlFor={`n-${r.id}`}>Nome completo</label><input id={`n-${r.id}`} name="nome" required maxLength={120} defaultValue={r.nome} className={`${field} bg-night`} /></div>
              <div><label className={lbl} htmlFor={`i-${r.id}`}>Instagram</label><input id={`i-${r.id}`} name="instagram" required maxLength={60} defaultValue={r.instagram} className={`${field} bg-night`} /></div>
              <div><label className={lbl} htmlFor={`t-${r.id}`}>Telemóvel</label><input id={`t-${r.id}`} name="telemovel" type="tel" inputMode="numeric" pattern="\d{9}" title="9 dígitos, só números" required maxLength={9} defaultValue={r.telemovel} className={`${field} bg-night`} /></div>
              <div><label className={lbl} htmlFor={`q-${r.id}`}>Quantidade de pulseiras</label><input id={`q-${r.id}`} name="qtd" type="number" min={1} max={10} required defaultValue={r.qtd} className={`${field} bg-night`} /></div>
              <button className={save}>Guardar</button>
            </EditForm>
          </dialog>

          <dialog id={`s-${r.id}`} aria-label={`Estado de ${r.nome}`} className={dialogCls}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-display text-2xl">{r.nome}</p><p className="mt-1 text-xs text-muted">Estado e notas internas</p></div>
              <form method="dialog"><button aria-label="Fechar" className="btn -mr-2 flex h-10 w-10 items-center justify-center rounded-md text-2xl text-muted hover:text-gold">×</button></form>
            </div>
            <form action={updateReservation} className="mt-5 space-y-4">
              <input type="hidden" name="id" value={r.id} />
              <fieldset className="flex flex-wrap gap-2">
                <legend className="sr-only">Estado</legend>
                {Object.entries(STATUSES).map(([k, t]) => (
                  <label key={k} className="cursor-pointer">
                    <input type="radio" name="status" value={k} defaultChecked={r.status === k} className="peer sr-only" />
                    <span className="block rounded-full border border-input px-4 py-2 text-xs uppercase tracking-widest text-muted transition-colors duration-200 hover:text-cream peer-checked:border-gold peer-checked:bg-gold peer-checked:text-night peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50">{t}</span>
                  </label>
                ))}
              </fieldset>
              <textarea name="notas" defaultValue={r.notas ?? ""} maxLength={1000} rows={3} placeholder="Notas internas" aria-label="Notas internas" className={`${field} bg-night`} />
              <SaveButton className={save}>Guardar</SaveButton>
            </form>
          </dialog>
        </div>
      ))}
    </>
  );
}

export default function Admin({ searchParams }: { searchParams: Promise<Params> }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className={h2}>Pré-reservas</h1>
        <form action={logout}><button className="text-xs text-muted underline">Sair</button></form>
      </div>
      <Suspense fallback={<p className="text-muted">A carregar…</p>}><List params={searchParams} /></Suspense>
    </main>
  );
}
