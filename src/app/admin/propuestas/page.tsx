import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/admin/api";
import { listProposals, type Proposal } from "@/lib/admin/owner";
import type { OwnerField } from "@/lib/owner/access";

const when = (iso: string) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Santiago",
  });

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ aprobada?: string; rechazada?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({
    locale: "es",
    namespace: "admin.proposals",
  });
  const sp = await searchParams;
  const { pending, reviewed } = await listProposals(session).catch(() => ({
    pending: [] as Proposal[],
    reviewed: [] as Proposal[],
  }));

  const fields = (p: Proposal) =>
    (Object.keys(p.changes) as OwnerField[])
      .filter((f) => f !== "cta_value")
      .map((f) => t(`fields.${f}`))
      .join(" · ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1 text-sm">{t("intro")}</p>
      </div>
      {sp.aprobada ? (
        <p
          role="status"
          className="bg-field-soft text-field-deep rounded-xl p-3 text-sm"
        >
          {t("approved")}
        </p>
      ) : null}
      {sp.rechazada ? (
        <p role="status" className="bg-soft rounded-xl p-3 text-sm">
          {t("rejected")}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold">{t("pending")}</h2>
        {pending.length === 0 ? (
          <p className="text-muted text-sm">{t("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {pending.map((p) => (
              <li
                key={p.id}
                className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
              >
                <div>
                  <p className="font-bold">{p.placeName}</p>
                  <p className="text-muted text-sm">
                    {t("by", {
                      name: p.submitterName,
                      date: when(p.createdAt),
                    })}
                  </p>
                  <p className="text-sm">{fields(p)}</p>
                </div>
                <Link
                  href={`/admin/propuestas/${p.id}`}
                  className="bg-sea-deep rounded-full px-4 py-1.5 text-sm font-bold text-white"
                >
                  {t("review")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold">
            {t("reviewed")}
          </h2>
          <ul className="divide-border divide-y text-sm">
            {reviewed.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap justify-between gap-2 py-2"
              >
                <span>
                  <span className="font-semibold">{p.placeName}</span> ·{" "}
                  {fields(p)}
                </span>
                <span className="text-muted">
                  {t(`status.${p.status}`)} ·{" "}
                  {when(p.reviewedAt ?? p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
