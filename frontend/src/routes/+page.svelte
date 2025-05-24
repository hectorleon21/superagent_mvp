<script lang="ts">
	import { goto } from '$app/navigation';
	import { selectedProfile } from '$lib/profileStore';

	let userName = '';
	let userPhone = '';
	let showWarning = false;

	const countries = [
		{ code: '+51', emoji: '🇵🇪' },
		{ code: '+54', emoji: '🇦🇷' },
		{ code: '+57', emoji: '🇨🇴' },
		{ code: '+56', emoji: '🇨🇱' },
		{ code: '+593', emoji: '🇪🇨' },
		{ code: '+598', emoji: '🇺🇾' },
		{ code: '+591', emoji: '🇧🇴' },
	];
	let selectedCountry = countries[0];

	const profiles = [
		{
			name: 'Edu',
			img: 'https://randomuser.me/api/portraits/men/75.jpg',
			desc: 'Edu es capaz de vender tus productos. Aprende la información de tu empresa. Se integra por Whatsapp, Instagram, Web y Facebook.'
		},
		{
			name: 'Eli',
			img: 'https://randomuser.me/api/portraits/women/65.jpg',
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
		<div class="space-y-4">
			<input 
				type="text" 
				placeholder="Ingresa tu Nombre" 
				bind:value={userName}
				class="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
			/>
			<div class="flex items-center">
				<select bind:value={selectedCountry} class="flex items-center bg-gray-100 p-3 border border-gray-300 rounded-l-md focus:outline-none" style="width: 110px;">
					{#each countries as country}
						<option value={country}>{country.emoji} {country.code}</option>
					{/each}
				</select>
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
		<h2 class="text-xl mb-6 text-center">Selecciona tu Perfil</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each profiles as profile}
				<div class="flex items-center border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow p-4 {(!userName.trim() || !userPhone.trim()) ? 'opacity-50 pointer-events-none' : ''}" on:click={() => selectProfile(profile)}>
					<img src={profile.img} alt={profile.name} class="w-20 h-20 rounded-full object-cover mr-4" />
					<div>
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
