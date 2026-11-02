"use client";

import { useCallback, useEffect, useState } from "react";
import { Painel } from "./abas/Painel";
import { Vagas } from "./abas/Vagas";
import { Curriculo } from "./abas/Curriculo";
import { Configuracao } from "./abas/Configuracao";
import type { Dados } from "./abas/tipos";

const ABAS = ["Painel", "Vagas", "Meu currículo", "Configuração"] as const;
type Aba = (typeof ABAS)[number];

export default function Home() {
  const [aba, setAba] = useState<Aba>("Painel");
  const [buscando, setBuscando] = useState(false);
  const [dados, setDados] = useState<Dados>({ perfil: null, config: null, vagas: [], rodada: null, candidaturas: {} });

  const carregar = useCallback(async () => {
    const [cv, cfg, radar, cand] = await Promise.all(
      ["/api/curriculo", "/api/config", "/api/radar", "/api/candidaturas"].map((u) => fetch(u).then((r) => r.json())),
    );
    setDados({ perfil: cv.perfil, config: cfg.config, vagas: radar.vagas, rodada: radar.ultimaRodada, candidaturas: cand.candidaturas });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial vinda da API
    carregar();
  }, [carregar]);

  async function rodarRadar() {
    setBuscando(true);
    try {
      await fetch("/api/radar", { method: "POST" });
      await carregar();
    } finally {
      setBuscando(false);
    }
  }

  const novas = dados.vagas.filter((v) => !dados.candidaturas[v.id] || dados.candidaturas[v.id].status === "nova").length;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">🦇 Radar de Vagas</h1>
          <p className="text-sm text-zinc-400">
            {dados.perfil ? `Caçando vagas para ${dados.perfil.nome.split(" ")[0]}` : "Comece enviando seu currículo"}
          </p>
        </div>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-zinc-800">
        {ABAS.map((a) => (
          <button key={a} onClick={() => setAba(a)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${aba === a ? "border-yellow-400 text-yellow-400" : "border-transparent text-zinc-400 hover:text-zinc-100"}`}>
            {a}
            {a === "Vagas" && novas > 0 && <span className="ml-2 rounded-full bg-yellow-400 px-2 text-xs text-black">{novas}</span>}
          </button>
        ))}
      </nav>

      {aba === "Painel" && <Painel dados={dados} rodarRadar={rodarRadar} buscando={buscando} />}
      {aba === "Vagas" && (
        <Vagas dados={dados}
          aoMudar={(c) => setDados((d) => ({ ...d, candidaturas: { ...d.candidaturas, [c.vagaId]: c } }))} />
      )}
      {aba === "Meu currículo" && <Curriculo perfil={dados.perfil} aoEnviar={(perfil) => setDados((d) => ({ ...d, perfil }))} />}
      {aba === "Configuração" && dados.config && (
        <Configuracao inicial={dados.config} aoSalvar={(config) => setDados((d) => ({ ...d, config }))} />
      )}
    </main>
  );
}
