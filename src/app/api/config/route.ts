import { connection } from "next/server";
import { ler, salvar } from "@/lib/storage";
import { CONFIG_PADRAO, ConfigSchema, type Config } from "@/lib/schemas";

export async function GET() {
  await connection(); // sempre ler o arquivo atual, sem pré-renderizar
  return Response.json({ config: (await ler<Config>("config")) ?? CONFIG_PADRAO });
}

export async function PUT(request: Request) {
  const resultado = ConfigSchema.safeParse(await request.json());
  if (!resultado.success) {
    return Response.json({ erro: "Configuração inválida." }, { status: 400 });
  }
  await salvar("config", resultado.data);
  return Response.json({ config: resultado.data });
}
