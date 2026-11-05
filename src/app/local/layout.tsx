import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "es", namespace: "owner" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * «Mi local»: el locatario propone cambios a la ficha de su comercio con el
 * enlace personal que le mandó la Municipalidad. En español y sin la
 * navegación del sitio, como el panel.
 */
export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-dvh">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/papudo-simbolo.webp"
            alt=""
            width={32}
            height={37}
            className="h-9 w-auto"
          />
          <span className="font-display text-lg font-extrabold">
            Papudo en tu Mano
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
