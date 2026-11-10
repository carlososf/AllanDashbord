# Projetos Allan Santos - Portal Corporativo de Governança e Portfólio de Projetos

Sistema corporativo de governança, acompanhamento e monitoramento de iniciativas divididas por clientes (Santander, Vivo, XP, Allan, Outros), auto-alimentado pelos próprios responsáveis, com dashboard executivo circular, central de notificações posicionada no cantinho, controle de acesso por cargo (RBAC) e gestão de prazos flexíveis/indeterminados.

---

## 📋 Sumário
1. [Visão Geral](#-visão-geral)
2. [Central de Notificações no Cantinho](#-central-de-notificações-no-cantinho)
3. [Cadastro Auto-alimentável (Sem necessidade de escolher responsável)](#-cadastro-auto-alimentável)
4. [Alteração de Prazo & Status com Mensagem Opcional](#-alteração-de-prazo--status-com-mensagem-opcional)
5. [Dashboard Executivo Redondo do Gerente](#-dashboard-executivo-redondo-do-gerente)
6. [Credenciais Oficiais de Demonstração](#-credenciais-oficiais-de-demonstração)
7. [Como Executar o Projeto](#-como-executar-o-projeto)

---

## 🎯 Visão Geral

O **Projetos Allan Santos** é uma plataforma corporativa limpa, direta e sem poluição visual.

### Ajustes Visuais e Governança:
- **Topo Direto**: Cabeçalho com o logo e estritamente o título **Projetos Allan Santos** (sem breadcrumbs nem referências a diretorias).
- **Terminologia Corporativa**: Termo "Saúde" substituído integralmente por **Status** em todo o sistema.
- **Identificação do Usuário**: Exibe nome, cargo e cliente de atuação na barra superior e nos cartões de projetos.

---

## 🔔 Central de Notificações no Cantinho

Exclusivo no painel do Gerente (**Allan Santos**):
- **Localização Discreta**: Posicionado no canto superior direito do painel (ao lado do botão `+ Novo Projeto`), evitando cobrir a tela ou empurrar a tabela de projetos para baixo.
- **Badge Dinâmico**: O botão exibe a contagem de novidades (ex: `2 novas`).
- **Popover Executivo**: Ao clicar em **Notificações**, abre-se uma janela suspensa compacta no cantinho com:
  - Quem alterou (nome, cargo e cliente).
  - Qual iniciativa foi atualizada (com link para detalhes).
  - O que mudou (novo prazo, novo percentual ou novo status).
  - Mensagem opcional deixada pelo colaborador.
  - Opção de limpar notificações já revisadas.

---

## 🚀 Cadastro Auto-alimentável (Sem Responsável Manual)

- O sistema foi projetado para ser **auto-alimentável**:
  - Ao clicar em **"+ Novo Projeto"**, o formulário solicita apenas **Cliente**, **Área / Categoria**, **Prazo Estimado (com opção de Indeterminado)**, **Status Inicial** e **Escopo**.
  - O responsável é **atribuído automaticamente** ao usuário autenticado que está cadastrando o projeto (seja Carlos Souza, Beatriz Prugno ou Allan Santos).

---

## ⏱️ Alteração de Prazo & Status com Mensagem Opcional

No modal **"Atualizar Status"**, os responsáveis têm controle completo:
- **Percentual Concluído**: Slider interativo de 0% a 100%.
- **Status do Projeto**: No Prazo (verde), Em Atenção (amarelo) ou Crítico (vermelho).
- **Alteração de Prazo**: Possibilidade de atualizar a data limite ou marcar como **(Indeterminado)**.
- **Mensagem / Justificativa Opcional de Prazo**: Campo para registrar o motivo da mudança (ex: novas demandas alinhadas com o cliente).
- **Histórico Automático**: Toda alteração é registrada com data/hora nos comentários do projeto e enviada diretamente para a Central de Notificações no cantinho do Allan.

---

## ⭕ Dashboard Executivo Redondo do Gerente

A aba exclusiva do Gerente conta com um **Dashboard Executivo Circular**:
- **Gráfico Donut SVG**: Proporção visual de projetos No Prazo (verde), Em Atenção (amarelo) e Críticos (vermelho) com o total consolidado no centro.
- **Legenda Interativa**: Mostra a contagem e porcentagem de cada fatia, permitindo clicar para filtrar a tabela automaticamente.
- **Gauge Circular de Taxa Média**: Medidor redondo de entrega agregada de todo o portfólio e relação de clientes com iniciativas ativas.

---

## 🔑 Credenciais Oficiais de Demonstração

| Usuário | E-mail | Cargo | Cliente | Senha | Projeto Vinculado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AllanSantos` | `allan.santos@empresa.com` | Gerente | Allan | `12345` | Visão Consolidada & Notificações no Cantinho |
| `CarlosSouza` | `carlos.souza@empresa.com` | Trainee | Allan | `54321` | **Dashboard de Projetos** *(Prazo: Indeterminado, 75%)* |
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
