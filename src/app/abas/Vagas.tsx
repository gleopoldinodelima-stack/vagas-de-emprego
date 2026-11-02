"use client";

import { useState } from "react";
import { STATUS, type Candidatura, type Status } from "@/lib/schemas";
import { normalizar } from "@/lib/vagas";
import { CORES, ROTULOS, botaoSec, cartao, type Dados } from "./tipos";

type Props = {
  dados: Dados;
  aoMudar: (c: Candidatura) => void;
};

export function Vagas({ dados, aoMudar }: Props) {
  const [filtro, setFiltro] = useState<Status | "todas">("todas");
  const [busca, setBusca] = useState("");
  const [preparando, setPreparando] = useState<string | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const { vagas, candidaturas } = dados;

  const statusDe = (id: string): Status => candidaturas[id]?.status ?? "nova";
  const lista = vagas.filter(
    (v) =>
      (filtro === "todas" ? statusDe(v.id) !== "descartada" : statusDe(v.id) === filtro) &&
      (!busca || normalizar(`${v.titulo} ${v.empresa} ${v.cidade}`).includes(normalizar(busca))),
  );

  async function preparar(vagaId: string) {
    setErro(null);
    setPreparando(vagaId);
    try {
      const r = await fetch("/api/candidaturas", { method: "POST", body: JSON.stringify({ vagaId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      aoMudar(d.candidatura);
      setAberta(vagaId);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao preparar.");
    } finally {
      setPreparando(null);
    }
  }

  async function mudarStatus(vagaId: string, status: Status) {
    const r = await fetch("/api/candidaturas", { method: "PATCH", body: JSON.stringify({ vagaId, status }) });
    if (r.ok) aoMudar((await r.json()).candidatura);
  }

  async function candidatar(vagaId: string, url: string) {
    const carta = candidaturas[vagaId]?.analise?.carta;
    if (carta) await navigator.clipboard?.writeText(carta).catch(() => {});
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input placeholder="Buscar cargo, empresa ou cidade" value={busca} onChange={(e) => setBusca(e.target.value)}
          className="min-w-0 flex-1 rounded bg-zinc-800 p-2 text-sm" />
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as Status | "todas")}
          className="rounded bg-zinc-800 p-2 text-sm">
          <option value="todas">Todas (menos descartadas)</option>
          {STATUS.map((s) => <option key={s} value={s}>{ROTULOS[s]}</option>)}
        </select>
      </div>
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      <p className="text-xs text-zinc-500">{lista.length} vagas</p>

      {lista.length === 0 && <p className={`${cartao} text-sm text-zinc-500`}>Nenhuma vaga aqui. Rode o radar no Painel.</p>}

      <ul className="space-y-3">
        {lista.map((v) => {
          const c = candidaturas[v.id];
          const status = statusDe(v.id);
          const a = c?.analise;
          return (
            <li key={v.id} className={cartao}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <a href={v.url} target="_blank" rel="noreferrer" className="font-semibold hover:text-yellow-400">{v.titulo}</a>
                  <p className="text-sm text-zinc-400">
                    {[v.empresa, v.remoto ? "Remoto" : v.cidade, v.modelo, v.fonte.toUpperCase()].filter(Boolean).join(" · ")}
                  </p>
                  {v.publicadaEm && <p className="text-xs text-zinc-500">Publicada em {new Date(v.publicadaEm).toLocaleDateString("pt-BR")}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {a && <span className="text-2xl font-bold text-yellow-400" title="Compatibilidade">{a.nota}</span>}
                  <select value={status} onChange={(e) => mudarStatus(v.id, e.target.value as Status)}
                    className={`rounded px-2 py-1 text-xs ${CORES[status]}`}>
                    {STATUS.map((s) => <option key={s} value={s}>{ROTULOS[s]}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button className={botaoSec} disabled={preparando !== null} onClick={() => preparar(v.id)}>
                  {preparando === v.id ? "Adaptando com Claude..." : a ? "Refazer currículo" : "Adaptar currículo"}
                </button>
                {a && (
                  <>
                    <button className={botaoSec} onClick={() => setAberta(aberta === v.id ? null : v.id)}>
                      {aberta === v.id ? "Esconder análise" : "Ver análise"}
                    </button>
                    <a className={botaoSec} href={`/curriculo/${encodeURIComponent(v.id)}`} target="_blank">Currículo em PDF</a>
                    <button className={botaoSec} onClick={() => candidatar(v.id, v.url)} title="Copia a mensagem e abre a vaga">
                      Candidatar
                    </button>
                    {status === "preparada" && (
                      <button className={botaoSec} onClick={() => mudarStatus(v.id, "candidatado")}>Já enviei ✓</button>
                    )}
                  </>
                )}
              </div>

              {a && aberta === v.id && (
                <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-green-400">Pontos fortes</h4>
                    <ul className="list-disc pl-5">{a.pontosFortes.map((p, i) => <li key={i}>{p}</li>)}</ul>
                    <h4 className="mt-3 font-semibold text-red-400">Lacunas</h4>
                    <ul className="list-disc pl-5">{a.lacunas.map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Mensagem de apresentação</h4>
                    <p className="mt-1 whitespace-pre-wrap rounded bg-zinc-800 p-3">{a.carta}</p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
