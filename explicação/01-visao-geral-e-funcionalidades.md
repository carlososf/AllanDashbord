# Visão Geral e Funcionalidades do Portal — Projetos Allan Santos (XP)

Este guia explica, em linguagem simples e direta ao ponto, como o portal funciona de ponta a ponta — desde a entrada na tela de login até o acompanhamento diário em cada aba.

---

## 1. Qual é o objetivo do Portal?

O **Portal de Governança — XP** foi criado para centralizar o acompanhamento de múltiplos projetos da XP liderados pelo **Allan Santos** (Gerente), permitindo que cada integrante da equipe registre e atualize suas entregas em um só lugar, enquanto a gerência acompanha tudo de forma consolidada.

---

## 2. Tela de Login, Acesso Rápido, Cadastro e Privacidade

Ao abrir o sistema, o usuário encontra três caminhos:

1. **Login tradicional (Usuário ou E-mail + Senha):** para acesso diário com conta já cadastrada.
2. **Cadastre-se (Criar nova conta):** qualquer pessoa da equipe pode criar seu acesso informando nome, e-mail, usuário e senha.
   - **Regra de segurança:** todo novo cadastro entra automaticamente com o perfil **Equipe**. Existe apenas **um perfil de Gerente** no sistema (Allan Santos).
3. **Acessos rápidos para teste (ambiente atual de demonstração):** na parte inferior do cartão de login existem 3 botões de clique único para facilitar testes e validações:
   - **Allan Santos (`Gerente`)**
   - **Enzo Pompemayer (`Equipe`)**
   - **Carlos Souza (`Equipe`)**

### Como funciona a visibilidade de dados (Privacidade por usuário)

- **Visão da Equipe (Enzo, Carlos e novos cadastros):** cada pessoa da equipe **enxerga e edita somente os projetos, atividades e chamados colocados por ela mesma** (ou atribuídos diretamente a ela). O Enzo não vê o que o Carlos lançou, e o Carlos não vê o que o Enzo lançou.
- **Visão de Gerente (Allan Santos):** o Allan enxerga o portfólio completo — todos os projetos e chamados lançados por todos os membros da equipe ficam consolidados para ele automaticamente.

---

## 3. Barra Superior e Ferramentas Globais (Presentes no Painel)

Assim que entra no portal, o usuário vê:

- **Identificação no Cabeçalho:** logotipos da consultoria e da XP, título do portal, nome do usuário logado, perfil (`Gerente` ou `Equipe`), botão de **Notificações** (sino com contador de alertas não lidos) e botão **Sair**.
- **Barra de Ações no Topo:**
  - **Data de referência:** seletor de data que posiciona a linha vermelha de acompanhamento na aba *Gantt*.
  - **+ Novo Cadastro:** botão para incluir uma nova entrega no cronograma.
- **Barra de Filtros:** permite filtrar em tempo real por **Sistema / Módulo**, **Status**, **Responsável** e **Busca instantânea** (por código, título, observação ou responsável).
- **Barra de Homologação (exclusiva do Gerente):** quando o Allan está logado, aparece uma barra discreta no rodapé com o seletor *"Visualizar como"*. Ela permite que o Allan simule a tela exatamente como o Enzo ou o Carlos enxergam, facilitando conferir permissões e organização.

---

## 4. As 4 Abas do Portal

### Aba 1 — Visão Geral
É o resumo executivo para leitura rápida da saúde dos projetos visíveis ao usuário:
- **6 Cartões de Indicadores (KPIs):**
  1. **Progresso Geral (%):** média de avanço das entregas exibidas.
  2. **Concluídas:** quantidade e percentual do plano finalizado.
  3. **Em Andamento:** atividades em execução normal.
  4. **Não Iniciadas:** entregas ainda no planejamento futuro.
  5. **Em Atenção:** atividades que pedem cuidado ou tiveram data reprogramada.
  6. **Atrasadas / Bloqueadas:** pontos críticos que exigem ação imediata.
- **Resumo por Sistema / Módulo:** cartões agrupados por frente/projeto da XP (ex.: *SAP Recruiting*, *Admissão Digital*, *Onboarding & Acessos*). Ao clicar em qualquer cartão, o portal leva direto para o *Cronograma* já filtrado naquela frente.

### Aba 2 — Cronograma
Tabela estruturada em **3 níveis hierárquicos** para organizar do macro ao detalhe:
- **Nível 1 — Sistema / Módulo (ou Projeto XP):** agrupa todas as entregas daquela frente.
- **Nível 2 — Macroatividade:** grandes blocos/fases dentro do módulo.
- **Nível 3 — Microatividade:** cada entrega específica com código (ex.: `XP-001`), responsável, data de início, fim planejado, nova data fim (caso haja replanejamento com cálculo automático de atraso/ganho em dias), duração, barra de progresso (%), status e botão **Editar**.

**Consolidação automática:** os níveis superiores (Macroatividade e Sistema/Módulo) calculam sozinhos a data de início mais cedo, a data final mais distante, o percentual médio e o status predominante com base nas microatividades filhas.

**Controles da árvore:** botões para *Expandir tudo*, *Recolher microatividades*, *Recolher sistemas*, *Limpar filtros* e caixa *Ocultar concluídas*.

**Cadastro e Edição:** clicando em **+ Novo Cadastro** ou **Editar**, abre uma janela para preencher projeto/módulo, macroatividade, título, datas, status, progresso e observações. Quando um membro da **Equipe** cadastra algo, a entrega já fica vinculada automaticamente ao nome e e-mail dele. A exclusão definitiva fica restrita ao **Gerente**.

### Aba 3 — Gantt
Mostra o cronograma em forma de **linha do tempo visual** dia a dia:
- Coluna esquerda fixa com a mesma árvore expandida/recolhida do *Cronograma*.
- Destaque visual automático para **fins de semana** e **linha vertical vermelha** marcando a **Data de referência** escolhida no topo.
- **Controle de Zoom:** *Compacto*, *Normal* e *Expandido*.
- **Interatividade:** ao passar o mouse sobre qualquer barra aparece um cartão flutuante com datas, responsável, progresso e observações; ao clicar em uma barra de entrega (Nível 3), abre diretamente a tela de edição.

### Aba 4 — Hypercare & Validações
Dividida em dois painéis lado a lado:
- **Esquerda — Defeitos & Chamados (RITMs):** controle de incidentes e ajustes pós-implantação com Código do chamado (ex.: `RITM18437224`), Sistema/Módulo, Descrição e Ação Tomada, Severidade (`Alta P2`, `Média P3`, `Baixa P4`, `Melhoria P5`), Squad/Responsável, troca rápida de **Status** diretamente na tabela e edição pelo botão **Editar** (ou criação via **+ Novo Chamado**).
- **Direita — Cobranças & Validações Executivas:** mural de direcionamentos e pontos de cobrança. Apenas o **Gerente (Allan Santos)** possui o formulário para registrar ou remover cobranças; os integrantes da **Equipe** visualizam apenas as cobranças ligadas aos módulos em que possuem entregas.
