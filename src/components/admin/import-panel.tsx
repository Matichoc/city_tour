"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  applyImport,
  previewImport,
  type ApplyState,
  type PreviewState,
} from "@/app/admin/places-actions";

type Category = { slug: string; name: string };

const field =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base";
const primary =
  "bg-sea-deep rounded-full px-5 py-2 font-bold text-white disabled:opacity-60";

const CHIP: Record<string, string> = {
  new: "bg-field-soft text-field-deep",
  update: "bg-sun/30 text-earth",
  confirm: "bg-sea-soft text-sea-deep",
  link: "bg-sea-soft text-sea-deep",
  same: "bg-border text-muted",
  skip: "bg-coral/10 text-coral-ink",
};

/** Importación en dos pasos: revisar (no guarda nada) y luego importar. */
export function ImportPanel({
  initialUrl,
  categories,
  isAdmin,
}: {
  initialUrl: string;
  categories: Category[];
  isAdmin: boolean;
}) {
  const t = useTranslations("admin.places.import");
  const [preview, previewAction, reviewing] = useActionState<
    PreviewState,
    FormData
  >(previewImport, { status: "idle" });
  const [applied, applyAction, applying] = useActionState<ApplyState, FormData>(
    applyImport,
    { status: "idle" },
  );

  const ready = preview.status === "ready" ? preview : null;
  const actionable =
    ready?.items.filter((i) => i.status !== "same" && i.status !== "skip") ??
    [];

  return (
    <div className="space-y-6">
      <form
        action={previewAction}
        className="border-border bg-surface space-y-3 rounded-2xl border p-4"
      >
        <label className="block text-sm font-semibold">
          {t("url")}
          <input
            name="planilla"
            type="url"
            defaultValue={initialUrl}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            className={field}
          />
          <span className="text-muted text-xs font-normal">{t("urlHelp")}</span>
        </label>
        <p className="text-muted text-sm">{t("or")}</p>
        <label className="block text-sm font-semibold">
          {t("file")}
          <input
            name="archivo"
            type="file"
            accept=".csv,text/csv"
            className="mt-1 block text-sm font-normal"
          />
        </label>
        <button type="submit" disabled={reviewing} className={primary}>
          {reviewing ? t("reviewing") : t("review")}
        </button>
        {preview.status === "error" && (
          <p role="alert" className="text-coral-ink text-sm font-bold">
            {t(`errors.${preview.error}`)}
          </p>
        )}
      </form>

      {ready && applied.status !== "done" && (
        <form action={applyAction} className="space-y-4">
          {"url" in ready.source ? (
            <input type="hidden" name="planilla" value={ready.source.url} />
          ) : (
            <input type="hidden" name="csv" value={ready.source.csv} />
          )}
          <p className="text-sm font-semibold">
            {t("summary", { count: ready.items.length })}
          </p>
          {ready.unknownColumns.length > 0 && (
            <p className="bg-sun/30 text-earth rounded-xl p-3 text-sm">
              {t("unknownColumns", { list: ready.unknownColumns.join(", ") })}
            </p>
          )}
          {actionable.length === 0 && (
            <p className="text-muted text-sm">{t("nothing")}</p>
          )}
          <ul className="space-y-2">
            {ready.items.map((i) => {
              const can = i.status !== "same" && i.status !== "skip";
              return (
                <li
                  key={i.key}
                  className="border-border bg-surface rounded-xl border p-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {can && (
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          name="incluir"
                          value={i.key}
                          defaultChecked={!i.needsCategory}
                          className="size-5"
                          aria-label={`${t("include")}: ${i.name}`}
                        />
                      </label>
                    )}
                    <b>{i.name || "—"}</b>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${CHIP[i.status]}`}
                    >
                      {t(`status.${i.status}`)}
                    </span>
                    {i.slug && (
                      <a
                        href={`/es/lugares/${i.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sea-deep text-xs underline"
                      >
                        {t("open")} ↗
                      </a>
                    )}
                  </div>
                  {i.status === "update" && (
                    <p className="text-muted mt-1 text-xs">
                      {t("changed", {
                        fields: i.changed
                          .map((f) => t(`fields.${f}`))
                          .join(", "),
                      })}
                    </p>
                  )}
                  {i.reason && (
                    <p className="text-coral-ink mt-1 text-xs">
                      {t(`reason.${i.reason}`)}
                    </p>
                  )}
                  {i.offer && (
                    <p className="text-muted mt-1 text-xs">
                      {t("offered", { offer: i.offer })}
                      {i.locality
                        ? ` · ${t("where", { locality: i.locality })}`
                        : ""}
                    </p>
                  )}
                  {i.duplicates > 0 && (
                    <p className="text-muted mt-1 text-xs">
                      {t("duplicates", { count: i.duplicates })}
                    </p>
                  )}
                  {i.needsCategory && (
                    <select
                      name={`cat_${i.key}`}
                      defaultValue=""
                      aria-label={t("chooseCategory")}
                      className={`${field} sm:max-w-xs`}
                    >
                      <option value="" disabled>
                        {t("chooseCategory")}
                      </option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              );
            })}
          </ul>
          {actionable.length > 0 && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    name="publicar"
                    disabled={!isAdmin}
                    className="size-5"
                  />
                  {t("publish")}
                </label>
                <p className="text-muted mt-1 text-xs">{t("draftNote")}</p>
              </div>
              <button type="submit" disabled={applying} className={primary}>
                {applying ? t("applying") : t("apply")}
              </button>
            </>
          )}
          {applied.status === "error" && (
            <p role="alert" className="text-coral-ink text-sm font-bold">
              {t(`errors.${applied.error === "denied" ? "denied" : "source"}`)}
            </p>
          )}
        </form>
      )}

      {applied.status === "done" && (
        <section
          role="status"
          className="bg-field-soft text-field-deep space-y-2 rounded-2xl p-4 text-sm"
        >
          <h2 className="font-display text-lg font-extrabold">
            {t("resultTitle")}
          </h2>
          <ul className="list-disc pl-5">
            {(
              [
                "created",
                "updated",
                "confirmed",
                "linked",
                "same",
                "skipped",
              ] as const
            ).map((k) => (
              <li key={k}>{t(`result.${k}`, { count: applied.result[k] })}</li>
            ))}
          </ul>
          {applied.result.created > 0 && <p>{t("newFiles")}</p>}
          {applied.result.errors.length > 0 && (
            <div className="text-coral-ink">
              <b>{t("errorsTitle")}</b>
              <ul className="list-disc pl-5">
                {applied.result.errors.map((e) => (
                  <li key={e.name}>
                    {e.name}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
