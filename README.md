# Projetos Allan Santos - Portal Corporativo de Governança e Portfólio de Projetos

Sistema corporativo de governança, acompanhamento e monitoramento de iniciativas divididas por clientes (Santander, Vivo, XP, Allan, Outros), auto-alimentado pelos próprios responsáveis, com dashboard executivo circular, central de notificações e principais mudanças, controle de acesso por cargo (RBAC) e gestão de prazos flexíveis/indeterminados.

---

## 📋 Sumário
1. [Visão Geral](#-visão-geral)
2. [Central de Notificações & Principais Mudanças](#-central-de-notificações--principais-mudanças)
3. [Alteração de Prazo & Status com Mensagem Opcional](#-alteração-de-prazo--status-com-mensagem-opcional)
4. [Dashboard Executivo Redondo do Gerente](#-dashboard-executivo-redondo-do-gerente)
5. [Cargos & Estrutura de Abas](#-cargos--estrutura-de-abas)
6. [Cadastro & Seleção Inteligente de Clientes](#-cadastro--seleção-inteligente-de-clientes)
7. [Credenciais Oficiais de Demonstração](#-credenciais-oficiais-de-demonstração)
8. [Como Executar o Projeto](#-como-executar-o-projeto)

---

## 🎯 Visão Geral

O **Projetos Allan Santos** é uma plataforma corporativa limpa, direta e sem poluição visual.

### Ajustes Visuais e Governança:
- **Topo Direto**: Cabeçalho com o logo e estritamente o título **Projetos Allan Santos** (sem breadcrumbs nem referências a diretorias).
- **Terminologia Corporativa**: Termo "Saúde" substituído integralmente por **Status** em todo o sistema.
- **Identificação do Usuário**: Exibe nome, cargo e cliente de atuação na barra superior e nos cartões de projetos.

---

## 🔔 Central de Notificações & Principais Mudanças

Exclusivo no painel do Gerente (**Allan Santos**):
- **Card Executivo de Notificações**: Apresenta em tempo real todas as alterações feitas pelos responsáveis em seus projetos.
- **Informações Detalhadas**: Exibe quem alterou (nome, cargo e cliente), qual projeto, o que mudou (novo percentual, semáforo de status ou novo prazo) e a mensagem/justificativa deixada pelo colaborador.
- **Contador Dinâmico**: Badge indicando quantas atualizações recentes foram registradas.
- **Ação Rápida**: Opção de limpar notificações já revisadas.

---

## ⏱️ Alteração de Prazo & Status com Mensagem Opcional

No modal **"Atualizar Status"**, os responsáveis têm controle completo:
- **Percentual Concluído**: Slider interativo de 0% a 100%.
- **Status do Projeto**: No Prazo (verde), Em Atenção (amarelo) ou Crítico (vermelho).
- **Alteração de Prazo**: Possibilidade de atualizar a data limite ou marcar como **(Indeterminado)**.
- **Mensagem / Justificativa Opcional de Prazo**: Campo para registrar o motivo da mudança (ex: novas demandas de TI alinhadas com o cliente).
- **Histórico Automático**: Toda alteração é registrada com data/hora nos comentários do projeto e enviada diretamente para a Central de Notificações do Allan.

---

## ⭕ Dashboard Executivo Redondo do Gerente

A aba exclusiva do Gerente conta com um **Dashboard Executivo Circular**:
- **Gráfico Donut SVG**: Proporção visual de projetos No Prazo (verde), Em Atenção (amarelo) e Críticos (vermelho) com o total consolidado no centro.
- **Legenda Interativa**: Mostra a contagem e porcentagem de cada fatia, permitindo clicar para filtrar a tabela automaticamente.
- **Gauge Circular de Taxa Média**: Medidor redondo de entrega agregada de todo o portfólio e relação de clientes com iniciativas ativas.

---

## 👥 Cargos & Estrutura de Abas

| Cargo | Tipo de Acesso | O que acessa |
| :--- | :--- | :--- |
| **Trainee** | Colaborador | Aba de projetos atribuídos, criação de projetos, atualização semanal de status/prazo e comentários. |
| **Especialista** | Colaborador | Mesma aba de entregas e acompanhamento de seus projetos. |
| **Senior** | Colaborador | Mesma aba de entregas e acompanhamento de seus projetos. |
| **Gerente** | Especial / Executivo | **Aba Especial do Gerente**: Dashboard redondo executivo, Central de Notificações, tabela consolidada com todos os clientes, filtros avançados e gestão de governança. |

---

## 📍 Cadastro & Seleção Inteligente de Clientes

No cadastro ("Criar Acesso"):
- **Usuário e E-mail**: Permite definir tanto o Nome de Usuário quanto o E-mail Corporativo. No login, aceita qualquer um dos dois.
- **Local de Atuação / Cliente**: Dropdown com opções rápidas (**Santander**, **Vivo**, **XP**, **Allan**, **Outros**).
- **Regra do Campo "Outros"**: A caixa de texto para digitar o nome do cliente **só aparece na tela se o usuário selecionar a opção "Outros"** no menu.

---

## 🔑 Credenciais Oficiais de Demonstração

| Usuário | E-mail | Cargo | Cliente | Senha | Projeto Vinculado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AllanSantos` | `allan.santos@empresa.com` | Gerente | Allan | `12345` | Visão Geral Consolidada & Notificações |
| `UsuarioCarlosSouza` | `carlos.souza@empresa.com` | Trainee | Allan | `54321` | **Dashboard de Projetos** *(Prazo: Indeterminado, 75%)* |
| `BeatrizP` | `beatriz.prugno@santander.com.br` | Senior | Santander | `Bia123` | **PMO riscos TI Santander** *(Prazo: Indeterminado, 85%)*<br>Desc: *Cobranças diarias de demandas, entre ela: Runtime, CNJP, APIGEE* |

* **Chave de Governança para Novos Gerentes**: `GOV2026`

---

## 💻 Como Executar

1. Abra a pasta do projeto:
   ```text
   C:\Users\carlos.cesar.de.oli1\Downloads\Web Projetos Allan Santos\
   ```
2. Dê um duplo clique no arquivo **`index.html`** para abrir no Google Chrome, Microsoft Edge ou Firefox.
3. Não requer Node.js, compilação ou instalação de dependências.
