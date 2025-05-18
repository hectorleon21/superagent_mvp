<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>SuperAgent MVP</title>
	<meta name="description" content="Contrata tu asistente virtual personalizado" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
	<h1 class="text-4xl font-bold text-center text-indigo-600 mb-8">Contrata tu Asistente</h1>
	
	<div class="mb-8">
		<h2 class="text-xl flex items-center gap-2 mb-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
			</svg>
			Pon tu Nombre y Número de teléfono
		</h2>
		<p class="text-gray-600 mb-4">El Asistente contratado se comunicará contigo</p>
		
		<div class="space-y-4">
			<input 
				type="text" 
				placeholder="Ingresa tu Nombre" 
				class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
			/>
			
			<div class="flex">
				<div class="flex items-center justify-center bg-gray-100 p-3 border border-gray-300 rounded-l-md">
					<div class="flex items-center gap-1">
						<img src="https://flagcdn.com/ar.svg" alt="Argentina" class="w-6" />
						<span class="text-gray-700">+54</span>
					</div>
				</div>
				<input 
					type="tel" 
					placeholder="Ingresa tu Número" 
					class="flex-1 p-3 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
		</div>
	</div>
	
	<div class="mb-8">
		<h2 class="text-xl mb-6">Elige el Rol</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- Ejecutivo de Ventas -->
			<div class="border border-indigo-200 rounded-lg p-6 bg-blue-50 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow">
				<div class="bg-blue-100 p-4 rounded-full mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold mb-1 text-center">Ejecutivo de Ventas</h3>
				<p class="text-sm text-gray-600 text-center">Experto en ventas y negociación</p>
			</div>
			
			<!-- Soporte Técnico -->
			<div class="border border-green-200 rounded-lg p-6 bg-green-50 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow">
				<div class="bg-green-100 p-4 rounded-full mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold mb-1 text-center">Soporte Técnico</h3>
				<p class="text-sm text-gray-600 text-center">Especialista en resolución de problemas técnicos</p>
			</div>
			
			<!-- Analista Documental -->
			<div class="border border-purple-200 rounded-lg p-6 bg-purple-50 flex flex-col items-center cursor-pointer hover:shadow-lg transition-shadow">
				<div class="bg-purple-100 p-4 rounded-full mb-4">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold mb-1 text-center">Analista Documental</h3>
				<p class="text-sm text-gray-600 text-center">Especialista en gestión y análisis de documentos</p>
			</div>
		</div>
	</div>
	
	<div class="mb-8">
		<h2 class="text-xl mb-6">Selecciona tu Asistente</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Diego -->
			<div class="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
				<div class="flex justify-center bg-gray-50 p-4">
					<img 
						src="https://randomuser.me/api/portraits/men/32.jpg" 
						alt="Diego" 
						class="w-32 h-32 rounded-full object-cover"
					/>
				</div>
				<div class="p-4 text-center">
					<h3 class="text-xl font-semibold mb-1">Diego</h3>
					<p class="text-indigo-600 font-medium">Ventas B2B</p>
					<p class="text-sm text-gray-600">5 años de experiencia</p>
				</div>
			</div>
			
			<!-- Lucia -->
			<div class="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
				<div class="flex justify-center bg-gray-50 p-4">
					<img 
						src="https://randomuser.me/api/portraits/women/44.jpg" 
						alt="Lucia" 
						class="w-32 h-32 rounded-full object-cover"
					/>
				</div>
				<div class="p-4 text-center">
					<h3 class="text-xl font-semibold mb-1">Lucia</h3>
					<p class="text-indigo-600 font-medium">Ventas Consultivas</p>
					<p class="text-sm text-gray-600">4 años de experiencia</p>
				</div>
			</div>
		</div>
	</div>
	
	<button 
		class="w-full py-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
		on:click={() => goto('/chat')}
	>
		Contratar Asistente
	</button>
</div>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		display: block;
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
