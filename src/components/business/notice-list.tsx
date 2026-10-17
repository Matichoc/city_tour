import { getLocale, getTranslations } from "next-intl/server";
import type { Notice } from "@/lib/business";

/** Avisos destacados vigentes (de un local o generales). */
export async function NoticeList({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) return null;
  const t = await getTranslations("notices");
  const date = new Intl.DateTimeFormat(await getLocale(), {
    timeZone: "America/Santiago",
    dateStyle: "long",
  });
  return (
    <section aria-label={t("label")} className="flex flex-col gap-2">
      {notices.map((n) => (
        <article
          key={n.id}
          className="border-sun bg-sun/15 rounded-2xl border-2 p-4"
        >
          <p className="text-earth text-xs font-bold tracking-wide uppercase">
            {t("label")}
          </p>
          <h2 className="font-display mt-1 text-lg font-extrabold">
            {n.title}
          </h2>
          {n.body ? <p className="mt-1 text-sm">{n.body}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {n.linkUrl ? (
              <a
                href={n.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sea-deep font-bold underline"
              >
                {t("more")}
              </a>
            ) : null}
            <span className="text-muted text-xs">
              {t("until", { date: date.format(new Date(n.endsAt)) })}
            </span>
          </div>
        </article>
      ))}
    </section>
  );
}
