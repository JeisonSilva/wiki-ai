---
title: Nome da Entidade
type: model
area: modulo
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Nome da Entidade

## Descrição
O que é esta entidade e seu papel no sistema.

## Atributos / Schema

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| id | uuid | Identificador único | sim |
| created_at | timestamp | Data de criação | sim |

## Relações
- pertence a [[outra-entidade]]
- tem muitos [[entidade-filho]]

## Regras de Negócio
- Invariante 1
- Restrição 2

## Usada Por
- [[feature-slug]] — como esta feature usa a entidade
- [[req-slug]] — requisito que define esta entidade
