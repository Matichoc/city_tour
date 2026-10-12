import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/routing";

/** La raíz siempre dirige al español. */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
