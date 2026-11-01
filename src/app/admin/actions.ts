"use server";

import { revalidateTag, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canDeleteReviews,
  canModerate,
  canVerify,
  createNotice,
  CTA_KINDS,
  deleteNotice,
  deleteReview,
  cleanupAbandonedUploads as cleanupUploads,
  markReviewed,
  getSession,
  setNoticeActive,
  setReviewStatus,
  setMediaStatus,
  updatePlaceCta,
  markInfoUpdated,
  updateSettings,
  type CtaKindAdmin,
  isEntityKind,
  sessionFor,
  verifyEntity,
  VERIFICATION_STATES,
  type Verification,
} from "@/lib/admin/api";
import { REVIEWS_TAG } from "@/lib/reviews";
import { NOTICES_TAG, SETTINGS_TAG } from "@/lib/business";
import { ctaHref } from "@/lib/data";
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

/** Ocultar, volver a mostrar o borrar un comentario de visitante. */
export async function moderateReview(formData: FormData) {
  const id = text(formData.get("id"));
  const action = text(formData.get("accion"));
  const back = `/admin/comentarios?filtro=${encodeURIComponent(text(formData.get("filtro")) || "todos")}`;
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  if (
    !/^[0-9a-f-]{36}$/.test(id) ||
    !["ocultar", "mostrar", "borrar", "revisar"].includes(action) ||
    !canModerate(session) ||
    (action === "borrar" && !canDeleteReviews(session))
  ) {
    redirect(`${back}&error=1`);
  }

  let ok = true;
  try {
    if (action === "borrar") await deleteReview(session, id);
    else if (action === "revisar") await markReviewed(session, id);
    else
      await setReviewStatus(
        session,
        id,
        action === "ocultar" ? "hidden" : "visible",
      );
  } catch (error) {
    console.error("[admin] moderación falló", error);
    ok = false;
  }
  if (!ok) redirect(`${back}&error=1`);
  // Se retira del sitio público de inmediato.
  updateTag(REVIEWS_TAG);
  redirect(`${back}&guardado=1`);
}

/** Da por revisados todos los comentarios nuevos. */
export async function markAllReviewed(formData: FormData) {
  const back = `/admin/comentarios?filtro=${encodeURIComponent(text(formData.get("filtro")) || "todos")}`;
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  if (!canModerate(session)) redirect(`${back}&error=1`);
  let ok = true;
  try {
    await markReviewed(session);
  } catch (error) {
    console.error("[admin] marcar todos como revisados falló", error);
    ok = false;
  }
  redirect(`${back}${ok ? "&guardado=1" : "&error=1"}`);
}

/** Borra los archivos que se reservaron y nadie terminó de subir. */
export async function cleanupAbandonedUploads(formData: FormData) {
  const back = `/admin/comentarios?filtro=${encodeURIComponent(text(formData.get("filtro")) || "todos")}`;
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  if (!canModerate(session)) redirect(`${back}&error=1`);
  let ok = true;
  try {
    await cleanupUploads(session);
  } catch (error) {
    console.error("[admin] limpieza de subidas abandonadas falló", error);
    ok = false;
  }
  redirect(`${back}${ok ? "&guardado=1" : "&error=1"}`);
}

export async function moderateMedia(formData: FormData) {
  const id = text(formData.get("id"));
  const action = text(formData.get("accion"));
  const back = `/admin/comentarios?filtro=${encodeURIComponent(text(formData.get("filtro")) || "todos")}`;
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  if (
    !/^[0-9a-f-]{36}$/.test(id) ||
    !["aprobar", "rechazar"].includes(action) ||
    !canModerate(session)
  ) {
    redirect(`${back}&error=1`);
  }
  let ok = true;
  try {
    await setMediaStatus(
      session,
      id,
      action === "aprobar" ? "approved" : "rejected",
    );
  } catch (error) {
    console.error("[admin] moderación de archivo falló", error);
    ok = false;
  }
  if (!ok) redirect(`${back}&error=1`);
  updateTag(REVIEWS_TAG);
  redirect(`${back}&guardado=1`);
}

// ── Comercios ─────────────────────────────────────────────────────────────
const BUSINESS = "/admin/comercios";
const UUID = /^[0-9a-f-]{36}$/;

/** Corre una escritura del panel y vuelve a /admin/comercios con el resultado. */
async function businessWrite(
  allowed: boolean,
  write: () => Promise<void>,
  tag: string,
  anchor: string,
) {
  if (!allowed) redirect(`${BUSINESS}?error=1#${anchor}`);
  let ok = true;
  try {
    await write();
  } catch (error) {
    console.error("[admin] comercios: no se pudo guardar", error);
    ok = false;
  }
  if (!ok) redirect(`${BUSINESS}?error=1#${anchor}`);
  updateTag(tag);
  redirect(`${BUSINESS}?guardado=1#${anchor}`);
}

export async function saveCta(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const id = text(formData.get("id"));
  const kind = text(formData.get("tipo")) as CtaKindAdmin | "";
  const value = text(formData.get("valor"));
  const clear = kind === "";
  const valid =
    UUID.test(id) &&
    (clear ||
      (CTA_KINDS.includes(kind as CtaKindAdmin) &&
        ctaHref({ kind: kind as CtaKindAdmin, value }) !== null));
  await businessWrite(
    canModerate(session) && valid,
    () =>
      updatePlaceCta(
        session.token,
        id,
        clear ? null : (kind as CtaKindAdmin),
        clear ? null : value,
      ),
    "content",
    "botones",
  );
}

export async function markUpdated(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const id = text(formData.get("id"));
  await businessWrite(
    canModerate(session) && UUID.test(id),
    () => markInfoUpdated(session.token, id),
    "content",
    "actualizacion",
  );
}

export async function addNotice(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const placeId = text(formData.get("lugar"));
  const title = text(formData.get("titulo"));
  const body = text(formData.get("texto"));
  const link = text(formData.get("enlace"));
  const until = text(formData.get("hasta"));
  // Vence al final del día elegido (hora de Chile).
  const endsAt = /^\d{4}-\d{2}-\d{2}$/.test(until)
    ? new Date(`${until}T23:59:59-03:00`)
    : null;
  const valid =
    (placeId === "" || UUID.test(placeId)) &&
    title.length >= 3 &&
    title.length <= 80 &&
    body.length <= 280 &&
    (link === "" || isHttpUrl(link)) &&
    endsAt !== null &&
    endsAt.getTime() > Date.now();
  await businessWrite(
    canModerate(session) && valid,
    () =>
      createNotice(session, {
        placeId: placeId || null,
        title,
        body: body || null,
        linkUrl: link || null,
        endsAt: endsAt!.toISOString(),
      }),
    NOTICES_TAG,
    "avisos",
  );
}

export async function changeNotice(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const id = text(formData.get("id"));
  const action = text(formData.get("accion"));
  await businessWrite(
    canModerate(session) &&
      UUID.test(id) &&
      ["activar", "pausar", "borrar"].includes(action),
    () =>
      action === "borrar"
        ? deleteNotice(session.token, id)
        : setNoticeActive(session.token, id, action === "activar"),
    NOTICES_TAG,
    "avisos",
  );
}

export async function saveSettings(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/ingresar");
  const url = text(formData.get("formulario"));
  await businessWrite(
    session.role === "admin" && (url === "" || isHttpUrl(url)),
    () =>
      updateSettings(session.token, {
        businessFormUrl: url || null,
        businessInvite: formData.get("invitacion") === "on",
      }),
    SETTINGS_TAG,
    "invitacion",
  );
}
