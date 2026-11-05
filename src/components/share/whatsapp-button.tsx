"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { track } from "@/lib/analytics";

/** Enlace de WhatsApp con el mensaje ya escrito (la persona elige a quién). */
export function whatsappHref(message: string, url: string): string {
  const text = url ? `${message}\n${url}` : message;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

const noSubscribe = () => () => {};

/**
 * Dirección de la página actual: vacía en el servidor y la real en el
 * navegador. `withQuery: false` la entrega sin parámetros.
 */
export function usePageUrl({ withQuery = true } = {}): string {
  return useSyncExternalStore(
    noSubscribe,
    () =>
      withQuery
        ? window.location.href
        : window.location.origin + window.location.pathname,
    () => "",
  );
}

/**
 * «Enviar por WhatsApp»: abre WhatsApp con el mensaje y el enlace listos. Sin
 * `url`, comparte la página actual.
 */
export function WhatsAppButton({
  message,
  url,
  className = "",
}: {
  message: string;
  url?: string;
  className?: string;
}) {
  const t = useTranslations("common");
  const here = usePageUrl();
  const link = url ?? here;

  return (
    <a
      href={whatsappHref(message, link)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        track("share", { path: window.location.pathname, via: "whatsapp" })
      }
      className={`border-foreground hover:bg-soft inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-5 text-sm font-bold transition active:scale-95 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5 text-[#128c7e]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      {t("whatsapp")}
    </a>
  );
}
