"use client";

import type { ComponentProps } from "react";

// Safari can ignore CSS scroll-behavior; scrollIntoView with "smooth" is more reliable.
export default function SmoothLink({ href, ...props }: ComponentProps<"a"> & { href: `#${string}` }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        history.pushState(null, "", href);
      }}
      {...props}
    />
  );
}
