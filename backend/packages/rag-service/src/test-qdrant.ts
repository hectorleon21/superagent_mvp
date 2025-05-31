import { QdrantClient } from '@qdrant/qdrant-js';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el backend
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function testQdrant() {
  console.log('🔍 Probando conexión con Qdrant Cloud...\n');
  
  const qdrantUrl = process.env.QDRANT_URL;
  const qdrantApiKey = process.env.QDRANT_API_KEY;
  
  console.log('URL:', qdrantUrl);
  console.log('API Key:', qdrantApiKey ? '✓ Configurada' : '✗ No encontrada');
  
  try {
    const client = new QdrantClient({
      url: qdrantUrl,
      apiKey: qdrantApiKey,
    });
    
    // Probar conexión
    console.log('\n📡 Conectando a Qdrant Cloud...');
    const collections = await client.getCollections();
    console.log('✅ Conexión exitosa!');
    console.log(`📚 Colecciones existentes: ${collections.collections.length}`);
    
    if (collections.collections.length > 0) {
      console.log('Colecciones:');
      collections.collections.forEach(col => {
        console.log(`  - ${col.name}`);
      });
    }
    
    // Crear una colección de prueba
    const testCollectionName = 'test_superagent';
    console.log(`\n🔨 Creando colección de prueba: ${testCollectionName}`);
    
    try {
      await client.createCollection(testCollectionName, {
        vectors: {
          size: 1536, // Dimensión de OpenAI embeddings
          distance: 'Cosine'
        }
      });
      console.log('✅ Colección creada exitosamente!');
      
      // Limpiar - eliminar colección de prueba
      console.log('\n🧹 Limpiando colección de prueba...');
      await client.deleteCollection(testCollectionName);
      console.log('✅ Colección eliminada');
      
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        console.log('ℹ️  La colección ya existe');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 ¡Todo funciona correctamente! Qdrant Cloud está listo para usar.');
    
  } catch (error) {
    console.error('\n❌ Error al conectar con Qdrant:', error);
    console.error('\nVerifica que:');
    console.error('1. La URL y API Key sean correctas');
    console.error('2. El cluster esté activo en Qdrant Cloud');
  }
}

// Ejecutar test
testQdrant(); 