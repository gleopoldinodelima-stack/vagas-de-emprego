"use client";

export function BotaoImprimir() {
  return (
    <button onClick={() => window.print()} className="rounded bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      Salvar como PDF
    </button>
  );
}
