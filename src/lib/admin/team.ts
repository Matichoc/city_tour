/**
 * Equipo del panel (migración 0033): el superadmin invita a los admin
 * municipales por enlace; el resto ve quién tiene acceso. La base decide los
 * permisos; aquí solo se llama a sus funciones.
 */
import { rest, type Session } from "@/lib/admin/api";
import { supabaseConfig } from "@/lib/db/content-source";

const post = (body: unknown) => ({
  method: "POST",
  body: JSON.stringify(body),
});

export type TeamMember = {
  userId: string;
  email: string;
  name: string | null;
  role: "superadmin" | "admin" | "editor" | "verifier";
  active: boolean;
  createdAt: string;
};

export async function listTeam(session: Session): Promise<TeamMember[]> {
  const rows = await rest<
    {
      user_id: string;
      email: string;
      full_name: string | null;
      role: TeamMember["role"];
      active: boolean;
      created_at: string;
    }[]
  >(session.token, "rpc/team_members", post({}));
  return rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    name: r.full_name,
    role: r.role,
    active: r.active,
    createdAt: r.created_at,
  }));
}

export type StaffInvite = {
  id: string;
  note: string | null;
  createdAt: string;
  expiresAt: string;
  claimedEmail: string | null;
  usedAt: string | null;
  revokedAt: string | null;
};

export async function listInvites(session: Session): Promise<StaffInvite[]> {
  const rows = await rest<
    {
      id: string;
      note: string | null;
      created_at: string;
      expires_at: string;
      claimed_email: string | null;
      used_at: string | null;
      revoked_at: string | null;
    }[]
  >(session.token, "rpc/list_staff_invites", post({}));
  return rows.map((r) => ({
    id: r.id,
    note: r.note,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    claimedEmail: r.claimed_email,
    usedAt: r.used_at,
    revokedAt: r.revoked_at,
  }));
}

/** Estado de una invitación para mostrarla en el panel. */
export function inviteState(
  i: StaffInvite,
  now = Date.now(),
): "used" | "revoked" | "expired" | "claimed" | "open" {
  if (i.usedAt) return "used";
  if (i.revokedAt) return "revoked";
  if (new Date(i.expiresAt).getTime() <= now) return "expired";
  return i.claimedEmail ? "claimed" : "open";
}

/** Crea una invitación de admin municipal. Devuelve el código, una sola vez. */
export const createInvite = (session: Session, note: string | null) =>
  rest<string>(
    session.token,
    "rpc/create_staff_invite",
    post({ p_note: note }),
  );

export const revokeInvite = (session: Session, id: string) =>
  rest<null>(session.token, "rpc/revoke_staff_invite", post({ p_id: id }));

export const setMemberActive = (
  session: Session,
  userId: string,
  active: boolean,
) =>
  rest<null>(
    session.token,
    "rpc/set_member_active",
    post({ p_user: userId, p_active: active }),
  );

/** Primer ingreso de alguien invitado: activa su invitación. */
export async function activateStaffInvite(token: string): Promise<boolean> {
  try {
    const role = await rest<string | null>(
      token,
      "rpc/activate_staff_invite",
      post({}),
    );
    return Boolean(role);
  } catch {
    return false;
  }
}

// ── Sin sesión (página de la invitación), con la clave pública ──

async function anon<T>(fn: string, body: unknown): Promise<T | null> {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        authorization: `Bearer ${cfg.key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const isInviteToken = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{48}$/.test(v);

export async function inviteIsValid(token: string): Promise<boolean> {
  if (!isInviteToken(token)) return false;
  const info = await anon<{ valid: boolean }>("staff_invite_info", {
    p_token: token,
  });
  return info?.valid === true;
}

export const claimInvite = async (token: string, email: string) =>
  (await anon<boolean>("claim_staff_invite", {
    p_token: token,
    p_email: email,
  })) === true;

export type SignUpResult = "ok" | "weak" | "limit" | "error";

/**
 * Crea la cuenta en Supabase Auth. Supabase manda un correo para confirmarla;
 * el enlace vuelve a `redirectTo` si está en la lista de direcciones
 * permitidas del proyecto. Si el correo ya tenía cuenta, Supabase responde
 * igual (no revela si existe): esa persona solo tiene que entrar.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  redirectTo: string,
): Promise<SignUpResult> {
  const cfg = supabaseConfig();
  if (!cfg) return "error";
  try {
    const res = await fetch(
      `${cfg.url}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        headers: { apikey: cfg.key, "content-type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: fullName },
        }),
        cache: "no-store",
      },
    );
    if (res.ok) return "ok";
    const body = (await res.json().catch(() => ({}))) as {
      error_code?: string;
      code?: string | number;
    };
    const code = String(body.error_code ?? body.code ?? "");
    if (code.includes("weak_password")) return "weak";
    if (res.status === 429 || code.includes("rate_limit")) return "limit";
    return "error";
  } catch {
    return "error";
  }
}
