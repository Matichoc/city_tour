/**
 * Supabase Storage por la API REST (sin librerías). Los archivos de los
 * comentarios van en un bucket privado: se leen con enlaces firmados que solo
 * se pueden crear para lo aprobado (o con el token del personal).
 */
import type { SupabaseConfig } from "@/lib/db/content-source";
import { MEDIA_BUCKET } from "@/lib/media-policy";

const authHeaders = (cfg: SupabaseConfig, token?: string) => ({
  apikey: cfg.key,
  ...(token ? { authorization: `Bearer ${token}` } : {}),
});

/** Enlaces firmados de lectura; los que la RLS no permite quedan fuera. */
export async function signedUrls(
  cfg: SupabaseConfig,
  paths: string[],
  opts: { token?: string; expiresIn?: number; init?: RequestInit } = {},
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const res = await fetch(`${cfg.url}/storage/v1/object/sign/${MEDIA_BUCKET}`, {
    method: "POST",
    headers: {
      ...authHeaders(cfg, opts.token),
      "content-type": "application/json",
    },
    body: JSON.stringify({ expiresIn: opts.expiresIn ?? 86400, paths }),
    ...opts.init,
  });
  if (!res.ok) throw new Error(`Storage ${res.status}: ${await res.text()}`);
  const rows = (await res.json()) as {
    path: string | null;
    signedURL: string | null;
    error: string | null;
  }[];
  for (const r of rows)
    if (r.path && r.signedURL)
      out.set(r.path, `${cfg.url}/storage/v1${r.signedURL}`);
  return out;
}

/** Enlace firmado para que el navegador suba un archivo a una ruta registrada. */
export async function signedUploadUrl(
  cfg: SupabaseConfig,
  path: string,
): Promise<string> {
  const res = await fetch(
    `${cfg.url}/storage/v1/object/upload/sign/${MEDIA_BUCKET}/${path}`,
    { method: "POST", headers: authHeaders(cfg), cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Storage ${res.status}: ${await res.text()}`);
  const { url } = (await res.json()) as { url: string };
  return `${cfg.url}/storage/v1${url}`;
}

/** Borra archivos (personal). */
export async function removeObjects(
  cfg: SupabaseConfig,
  token: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  const res = await fetch(`${cfg.url}/storage/v1/object/${MEDIA_BUCKET}`, {
    method: "DELETE",
    headers: { ...authHeaders(cfg, token), "content-type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Storage ${res.status}: ${await res.text()}`);
}
