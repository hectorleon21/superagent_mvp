<script lang="ts">
  import { goto } from '$app/navigation';
  
  // Agentes disponibles
  const agents = [
    {
      id: 'eduardo',
      name: 'Eduardo',
      description: 'Especialista en ventas B2B',
      personality: 'Profesional y persuasivo',
      avatar: '👨‍💼',
      color: 'bg-blue-500'
    },
    {
      id: 'eli',
      name: 'Eli', 
      description: 'Experta en atención al cliente',
      personality: 'Amigable y empática',
      avatar: '👩‍💼',
      color: 'bg-purple-500'
    }
  ];
  
  let selectedAgent = 'eduardo';
  
  // Sugerencias de comandos rápidos
  const quickCommands = [
    {
      icon: '📊',
      title: 'Ver embudo de ventas',
      description: 'Mostrar métricas y conversiones de hoy',
      action: () => goto('/tablero')
    },
    {
      icon: '👥',
      title: 'Gestionar leads',
      description: 'Revisar y contactar prospectos',
      action: () => goto('/pre-venta')
    },
    {
      icon: '💰',
      title: 'Cerrar ventas pendientes',
      description: 'Propuestas en proceso de cierre',
      action: () => goto('/venta')
    },
    {
      icon: '✅',
      title: 'Seguimiento post-venta',
      description: 'Clientes recientes y satisfacción',
      action: () => goto('/post-venta')
    },
    {
      icon: '🧠',
      title: 'Configurar NeoRAG',
      description: 'Actualizar conocimiento del agente',
      action: () => goto('/neorag')
    },
    {
      icon: '⚙️',
      title: 'Configurar cuenta',
      description: 'Ajustes y preferencias',
      action: () => goto('/cuenta')
    }
  ];
  
  // Métricas rápidas
  const quickStats = [
    { label: 'Leads hoy', value: '12', change: '+3', trend: 'up' },
    { label: 'Conversiones', value: '4', change: '+1', trend: 'up' },
    { label: 'Tasa cierre', value: '33%', change: '+5%', trend: 'up' },
    { label: 'Ingresos', value: '$2.4k', change: '+$800', trend: 'up' }
  ];
  
  function selectAgent(agentId: string) {
    selectedAgent = agentId;
    // Aquí guardaríamos la selección del agente
  }
</script>

<div class="p-4 space-y-6">
  <!-- Bienvenida -->
  <div class="text-center py-6">
    <h2 class="text-2xl font-bold text-gray-900 mb-2">
      ¡Bienvenido a SuperAgent!
    </h2>
    <p class="text-gray-600">
      Elige tu agente comercial y comienza a optimizar tus ventas
    </p>
  </div>
  
  <!-- Selección de Agente -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">
      🤖 Selecciona tu Agente
    </h3>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {#each agents as agent}
        <button
          on:click={() => selectAgent(agent.id)}
          class="relative p-4 border-2 rounded-xl transition-all duration-200 text-left"
          class:border-primary-500={selectedAgent === agent.id}
          class:bg-primary-50={selectedAgent === agent.id}
          class:border-gray-200={selectedAgent !== agent.id}
          class:hover:border-gray-300={selectedAgent !== agent.id}
        >
          {#if selectedAgent === agent.id}
            <div class="absolute top-2 right-2">
              <div class="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          {/if}
          
          <div class="flex items-center space-x-3 mb-2">
            <div class="{agent.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl">
              {agent.avatar}
            </div>
            <div>
              <h4 class="font-semibold text-gray-900">{agent.name}</h4>
              <p class="text-sm text-gray-600">{agent.description}</p>
            </div>
          </div>
          
          <p class="text-xs text-gray-500 italic">
            Personalidad: {agent.personality}
          </p>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Métricas Rápidas -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">
      📈 Resumen de Hoy
    </h3>
    
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {#each quickStats as stat}
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div class="text-sm text-gray-600">{stat.label}</div>
          <div class="text-xs text-success-600 flex items-center justify-center mt-1">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
            </svg>
            {stat.change}
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Comandos Rápidos -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">
      ⚡ Acciones Rápidas
    </h3>
    
    <div class="grid grid-cols-1 gap-3">
      {#each quickCommands as command}
        <button
          on:click={command.action}
          class="flex items-center space-x-4 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
        >
          <div class="text-2xl">{command.icon}</div>
          <div class="flex-1 text-left">
            <h4 class="font-medium text-gray-900">{command.title}</h4>
            <p class="text-sm text-gray-600">{command.description}</p>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Sugerencias del Agente -->
  <div class="dashboard-card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
    <div class="flex items-start space-x-3">
      <div class="bg-white bg-opacity-20 rounded-full p-2 flex-shrink-0">
        <span class="text-lg">{agents.find(a => a.id === selectedAgent)?.avatar}</span>
      </div>
      <div class="flex-1">
        <h3 class="font-semibold mb-2">
          Sugerencia de {agents.find(a => a.id === selectedAgent)?.name}
        </h3>
        <p class="text-sm opacity-90">
          "Veo que tienes 3 leads nuevos hoy. ¿Te ayudo a configurar recordatorios automáticos para hacer seguimiento en 24 horas?"
        </p>
        <button class="mt-3 px-4 py-2 bg-white bg-opacity-20 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-colors">
          Sí, configurar
        </button>
      </div>
    </div>
  </div>
</div>
