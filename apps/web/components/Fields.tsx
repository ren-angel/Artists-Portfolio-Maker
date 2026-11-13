import type { ReactNode } from "react";
import { t, type Lang, type Key } from "../lib/copy";
export function Field({
  label,
  value,
  onChange,
  max = 120,
  area = false,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  max?: number;
  area?: boolean;
}) {
  return (
    <label>
      {label}
      {area ? (
        <textarea
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (v: T) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}
export function translated<T extends Key>(
  l: Lang,
  keys: readonly T[],
): [T, string][] {
  return keys.map((k) => [k, t(l, k)]);
}
export function Shift({
  index,
  total,
  move,
  l,
  children,
}: {
  index: number;
  total: number;
  move: (index: number) => void;
  l: Lang;
  children?: ReactNode;
}) {
  return (
    <div className="actions compact">
      <button
        type="button"
        aria-label={t(l, "up")}
        disabled={index === 0}
        onClick={() => move(index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        aria-label={t(l, "down")}
        disabled={index === total - 1}
        onClick={() => move(index + 1)}
      >
        ↓
      </button>
      {children}
    </div>
  );
}
export function reorder<T>(list: T[], from: number, to: number) {
  if (
    to >= 0 &&
    to < list.length &&
    from >= 0 &&
    from < list.length &&
    from !== to
  )
    list.splice(to, 0, list.splice(from, 1)[0]);
}
