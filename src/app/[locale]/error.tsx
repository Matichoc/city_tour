"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/ui/empty-state";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-10">
      <EmptyState title={t("errorTitle")}>
        <p>{t("errorBody")}</p>
        <button
          type="button"
          onClick={reset}
          className="bg-sea mt-4 inline-flex min-h-11 items-center rounded-full px-5 font-bold text-white"
        >
          {t("retry")}
        </button>
      </EmptyState>
    </main>
  );
}
