import { z } from "zod";

// Perfil extraído do currículo pelo Claude
export const PerfilSchema = z.object({
  nome: z.string(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  cidade: z.string().nullable(),
  linkedin: z.string().nullable(),
  resumo: z.string().describe("Resumo profissional em 2-4 frases, em português"),
  cargoAtual: z.string().nullable(),
  anosExperiencia: z.number().nullable(),
  experiencias: z.array(
    z.object({
      empresa: z.string(),
      cargo: z.string(),
      inicio: z.string().nullable(),
      fim: z.string().nullable().describe("null se for o emprego atual"),
      local: z.string().nullable(),
      atividades: z.array(z.string()),
    }),
  ),
  formacao: z.array(
    z.object({
      instituicao: z.string(),
      curso: z.string(),
      conclusao: z.string().nullable(),
    }),
  ),
  habilidades: z.array(z.string()),
  certificacoes: z.array(z.string()),
  idiomas: z.array(z.object({ idioma: z.string(), nivel: z.string() })),
});
export type Perfil = z.infer<typeof PerfilSchema>;

// Configuração da busca de vagas
export const ConfigSchema = z.object({
  palavrasChave: z.array(z.string().min(1)).min(1),
  area: z.string(),
  cidadeBase: z.string(),
  cidadesAlvo: z.array(z.string()),
  raioKm: z.number().int().positive(),
  aceitaRemoto: z.boolean(),
  palavrasExcluidas: z.array(z.string()),
  pretensaoSalarial: z.number().nonnegative().nullable(),
  modoAutomatico: z.boolean().describe("Preparar currículo sozinho para vagas novas"),
  notaMinima: z.number().int().min(0).max(100),
});
export type Config = z.infer<typeof ConfigSchema>;

export const CONFIG_PADRAO: Config = {
  palavrasChave: ["analista de logística", "líder de logística", "assistente de logística"],
  area: "logística",
  cidadeBase: "Franco da Rocha, SP",
  cidadesAlvo: [
    "Franco da Rocha",
    "Cajamar",
    "Caieiras",
    "Francisco Morato",
    "Jundiaí",
    "São Paulo",
  ],
  raioKm: 35,
  aceitaRemoto: true,
  palavrasExcluidas: ["estágio", "estagiário", "jovem aprendiz"],
  pretensaoSalarial: null,
  modoAutomatico: false,
  notaMinima: 70,
};

// Candidatura: o que o Claude preparou para uma vaga e em que pé ela está
export const STATUS = ["nova", "preparada", "candidatado", "entrevista", "recusado", "descartada"] as const;
export type Status = (typeof STATUS)[number];

export const AnaliseSchema = z.object({
  nota: z.number().int().min(0).max(100).describe("Compatibilidade do candidato com a vaga, 0 a 100"),
  pontosFortes: z.array(z.string()).describe("Até 4 motivos pelos quais o candidato combina"),
  lacunas: z.array(z.string()).describe("Até 3 requisitos da vaga que o currículo não mostra"),
  resumo: z.string().describe("Resumo profissional reescrito para esta vaga, 3-4 frases"),
  experiencias: z.array(
    z.object({
      empresa: z.string(),
      cargo: z.string(),
      periodo: z.string(),
      atividades: z.array(z.string()).describe("Reordenadas e reescritas com foco na vaga, sem inventar"),
    }),
  ),
  habilidades: z.array(z.string()).describe("Habilidades reais do candidato, as mais relevantes primeiro"),
  carta: z.string().describe("Mensagem de apresentação curta (até 120 palavras) para enviar com a candidatura"),
});
export type Analise = z.infer<typeof AnaliseSchema>;

export type Candidatura = {
  vagaId: string;
  status: Status;
  analise: Analise | null;
  atualizadoEm: string;
};
