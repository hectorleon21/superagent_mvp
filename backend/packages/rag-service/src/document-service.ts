import { QdrantClient } from '@qdrant/qdrant-js';
import { OpenAIEmbeddings } from "@langchain/openai";
import { PrismaClient } from '@prisma/client';
import { DocumentProcessor } from './document-processor';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class DocumentService {
  private qdrantClient: QdrantClient;
  private embeddings: OpenAIEmbeddings;
  private processor: DocumentProcessor;

  constructor(qdrantClient: QdrantClient, embeddings: OpenAIEmbeddings) {
    this.qdrantClient = qdrantClient;
    this.embeddings = embeddings;
    this.processor = new DocumentProcessor();
  }

  async uploadDocument(
    file: File,
    organizationId: string,
    userId?: string,
    metadata: Record<string, any> = {}
  ) {
    // 1. Procesar el archivo
    const content = await this.processor.processFile(file);
    
    // 2. Crear registro en DB
    const document = await prisma.document.create({
      data: {
        organizationId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        metadata,
        uploadedBy: userId,
        status: 'processing'
      }
    });
    
    try {
      // 3. Crear chunks y embeddings
      const chunks = await this.processor.createChunks(content);
      const collectionName = `org_${organizationId}`;
      
      // Verificar/crear colección
      await this.ensureCollection(collectionName);
      
      // 4. Generar embeddings y almacenar
      const points = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await this.embeddings.embedQuery(chunks[i]);
        
        points.push({
          id: uuidv4(),
          vector: embedding,
          payload: {
            content: chunks[i],
            documentId: document.id,
            organizationId,
            fileName: file.name,
            chunkIndex: i,
            totalChunks: chunks.length,
            ...metadata
          }
        });
      }
      
      // 5. Insertar en Qdrant
      await this.qdrantClient.upsert(collectionName, {
        wait: true,
        points
      });
      
      // 6. Actualizar estado
      await prisma.document.update({
        where: { id: document.id },
        data: { 
          status: 'completed',
          chunks: chunks.length
        }
      });
      
      return document;
      
    } catch (error) {
      // En caso de error, marcar como fallido
      await prisma.document.update({
        where: { id: document.id },
        data: { 
          status: 'failed',
          error: (error as Error).message
        }
      });
      throw error;
    }
  }

  async deleteDocument(documentId: string, organizationId: string) {
    const collectionName = `org_${organizationId}`;
    
    // 1. Eliminar de Qdrant
    try {
      await this.qdrantClient.delete(collectionName, {
        filter: {
          must: [
            {
              key: "documentId",
              match: { value: documentId }
            }
          ]
        }
      });
    } catch (error) {
      console.error('Error deleting from Qdrant:', error);
    }
    
    // 2. Eliminar de DB
    await prisma.document.delete({
      where: { id: documentId }
    });
  }

  private async ensureCollection(collectionName: string) {
    try {
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(c => c.name === collectionName);
      
      if (!exists) {
        await this.qdrantClient.createCollection(collectionName, {
          vectors: {
            size: 1536, // text-embedding-3-small dimension
            distance: 'Cosine'
          }
        });
      }
    } catch (error) {
      console.error('Error ensuring collection:', error);
      throw error;
    }
  }
} 