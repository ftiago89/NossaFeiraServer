# NossaFeira Server — CLAUDE.md

## O Projeto

Backend serverless para o app Android **NossaFeira** (lista de compras familiar).
Permite que membros de uma mesma família compartilhem listas de compras via API REST.

Distribuição do app: instalação manual via Android Studio — sem publicação na Play Store.

---

## Stack

- **Serverless Framework v3** + **serverless-offline v13** (desenvolvimento local)
- **Node.js 20** (CommonJS — `require`/`module.exports`)
- **AWS Lambda** + **API Gateway**
- **MongoDB Atlas** free tier (collection `listas`, itens embedded)
- **Mongoose v9** para modelagem e conexão com o banco
- **AJV v8** + **ajv-formats v3** para validação de body

---

## Autenticação

Sem Cognito. Autenticação simples via headers em toda requisição:
- `x-api-key` — chave estática validada pelo backend
- `x-family-id` — identifica a família; usado para filtrar todos os dados

Ambos são hardcoded no `BuildConfig` do app Android e enviados via `AuthInterceptor` (OkHttp).

---

## Endpoints

| Método | Path | Ação |
|--------|------|------|
| POST | `/listas` | Compartilhar lista (primeira vez) |
| GET | `/listas` | Pull de todas as listas da família |
| GET | `/listas/{id}` | Pull de lista específica (sync manual) |
| PUT | `/listas/{id}` | Push de mudanças locais |
| DELETE | `/listas/{id}` | Deletar lista compartilhada |

O `familyId` vem sempre do header `x-family-id` — nunca do body ou da URL.
Itens são sempre embutidos no body da lista — não existem endpoints separados para itens.

---

## Modelo de Dados (MongoDB)

Collection: `listas`

```json
{
  "_id": "uuid-gerado-pelo-app",
  "familyId": "familia-silva-2024",
  "nome": "Feira da semana",
  "valorEstimado": 150.00,
  "criadaEm": "timestamp",
  "updatedAt": "timestamp",
  "itens": [
    {
      "id": "uuid",
      "nome": "Arroz",
      "quantidade": "2kg",
      "categoria": "OUTROS",
      "preco": 8.50,
      "comprado": false,
      "criadoEm": "timestamp"
    }
  ]
}
```

- `_id` é um UUID gerado pelo app Android e enviado no body do POST — o backend não gera o `_id`
- Índice obrigatório: `{ familyId: 1 }`
- `updatedAt` é atualizado pelo backend a cada PUT
- Itens são embedded (sem collection separada)

---

## Estrutura de Pastas

```
src/
├── lambdas/
│   ├── listas/
│   │   ├── criar.js
│   │   ├── listarTodas.js
│   │   ├── buscarUma.js
│   │   ├── atualizar.js
│   │   └── deletar.js
│   └── validators/
│       └── listas/
│           ├── criarSchema.js
│           └── atualizarSchema.js
├── services/
│   └── listas/
│       ├── criarLista.js
│       ├── listarTodasListas.js
│       ├── buscarUmaLista.js
│       ├── atualizarLista.js
│       └── deletarLista.js
├── models/
│   └── Lista.js
├── middleware/
│   └── auth.js           ← valida x-api-key e extrai x-family-id
├── database/
│   └── db.js             ← conexão MongoDB com cache (padrão Lambda)
├── utils/
│   ├── constants.js      ← status codes HTTP
│   └── requestsRespose.js ← helpers successResponse / errorResponse
└── errors/
    └── GeneralError.js   ← classe de erro padrão

config/
├── dev.json              ← variáveis para ambiente local (DB, API_KEY)
└── prod.json             ← variáveis para produção (não commitar segredos)

serverless.yml            ← configuração de deploy (produção)
serverless-dev.yml        ← configuração local com serverless-offline
```

**Responsabilidades:**
- **lambda** → recebe o evento, valida auth, valida body (AJV), chama o service, retorna a response
- **validators** → schemas AJV para validação de body; erro de validação retorna 400
- **service** → regras de negócio e queries no MongoDB

---

## Padrão de Lambda

As lambdas ficam em `src/lambdas/listas/`, portanto os paths relativos sobem dois níveis (`../../`).

```javascript
const db = require('../../database/db');
const { statusCode } = require('../../utils/constants');
const { successResponse, errorResponse } = require('../../utils/requestsRespose');
const { validateAuth } = require('../../middleware/auth');

module.exports.execute = async (event) => {
  try {
    const auth = validateAuth(event);
    if (auth.error) return auth.error;

    await db();
    // lógica aqui
    return successResponse(statusCode.OK, { ... });
  } catch (err) {
    console.error('Error => ', err);
    return errorResponse(err);
  }
};
```

---

## Conexão com MongoDB

Padrão de cache fora do handler para evitar overhead de cold start (já implementado em `src/database/db.js`).
A variável de ambiente `DB` contém a connection string completa do MongoDB Atlas.

MongoDB Atlas M0 (free tier):
- Não suporta VPC Peering — conexão via internet pública com TLS
- Network Access deve liberar `0.0.0.0/0` (IPs dinâmicos da Lambda)

---

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DB` | Connection string MongoDB Atlas |
| `API_KEY` | Chave estática para autenticação |

Definidas em `config/{stage}.json` e injetadas pelo Serverless Framework.
**Nunca commitar `config/prod.json` com segredos reais.**

---

## Tratamento de Erros

| Situação | Status |
|----------|--------|
| `x-api-key` inválida ou ausente | 401 |
| `x-family-id` ausente | 400 |
| Lista não encontrada | 404 |
| Erro inesperado | 500 |

- Sem retry automático na Lambda — o app Android é responsável por tratar falhas de rede
- Logs via `console.error` nos catches → CloudWatch

---

## Estratégia de Conflito (para referência)

Comparação via `syncedAt` no app Android (não gerenciado pelo backend):
- Se `backend.updatedAt > local.syncedAt` → conflito → app atualiza local
- Se `backend.updatedAt <= local.syncedAt` → sem mudança externa → app faz PUT
- Last sync wins — a lista é tratada como unidade atômica (sem merge por item)

---

## Roteiro de Implementação

1. `src/utils/constants.js` — adicionar status codes 201, 400, 401, 404
2. `src/errors/GeneralError.js` — ajustar para os novos status codes
3. `config/dev.json` — adicionar `API_KEY`
4. `src/models/Lista.js` — schema Mongoose
5. `src/middleware/auth.js` — validar `x-api-key` e extrair `x-family-id`
6. `src/lambdas/validators/listas/criarSchema.js` e `atualizarSchema.js`
7. Services (`src/services/listas/`) — um por vez, do mais simples ao mais complexo
8. Lambdas (`src/lambdas/listas/`) + registro no `serverless-dev.yml` — junto, para testar cada rota
9. `serverless.yml` — registrar funções para produção

---

## Comandos

```bash
# Rodar local
npm run dev

# Deploy
serverless deploy --stage prod
```
