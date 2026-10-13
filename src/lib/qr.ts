/** Normaliza el origen del QR (nombre del local) a un identificador seguro. */
export function toOrigin(raw: string | undefined): string {
  return (raw ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
