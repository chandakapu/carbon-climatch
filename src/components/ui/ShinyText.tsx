"use client";

import React from "react";

interface ShinyTextProps {
  text: string;
  className?: string;
}

export default function ShinyText({ text, className = "" }: ShinyTextProps) {
  return (
    <span className={`relative overflow-hidden inline-block ${className}`}>
      {text}
      <span className="absolute inset-0 shiny-text-overlay pointer-events-none" />
    </span>
  );
}
