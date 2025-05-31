import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { SearchService } from './search-service.ts';
import { createQdrantClient, createEmbeddings } from './config.ts';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Verificar configuración
console.log('🔧 Configuración:');
console.log('  QDRANT_URL:', process.env.QDRANT_URL ? '✓' : '✗');
console.log('  QDRANT_API_KEY:', process.env.QDRANT_API_KEY ? '✓' : '✗');
console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✓' : '✗');
console.log('  GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✓' : '✗');

// Inicializar servicios
const qdrantClient = createQdrantClient();
const embeddings = createEmbeddings();
const searchService = new SearchService(qdrantClient, embeddings);

// Mock auth para desarrollo
const mockAuth = {
  organizationId: 'test-org-123',
  userId: 'test-user-123',
  permissions: ['rag:read', 'rag:write']
};

// Crear aplicación
const app = new Elysia()
  .use(cors())
  .use(swagger())
  
  // Health check directo
  .get('/rag/health', () => {
    return {
      status: 'ok',
      service: 'rag-test',
      qdrant: {
        url: process.env.QDRANT_URL,
        connected: true
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY
      }
    };
  })
  
  // Test endpoint directo
  .get('/rag/test', () => {
    return {
      message: '🎉 RAG Service is running!',
      timestamp: new Date(),
      endpoints: {
        health: 'GET /rag/health',
        test: 'GET /rag/test',
        search: 'POST /rag/search',
        answer: 'POST /rag/answer',
        swagger: 'GET /swagger'
      }
    };
  })
  
  // Búsqueda semántica directa
  .post('/rag/search', async ({ body }: { body: any }) => {
    console.log('🔍 Search request received:', body);
    const { query, limit = 5, filters = {} } = body;
    
    try {
      const results = await searchService.search({
        query,
        organizationId: mockAuth.organizationId,
        limit,
        filters
      });
      
      console.log('🔍 Search results:', results.length, 'items found');
      
      return { 
        results,
        message: results.length === 0 ? 'No hay documentos cargados aún' : `Encontrados ${results.length} resultados`,
        query: query,
        organizationId: mockAuth.organizationId
      };
    } catch (error: any) {
      console.error('🔍 Search error:', error);
      return { error: error.message };
    }
  }, {
    body: t.Object({
      query: t.String(),
      limit: t.Optional(t.Number()),
      filters: t.Optional(t.Object({}))
    })
  })
  
  // Responder pregunta con contexto directa
  .post('/rag/answer', async ({ body }: { body: any }) => {
    console.log('❓ Answer request received:', body);
    const { question, systemPrompt, temperature = 0.7 } = body;
    
    try {
      const answer = await searchService.answerQuestion({
        question,
        organizationId: mockAuth.organizationId,
        systemPrompt,
        temperature
      });
      
      console.log('❓ Answer generated successfully');
      
      return { 
        answer,
        question: question,
        organizationId: mockAuth.organizationId
      };
    } catch (error: any) {
      console.error('❓ Answer error:', error);
      return { error: error.message };
    }
  }, {
    body: t.Object({
      question: t.String(),
      systemPrompt: t.Optional(t.String()),
      temperature: t.Optional(t.Number())
    })
  })
  
  .listen(3003);

console.log('\n🚀 RAG Test Service started successfully!');
console.log(`📍 URL: http://localhost:3003`);
console.log(`📚 Swagger: http://localhost:3003/swagger`);
console.log(`🧪 Test endpoint: http://localhost:3003/rag/test`);
console.log('\n✅ Qdrant Cloud connected');
console.log('✅ OpenAI configured');
console.log('\n⚠️  Nota: Este es un servicio de prueba sin base de datos\n');

export { app }; 