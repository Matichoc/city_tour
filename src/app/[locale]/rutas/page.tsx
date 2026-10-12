import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { ComingSoon } from "@/components/ui/coming-soon";

export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  setRequestLocale(use(params).locale);
  return <ComingSoon section="routes" />;
}
