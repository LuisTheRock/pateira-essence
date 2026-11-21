"use client";

import { useActionState, useEffect, useRef, type ComponentProps } from "react";

// Server action form that shows the action's error inside the dialog and closes it only on success.
export default function EditForm({ action, children, ...props }: Omit<ComponentProps<"form">, "action"> & { action: (s: { ok?: boolean; error?: string }, f: FormData) => Promise<{ ok?: boolean; error?: string }> }) {
  const [state, act, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.ok) ref.current?.closest("dialog")?.close(); }, [state]);
  return (
    <form ref={ref} action={act} aria-busy={pending} {...props}>
      {children}
      {state.error && <p role="alert" className="text-sm text-[oklch(75%_.15_30)]">{state.error}</p>}
    </form>
  );
}
