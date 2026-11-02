// API oficial da Adzuna (chave gratuita em developer.adzuna.com).
// Só roda se ADZUNA_APP_ID e ADZUNA_APP_KEY estiverem no .env.local.
import type { Config } from "../schemas";
import type { Vaga } from "../vagas";

export type AdzunaJob = {
  id: string;
  title: string;
  description?: string;
  redirect_url: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
};

export const adzunaConfigurada = () =>
  Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);

export function converterAdzuna(job: AdzunaJob, palavraChave: string, agora: string): Vaga {
  const area = job.location?.area ?? [];
  // area vem como ["Brasil", "São Paulo", "Cajamar"]; a cidade é o último nível
  const cidade = area.length >= 3 ? area[area.length - 1] : null;
  const remoto = /remot|home office/i.test(`${job.title} ${job.location?.display_name ?? ""}`);
  return {
    id: `adzuna:${job.id}`,
    fonte: "adzuna",
    titulo: job.title.replace(/<\/?[^>]+>/g, ""),
    empresa: job.company?.display_name ?? null,
    cidade,
    estado: area[1] ?? null,
    remoto,
    modelo: remoto ? "remoto" : null,
    url: job.redirect_url,
    publicadaEm: job.created ?? null,
    descricao: (job.description ?? "").replace(/<\/?[^>]+>/g, ""),
    palavraChave,
    encontradaEm: agora,
  };
}

export async function buscarAdzuna(
  palavraChave: string,
  config: Config,
  agora = new Date().toISOString(),
): Promise<Vaga[]> {
  const url = new URL("https://api.adzuna.com/v1/api/jobs/br/search/1");
  url.searchParams.set("app_id", process.env.ADZUNA_APP_ID!);
  url.searchParams.set("app_key", process.env.ADZUNA_APP_KEY!);
  url.searchParams.set("what", palavraChave);
  url.searchParams.set("where", config.cidadeBase);
  url.searchParams.set("distance", String(config.raioKm));
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("content-type", "application/json");

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Adzuna respondeu ${r.status}`);
  const corpo = (await r.json()) as { results: AdzunaJob[] };
  return corpo.results.map((j) => converterAdzuna(j, palavraChave, agora));
}
