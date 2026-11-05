"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OWNER_COOKIE,
  changedFields,
  getOwnerSession,
  readOwnerForm,
  submitOwnerProposal,
} from "@/lib/owner/access";

/** Envía la propuesta del locatario: solo lo que cambió respecto de la ficha. */
export async function submitProposal(formData: FormData) {
  const token = (await cookies()).get(OWNER_COOKIE)?.value;
  const session = await getOwnerSession(token);
  if (!session || !token) redirect("/local?error=expired");

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

  const result = await submitOwnerProposal(token, changes, name, note);
  if (result !== "ok") redirect(`/local?error=${result}`);
  redirect("/local?enviado=1");
}

/** Olvida el enlace en este dispositivo. */
export async function leave() {
  (await cookies()).delete({ name: OWNER_COOKIE, path: "/local" });
  redirect("/local?salio=1");
}
