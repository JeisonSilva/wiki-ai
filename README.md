# doc-wiki-ai

Sistema de gestão de conhecimento para projetos de software, baseado no padrão [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) de Andrej Karpathy.

O LLM mantém uma wiki estruturada a partir de documentos que você fornece. Você nunca escreve na wiki diretamente — os agents fazem isso. Você fornece contexto, faz perguntas, e o conhecimento cresce.

---

## Agents Disponíveis

A plataforma possui 7 agents especializados. Cada um tem uma responsabilidade única.

| Agent | Claude Code | Cursor | Função |
|---|---|---|---|
| `wiki-ingest` | `/wiki-ingest` | `@wiki-ingest` | Processa arquivo de `raw/` e atualiza a wiki |
| `wiki-query` | `/wiki-query` | `@wiki-query` | Responde perguntas consultando a wiki |
| `wiki-feature` | `/wiki-feature` | `@wiki-feature` | Cria feature na wiki com todos os vínculos |
| `wiki-lint` | `/wiki-lint` | `@wiki-lint` | Audita saúde da wiki (órfãos, links quebrados) |
| `wiki-discovery` | `/wiki-discovery` | `@wiki-discovery` | Sessão de Discovery (Dual-Track Agile) |
| `pair` | `/pair` | `@pair` | Engenheiro sênior para pair programming |
| `angular` | `/angular` | `@angular` | Revisor de boas práticas Angular |

---

## Estrutura de Diretórios

```
doc-wiki-ai/
├── CLAUDE.md                  ← schema da wiki (lido pelo LLM a cada sessão)
├── .cursorrules               ← schema da wiki para Cursor
├── .claude/
│   └── commands/              ← agents para Claude Code (slash commands)
├── .cursor/
│   └── rules/                 ← agents para Cursor (MDC rules)
├── wiki/
│   ├── index.md               ← catálogo de tudo na wiki
│   ├── log.md                 ← histórico cronológico append-only
│   ├── overview.md            ← visão geral do projeto
│   ├── features/              ← uma página por feature
│   ├── requirements/          ← requisitos funcionais e não-funcionais
│   ├── entities/              ← entidades de domínio
│   └── decisions/             ← ADRs (Architecture Decision Records)
└── raw/
    ├── requirements/          ← seus documentos de requisitos
    ├── meetings/              ← transcrições de reuniões
    ├── research/              ← pesquisas e referências
    └── assets/                ← imagens e diagramas
```

> **Regra fundamental:** você nunca escreve em `wiki/` ou `raw/` manualmente. O LLM escreve em `wiki/`. Você coloca fontes em `raw/` para ele processar.

---

## Fluxos de Uso

### Iniciar um projeto novo

#### Claude Code

Abra o terminal na raiz do repositório e execute:

```bash
claude
```

Na sessão, diga:

```
Leia o CLAUDE.md. Vamos iniciar um projeto chamado X. O objetivo é Y. A stack é Z.
```

O `CLAUDE.md` é carregado automaticamente pelo Claude Code a cada sessão. O LLM preencherá `wiki/overview.md` e criará as primeiras páginas.

#### Cursor

Abra a pasta do repositório no Cursor (`File → Open Folder`). O arquivo `.cursorrules` é carregado automaticamente como contexto global.

No painel de chat (Agent ou Composer), ative explicitamente o schema da wiki e inicie o projeto:

```
@wiki-schema Vamos iniciar um projeto chamado X. O objetivo é Y. A stack é Z.
```

> **Por que `@wiki-schema`?** As regras do Cursor com `alwaysApply: false` (como os agents `@wiki-ingest`, `@wiki-discovery` etc.) precisam ser ativadas explicitamente. O `@wiki-schema` é o único com `alwaysApply: true` — mas mencioná-lo no primeiro turno garante que o modelo o leia antes de escrever qualquer arquivo.

Para usar um agent específico em qualquer momento, mencione-o no chat:

```
@wiki-discovery quero criar uma feature de autenticação social
@wiki-ingest raw/requirements/spec-v1.md
@angular crie um componente de listagem de usuários
```

Os agents com `globs` configurados (como `@angular`) também são sugeridos automaticamente pelo Cursor quando você abre arquivos `.ts`, `.html` ou `.scss`.

---

### Ingerir um documento de requisitos

Coloque o documento em `raw/requirements/` e invoque:

```
/wiki-ingest raw/requirements/meu-documento.md
```

O agent lê o arquivo, apresenta um resumo do que encontrou, aguarda sua confirmação e então cria as páginas de requisitos, features e entidades correspondentes.

---

### Idealizar uma feature nova (Dual-Track Agile)

Use o `wiki-discovery` para explorar o problema **antes** de decidir o que construir. O agent conduz uma sessão dialogal — uma pergunta por vez — passando por 4 fases:

```
/wiki-discovery autenticação com redes sociais
```

**Fases da sessão:**

```
1. Problema    → quem tem, qual a dor, como resolve hoje
2. Oportunidade → tamanho, urgência, por que agora
3. Hipótese    → solução + premissas arriscadas + métrica de sucesso
4. Experimento → como validar (ou justificativa para dispensar)
```

Ao final, cria `wiki/features/<slug>.md` com `status: discovery`.

Quando a hipótese for validada, promova para `backlog` com:

```
/wiki-feature <nome da feature>
```

**Fluxo completo (Dual-Track):**

```
wiki-discovery → [validado] → wiki-feature → wiki pages → delivery
   (problem space)              (solution space)
```

---

### Registrar uma feature já definida

Quando a feature é conhecida e não precisa de discovery:

```
/wiki-feature exportação de relatórios PDF
```

O agent verifica duplicatas, cria a página com todos os vínculos (requisitos, entidades, ADR se necessário) e atualiza o índice.

---

### Consultar a wiki antes de implementar

```
/wiki-query O que a wiki diz sobre autenticação?
```

O agent lê `wiki/index.md`, navega pelas páginas relevantes e responde com citações `[[slug]]`. Se a resposta for valiosa (análise, síntese, comparação), oferece salvá-la como nova página.

---

### Fazer lint da wiki

```
/wiki-lint
```

Verifica e reporta:
- Páginas órfãs (sem links apontando para elas)
- Features sem requisitos vinculados
- Requisitos sem features que os implementam
- Entidades mencionadas sem página própria
- Features `in-progress` sem guia de implementação
- Links `[[slug]]` quebrados

Corrige automaticamente o que for possível; reporta o resto para ação humana.

---

### Pair programming com engenheiro sênior

```
/pair
```

Ou compartilhe código diretamente:

```
/pair <cole o código aqui>
```

O agent atua como **navigator**: você é o driver, ele sugere. Referências:
- **Code smells** pelo catálogo de Fowler (nomeia o smell antes de sugerir a refatoração)
- **Ciclo TDD** de Kent Beck: 🔴 Red → 🟢 Green → 🔵 Refactor
- **Clean Code** de Robert C. Martin (nomes, SRP, funções pequenas, sem comentários redundantes)

Nunca propõe rewrites — sempre o menor passo seguro.

---

### Revisão de código Angular

```
/angular <cole o código ou descreva o que criar>
```

Três modos automáticos:

| Entrada | Comportamento |
|---|---|
| Código existente | Revisão contra checklist completo, aponta violações |
| Descrição de feature | Gera código já no padrão correto |
| Pergunta sobre prática | Responde com exemplo bad/good |

Regras que o agent enforça (Angular v17+):

- Standalone sem `standalone: true` explícito
- `input()` / `output()` — proibido `@Input()` / `@Output()`
- `ChangeDetectionStrategy.OnPush` em todo componente
- `host: {}` no decorator — proibido `@HostBinding` / `@HostListener`
- `@if` / `@for` — proibido `*ngIf` / `*ngFor`
- Bindings nativos `[class.x]` — proibido `ngClass` / `ngStyle`
- Signals + `computed()` — proibido `mutate()`
- `inject()` + `providedIn: 'root'`
- Lazy loading em feature routes
- Acessibilidade WCAG AA (AXE, foco, ARIA, contraste)

---

## Como os Agents se Relacionam

```
                    ┌─────────────────┐
                    │  wiki-discovery │  ← ideação e validação
                    └────────┬────────┘
                             │ validado
                    ┌────────▼────────┐
                    │  wiki-feature   │  ← registro formal na wiki
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
         wiki-query     wiki-lint      wiki-ingest
       (consultas)    (saúde da wiki)  (novas fontes)

              ┌──────────────────────────────┐
              │  pair  +  angular            │  ← engineering layer
              │  (código, TDD, Clean Code,   │     (independente da wiki,
              │   boas práticas Angular)     │      mas integrado via ADRs)
              └──────────────────────────────┘
```

Os agents `pair` e `angular` são independentes da wiki — atuam na camada de código. Quando identificam uma decisão arquitetural relevante, sinalizam para criar um ADR via `/wiki-feature` ou `/wiki-discovery`.

---

## Dicas

- Use [Obsidian](https://obsidian.md/) para navegar `wiki/` — é um vault válido. O graph view mostra as conexões entre páginas via `[[links]]`.
- Filtre o log por tipo: `grep "^## " wiki/log.md | tail -20`
- Features em `status: discovery` ficam em `wiki/features/` mas não entram em desenvolvimento até validadas.
- O `wiki/index.md` é o ponto de entrada para qualquer consulta — o LLM sempre o lê primeiro.
- Ao usar Cursor, os agents com `globs` configurados (como `angular`) são sugeridos automaticamente quando você abre arquivos `.ts` / `.html`.
