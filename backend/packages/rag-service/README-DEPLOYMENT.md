# Guía de Deployment - RAG Service

## Configuración con Qdrant Cloud (Recomendado)

### 1. Crear cuenta en Qdrant Cloud
1. Ve a https://cloud.qdrant.io/
2. Regístrate con GitHub/Google
3. Crea un nuevo cluster:
   - Nombre: `superagent-dev` (o el que prefieras)
   - Región: La más cercana a tu backend
   - Tier: **Free** (1GB storage)

### 2. Obtener credenciales
Después de crear el cluster obtendrás:
- **URL**: `https://xxxxxx.us-east-1-0.aws.cloud.qdrant.io`
- **API Key**: Click en "API Keys" → "Create API Key"

### 3. Configurar variables de entorno

#### Desarrollo local (.env):
```env
QDRANT_URL=https://tu-cluster.us-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=tu-api-key-aqui
```

#### Producción en Render:
En el dashboard de Render, agrega estas Environment Variables:
```
QDRANT_URL=https://tu-cluster.us-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=tu-api-key-aqui
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
DATABASE_URL=postgresql://...
JWT_SECRET=...
```

### 4. Actualizar el código (si es necesario)

El código ya está preparado para usar Qdrant Cloud. Solo asegúrate de que en `config.ts`:

```typescript
export function createQdrantClient(): QdrantClient {
  return new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY, // ← Importante para cloud
  });
}
```

## Ventajas de esta arquitectura:

1. **Mismo Qdrant para dev y prod**: Sin sorpresas
2. **Gratis hasta 1GB**: Suficiente para MVP
3. **Sin mantenimiento**: Qdrant se encarga
4. **Escalable**: Puedes upgradear cuando crezcas
5. **Multi-región**: Baja latencia global

## Arquitectura en Producción:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Render    │────▶│Qdrant Cloud │
│  (Frontend) │     │  (Backend)  │     │  (Vectors)  │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  PostgreSQL │
                    │   (Render)  │
                    └─────────────┘
```

## Costos estimados (USD/mes):
- Frontend (Vercel): $0
- Backend (Render): $0-7
- Database (Render): $0-7
- Vectors (Qdrant): $0
- **Total MVP**: $0-14/mes

## Monitoreo:
Qdrant Cloud incluye:
- Dashboard con métricas
- Logs de queries
- Alertas de uso
- API usage stats 