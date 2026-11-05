"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  generateOwnerLinkAction,
  revokeOwnerLinkAction,
  type OwnerLinkState,
} from "@/app/admin/owner-actions";
import { whatsappHref } from "@/components/share/whatsapp-button";
import type { OwnerKeyStatus } from "@/lib/admin/owner";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });

/**
 * Enlace personal del local: generarlo (se muestra una sola vez, para copiarlo
 * o mandarlo por WhatsApp), ver si está vigente y cortarlo.
 */
export function OwnerAccess({
  placeId,
  placeName,
  status,
  revoked,
}: {
  placeId: string;
  placeName: string;
  status: OwnerKeyStatus;
  revoked: boolean;
}) {
  const t = useTranslations("admin.owner");
  const [state, generate, busy] = useActionState<OwnerLinkState, FormData>(
    generateOwnerLinkAction,
    { link: null, error: false },
  );
  const [copied, setCopied] = useState(false);
  const active = Boolean(status || state.link);

  async function copy() {
    if (!state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles: se puede copiar a mano */
    }
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted">{t("intro")}</p>
      {revoked && !state.link ? (
        <p role="status" className="bg-soft rounded-xl p-3">
          {t("revoked")}
        </p>
      ) : null}
      {status && !state.link ? (
        <p data-testid="owner-key-status">
          {t("active", {
            created: date(status.createdAt),
            expires: date(status.expiresAt),
          })}{" "}
          {status.lastUsedAt
            ? t("lastUsed", { date: date(status.lastUsedAt) })
            : t("neverUsed")}
        </p>
      ) : !state.link ? (
        <p className="text-muted">{t("none")}</p>
      ) : null}

      {state.error ? (
        <p role="alert" className="bg-coral/10 text-coral-ink rounded-xl p-3">
          {t("error")}
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
              href={whatsappHref(
                t("message", { name: placeName, link: state.link }),
                "",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="border-foreground rounded-full border-2 px-4 py-1 font-bold"
            >
              {t("whatsapp")}
            </a>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <form action={generate}>
          <input type="hidden" name="placeId" value={placeId} />
          <button
            type="submit"
            disabled={busy}
            className="bg-sea-deep rounded-full px-4 py-1.5 font-bold text-white disabled:opacity-60"
          >
            {active ? t("regenerate") : t("generate")}
          </button>
        </form>
        {active ? (
          <form action={revokeOwnerLinkAction}>
            <input type="hidden" name="placeId" value={placeId} />
            <button
              type="submit"
              className="border-border rounded-full border px-4 py-1.5 font-semibold"
            >
              {t("revoke")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
