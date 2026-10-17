import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/business";

/**
 * Invitación a comercios a sumarse a la guía. Se enciende y apaga desde
 * /admin/comercios; con un formulario configurado, el botón va directo a él.
 */
export async function BusinessInvite() {
  const settings = await getSiteSettings();
  if (!settings.businessInvite) return null;
  const t = await getTranslations("businessInvite");
  const button =
    "bg-sea-deep inline-flex min-h-11 items-center rounded-full px-5 text-sm font-extrabold text-white";
  return (
    <aside className="bg-sea-soft rounded-2xl p-4">
      <p className="font-display text-sea-deep text-lg font-extrabold">
        {t("title")}
      </p>
      <p className="mt-1 text-sm">{t("body")}</p>
      <div className="mt-3">
        {settings.businessFormUrl ? (
          <a
            href={settings.businessFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={button}
          >
            {t("cta")}
          </a>
        ) : (
          <Link href="/negocios" className={button}>
            {t("more")}
          </Link>
        )}
      </div>
    </aside>
  );
}
