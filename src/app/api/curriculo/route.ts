import { connection } from "next/server";
import { extrairPerfil } from "@/lib/claude";
import { ler, salvar } from "@/lib/storage";
import type { Perfil } from "@/lib/schemas";

const LIMITE = 10 * 1024 * 1024; // 10 MB

export async function GET() {
  await connection(); // sempre ler o arquivo atual, sem pré-renderizar
  return Response.json({ perfil: await ler<Perfil>("perfil") });
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { erro: "Falta a chave do Claude: crie o arquivo .env.local com ANTHROPIC_API_KEY=..." },
      { status: 500 },
    );
  }
  const form = await request.formData();
  const arquivo = form.get("curriculo");
  if (!(arquivo instanceof File)) {
    return Response.json({ erro: "Envie o currículo no campo 'curriculo'." }, { status: 400 });
  }
  if (arquivo.type !== "application/pdf") {
    return Response.json({ erro: "O currículo precisa ser um PDF." }, { status: 400 });
  }
  if (arquivo.size > LIMITE) {
    return Response.json({ erro: "PDF maior que 10 MB." }, { status: 400 });
  }

  const pdf = Buffer.from(await arquivo.arrayBuffer());
  try {
    const perfil = await extrairPerfil(pdf);
    await salvar("perfil", perfil);
    await salvar("curriculo-original", { nome: arquivo.name, base64: pdf.toString("base64") });
    return Response.json({ perfil });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao ler o currículo.";
    return Response.json({ erro: msg }, { status: 500 });
  }
}
