"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Si la visita llega desde un QR (?origen=...), lo registra una vez. */
export function QrVisit() {
  useEffect(() => {
    const origen = new URLSearchParams(window.location.search).get("origen");
    if (origen && /^[a-z0-9-]{1,60}$/.test(origen))
      track("qr_visit", { origen });
  }, []);
  return null;
}
