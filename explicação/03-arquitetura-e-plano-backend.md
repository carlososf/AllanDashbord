# Arquitetura Atual e Plano de Implementação do Backend

Este documento detalha como o portal está estruturado hoje (100% no navegador) e o caminho técnico para conectá-lo a um **Backend real com banco de dados**, tornando os dados compartilhados em tempo real entre o Allan (Gerente) e toda a equipe.

---

## 1. Estrutura Atual do Projeto

```text
/ (raiz do projeto)
├── index.html                  # Estrutura HTML das telas (Login, 4 Abas e Modais)
├── css/
│   └── styles.css              # Design System corporativo, tabelas, árvore e Gantt
├── js/
│   └── app.js                  # Estado, Auth/RBAC, WBS, Gantt, Hypercare e Store
├── assets/
│   └── images/
│       ├── mslogo.png          # Logotipo da consultoria
│       └── logoxp.webp         # Logotipo XP
├── explicação/                 # Documentação funcional, checklist de call e arquitetura
├── deploy.bat                  # Auxiliar de push para GitHub
└── README.md                   # Visão geral do repositório
```

### Como o Frontend funciona hoje

- **Zero dependências externas / sem bundler:** roda diretamente abrindo `index.html` ou em qualquer servidor estático (GitHub Pages, Vercel, Netlify, Azure Static Web Apps).
- **Motor reativo simples:** todas as ações alteram o estado em memória (`portalData`), salvam no navegador e executam `renderAll()`, que recalcula KPIs, árvore WBS em 3 níveis (com consolidação bottom-up de datas, duração, progresso e status), grade do Gantt e tabela de Hypercare.
- **Segurança no cliente:**
  - Senhas são convertidas em digest **SHA-256 com salt** antes da verificação (sem senhas em texto claro nos arquivos).
  - Gerente único (`usr-001` — `AllanSantos`), com normalização impedindo promoção indevida para `Gerente`.
  - Sanitização `escapeHtml()` em todas as renderizações dinâmicas para prevenir XSS.
  - `MutationObserver` (`initDomGuard`) removendo formulários/barras administrativas caso injetados via DevTools por usuários não autorizados.
  - Isolamento por criador/responsável (`canViewActivity` / `canViewRitm` / `getScopedExecNotes`).

---

## 2. Por que precisamos de um Backend?

Atualmente, os dados ficam gravados apenas no `localStorage` do navegador (`xp_gov_portal_v2`). Isso significa que:
1. O que o **Enzo** cadastrar no computador dele **não aparece** automaticamente no computador do **Allan**.
2. Se o usuário limpar o histórico/cache do navegador, os dados locais são perdidos.
3. Regras de segurança e autorização reais devem ser garantidas no servidor (porque qualquer lógica somente no frontend pode ser contornada por alguém técnico no próprio navegador).

---

## 3. Arquitetura Alvo com Backend Real

```text
[ Navegador (HTML + CSS + JS) ]
        │
        │  HTTPS + Token JWT (Authorization: Bearer ...)
        ▼
[ API REST (Backend) ]
   ├── Validação de Token e Perfil (Gerente vs Equipe)
   ├── Filtro automático no banco: Equipe só lê/edita WHERE created_by = user.id
   └── Regras de Negócio, Auditoria e Envio de E-mail/Teams
        │
        ▼
[ Banco de Dados Relacional (PostgreSQL) ]
```

### Opções recomendadas de Stack Backend

1. **Opção A — Mais rápida para ir ao ar (Backend as a Service):**
   - **Frontend:** Vercel ou GitHub Pages (arquivos atuais sem custo).
   - **Backend + Banco + Auth:** **Supabase** (PostgreSQL + Autenticação pronta + Row Level Security nativa no banco).
   - *Vantagem:* em poucos dias já permite login real, isolamento no banco por usuário (`RLS`) e compartilhamento em tempo real sem precisar gerenciar servidor Linux.

2. **Opção B — API Própria (Mais controle e customização corporativa):**
   - **API:** **Node.js (Fastify/NestJS)** ou **Python (FastAPI)**.
   - **Banco:** **PostgreSQL** (Azure Database, Neon ou Railway) com Prisma/SQLAlchemy.
   - **Auth:** JWT (`Access Token` + `Refresh Token` em cookie `HttpOnly`) + hash de senha **Argon2id** ou **bcrypt** no servidor.
   - *Vantagem:* flexibilidade total para webhooks do Microsoft Teams, jobs agendados (alerta de tarefas atrasadas), exportação executiva e auditoria detalhada.

---

## 4. Modelagem de Banco de Dados Sugerida (PostgreSQL)

- **`users`**: `id (uuid)`, `name`, `email (unique)`, `username (unique)`, `password_hash`, `role ('Gerente' | 'Equipe')`, `active`, `created_at`
- **`activities`**: `id (varchar, ex: XP-001)`, `created_by (fk -> users.id)`, `responsible_id (fk -> users.id)`, `system_name`, `macro`, `title`, `squad`, `start_date`, `end_date`, `new_end_date`, `status`, `progress (0..100)`, `notes`, `updated_at`
- **`hypercare_ritms`**: `uid (uuid)`, `created_by (fk -> users.id)`, `code (unique)`, `system_name`, `description`, `action_taken`, `severity`, `squad`, `status`, `owner_email`, `updated_at`
- **`executive_notes`**: `id (uuid)`, `author_id (fk -> users.id)`, `system_name`, `text`, `created_at`
- **`notifications`**: `id (uuid)`, `user_id (fk -> users.id)`, `title`, `body`, `target_tab`, `read`, `created_at`
- **`audit_logs`** *(opcional recomendado)*: `id`, `actor_id`, `entity`, `entity_id`, `action`, `payload_diff (jsonb)`, `created_at`

---

## 5. Contratos de API REST (Substituição do `localStorage`)

No arquivo [js/app.js](../js/app.js), toda persistência já está isolada em `loadStore()`, `saveStore()` e nos handlers de salvamento/exclusão. Ao plugar o Backend, trocaremos apenas essas chamadas locais por requisições `fetch()` para os seguintes endpoints:

- **Autenticação**
  - `POST /api/auth/login` → valida senha no servidor e devolve sessão/JWT.
  - `POST /api/auth/register` → cria conta **sempre** com `role = 'Equipe'` (ignora qualquer `role` enviada no payload).
  - `GET /api/auth/me` → retorna dados do usuário autenticado.
- **Cronograma / Entregas WBS**
  - `GET /api/activities` → se `Gerente`, retorna tudo; se `Equipe`, o servidor filtra `WHERE created_by = req.user.id OR responsible_id = req.user.id`.
  - `POST /api/activities` → cria entrega vinculada automaticamente ao `req.user.id` (se `Equipe`).
  - `PATCH /api/activities/:id` → valida posse (`created_by` ou `Gerente`) antes de atualizar.
  - `DELETE /api/activities/:id` → exige `role === 'Gerente'`.
- **Hypercare (RITMs) & Cobranças**
  - `GET / POST / PATCH /api/ritms` (mesma regra de escopo por posse + visão total do Gerente).
  - `DELETE /api/ritms/:uid` → exige `role === 'Gerente'`.
  - `GET /api/exec-notes` e `POST / DELETE /api/exec-notes` → criação/remoção estrita para `role === 'Gerente'`.
- **Notificações**
  - `GET /api/notifications` e `PATCH /api/notifications/:id/read`.

---

## 6. Passo a Passo para Colocar o Backend no Ar

1. **Alinhamento na Call (Fase 1):** fechar com o Allan as respostas do checklist (banco escolhido, onde hospedar e se o cadastro continuará aberto ou por convite).
2. **Subir Banco e API (Fase 2):** criar as 5 tabelas principais, configurar hash seguro (`bcrypt`/`Argon2id`) e aplicar a regra de isolamento nas queries do backend.
3. **Camada `apiClient` no Frontend (Fase 3):** criar um pequeno módulo `js/api.js` (ou função `apiFetch` dentro de `js/app.js`) com envio automático do token e tratamento de erro HTTP (`401`/`403`).
4. **Endurecimento Pré-Produção (Fase 4):**
   - **Remover os 3 botões de "Acessos rápidos para teste"** de `index.html` e a função `quickLoginTest` de `js/app.js`.
   - Ativar CORS restrito ao domínio oficial do portal e exigir HTTPS.
5. **Homologação e Go-Live (Fase 5):** testar com contas reais do Allan, Enzo e Carlos em computadores diferentes validando isolamento, edição simultânea e notificações.
