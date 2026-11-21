"use client";

import Script from "next/script";
import { useActionState, useEffect } from "react";
import { submitReservation } from "./actions";
import DialogLink from "./dialog-link";
import Quantity from "./quantity";
import { field, label, primaryBtn } from "./ui";

export default function ReservationForm() {
  const [state, action, pending] = useActionState(submitReservation, {});
  const v = state.values;
  // a Turnstile token works once: get a fresh one after every submit
  useEffect(() => { (window as { turnstile?: { reset(): void } }).turnstile?.reset(); }, [state]);

  if (state.ok)
    return (
      <div role="status" className="enter-in mt-8 rounded-lg border border-line bg-card p-6 text-center">
        <p className="font-display text-2xl text-gold">Pedido recebido</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">Obrigado! A organização vai contactar-te pelo Instagram. Lembra-te: a pré-reserva não garante pulseira.</p>
      </div>
    );

  return (
    <form action={action} noValidate className="mt-8 space-y-5 rounded-lg border border-line bg-card p-6">
      <div><label className={label} htmlFor="nome">Nome completo</label><input id="nome" name="nome" required maxLength={120} defaultValue={v?.nome} className={field} /></div>
      <div>
        <label className={label} htmlFor="instagram">Instagram</label>
        <div className="flex">
          <span className="flex items-center rounded-l-md border border-r-0 border-input bg-card px-3 text-muted">@</span>
          <input id="instagram" name="instagram" required maxLength={60} defaultValue={v?.instagram} className={`${field} rounded-l-none`} />
        </div>
      </div>
      <div><label className={label} htmlFor="telemovel">Telemóvel</label><input id="telemovel" name="telemovel" type="tel" inputMode="numeric" pattern="\d{9}" title="9 dígitos, só números" required maxLength={9} onInput={(e) => (e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ""))} defaultValue={v?.telemovel} className={field} /></div>
      <div>
        <label className={label} htmlFor="qtd">Quantidade de pulseiras</label>
        <Quantity />
        <p className="mt-1.5 text-xs text-muted">Máximo de 10 por pedido.</p>
      </div>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <label className="flex items-start gap-3 text-sm leading-relaxed text-muted">
        <input type="checkbox" name="ack" required className="mt-1 accent-[oklch(80%_.11_82)]" />
        <span>Li e compreendi como o meu nome, Instagram e telemóvel são tratados para gerir a pré-reserva. <DialogLink target="dados" className="text-gold underline">Saber mais</DialogLink></span>
      </label>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} data-theme="dark" />
      {state.error && <p role="alert" className="text-sm text-[oklch(75%_.15_30)]">{state.error}</p>}
      <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "A enviar…" : "Enviar pré-reserva"}</button>
      <p className="text-center text-xs text-muted">Ao enviar, confirmas que compreendes que a pré-reserva não garante pulseira.</p>
    </form>
  );
}
