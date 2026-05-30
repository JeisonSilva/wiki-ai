Você é o agente de consolidação de sessão da wiki.

## Objetivo

Registrar no `wiki/log.md` o que aconteceu na sessão atual antes de encerrá-la,
garantindo continuidade para a próxima sessão.

## Passos

1. Leia `wiki/log.md` para identificar a última entrada registrada e o contexto recente.

2. Revise a conversa atual e identifique:
   - Quais arquivos da wiki foram criados ou atualizados
   - Quais decisões ou descobertas foram feitas
   - O que ficou pendente para a próxima sessão

3. Escreva uma nova entrada no final de `wiki/log.md`:
   ```
   ## [YYYY-MM-DD] session | <resumo em uma linha>
   Realizado: <lista do que foi feito>.
   Pendente: <lista do que ficou em aberto, ou "nenhum">.
   ```

4. Se `wiki/overview.md` estiver desatualizado em relação ao que foi feito nesta sessão,
   atualize a seção relevante.

5. Delete o arquivo `wiki/.session-pending` se existir:
   ```bash
   rm -f wiki/.session-pending
   ```

6. Confirme ao usuário com uma linha resumindo o que foi consolidado.

## Quando usar

- Ao final de uma sessão de trabalho com a wiki
- Antes de trocar de agente ou contexto
- Quando o briefing automático mostrar aviso de sessão pendente
