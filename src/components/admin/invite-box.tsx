"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { createInviteAction, type InviteState } from "@/app/admin/team-actions";
import { whatsappHref } from "@/components/share/whatsapp-button";

/** Genera la invitación de un admin municipal y la muestra una sola vez. */
export function InviteBox() {
  const t = useTranslations("admin.team");
  const [state, create, busy] = useActionState<InviteState, FormData>(
    createInviteAction,
    { link: null, error: null },
  );
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* se puede copiar a mano */
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <form action={create} className="flex flex-wrap items-end gap-2">
        <label className="block min-w-60 flex-1 font-semibold">
          {t("note")}
          <input
            name="note"
            maxLength={120}
            placeholder={t("notePlaceholder")}
            className="border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base font-normal"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="bg-sea-deep rounded-full px-4 py-2 font-bold text-white disabled:opacity-60"
        >
          {t("invite")}
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="bg-coral/10 text-coral-ink rounded-xl p-3">
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
      {state.link ? (
        <div className="bg-sea-soft space-y-2 rounded-xl p-3" role="status">
          <p className="font-bold">{t("linkTitle")}</p>
          <input
            readOnly
            value={state.link}
            aria-label={t("linkTitle")}
            onFocus={(e) => e.currentTarget.select()}
            className="border-border bg-surface w-full rounded-lg border px-2 py-1.5 font-mono text-xs"
          />
          <p className="text-muted">{t("linkOnce")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="bg-sea-deep rounded-full px-4 py-1.5 font-bold text-white"
            >
              {copied ? t("copied") : t("copy")}
            </button>
            <a
              href={whatsappHref(t("message", { link: state.link }), "")}
              target="_blank"
              rel="noopener noreferrer"
              className="border-foreground rounded-full border-2 px-4 py-1 font-bold"
            >
              {t("whatsapp")}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
