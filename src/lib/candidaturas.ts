import { analisarVaga } from "./claude";
import { ler, salvar } from "./storage";
import type { Candidatura, Config, Perfil, Status } from "./schemas";
import type { Vaga } from "./vagas";

// Limite de vagas analisadas por rodada automática (controla o custo da API)
export const MAX_POR_RODADA = 15;

export async function lerCandidaturas(): Promise<Record<string, Candidatura>> {
  return (await ler<Record<string, Candidatura>>("candidaturas")) ?? {};
}

async function atualizar(vagaId: string, mudanca: Partial<Candidatura>): Promise<Candidatura> {
  const todas = await lerCandidaturas();
  const atual: Candidatura = todas[vagaId] ?? {
    vagaId, status: "nova", analise: null, atualizadoEm: "",
  };
  const nova = { ...atual, ...mudanca, vagaId, atualizadoEm: new Date().toISOString() };
  todas[vagaId] = nova;
  await salvar("candidaturas", todas);
  return nova;
}

export const mudarStatus = (vagaId: string, status: Status) => atualizar(vagaId, { status });

/** Pede ao Claude a análise e o currículo adaptado para uma vaga. */
export async function preparar(vaga: Vaga, perfil: Perfil, config: Config): Promise<Candidatura> {
  const analise = await analisarVaga(perfil, await completarDescricao(vaga), config);
  const atual = (await lerCandidaturas())[vaga.id];
  // só avança o status se a vaga ainda não foi trabalhada
  const status: Status =
    !atual || atual.status === "nova"
      ? analise.nota >= config.notaMinima ? "preparada" : "nova"
      : atual.status;
  return atualizar(vaga.id, { analise, status });
}

/** Modo automático: prepara as vagas novas mais recentes, até o limite. */
export async function prepararNovas(vagas: Vaga[], config: Config): Promise<number> {
  const perfil = await ler<Perfil>("perfil");
  if (!perfil) throw new Error("envie seu currículo primeiro");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("falta ANTHROPIC_API_KEY");

  let feitas = 0;
  for (const vaga of vagas.slice(0, MAX_POR_RODADA)) {
    const c = await preparar(vaga, perfil, config);
    if (c.status === "preparada") feitas++;
  }
  return feitas;
}

/** A busca da Gupy traz pouca descrição: completa lendo a página da vaga. */
export async function completarDescricao(vaga: Vaga): Promise<Vaga> {
  if (vaga.descricao.length >= 300) return vaga;
  try {
    const r = await fetch(vaga.url, { headers: { accept: "text/html" } });
    if (!r.ok) return vaga;
    const texto = (await r.text())
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return texto.length > vaga.descricao.length ? { ...vaga, descricao: texto.slice(0, 20000) } : vaga;
  } catch {
    return vaga;
  }
}
