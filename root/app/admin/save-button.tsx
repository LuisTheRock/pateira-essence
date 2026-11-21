"use client";

import type { ComponentProps } from "react";

// Closes the surrounding dialog once the form is valid; the click's default action still submits it.
export default function SaveButton(props: ComponentProps<"button">) {
  return <button {...props} onClick={(e) => e.currentTarget.form?.checkValidity() && e.currentTarget.closest("dialog")?.close()} />;
}
