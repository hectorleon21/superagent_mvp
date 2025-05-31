// Servicio para conectar con el backend RAG
// Por ahora usa mock data, pero está preparado para conectar con el backend real

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: Date;
  metadata?: any;
  vectorIds?: string[];
  chunks?: number;
  status?: 'processing' | 'processed' | 'error';
}

interface SearchResult {
  document: string;
  chunk: string;
  score: number;
  metadata?: any;
}

class RAGService {
  private token: string | null = null;
  
  // Configurar token de autenticación
  setAuthToken(token: string) {
    this.token = token;
  }
  
  // Headers comunes para las peticiones
  private getHeaders(includeContentType = true): HeadersInit {
    const headers: HeadersInit = {
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...(includeContentType && { 'Content-Type': 'application/json' })
    };
    return headers;
  }
  
  // Subir documento
  async uploadDocument(file: File, metadata?: any): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      const response = await fetch(`${API_BASE_URL}/rag/documents/upload`, {
        method: 'POST',
        headers: {
          ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error al subir documento');
      }
      
      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Error en uploadDocument:', error);
      // Por ahora retornar mock data
      return {
        id: Date.now().toString(),
        fileName: file.name,
        fileType: file.type,
        createdAt: new Date(),
        status: 'processing',
        chunks: 0
      };
    }
  }
  
  // Listar documentos
  async listDocuments(page = 1, limit = 20): Promise<{ documents: Document[], pagination: any }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rag/documents?page=${page}&limit=${limit}`,
        {
          headers: this.getHeaders()
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al listar documentos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en listDocuments:', error);
      // Retornar mock data
      return {
        documents: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }
  }
  
  // Eliminar documento
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rag/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: this.getHeaders()
        }
      );
      
      return response.ok;
    } catch (error) {
      console.error('Error en deleteDocument:', error);
      return false;
    }
  }
  
  // Buscar en documentos
  async search(query: string, limit = 5, filters = {}): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/rag/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ query, limit, filters })
      });
      
      if (!response.ok) {
        throw new Error('Error al buscar');
      }
      
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error en search:', error);
      // Retornar mock data
      return [];
    }
  }
  
  // Obtener respuesta con contexto
  async answerQuestion(question: string, systemPrompt?: string, temperature = 0.7): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/rag/answer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ question, systemPrompt, temperature })
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener respuesta');
      }
      
      const data = await response.json();
      return data.answer;
    } catch (error) {
      console.error('Error en answerQuestion:', error);
      return 'Lo siento, no pude procesar tu pregunta en este momento.';
    }
  }
}

// Exportar instancia única
export const ragService = new RAGService();

// Exportar tipos para uso en componentes
export type { Document, SearchResult }; 