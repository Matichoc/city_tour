import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { canModerate, countReviewNotices, getSession } from "@/lib/admin/api";
import { countPendingProposals } from "@/lib/admin/owner";
import { navGroups } from "@/lib/admin/nav";
import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import es from "@/messages/es.json";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Panel municipal: solo en español, sin la navegación del sitio público.
 * Con sesión, un menú lateral agrupado (plegable en el celular).
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  const session = await getSession();
  const title = (
    <Link
      href="/admin"
      className="font-display text-sea-deep text-lg font-extrabold"
    >
      {t("title")}
    </Link>
  );

  // Los componentes de cliente del panel leen sus textos aquí: el panel va
  // fuera del layout con idiomas.
  if (!session)
    return (
      <NextIntlClientProvider locale="es" messages={{ admin: es.admin }}>
        <div className="bg-background min-h-dvh">
          <header className="border-border bg-surface border-b">
            <div className="mx-auto w-full max-w-5xl px-4 py-3">{title}</div>
          </header>
          <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
        </div>
      </NextIntlClientProvider>
    );

  // Números junto a «Propuestas» y «Comentarios».
  const [reviews, proposals] = await Promise.all([
    countReviewNotices(session.token),
    countPendingProposals(session.token),
  ]);
  const groups = navGroups({
    canEdit: canModerate(session),
    superadmin: session.superadmin,
  });

  return (
    <NextIntlClientProvider locale="es" messages={{ admin: es.admin }}>
      <div className="bg-background min-h-dvh md:flex">
        <aside className="border-border bg-surface border-b md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:block">
            {title}
            <Suspense>
              <AdminNav groups={groups} badges={{ reviews, proposals }}>
                <p className="text-muted px-3 text-sm">
                  {session.superadmin
                    ? t("role.superadmin")
                    : t(`role.${session.role}`)}
                </p>
                <div className="mt-2 flex flex-col gap-1 text-sm font-semibold">
                  <a
                    href="/es"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sea-deep hover:bg-sea-soft rounded-xl px-3 py-2"
                  >
                    {t("openSite")} ↗
                  </a>
                  <a
                    href="/es/como-usar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sea-deep hover:bg-sea-soft rounded-xl px-3 py-2"
                  >
                    {t("nav.guide")} ↗
                  </a>
                  <form action={signOut} className="px-3 pt-2">
                    <button
                      type="submit"
                      className="border-border rounded-full border px-3 py-1.5 text-sm font-semibold"
                    >
                      {t("signOut")}
                    </button>
                  </form>
                </div>
              </AdminNav>
            </Suspense>
          </div>
        </aside>
        <main className="mx-auto w-full max-w-5xl min-w-0 px-4 py-6">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
