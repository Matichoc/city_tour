import { rest } from "@/lib/admin/api";
import type { MetricsReport, Period } from "@/lib/metrics";

/** Informe de métricas del período (solo personal: lo decide la RLS). */
export async function metricsReport(
  token: string,
  days: Period,
): Promise<MetricsReport> {
  return rest<MetricsReport>(token, "rpc/metrics_report", {
    method: "POST",
    body: JSON.stringify({ p_days: days }),
  });
}
