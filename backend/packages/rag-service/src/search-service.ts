import { QdrantClient } from '@qdrant/qdrant-js';
import { OpenAIEmbeddings } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

// Configuración de Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface SearchOptions {
  query: string;
  organizationId: string;
  limit?: number;
  filters?: Record<string, any>;
}

interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  score: number;
}

interface AnswerOptions {
  question: string;
  organizationId: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// Función para llamar a Groq
async function callGroq(
  prompt: string,
  systemPrompt: string = 'Eres un asistente útil que responde basándose en el contexto proporcionado.',
  temperature: number = 0.7,
  maxTokens: number = 500
): Promise<string> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: maxTokens,
        temperature: temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en Groq API: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as {
      choices: Array<{
        message: {
          content: string;
        }
      }>
    };
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Error al llamar a Groq:", error);
    throw error;
  }
}

export class SearchService {
  private qdrantClient: QdrantClient;
  private embeddings: OpenAIEmbeddings;

  constructor(qdrantClient: QdrantClient, embeddings: OpenAIEmbeddings) {
    this.qdrantClient = qdrantClient;
    this.embeddings = embeddings;
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, organizationId, limit = 5, filters = {} } = options;
    
    // 1. Generar embedding de la consulta
    const queryEmbedding = await this.embeddings.embedQuery(query);
    
    // 2. Buscar en la colección de la organización
    const collectionName = `org_${organizationId}`;
    
    try {
      const searchResult = await this.qdrantClient.search(collectionName, {
        vector: queryEmbedding,
        limit,
        filter: {
          must: [
            {
              key: "organizationId",
              match: { value: organizationId }
            },
            ...Object.entries(filters).map(([key, value]) => ({
              key,
              match: { value }
            }))
          ]
        },
        with_payload: true,
        score_threshold: 0.7 // Solo resultados relevantes
      });
      
      // 3. Formatear resultados
      return searchResult.map(result => ({
        content: result.payload?.content as string || '',
        metadata: {
          documentId: result.payload?.documentId,
          fileName: result.payload?.fileName,
          chunkIndex: result.payload?.chunkIndex,
          totalChunks: result.payload?.totalChunks,
          ...result.payload
        },
        score: result.score || 0
      }));
      
    } catch (error: any) {
      // Si la colección no existe, devolver array vacío
      if (error.message?.includes('Not found') || error.status === 404) {
        console.log(`ℹ️  Colección ${collectionName} no existe aún. No hay documentos cargados.`);
        return [];
      }
      console.error('Error en búsqueda Qdrant:', error);
      throw error;
    }
  }

  async answerQuestion(options: AnswerOptions): Promise<{
    answer: string;
    sources: SearchResult[];
    confidence: number;
  }> {
    const { 
      question, 
      organizationId, 
      systemPrompt,
      temperature = 0.7,
      maxTokens = 500
    } = options;
    
    // 1. Buscar contexto relevante
    const searchResults = await this.search({
      query: question,
      organizationId,
      limit: 5
    });
    
    if (searchResults.length === 0) {
      return {
        answer: "Lo siento, no encontré información relevante para responder tu pregunta.",
        sources: [],
        confidence: 0
      };
    }
    
    // 2. Construir contexto
    const context = searchResults
      .map((result, index) => `[${index + 1}] ${result.content}`)
      .join('\n\n');
    
    // 3. Crear prompt
    const promptTemplate = new PromptTemplate({
      template: `Contexto:
{context}

Pregunta: {question}

Instrucciones:
- Responde SOLO basándote en el contexto proporcionado
- Si la información no está en el contexto, indica que no tienes esa información
- Sé preciso y conciso
- Si es relevante, menciona de qué documento proviene la información

Respuesta:`,
      inputVariables: ['context', 'question']
    });
    
    const prompt = await promptTemplate.format({
      context,
      question
    });
    
    // 4. Generar respuesta usando Groq
    const response = await callGroq(
      prompt,
      systemPrompt || 'Eres un asistente útil que responde preguntas basándose en el contexto proporcionado.',
      temperature,
      maxTokens
    );
    
    // 5. Calcular confianza basada en scores
    const avgScore = searchResults.reduce((acc, r) => acc + r.score, 0) / searchResults.length;
    const confidence = Math.min(avgScore * 100, 100);
    
    return {
      answer: response.trim(),
      sources: searchResults,
      confidence
    };
  }

  // Método para búsqueda híbrida (semántica + keywords)
  async hybridSearch(options: SearchOptions & { keywords?: string[] }): Promise<SearchResult[]> {
    const { keywords = [], ...searchOptions } = options;
    
    // Búsqueda semántica normal
    const semanticResults = await this.search(searchOptions);
    
    if (keywords.length === 0) {
      return semanticResults;
    }
    
    // Filtrar por keywords
    const keywordFiltered = semanticResults.filter(result => {
      const content = result.content.toLowerCase();
      return keywords.some(keyword => content.includes(keyword.toLowerCase()));
    });
    
    // Si hay resultados con keywords, priorizarlos
    if (keywordFiltered.length > 0) {
      // Boost score para resultados con keywords
      return keywordFiltered.map(result => ({
        ...result,
        score: result.score * 1.2 // 20% boost
      })).sort((a, b) => b.score - a.score);
    }
    
    return semanticResults;
  }

  // Método para obtener documentos similares
  async findSimilarDocuments(options: {
    documentId: string;
    organizationId: string;
    limit?: number;
  }): Promise<SearchResult[]> {
    const { documentId, organizationId, limit = 5 } = options;
    
    // 1. Obtener un chunk del documento como referencia
    const collectionName = `org_${organizationId}`;
    
    const referenceResult = await this.qdrantClient.scroll(collectionName, {
      filter: {
        must: [
          { key: "documentId", match: { value: documentId } }
        ]
      },
      limit: 1,
      with_vector: true
    });
    
    if (referenceResult.points.length === 0) {
      return [];
    }
    
    const referenceVector = referenceResult.points[0].vector as number[];
    
    // 2. Buscar documentos similares (excluyendo el mismo documento)
    const searchResult = await this.qdrantClient.search(collectionName, {
      vector: referenceVector,
      limit: limit + 10, // Buscar más para filtrar después
      filter: {
        must: [
          { key: "organizationId", match: { value: organizationId } }
        ],
        must_not: [
          { key: "documentId", match: { value: documentId } }
        ]
      },
      with_payload: true
    });
    
    // 3. Agrupar por documento y tomar el mejor score
    const documentScores = new Map<string, SearchResult>();
    
    searchResult.forEach(result => {
      const docId = result.payload?.documentId as string;
      if (!docId) return;
      
      const existing = documentScores.get(docId);
      if (!existing || result.score > existing.score) {
        documentScores.set(docId, {
          content: result.payload?.content as string || '',
          metadata: result.payload as Record<string, any>,
          score: result.score || 0
        });
      }
    });
    
    // 4. Convertir a array y limitar
    return Array.from(documentScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
} 