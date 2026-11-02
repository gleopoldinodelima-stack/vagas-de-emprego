# 🦇 Radar de Vagas

App + dashboard que lê seu currículo, busca vagas por palavra-chave e região, adapta o currículo para cada vaga com o Claude e acompanha suas candidaturas 24h.

> **Sem robô no LinkedIn.** Automatizar login e candidatura no LinkedIn viola os Termos de Uso e pode banir a conta. O app prepara tudo e a candidatura final é aprovada por você; envio automático só em plataformas que permitem.

## Etapas

- [x] **1. Currículo e alvo** – upload do PDF, extração do perfil com Claude, configuração de palavras-chave e região
- [ ] **2. Radar de vagas** – coleta em fontes permitidas (Gupy, Indeed, Adzuna, sites de empresas)
- [ ] **3. Currículo sob medida** – versão adaptada por vaga + nota de compatibilidade
- [ ] **4. Dashboard** – vagas, currículos gerados e status das candidaturas
- [ ] **5. 24 horas** – agendador rodando as buscas sozinho

## Rodando

```bash
npm install
cp .env.example .env.local   # coloque sua ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Os dados ficam em `data/` (fora do git). Na Etapa 2 migram para o Supabase.
