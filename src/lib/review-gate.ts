import { createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Prueba firmada para crear comentarios y registrar archivos (ABUSE-01/02).
 * La base de datos solo acepta las funciones `_v2` con una prueba válida,
 * firmada con un secreto que conocen solo Vercel y esa base: así nadie puede
 * saltarse los controles del servidor llamando a la base directamente.
 * Diseño: docs/DISENO-ABUSE-01-02.md. El formato debe coincidir con
 * `private.verify_proof` (supabase/migrations/0027_review_gate.sql).
 */
export type ProofAct = "review" | "media" | "finish";

/** Secreto de firma, o null si no está configurado (entonces no se envía nada). */
export function gateSecret(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const secret = env.REVIEW_GATE_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

/** Resumen del contenido de un comentario: la prueba sirve solo para ese texto. */
export function reviewBind(c: {
  entity: string;
  slug: string;
  author: string;
  rating: number;
  body: string;
}): string {
  return createHash("sha256")
    .update(`${c.entity}|${c.slug}|${c.author}|${c.rating}|${c.body}`, "utf8")
    .digest("hex");
}

export function signProof(p: {
  act: ProofAct;
  /** Huella anónima del remitente. */
  sender: string;
  /** Contenido al que queda atada la prueba (reviewBind o id del comentario). */
  bind: string;
  secret: string;
  ttlSeconds?: number;
  nowMs?: number;
  nonce?: string;
}): string {
  const now = Math.floor((p.nowMs ?? Date.now()) / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      act: p.act,
      sender: p.sender,
      bind: p.bind,
      exp: now + (p.ttlSeconds ?? 120),
      nonce: p.nonce ?? randomBytes(16).toString("hex"),
    }),
    "utf8",
  ).toString("base64url");
  const signature = createHmac("sha256", p.secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}
