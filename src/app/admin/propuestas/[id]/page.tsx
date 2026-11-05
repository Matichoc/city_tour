import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { canModerate, getSession } from "@/lib/admin/api";
import { getProposal } from "@/lib/admin/owner";
import { reviewProposalAction } from "@/app/admin/owner-actions";
import { OWNER_FIELDS, type OwnerField } from "@/lib/owner/access";

export default async function ProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const t = await getTranslations({
    locale: "es",
    namespace: "admin.proposals",
  });
  const sp = await searchParams;
  const found = await getProposal(session, id).catch(() => null);
  if (!found) notFound();
  const { proposal: p, current } = found;
  const changed = (Object.keys(OWNER_FIELDS) as OwnerField[]).filter(
    (f) => f in p.changes,
  );
  const show = (v: string | null | undefined) =>
    v ? (
      <span className="whitespace-pre-line">{v}</span>
    ) : (
      <span className="text-muted italic">{t("emptyValue")}</span>
    );

  return (
    <div className="space-y-6">
      <Link
        href="/admin/propuestas"
        className="text-sea-deep text-sm font-semibold"
      >
        {t("back")}
      </Link>
      <div>
        <h1 className="font-display text-2xl font-extrabold">{p.placeName}</h1>
        <p className="text-muted text-sm">
          {t("by", {
            name: p.submitterName,
            date: new Date(p.createdAt).toLocaleString("es-CL", {
              timeZone: "America/Santiago",
            }),
          })}{" "}
          · {t(`status.${p.status}`)}
        </p>
        {p.note ? (
          <p className="bg-soft mt-2 rounded-xl p-3 text-sm">
            {t("localNote", { note: p.note })}
          </p>
        ) : null}
      </div>
      {sp.error ? (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink rounded-xl p-3 text-sm"
        >
          {p.status === "pending" ? t("error") : t("notPending")}
        </p>
      ) : null}

      <div className="border-border overflow-x-auto rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-soft">
            <tr>
              <th scope="col" className="p-3">
                {t("field")}
              </th>
              <th scope="col" className="p-3">
                {t("current")}
              </th>
              <th scope="col" className="p-3">
                {t("proposed")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {changed.map((f) => (
              <tr key={f} className="align-top">
                <th scope="row" className="p-3 font-semibold">
                  {t(`fields.${f}`)}
                </th>
                <td className="text-muted p-3">{show(current[f])}</td>
                <td className="bg-sea-soft/40 p-3">{show(p.changes[f])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {"hours_text" in p.changes ? (
        <p className="bg-earth-soft text-earth rounded-xl p-3 text-sm">
          {t("hoursReminder")}{" "}
          <Link
            href={`/admin/comercios/${p.placeId}#horarios`}
            className="font-semibold underline"
          >
            {t("openPlace")}
          </Link>
        </p>
      ) : null}

      {p.status === "pending" && canModerate(session) ? (
        <form action={reviewProposalAction} className="space-y-3">
          <input type="hidden" name="id" value={p.id} />
          <label className="block text-sm font-semibold">
            {t("reviewNote")}
            <textarea
              name="note"
              rows={2}
              maxLength={1000}
              className="border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              name="decision"
              value="aprobar"
              className="bg-sea-deep rounded-full px-5 py-2 font-bold text-white"
            >
              {t("approve")}
            </button>
            <button
              name="decision"
              value="rechazar"
              className="border-border rounded-full border px-5 py-2 font-semibold"
            >
              {t("reject")}
            </button>
          </div>
        </form>
      ) : p.reviewNote ? (
        <p className="text-sm">{p.reviewNote}</p>
      ) : null}
    </div>
  );
}
