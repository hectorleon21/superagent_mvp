import { Elysia } from 'elysia';
import { authOrApiKeyMiddleware, requirePermission } from '../auth-service/middleware';

// Ejemplo de cómo usar auth en el servicio RAG
export const ragService = new Elysia({ prefix: '/rag' })
  // Aplicar middleware de auth a todas las rutas
  .derive(authOrApiKeyMiddleware)
  
  // Búsqueda - requiere permiso de lectura
  .post('/search', 
    async ({ body, auth }) => {
      const { query, limit = 10 } = body;
      
      // Auth contiene organizationId automáticamente
      const results = await searchDocuments({
        query,
        organizationId: auth.organizationId, // ← Multi-tenancy automático
        limit
      });
      
      return { results };
    },
    {
      beforeHandle: requirePermission('rag:read')
    }
  )
  
  // Subir documento - requiere permiso de escritura
  .post('/documents/upload',
    async ({ body, auth }) => {
      const { file, metadata } = body;
      
      // Guardar documento con organizationId
      const document = await createDocument({
        file,
        metadata,
        organizationId: auth.organizationId // ← Multi-tenancy automático
      });
      
      return { document };
    },
    {
      beforeHandle: requirePermission('rag:write')
    }
  )
  
  // Eliminar documento - requiere permiso de escritura
  .delete('/documents/:id',
    async ({ params, auth }) => {
      const { id } = params;
      
      // Verificar que el documento pertenece a la organización
      const document = await prisma.document.findFirst({
        where: {
          id,
          organizationId: auth.organizationId // ← Multi-tenancy automático
        }
      });
      
      if (!document) {
        return { error: 'Document not found' };
      }
      
      await deleteDocument(id);
      
      return { success: true };
    },
    {
      beforeHandle: requirePermission('rag:write')
    }
  );

// Ejemplo de uso en el chat service
export const chatServiceExample = new Elysia({ prefix: '/chat' })
  // Chat público - no requiere auth para el widget embebido
  .post('/public/:organizationSlug', async ({ body, params }) => {
    const { message } = body;
    const { organizationSlug } = params;
    
    // Buscar organización por slug
    const org = await prisma.organization.findUnique({
      where: { slug: organizationSlug }
    });
    
    if (!org) {
      return { error: 'Organization not found' };
    }
    
    // Procesar mensaje con contexto de la organización
    const response = await processChat({
      message,
      organizationId: org.id
    });
    
    return response;
  })
  
  // Chat autenticado - requiere auth
  .post('/authenticated',
    async ({ body, auth }) => {
      const { message } = body;
      
      // Guardar en historial
      await prisma.chat.create({
        data: {
          organizationId: auth.organizationId,
          userId: auth.userId,
          messages: [{ role: 'user', content: message }]
        }
      });
      
      const response = await processChat({
        message,
        organizationId: auth.organizationId,
        userId: auth.userId
      });
      
      return response;
    },
    {
      beforeHandle: [authOrApiKeyMiddleware, requirePermission('chat:write')]
    }
  ); 