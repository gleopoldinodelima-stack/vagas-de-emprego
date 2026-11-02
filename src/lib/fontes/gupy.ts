// Busca pública de vagas da Gupy (a mesma usada pelo portal portal.gupy.io).
import type { Vaga } from "../vagas";

const BASE = "https://portal.api.gupy.io/api/job";
const POR_PAGINA = 100;
const MAX_PAGINAS = 5;

export type GupyJob = {
  id: number;
  name: string;
  careerPageName?: string | null;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  isRemoteWork?: boolean | null;
  workplaceType?: string | null; // "remote" | "hybrid" | "on-site"
  jobUrl: string;
  publishedDate?: string | null;
};

type GupyResposta = { data: GupyJob[]; pagination?: { total?: number } };

const MODELOS: Record<string, string> = {
  remote: "remoto",
  hybrid: "híbrido",
  "on-site": "presencial",
};

export function converterGupy(job: GupyJob, palavraChave: string, agora: string): Vaga {
  const remoto = job.workplaceType === "remote" || job.isRemoteWork === true;
  return {
    id: `gupy:${job.id}`,
    fonte: "gupy",
    titulo: job.name,
    empresa: job.careerPageName ?? null,
    cidade: job.city || null,
    estado: job.state || null,
    remoto,
    modelo: job.workplaceType ? (MODELOS[job.workplaceType] ?? job.workplaceType) : null,
    url: job.jobUrl,
    publicadaEm: job.publishedDate ?? null,
    descricao: job.description ?? "",
    palavraChave,
    encontradaEm: agora,
  };
}

export async function buscarGupy(palavraChave: string, agora = new Date().toISOString()): Promise<Vaga[]> {
  const vagas: Vaga[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const url = new URL(BASE);
    url.searchParams.set("name", palavraChave);
    url.searchParams.set("offset", String(pagina * POR_PAGINA));
    url.searchParams.set("limit", String(POR_PAGINA));

    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`Gupy respondeu ${r.status}`);
    const corpo = (await r.json()) as GupyResposta;

    vagas.push(...corpo.data.map((j) => converterGupy(j, palavraChave, agora)));
    if (corpo.data.length < POR_PAGINA) break;
  }
  return vagas;
}
