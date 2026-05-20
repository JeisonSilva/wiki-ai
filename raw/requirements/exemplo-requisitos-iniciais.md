# Requisitos Iniciais — Exemplo

> Este é um arquivo de EXEMPLO. Substitua por seus requisitos reais.
> Coloque em raw/requirements/ e peça: "ingira este arquivo na wiki".

## Contexto do Projeto

Sistema de gestão de projetos para times de desenvolvimento. Permite criar projetos, definir tarefas, acompanhar progresso e gerar relatórios.

## Requisitos Funcionais

### RF-01: Autenticação de Usuários
O sistema deve permitir que usuários se cadastrem e façam login com e-mail e senha. Deve suportar login social (Google).

### RF-02: Gestão de Projetos
Usuários autenticados podem criar, editar e arquivar projetos. Cada projeto tem nome, descrição, data de início e data prevista de entrega.

### RF-03: Gestão de Tarefas
Dentro de cada projeto, é possível criar tarefas com título, descrição, responsável, prazo e status (backlog, em andamento, concluído, cancelado).

### RF-04: Controle de Acesso por Papel
Projetos têm dois papéis: admin e membro. Apenas admins podem excluir projetos ou remover membros.

### RF-05: Notificações
Usuários recebem notificações in-app quando são atribuídos a uma tarefa ou quando uma tarefa que acompanham muda de status.

### RF-06: Relatórios de Progresso
Deve ser possível exportar um relatório PDF com o progresso do projeto: tarefas por status, membros e suas tarefas, percentual de conclusão.

## Requisitos Não-Funcionais

### RNF-01: Performance
A listagem de tarefas de um projeto deve responder em menos de 500ms para projetos com até 10.000 tarefas.

### RNF-02: Multi-tenancy
Cada organização tem seus dados isolados. Não deve ser possível acessar dados de outra organização.

### RNF-03: Disponibilidade
O sistema deve ter uptime de 99,5% medido mensalmente.

### RNF-04: Auditoria
Todas as ações de criação, edição e exclusão devem ser registradas com usuário, timestamp e dados anteriores.
