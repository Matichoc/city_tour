import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/admin/api";
import { supabaseConfig } from "@/lib/db/content-source";
import { signIn } from "@/app/admin/actions";

const field =
  "border-border bg-surface mt-1 w-full rounded-xl border px-3 py-2 text-base";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const t = await getTranslations({ locale: "es", namespace: "admin" });
  if (!supabaseConfig()) {
    return <p className="text-muted">{t("signIn.notConfigured")}</p>;
  }
  if (await getSession()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl font-extrabold">
        {t("signIn.title")}
      </h1>
      {error && (
        <p
          role="alert"
          className="bg-coral/10 text-coral-ink mt-4 rounded-xl p-3 text-sm"
        >
          {t("signIn.error")}
        </p>
      )}
      <form action={signIn} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">
          {t("signIn.email")}
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className={field}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("signIn.password")}
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={field}
          />
        </label>
        <button
          type="submit"
          className="bg-sea-deep w-full rounded-full px-4 py-2.5 font-bold text-white"
        >
          {t("signIn.submit")}
        </button>
      </form>
    </div>
  );
}
