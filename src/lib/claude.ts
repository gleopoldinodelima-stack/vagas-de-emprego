import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AnaliseSchema, PerfilSchema, type Analise, type Config, type Perfil } from "./schemas";
import type { Vaga } from "./vagas";

const client = new Anthropic(); // lê ANTHROPIC_API_KEY do ambiente
export const MODELO = "claude-opus-5-5";

export async function extrairPerfil(pdf: Buffer): Promise<Perfil> {
  const resposta = await client.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(PerfilSchema) },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: pdf.toString("base64"),
            },
          },
          {
            type: "text",
            text:
              "Este é o currículo de um candidato. Extraia os dados exatamente como estão, " +
              "sem inventar nada. Campos ausentes ficam null ou lista vazia. Escreva em português.",
          },
        ],
      },
    ],
  });

  if (resposta.stop_reason === "refusal") {
    throw new Error("O modelo recusou processar este arquivo.");
  }
  if (!resposta.parsed_output) {
    throw new Error("Não foi possível ler o currículo. Tente outro PDF.");
  }
  return resposta.parsed_output;
}

export async function analisarVaga(perfil: Perfil, vaga: Vaga, config: Config): Promise<Analise> {
  const pretensao = config.pretensaoSalarial
    ? `Pretensão salarial do candidato: R$ ${config.pretensaoSalarial.toLocaleString("pt-BR")}.`
    : "";
  const resposta = await client.messages.parse({
    model: MODELO,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(AnaliseSchema) },
    system:
      "Você é um recrutador experiente em " + config.area + " no Brasil. " +
      "Adapte currículos para vagas específicas sem nunca inventar experiências, empresas, datas, " +
      "cursos ou habilidades que não estejam no perfil. Você pode reordenar, resumir e reescrever " +
      "com o vocabulário da vaga. Seja honesto na nota de compatibilidade. Escreva em português do Brasil.",
    messages: [
      {
        role: "user",
        content:
          `<perfil>\n${JSON.stringify(perfil, null, 2)}\n</perfil>\n\n` +
          `<vaga>\nTítulo: ${vaga.titulo}\nEmpresa: ${vaga.empresa ?? "não informada"}\n` +
          `Local: ${vaga.remoto ? "remoto" : vaga.cidade ?? "não informado"}\n\n${vaga.descricao.slice(0, 20000)}\n</vaga>\n\n` +
          `${pretensao}\nAvalie a compatibilidade e gere o currículo adaptado e a mensagem de apresentação.`,
      },
    ],
  });
  if (resposta.stop_reason === "refusal") throw new Error("O modelo recusou analisar esta vaga.");
  if (!resposta.parsed_output) throw new Error("Não foi possível analisar a vaga.");
  return resposta.parsed_output;
}
