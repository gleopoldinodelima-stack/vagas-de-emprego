import type { Status } from "@/lib/schemas";
import { CORES, ROTULOS, cartao, type Dados } from "./tipos";

export function Painel({ dados, rodarRadar, buscando }: { dados: Dados; rodarRadar: () => void; buscando: boolean }) {
  const { vagas, candidaturas, rodada } = dados;
  const statusDe = (id: string): Status => candidaturas[id]?.status ?? "nova";
  const conta = (s: Status) => vagas.filter((v) => statusDe(v.id) === s).length;

  const porCidade = Object.entries(
    vagas.reduce<Record<string, number>>((acc, v) => {
      const k = v.remoto ? "Remoto" : v.cidade ?? "Sem cidade";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCidade = Math.max(1, ...porCidade.map(([, n]) => n));

  const melhores = vagas
    .filter((v) => candidaturas[v.id]?.analise)
    .sort((a, b) => candidaturas[b.id]!.analise!.nota - candidaturas[a.id]!.analise!.nota)
    .slice(0, 5);

  const numeros = [
    { rotulo: "Vagas na região", valor: vagas.length },
    { rotulo: "Novas na última busca", valor: rodada?.inéditas ?? 0 },
    { rotulo: "Currículos prontos", valor: conta("preparada") },
    { rotulo: "Candidaturas enviadas", valor: conta("candidatado") + conta("entrevista") + conta("recusado") },
    { rotulo: "Entrevistas", valor: conta("entrevista") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          {rodada
            ? `Última busca: ${new Date(rodada.rodouEm).toLocaleString("pt-BR")}`
            : "O radar ainda não rodou."}
          {rodada && rodada.erros.length > 0 && (
            <span className="text-red-400"> · Falhas: {rodada.erros.join("; ")}</span>
          )}
        </p>
        <button onClick={rodarRadar} disabled={buscando} className="rounded bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-50">
          {buscando ? "Varrendo Gotham..." : "Rodar radar agora"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {numeros.map((n) => (
          <div key={n.rotulo} className={cartao}>
            <p className="text-3xl font-bold">{n.valor}</p>
            <p className="text-xs text-zinc-400">{n.rotulo}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={cartao}>
          <h3 className="mb-3 font-semibold">Vagas por cidade</h3>
          {porCidade.length === 0 && <p className="text-sm text-zinc-500">Sem vagas ainda.</p>}
          <ul className="space-y-2 text-sm">
            {porCidade.map(([cidade, n]) => (
              <li key={cidade}>
                <div className="flex justify-between"><span>{cidade}</span><span className="text-zinc-400">{n}</span></div>
                <div className="mt-1 h-2 rounded bg-zinc-800">
                  <div className="h-2 rounded bg-yellow-400" style={{ width: `${(n / maxCidade) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={cartao}>
          <h3 className="mb-3 font-semibold">Funil das candidaturas</h3>
          <ul className="space-y-2 text-sm">
            {(Object.keys(ROTULOS) as Status[]).filter((s) => s !== "descartada").map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className={`rounded px-2 py-0.5 text-xs ${CORES[s]}`}>{ROTULOS[s]}</span>
                <span className="font-semibold">{conta(s)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={cartao}>
        <h3 className="mb-3 font-semibold">Mais compatíveis com você</h3>
        {melhores.length === 0 ? (
          <p className="text-sm text-zinc-500">Prepare currículos na aba Vagas para ver as notas aqui.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 text-sm">
            {melhores.map((v) => (
              <li key={v.id} className="flex justify-between gap-3 py-2">
                <span>{v.titulo} <span className="text-zinc-500">· {v.empresa}</span></span>
                <span className="font-bold text-yellow-400">{candidaturas[v.id]!.analise!.nota}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
