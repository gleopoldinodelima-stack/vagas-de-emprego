import { buscarGupy } from "./fontes/gupy";
import { adzunaConfigurada, buscarAdzuna } from "./fontes/adzuna";
import { ler, salvar } from "./storage";
import type { Config } from "./schemas";
import { lerConfig } from "./config";
import { prepararNovas } from "./candidaturas";
import { abaixoDaPretensao, casaPalavraChave, mesclar, naRegiao, temExcluida, type Vaga } from "./vagas";

export type ResultadoRadar = {
  rodouEm: string;
  encontradas: number; // vagas na região nesta rodada
  inéditas: number;
  total: number;
  erros: string[];
  preparadas: number; // currículos adaptados automaticamente nesta rodada
};

/** Aplica os filtros de região e palavra-chave. A Adzuna já vem filtrada pelo raio em km. */
export function filtrar(vagas: Vaga[], config: Config): Vaga[] {
  return vagas.filter(
    (v) =>
      casaPalavraChave(v.titulo, v.palavraChave) &&
      !temExcluida(v.titulo, config.palavrasExcluidas) &&
      !abaixoDaPretensao(v, config.pretensaoSalarial) &&
      (v.fonte === "adzuna" ? !v.remoto || config.aceitaRemoto : naRegiao(v, config)),
  );
}

export async function rodarRadar(): Promise<ResultadoRadar> {
  const config = await lerConfig();
  const agora = new Date().toISOString();
  const erros: string[] = [];
  const brutas: Vaga[] = [];

  for (const palavra of config.palavrasChave) {
    const buscas: Promise<Vaga[]>[] = [buscarGupy(palavra, agora)];
    if (adzunaConfigurada()) buscas.push(buscarAdzuna(palavra, config, agora));

    for (const r of await Promise.allSettled(buscas)) {
      if (r.status === "fulfilled") brutas.push(...r.value);
      else erros.push(`"${palavra}": ${r.reason instanceof Error ? r.reason.message : r.reason}`);
    }
  }

  const naRegiaoAgora = filtrar(brutas, config);
  const { todas, inéditas } = mesclar((await ler<Vaga[]>("vagas")) ?? [], naRegiaoAgora);
  await salvar("vagas", todas);

  let preparadas = 0;
  if (config.modoAutomatico && inéditas.length > 0) {
    try {
      preparadas = await prepararNovas(inéditas, config);
    } catch (e) {
      erros.push(`preparo automático: ${e instanceof Error ? e.message : e}`);
    }
  }

  const resultado: ResultadoRadar = {
    rodouEm: agora,
    encontradas: naRegiaoAgora.length,
    inéditas: inéditas.length,
    total: todas.length,
    erros,
    preparadas,
  };
  await salvar("ultima-rodada", resultado);
  return resultado;
}
