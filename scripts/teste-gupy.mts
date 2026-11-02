// Gera as vagas reais já filtradas na região (formato Vaga).
import { gzipSync } from "node:zlib";
import { buscarGupy } from "../src/lib/fontes/gupy";
import { filtrar } from "../src/lib/radar";
import { mesclar } from "../src/lib/vagas";
import { CONFIG_PADRAO } from "../src/lib/schemas";

const agora = new Date().toISOString();
let todas: any[] = [];
for (const palavra of CONFIG_PADRAO.palavrasChave) {
  const ok = filtrar(await buscarGupy(palavra, agora), CONFIG_PADRAO);
  console.log(`"${palavra}": ${ok.length} na região`);
  todas = mesclar(todas, ok).todas;
}
console.log(`TOTAL ${todas.length}`);
console.log("VAGAS_JSON_GZ_B64:" + gzipSync(JSON.stringify(todas, null, 2)).toString("base64"));
