import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/admin/api";
import { metricsReport } from "@/lib/admin/metrics";
import { metricsSheets } from "@/lib/admin/metrics-excel";
import { getData } from "@/lib/data";
import { parsePeriod } from "@/lib/metrics";
import { xlsx } from "@/lib/xlsx";

/** Descarga del período en Excel: una hoja por tema, para informes. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const days = parsePeriod(request.nextUrl.searchParams.get("dias") ?? "");
  const t = await getTranslations({ locale: "es", namespace: "admin.metrics" });
  try {
    const report = await metricsReport(session.token, days);
    const data = await getData();
    const place = (s: string) => data.getPlace(s, "es")?.name;
    const route = (s: string) => data.getRoute(s, "es")?.name;
    const event = (s: string) => data.getEvent(s, "es")?.name;
    const sheets = metricsSheets(
      report,
      {
        place,
        route,
        event,
        any: (s) => place(s) ?? route(s) ?? event(s) ?? s,
      },
      (key, values) => t(key, values),
      (name) => (t.has(`event.${name}`) ? t(`event.${name}`) : name),
    );
    return new Response(new Uint8Array(xlsx(sheets)), {
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "content-disposition": `attachment; filename="metricas-papudo-${report.today}-${days}d.xlsx"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin] no se pudo exportar métricas a Excel", error);
    return new Response(null, { status: 502 });
  }
}
