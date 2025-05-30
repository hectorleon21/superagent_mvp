<script lang="ts">
	import '../app.css';
	import BottomNavigation from '$lib/components/layout/BottomNavigation.svelte';
	import FloatingAgent from '$lib/components/layout/FloatingAgent.svelte';
	import { page } from '$app/stores';
	
	// Configuración del agente (esto vendrá de una store o API)
	let selectedAgent = 'Eduardo';
	
	$: currentSection = $page.url.pathname.split('/')[1] || 'dashboard';
	
	// Títulos por sección
	const sectionTitles: Record<string, string> = {
		'pre-venta': 'Pre-Venta',
		'venta': 'Ventas',
		'post-venta': 'Post-Venta',
		'neorag': 'NeoRAG',
		'tablero': 'Tablero',
		'cuenta': 'Mi Cuenta',
		'dashboard': 'Dashboard'
	};
</script>

<!-- Meta tags para PWA -->
<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
	<meta name="theme-color" content="#2563eb" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<title>SuperAgent Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white border-b border-gray-200 safe-area-top">
		<div class="px-4 py-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-xl font-bold text-gray-900">
						{sectionTitles[currentSection] || 'Dashboard'}
					</h1>
					<p class="text-sm text-gray-500">
						Agente: <span class="font-medium text-primary-600">{selectedAgent}</span>
					</p>
				</div>
				
				<!-- Avatar/Menu -->
				<div class="flex items-center space-x-3">
					<!-- Notificaciones -->
					<button class="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5V3h0z"/>
						</svg>
						<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
					</button>
					
					<!-- Avatar -->
					<div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
						<span class="text-white text-sm font-semibold">U</span>
					</div>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Contenido principal -->
	<main class="pb-20">
		<slot />
	</main>
	
	<!-- Navegación inferior -->
	<BottomNavigation />
	
	<!-- Chat flotante del agente -->
	<FloatingAgent agentName={selectedAgent} />
</div>

<style>
	/* Estilos específicos para PWA */
	@media (display-mode: standalone) {
		.safe-area-top {
			padding-top: max(env(safe-area-inset-top), 1rem);
		}
	}
</style>
