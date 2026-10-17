/**
 * Enlaces para compartir una vista previa por tiempo limitado.
 *
 * Solo se activan donde existe `SHARE_LINK_SECRET` (en Vercel: solo en el
 * entorno Preview). Un enlace lleva `?acceso=<vencimiento>.<firma>`; la firma es
 * un HMAC-SHA256 del vencimiento con esa clave, así que no se puede alargar ni
 * falsificar. Al abrirlo se guarda en una cookie que vence a la misma hora.
 */

export const ACCESS_PARAM = "acceso";
export const ACCESS_COOKIE = "acceso_vista_previa";
/** Duración por defecto y máxima de un enlace, en horas. */
export const DEFAULT_HOURS = 4;
export const MAX_HOURS = 72;

const encoder = new TextEncoder();

const toBase64Url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

const hmacKey = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

/** Crea un código de acceso que vence en `expiresAt` (ms desde 1970). */
export async function signAccess(
  secret: string,
  expiresAt: number,
): Promise<string> {
  const exp = Math.floor(expiresAt).toString(36);
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    encoder.encode(exp),
  );
  return `${exp}.${toBase64Url(sig)}`;
}

/** Vencimiento del código si es auténtico y sigue vigente; si no, `null`. */
export async function verifyAccess(
  secret: string,
  token: string | null | undefined,
  now = Date.now(),
): Promise<number | null> {
  const [exp, sig, ...rest] = (token ?? "").split(".");
  if (!exp || !sig || rest.length > 0 || !/^[0-9a-z]{1,12}$/.test(exp)) {
    return null;
  }
  const expiresAt = parseInt(exp, 36);
  if (!(expiresAt > now)) return null;
  const sigBytes = fromBase64Url(sig);
  // Solo la forma exacta (base64 admite variantes con bits de relleno distintos).
  if (!sigBytes || toBase64Url(sigBytes.buffer) !== sig) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    sigBytes,
    encoder.encode(exp),
  );
  return ok ? expiresAt : null;
}

/** Horas pedidas, acotadas a 1–MAX_HOURS (por defecto DEFAULT_HOURS). */
export function parseHours(raw: string | null): number {
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n <= 0) return DEFAULT_HOURS;
  return Math.min(Math.max(n, 1), MAX_HOURS);
}
