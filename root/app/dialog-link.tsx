"use client";

import type { ComponentProps } from "react";

// Opens a server-rendered <dialog id={target}>; a <form method="dialog"> inside closes it.
export default function DialogLink({ target, ...props }: ComponentProps<"button"> & { target: string }) {
  function open() {
    const d = document.getElementById(target) as HTMLDialogElement | null;
    if (!d) return;
    // Click outside the box (on the backdrop) closes it. Rect check, since the dialog itself is the click target there.
    d.onclick = (e) => {
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    };
    d.showModal();
  }
  return <button type="button" onClick={open} {...props} />;
}
