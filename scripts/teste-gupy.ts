// Diagnóstico: roda a busca da Gupy e o filtro de região de verdade.
import { buscarGupy } from "../src/lib/fontes/gupy";
import { filtrar } from "../src/lib/radar";
import { CONFIG_PADRAO } from "../src/lib/schemas";

for (const palavra of CONFIG_PADRAO.palavrasChave) {
  try {
    const brutas = await buscarGupy(palavra);
    const ok = filtrar(brutas, CONFIG_PADRAO);
    console.log(`\n### "${palavra}": ${brutas.length} brutas, ${ok.length} na região`);
    for (const v of ok.slice(0, 8))
      console.log(`- ${v.titulo} | ${v.empresa} | ${v.cidade ?? "-"} | ${v.modelo ?? "-"} | ${v.url}`);
  } catch (e) {
    console.log(`\n### "${palavra}": ERRO ${e instanceof Error ? e.message : e}`);
  }
}
