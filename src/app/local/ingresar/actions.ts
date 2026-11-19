"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  OWNER_ACCESS_COOKIE,
  OWNER_EMAIL_COOKIE,
  OWNER_REFRESH_COOKIE,
  OWNER_REFRESH_MAX_AGE,
  isCode,
  isEmail,
  ownerCookie,
  requestOwnerCode,
  verifyOwnerCode,
} from "@/lib/owner/email";

const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";

/** Paso 1: el locatario escribe su correo y le mandamos el código. */
export async function sendOwnerCode(formData: FormData) {
  const email = text(formData.get("email")).toLowerCase();
  if (!isEmail(email)) redirect("/local/ingresar?error=correo");
  const result = await requestOwnerCode(email);
  if (result !== "ok")
    redirect(
      `/local/ingresar?error=${result === "limit" ? "espera" : "envio"}`,
    );
  // El correo queda en una cookie corta (no en la dirección) para el paso 2.
  (await cookies()).set(OWNER_EMAIL_COOKIE, email, ownerCookie(15 * 60));
  redirect("/local/ingresar?paso=codigo");
}

/** Paso 2: escribe el código; si sirve, queda con su sesión. */
export async function verifyOwnerCodeAction(formData: FormData) {
  const jar = await cookies();
  const email = jar.get(OWNER_EMAIL_COOKIE)?.value ?? "";
  const code = text(formData.get("code")).replace(/\s/g, "");
  if (!isEmail(email)) redirect("/local/ingresar?error=correo");
  if (!isCode(code)) redirect("/local/ingresar?paso=codigo&error=codigo");
  const tokens = await verifyOwnerCode(email, code);
  if (!tokens) redirect("/local/ingresar?paso=codigo&error=codigo");
  jar.set(
    OWNER_ACCESS_COOKIE,
    tokens.access_token,
    ownerCookie(tokens.expires_in),
  );
  jar.set(
    OWNER_REFRESH_COOKIE,
    tokens.refresh_token,
    ownerCookie(OWNER_REFRESH_MAX_AGE),
  );
  jar.delete({ name: OWNER_EMAIL_COOKIE, path: "/local" });
  redirect("/local");
}
