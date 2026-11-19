import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  CTA_KINDS,
  OWNER_COOKIE,
  OWNER_FIELDS,
  type OwnerField,
} from "@/lib/owner/access";
import { parseHours } from "@/lib/owner/hours";
import { getOwnerContext } from "@/lib/owner/current";
import { choosePlace, leave, submitProposal } from "@/app/local/actions";
import {
  HoursPicker,
  type HoursPickerLabels,
} from "@/components/owner/hours-picker";

const input =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2.5 text-base";
const ERRORS = [
  "expired",
  "invalid",
  "limit",
  "error",
  "cta",
  "ctaValue",
  "website",
  "instagram",
  "name",
  "hours",
] as const;

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    timeZone: "America/Santiago",
  });

export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations({ locale: "es", namespace: "owner" });
  const sp = await searchParams;
  const token = (await cookies()).get(OWNER_COOKIE)?.value;
  const ctx = await getOwnerContext();
  if (ctx?.kind === "expired") redirect("/local/renovar");
  const logout = (
    <form action={leave}>
      <button type="submit" className="text-muted text-sm underline">
        {t("logout")}
      </button>
    </form>
  );

  if (!ctx) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-extrabold">
          {t("noAccessTitle")}
        </h1>
        {sp.error === "enlace" || token ? (
          <p role="alert" className="bg-coral/10 text-coral-ink rounded-xl p-3">
            {t("badLink")}
          </p>
        ) : null}
        {sp.salio ? (
          <p role="status" className="bg-soft rounded-xl p-3">
            {t("loggedOut")}
          </p>
        ) : null}
        <p className="text-muted text-lg">{t("noAccessBody")}</p>
        <Link
          href="/local/ingresar"
          className="bg-coral inline-flex min-h-12 items-center rounded-full px-6 font-bold text-white"
        >
          {t("email.cta")}
        </Link>
      </div>
    );
  }

  // Con el correo: sin locales registrados, o con varios para elegir.
  if (ctx.kind === "email" && !ctx.session) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-extrabold">
          {ctx.places.length === 0
            ? t("email.noPlacesTitle")
            : t("email.chooseTitle")}
        </h1>
        {ctx.email ? (
          <p className="text-muted">{t("email.as", { email: ctx.email })}</p>
        ) : null}
        {ctx.places.length === 0 ? (
          <p className="text-lg">{t("email.noPlacesBody")}</p>
        ) : (
          <ul className="space-y-2">
            {ctx.places.map((p) => (
              <li key={p.placeId}>
                <form action={choosePlace}>
                  <input type="hidden" name="placeId" value={p.placeId} />
                  <button
                    type="submit"
                    className="border-border bg-surface w-full rounded-2xl border p-4 text-left font-bold"
                  >
                    {p.name}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {logout}
      </div>
    );
  }

  const session = ctx.session!;

  const pending = session.last?.status === "pending" ? session.last : null;
  // Si hay una propuesta en revisión, se sigue desde ella.
  const values = { ...session.current, ...(pending?.changes ?? {}) };
  const error = ERRORS.find((e) => e === sp.error);

  const area = (field: OwnerField, rows: number) => (
    <label className="block font-semibold">
      {t(`fields.${field}.label`)}
      <textarea
        name={field}
        rows={rows}
        maxLength={OWNER_FIELDS[field]}
        defaultValue={values[field] ?? ""}
        aria-describedby={`${field}-help`}
        className={input}
      />
      <span
        id={`${field}-help`}
        className="text-muted mt-1 block text-sm font-normal"
      >
        {t(`fields.${field}.help`)}
      </span>
    </label>
  );
  const line = (field: OwnerField, type = "text") => (
    <label className="block font-semibold">
      {t(`fields.${field}.label`)}
      <input
        name={field}
        type={type}
        maxLength={OWNER_FIELDS[field]}
        defaultValue={values[field] ?? ""}
        aria-describedby={`${field}-help`}
        className={input}
      />
      {t(`fields.${field}.help`) ? (
        <span
          id={`${field}-help`}
          className="text-muted mt-1 block text-sm font-normal"
        >
          {t(`fields.${field}.help`)}
        </span>
      ) : null}
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted text-sm font-bold">{t("title")}</p>
        <h1 className="font-display text-3xl font-extrabold">{session.name}</h1>
        <p className="text-muted mt-2">{t("intro", { name: session.name })}</p>
        {session.published ? (
          <a
            href={`/es/lugares/${encodeURIComponent(session.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sea-deep mt-2 inline-block font-semibold underline"
          >
            {t("viewPublic")} ↗
          </a>
        ) : null}
      </div>

      <details className="border-border rounded-2xl border p-4">
        <summary className="cursor-pointer font-semibold">
          {t("helpTitle")}
        </summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          {(t.raw("helpSteps") as string[]).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="text-muted mt-2 text-sm">{t("helpPhotos")}</p>
      </details>

      {sp.enviado ? (
        <p role="status" className="bg-sea-soft rounded-xl p-3 font-semibold">
          {t("sent")}
        </p>
      ) : null}
      {sp.sinCambios ? (
        <p role="status" className="bg-soft rounded-xl p-3">
          {t("nothingChanged")}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="bg-coral/10 text-coral-ink rounded-xl p-3">
          {t(`errors.${error}`)}
        </p>
      ) : null}

      {session.last ? (
        <div className="bg-soft rounded-2xl p-4" data-testid="owner-status">
          <p className="font-semibold">
            {t(`status.${session.last.status}`, {
              date: day(session.last.reviewedAt ?? session.last.createdAt),
            })}
          </p>
          {session.last.reviewNote ? (
            <p className="mt-1">
              {t("status.note", { note: session.last.reviewNote })}
            </p>
          ) : null}
          {pending ? (
            <p className="text-muted mt-1 text-sm">{t("pendingDraft")}</p>
          ) : null}
        </div>
      ) : null}

      <form action={submitProposal} className="space-y-8">
        <fieldset className="space-y-5">
          <legend className="font-display mb-3 text-xl font-extrabold">
            {t("sectionAbout")}
          </legend>
          {area("short_description", 2)}
          {area("full_description", 7)}
          <HoursPicker
            name="hours"
            initial={parseHours(values.hours) ?? []}
            labels={t.raw("hoursPicker") as HoursPickerLabels}
          />
          {area("hours_text", 2)}
          {line("address")}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-display mb-3 text-xl font-extrabold">
            {t("sectionContact")}
          </legend>
          <label className="block font-semibold">
            {t("fields.cta_kind.label")}
            <select
              name="cta_kind"
              defaultValue={values.cta_kind ?? ""}
              aria-describedby="cta_kind-help"
              className={input}
            >
              <option value="">{t("cta.none")}</option>
              {CTA_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`cta.${k}`)}
                </option>
              ))}
            </select>
            <span
              id="cta_kind-help"
              className="text-muted mt-1 block text-sm font-normal"
            >
              {t("fields.cta_kind.help")}
            </span>
          </label>
          {line("cta_value")}
          {line("instagram", "url")}
          {line("website", "url")}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="font-display mb-3 text-xl font-extrabold">
            {t("sectionSend")}
          </legend>
          <label className="block font-semibold">
            {t("name")}
            <input
              name="submitter"
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              aria-describedby="submitter-help"
              className={input}
            />
            <span
              id="submitter-help"
              className="text-muted mt-1 block text-sm font-normal"
            >
              {t("nameHelp")}
            </span>
          </label>
          <label className="block font-semibold">
            {t("note")}
            <textarea name="note" rows={2} maxLength={1000} className={input} />
          </label>
          <button
            type="submit"
            className="bg-coral min-h-12 w-full rounded-full px-6 font-bold text-white sm:w-auto"
          >
            {t("submit")}
          </button>
        </fieldset>
      </form>

      {ctx.kind === "email" ? (
        <div className="text-muted space-y-1 text-sm">
          {ctx.email ? <p>{t("email.as", { email: ctx.email })}</p> : null}
          {ctx.places.length > 1 ? (
            <form action={choosePlace}>
              <input type="hidden" name="placeId" value="" />
              <button type="submit" className="underline">
                {t("email.switch")}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
      {logout}
    </div>
  );
}
