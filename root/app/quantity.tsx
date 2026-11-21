"use client";

import { useState } from "react";

const MIN = 1;
const MAX = 10;
const step = "btn flex h-12 w-12 items-center justify-center rounded-md text-2xl text-cream hover:text-gold disabled:text-muted/40 disabled:active:scale-100";

export default function Quantity() {
  const [n, setN] = useState(MIN);
  return (
    <div className="flex items-center rounded-md border border-input bg-night px-2">
      <button type="button" aria-label="Menos uma pulseira" className={step} disabled={n <= MIN} onClick={() => setN(n - 1)}>−</button>
      <input id="qtd" name="qtd" value={n} readOnly aria-live="polite" className="min-w-0 flex-1 bg-transparent py-3 text-center text-3xl font-medium tabular-nums text-cream focus:outline-none" />
      <button type="button" aria-label="Mais uma pulseira" className={step} disabled={n >= MAX} onClick={() => setN(n + 1)}>+</button>
    </div>
  );
}
