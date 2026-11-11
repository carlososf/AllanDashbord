# Projetos Allan Santos — Portal de Governança & PMO

Portal corporativo multi-cliente (**XP**, **Santander**, **Vivo** e **Outros**) com **Cronograma WBS em 3 Níveis** (*Sistema/Módulo → Macroatividade → Microatividade*), **Gráfico de Gantt interativo com Linha de Corte** e gestão de **Hypercare & Validações**, com cadastro e atualização 100% nativos na interface web.

---

## 📁 Estrutura de Diretórios

```text
/ (raiz)
├── index.html                  # Ponto de entrada principal (compatível com GitHub Pages, Vercel e uso local)
├── deploy.bat                  # Script auxiliar de publicação via Git
├── .gitignore                  # Regras de exclusão (.vscode/, .env, .DS_Store, temporários)
├── README.md                   # Documentação técnica consolidada
└── src/
    ├── assets/
    │   └── images/
    │       ├── mslogo.png
    │       ├── logoxp.webp
    │       ├── logosantander.webp
    │       └── logovivo.webp
    ├── css/
    │   └── styles.css          # Folha de estilo enterprise + regras @media print
    └── js/
        ├── config.js           # Constantes, chaves, mapeamento de logos, status, AppState e utilitários
        ├── store.js            # Camada DataStore (abstrai localStorage hoje para futura API/Banco)
        ├── auth.js             # Autenticação SHA-256, gerente único, RBAC e proteção do DOM
        ├── gantt.js            # Renderização do Gantt, linha vermelha de referência, zoom e tooltip
        └── app.js              # Controlador principal: filtros, árvore WBS, abas, modais e notificações
```

---

## ⚙️ Arquitetura Modular & Evolução para API

- **`src/js/config.js`**: centraliza chaves de armazenamento, `API_CONFIG`, tabela `STATUS_UI_MAP`, mapeamento `CLIENT_LOGOS`, estado global `AppState` e utilitários de data/sanitização XSS (`escapeHtml`).
- **`src/js/store.js`**: expõe o adaptador `DataStore` (`readJson`, `writeJson`, `saveAll`, `loadAll`, `clearSession`, `normalizeUsersList` e `createSeedData`). Toda leitura e escrita em `localStorage` fica isolada neste arquivo para facilitar a troca futura por chamadas HTTP (`fetch`) para uma API REST ou banco de dados.
- **`src/js/auth.js`**: implementa validação de senha com SHA-256 com salt (`sha256Hex`), regra de **gerente único** (`usr-001`, bloqueando criação de novos gerentes no cadastro), isolamento de dados por colaborador (`getAccessibleActivities`, `getAccessibleRitms`, `getAccessibleExecNotes`) e montagem dinâmica de UI administrativa apenas quando o gerente está autenticado.
- **`src/js/gantt.js`**: desenha a timeline dia a dia com coluna WBS fixa, sombreamento de fins de semana, zoom (`Compacto`, `Normal`, `Expandido`), linha vermelha vertical da data de referência e tooltip flutuante.
- **`src/js/app.js`**: coordena inicialização (`initApp`), navegação em 4 abas (**Visão Geral**, **Cronograma WBS**, **Gantt** e **Hypercare & Validações**), árvore em 3 níveis, modais nativos e notificações.

---

## 💻 Como Executar

1. **Uso local:** abra `index.html` diretamente no navegador moderno ou sirva a pasta raiz via servidor HTTP estático.
2. **Deploy estático (Vercel / GitHub Pages):** mantenha `index.html` na raiz do repositório e publique os arquivos de `src/` junto ao projeto.
