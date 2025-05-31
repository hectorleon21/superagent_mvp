import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { QdrantClient } from '@qdrant/qdrant-js';
import { QdrantVectorStore } from "@langchain/community/vectorstores/qdrant";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PrismaClient } from '@prisma/client';
import { authOrApiKeyMiddleware, requirePermission } from '../../auth-service/middleware';
import { DocumentProcessor } from './document-processor.ts';
import { SearchService } from './search-service.ts';
import { DocumentService } from './document-service.ts';
import { createQdrantClient, createEmbeddings } from './config.ts';

// Tipos para el contexto con autenticación
interface AuthContext {
  auth: {
    organizationId: string;
    userId?: string;
    apiKeyId?: string;
    permissions: string[];
  };
}

// Inicializar clientes
const prisma = new PrismaClient();
const qdrantClient = createQdrantClient();
const embeddings = createEmbeddings();
const documentService = new DocumentService(qdrantClient, embeddings);
const searchService = new SearchService(qdrantClient, embeddings);

// Servicio RAG principal
const app = new Elysia()
  .use(cors())
  .use(swagger())
  // Aplicar middleware de autenticación a todos los endpoints
  .use(authOrApiKeyMiddleware)
  // Derivar el contexto auth para que esté disponible en todos los handlers
  .derive(({ request, headers, set }: any) => {
    // El middleware authOrApiKeyMiddleware debe agregar auth al contexto
    // Aquí lo extraemos si está disponible
    const auth = (request as any).auth || (set as any).auth;
    return { auth };
  })
  // Endpoints RAG
  .group('/rag', (app: any) => 
    app
      // Búsqueda semántica
      .post('/search', async ({ body, auth }: any) => {
        const { query, limit = 5, filters = {} } = body;
        
        try {
          const results = await searchService.search({
            query,
            organizationId: auth.organizationId,
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
      .post('/answer', async ({ body, auth }: any) => {
        const { question, systemPrompt, temperature = 0.7 } = body;
        
        try {
          const answer = await searchService.answerQuestion({
            question,
            organizationId: auth.organizationId,
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
      
      // Subir documento
      .post('/documents/upload', async ({ body, auth, set }: any) => {
        const { file, metadata = {} } = body;
        
        try {
          // Guardar info en DB
          const document = await prisma.document.create({
            data: {
              organizationId: auth.organizationId,
              fileName: file.name,
              fileType: file.type,
              metadata: metadata
            }
          });
          
          // Procesar documento
          const processor = new DocumentProcessor();
          const result = await processor.processDocument({
            documentId: document.id,
            organizationId: auth.organizationId,
            file,
            metadata: {
              ...metadata,
              documentId: document.id,
              fileName: file.name
            }
          }, qdrantClient, embeddings);
          
          // Actualizar con vector IDs
          await prisma.document.update({
            where: { id: document.id },
            data: { 
              vectorIds: result.vectorIds,
              content: result.extractedText?.substring(0, 5000) // Primeros 5000 chars
            }
          });
          
          return {
            document: {
              id: document.id,
              fileName: document.fileName,
              chunksCreated: result.vectorIds.length
            }
          };
          
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      }, {
        body: t.Object({
          file: t.File(),
          metadata: t.Optional(t.Object({}))
        })
      })
      
      // Listar documentos
      .get('/documents', async ({ auth, query }: any) => {
        const { page = 1, limit = 20 } = query;
        
        const documents = await prisma.document.findMany({
          where: { organizationId: auth.organizationId },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            createdAt: true,
            metadata: true,
            vectorIds: true
          }
        });
        
        const total = await prisma.document.count({
          where: { organizationId: auth.organizationId }
        });
        
        return {
          documents,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      }, {
        query: t.Object({
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number())
        })
      })
      
      // Obtener documento por ID
      .get('/documents/:id', async ({ params, auth, set }: any) => {
        const document = await prisma.document.findFirst({
          where: {
            id: params.id,
            organizationId: auth.organizationId
          }
        });
        
        if (!document) {
          set.status = 404;
          return { error: 'Document not found' };
        }
        
        return { document };
      }, {
        beforeHandle: requirePermission('rag:read')
      })
      
      // Eliminar documento
      .delete('/documents/:id', async ({ params, auth, set }: any) => {
        try {
          // Verificar que existe y pertenece a la org
          const document = await prisma.document.findFirst({
            where: {
              id: params.id,
              organizationId: auth.organizationId
            }
          });
          
          if (!document) {
            set.status = 404;
            return { error: 'Document not found' };
          }
          
          // Eliminar vectores de Qdrant
          if (document.vectorIds && document.vectorIds.length > 0) {
            const collectionName = `org_${auth.organizationId}`;
            await qdrantClient.delete(collectionName, {
              points: document.vectorIds
            });
          }
          
          // Eliminar de DB
          await prisma.document.delete({
            where: { id: params.id }
          });
          
          return { success: true };
          
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      }, {
        beforeHandle: requirePermission('rag:write')
      })
      
      // Health check
      .get('/health', async ({ auth }: any) => {
        return {
          status: 'ok',
          service: 'rag',
          organizationId: auth.organizationId
        };
      })
  )
  .listen(process.env.RAG_SERVICE_PORT || 3002);

console.log(`🔍 RAG Service running on ${app.server?.hostname}:${app.server?.port}`);

export { app }; 