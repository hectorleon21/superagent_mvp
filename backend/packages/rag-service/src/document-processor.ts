import { QdrantClient } from '@qdrant/qdrant-js';
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { Document } from "langchain/document";
import { v4 as uuidv4 } from 'uuid';
import { unlink } from 'fs/promises';

interface ProcessDocumentOptions {
  documentId: string;
  organizationId: string;
  file: File;
  metadata?: Record<string, any>;
}

interface ProcessResult {
  vectorIds: string[];
  extractedText?: string;
  chunks: number;
}

export class DocumentProcessor {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // Configurar text splitter con valores por defecto
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  // Procesar archivo y extraer texto
  async processFile(file: File): Promise<string> {
    const text = await file.text();
    const fileType = file.type.toLowerCase();
    
    // Por ahora solo procesamos archivos de texto
    // TODO: Agregar soporte para PDF, DOCX, etc.
    if (fileType.includes('text') || fileType.includes('json') || fileType.includes('csv')) {
      return text;
    }
    
    throw new Error(`Tipo de archivo no soportado: ${file.type}`);
  }

  // Crear chunks de texto
  async createChunks(text: string): Promise<string[]> {
    return await this.textSplitter.splitText(text);
  }

  // Método principal para procesar documento (usado por index.ts)
  async processDocument(
    options: ProcessDocumentOptions,
    qdrantClient: QdrantClient,
    embeddings: OpenAIEmbeddings
  ): Promise<{
    vectorIds: string[];
    extractedText: string;
  }> {
    const { documentId, organizationId, file, metadata = {} } = options;
    
    // 1. Extraer texto del archivo
    const extractedText = await this.processFile(file);
    
    // 2. Dividir en chunks
    const chunks = await this.textSplitter.splitText(extractedText);
    
    // 3. Crear nombre de colección
    const collectionName = `org_${organizationId}`;
    
    // 4. Verificar que la colección existe
    await this.ensureCollection(qdrantClient, collectionName);
    
    // 5. Generar embeddings y crear puntos
    const vectorIds: string[] = [];
    const points = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const vectorId = uuidv4();
      vectorIds.push(vectorId);
      
      const embedding = await embeddings.embedQuery(chunks[i]);
      
      points.push({
        id: vectorId,
        vector: embedding,
        payload: {
          content: chunks[i],
          documentId,
          organizationId,
          fileName: file.name,
          fileType: file.type,
          chunkIndex: i,
          totalChunks: chunks.length,
          ...metadata
        }
      });
    }
    
    // 6. Insertar en Qdrant
    await qdrantClient.upsert(collectionName, {
      wait: true,
      points
    });
    
    return {
      vectorIds,
      extractedText
    };
  }

  private async ensureCollection(qdrantClient: QdrantClient, collectionName: string) {
    try {
      const collections = await qdrantClient.getCollections();
      const exists = collections.collections.some(c => c.name === collectionName);
      
      if (!exists) {
        await qdrantClient.createCollection(collectionName, {
          vectors: {
            size: 1536, // Dimensión para text-embedding-3-small
            distance: 'Cosine'
          }
        });
      }
    } catch (error) {
      console.error('Error ensuring collection:', error);
      throw error;
    }
  }

  // Método helper para detectar tipo de archivo
  detectFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type.toLowerCase();
    
    if (extension === 'pdf' || mimeType.includes('pdf')) return 'pdf';
    if (extension === 'docx' || mimeType.includes('wordprocessingml')) return 'docx';
    if (extension === 'txt' || mimeType.includes('text/plain')) return 'txt';
    if (extension === 'csv' || mimeType.includes('csv')) return 'csv';
    if (extension === 'json' || mimeType.includes('json')) return 'json';
    
    return 'unknown';
  }
} 