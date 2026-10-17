"use client";

import { useRef, useState, type ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { useDismiss } from "@/lib/use-dismiss";

type Href = ComponentProps<typeof Link>["href"];

export type FilterItem = {
  key: string;
  label: string;
  href: Href;
  active: boolean;
  /** Cantidad opcional que se muestra a la derecha. */
  count?: number;
};

/**
 * Lista desplegable de filtros: un botón con el nombre del filtro y su valor
 * actual que abre una lista de enlaces. Cada opción es un enlace (la página se
 * filtra en el servidor), así funciona también sin recordar estado.
 */
export function FilterMenu({
  label,
  valueLabel,
  items,
  icon,
  active,
}: {
  label: string;
  valueLabel: string;
  items: FilterItem[];
  icon: React.ReactNode;
  /** Hay un valor elegido distinto de «todo». */
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), root, trigger);

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 text-left transition ${
          active
            ? "border-sea bg-sea-soft"
            : "border-border bg-surface hover:border-sea"
        }`}
      >
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? "bg-sea text-white" : "bg-sea-soft text-sea-deep"}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-muted block text-[11px] leading-none font-bold tracking-wide uppercase">
            {label}
          </span>
          <span className="mt-1 block truncate text-sm font-extrabold">
            {valueLabel}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`text-sea size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          aria-label={label}
          className="border-border bg-surface absolute inset-x-0 z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border p-1.5 shadow-xl"
        >
          {items.map((it) => (
            <li key={it.key}>
              <Link
                href={it.href}
                onClick={() => setOpen(false)}
                aria-current={it.active ? "true" : undefined}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-xl px-3 text-sm font-bold transition ${
                  it.active ? "bg-sea text-white" : "hover:bg-sea-soft/70"
                }`}
              >
                <span>{it.label}</span>
                {it.count !== undefined ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${it.active ? "bg-white/25" : "bg-sea-soft text-sea-deep"}`}
                  >
                    {it.count}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
