"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  generateOwnerLinksAction,
  type BulkLinksState,
} from "@/app/admin/owner-actions";

export type BulkRow = {
  id: string;
  name: string;
  /** Número de WhatsApp del local (su botón principal), si lo tiene. */
  whatsapp: string | null;
  /** Ya tiene un enlace vigente. */
  active: boolean;
  lastUsedAt: string | null;
};

const waHref = (number: string | null, text: string) => {
  const digits = number?.replace(/\D/g, "") ?? "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};
const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/**
 * Enlaces de locatarios en lote: se eligen los locales, se generan todos sus
 * enlaces y se mandan uno por uno por WhatsApp, se copian o se descargan.
 */
export function BulkOwnerLinks({ rows }: { rows: BulkRow[] }) {
  const t = useTranslations("admin.bulkLinks");
  const to = useTranslations("admin.owner");
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(rows.filter((r) => !r.active).map((r) => r.id)),
  );
  const [state, generate, busy] = useActionState<BulkLinksState, FormData>(
    generateOwnerLinksAction,
    { rows: [], failed: 0 },
  );
  const [copied, setCopied] = useState(false);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const made = state.rows.map((r) => ({ ...r, place: byId.get(r.placeId)! }));
  const message = (name: string, link: string) => to("message", { name, link });

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyAll() {
    const text = made.map((r) => `${r.place.name}: ${r.link}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* se puede descargar la planilla */
    }
  }

  function download() {
    const lines = [
      [t("csv.name"), t("csv.link"), t("csv.whatsapp"), t("csv.message")],
      ...made.map((r) => [
        r.place.name,
        r.link,
        r.place.whatsapp ?? "",
        message(r.place.name, r.link),
      ]),
    ];
    const csv = "﻿" + lines.map((l) => l.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "enlaces-locatarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 text-sm">
      {made.length === 0 ? (
        <form action={generate} className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChecked(new Set(rows.map((r) => r.id)))}
              className="border-border rounded-full border px-3 py-1 font-semibold"
            >
              {t("all")}
            </button>
            <button
              type="button"
              onClick={() =>
                setChecked(
                  new Set(rows.filter((r) => !r.active).map((r) => r.id)),
                )
              }
              className="border-border rounded-full border px-3 py-1 font-semibold"
            >
              {t("withoutLink")}
            </button>
            <button
              type="button"
              onClick={() => setChecked(new Set())}
              className="border-border rounded-full border px-3 py-1 font-semibold"
            >
              {t("none")}
            </button>
          </div>
          <ul className="divide-border border-border divide-y rounded-2xl border">
            {rows.map((r) => (
              <li key={r.id}>
                <label className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    name="placeId"
                    value={r.id}
                    checked={checked.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="size-5"
                  />
                  <span className="flex-1">
                    <span className="font-semibold">{r.name}</span>
                    <span className="text-muted block">
                      {r.active
                        ? r.lastUsedAt
                          ? t("activeUsed")
                          : t("activeUnused")
                        : t("noLink")}
                      {r.whatsapp ? ` · WhatsApp ${r.whatsapp}` : ""}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p className="text-muted">{t("warning")}</p>
          <button
            type="submit"
            disabled={busy || checked.size === 0}
            className="bg-sea-deep rounded-full px-5 py-2 font-bold text-white disabled:opacity-60"
          >
            {busy ? t("generating") : t("generate", { count: checked.size })}
          </button>
        </form>
      ) : (
        <div className="space-y-3" role="status">
          <p className="font-semibold">
            {t("ready", { count: made.length })}
            {state.failed > 0 ? ` ${t("failed", { count: state.failed })}` : ""}
          </p>
          <p className="text-muted">{t("once")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyAll}
              className="bg-sea-deep rounded-full px-4 py-1.5 font-bold text-white"
            >
              {copied ? t("copied") : t("copyAll")}
            </button>
            <button
              type="button"
              onClick={download}
              className="border-foreground rounded-full border-2 px-4 py-1 font-bold"
            >
              {t("download")}
            </button>
          </div>
          <ul className="divide-border border-border divide-y rounded-2xl border">
            {made.map((r) => (
              <li
                key={r.placeId}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <span className="font-semibold">{r.place.name}</span>
                <a
                  href={waHref(r.place.whatsapp, message(r.place.name, r.link))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-foreground rounded-full border-2 px-4 py-1 font-bold"
                >
                  {r.place.whatsapp ? t("sendTo") : t("send")}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
