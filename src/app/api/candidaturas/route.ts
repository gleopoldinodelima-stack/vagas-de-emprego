import { connection } from "next/server";
import { z } from "zod";
import { lerConfig } from "@/lib/config";
import { lerCandidaturas, mudarStatus, preparar } from "@/lib/candidaturas";
import { ler } from "@/lib/storage";
import { STATUS, type Perfil } from "@/lib/schemas";
import type { Vaga } from "@/lib/vagas";

export async function GET() {
  await connection();
  return Response.json({ candidaturas: await lerCandidaturas() });
}

// Muda o status (ex.: marcou que se candidatou)
export async function PATCH(request: Request) {
  const corpo = z.object({ vagaId: z.string(), status: z.enum(STATUS) }).safeParse(await request.json());
  if (!corpo.success) return Response.json({ erro: "Pedido inválido." }, { status: 400 });
  return Response.json({ candidatura: await mudarStatus(corpo.data.vagaId, corpo.data.status) });
}

// Prepara currículo e mensagem adaptados para uma vaga
export async function POST(request: Request) {
  const corpo = z.object({ vagaId: z.string() }).safeParse(await request.json());
  if (!corpo.success) return Response.json({ erro: "Pedido inválido." }, { status: 400 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ erro: "Falta ANTHROPIC_API_KEY no .env.local." }, { status: 500 });
  }
  const perfil = await ler<Perfil>("perfil");
  if (!perfil) return Response.json({ erro: "Envie seu currículo na aba Meu currículo." }, { status: 400 });
  const vaga = ((await ler<Vaga[]>("vagas")) ?? []).find((v) => v.id === corpo.data.vagaId);
  if (!vaga) return Response.json({ erro: "Vaga não encontrada." }, { status: 404 });

  try {
    return Response.json({ candidatura: await preparar(vaga, perfil, await lerConfig()) });
  } catch (e) {
    return Response.json({ erro: e instanceof Error ? e.message : "Falha ao preparar." }, { status: 500 });
  }
}
