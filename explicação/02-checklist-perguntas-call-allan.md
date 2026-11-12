# Checklist e Roteiro de Perguntas — Call de Alinhamento com Allan Santos

Use este roteiro durante a chamada com o Allan para validar o que já funciona hoje, o que ajustar e como estruturar a entrada do Backend para operação real da equipe.

---

## 1. Alinhamento Geral e Estrutura dos Projetos XP

- [ ] **Portfólio inicial:** além de *SAP Recruiting*, *Admissão Digital* e *Onboarding & Acessos*, quais outros projetos da XP já devem entrar na primeira versão real?
- [ ] **Nomenclatura da hierarquia:** o Nível 1 deve continuar se chamando **"Sistema / Módulo"** ou faz mais sentido chamar **"Projeto / Frente"** (ex.: *Projeto XP Investimentos -> Macroatividade -> Entrega*)?
- [ ] **Profundidade da árvore:** 3 níveis (*Projeto/Sistema → Macroatividade → Microatividade*) atendem todos os outros projetos da XP ou algum projeto precisa de 4 níveis (ex.: *Projeto → Sistema → Macro → Micro*)?
- [ ] **Códigos das entregas:** o padrão automático (`XP-001`, `XP-002`...) atende ou cada projeto precisa de prefixo próprio (ex.: `REC-001`, `ADM-001`)?

---

## 2. Usuários, Acessos e Regras de Visibilidade (RBAC)

- [ ] **Lista de usuários iniciais:** além de Allan (Gerente), Enzo Pompemayer e Carlos Souza, quem mais da equipe precisa ter acesso logo na estreia?
- [ ] **Cadastro aberto vs. fechado:** qualquer pessoa deve poder usar o botão *"Cadastre-se"* ou novos acessos devem ser criados/aprovados apenas pelo Allan (ou restritos a um domínio de e-mail corporativo específico)?
- [ ] **Isolamento entre membros da equipe:** confirmando a regra atual — um membro da equipe só deve enxergar **os próprios projetos**? Ou existem projetos compartilhados onde duas pessoas da mesma squad precisam editar a mesma entrega juntas?
- [ ] **Permissão de exclusão:** manter exclusão definitiva de atividades/chamados bloqueada apenas para o Allan (Gerente) ou liberar para quem criou o item?
- [ ] **Acesso do cliente XP:** algum executivo/stakeholder do cliente XP vai acessar o portal com login próprio (modo *somente leitura global*) ou o portal é de uso exclusivo da equipe de consultoria?

---

## 3. O que MANTER, ADICIONAR ou REMOVER por Aba

### Tela de Login
- [ ] **MANTER** o layout com os dois logotipos (Consultoria + XP)?
- [ ] **REMOVER** os 3 botões de *"Acessos rápidos para teste"* assim que o Backend com login real for ativado? *(Recomendado: sim, manter só durante homologação).*

### Aba 1 — Visão Geral
- [ ] Os 6 KPIs atuais (*Progresso Geral, Concluídas, Em Andamento, Não Iniciadas, Em Atenção, Atrasadas/Bloqueadas*) são suficientes?
- [ ] **ADICIONAR:** falta algum indicador executivo, como *"Entregas vencendo nos próximos 7 dias"* ou *"Projetos ativos no momento"*?
- [ ] **MODIFICAR:** no *Resumo por Sistema / Módulo*, alguma informação adicional deveria aparecer no cartão (ex.: nome do líder do projeto)?

### Aba 2 — Cronograma
- [ ] As colunas atuais (*Estrutura, Responsável, Início, Fim Planejado, Nova Data Fim, Duração, Progresso, Status, Ações*) atendem ou falta alguma coluna importante (ex.: **Prioridade**, **Dependência**, **Squad** visível como coluna própria)?
- [ ] A lista de **Status** atual (*Não iniciado, Em andamento, Em atenção, Atrasado, Bloqueado, Concluído*) está fechada ou quer incluir algum outro (ex.: *Cancelado*, *Em homologação*)?
- [ ] A regra de mudança automática de progresso ao marcar *Concluído* (100%) e *Não iniciado* (0%) está boa?

### Aba 3 — Gantt
- [ ] A visualização com fins de semana destacados, 3 níveis de zoom e linha vermelha da *Data de referência* atende à dinâmica da reunião semanal?
- [ ] Precisa de alguma marcação visual extra no Gantt (ex.: barra tracejada comparando **Fim Planejado** vs **Nova Data Fim** quando há replanejamento)?

### Aba 4 — Hypercare & Validações
- [ ] Os campos dos chamados RITM (*Código, Sistema/Módulo, Severidade P2–P5, Descrição, Squad/Resp., E-mail Ponto Focal, Status, Ação Tomada*) batem com o acompanhamento atual da XP?
- [ ] Os status de chamado (*Em análise, Chamado SAP, Pendente, Concluído*) cobrem todo o fluxo ou existe outro (ex.: *Em QAS / Validação*, *Aguardando cliente*)?
- [ ] Nas **Cobranças & Validações Executivas**, o Allan quer poder **direcionar uma cobrança para uma pessoa específica da equipe** (com alerta/notificação) ou manter vinculada ao Projeto/Módulo?

---

## 4. Perguntas sobre o Backend e Infraestrutura

1. **Onde o portal será hospedado em produção?**
   - [ ] Já existe algum servidor ou assinatura em nuvem da consultoria/projeto (Azure, AWS, Vercel, Railway, Render) ou hospedagem estática + serviço gerenciado?
2. **Qual opção de Banco de Dados / Plataforma preferem?**
   - [ ] Banco PostgreSQL gerenciado (ex.: **Supabase**, **Neon** ou **Azure Database for PostgreSQL**)?
   - [ ] Preferem uma API dedicada (Node.js / Python FastAPI) ou integração com ecossistema Microsoft (ex.: Azure + Entra ID)?
3. **Como será a Autenticação oficial?**
   - [ ] Login próprio gerenciado pelo portal (e-mail + senha com troca obrigatória / recuperação por e-mail)?
   - [ ] Ou login corporativo Microsoft (SSO / Entra ID)?
4. **Notificações e E-mails:**
   - [ ] As notificações devem ficar apenas dentro do sino do portal ou também disparar **e-mail / mensagem no Microsoft Teams** quando houver atraso, novo chamado ou cobrança executiva do Allan?
5. **Segurança, LGPD e Dados da XP:**
   - [ ] Há alguma restrição de compliance da XP sobre armazenar nomes, e-mails corporativos e status de projetos em nuvem externa (região Brasil `sa-east-1` / políticas internas)?
   - [ ] Precisaremos de **log de auditoria** (histórico de quem alterou qual data ou status e quando)?
6. **Operação após entrega:**
   - [ ] Quem ficará responsável por backups, monitoramento de custos de nuvem e pequenas manutenções?

---

## 5. Resumo Rápido de Decisões (Preencher ao final da call)

| Decisão | O que vai ficar | O que vai mudar / entrar | Prazo / Prioridade |
|---|---|---|---|
| Projetos & WBS | | | |
| Permissões & Usuários | | | |
| Campos & Status | | | |
| Backend & Banco | | | |
| Autenticação & Alertas | | | |
