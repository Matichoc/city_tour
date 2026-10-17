"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canVerify,
  getSession,
  isEntityKind,
  sessionFor,
  verifyEntity,
  VERIFICATION_STATES,
  type Verification,
} from "@/lib/admin/api";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
  signInWithPassword,
  signOutRemote,
} from "@/lib/admin/auth";

const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";

export async function signIn(formData: FormData) {
  const tokens = await signInWithPassword(
    text(formData.get("email")),
    text(formData.get("password")),
  );
  // Solo el personal municipal entra: una cuenta sin perfil no recibe sesión.
  const session = tokens ? await sessionFor(tokens.access_token) : null;
  if (!tokens || !session) redirect("/admin/ingresar?error=1");

  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.access_token, cookieOptions(tokens.expires_in));
  jar.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions(REFRESH_MAX_AGE));
  redirect("/admin");
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (token) await signOutRemote(token);
  jar.delete({ name: ACCESS_COOKIE, path: "/admin" });
  jar.delete({ name: REFRESH_COOKIE, path: "/admin" });
  redirect("/admin/ingresar");
}

const isHttpUrl = (v: string) => {
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

export async function verify(formData: FormData) {
  const kind = text(formData.get("tipo"));
  const id = text(formData.get("id"));
  const status = text(formData.get("estado")) as Verification;
  const notes = text(formData.get("nota"));
  const evidence = text(formData.get("evidencia"));
  if (!isEntityKind(kind) || !/^[0-9a-f-]{36}$/.test(id)) {
    redirect("/admin");
  }
  const back = `/admin/${kind}/${id}`;

  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  if (
    !canVerify(session) ||
    !VERIFICATION_STATES.includes(status) ||
    (evidence !== "" && !isHttpUrl(evidence))
  ) {
    redirect(`${back}?error=1`);
  }

  let ok = true;
  try {
    await verifyEntity(
      session.token,
      kind,
      id,
      status,
      notes || null,
      evidence || null,
    );
  } catch (error) {
    console.error("[admin] verify_entity falló", error);
    ok = false;
  }
  if (!ok) redirect(`${back}?error=1`);
  // El sitio público vuelve a leer la base en la próxima visita.
  revalidateTag("content", "max");
  redirect(`${back}?guardado=1`);
}
