"use client";

import { useState, useId } from "react";

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <div className="rounded-xl border border-white/5 bg-[#1a1a1a] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#2a2a2a]/50 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-white">{title}</span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div id={contentId} className="px-5 pb-5 space-y-4 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
}
