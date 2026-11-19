"use client";

import { useState } from "react";

const STYLE_PROPS = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "text-anchor",
] as const;

/** Copia los estilos calculados (clases de Tailwind) a cada nodo del SVG. */
function inlineStyles(source: Element, target: Element) {
  const cs = getComputedStyle(source);
  const style = STYLE_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(
    ";",
  );
  target.setAttribute("style", style);
  const s = source.children;
  const t = target.children;
  for (let i = 0; i < s.length; i++) if (t[i]) inlineStyles(s[i], t[i]);
}

/**
 * Descarga el gráfico (el primer SVG dentro de #target) como imagen PNG, con
 * su título arriba y fondo blanco, para pegarlo en un informe o presentación.
 */
export function PngButton({
  target,
  title,
  filename,
  label,
}: {
  target: string;
  title: string;
  filename: string;
  label: string;
}) {
  const [busy, setBusy] = useState(false);

  async function download() {
    const svg = document.getElementById(target)?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      const vb = svg.viewBox.baseVal;
      const w = vb?.width || svg.clientWidth;
      const h = vb?.height || svg.clientHeight;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      inlineStyles(svg, clone);
      clone.querySelectorAll("title").forEach((n) => n.remove());
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(w));
      clone.setAttribute("height", String(h));
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(clone)], {
          type: "image/svg+xml;charset=utf-8",
        }),
      );
      const img = new Image();
      await new Promise<void>((ok, fail) => {
        img.onload = () => ok();
        img.onerror = () => fail(new Error("svg"));
        img.src = url;
      });

      const scale = 2;
      const pad = 24;
      const titleH = 44;
      const canvas = document.createElement("canvas");
      canvas.width = (w + pad * 2) * scale;
      canvas.height = (h + pad * 2 + titleH) * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w + pad * 2, h + pad * 2 + titleH);
      const body = getComputedStyle(document.body);
      ctx.fillStyle = body.color || "#283270";
      ctx.font = `800 20px ${body.fontFamily}`;
      ctx.fillText(title, pad, pad + 20);
      ctx.drawImage(img, pad, pad + titleH, w, h);
      URL.revokeObjectURL(url);

      const a = document.createElement("a");
      a.download = filename;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="text-sea inline-flex min-h-11 items-center text-sm font-bold underline disabled:opacity-50 print:hidden"
    >
      {label}
    </button>
  );
}
