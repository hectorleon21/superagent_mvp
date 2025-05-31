<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { ragService } from '$lib/services/ragService';
  
  const dispatch = createEventDispatcher();
  
  export let agentName = 'Eduardo';
  export let isMinimized = true;
  
  let messages: Array<{id: number, text: string, isAgent: boolean, timestamp: Date, attachments?: any[]}> = [
    {
      id: 1,
      text: `¡Hola! Soy ${agentName}, tu agente comercial. ¿En qué puedo ayudarte hoy?`,
      isAgent: true,
      timestamp: new Date()
    }
  ];
  
  let newMessage = '';
  let messageId = 2;
  let isTyping = false;
  let showAttachMenu = false;
  let attachedFile: File | null = null;
  
  function toggleChat() {
    isMinimized = !isMinimized;
  }
  
  async function sendMessage() {
    if (!newMessage.trim() && !attachedFile) return;
    
    // Agregar mensaje del usuario
    const userMsg = {
      id: messageId++,
      text: newMessage,
      isAgent: false,
      timestamp: new Date(),
      attachments: attachedFile ? [{ name: attachedFile.name, type: attachedFile.type }] : []
    };
    
    messages = [...messages, userMsg];
    
    const userMessage = newMessage;
    const hasAttachment = !!attachedFile;
    newMessage = '';
    attachedFile = null;
    showAttachMenu = false;
    
    // Mostrar indicador de escritura
    isTyping = true;
    
    // Simular respuesta del agente
    setTimeout(async () => {
      let agentResponse = '';
      
      if (hasAttachment) {
        agentResponse = `📄 He recibido tu documento. Lo estoy procesando para poder ayudarte con cualquier pregunta relacionada. ¿Qué te gustaría saber sobre este documento?`;
      } else if (userMessage.toLowerCase().includes('documento') || userMessage.toLowerCase().includes('archivo')) {
        agentResponse = '📎 Puedo ayudarte con documentos. Usa el botón de adjuntar (+) para subir un archivo o ve a la sección NeoRAG para gestionar tu base de conocimiento.';
      } else if (userMessage.toLowerCase().includes('embudo') || userMessage.toLowerCase().includes('ventas')) {
        agentResponse = '📊 Te muestro las métricas del embudo. ¿Quieres que te lleve a la sección de Tablero?';
      } else if (userMessage.toLowerCase().includes('lead') || userMessage.toLowerCase().includes('cliente')) {
        agentResponse = '👥 ¿Te ayudo con la gestión de leads? Puedo configurar recordatorios automáticos.';
      } else if (userMessage.toLowerCase().includes('rag') || userMessage.toLowerCase().includes('conocimiento')) {
        agentResponse = '🧠 Perfecto, puedo ayudarte con NeoRAG. ¿Quieres subir documentos o buscar información en tu base de conocimiento?';
      } else {
        // Intentar buscar en RAG si está disponible
        try {
          const searchResults = await ragService.search(userMessage, 3);
          if (searchResults.length > 0) {
            agentResponse = `💡 Basándome en tu base de conocimiento:\n\n${searchResults[0].chunk}\n\n¿Necesitas más información?`;
          } else {
            agentResponse = `Entiendo tu consulta sobre "${userMessage}". ¿Quieres que te ayude con alguna configuración específica o te llevo a la sección correspondiente?`;
          }
        } catch (error) {
          agentResponse = `Entiendo tu consulta sobre "${userMessage}". ¿Quieres que te ayude con alguna configuración específica o te llevo a la sección correspondiente?`;
        }
      }
      
      isTyping = false;
      
      messages = [...messages, {
        id: messageId++,
        text: agentResponse,
        isAgent: true,
        timestamp: new Date()
      }];
    }, 1500);
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      attachedFile = input.files[0];
      showAttachMenu = false;
    }
  }
  
  function removeAttachment() {
    attachedFile = null;
  }
</script>

<!-- Chat minimizado -->
{#if isMinimized}
  <button 
    on:click={toggleChat}
    class="floating-chat hover:bg-primary-700 transition-colors"
    aria-label="Abrir chat con {agentName}"
  >
    <span class="text-xl">💬</span>
  </button>
{/if}

<!-- Chat expandido -->
{#if !isMinimized}
  <div class="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[60vh] flex flex-col">
    <!-- Header del chat -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          <span class="text-white text-sm font-semibold">{agentName[0]}</span>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">{agentName}</h3>
          <p class="text-xs text-gray-500">Tu agente comercial</p>
        </div>
      </div>
      <button 
        on:click={toggleChat}
        class="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Minimizar chat"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
    
    <!-- Mensajes -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
      {#each messages as message (message.id)}
        <div class="animate-slide-in">
          {#if message.isAgent}
            <div class="flex items-start space-x-2">
              <div class="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-white text-xs">{agentName[0]}</span>
              </div>
              <div class="bg-gray-100 rounded-lg px-3 py-2 max-w-[85%]">
                <p class="text-sm text-gray-900 whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          {:else}
            <div class="flex justify-end">
              <div class="bg-primary-600 text-white rounded-lg px-3 py-2 max-w-[85%]">
                <p class="text-sm">{message.text}</p>
                {#if message.attachments && message.attachments.length > 0}
                  <div class="mt-2 pt-2 border-t border-primary-500">
                    {#each message.attachments as attachment}
                      <div class="flex items-center space-x-1 text-xs">
                        <span>📎</span>
                        <span>{attachment.name}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/each}
      
      {#if isTyping}
        <div class="flex items-start space-x-2">
          <div class="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs">{agentName[0]}</span>
          </div>
          <div class="bg-gray-100 rounded-lg px-3 py-2">
            <div class="flex space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Archivo adjunto -->
    {#if attachedFile}
      <div class="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center space-x-2">
            <span>📎</span>
            <span class="text-gray-700 truncate">{attachedFile.name}</span>
          </div>
          <button
            on:click={removeAttachment}
            class="text-gray-500 hover:text-red-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    {/if}
    
    <!-- Input de mensaje -->
    <div class="p-4 border-t border-gray-200">
      <div class="flex space-x-2">
        <!-- Botón adjuntar -->
        <div class="relative">
          <button
            on:click={() => showAttachMenu = !showAttachMenu}
            class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Adjuntar archivo"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
          
          {#if showAttachMenu}
            <div class="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[150px]">
              <input
                type="file"
                on:change={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.csv,.json"
                class="hidden"
                id="chat-file-input"
              />
              <label
                for="chat-file-input"
                class="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer text-sm text-gray-700"
              >
                <span>📄</span>
                <span>Documento</span>
              </label>
            </div>
          {/if}
        </div>
        
        <input
          bind:value={newMessage}
          on:keypress={handleKeyPress}
          placeholder="Escribe tu mensaje..."
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
        <button
          on:click={sendMessage}
          disabled={!newMessage.trim() && !attachedFile}
          class="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Enviar mensaje"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes bounce {
    0%, 60%, 100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-4px);
    }
  }
</style> 