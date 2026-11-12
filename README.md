# Projetos Allan Santos — Portal de Governança | XP

Portal corporativo exclusivo dos projetos da **XP**, com **Cronograma WBS em 3 Níveis** (*Sistema/Módulo → Macroatividade → Microatividade*), **Gráfico de Gantt interativo com Linha de Corte** e gestão de **Hypercare & Validações Executivas**, com cadastro e atualização 100% nativos na interface web.

---

## Estrutura de Arquivos (Raiz)

```text
/ (raiz)
├── index.html      # Estrutura da aplicação (Login, 4 Abas, Modais e Tooltips)
├── styles.css      # Identidade visual corporativa densa e regras @media print
├── app.js          # Lógica unificada: Auth SHA-256, RBAC, Store, WBS, Gantt e Hypercare
├── mslogo.png      # Logotipo institucional principal
├── logoxp.webp     # Logotipo XP Inc.
├── deploy.bat      # Script auxiliar de publicação via Git
├── .gitignore      # Regras de exclusão (.vscode/, .env, .DS_Store, temporários)
└── README.md       # Documentação do projeto
```

---

## Principais Recursos

- **Exclusivo Projetos XP:** módulos e projetos da XP (`SAP Recruiting`, `Admissão Digital`, `Onboarding & Acessos` e novos cadastros), chamados Hypercare (`RITM`) e cobranças executivas dedicadas.
- **4 Abas Integradas:**
  1. **Visão Geral:** 6 KPIs executivos e painel *Resumo por Sistema / Módulo* navegável.
  2. **Cronograma (WBS):** árvore em 3 níveis com consolidação bottom-up de datas, duração, progresso e status.
  3. **Gantt (Linha do Tempo):** grade dia a dia com fins de semana, zoom (*Compacto*, *Normal*, *Expandido*), linha vermelha da *Data de referência* e tooltip flutuante.
  4. **Hypercare & Validações:** tabela de chamados/RITMs à esquerda e painel de cobranças executivas à direita.
- **Persistência & Segurança:** armazenamento unificado em `localStorage` sob a chave `xp_gov_portal_v1` (com limpeza automática de chaves legadas), autenticação SHA-256 com salt, gerente único (`AllanSantos`), auto-cadastro restrito a `Colaborador`, sanitização `escapeHtml()` contra XSS e observador de integridade do DOM.

---

## Como Executar

1. **Uso local:** abra `index.html` diretamente no navegador ou sirva a pasta raiz por um servidor HTTP estático.
2. **Deploy estático (GitHub Pages / Vercel):** publique diretamente os arquivos da raiz (`index.html`, `styles.css`, `app.js`, `mslogo.png`, `logoxp.webp`).
