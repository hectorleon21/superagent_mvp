import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { DocumentProcessor } from './document-processor.ts';
import { SearchService } from './search-service.ts';
import { DocumentService } from './document-service.ts';
import { createQdrantClient, createEmbeddings } from './config.ts';
import { PrismaClient } from '@prisma/client';

// Inicializar servicios
const prisma = new PrismaClient();
const qdrantClient = createQdrantClient();
const embeddings = createEmbeddings();
const documentService = new DocumentService(qdrantClient, embeddings);
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
  // Endpoints RAG
  .group('/rag', (app: any) => 
    app
      // Health check
      .get('/health', () => {
        return {
          status: 'ok',
          service: 'rag-standalone',
          qdrant: {
            url: process.env.QDRANT_URL,
            connected: true
          },
          openai: {
            configured: !!process.env.OPENAI_API_KEY
          }
        };
      })
      
      // Búsqueda semántica
      .post('/search', async ({ body }: any) => {
        const { query, limit = 5, filters = {} } = body;
        
        try {
          const results = await searchService.search({
            query,
            organizationId: mockAuth.organizationId,
            limit,
            filters
          });
          
          return { results };
        } catch (error: any) {
          return { error: error.message };
        }
      }, {
        body: t.Object({
          query: t.String(),
          limit: t.Optional(t.Number()),
          filters: t.Optional(t.Object({}))
        })
      })
      
      // Responder pregunta con contexto
      .post('/answer', async ({ body }: any) => {
        const { question, systemPrompt, temperature = 0.7 } = body;
        
        try {
          const answer = await searchService.answerQuestion({
            question,
            organizationId: mockAuth.organizationId,
            systemPrompt,
            temperature
          });
          
          return { answer };
        } catch (error: any) {
          return { error: error.message };
        }
      }, {
        body: t.Object({
          question: t.String(),
          systemPrompt: t.Optional(t.String()),
          temperature: t.Optional(t.Number())
        })
      })
      
      // Test endpoint
      .get('/test', () => {
        return {
          message: 'RAG Service is running!',
          timestamp: new Date(),
          auth: mockAuth
        };
      })
  )
  .listen(process.env.RAG_SERVICE_PORT || 3002);

console.log(`🔍 RAG Service (Standalone) running on ${app.server?.hostname}:${app.server?.port}`);
console.log(`📚 Swagger docs: http://localhost:${app.server?.port}/swagger`);

export { app }; 