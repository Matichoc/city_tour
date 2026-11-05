"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canModerate, getSession, type Session } from "@/lib/admin/api";
import {
  createOwnerKey,
  reviewProposal,
  revokeOwnerKeys,
} from "@/lib/admin/owner";

const UUID = /^[0-9a-f-]{36}$/;
const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";

async function moderator(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  return session;
}

export type OwnerLinkState = { link: string | null; error: boolean };

/** Genera el enlace del local y lo devuelve una sola vez (no se guarda). */
export async function generateOwnerLinkAction(
  _prev: OwnerLinkState,
  formData: FormData,
): Promise<OwnerLinkState> {
  const session = await moderator();
  const placeId = text(formData.get("placeId"));
  if (!UUID.test(placeId) || !canModerate(session))
    return { link: null, error: true };
  try {
    const token = await createOwnerKey(session, placeId);
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    return {
      link: `${proto}://${host}/local/entrar?llave=${token}`,
      error: false,
    };
  } catch (error) {
    console.error("[admin] no se pudo generar el enlace del local", error);
    return { link: null, error: true };
  }
}

export async function revokeOwnerLinkAction(formData: FormData) {
  const session = await moderator();
  const placeId = text(formData.get("placeId"));
  const back = `/admin/comercios/${placeId}`;
  if (!UUID.test(placeId) || !canModerate(session))
    redirect(`${back}?error=save#acceso`);
  try {
    await revokeOwnerKeys(session, placeId);
  } catch (error) {
    console.error("[admin] no se pudo cortar el enlace del local", error);
    redirect(`${back}?error=save#acceso`);
  }
  redirect(`${back}?accesoCortado=1#acceso`);
}

/** Aprueba (se aplica a la ficha) o rechaza la propuesta de un local. */
export async function reviewProposalAction(formData: FormData) {
  const session = await moderator();
  const id = text(formData.get("id"));
  const approve = text(formData.get("decision")) === "aprobar";
  const note = text(formData.get("note")).slice(0, 1000) || null;
  const back = `/admin/propuestas/${id}`;
  if (!UUID.test(id) || !canModerate(session)) redirect(`${back}?error=1`);
  try {
    await reviewProposal(session, id, approve, note);
  } catch (error) {
    console.error("[admin] no se pudo revisar la propuesta", error);
    redirect(`${back}?error=1`);
  }
  if (approve) updateTag("content");
  redirect(`/admin/propuestas?${approve ? "aprobada" : "rechazada"}=1`);
}
