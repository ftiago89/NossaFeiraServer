# Release Notes — NossaFeira Server

## v1.1.0 — 2026-03-29

### Migração osls + Node.js 24

#### Mudanças

- **Migração para osls** — substituição do Serverless Framework pelo fork open-source oss-serverless (osls)
- **Runtime Node.js 24** — atualização do runtime Lambda de `nodejs20.x` para `nodejs24.x`
- **Script de deploy** — adicionado `npm run deploy` para deploy em produção
- **Primeiro deploy em produção** — API disponível em `https://nyl2g209f4.execute-api.us-east-1.amazonaws.com/prod`

---

## v1.0.0 — 2026-03-12

### Lançamento inicial

Primeira versão do backend serverless para o app NossaFeira.

#### Funcionalidades

- **5 endpoints REST** para gerenciamento de listas compartilhadas:
  - `POST /listas` — compartilhar lista (primeira vez)
  - `GET /listas` — pull de todas as listas da família (paginado)
  - `GET /listas/{id}` — pull de lista específica (sync manual)
  - `PUT /listas/{id}` — push de mudanças locais
  - `DELETE /listas/{id}` — deletar lista compartilhada
- **Validação de body** com AJV v8 (erros retornam 400)
- **Itens embedded** na lista — sem endpoints separados para itens
- **Valores monetários em centavos** (inteiros, sem ponto flutuante)
- **Timestamps em milissegundos** (Unix ms)

#### Infraestrutura

- AWS Lambda + API Gateway via Serverless Framework v3
- MongoDB Atlas como banco de dados (collection `listas`, índice em `familyId`)
- Desenvolvimento local com serverless-offline v13 + devcontainer
