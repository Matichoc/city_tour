#!/usr/bin/env node
/**
 * Genera docs/BITACORA.md: versiones, días y horas de avance, a partir del
 * historial de git y de las notas a mano de docs/bitacora-notas.json.
 * Uso: pnpm bitacora   (sin dependencias; horas en hora de Chile)
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const TZ = "America/Santiago";
const git = (...args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
const notes = JSON.parse(readFileSync("docs/bitacora-notas.json", "utf8"));

const fmt = (opts) =>
  new Intl.DateTimeFormat("es-CL", { timeZone: TZ, ...opts });
const dayKey = (d) =>
  fmt({ year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(d)
    .reduce((o, p) => ({ ...o, [p.type]: p.value }), {});
const ymd = (d) => {
  const p = dayKey(d);
  return `${p.year}-${p.month}-${p.day}`;
};
const hm = (d) =>
  fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
const long = (d) =>
  fmt({
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
const short = (d) => `${ymd(d)} ${hm(d)}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Rama base: develop remoto si existe, si no la local.
const base = (() => {
  for (const ref of ["origin/develop", "develop", "HEAD"]) {
    try {
      git("rev-parse", "--verify", ref);
      return ref;
    } catch {}
  }
})();

const row = (line) => {
  const [hash, iso, subject] = line.split("|");
  return {
    hash,
    at: new Date(iso),
    subject: line.slice(hash.length + iso.length + 2) || subject,
  };
};
const log = (range, extra = []) =>
  git("log", "--reverse", "--format=%h|%cI|%s", ...extra, range)
    .split("\n")
    .filter(Boolean)
    .map(row);

// Entregas = PR fusionados en develop, en orden de fusión.
const merges = log(base, ["--first-parent"]).filter((c) =>
  /Merge pull request #\d+/.test(c.subject),
);
const releases = merges.map((m, i) => {
  const pr = m.subject.match(/#(\d+)/)[1];
  const full = git("rev-parse", m.hash);
  const commits = log(`${full}^1..${full}^2`);
  return { version: `v0.${i + 1}`, pr, merged: m.at, commits, note: notes[pr] };
});

// Todos los commits (sin fusiones) para el cuadro por día.
const all = log(base, ["--no-merges"]);
const ahead = base === "HEAD" ? [] : log(`${base}..HEAD`, ["--no-merges"]);
const everyCommit = [
  ...all,
  ...ahead.filter((a) => !all.some((c) => c.hash === a.hash)),
];

// ── Cuadro por día ────────────────────────────────────────────────────────
const days = new Map();
for (const c of everyCommit) {
  const k = ymd(c.at);
  const d = days.get(k) ?? { first: c.at, last: c.at, n: 0, versions: [] };
  d.first = c.at < d.first ? c.at : d.first;
  d.last = c.at > d.last ? c.at : d.last;
  d.n += 1;
  days.set(k, d);
}
for (const r of releases) days.get(ymd(r.merged))?.versions.push(r.version);

const out = [];
out.push(`# Bitácora de avances

> Generada con \`pnpm bitacora\` desde el historial de git y las notas de
> [\`bitacora-notas.json\`](bitacora-notas.json). **No se edita a mano**: se
> cambian las notas y se vuelve a generar. Horas en hora de Chile.

**Cómo se numeran las versiones.** Cada entrega a \`develop\` (un PR fusionado)
es una versión \`v0.N\`, en orden de fusión. Mientras el proyecto sea un piloto
va en \`v0.x\`; \`v1.0\` será la primera publicación en \`main\` para el público.
Las migraciones de base de datos que hay que correr a mano en Supabase van
indicadas en cada versión.

**Cómo se actualiza.** Al cerrar cada entrega: agregar su nota en
\`docs/bitacora-notas.json\` (clave \`actual\`, y el número de PR cuando exista),
correr \`pnpm bitacora\` y subir el cambio en el mismo PR.
`);

// En curso
const cur = notes.actual;
const next = `v0.${releases.length + 1}`;
if (cur) {
  out.push(`## En preparación: ${next} — ${cur.titulo}\n`);
  out.push(`${cur.resumen}\n`);
  if (cur.migraciones)
    out.push(`- **Migraciones por correr en Supabase:** ${cur.migraciones}`);
  out.push(`- **Estado:** en desarrollo (aún no está en \`develop\`).`);
  out.push(
    `- **Última actualización de esta bitácora:** ${short(new Date())}\n`,
  );
}

// Cuadro por día
out.push(`## Avance por día

La «ventana» va del primer al último registro del día (no son horas
trabajadas: hay pausas y trabajo sin registrar).

| Día | Ventana de actividad | Registros | Versiones entregadas |
| --- | --- | ---: | --- |`);
for (const [, d] of [...days].sort((a, b) => b[0].localeCompare(a[0]))) {
  const v = d.versions.length ? d.versions.join(", ") : "—";
  out.push(
    `| ${cap(long(d.first))} | ${hm(d.first)} – ${hm(d.last)} | ${d.n} | ${v} |`,
  );
}
out.push("");

// Versiones, de la más nueva a la más antigua
out.push(`## Versiones\n`);
for (const r of [...releases].reverse()) {
  const n = r.note;
  out.push(`### ${r.version} — ${n?.titulo ?? `PR #${r.pr}`}`);
  out.push(
    `${cap(long(r.merged))}, ${hm(r.merged)} · [PR #${r.pr}](https://github.com/Matichoc/city_tour/pull/${r.pr})\n`,
  );
  if (n?.resumen) out.push(`${n.resumen}\n`);
  if (n?.migraciones)
    out.push(`**Migraciones en Supabase:** ${n.migraciones}\n`);
  if (r.commits.length) {
    out.push("Registros:\n");
    for (const c of r.commits)
      out.push(
        `- ${ymd(c.at).slice(5)} ${hm(c.at)} — ${c.subject} (\`${c.hash}\`)`,
      );
    out.push("");
  }
}

const first = everyCommit[0];
if (first)
  out.push(
    `---\n\nPrimer registro del proyecto: ${cap(long(first.at))}, ${hm(first.at)}.\n`,
  );
writeFileSync("docs/BITACORA.md", out.join("\n"));
console.log(
  `docs/BITACORA.md: ${releases.length} versiones, ${days.size} días, ${everyCommit.length} registros`,
);
