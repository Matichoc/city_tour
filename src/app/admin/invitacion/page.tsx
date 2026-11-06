import { getTranslations } from "next-intl/server";
import { inviteIsValid } from "@/lib/admin/team";
import { acceptInviteAction } from "@/app/admin/team-actions";

const field =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base";
const ERRORS = [
  "invalid",
  "name",
  "email",
  "weak",
  "repeat",
  "limit",
  "error",
] as const;

/** La persona invitada como admin municipal crea su cuenta. */
export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string; error?: string; enviado?: string }>;
}) {
  const t = await getTranslations({ locale: "es", namespace: "admin.invite" });
  const sp = await searchParams;
  const code = sp.codigo ?? "";

  if (sp.enviado) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="font-display text-2xl font-extrabold">
          {t("sentTitle")}
        </h1>
        <p role="status">{t("sentBody")}</p>
      </div>
    );
  }

  const valid = await inviteIsValid(code);
  if (!valid) {
    return (
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="font-display text-2xl font-extrabold">
          {t("invalidTitle")}
        </h1>
        <p className="text-muted">{t("invalidBody")}</p>
      </div>
    );
  }
  const error = ERRORS.find((e) => e === sp.error);

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-extrabold">{t("title")}</h1>
      <p className="text-muted mt-2">{t("intro")}</p>
      {error ? (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink mt-4 rounded-xl p-3 text-sm"
        >
          {t(`errors.${error}`)}
        </p>
      ) : null}
      <form action={acceptInviteAction} className="mt-6 space-y-4">
        <input type="hidden" name="codigo" value={code} />
        <label className="block text-sm font-semibold">
          {t("name")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            className={field}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("email")}
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className={field}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("password")}
          <input
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            aria-describedby="password-help"
            className={field}
          />
          <span
            id="password-help"
            className="text-muted mt-1 block font-normal"
          >
            {t("passwordHelp")}
          </span>
        </label>
        <label className="block text-sm font-semibold">
          {t("repeat")}
          <input
            name="repeat"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={field}
          />
        </label>
        <button
          type="submit"
          className="bg-sea-deep w-full rounded-full px-4 py-2.5 font-bold text-white"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
