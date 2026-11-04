"use client";

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-coral min-h-12 rounded-full px-6 font-bold text-white"
    >
      {label}
    </button>
  );
}
