import { connection } from "next/server";
import { rodarRadar, type ResultadoRadar } from "@/lib/radar";
import { ler } from "@/lib/storage";
import type { Vaga } from "@/lib/vagas";

export async function GET() {
  await connection();
  return Response.json({
    vagas: (await ler<Vaga[]>("vagas")) ?? [],
    ultimaRodada: await ler<ResultadoRadar>("ultima-rodada"),
  });
}

export async function POST() {
  const resultado = await rodarRadar();
  return Response.json({ resultado, vagas: (await ler<Vaga[]>("vagas")) ?? [] });
}
