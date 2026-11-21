export const field =
  "w-full rounded-md border border-input bg-card px-4 py-3 text-cream placeholder:text-muted/60 focus:border-gold focus:outline-none";
export const label = "mb-1.5 block text-sm tracking-wide text-muted";
export const h2 = "font-display text-3xl font-medium text-cream sm:text-4xl";
export const primaryBtn = "btn w-full rounded-full bg-gold px-8 py-3.5 text-sm font-medium uppercase tracking-widest text-night hover:brightness-110 disabled:opacity-60";
export const STATUSES = { pendente: "Pendente", confirmado: "Confirmado", lista_espera: "Lista de espera", recusado: "Recusado" } as const;
export const BADGE: Record<keyof typeof STATUSES, string> = {
  pendente: "border-[oklch(75%_.15_65/.5)] text-[oklch(80%_.13_70)]",
  confirmado: "border-[oklch(70%_.12_150/.5)] text-[oklch(78%_.12_150)]",
  lista_espera: "border-input text-muted",
  recusado: "border-[oklch(65%_.15_25/.5)] text-[oklch(72%_.14_25)]",
};
