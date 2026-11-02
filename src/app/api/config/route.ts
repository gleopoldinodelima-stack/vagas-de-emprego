import { connection } from "next/server";
import { salvar } from "@/lib/storage";
import { lerConfig } from "@/lib/config";
import { ConfigSchema } from "@/lib/schemas";

export async function GET() {
  await connection(); // sempre ler o arquivo atual, sem pré-renderizar
  return Response.json({ config: await lerConfig() });
}

export async function PUT(request: Request) {
  const resultado = ConfigSchema.safeParse(await request.json());
  if (!resultado.success) {
    return Response.json({ erro: "Configuração inválida." }, { status: 400 });
  }
  await salvar("config", resultado.data);
  return Response.json({ config: resultado.data });
}
