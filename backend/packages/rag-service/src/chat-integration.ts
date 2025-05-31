import { SearchService } from './search-service';
import { QdrantClient } from '@qdrant/qdrant-js';
import { OpenAIEmbeddings } from "@langchain/openai";

// Función helper para integrar RAG en el chat
export async function enhanceWithRAG(
  message: string,
  organizationId: string,
  options: {
    useRAG?: boolean;
    ragLimit?: number;
    includeSourcesInResponse?: boolean;
  } = {}
): Promise<{
  enhancedPrompt: string;
  sources?: Array<{ content: string; metadata: any }>;
}> {
  const { useRAG = true, ragLimit = 3, includeSourcesInResponse = false } = options;
  
  if (!useRAG) {
    return { enhancedPrompt: message };
  }
  
  try {
    // Inicializar servicios
    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
    
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });
    
    const searchService = new SearchService(qdrantClient, embeddings);
    
    // Buscar contexto relevante
    const searchResults = await searchService.search({
      query: message,
      organizationId,
      limit: ragLimit
    });
    
    if (searchResults.length === 0) {
      return { enhancedPrompt: message };
    }
    
    // Construir contexto
    const context = searchResults
      .map((result, index) => `[${index + 1}] ${result.content}`)
      .join('\n\n');
    
    // Crear prompt mejorado
    const enhancedPrompt = `
Contexto de la empresa:
${context}

Pregunta del cliente: ${message}

Instrucciones:
- Usa el contexto proporcionado para dar respuestas precisas sobre la empresa
- Si la información no está en el contexto, responde de forma general pero útil
- Mantén un tono conversacional y amigable
- No menciones que estás usando un "contexto" o "base de datos"
`;
    
    return {
      enhancedPrompt,
      sources: includeSourcesInResponse ? searchResults : undefined
    };
    
  } catch (error) {
    console.error('Error al mejorar con RAG:', error);
    // En caso de error, devolver el mensaje original
    return { enhancedPrompt: message };
  }
}

// Modificación sugerida para el chat service existente
export function createEnhancedChatPrompt(
  systemRole: string,
  ragContext?: string
): string {
  if (!ragContext) {
    return systemRole;
  }
  
  return `${systemRole}

INFORMACIÓN IMPORTANTE DE LA EMPRESA:
${ragContext}

Usa esta información cuando sea relevante para responder a las preguntas del cliente.`;
}

// Ejemplo de cómo modificar el endpoint de chat existente
export const chatWithRAGExample = `
// En tu archivo backend/app/src/index.ts, modifica la función callGroq:

async function callGroq(
  userMessage: string, 
  userId: string = 'default',
  imageUrl?: string, 
  agentName: string = 'Eduardo',
  userName: string = 'Cliente',
  organizationId?: string, // NUEVO - para RAG
  systemRole: string = SYSTEM_ROLE_USER_AGENT,
  temperature: number = 0.6
): Promise<string> {
  try {
    let enhancedSystemRole = systemRole;
    
    // Si hay organizationId, buscar contexto RAG
    if (organizationId) {
      const { enhancedPrompt } = await enhanceWithRAG(
        userMessage,
        organizationId,
        { ragLimit: 3 }
      );
      
      // Agregar contexto al system role si se encontró información
      if (enhancedPrompt !== userMessage) {
        enhancedSystemRole = createEnhancedChatPrompt(systemRole, enhancedPrompt);
      }
    }
    
    // Resto del código existente con Groq...
    // El modelo Llama 3.3 usará automáticamente el contexto RAG
  }
}

// Y en los endpoints de chat, agregar organizationId:
.post("/api/chat", async (context: any) => {
  const body = context.body as any;
  const message = body?.message || '';
  const organizationId = body?.organizationId; // NUEVO
  
  const response = await callGroq(
    message, 
    userId, 
    imageUrl, 
    agentName, 
    userName,
    organizationId // Pasar organizationId para activar RAG
  );
  
  return { text: response };
})
`;

// Función para procesar documentos automáticamente cuando se mencionan
export async function processInlineDocuments(
  message: string,
  organizationId: string
): Promise<string[]> {
  // Detectar URLs en el mensaje
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.match(urlRegex) || [];
  
  const processedUrls: string[] = [];
  
  for (const url of urls) {
    try {
      // Aquí podrías implementar:
      // 1. Descargar el contenido de la URL
      // 2. Procesarlo como documento
      // 3. Agregarlo al RAG
      processedUrls.push(url);
    } catch (error) {
      console.error(`Error procesando URL ${url}:`, error);
    }
  }
  
  return processedUrls;
}

// Utilidad para verificar si una organización tiene documentos
export async function hasRAGContent(organizationId: string): Promise<boolean> {
  try {
    const qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
    
    const collectionName = `org_${organizationId}`;
    
    // Verificar si la colección existe y tiene contenido
    const info = await qdrantClient.getCollection(collectionName);
    return (info.points_count ?? 0) > 0;
    
  } catch (error) {
    return false;
  }
} 