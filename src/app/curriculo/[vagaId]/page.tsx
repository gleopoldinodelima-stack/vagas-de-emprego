// Currículo adaptado, pronto para imprimir ou salvar como PDF (Ctrl+P).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { lerCandidaturas } from "@/lib/candidaturas";
import { ler } from "@/lib/storage";
import type { Perfil } from "@/lib/schemas";
import type { Vaga } from "@/lib/vagas";
import { BotaoImprimir } from "./imprimir";

export default function Pagina({ params }: PageProps<"/curriculo/[vagaId]">) {
  return (
    <Suspense fallback={<p className="p-10 text-zinc-500">Carregando currículo...</p>}>
      <CurriculoAdaptado params={params} />
    </Suspense>
  );
}

async function CurriculoAdaptado({ params }: { params: Promise<{ vagaId: string }> }) {
  await connection();
  const vagaId = decodeURIComponent((await params).vagaId);
  const [perfil, candidaturas, vagas] = await Promise.all([
    ler<Perfil>("perfil"),
    lerCandidaturas(),
    ler<Vaga[]>("vagas"),
  ]);
  const analise = candidaturas[vagaId]?.analise;
  const vaga = vagas?.find((v) => v.id === vagaId);
  if (!perfil || !analise) notFound();

  const contato = [perfil.email, perfil.telefone, perfil.cidade, perfil.linkedin].filter(Boolean).join(" · ");

  return (
    <div className="flex-1 bg-white text-zinc-900">
      <div className="mx-auto max-w-3xl p-10 print:p-0">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <p className="text-sm text-zinc-500">Adaptado para: {vaga?.titulo} {vaga?.empresa && `· ${vaga.empresa}`}</p>
          <BotaoImprimir />
        </div>
        <h1 className="text-3xl font-bold">{perfil.nome}</h1>
        <p className="text-sm text-zinc-600">{contato}</p>

        <h2 className="mt-6 border-b border-zinc-300 pb-1 text-lg font-semibold">Resumo</h2>
        <p className="mt-2 text-sm leading-relaxed">{analise.resumo}</p>

        <h2 className="mt-6 border-b border-zinc-300 pb-1 text-lg font-semibold">Experiência</h2>
        {analise.experiencias.map((x, i) => (
          <div key={i} className="mt-3 break-inside-avoid">
            <p className="font-semibold">{x.cargo} · {x.empresa}</p>
            <p className="text-xs text-zinc-500">{x.periodo}</p>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {x.atividades.map((a, j) => <li key={j}>{a}</li>)}
            </ul>
          </div>
        ))}

        {perfil.formacao.length > 0 && (
          <>
            <h2 className="mt-6 border-b border-zinc-300 pb-1 text-lg font-semibold">Formação</h2>
            <ul className="mt-2 text-sm">
              {perfil.formacao.map((f, i) => (
                <li key={i}>{f.curso} · {f.instituicao}{f.conclusao && ` (${f.conclusao})`}</li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mt-6 border-b border-zinc-300 pb-1 text-lg font-semibold">Habilidades</h2>
        <p className="mt-2 text-sm">{analise.habilidades.join(" · ")}</p>

        {perfil.certificacoes.length > 0 && (
          <>
            <h2 className="mt-6 border-b border-zinc-300 pb-1 text-lg font-semibold">Certificações</h2>
            <p className="mt-2 text-sm">{perfil.certificacoes.join(" · ")}</p>
          </>
        )}
        {perfil.idiomas.length > 0 && (
          <>
            <h2 className="mt-6 border-b border-zinc-300 pb-1 text-lg font-semibold">Idiomas</h2>
            <p className="mt-2 text-sm">{perfil.idiomas.map((i) => `${i.idioma} (${i.nivel})`).join(" · ")}</p>
          </>
        )}
      </div>
    </div>
  );
}
