<script lang="ts">
  // Mock data para leads
  const leads = [
    {
      id: 1,
      name: 'María García',
      company: 'TechCorp',
      email: 'maria@techcorp.com',
      phone: '+1234567890',
      status: 'nuevo',
      source: 'Website',
      lastContact: '2024-05-30',
      score: 85
    },
    {
      id: 2,
      name: 'Carlos López',
      company: 'StartupXYZ',
      email: 'carlos@startupxyz.com',
      phone: '+1234567891',
      status: 'contactado',
      source: 'LinkedIn',
      lastContact: '2024-05-29',
      score: 72
    },
    {
      id: 3,
      name: 'Ana Martínez',
      company: 'InnovateLab',
      email: 'ana@innovatelab.com',
      phone: '+1234567892',
      status: 'calificado',
      source: 'Referido',
      lastContact: '2024-05-28',
      score: 91
    }
  ];
  
  const statusColors: Record<string, string> = {
    'nuevo': 'bg-blue-100 text-blue-800',
    'contactado': 'bg-yellow-100 text-yellow-800',
    'calificado': 'bg-green-100 text-green-800',
    'descartado': 'bg-red-100 text-red-800'
  };
  
  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
</script>

<div class="p-4 space-y-6">
  <!-- Header con estadísticas -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="dashboard-card text-center">
      <div class="text-2xl font-bold text-primary-600">12</div>
      <div class="text-sm text-gray-600">Leads Nuevos</div>
    </div>
    <div class="dashboard-card text-center">
      <div class="text-2xl font-bold text-yellow-600">8</div>
      <div class="text-sm text-gray-600">En Seguimiento</div>
    </div>
    <div class="dashboard-card text-center">
      <div class="text-2xl font-bold text-green-600">5</div>
      <div class="text-sm text-gray-600">Calificados</div>
    </div>
    <div class="dashboard-card text-center">
      <div class="text-2xl font-bold text-gray-600">78%</div>
      <div class="text-sm text-gray-600">Tasa Respuesta</div>
    </div>
  </div>
  
  <!-- Acciones rápidas -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">🚀 Acciones Rápidas</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button class="flex items-center justify-center space-x-2 p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        <span>📧</span>
        <span>Enviar email masivo</span>
      </button>
      <button class="flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        <span>☎️</span>
        <span>Programar llamadas</span>
      </button>
      <button class="flex items-center justify-center space-x-2 p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
        <span>📋</span>
        <span>Crear secuencia</span>
      </button>
      <button class="flex items-center justify-center space-x-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        <span>📊</span>
        <span>Analizar fuentes</span>
      </button>
    </div>
  </div>
  
  <!-- Lista de leads -->
  <div class="dashboard-card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">📋 Leads Recientes</h3>
      <button class="text-primary-600 hover:text-primary-700 text-sm font-medium">
        Ver todos
      </button>
    </div>
    
    <div class="space-y-3">
      {#each leads as lead}
        <div class="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold text-gray-900">{lead.name}</h4>
            <span class="px-2 py-1 rounded-full text-xs font-medium {statusColors[lead.status]}">
              {lead.status}
            </span>
          </div>
          
          <div class="text-sm text-gray-600 mb-2">
            <p class="font-medium">{lead.company}</p>
            <p>{lead.email}</p>
          </div>
          
          <div class="flex items-center justify-between text-xs text-gray-500">
            <span>Fuente: {lead.source}</span>
            <span>Último contacto: {lead.lastContact}</span>
            <span class="font-semibold {getScoreColor(lead.score)}">
              Score: {lead.score}
            </span>
          </div>
          
          <div class="flex space-x-2 mt-3">
            <button class="flex-1 px-3 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors">
              Contactar
            </button>
            <button class="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors">
              Calificar
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Sugerencias del agente -->
  <div class="dashboard-card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
    <div class="flex items-start space-x-3">
      <span class="text-2xl">🤖</span>
      <div>
        <h3 class="font-semibold mb-2">Sugerencia de Eduardo</h3>
        <p class="text-sm opacity-90 mb-3">
          "Veo que María García de TechCorp tiene un score alto (85) y no ha sido contactada. ¿Quieres que la llame o prefieres enviar un email personalizado?"
        </p>
        <div class="flex space-x-2">
          <button class="px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 transition-colors">
            Llamar ahora
          </button>
          <button class="px-3 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 transition-colors">
            Enviar email
          </button>
        </div>
      </div>
    </div>
  </div>
</div> 