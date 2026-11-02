// Armazenamento simples em arquivos JSON (Etapa 1).
// Na Etapa 2 isso migra para o Supabase.
import { promises as fs } from "fs";
import path from "path";

const DIR = path.join(process.cwd(), "data");

export async function ler<T>(nome: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(DIR, `${nome}.json`), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function salvar(nome: string, dados: unknown): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${nome}.json`), JSON.stringify(dados, null, 2));
}
