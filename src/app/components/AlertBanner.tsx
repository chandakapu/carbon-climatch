"use client";

import { useState } from "react";
import type { RegulatoryEvent } from "@/types";

interface AlertBannerProps {
  events: RegulatoryEvent[];
}

export default function AlertBanner({ events }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = events.filter((e) => !dismissed.includes(e.id));

  if (visible.length === 0) return null;

  function daysUntil(dateStr: string): number {
    const now = new Date();
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function urgencyColor(days: number): string {
    if (days <= 30) return "border-red-500 bg-red-500/10 text-red-300";
    if (days <= 90) return "border-amber-500 bg-amber-500/10 text-amber-300";
    return "border-emerald-500 bg-emerald-500/10 text-emerald-300";
  }

  function urgencyBadge(days: number): { label: string; cls: string } {
    if (days <= 30) return { label: "CRITICAL", cls: "bg-red-500 text-white" };
    if (days <= 90) return { label: "WARNING", cls: "bg-amber-500 text-black" };
    return { label: "UPCOMING", cls: "bg-emerald-600 text-white" };
  }

  function typeBadge(type: "domestic" | "international"): string {
    return type === "international"
      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
      : "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  }

  return (
    <div className="space-y-3">
      {visible.map((event) => {
        const days = daysUntil(event.date);
        const urgency = urgencyColor(days);
        const badge = urgencyBadge(days);
        const date = new Date(event.date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <div
            key={event.id}
            className={`relative flex items-start gap-4 rounded-xl border px-5 py-4 transition-all ${urgency}`}
          >
            {/* Icon */}
            <div className="mt-0.5 shrink-0">
              <svg
                className="h-5 w-5 opacity-80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadge(event.type)}`}>
                  {event.type === "international" ? "International" : "Domestic"}
                </span>
                <span className="text-xs opacity-60 font-mono">
                  {date} · {days > 0 ? `${days} days away` : "Today"}
                </span>
              </div>
              <p className="font-semibold text-sm leading-snug">{event.title}</p>
              <p className="text-xs opacity-70 mt-0.5 line-clamp-2">{event.description}</p>
              {event.affected_sectors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.affected_sectors.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-wide opacity-80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Dismiss */}
            <button
              aria-label="Dismiss alert"
              onClick={() => setDismissed((d) => [...d, event.id])}
              className="absolute top-3 right-3 opacity-40 hover:opacity-80 transition-opacity"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
