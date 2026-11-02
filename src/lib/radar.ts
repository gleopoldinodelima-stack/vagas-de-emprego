import { buscarGupy } from "./fontes/gupy";
import { adzunaConfigurada, buscarAdzuna } from "./fontes/adzuna";
import { ler, salvar } from "./storage";
import { CONFIG_PADRAO, type Config } from "./schemas";
import { casaPalavraChave, mesclar, naRegiao, type Vaga } from "./vagas";

export type ResultadoRadar = {
  rodouEm: string;
  encontradas: number; // vagas na região nesta rodada
  inéditas: number;
  total: number;
  erros: string[];
};

/** Aplica os filtros de região e palavra-chave. A Adzuna já vem filtrada pelo raio em km. */
export function filtrar(vagas: Vaga[], config: Config): Vaga[] {
  return vagas.filter(
    (v) =>
      casaPalavraChave(v.titulo, v.palavraChave) &&
      (v.fonte === "adzuna" ? !v.remoto || config.aceitaRemoto : naRegiao(v, config)),
  );
}

export async function rodarRadar(): Promise<ResultadoRadar> {
  const config = (await ler<Config>("config")) ?? CONFIG_PADRAO;
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

  const resultado: ResultadoRadar = {
    rodouEm: agora,
    encontradas: naRegiaoAgora.length,
    inéditas: inéditas.length,
    total: todas.length,
    erros,
  };
  await salvar("ultima-rodada", resultado);
  return resultado;
}
