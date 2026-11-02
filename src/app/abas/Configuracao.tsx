"use client";

import { useState } from "react";
import type { Config } from "@/lib/schemas";
import { botao, cartao } from "./tipos";

const lista = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const campo = "mt-1 w-full rounded bg-zinc-800 p-2";

export function Configuracao({ inicial, aoSalvar }: { inicial: Config; aoSalvar: (c: Config) => void }) {
  const [c, setC] = useState(inicial);
  // textos livres dos campos de lista, para não "comer" a vírgula enquanto digita
  const [textos, setTextos] = useState({
    palavras: inicial.palavrasChave.join(", "),
    excluidas: inicial.palavrasExcluidas.join(", "),
    cidades: inicial.cidadesAlvo.join(", "),
  });
  const [msg, setMsg] = useState<string | null>(null);

  async function salvar() {
    const config: Config = {
      ...c,
      palavrasChave: lista(textos.palavras),
      palavrasExcluidas: lista(textos.excluidas),
      cidadesAlvo: lista(textos.cidades),
    };
    const r = await fetch("/api/config", { method: "PUT", body: JSON.stringify(config) });
    if (r.ok) {
      aoSalvar(config);
      setMsg("Salvo.");
    } else {
      setMsg("Confira os campos: precisa de pelo menos uma palavra-chave.");
    }
  }

  return (
    <div className="space-y-6">
      <div className={cartao}>
        <h3 className="mb-3 font-semibold">O que buscar</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Palavras-chave (separadas por vírgula)
            <input className={campo} value={textos.palavras} onChange={(e) => setTextos({ ...textos, palavras: e.target.value })} />
          </label>
          <label className="text-sm">Ignorar vagas com
            <input className={campo} value={textos.excluidas} onChange={(e) => setTextos({ ...textos, excluidas: e.target.value })} />
          </label>
          <label className="text-sm">Área
            <input className={campo} value={c.area} onChange={(e) => setC({ ...c, area: e.target.value })} />
          </label>
          <label className="text-sm">Pretensão salarial (R$ por mês)
            <input type="number" min={0} step={100} className={campo} value={c.pretensaoSalarial ?? ""}
              placeholder="Opcional"
              onChange={(e) => setC({ ...c, pretensaoSalarial: e.target.value ? Number(e.target.value) : null })} />
            <span className="text-xs text-zinc-500">Vagas que anunciam salário abaixo disso são ignoradas.</span>
          </label>
        </div>
      </div>

      <div className={cartao}>
        <h3 className="mb-3 font-semibold">Onde</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Cidade base
            <input className={campo} value={c.cidadeBase} onChange={(e) => setC({ ...c, cidadeBase: e.target.value })} />
          </label>
          <label className="text-sm">Raio máximo (km)
            <input type="number" min={1} className={campo} value={c.raioKm}
              onChange={(e) => setC({ ...c, raioKm: Number(e.target.value) || 1 })} />
          </label>
          <label className="text-sm sm:col-span-2">Cidades aceitas
            <input className={campo} value={textos.cidades} onChange={(e) => setTextos({ ...textos, cidades: e.target.value })} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={c.aceitaRemoto} onChange={(e) => setC({ ...c, aceitaRemoto: e.target.checked })} />
            Aceito vagas remotas
          </label>
        </div>
      </div>

      <div className={cartao}>
        <h3 className="mb-1 font-semibold">Candidatura automática</h3>
        <p className="mb-3 text-sm text-zinc-400">
          Quando o radar acha vagas novas, o Claude avalia cada uma e já deixa pronto o currículo adaptado e a
          mensagem. As que passam da nota mínima aparecem como “Currículo pronto”, e você só clica em Candidatar.
          O envio final é sempre seu: robôs que se candidatam sozinhos violam as regras do LinkedIn e da Gupy.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={c.modoAutomatico} onChange={(e) => setC({ ...c, modoAutomatico: e.target.checked })} />
            Preparar currículos automaticamente
          </label>
          <label className="text-sm">Nota mínima de compatibilidade (0 a 100)
            <input type="number" min={0} max={100} className={campo} value={c.notaMinima}
              onChange={(e) => setC({ ...c, notaMinima: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={salvar} className={botao}>Salvar configurações</button>
        {msg && <span className="text-sm text-zinc-300">{msg}</span>}
      </div>
    </div>
  );
}
