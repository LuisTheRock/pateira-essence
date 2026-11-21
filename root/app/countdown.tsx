"use client";

import { useEffect, useState } from "react";

// Lisbon is UTC+0 on 31 Dec (winter), so this is local midnight at the start of the day.
const TARGET = Date.parse("2026-12-31T00:00:00Z");

const units = [["Dias", 86400], ["Horas", 3600], ["Min", 60], ["Seg", 1]] as const;

export default function Countdown() {
  // null until mounted: avoids a server/client time mismatch
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = now === null ? null : Math.max(0, Math.floor((TARGET - now) / 1000));

  return (
    <div className="flex gap-4 sm:gap-8" role="timer" aria-label="Contagem decrescente para 31 de dezembro">
      {units.map(([name, secs], i) => {
        const v = left === null ? "--" : String(Math.floor(left / secs) % (i === 0 ? Infinity : i === 1 ? 24 : 60)).padStart(2, "0");
        return (
          <div key={name} className="flex w-14 flex-col items-center sm:w-20">
            <span className="font-display text-4xl font-medium tabular-nums text-gold sm:text-6xl">{v}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted">{name}</span>
          </div>
        );
      })}
    </div>
  );
}
