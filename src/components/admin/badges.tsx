import { getTranslations } from "next-intl/server";
import type { EntitySummary, Verification } from "@/lib/admin/api";

const VERIFICATION_STYLE: Record<Verification, string> = {
  pending: "bg-earth-soft text-earth",
  verified: "bg-field-soft text-field-deep",
  outdated: "bg-border text-muted",
};

const pill = "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold";

export async function VerificationBadge({ status }: { status: Verification }) {
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  return (
    <span className={`${pill} ${VERIFICATION_STYLE[status]}`}>
      {t(`verification.${status}`)}
    </span>
  );
}

export async function PublicationBadge({
  status,
}: {
  status: EntitySummary["publication"];
}) {
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  return (
    <span
      className={`${pill} ${status === "published" ? "bg-sea-soft text-sea-deep" : "bg-border text-muted"}`}
    >
      {t(`publication.${status}`)}
    </span>
  );
}

export const formatDate = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("es-CL", {
        timeZone: "America/Santiago",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso))
    : null;
