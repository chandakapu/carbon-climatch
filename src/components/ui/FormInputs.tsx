"use client";

import React from "react";

interface NumInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  required?: boolean;
  min?: string;
  disabled?: boolean;
}

export function NumInput({
  id,
  label,
  value,
  onChange,
  suffix,
  required = true,
  min = "0.0001",
  disabled = false,
}: NumInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          required={required}
          min={min}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-describedby={`${id}-error`}
          className={`w-full rounded-lg border border-white/5 bg-[#2a2a2a] pl-4 ${
            suffix ? "pr-16" : "pr-4"
          } py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 select-none">
            {suffix}
          </span>
        )}
      </div>
      <span id={`${id}-error`} className="error-msg-inline hidden text-red-400 text-xs mt-1.5 font-medium">
        ❌ Please enter a valid number.
      </span>
    </div>
  );
}

interface SliderInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function SliderInput({ id, label, value, onChange, min = 0, max = 100 }: SliderInputProps) {
  return (
    <div>
      <label htmlFor={id} className="flex justify-between text-xs font-medium text-slate-300 mb-1.5">
        <span>{label}</span>
        <span className="text-[#0CF2A0] font-mono">{value}%</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#0CF2A0] h-2 rounded-full bg-[#2a2a2a] cursor-pointer"
      />
    </div>
  );
}

interface SelectInputProps {
  id: string;
  label: string;
  value: string | number;
  options: (string | number)[];
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function SelectInput({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
}: SelectInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-white/5 bg-[#2a2a2a] px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0CF2A0]/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
