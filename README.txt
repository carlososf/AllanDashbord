================================================================================
PROJETOS ALLAN SANTOS - PORTAL CORPORATIVO DE GOVERNANÇA E PROJETOS
================================================================================

Resumo das Funcionalidades e Regras Implementadas:

1. CENTRAL DE NOTIFICAÇÕES (PAINEL DO ALLAN / GERENTE)
   - Card dedicado no painel executivo com todas as novidades reportadas pela equipe.
   - Exibe autor, cargo, cliente, projeto, alteração de status/prazo e mensagens justificativas.
   - Contador de novidades e botão para limpar notificações.

2. MUDANÇA DE PRAZO E STATUS COM MENSAGEM OPCIONAL
   - No modal "Atualizar Status", o colaborador pode:
     * Atualizar a porcentagem de progresso (0% a 100%).
     * Alterar o status (No Prazo, Em Atenção, Crítico).
     * Alterar a data de prazo ou marcar (Indeterminado).
     * Deixar uma mensagem opcional justificando a alteração de prazo.
   - Toda alteração alimenta o histórico de comentários do projeto e gera notificação automática para o Allan.

3. ACESSO E AUTENTICAÇÃO (LOGIN & CADASTRO)
   - O login e o cadastro aceitam tanto o Nome de Usuário (Ex: AllanSantos) quanto o E-mail corporativo.
   - O cadastro possui os campos:
     * Nome Completo
     * Nome de Usuário
     * E-mail Corporativo
     * Cargo: Trainee, Especialista, Senior e Gerente
     * Local de Atuação / Cliente: Santander, Vivo, XP, Allan, Outros
       REGRA: O campo de texto para digitar o nome do cliente SÓ APARECE se a opção selecionada for "Outros".
     * Chave de Governança corporativa (obrigatória apenas se Gerente): GOV2026
     * Senha e Confirmação de Senha

4. PROJETO DE BEATRIZ PRUGNO (ATUALIZADO)
   - Título: PMO riscos TI Santander
   - Descrição: Cobranças diarias de demandas, entre ela: Runtime, CNJP, APIGEE
   - Prazo: Indeterminado
   - Status: Em Atenção (85%)

================================================================================
USUÁRIOS DE TESTE OFICIAIS (CREDENCIAIS PRONTAS):
================================================================================

1) GERENTE
   Usuário: AllanSantos
   E-mail: allan.santos@empresa.com
   Cargo: Gerente (Cliente: Allan)
   Senha: 12345
   Acesso: Visão Especial com Dashboard Circular, Tabela Geral e Central de Notificações

2) TRAINEE
   Usuário: UsuarioCarlosSouza
   E-mail: carlos.souza@empresa.com
   Cargo: Trainee (Cliente: Allan)
   Senha: 54321
   Projeto Vinculado: "Dashboard de Projetos" (Prazo: Indeterminado, Progresso: 75%)

3) SENIOR
   Usuário: BeatrizP
   E-mail: beatriz.prugno@santander.com.br
   Cargo: Senior (Cliente: Santander)
   Senha: Bia123
   Projeto Vinculado: "PMO riscos TI Santander" (Prazo: Indeterminado, Progresso: 85%)
   Descrição: Cobranças diarias de demandas, entre ela: Runtime, CNJP, APIGEE

================================================================================
COMO EXECUTAR:
================================================================================
Basta dar um duplo clique no arquivo "index.html" na pasta:
C:\Users\carlos.cesar.de.oli1\Downloads\Web Projetos Allan Santos\
Abre diretamente em qualquer navegador moderno.
================================================================================
