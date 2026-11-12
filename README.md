# Projetos Allan Santos — Portal de Governança | XP

Portal corporativo exclusivo dos projetos da **XP**, com **Visão Geral**, **Cronograma WBS em 3 Níveis**, **Gantt** interativo e gestão de **Hypercare & Validações Executivas**.

---

## Estrutura de Pastas e Arquivos

```text
/ (raiz)
├── index.html                                         # Estrutura da aplicação (Login, 4 Abas e Modais)
├── css/
│   └── styles.css                                     # Folha de estilo corporativa
├── js/
│   └── app.js                                         # Lógica unificada: Auth SHA-256, RBAC, Store, WBS, Gantt e Hypercare
├── assets/
│   └── images/
│       ├── mslogo.png                                 # Logotipo principal
│       └── logoxp.webp                                # Logotipo XP Inc.
├── explicação/
│   ├── 01-visao-geral-e-funcionalidades.md            # Guia funcional completo (linguagem não-técnica)
│   ├── 02-checklist-perguntas-call-allan.md           # Roteiro e checklist para call de alinhamento com Allan
│   └── 03-arquitetura-e-plano-backend.md              # Arquitetura atual e roteiro de implementação do Backend
├── deploy.bat                                         # Script auxiliar de publicação via Git
├── .gitignore                                         # Regras de exclusão do repositório
└── README.md                                          # Documentação principal
```

---

## Acessos e Regras de Visibilidade

- **Gerente único (`Allan Santos`):** enxerga todos os projetos, atividades, chamados RITM e cobranças executivas de toda a equipe, além de possuir a barra de homologação *"Visualizar como"* e exclusão definitiva.
- **Equipe (`Enzo Pompemayer`, `Carlos Souza` e novos cadastros):** cada integrante visualiza e gerencia apenas os projetos e chamados lançados por ele.
- **Acessos rápidos para teste:** disponíveis na tela de login para alternar rapidamente entre Allan (Gerente), Enzo (Equipe) e Carlos (Equipe) sem expor senhas no código.

---

## Como Executar

1. **Uso local:** abra `index.html` diretamente no navegador ou sirva a pasta raiz via servidor HTTP estático.
2. **Deploy estático (GitHub Pages / Vercel):** publique a pasta raiz preservando `index.html`, `css/`, `js/` e `assets/`.
