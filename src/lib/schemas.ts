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
};
