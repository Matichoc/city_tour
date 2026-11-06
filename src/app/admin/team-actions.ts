"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, type Session } from "@/lib/admin/api";
import {
  claimInvite,
  createInvite,
  inviteIsValid,
  revokeInvite,
  setMemberActive,
  signUp,
} from "@/lib/admin/team";

const UUID = /^[0-9a-f-]{36}$/;
const text = (v: FormDataEntryValue | null) =>
  typeof v === "string" ? v.trim() : "";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function superadmin(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  if (!session.superadmin) redirect("/admin/equipo?error=permiso");
  return session;
}

export type InviteState = {
  link: string | null;
  error: "limit" | "save" | null;
};

/** Invitación de admin municipal: el enlace se muestra una sola vez. */
export async function createInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await superadmin();
  const note = text(formData.get("note")).slice(0, 120) || null;
  try {
    const token = await createInvite(session, note);
    return {
      link: `${await origin()}/admin/invitacion?codigo=${token}`,
      error: null,
    };
  } catch (error) {
    const limit = String(error).includes("23514");
    if (!limit) console.error("[admin] no se pudo crear la invitación", error);
    return { link: null, error: limit ? "limit" : "save" };
  }
}

export async function revokeInviteAction(formData: FormData) {
  const session = await superadmin();
  const id = text(formData.get("id"));
  if (UUID.test(id)) {
    try {
      await revokeInvite(session, id);
    } catch (error) {
      console.error("[admin] no se pudo revocar la invitación", error);
      redirect("/admin/equipo?error=save");
    }
  }
  redirect("/admin/equipo?revocada=1");
}

export async function setMemberActiveAction(formData: FormData) {
  const session = await superadmin();
  const id = text(formData.get("userId"));
  const active = text(formData.get("active")) === "1";
  if (!UUID.test(id)) redirect("/admin/equipo?error=save");
  try {
    await setMemberActive(session, id, active);
  } catch (error) {
    const limit = String(error).includes("23514");
    if (!limit) console.error("[admin] no se pudo cambiar el acceso", error);
    redirect(`/admin/equipo?error=${limit ? "limit" : "save"}`);
  }
  redirect("/admin/equipo?guardado=1");
}

/** La persona invitada crea su cuenta (correo y contraseña). */
export async function acceptInviteAction(formData: FormData) {
  const code = text(formData.get("codigo"));
  const back = `/admin/invitacion?codigo=${encodeURIComponent(code)}`;
  const name = text(formData.get("name")).slice(0, 120);
  const email = text(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("repeat") ?? "");

  if (!(await inviteIsValid(code))) redirect(`${back}&error=invalid`);
  if (name.length < 2) redirect(`${back}&error=name`);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    redirect(`${back}&error=email`);
  if (password.length < 10) redirect(`${back}&error=weak`);
  if (password !== repeat) redirect(`${back}&error=repeat`);

  if (!(await claimInvite(code, email))) redirect(`${back}&error=invalid`);
  const result = await signUp(
    email,
    password,
    name,
    `${await origin()}/admin/ingresar?confirmado=1`,
  );
  if (result !== "ok") redirect(`${back}&error=${result}`);
  redirect(`${back}&enviado=1`);
}
