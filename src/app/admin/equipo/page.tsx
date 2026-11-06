import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/admin/api";
import {
  inviteState,
  listInvites,
  listTeam,
  type StaffInvite,
  type TeamMember,
} from "@/lib/admin/team";
import {
  revokeInviteAction,
  setMemberActiveAction,
} from "@/app/admin/team-actions";
import { InviteBox } from "@/components/admin/invite-box";

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Santiago",
  });

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    guardado?: string;
    revocada?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const t = await getTranslations({ locale: "es", namespace: "admin.team" });
  const tr = await getTranslations({ locale: "es", namespace: "admin.role" });
  const sp = await searchParams;
  const [team, invites] = await Promise.all([
    listTeam(session).catch(() => [] as TeamMember[]),
    session.superadmin
      ? listInvites(session).catch(() => [] as StaffInvite[])
      : Promise.resolve([] as StaffInvite[]),
  ]);
  const admins = team.filter((m) => m.role === "admin" && m.active).length;
  const errors = ["permiso", "save", "limit"] as const;
  const error = errors.find((e) => e === sp.error);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1 text-sm">{t("intro")}</p>
      </div>
      {error ? (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink rounded-xl p-3 text-sm"
        >
          {t(`errors.${error}`)}
        </p>
      ) : null}
      {sp.guardado || sp.revocada ? (
        <p
          role="status"
          className="bg-field-soft text-field-deep rounded-xl p-3 text-sm"
        >
          {t(sp.revocada ? "revoked" : "saved")}
        </p>
      ) : null}

      <section className="border-border bg-surface rounded-2xl border p-4">
        <h2 className="font-display mb-3 text-lg font-extrabold">
          {t("members")}
        </h2>
        <ul className="divide-border divide-y text-sm" data-testid="team">
          {team.map((m) => (
            <li
              key={m.userId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-bold">{m.name ?? m.email}</p>
                <p className="text-muted">
                  {m.email} · {tr(m.role)} ·{" "}
                  {t("since", { date: day(m.createdAt) })}
                  {m.active ? "" : ` · ${t("inactive")}`}
                </p>
              </div>
              {session.superadmin && m.role !== "superadmin" ? (
                <form action={setMemberActiveAction}>
                  <input type="hidden" name="userId" value={m.userId} />
                  <input
                    type="hidden"
                    name="active"
                    value={m.active ? "0" : "1"}
                  />
                  <button className="border-border rounded-full border px-4 py-1.5 font-semibold">
                    {m.active ? t("deactivate") : t("activate")}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {session.superadmin ? (
        <section className="border-border bg-surface space-y-4 rounded-2xl border p-4">
          <div>
            <h2 className="font-display text-lg font-extrabold">
              {t("inviteTitle")}
            </h2>
            <p className="text-muted mt-1 text-sm">
              {t("inviteIntro", { count: admins, max: 2 })}
            </p>
          </div>
          <InviteBox />
          {invites.length > 0 ? (
            <ul className="divide-border divide-y text-sm">
              {invites.map((i) => {
                const state = inviteState(i);
                return (
                  <li
                    key={i.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-2"
                  >
                    <span>
                      <span className="font-semibold">
                        {i.note ?? t("noNote")}
                      </span>
                      {" · "}
                      {t(`state.${state}`, { email: i.claimedEmail ?? "" })}
                      {" · "}
                      {t("expires", { date: day(i.expiresAt) })}
                    </span>
                    {state === "open" || state === "claimed" ? (
                      <form action={revokeInviteAction}>
                        <input type="hidden" name="id" value={i.id} />
                        <button className="border-border rounded-full border px-3 py-1 font-semibold">
                          {t("revoke")}
                        </button>
                      </form>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ) : (
        <p className="text-muted text-sm">{t("onlySuper")}</p>
      )}
    </div>
  );
}
