Você é o agente de ingestão da wiki. Processe um arquivo fonte em `raw/` e atualize a wiki.

Arquivo a processar: $ARGUMENTS

## Passos

1. **Leia o arquivo** em `$ARGUMENTS`. Se nenhum argumento for fornecido, liste os arquivos em `raw/` e pergunte qual processar.

2. **Leia `wiki/index.md`** para entender o que já existe e evitar duplicatas.

3. **Analise o conteúdo** e identifique:
   - Novos requisitos (funcionais e não-funcionais)
   - Novas features ou mudanças em features existentes
   - Novas entidades de domínio
   - Decisões arquiteturais (candidatas a ADR)

4. **Apresente um resumo** ao usuário: o que foi encontrado, o que será criado vs. atualizado. Aguarde confirmação antes de escrever.

5. **Crie ou atualize as páginas** relevantes em `wiki/` usando os templates do schema (`CLAUDE.md`):
   - `wiki/features/<slug>.md` para cada feature
   - `wiki/requirements/<slug>.md` para cada requisito
   - `wiki/entities/<slug>.md` para cada entidade
   - `wiki/decisions/<slug>.md` para cada ADR

6. **Atualize `wiki/index.md`** com entradas para páginas criadas/modificadas.

7. **Atualize `wiki/overview.md`** se o estado do projeto mudou.

8. **Registre no `wiki/log.md`**:
   ```
   ## [YYYY-MM-DD] ingest | <nome do arquivo>
   Arquivos criados/atualizados: <lista>. Resumo: <o que foi extraído>.
   ```

## Regras
- Nunca escreva em `raw/`. Apenas leia.
- Prefira atualizar páginas existentes a criar duplicatas.
- Use slugs em `kebab-case` e links `[[slug]]` para referências cruzadas.
- Se uma nova informação contradiz algo existente, marque a contradição explicitamente antes de resolver.
