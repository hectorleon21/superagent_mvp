# RAG Service para SuperAgent

Servicio de Retrieval-Augmented Generation (RAG) con multi-tenancy para SuperAgent.

## Características

- 🔍 Búsqueda semántica usando embeddings de OpenAI
- 🤖 Respuestas generadas con Llama 3.3 (Groq)
- 🏢 Multi-tenancy completo (datos aislados por organización)
- 📄 Soporte para múltiples formatos: PDF, DOCX, TXT, CSV, JSON
- 🔐 Autenticación y autorización integrada

## Configuración

### 1. Variables de entorno

```bash
# .env
OPENAI_API_KEY=sk-...          # Para generar embeddings
GROQ_API_KEY=gsk_...           # Para generar respuestas (Llama 3.3)
QDRANT_URL=http://localhost:6333
DATABASE_URL=postgresql://...   # PostgreSQL para metadata
JWT_SECRET=tu-secret-seguro
```

### 2. Iniciar Qdrant

```bash
docker run -p 6333:6333 -v ./qdrant_storage:/qdrant/storage qdrant/qdrant
```

### 3. Instalar dependencias

```bash
cd backend/packages/rag-service
bun install
```

## Uso

### Desarrollo

```bash
bun run dev
```

### Producción

```bash
bun start
```

## API Endpoints

### Documentos

```typescript
// Subir documento
POST /rag/documents/upload
Authorization: Bearer <token>
Body: FormData { 
  file: File,
  metadata?: { category: "manual", tags: ["producto"] }
}

// Listar documentos
GET /rag/documents?page=1&limit=20
Authorization: Bearer <token>

// Eliminar documento
DELETE /rag/documents/:id
Authorization: Bearer <token>
```

### Búsqueda

```typescript
// Búsqueda semántica
POST /rag/search
Authorization: Bearer <token>
{
  "query": "¿Cuál es el precio del producto X?",
  "limit": 5,
  "filters": { "category": "catalogo" }
}

// Responder pregunta con contexto
POST /rag/answer
Authorization: Bearer <token>
{
  "question": "¿Cómo puedo configurar el producto?",
  "temperature": 0.7
}
```

## Integración con Chat

Para integrar RAG en tu servicio de chat existente:

```typescript
// backend/app/src/index.ts
import { enhanceWithRAG } from '../../packages/rag-service/src/chat-integration';

async function callGroq(
  userMessage: string,
  // ... otros parámetros
  organizationId?: string // Agregar este parámetro
) {
  // Si hay organizationId, buscar contexto RAG
  if (organizationId) {
    const { enhancedPrompt } = await enhanceWithRAG(
      userMessage,
      organizationId
    );
    // Usar enhancedPrompt en lugar de userMessage
  }
  // ... resto del código
}
```

## Arquitectura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Cliente   │────▶│  API REST   │────▶│   Qdrant    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    │
                    ┌─────────────┐            │
                    │   OpenAI    │            │
                    │ (Embeddings)│◀───────────┘
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    Groq     │
                    │ (Llama 3.3) │
                    └─────────────┘
```

## Costos estimados

- **Embeddings (OpenAI)**: ~$0.02 por millón de tokens
- **Respuestas (Groq)**: GRATIS
- **Almacenamiento (Qdrant)**: Depende del hosting

## Multi-tenancy

Cada organización tiene su propia colección en Qdrant:
- Colección: `org_${organizationId}`
- Todos los queries se filtran automáticamente
- Imposible acceder a datos de otra organización

## Troubleshooting

### Error: "Collection not found"
La colección se crea automáticamente al subir el primer documento.

### Error: "No se encontró información relevante"
Verifica que hayas subido documentos para tu organización.

### Embeddings lentos
Considera usar batch processing para documentos grandes. 