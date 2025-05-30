<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  export let agentName = 'Eduardo';
  export let isMinimized = true;
  
  let messages: Array<{id: number, text: string, isAgent: boolean, timestamp: Date}> = [
    {
      id: 1,
      text: `¡Hola! Soy ${agentName}, tu agente comercial. ¿En qué puedo ayudarte hoy?`,
      isAgent: true,
      timestamp: new Date()
    }
  ];
  
  let newMessage = '';
  let messageId = 2;
  
  function toggleChat() {
    isMinimized = !isMinimized;
  }
  
  function sendMessage() {
    if (!newMessage.trim()) return;
    
    // Agregar mensaje del usuario
    messages = [...messages, {
      id: messageId++,
      text: newMessage,
      isAgent: false,
      timestamp: new Date()
    }];
    
    const userMessage = newMessage;
    newMessage = '';
    
    // Simular respuesta del agente
    setTimeout(() => {
      let agentResponse = '';
      
      if (userMessage.toLowerCase().includes('embudo') || userMessage.toLowerCase().includes('ventas')) {
        agentResponse = '📊 Te muestro las métricas del embudo. ¿Quieres que te lleve a la sección de Tablero?';
      } else if (userMessage.toLowerCase().includes('lead') || userMessage.toLowerCase().includes('cliente')) {
        agentResponse = '👥 ¿Te ayudo con la gestión de leads? Puedo configurar recordatorios automáticos.';
      } else if (userMessage.toLowerCase().includes('documento') || userMessage.toLowerCase().includes('rag')) {
        agentResponse = '🧠 Perfecto, puedo ayudarte con NeoRAG. ¿Quieres subir documentos o configurar el conocimiento?';
      } else {
        agentResponse = `Entiendo tu consulta sobre "${userMessage}". ¿Quieres que te ayude con alguna configuración específica o te llevo a la sección correspondiente?`;
      }
      
      messages = [...messages, {
        id: messageId++,
        text: agentResponse,
        isAgent: true,
        timestamp: new Date()
      }];
    }, 1000);
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
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
                <p class="text-sm text-gray-900">{message.text}</p>
              </div>
            </div>
          {:else}
            <div class="flex justify-end">
              <div class="bg-primary-600 text-white rounded-lg px-3 py-2 max-w-[85%]">
                <p class="text-sm">{message.text}</p>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    <!-- Input de mensaje -->
    <div class="p-4 border-t border-gray-200">
      <div class="flex space-x-2">
        <input
          bind:value={newMessage}
          on:keypress={handleKeyPress}
          placeholder="Escribe tu mensaje..."
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />
        <button
          on:click={sendMessage}
          disabled={!newMessage.trim()}
          class="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if} 