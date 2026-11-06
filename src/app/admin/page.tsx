import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  canModerate,
  countReviewNotices,
  ENTITIES,
  getSession,
  listBusinessPlaces,
  listEntities,
} from "@/lib/admin/api";
import { countPendingProposals } from "@/lib/admin/owner";
import { inviteState, listInvites } from "@/lib/admin/team";
import { businessDue } from "@/lib/admin/nav";
import { freshness } from "@/lib/freshness";

type Pending = { key: string; count: number; href: string; action: string };

/** Inicio del panel: lo que hay por hacer y los accesos más usados. */
export default async function AdminHome() {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin.home" });
  const canEdit = canModerate(session);

  // Cada dato es independiente: si uno falla, el inicio igual se muestra.
  const [proposals, reviews, businesses, entities, invites] = await Promise.all(
    [
      countPendingProposals(session.token),
      countReviewNotices(session.token),
      listBusinessPlaces(session.token).catch(() => []),
      Promise.all(
        ENTITIES.map((k) => listEntities(session.token, k).catch(() => [])),
      ),
      session.superadmin
        ? listInvites(session).catch(() => [])
        : Promise.resolve([]),
    ],
  );
  const due = businessDue(
    businesses
      .filter((b) => b.publication !== "archived")
      .map((b) => freshness(b.infoUpdatedAt)),
  );
  const unverified = entities
    .flat()
    .filter(
      (e) => e.publication === "published" && e.verification !== "verified",
    ).length;
  const openInvites = invites.filter((i) =>
    ["open", "claimed"].includes(inviteState(i)),
  ).length;

  const pending: Pending[] = (
    [
      {
        key: "proposals",
        count: proposals,
        href: "/admin/propuestas",
        action: "review",
      },
      {
        key: "reviews",
        count: reviews,
        href: "/admin/comentarios?filtro=nuevos",
        action: "review",
      },
      {
        key: "overdue",
        count: due.overdue + due.never,
        href: "/admin/comercios#actualizacion",
        action: "remind",
      },
      {
        key: "soon",
        count: due.soon,
        href: "/admin/comercios#actualizacion",
        action: "remind",
      },
      {
        key: "unverified",
        count: unverified,
        href: "/admin/fichas",
        action: "open",
      },
      {
        key: "invites",
        count: openInvites,
        href: "/admin/equipo",
        action: "open",
      },
    ] satisfies Pending[]
  ).filter((p) => p.count > 0);

  const quick = [
    ...(canEdit
      ? [
          { key: "newBusiness", href: "/admin/comercios/nuevo" },
          { key: "ownerLinks", href: "/admin/comercios/enlaces" },
          { key: "bulkImport", href: "/admin/comercios/importar" },
        ]
      : []),
    ...(session.superadmin
      ? [{ key: "inviteAdmin", href: "/admin/equipo" }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-sea-deep text-3xl font-extrabold">
          {t("title")}
        </h1>
        <p className="text-muted mt-1">{t("intro")}</p>
      </header>

      <section aria-labelledby="pendientes">
        <h2
          id="pendientes"
          className="font-display text-sea-deep text-xl font-extrabold"
        >
          {t("pendingTitle")}
        </h2>
        {pending.length === 0 ? (
          <p
            role="status"
            className="bg-sea-soft text-sea-deep mt-3 rounded-2xl p-4 font-semibold"
          >
            {t("allClear")}
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">
            {pending.map((p) => (
              <li
                key={p.key}
                className="border-border bg-surface flex items-center justify-between gap-4 rounded-2xl border p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-coral min-w-10 rounded-full px-2.5 py-1 text-center text-lg font-extrabold text-white">
                    {p.count}
                  </span>
                  <span className="font-semibold">
                    {t(`pending.${p.key}`, { count: p.count })}
                  </span>
                </div>
                <Link
                  href={p.href}
                  className="bg-sea-deep shrink-0 rounded-full px-4 py-1.5 text-sm font-bold text-white"
                >
                  {t(`action.${p.action}`)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {quick.length > 0 && (
        <section aria-labelledby="accesos">
          <h2
            id="accesos"
            className="font-display text-sea-deep text-xl font-extrabold"
          >
            {t("quickTitle")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quick.map((q) => (
              <Link
                key={q.key}
                href={q.href}
                className="border-border bg-surface text-sea-deep rounded-full border px-5 py-2 font-bold"
              >
                {t(`quick.${q.key}`)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="text-muted text-sm">
        {t("help")}{" "}
        <a
          href="/es/como-usar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sea-deep font-semibold underline"
        >
          {t("helpLink")} ↗
        </a>
      </p>
    </div>
  );
}
