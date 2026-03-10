# NossaFeira — Planejamento App: Feature de Compartilhamento Familiar

## Contexto

Adição de compartilhamento de listas entre membros de uma mesma família via backend.
O backend está documentado em `docs/planejamento-compartilhamento-familia.md`.

Estratégia: **compartilhamento explícito por lista** — o usuário decide quais listas compartilhar.
Sync é **sob demanda** (manual ou no startup), sem WorkManager ou sync automático em background.

---

## Mudanças Necessárias no App

### 1. BuildConfig

Adicionar as constantes de família e autenticação antes de cada build/instalação:

```kotlin
// build.gradle (app)
buildConfigField("String", "FAMILY_ID", '"familia-silva-2024"')
buildConfigField("String", "API_KEY", '"chave-secreta-aqui"')
```

---

### 2. Migration Room v2 → v3

Apenas a entidade `ListaFeira` recebe campos novos. `ItemFeira` não muda — itens trafegam embutidos na lista.

```kotlin
// Campos novos em ListaFeira:
val remoteId: String? = null            // ID no MongoDB; null = lista local (não compartilhada)
val isShared: Boolean = false           // controla UI: botão compartilhar vs ícone de sync
val updatedAt: Long = System.currentTimeMillis()  // atualizado em toda modificação local
val syncedAt: Long = 0L                 // timestamp do último sync bem-sucedido com o backend
```

```kotlin
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE listas_feira ADD COLUMN remoteId TEXT")
        database.execSQL("ALTER TABLE listas_feira ADD COLUMN isShared INTEGER NOT NULL DEFAULT 0")
        database.execSQL("ALTER TABLE listas_feira ADD COLUMN updatedAt INTEGER NOT NULL DEFAULT 0")
        database.execSQL("ALTER TABLE listas_feira ADD COLUMN syncedAt INTEGER NOT NULL DEFAULT 0")
    }
}
```

#### updatedAt — quando deve ser atualizado:

Toda operação que modifica a lista deve atualizar o `updatedAt` da lista pai:
- Criar, editar ou deletar um item
- Marcar item como comprado/descomprado
- Editar nome ou valor estimado da lista

---

### 3. Endpoints REST

```
POST   /listas                   → compartilhar lista (primeira vez)
GET    /listas                   → pull de todas as listas da família (startup)
GET    /listas/{remoteId}        → pull de uma lista específica (sync manual)
PUT    /listas/{remoteId}        → push de mudanças locais
DELETE /listas/{remoteId}        → deletar lista compartilhada
```

O `familyId` é extraído do header da requisição. Os itens são sempre embutidos no corpo da lista.

---

### 4. Camada de Rede (nova)

Dependências a adicionar:
- **Retrofit** — client HTTP
- **OkHttp** — interceptor para injetar headers
- **Gson** — serialização JSON

```
data/remote/
├── api/NossaFeiraApi.kt       → interface Retrofit com os 5 endpoints
├── dto/ListaDto.kt            → modelo de rede (lista com itens embutidos)
│   └── ItemDto.kt
└── RemoteDataSource.kt        → executa as chamadas e trata erros de rede
```

#### Interceptor de autenticação:

```kotlin
class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("x-api-key", BuildConfig.API_KEY)
            .addHeader("x-family-id", BuildConfig.FAMILY_ID)
            .build()
        return chain.proceed(request)
    }
}
```

---

### 5. Injeção de Dependência (Hilt)

```
di/
├── NetworkModule.kt    → provê OkHttpClient, AuthInterceptor, Retrofit, NossaFeiraApi
└── RepositoryModule.kt → já existe; adicionar binding de RemoteDataSource
```

---

### 6. Repository

```kotlin
class NossaFeiraRepository(
    private val localDataSource: LocalDataSource,   // Room (atual)
    private val remoteDataSource: RemoteDataSource  // Retrofit (novo)
)
```

Novos métodos necessários:
- `compartilharLista(lista)` — POST + salva remoteId/isShared/syncedAt no Room
- `sincronizarLista(lista)` — GET/{remoteId} + lógica de conflito + PUT ou atualização local
- `pullStartup()` — GET /listas + reconcilia com Room (silencioso)
- `deletarListaCompartilhada(lista)` — DELETE + remove do Room

---

### 7. Fluxos de Sincronização

#### Compartilhar (botão no ListaCard):
```
POST /listas (lista + itens embutidos)
→ sucesso: salva remoteId, isShared=true, syncedAt=now no Room
           Toast: "Lista compartilhada com sucesso."
→ falha:   Toast: "Falha ao compartilhar. Verifique sua conexão."
```

#### Startup — pull silencioso:
```
GET /listas

Para cada lista retornada pelo backend:
  ├── remoteId existe localmente?
  │     → SIM: backend.updatedAt > local.syncedAt?
  │             → SIM: atualiza Room com versão do backend, syncedAt=now
  │             → NÃO: PUT com versão local, syncedAt=now
  └── NÃO: insere no Room (isShared=true, syncedAt=now)

Lista local com isShared=true ausente no backend:
  → isShared=false, remoteId=null (foi deletada por outro membro; vira lista local)

Sem feedback visual — todo o fluxo é silencioso.
```

#### Sync manual (ícone no ListaCard compartilhado):
```
GET /listas/{remoteId}

backend.updatedAt > local.syncedAt?
  → SIM (conflito): atualiza Room com versão do backend, syncedAt=now
                    Toast: "Lista atualizada. Suas alterações locais foram substituídas."
  → NÃO:            PUT com versão local, syncedAt=now
                    Toast: "Lista sincronizada com sucesso."

Erro de rede:
  → Toast: "Falha na sincronização. Verifique sua conexão."
```

#### Deletar lista compartilhada:
```
DELETE /listas/{remoteId}
→ deleta do Room

Próximo pull dos outros membros:
  → lista ausente no backend → isShared=false, remoteId=null (vira lista local para eles)
```

---

### 8. UI — Mudanças no ListaCard

| Estado da lista | UI exibida |
|---|---|
| Local (`!isShared`) | Botão "Compartilhar" |
| Compartilhada (`isShared`) | Ícone de sync |

---

## Estrutura de Pastas Final

```
app/src/main/java/com/example/nossafeira/
├── data/
│   ├── db/
│   ├── model/
│   ├── dao/
│   ├── remote/          ← NOVO
│   │   ├── api/
│   │   ├── dto/
│   │   └── RemoteDataSource.kt
│   └── repository/
├── di/                  ← NOVO
│   ├── NetworkModule.kt
│   └── RepositoryModule.kt
├── ui/
├── viewmodel/
├── navigation/
└── MainActivity.kt
```

---

## Ordem de Implementação

1. Migration v2→v3 + atualizar entidade `ListaFeira`
2. Garantir que `updatedAt` é atualizado em todas as operações de modificação
3. DTOs (`ListaDto`, `ItemDto`) + interface `NossaFeiraApi`
4. `NetworkModule` + `AuthInterceptor` (Hilt)
5. `RemoteDataSource` + novos métodos no `Repository`
6. `ListasViewModel` — lógica de compartilhar, sync manual e startup pull
7. UI — botão/ícone de sync no `ListaCard`

---

## Estratégia de Conflito

- **Last sync wins**: quem sincronizar primeiro tem sua versão preservada no backend
- Comparação via `syncedAt` (não `updatedAt`): garante que edições locais feitas após o último sync são detectadas corretamente
- Sem merge por item — a lista é sempre tratada como unidade atômica
- Usuário é notificado via Toast quando suas alterações locais são substituídas
