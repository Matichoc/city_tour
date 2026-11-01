/**
 * Avisos destacados y configuración del sitio para el público. Se leen con la
 * clave pública (la RLS deja ver solo avisos vigentes) y se cachean con sus
 * etiquetas, que el panel invalida al guardar.
 */
import { supabaseConfig } from "@/lib/db/content-source";

export const NOTICES_TAG = "notices";
export const SETTINGS_TAG = "settings";

export type Notice = {
  id: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  endsAt: string;
};

export type SiteSettings = {
  businessFormUrl: string | null;
  businessInvite: boolean;
};

const DEFAULT_SETTINGS: SiteSettings = {
  businessFormUrl: null,
  businessInvite: true,
};

async function publicGet<T>(query: string, tag: string): Promise<T | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${query}`, {
      headers: { apikey: cfg.key },
      next: { revalidate: 300, tags: [tag] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[${tag}] No se pudo leer.`, error);
    return null;
  }
}

type NoticeRow = {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  ends_at: string;
};

const toNotice = (r: NoticeRow): Notice => ({
  id: r.id,
  title: r.title,
  body: r.body,
  linkUrl: r.link_url,
  endsAt: r.ends_at,
});

/**
 * Avisos vigentes de un local (por su slug) o, sin slug, los generales.
 * La vigencia la filtra la RLS; aquí se vuelve a filtrar por si la página
 * quedó en caché después del vencimiento.
 */
export async function listNotices(placeSlug?: string): Promise<Notice[]> {
  const query = placeSlug
    ? "notices?select=id,title,body,link_url,ends_at,places!inner(slug)" +
      `&places.slug=eq.${encodeURIComponent(placeSlug)}&order=ends_at`
    : "notices?select=id,title,body,link_url,ends_at&place_id=is.null&order=ends_at";
  const rows = (await publicGet<NoticeRow[]>(query, NOTICES_TAG)) ?? [];
  const now = Date.now();
  return rows.map(toNotice).filter((n) => Date.parse(n.endsAt) > now);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await publicGet<
    { business_form_url: string | null; business_invite: boolean }[]
  >("site_settings?select=business_form_url,business_invite", SETTINGS_TAG);
  const r = rows?.[0];
  return r
    ? {
        businessFormUrl: r.business_form_url,
        businessInvite: r.business_invite,
      }
    : DEFAULT_SETTINGS;
}
