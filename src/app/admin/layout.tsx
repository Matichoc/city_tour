import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { countReviewNotices, getSession } from "@/lib/admin/api";
import { countPendingProposals } from "@/lib/admin/owner";
import { signOut } from "@/app/admin/actions";
import es from "@/messages/es.json";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/** Panel municipal: solo en español, sin la navegación del sitio público. */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  const session = await getSession();
  // Comentarios nuevos por revisar: un número junto a «Comentarios».
  const [notices, proposals] = session
    ? await Promise.all([
        countReviewNotices(session.token),
        countPendingProposals(session.token),
      ])
    : [0, 0];
  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="font-display text-sea-deep text-lg font-extrabold"
          >
            {t("title")}
          </Link>
          {session && (
            <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              <Link href="/admin" className="text-sea-deep">
                {t("nav.entities")}
              </Link>
              <Link href="/admin/comentarios" className="text-sea-deep">
                {t("nav.reviews")}
                {notices > 0 && (
                  <span
                    aria-label={t("nav.reviewsBadge", { count: notices })}
                    className="bg-coral ml-1.5 rounded-full px-2 py-0.5 text-xs font-extrabold text-white"
                  >
                    {notices >= 100 ? "99+" : notices}
                  </span>
                )}
              </Link>
              <Link href="/admin/comercios" className="text-sea-deep">
                {t("nav.business")}
              </Link>
              <Link href="/admin/equipo" className="text-sea-deep">
                {t("nav.team")}
              </Link>
              <Link href="/admin/propuestas" className="text-sea-deep">
                {t("nav.proposals")}
                {proposals > 0 && (
                  <span
                    aria-label={t("nav.proposalsBadge", { count: proposals })}
                    className="bg-coral ml-1.5 rounded-full px-2 py-0.5 text-xs font-extrabold text-white"
                  >
                    {proposals >= 100 ? "99+" : proposals}
                  </span>
                )}
              </Link>
              <a
                href="/es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sea-deep"
              >
                {t("openSite")} ↗
              </a>
            </nav>
          )}
          {session && (
            <form action={signOut} className="flex items-center gap-3">
              <span className="text-muted text-sm">
                {session.superadmin
                  ? t("role.superadmin")
                  : t(`role.${session.role}`)}
              </span>
              <button
                type="submit"
                className="border-border rounded-full border px-3 py-1.5 text-sm font-semibold"
              >
                {t("signOut")}
              </button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {/* Los componentes de cliente del panel (fotos, importación) leen sus
            textos aquí: el panel va fuera del layout con idiomas. */}
        <NextIntlClientProvider locale="es" messages={{ admin: es.admin }}>
          {children}
        </NextIntlClientProvider>
      </main>
    </div>
  );
}
