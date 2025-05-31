<script lang="ts">
  import { onMount } from 'svelte';
  
  // Estado de la aplicación
  let documents: any[] = [];
  let isUploading = false;
  let uploadProgress = 0;
  let searchQuery = '';
  let searchResults: any[] = [];
  let isSearching = false;
  let selectedTab: 'documents' | 'search' = 'documents';
  let dragOver = false;
  
  // Mock data inicial
  onMount(() => {
    // Simular documentos existentes
    documents = [
      {
        id: '1',
        fileName: 'Catálogo de Productos 2024.pdf',
        fileType: 'application/pdf',
        uploadDate: new Date('2024-05-28'),
        size: '2.4 MB',
        status: 'processed',
        chunks: 45
      },
      {
        id: '2',
        fileName: 'Manual de Ventas.docx',
        fileType: 'application/docx',
        uploadDate: new Date('2024-05-27'),
        size: '1.2 MB',
        status: 'processed',
        chunks: 23
      },
      {
        id: '3',
        fileName: 'Precios y Promociones.xlsx',
        fileType: 'application/xlsx',
        uploadDate: new Date('2024-05-25'),
        size: '856 KB',
        status: 'processing',
        chunks: 0
      }
    ];
  });
  
  // Funciones de archivo
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
  }
  
  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFileUpload(input.files[0]);
    }
  }
  
  async function handleFileUpload(file: File) {
    isUploading = true;
    uploadProgress = 0;
    
    // Simular progreso de carga
    const interval = setInterval(() => {
      uploadProgress += 10;
      if (uploadProgress >= 100) {
        clearInterval(interval);
        
        // Agregar documento a la lista
        documents = [{
          id: Date.now().toString(),
          fileName: file.name,
          fileType: file.type,
          uploadDate: new Date(),
          size: formatFileSize(file.size),
          status: 'processing',
          chunks: 0
        }, ...documents];
        
        // Simular procesamiento
        setTimeout(() => {
          documents = documents.map(doc => 
            doc.id === Date.now().toString() 
              ? { ...doc, status: 'processed', chunks: Math.floor(Math.random() * 50) + 10 }
              : doc
          );
        }, 3000);
        
        isUploading = false;
        uploadProgress = 0;
      }
    }, 200);
  }
  
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  function deleteDocument(id: string) {
    if (confirm('¿Estás seguro de eliminar este documento?')) {
      documents = documents.filter(doc => doc.id !== id);
    }
  }
  
  async function performSearch() {
    if (!searchQuery.trim()) return;
    
    isSearching = true;
    
    // Simular búsqueda
    setTimeout(() => {
      searchResults = [
        {
          id: '1',
          document: 'Catálogo de Productos 2024.pdf',
          chunk: 'El producto SuperWidget Pro cuenta con características avanzadas incluyendo procesamiento en tiempo real, interfaz intuitiva y soporte 24/7...',
          score: 0.92
        },
        {
          id: '2',
          document: 'Manual de Ventas.docx',
          chunk: 'Para cerrar una venta efectiva con SuperWidget Pro, enfócate en los beneficios principales: ahorro de tiempo del 40%, incremento en productividad...',
          score: 0.87
        },
        {
          id: '3',
          document: 'Catálogo de Productos 2024.pdf',
          chunk: 'Precio especial de lanzamiento: $299 USD. Incluye licencia anual, actualizaciones gratuitas y acceso a la academia de formación...',
          score: 0.85
        }
      ];
      
      isSearching = false;
    }, 1000);
  }
  
  function getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('doc')) return '📝';
    if (fileType.includes('xls')) return '📊';
    if (fileType.includes('text')) return '📃';
    return '📎';
  }
  
  function getStatusColor(status: string): string {
    switch (status) {
      case 'processed': return 'text-green-600';
      case 'processing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
</script>

<div class="p-4 space-y-6 max-w-4xl mx-auto">
  <!-- Header -->
  <div class="text-center">
    <div class="text-5xl mb-4">🧠</div>
    <h2 class="text-2xl font-bold text-gray-900 mb-2">NeoRAG - Base de Conocimiento</h2>
    <p class="text-gray-600">Entrena a tu agente con documentos y conocimiento específico</p>
  </div>
  
  <!-- Tabs -->
  <div class="flex border-b border-gray-200">
    <button
      on:click={() => selectedTab = 'documents'}
      class="flex-1 py-3 px-4 text-sm font-medium transition-colors"
      class:text-primary-600={selectedTab === 'documents'}
      class:border-b-2={selectedTab === 'documents'}
      class:border-primary-600={selectedTab === 'documents'}
      class:text-gray-500={selectedTab !== 'documents'}
    >
      📚 Documentos
    </button>
    <button
      on:click={() => selectedTab = 'search'}
      class="flex-1 py-3 px-4 text-sm font-medium transition-colors"
      class:text-primary-600={selectedTab === 'search'}
      class:border-b-2={selectedTab === 'search'}
      class:border-primary-600={selectedTab === 'search'}
      class:text-gray-500={selectedTab !== 'search'}
    >
      🔍 Buscar y Probar
    </button>
  </div>
  
  <!-- Tab: Documentos -->
  {#if selectedTab === 'documents'}
    <div class="space-y-6">
      <!-- Zona de carga -->
      <div
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
        class="dashboard-card border-2 border-dashed transition-all duration-200"
        class:border-primary-500={dragOver}
        class:bg-primary-50={dragOver}
        class:border-gray-300={!dragOver}
      >
        <div class="text-center py-8">
          <div class="text-4xl mb-4">{dragOver ? '📥' : '📤'}</div>
          <p class="text-gray-900 font-medium mb-2">
            Arrastra y suelta tus documentos aquí
          </p>
          <p class="text-sm text-gray-600 mb-4">
            o haz clic para seleccionar archivos
          </p>
          <input
            type="file"
            on:change={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.csv,.json,.xls,.xlsx"
            class="hidden"
            id="file-input"
          />
          <label
            for="file-input"
            class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors"
          >
            <span>Seleccionar archivo</span>
          </label>
          <p class="text-xs text-gray-500 mt-4">
            Formatos: PDF, Word, Excel, TXT, CSV, JSON (máx. 10MB)
          </p>
        </div>
      </div>
      
      <!-- Progreso de carga -->
      {#if isUploading}
        <div class="dashboard-card">
          <div class="flex items-center space-x-3 mb-2">
            <div class="animate-spin text-2xl">⏳</div>
            <p class="font-medium text-gray-900">Subiendo documento...</p>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style="width: {uploadProgress}%"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-2">{uploadProgress}% completado</p>
        </div>
      {/if}
      
      <!-- Estadísticas -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="dashboard-card text-center">
          <div class="text-2xl font-bold text-primary-600">{documents.length}</div>
          <div class="text-sm text-gray-600">Documentos</div>
        </div>
        <div class="dashboard-card text-center">
          <div class="text-2xl font-bold text-green-600">
            {documents.filter(d => d.status === 'processed').length}
          </div>
          <div class="text-sm text-gray-600">Procesados</div>
        </div>
        <div class="dashboard-card text-center">
          <div class="text-2xl font-bold text-yellow-600">
            {documents.filter(d => d.status === 'processing').length}
          </div>
          <div class="text-sm text-gray-600">En proceso</div>
        </div>
        <div class="dashboard-card text-center">
          <div class="text-2xl font-bold text-purple-600">
            {documents.reduce((acc, doc) => acc + (doc.chunks || 0), 0)}
          </div>
          <div class="text-sm text-gray-600">Chunks totales</div>
        </div>
      </div>
      
      <!-- Lista de documentos -->
      <div class="dashboard-card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">📁 Documentos subidos</h3>
        
        {#if documents.length === 0}
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-4">🗂️</div>
            <p>No hay documentos aún. ¡Sube tu primer archivo!</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each documents as doc}
              <div class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex items-start space-x-3">
                    <div class="text-2xl">{getFileIcon(doc.fileType)}</div>
                    <div class="flex-1">
                      <h4 class="font-medium text-gray-900">{doc.fileName}</h4>
                      <div class="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span class={getStatusColor(doc.status)}>
                          {doc.status === 'processed' ? '✓ Procesado' : 
                           doc.status === 'processing' ? '⏳ Procesando...' : 
                           '❌ Error'}
                        </span>
                      </div>
                      {#if doc.chunks > 0}
                        <p class="text-xs text-gray-500 mt-1">
                          {doc.chunks} fragmentos indexados
                        </p>
                      {/if}
                    </div>
                  </div>
                  
                  <button
                    on:click={() => deleteDocument(doc.id)}
                    class="text-red-500 hover:text-red-700 p-2 transition-colors"
                    title="Eliminar documento"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  <!-- Tab: Buscar y Probar -->
  {#if selectedTab === 'search'}
    <div class="space-y-6">
      <!-- Barra de búsqueda -->
      <div class="dashboard-card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 Buscar en la base de conocimiento</h3>
        
        <form on:submit|preventDefault={performSearch} class="space-y-4">
          <div class="flex space-x-2">
            <input
              bind:value={searchQuery}
              type="text"
              placeholder="¿Qué quieres buscar?"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {#if isSearching}
                <span class="animate-spin inline-block">⏳</span>
              {:else}
                Buscar
              {/if}
            </button>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <span class="text-sm text-gray-600">Sugerencias:</span>
            <button
              type="button"
              on:click={() => { searchQuery = '¿Cuál es el precio del producto principal?'; performSearch(); }}
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              Precios
            </button>
            <span class="text-gray-400">•</span>
            <button
              type="button"
              on:click={() => { searchQuery = '¿Cómo funciona el proceso de venta?'; performSearch(); }}
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              Proceso de venta
            </button>
            <span class="text-gray-400">•</span>
            <button
              type="button"
              on:click={() => { searchQuery = '¿Qué características tiene el producto?'; performSearch(); }}
              class="text-sm text-primary-600 hover:text-primary-700"
            >
              Características
            </button>
          </div>
        </form>
      </div>
      
      <!-- Resultados de búsqueda -->
      {#if searchResults.length > 0}
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            📋 Resultados encontrados ({searchResults.length})
          </h3>
          
          <div class="space-y-3">
            {#each searchResults as result}
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-primary-600">
                      {result.document}
                    </span>
                    <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {Math.round(result.score * 100)}% relevancia
                    </span>
                  </div>
                </div>
                <p class="text-sm text-gray-700 italic">
                  "{result.chunk}"
                </p>
              </div>
            {/each}
          </div>
          
          <!-- Probar con el agente -->
          <div class="mt-6 p-4 bg-primary-50 rounded-lg">
            <h4 class="font-medium text-primary-900 mb-2">💬 Probar respuesta del agente</h4>
            <p class="text-sm text-primary-800 mb-3">
              Basándome en los documentos, la respuesta a tu pregunta es...
            </p>
            <button class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
              Ver respuesta completa del agente
            </button>
          </div>
        </div>
      {/if}
      
      <!-- Estado vacío -->
      {#if !isSearching && searchQuery && searchResults.length === 0}
        <div class="dashboard-card text-center py-8">
          <div class="text-4xl mb-4">🔍</div>
          <p class="text-gray-600">Realiza una búsqueda para explorar tu base de conocimiento</p>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Tips -->
  <div class="dashboard-card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
    <div class="flex items-start space-x-3">
      <span class="text-2xl">💡</span>
      <div>
        <h3 class="font-semibold mb-2">Tips para mejores resultados</h3>
        <ul class="text-sm space-y-1 opacity-90">
          <li>• Sube documentos claros y bien estructurados</li>
          <li>• Los PDFs y documentos con títulos funcionan mejor</li>
          <li>• Actualiza regularmente tu base de conocimiento</li>
          <li>• Prueba diferentes consultas para validar las respuestas</li>
        </ul>
      </div>
    </div>
  </div>
</div> 