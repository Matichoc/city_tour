/**
 * Panel: enlace del locatario y propuestas de cambio (migración 0031), con el
 * token de quien está conectado. La base decide quién puede (admin o editor).
 */
import { rest, type Session } from "@/lib/admin/api";
import type { OwnerValues, ProposalStatus } from "@/lib/owner/access";

const enc = encodeURIComponent;

/** Genera el enlace del local (corta el anterior). Devuelve el código, una vez. */
export async function createOwnerKey(
  session: Session,
  placeId: string,
): Promise<string> {
  return rest<string>(session.token, "rpc/create_owner_key", {
    method: "POST",
    body: JSON.stringify({ p_place: placeId }),
  });
}

export async function revokeOwnerKeys(session: Session, placeId: string) {
  await rest<number>(session.token, "rpc/revoke_owner_keys", {
    method: "POST",
    body: JSON.stringify({ p_place: placeId }),
  });
}

export type OwnerKeyStatus = {
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
} | null;

/** Enlace vigente del local, o null. Si la migración no está, también null. */
export async function getOwnerKeyStatus(
  session: Session,
  placeId: string,
): Promise<OwnerKeyStatus> {
  try {
    const [row] = await rest<
      { created_at: string; expires_at: string; last_used_at: string | null }[]
    >(session.token, "rpc/owner_key_status", {
      method: "POST",
      body: JSON.stringify({ p_place: placeId }),
    });
    return row
      ? {
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          lastUsedAt: row.last_used_at,
        }
      : null;
  } catch {
    return null;
  }
}

export type Proposal = {
  id: string;
  placeId: string;
  placeName: string;
  placeSlug: string;
  status: ProposalStatus;
  changes: Partial<OwnerValues>;
  submitterName: string;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

type Row = {
  id: string;
  place_id: string;
  status: ProposalStatus;
  changes: Partial<OwnerValues>;
  submitter_name: string;
  note: string | null;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  place: {
    slug: string;
    translations: { locale: string; name: string }[];
  } | null;
};
const SELECT =
  "id,place_id,status,changes,submitter_name,note,created_at,reviewed_at,review_note," +
  "place:places(slug,translations:place_translations(locale,name))";

const toProposal = (r: Row): Proposal => ({
  id: r.id,
  placeId: r.place_id,
  placeSlug: r.place?.slug ?? "",
  placeName:
    r.place?.translations.find((t) => t.locale === "es")?.name ??
    r.place?.slug ??
    "",
  status: r.status,
  changes: r.changes,
  submitterName: r.submitter_name,
  note: r.note,
  createdAt: r.created_at,
  reviewedAt: r.reviewed_at,
  reviewNote: r.review_note,
});

/** Pendientes y las últimas revisadas (las reemplazadas no se muestran). */
export async function listProposals(session: Session): Promise<{
  pending: Proposal[];
  reviewed: Proposal[];
}> {
  const [pending, reviewed] = await Promise.all([
    rest<Row[]>(
      session.token,
      `place_change_requests?select=${SELECT}&status=eq.pending&order=created_at.asc&limit=100`,
    ),
    rest<Row[]>(
      session.token,
      `place_change_requests?select=${SELECT}&status=in.(approved,rejected)&order=reviewed_at.desc&limit=20`,
    ),
  ]);
  return {
    pending: pending.map(toProposal),
    reviewed: reviewed.map(toProposal),
  };
}

export async function countPendingProposals(token: string): Promise<number> {
  try {
    const rows = await rest<{ id: string }[]>(
      token,
      "place_change_requests?select=id&status=eq.pending&limit=100",
    );
    return rows.length;
  } catch {
    return 0;
  }
}

/** Una propuesta y los datos de la ficha hoy, para comparar. */
export async function getProposal(
  session: Session,
  id: string,
): Promise<{ proposal: Proposal; current: OwnerValues } | null> {
  const [row] = await rest<Row[]>(
    session.token,
    `place_change_requests?select=${SELECT}&id=eq.${enc(id)}&limit=1`,
  );
  if (!row) return null;
  const [place] = await rest<
    (Omit<OwnerValues, "short_description" | "full_description"> & {
      translations: {
        locale: string;
        short_description: string | null;
        full_description: string | null;
      }[];
    })[]
  >(
    session.token,
    `places?select=hours_text,address,cta_kind,cta_value,instagram,website,` +
      `translations:place_translations(locale,short_description,full_description)` +
      `&id=eq.${enc(row.place_id)}&limit=1`,
  );
  const es = place?.translations.find((t) => t.locale === "es");
  const current: OwnerValues = {
    short_description: es?.short_description ?? null,
    full_description: es?.full_description ?? null,
    hours_text: place?.hours_text ?? null,
    address: place?.address ?? null,
    cta_kind: place?.cta_kind ?? null,
    cta_value: place?.cta_value ?? null,
    instagram: place?.instagram ?? null,
    website: place?.website ?? null,
  };
  return { proposal: toProposal(row), current };
}

/** Aprueba (se aplica a la ficha y queda validada) o rechaza. */
export async function reviewProposal(
  session: Session,
  id: string,
  approve: boolean,
  note: string | null,
) {
  await rest<null>(session.token, "rpc/review_owner_proposal", {
    method: "POST",
    body: JSON.stringify({ p_id: id, p_approve: approve, p_note: note }),
  });
}
