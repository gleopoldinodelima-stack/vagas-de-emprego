"use client";

import { useEffect, useState } from "react";
import type { Config, Perfil } from "@/lib/schemas";

export default function Home() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    fetch("/api/curriculo").then((r) => r.json()).then((d) => setPerfil(d.perfil));
    fetch("/api/config").then((r) => r.json()).then((d) => setConfig(d.config));
  }, []);

  async function enviarCurriculo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/curriculo", { method: "POST", body: new FormData(e.currentTarget) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      setPerfil(d.perfil);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no envio.");
    } finally {
      setEnviando(false);
    }
  }

  async function salvarConfig() {
    if (!config) return;
    setSalvo(false);
    const r = await fetch("/api/config", { method: "PUT", body: JSON.stringify(config) });
    if (r.ok) setSalvo(true);
  }

  const lista = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">🦇 Radar de Vagas</h1>
        <p className="text-zinc-400">Etapa 1: seu currículo e o alvo da busca.</p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 text-xl font-semibold">1. Currículo</h2>
        <form onSubmit={enviarCurriculo} className="flex flex-wrap items-center gap-3">
          <input type="file" name="curriculo" accept="application/pdf" required
            className="text-sm file:mr-3 file:rounded file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:font-semibold file:text-black" />
          <button disabled={enviando}
            className="rounded bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-50">
            {enviando ? "Lendo com Claude..." : "Enviar PDF"}
          </button>
        </form>
        {erro && <p className="mt-3 text-red-400">{erro}</p>}

        {perfil && (
          <div className="mt-5 space-y-4 text-sm">
            <div>
              <p className="text-lg font-semibold">{perfil.nome}</p>
              <p className="text-zinc-400">
                {[perfil.cargoAtual, perfil.cidade, perfil.email, perfil.telefone].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2">{perfil.resumo}</p>
            </div>
            <div>
              <h3 className="font-semibold">Experiência</h3>
              <ul className="mt-1 space-y-2">
                {perfil.experiencias.map((x, i) => (
                  <li key={i}>
                    <span className="font-medium">{x.cargo}</span> · {x.empresa}{" "}
                    <span className="text-zinc-500">({x.inicio ?? "?"} a {x.fim ?? "atual"})</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              {perfil.habilidades.map((h) => (
                <span key={h} className="rounded-full bg-zinc-800 px-3 py-1">{h}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {config && (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-3 text-xl font-semibold">2. Alvo da busca</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Palavras-chave (separadas por vírgula)
              <input className="mt-1 w-full rounded bg-zinc-800 p-2"
                defaultValue={config.palavrasChave.join(", ")}
                onChange={(e) => setConfig({ ...config, palavrasChave: lista(e.target.value) })} />
            </label>
            <label className="text-sm">Cidade base
              <input className="mt-1 w-full rounded bg-zinc-800 p-2" value={config.cidadeBase}
                onChange={(e) => setConfig({ ...config, cidadeBase: e.target.value })} />
            </label>
            <label className="text-sm">Cidades alvo
              <input className="mt-1 w-full rounded bg-zinc-800 p-2"
                defaultValue={config.cidadesAlvo.join(", ")}
                onChange={(e) => setConfig({ ...config, cidadesAlvo: lista(e.target.value) })} />
            </label>
            <label className="text-sm">Raio máximo (km)
              <input type="number" min={1} className="mt-1 w-full rounded bg-zinc-800 p-2" value={config.raioKm}
                onChange={(e) => setConfig({ ...config, raioKm: Number(e.target.value) || 1 })} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={config.aceitaRemoto}
                onChange={(e) => setConfig({ ...config, aceitaRemoto: e.target.checked })} />
              Aceito vagas remotas
            </label>
          </div>
          <button onClick={salvarConfig} className="mt-4 rounded bg-yellow-400 px-4 py-2 font-semibold text-black">
            Salvar alvo
          </button>
          {salvo && <span className="ml-3 text-green-400">Salvo.</span>}
        </section>
      )}
    </main>
  );
}
