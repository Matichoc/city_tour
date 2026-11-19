import { cookies } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { OWNER_EMAIL_COOKIE } from "@/lib/owner/email";
import {
  sendOwnerCode,
  verifyOwnerCodeAction,
} from "@/app/local/ingresar/actions";

const input =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2.5 text-base";
const button =
  "bg-coral min-h-12 w-full rounded-full px-6 font-bold text-white sm:w-auto";
const ERRORS = ["correo", "envio", "espera", "codigo", "sesion"] as const;

/**
 * Entrar a «Mi local» con el correo: se escribe el correo registrado por la
 * Municipalidad, llega un código de 6 dígitos y con él se entra. Sin
 * contraseña. (El enlace personal del local sigue sirviendo igual.)
 */
export default async function OwnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations({ locale: "es", namespace: "owner.email" });
  const sp = await searchParams;
  const email = (await cookies()).get(OWNER_EMAIL_COOKIE)?.value ?? null;
  const codeStep = sp.paso === "codigo" && Boolean(email);
  const error = ERRORS.find((e) => e === sp.error);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted text-sm font-bold">{t("kicker")}</p>
        <h1 className="font-display text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-2">{t("intro")}</p>
      </div>

      {error ? (
        <p role="alert" className="bg-coral/10 text-coral-ink rounded-xl p-3">
          {t(`errors.${error}`)}
        </p>
      ) : null}

      {codeStep ? (
        <form action={verifyOwnerCodeAction} className="space-y-4">
          <p role="status" className="bg-sea-soft rounded-xl p-3">
            {t("sent", { email: email! })}
          </p>
          <label className="block font-semibold">
            {t("codeLabel")}
            <input
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              aria-describedby="code-help"
              className={`${input} text-center text-2xl tracking-[0.4em]`}
            />
            <span
              id="code-help"
              className="text-muted mt-1 block text-sm font-normal"
            >
              {t("codeHelp")}
            </span>
          </label>
          <button type="submit" className={button}>
            {t("enter")}
          </button>
          <p className="text-sm">
            <Link href="/local/ingresar" className="text-sea-deep underline">
              {t("otherEmail")}
            </Link>
          </p>
        </form>
      ) : (
        <form action={sendOwnerCode} className="space-y-4">
          <label className="block font-semibold">
            {t("emailLabel")}
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={email ?? ""}
              aria-describedby="email-help"
              className={input}
            />
            <span
              id="email-help"
              className="text-muted mt-1 block text-sm font-normal"
            >
              {t("emailHelp")}
            </span>
          </label>
          <button type="submit" className={button}>
            {t("send")}
          </button>
        </form>
      )}
    </div>
  );
}
