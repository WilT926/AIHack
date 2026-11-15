"use client";

// Setting controls (§9): a switch, a segmented pill, a dot picker for levels,
// a select pill, and the row that lays a setting out. Ink on paper, one orange
// highlight (the switch's knob when on); levels are dots, never colours.
import type { ReactNode } from "react";
import { cn } from "./index";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="ui-toggle" onClick={() => onChange(!checked)}>
      <i className="ui-toggle__knob" aria-hidden />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="ui-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className="ui-seg__opt" onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Pick a level (1..max) by its dots. */
export function DotPicker({ value, max, onChange, label }: { value: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="ui-dotpick" role="radiogroup" aria-label={label}>
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={i + 1 === value}
          aria-label={`${i + 1} of ${max}`}
          className="ui-dotpick__dot"
          data-on={i < value}
          onClick={() => onChange(i + 1)}
        />
      ))}
    </div>
  );
}

export function SelectPill<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <span className="ui-select">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <i className="ui-select__caret" aria-hidden />
    </span>
  );
}

/** One setting: title and description on the left, its control on the right. */
export function SettingRow({ title, hint, children, className }: { title: string; hint?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("ui-setting", className)}>
      <div className="ui-setting__text">
        <span className="ui-setting__title">{title}</span>
        {hint && <span className="ui-setting__hint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
