"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OWNER_COOKIE,
  changedFields,
  readOwnerForm,
  submitOwnerProposal,
} from "@/lib/owner/access";
import {
  OWNER_ACCESS_COOKIE,
  OWNER_EMAIL_COOKIE,
  OWNER_PLACE_COOKIE,
  OWNER_REFRESH_COOKIE,
  OWNER_REFRESH_MAX_AGE,
  ownerCookie,
  submitOwnerProposalByEmail,
} from "@/lib/owner/email";
import { getOwnerContext } from "@/lib/owner/current";

/** Envía la propuesta del locatario: solo lo que cambió respecto de la ficha. */
export async function submitProposal(formData: FormData) {
  const ctx = await getOwnerContext();
  if (ctx?.kind === "expired") redirect("/local/renovar");
  const session = ctx?.session ?? null;
  if (!ctx || !session) redirect("/local?error=expired");

  const name = String(formData.get("submitter") ?? "").trim();
  if (name.length < 2 || name.length > 80) redirect("/local?error=name");
  const note =
    String(formData.get("note") ?? "")
      .trim()
      .slice(0, 1000) || null;

  const { values, errors } = readOwnerForm(formData);
  if (errors.length) redirect(`/local?error=${errors[0]}`);

  const changes = changedFields(session.current, values);
  if (Object.keys(changes).length === 0) redirect("/local?sinCambios=1");

  const result =
    ctx.kind === "link"
      ? await submitOwnerProposal(ctx.token, changes, name, note)
      : await submitOwnerProposalByEmail(
          ctx.accessToken,
          session.placeId,
          changes,
          name,
          note,
        );
  if (result !== "ok") redirect(`/local?error=${result}`);
  redirect("/local?enviado=1");
}

/** Con un correo que administra varios locales: elegir cuál editar. */
export async function choosePlace(formData: FormData) {
  const id = String(formData.get("placeId") ?? "");
  const jar = await cookies();
  // Sin local elegido: vuelve a la lista para elegir otro.
  if (/^[0-9a-f-]{36}$/.test(id))
    jar.set(OWNER_PLACE_COOKIE, id, ownerCookie(OWNER_REFRESH_MAX_AGE));
  else jar.delete({ name: OWNER_PLACE_COOKIE, path: "/local" });
  redirect("/local");
}

/** Cerrar «Mi local» en este dispositivo (enlace o sesión por correo). */
export async function leave() {
  const jar = await cookies();
  for (const name of [
    OWNER_COOKIE,
    OWNER_ACCESS_COOKIE,
    OWNER_REFRESH_COOKIE,
    OWNER_PLACE_COOKIE,
    OWNER_EMAIL_COOKIE,
  ])
    jar.delete({ name, path: "/local" });
  redirect("/local?salio=1");
}
