"use client";

import { useEffect } from "react";

/**
 * AriaSync automatically monitors user-interacted input, select, and textarea fields
 * and synchronizes their visual `:user-invalid` state with the programmatic `aria-invalid` attribute.
 * This ensures that screen reader users receive error announcements only after interaction,
 * preventing preemptive validation noise on initial focus.
 */
export default function AriaSync() {
  useEffect(() => {
    const updateAriaState = (el: HTMLElement) => {
      if (!el || typeof el.matches !== "function") return;
      if (!el.matches("input, textarea, select")) return;

      const isUserInvalid = el.matches(":user-invalid");
      if (isUserInvalid) {
        el.setAttribute("aria-invalid", "true");
      } else {
        el.removeAttribute("aria-invalid");
      }
    };

    const handleBlur = (e: FocusEvent) => {
      updateAriaState(e.target as HTMLElement);
    };

    const handleFocus = (e: FocusEvent) => {
      updateAriaState(e.target as HTMLElement);
    };

    const handleInput = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!el || typeof el.matches !== "function") return;
      if (!el.matches("input, textarea, select")) return;

      // Update on input only if already marked invalid, 
      // allowing it to clear dynamically as the user corrects their input.
      if (el.hasAttribute("aria-invalid")) {
        updateAriaState(el);
      }
    };

    // Capture phase (true) is required for blur and focus as they do not bubble
    document.addEventListener("blur", handleBlur, true);
    document.addEventListener("focus", handleFocus, true);
    document.addEventListener("input", handleInput, true);

    return () => {
      document.removeEventListener("blur", handleBlur, true);
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("input", handleInput, true);
    };
  }, []);

  return null;
}
