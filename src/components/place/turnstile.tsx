"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile (anti-robots, gratis). Si no hay clave del sitio
 * (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) no muestra nada y el servidor tampoco lo
 * exige. El widget agrega solo el campo `cf-turnstile-response` al formulario;
 * cada token sirve una vez, por eso se reinicia después de cada envío.
 */
export function Turnstile({ resetKey }: { resetKey: unknown }) {
  useEffect(() => {
    window.turnstile?.reset();
  }, [resetKey]);
  if (!SITE_KEY) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div className="cf-turnstile" data-sitekey={SITE_KEY} />
    </>
  );
}
