/**
 * Lector de CSV (RFC 4180): comillas dobles, comas y saltos de línea dentro de
 * una celda, y BOM. Devuelve las filas como listas de celdas.
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"' && cell === "") {
      quoted = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Se descartan las filas totalmente vacías (Google deja una al final).
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Enlace de Google Sheets → enlace de descarga CSV (misma hoja, si se indica). */
export function sheetCsvUrl(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com")
    return null;
  const id = url.pathname.match(/^\/spreadsheets\/d\/([\w-]{20,})/)?.[1];
  if (!id) return null;
  const gid = (url.hash.match(/gid=(\d+)/) ??
    url.search.match(/gid=(\d+)/))?.[1];
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid ? `&gid=${gid}` : ""}`;
}
