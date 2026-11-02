import type { Config } from "./schemas";

export type Vaga = {
  id: string; // "<fonte>:<id na fonte>"
  fonte: "gupy" | "adzuna";
  titulo: string;
  empresa: string | null;
  cidade: string | null;
  estado: string | null;
  remoto: boolean;
  modelo: string | null; // presencial / híbrido / remoto
  url: string;
  publicadaEm: string | null;
  descricao: string;
  salarioMin?: number | null;
  salarioMax?: number | null;
  palavraChave: string;
  encontradaEm: string;
};

export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** A vaga está na região alvo (ou é remota e o usuário aceita remoto)? */
export function naRegiao(vaga: Vaga, config: Config): boolean {
  if (vaga.remoto) return config.aceitaRemoto;
  if (!vaga.cidade) return false;
  const cidade = normalizar(vaga.cidade);
  return config.cidadesAlvo.some((alvo) => normalizar(alvo) === cidade);
}

/** O título tem alguma palavra excluída (ex.: estágio)? */
export function temExcluida(titulo: string, excluidas: string[]): boolean {
  const t = normalizar(titulo);
  return excluidas.some((e) => e.trim() && t.includes(normalizar(e)));
}

/** Salário anunciado abaixo da pretensão? Vagas sem salário passam. */
export function abaixoDaPretensao(vaga: Vaga, pretensao: number | null): boolean {
  if (!pretensao) return false;
  const teto = vaga.salarioMax ?? vaga.salarioMin;
  return teto != null && teto < pretensao;
}

/** O título casa com a palavra-chave? Todas as palavras precisam aparecer. */
export function casaPalavraChave(titulo: string, palavraChave: string): boolean {
  const t = normalizar(titulo);
  return normalizar(palavraChave)
    .split(/\s+/)
    .filter((p) => p.length > 2) // ignora "de", "da"...
    .every((p) => t.includes(p));
}

/** Junta vagas novas às já salvas, sem duplicar, mantendo a data da 1ª descoberta. */
export function mesclar(antigas: Vaga[], novas: Vaga[]): { todas: Vaga[]; inéditas: Vaga[] } {
  const porId = new Map(antigas.map((v) => [v.id, v]));
  const inéditas: Vaga[] = [];
  for (const v of novas) {
    const existente = porId.get(v.id);
    if (existente) {
      porId.set(v.id, { ...v, encontradaEm: existente.encontradaEm });
    } else {
      porId.set(v.id, v);
      inéditas.push(v);
    }
  }
  const todas = [...porId.values()].sort((a, b) =>
    (b.publicadaEm ?? b.encontradaEm).localeCompare(a.publicadaEm ?? a.encontradaEm),
  );
  return { todas, inéditas };
}
