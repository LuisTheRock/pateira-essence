import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Organização · ESSENCE", robots: { index: false, follow: false } };

export default function Auth() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Link href="/" className="text-center font-display text-3xl tracking-[0.2em] text-gold">ESSENCE</Link>
      <p className="mt-2 text-center text-xs uppercase tracking-[0.4em] text-muted">Área da organização</p>
      <LoginForm />
      <Link href="/" className="mt-6 text-center text-xs text-muted underline">Voltar ao site</Link>
    </main>
  );
}
