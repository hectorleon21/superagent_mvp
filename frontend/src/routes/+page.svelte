<script lang="ts">
	import { goto } from '$app/navigation';
	import { selectedProfile } from '$lib/profileStore';

	let userName = '';
	let userPhone = '';
	let showWarning = false;

	const countries = [
		{ code: '+51', name: 'Perú', flag: 'https://flagcdn.com/pe.svg' },
		{ code: '+54', name: 'Argentina', flag: 'https://flagcdn.com/ar.svg' },
		{ code: '+57', name: 'Colombia', flag: 'https://flagcdn.com/co.svg' },
		{ code: '+56', name: 'Chile', flag: 'https://flagcdn.com/cl.svg' },
		{ code: '+593', name: 'Ecuador', flag: 'https://flagcdn.com/ec.svg' },
		{ code: '+598', name: 'Uruguay', flag: 'https://flagcdn.com/uy.svg' },
		{ code: '+591', name: 'Bolivia', flag: 'https://flagcdn.com/bo.svg' },
	];
	let selectedCountry = countries[0];

	const profiles = [
		{
			name: 'Edu',
			img: 'https://randomuser.me/api/portraits/men/75.jpg', // mestizo latino
			desc: 'Edu es capaz de vender tus productos. Aprende la información de tu empresa. Se integra por Whatsapp, Instagram, Web y Facebook.'
		},
		{
			name: 'Eli',
			img: 'https://randomuser.me/api/portraits/women/65.jpg', // rubia latina
			desc: 'Hace lo mismo que Edu y además: Analiza tu competencia y te define una estrategia de ventas personalizada. Genera contenido en Instagram, Facebook. Crea tu pagina web.'
		}
	];

	function selectProfile(profile) {
		if (!userName.trim() || !userPhone.trim()) {
			showWarning = true;
			return;
		}
		selectedProfile.set({ name: userName, phone: selectedCountry.code + userPhone, profile });
		goto('/chat');
	}
</script>

<svelte:head>
	<title>SuperAgent MVP</title>
	<meta name="description" content="Contrata tu agente de ventas personalizado" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
	<h1 class="text-4xl font-bold text-center text-indigo-600 mb-8">Contrata tu Agente de Ventas</h1>

	<div class="mb-8">
		<h2 class="text-xl flex items-center gap-2 mb-2">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
			</svg>
			Pon tu Nombre y Número de teléfono
		</h2>
		<p class="text-gray-600 mb-4">El Agente contratado se comunicará contigo</p>
		<div class="space-y-4">
			<input 
				type="text" 
				placeholder="Ingresa tu Nombre" 
				bind:value={userName}
				class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
			/>
			<div class="flex">
				<div class="flex items-center bg-gray-100 p-3 border border-gray-300 rounded-l-md">
					<select bind:value={selectedCountry} class="bg-transparent outline-none border-none pr-2">
						{#each countries as country}
							<option value={country}>{country.name}</option>
						{/each}
					</select>
					<img src={selectedCountry.flag} alt={selectedCountry.name} class="w-6 ml-2" />
					<span class="text-gray-700 ml-2">{selectedCountry.code}</span>
				</div>
				<input 
					type="tel" 
					placeholder="Ingresa tu Número" 
					bind:value={userPhone}
					class="flex-1 p-3 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
				/>
			</div>
		</div>
		{#if showWarning}
			<p class="text-red-600 mt-2">Por favor, completa tu nombre y número antes de continuar.</p>
		{/if}
	</div>

	<div class="mb-8">
		<h2 class="text-xl mb-6">Selecciona tu Perfil</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each profiles as profile}
				<div class="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow {(!userName.trim() || !userPhone.trim()) ? 'opacity-50 pointer-events-none' : ''}" on:click={() => selectProfile(profile)}>
					<div class="flex justify-center bg-gray-50 p-4">
						<img src={profile.img} alt={profile.name} class="w-32 h-32 rounded-full object-cover" />
					</div>
					<div class="p-4 text-center">
						<h3 class="text-xl font-semibold mb-1">{profile.name}</h3>
						<p class="text-sm text-gray-600">{profile.desc}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
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
