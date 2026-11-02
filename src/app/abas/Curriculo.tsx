"use client";

import { useState } from "react";
import type { Perfil } from "@/lib/schemas";
import { botao, cartao } from "./tipos";

export function Curriculo({ perfil, aoEnviar }: { perfil: Perfil | null; aoEnviar: (p: Perfil) => void }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/curriculo", { method: "POST", body: new FormData(e.currentTarget) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      aoEnviar(d.perfil);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className={cartao}>
        <h3 className="mb-3 font-semibold">{perfil ? "Trocar currículo" : "Envie seu currículo"}</h3>
        <form onSubmit={enviar} className="flex flex-wrap items-center gap-3">
          <input type="file" name="curriculo" accept="application/pdf" required
            className="text-sm file:mr-3 file:rounded file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:font-semibold file:text-black" />
          <button disabled={enviando} className={botao}>{enviando ? "Lendo com Claude..." : "Enviar PDF"}</button>
        </form>
        {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
      </div>

      {perfil && (
        <div className={`${cartao} space-y-5 text-sm`}>
          <div>
            <p className="text-2xl font-bold">{perfil.nome}</p>
            <p className="text-zinc-400">
              {[perfil.cargoAtual, perfil.cidade, perfil.email, perfil.telefone].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-3 leading-relaxed">{perfil.resumo}</p>
          </div>
          <div>
            <h4 className="mb-2 font-semibold">Experiência</h4>
            <ul className="space-y-3">
              {perfil.experiencias.map((x, i) => (
                <li key={i}>
                  <p className="font-medium">{x.cargo} · {x.empresa}</p>
                  <p className="text-xs text-zinc-500">{x.inicio ?? "?"} a {x.fim ?? "atual"}{x.local && ` · ${x.local}`}</p>
                  <ul className="mt-1 list-disc pl-5 text-zinc-300">{x.atividades.map((a, j) => <li key={j}>{a}</li>)}</ul>
                </li>
              ))}
            </ul>
          </div>
          {perfil.formacao.length > 0 && (
            <div>
              <h4 className="mb-2 font-semibold">Formação</h4>
              <ul>{perfil.formacao.map((f, i) => <li key={i}>{f.curso} · {f.instituicao}{f.conclusao && ` (${f.conclusao})`}</li>)}</ul>
            </div>
          )}
          <div>
            <h4 className="mb-2 font-semibold">Habilidades</h4>
            <div className="flex flex-wrap gap-2">
              {perfil.habilidades.map((h) => <span key={h} className="rounded-full bg-zinc-800 px-3 py-1">{h}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
