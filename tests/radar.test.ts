import { describe, expect, it } from "vitest";
import { converterGupy, type GupyJob } from "../src/lib/fontes/gupy";
import { converterAdzuna } from "../src/lib/fontes/adzuna";
import { filtrar } from "../src/lib/radar";
import { abaixoDaPretensao, casaPalavraChave, mesclar, naRegiao, temExcluida } from "../src/lib/vagas";
import { CONFIG_PADRAO } from "../src/lib/schemas";

const T = "2026-11-02T00:00:00.000Z";
const job = (over: Partial<GupyJob>): GupyJob => ({
  id: 1, name: "Assistente de Logística", jobUrl: "https://x.gupy.io/jobs/1",
  city: "Cajamar", state: "São Paulo", workplaceType: "on-site", ...over,
});

describe("palavra-chave", () => {
  it("ignora acento e caixa", () => {
    expect(casaPalavraChave("ASSISTENTE DE LOGISTICA JR", "assistente de logística")).toBe(true);
  });
  it("exige todas as palavras", () => {
    expect(casaPalavraChave("Assistente Administrativo", "assistente de logística")).toBe(false);
  });
});

describe("região", () => {
  it("aceita cidade alvo e recusa cidade fora", () => {
    expect(naRegiao(converterGupy(job({}), "x", T), CONFIG_PADRAO)).toBe(true);
    expect(naRegiao(converterGupy(job({ city: "Campinas" }), "x", T), CONFIG_PADRAO)).toBe(false);
  });
  it("remoto depende da preferência", () => {
    const v = converterGupy(job({ city: null, workplaceType: "remote" }), "x", T);
    expect(naRegiao(v, CONFIG_PADRAO)).toBe(true);
    expect(naRegiao(v, { ...CONFIG_PADRAO, aceitaRemoto: false })).toBe(false);
  });
});

describe("filtro e mescla", () => {
  it("filtra por título e região", () => {
    const vagas = [
      converterGupy(job({ id: 1 }), "assistente de logística", T),
      converterGupy(job({ id: 2, name: "Assistente de RH" }), "assistente de logística", T),
      converterGupy(job({ id: 3, city: "Recife" }), "assistente de logística", T),
    ];
    expect(filtrar(vagas, CONFIG_PADRAO).map((v) => v.id)).toEqual(["gupy:1"]);
  });
  it("Adzuna confia no raio e lê a cidade do último nível", () => {
    const v = converterAdzuna(
      { id: "9", title: "Líder de <strong>Logística</strong>", redirect_url: "u",
        location: { area: ["Brasil", "São Paulo", "Caieiras"] } },
      "líder de logística", T);
    expect(v.titulo).toBe("Líder de Logística");
    expect(v.cidade).toBe("Caieiras");
    expect(filtrar([v], { ...CONFIG_PADRAO, cidadesAlvo: [] })).toHaveLength(1);
  });
  it("não duplica e preserva a data da primeira descoberta", () => {
    const a = converterGupy(job({}), "x", "2026-11-01T00:00:00.000Z");
    const b = converterGupy(job({ name: "Assistente de Logística I" }), "x", T);
    const { todas, inéditas } = mesclar([a], [b]);
    expect(todas).toHaveLength(1);
    expect(inéditas).toHaveLength(0);
    expect(todas[0].titulo).toBe("Assistente de Logística I");
    expect(todas[0].encontradaEm).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("exclusões e salário", () => {
  it("ignora estágio e jovem aprendiz", () => {
    expect(temExcluida("Estagiário de Logística", CONFIG_PADRAO.palavrasExcluidas)).toBe(true);
    expect(temExcluida("Assistente de Logística", CONFIG_PADRAO.palavrasExcluidas)).toBe(false);
    const v = converterGupy(job({ name: "Jovem Aprendiz Assistente de Logística" }), "assistente de logística", T);
    expect(filtrar([v], CONFIG_PADRAO)).toHaveLength(0);
  });
  it("só corta salário anunciado abaixo da pretensão", () => {
    const v = converterGupy(job({}), "x", T);
    expect(abaixoDaPretensao(v, 3000)).toBe(false); // sem salário passa
    expect(abaixoDaPretensao({ ...v, salarioMax: 2500 }, 3000)).toBe(true);
    expect(abaixoDaPretensao({ ...v, salarioMax: 3500 }, 3000)).toBe(false);
    expect(abaixoDaPretensao({ ...v, salarioMax: 2500 }, null)).toBe(false);
  });
});
