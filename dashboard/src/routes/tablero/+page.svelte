<script lang="ts">
  // Mock data para el embudo de ventas
  const funnelData = [
    { stage: 'Leads', count: 100, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Contactados', count: 75, percentage: 75, color: 'bg-yellow-500' },
    { stage: 'Calificados', count: 50, percentage: 50, color: 'bg-orange-500' },
    { stage: 'Propuestas', count: 25, percentage: 25, color: 'bg-red-500' },
    { stage: 'Cerrados', count: 12, percentage: 12, color: 'bg-green-500' }
  ];
  
  // Mock data para métricas del día
  const todayMetrics = [
    { label: 'Ingresos', value: '$4,250', change: '+12%', trend: 'up' },
    { label: 'Conversiones', value: '8', change: '+3', trend: 'up' },
    { label: 'Tasa de Cierre', value: '24%', change: '+2%', trend: 'up' },
    { label: 'Ticket Promedio', value: '$531', change: '-5%', trend: 'down' }
  ];
  
  // Mock data para actividad reciente
  const recentActivity = [
    { time: '10:30', action: 'Venta cerrada', client: 'TechCorp', amount: '$1,200' },
    { time: '09:15', action: 'Propuesta enviada', client: 'StartupXYZ', amount: '$890' },
    { time: '08:45', action: 'Lead calificado', client: 'InnovateLab', amount: '-' },
    { time: '08:30', action: 'Llamada programada', client: 'BuildCorp', amount: '-' }
  ];
</script>

<div class="p-4 space-y-6">
  <!-- Métricas principales -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    {#each todayMetrics as metric}
      <div class="dashboard-card text-center">
        <div class="text-2xl font-bold text-gray-900">{metric.value}</div>
        <div class="text-sm text-gray-600 mb-1">{metric.label}</div>
        <div class="text-xs flex items-center justify-center"
             class:text-green-600={metric.trend === 'up'}
             class:text-red-600={metric.trend === 'down'}>
          {#if metric.trend === 'up'}
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
            </svg>
          {:else}
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V7"></path>
            </svg>
          {/if}
          {metric.change}
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Embudo de ventas -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-6">📊 Embudo de Ventas</h3>
    
    <div class="space-y-4">
      {#each funnelData as stage, index}
        <div class="relative">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">{stage.stage}</span>
            <span class="text-sm text-gray-600">{stage.count} ({stage.percentage}%)</span>
          </div>
          
          <div class="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
            <div 
              class="{stage.color} h-full transition-all duration-500 ease-out"
              style="width: {stage.percentage}%"
            ></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-white text-sm font-medium">{stage.count}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
    
    <div class="mt-6 p-4 bg-blue-50 rounded-lg">
      <h4 class="font-semibold text-blue-900 mb-2">💡 Insight del Agente</h4>
      <p class="text-blue-800 text-sm">
        Tu tasa de conversión de Calificados a Propuestas es del 50%, ¡está por encima del promedio! 
        Enfócate en mejorar el cierre: solo el 48% de las propuestas se convierten en ventas.
      </p>
    </div>
  </div>
  
  <!-- Actividad reciente -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">🕐 Actividad Reciente</h3>
    
    <div class="space-y-3">
      {#each recentActivity as activity}
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="text-xs text-gray-500 font-mono">{activity.time}</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{activity.action}</p>
              <p class="text-xs text-gray-600">{activity.client}</p>
            </div>
          </div>
          {#if activity.amount !== '-'}
            <div class="text-sm font-semibold text-green-600">{activity.amount}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Gráfico simulado -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">📈 Ventas de los últimos 7 días</h3>
    
    <div class="h-32 flex items-end justify-between space-x-2">
      {#each [20, 35, 25, 45, 30, 55, 40] as height, index}
        <div class="flex-1 bg-primary-500 rounded-t" style="height: {height * 2}px">
          <div class="text-xs text-white text-center pt-1">${height * 10}</div>
        </div>
      {/each}
    </div>
    
    <div class="flex justify-between text-xs text-gray-500 mt-2">
      <span>Lun</span>
      <span>Mar</span>
      <span>Mié</span>
      <span>Jue</span>
      <span>Vie</span>
      <span>Sáb</span>
      <span>Dom</span>
    </div>
  </div>
  
  <!-- Acciones rápidas -->
  <div class="dashboard-card">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
    
    <div class="grid grid-cols-2 gap-3">
      <button class="flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        <span>📊</span>
        <span>Exportar reporte</span>
      </button>
      <button class="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <span>🎯</span>
        <span>Ver metas</span>
      </button>
      <button class="flex items-center justify-center space-x-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        <span>📧</span>
        <span>Reporte email</span>
      </button>
      <button class="flex items-center justify-center space-x-2 p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
        <span>⚙️</span>
        <span>Configurar KPIs</span>
      </button>
    </div>
  </div>
</div> 