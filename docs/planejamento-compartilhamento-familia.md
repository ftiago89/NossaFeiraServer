# NossaFeira — Planejamento: Compartilhamento de Listas por Família

## Contexto

O NossaFeira é um app Android de lista de compras (Kotlin + Jetpack Compose + Room).
A feature permite que membros de uma mesma família compartilhem listas de compras, sem disponibilização pública — o app será instalado via Android Studio para pessoas específicas.

Estratégia: **compartilhamento explícito por lista** — o usuário decide quais listas compartilhar via botão no ListaCard.

---

## Decisões Tomadas

### Distribuição do App
- Instalação manual via Android Studio para cada pessoa da família
- Sem publicação na Play Store

### Identificação da Família (familyId)
- O `familyId` será definido antes do build e hardcoded via `BuildConfig`
- Todos os membros da mesma família recebem o app compilado com o mesmo `familyId`

```kotlin
// build.gradle
buildConfigField("String", "FAMILY_ID", '"familia-silva-2024"')
buildConfigField("String", "API_KEY", '"chave-secreta-aqui"')
```

### Autenticação
- **Sem Cognito** — considerado complexo demais para o contexto de uso privado
- Autenticação via **API Key estática** no header das requisições
- A API Key será hardcoded no `BuildConfig` junto com o `familyId`
- Protege o endpoint sem adicionar complexidade de tokens JWT, refresh, etc.

### Backend
- **AWS Lambda** com Node.js (serverless)
- **AWS API Gateway** expondo os endpoints REST
- Custo praticamente zero para uso familiar

### Banco de Dados
- **MongoDB Atlas** — free tier (500MB)
- 500MB é mais que suficiente para listas de compras familiares
- Cluster gratuito, sem custo adicional

---

## Arquitetura

```
App Android
  └── BuildConfig.FAMILY_ID + API_KEY (header)
        │
        ▼
  API Gateway ──▶ Lambda (Node.js)
                      │
                      ▼
                  MongoDB Atlas (free tier)
```

---

## Modelagem do Banco de Dados

Collection: `listas`

```json
{
  "_id": "ObjectId",
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

- Itens são **embedded** dentro do documento da lista (padrão MongoDB, evita joins)
- `updatedAt` é atualizado pelo backend a cada PUT
- Índice obrigatório: `{ familyId: 1 }` para queries eficientes

---

## Endpoints REST

```
POST   /listas                       → compartilhar lista (primeira vez)
GET    /listas                       → pull de todas as listas da família (startup)
GET    /listas/{remoteId}            → pull de uma lista específica (sync manual)
PUT    /listas/{remoteId}            → push de mudanças locais (lista + itens embutidos)
DELETE /listas/{remoteId}            → deletar lista compartilhada
```

O `familyId` é extraído do header da requisição e usado para filtrar todos os dados.
Os itens são sempre enviados embutidos no corpo da lista — não existem endpoints separados para itens.

---

## Conexão Lambda → MongoDB Atlas

Boa prática para evitar overhead de cold start: reutilizar a conexão fora do handler.

```javascript
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;
  const client = await MongoClient.connect(process.env.MONGO_URI);
  cachedDb = client.db('nossafeira');
  return cachedDb;
}

export const handler = async (event) => {
  const db = await connectDB();
  // lógica aqui
};
```

---

## Sincronização no App Android

- Sem real-time (sem WebSocket/Firebase)
- Sem WorkManager — sync é sempre sob demanda ou no startup
- Room continua sendo a fonte de verdade local
- Sync ocorre em dois momentos:
  1. **Startup**: pull silencioso de todas as listas compartilhadas da família
  2. **Manual**: ícone de sync em cada ListaCard compartilhado

### Estratégia de Conflito

- Comparação via `syncedAt` (timestamp do último sync bem-sucedido no dispositivo local)
- Se `backend.updatedAt > local.syncedAt` → outro membro editou → atualiza local (conflito)
- Se `backend.updatedAt <= local.syncedAt` → nenhuma mudança externa → PUT com versão local
- **Last sync wins**: quem sincronizar primeiro preserva sua versão no backend
- A lista é sempre tratada como unidade atômica (sem merge por item)
- Usuário é notificado via Toast quando suas alterações locais são substituídas

---

## Conectividade Lambda → MongoDB Atlas

- Free tier M0 **não suporta VPC Peering nem PrivateLink** (disponível apenas em M10+)
- A conexão ocorre pela **internet pública com TLS** — sem necessidade de VPC
- Lambda IPs são dinâmicos, portanto o Atlas Network Access deve liberar `0.0.0.0/0`
- Segurança garantida em duas camadas:
  1. Credenciais no `MONGO_URI` (usuário/senha do cluster)
  2. API Key no header das requisições (`x-api-key`)
- Conclusão: **M0 + `0.0.0.0/0` no Network Access** é suficiente para o contexto familiar privado

---

## Pontos em Aberto

- Estrutura de pastas do projeto Lambda
- Estratégia de deploy (AWS SAM, Serverless Framework, CDK?)
- Variáveis de ambiente (MONGO_URI, API keys) e gestão de secrets
- Tratamento de erros e retries na Lambda
