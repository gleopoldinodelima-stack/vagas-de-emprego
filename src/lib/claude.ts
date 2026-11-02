import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { PerfilSchema, type Perfil } from "./schemas";

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
