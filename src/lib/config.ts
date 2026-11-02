import { ler } from "./storage";
import { CONFIG_PADRAO, type Config } from "./schemas";

/** Lê a configuração salva, completando campos novos com o padrão. */
export async function lerConfig(): Promise<Config> {
  return { ...CONFIG_PADRAO, ...((await ler<Partial<Config>>("config")) ?? {}) };
}
