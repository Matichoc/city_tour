import type { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/admin/api";
import { metricsReport } from "@/lib/admin/metrics";
import { parsePeriod, reportCsv } from "@/lib/metrics";

/** Descarga del período en CSV (una fila por día y evento), para informes. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return new Response(null, { status: 401 });
  const days = parsePeriod(request.nextUrl.searchParams.get("dias") ?? "");
  const t = await getTranslations({
    locale: "es",
    namespace: "admin.metrics.event",
  });
  try {
    const report = await metricsReport(session.token, days);
    const csv = reportCsv(report, (name) => (t.has(name) ? t(name) : name));
    return new Response(`﻿${csv}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="metricas-papudo-${report.today}-${days}d.csv"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("[admin] no se pudo exportar métricas", error);
    return new Response(null, { status: 502 });
  }
}
