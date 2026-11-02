import type { Candidatura, Config, Perfil, Status } from "@/lib/schemas";
import type { ResultadoRadar } from "@/lib/radar";
import type { Vaga } from "@/lib/vagas";

export type Dados = {
  perfil: Perfil | null;
  config: Config | null;
  vagas: Vaga[];
  rodada: ResultadoRadar | null;
  candidaturas: Record<string, Candidatura>;
};

export const ROTULOS: Record<Status, string> = {
  nova: "Nova",
  preparada: "Currículo pronto",
  candidatado: "Candidatado",
  entrevista: "Entrevista",
  recusado: "Recusado",
  descartada: "Descartada",
};

export const CORES: Record<Status, string> = {
  nova: "bg-zinc-700 text-zinc-200",
  preparada: "bg-yellow-400 text-black",
  candidatado: "bg-sky-500 text-black",
  entrevista: "bg-green-500 text-black",
  recusado: "bg-red-500/80 text-white",
  descartada: "bg-zinc-800 text-zinc-500",
};

export const cartao = "rounded-xl border border-zinc-800 bg-zinc-900 p-5";
export const botao = "rounded bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-50";
export const botaoSec = "rounded border border-zinc-700 px-3 py-1.5 text-sm hover:border-yellow-400 disabled:opacity-50";
