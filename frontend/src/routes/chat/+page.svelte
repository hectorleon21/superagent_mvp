<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { apiClient, wsClient, type ChatMessage, type StreamCallbacks } from '$lib/api';
	import { browser } from '$app/environment';
	
	let messages: ChatMessage[] = [];
	let messageInput = '';
	let imageFile: File | null = null;
	let imagePreviewUrl = '';
	let chatContainer: HTMLElement;
	let isConnecting = false;
	let chatMethod: 'rest' | 'websocket' | 'stream' = 'stream'; // Método por defecto: streaming
	let isResponding = false;
	let currentResponseId = '';
	let userScrolledUp = false;
	
	// ID de usuario único para mantener memoria contextual
	let userId = '';
	
	// Añadir nueva variable para controlar el estado de "escribiendo"
	let isTyping = false;
	let typingName = 'Diego';
	
	let showA2HS = false;
	let deferredPrompt: any = null;
	
	// Detectar móvil
	function isMobile() {
		return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
	}
	
	// Generar o recuperar ID de usuario
	function getUserId(): string {
		if (browser) {
			// Intentar obtener un ID existente
			let id = localStorage.getItem('superagent_user_id');
			
			// Si no existe, crear uno nuevo
			if (!id) {
				id = 'user_' + Math.random().toString(36).substring(2, 15);
				localStorage.setItem('superagent_user_id', id);
			}
			
			return id;
		}
		
		return 'default_user';
	}
	
	// Manejar selección de imagen
	function handleImageSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) {
			imageFile = null;
			imagePreviewUrl = '';
			return;
		}
		
		imageFile = target.files[0];
		
		// Crear URL para previsualización
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
		}
		imagePreviewUrl = URL.createObjectURL(imageFile);
	}
	
	// Quitar imagen seleccionada
	function removeImage() {
		imageFile = null;
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
			imagePreviewUrl = '';
		}
	}
	
	// Convertir imagen a base64
	async function imageToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}
	
	// Detectar scroll manual del usuario
	function handleScroll() {
		if (!chatContainer) return;
		
		// Si el usuario está cerca del final, no consideramos que hizo scroll up
		const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
		
		if (!isNearBottom && !isResponding) {
			userScrolledUp = true;
		} else if (isNearBottom) {
			userScrolledUp = false;
		}
	}
	
	// Scroll al final solo si el usuario no ha hecho scroll up
	function scrollToBottom() {
		if (chatContainer && !userScrolledUp) {
			setTimeout(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 100);
		}
	}
	
	// Enviar mensaje usando streaming
	async function sendMessageStream() {
		if (!messageInput.trim() && !imageFile) return;
		
		let imageUrl = '';
		
		// Si hay imagen, obtener URL
		if (imageFile) {
			imageUrl = await imageToBase64(imageFile);
		}
		
		// Agregar mensaje del usuario
		const userMessage: ChatMessage = {
			text: messageInput,
			isUser: true,
			timestamp: new Date(),
			imageUrl: imagePreviewUrl || undefined
		};
		
		messages = [...messages, userMessage];
		
		const userQuestion = messageInput;
		messageInput = '';
		removeImage();
		
		// Activar estado de "escribiendo"
		isTyping = true;
		isResponding = true;
		
		// Scroll para asegurar visibilidad del indicador de escritura
		scrollToBottom();
		
		// Callbacks para el streaming
		const callbacks: StreamCallbacks = {
			onStart: () => {
				console.log('Comenzando streaming...');
			},
			onChunk: (chunk) => {
				// Ahora recibimos la respuesta completa de una vez
				isTyping = false;
				
				// Añadir el mensaje completo
				messages = [...messages, {
					text: chunk,
					isUser: false,
					timestamp: new Date()
				}];
				
				scrollToBottom();
				isResponding = false;
			},
			onCorrection: (correctedText) => {
				// Ya no se usa, el manejo se hace en el backend
			},
			onDone: () => {
				isResponding = false;
				isTyping = false;
				console.log('Streaming completado');
			},
			onError: (error) => {
				console.error('Error en streaming:', error);
				isResponding = false;
				isTyping = false;
				
				// Mostrar mensaje de error
				messages = [...messages, {
					text: 'Error: No se pudo completar la respuesta.',
					isUser: false,
					timestamp: new Date()
				}];
				
				scrollToBottom();
			}
		};
		
		// Enviar mensaje con streaming, incluyendo ID de usuario
		apiClient.sendChatMessageStream(userQuestion, callbacks, imageUrl, userId);
	}
	
	// Enviar mensaje usando API REST
	async function sendMessageREST() {
		if (!messageInput.trim() && !imageFile) return;
		
		let imageUrl = '';
		
		// Si hay imagen, obtener URL
		if (imageFile) {
			imageUrl = await imageToBase64(imageFile);
		}
		
		// Agregar mensaje del usuario
		const userMessage: ChatMessage = {
			text: messageInput,
			isUser: true,
			timestamp: new Date(),
			imageUrl: imagePreviewUrl || undefined
		};
		
		messages = [...messages, userMessage];
		
		const userQuestion = messageInput;
		messageInput = '';
		removeImage();
		
		try {
			// Llamar a la API con ID de usuario
			const response = await apiClient.sendChatMessage(userQuestion, imageUrl, userId);
			messages = [...messages, response];
			scrollToBottom();
		} catch (error) {
			console.error('Error al enviar mensaje:', error);
			messages = [...messages, {
				text: 'Lo siento, ha ocurrido un error al procesar tu mensaje.',
				isUser: false,
				timestamp: new Date()
			}];
			scrollToBottom();
		}
	}
	
	// Enviar mensaje usando WebSockets
	async function sendMessageWS() {
		if (!messageInput.trim() && !imageFile) return;
		
		let imageUrl = '';
		
		// Si hay imagen, obtener URL
		if (imageFile) {
			imageUrl = await imageToBase64(imageFile);
		}
		
		// Agregar mensaje del usuario
		const userMessage: ChatMessage = {
			text: messageInput,
			isUser: true,
			timestamp: new Date(),
			imageUrl: imagePreviewUrl || undefined
		};
		
		messages = [...messages, userMessage];
		
		const userQuestion = messageInput;
		messageInput = '';
		removeImage();
		
		// Enviar mensaje por WebSocket con ID de usuario
		const sent = wsClient.sendMessage(userQuestion, imageUrl, userId);
		
		if (!sent) {
			messages = [...messages, {
				text: 'Error de conexión. Cambia a modo API o intenta nuevamente.',
				isUser: false,
				timestamp: new Date()
			}];
			scrollToBottom();
		}
	}
	
	// Función unificada para enviar mensajes
	function sendMessage() {
		if (chatMethod === 'websocket') {
			sendMessageWS();
		} else if (chatMethod === 'stream') {
			sendMessageStream();
		} else {
			sendMessageREST();
		}
	}
	
	// Manejar respuesta de WebSocket
	function handleWebSocketMessage(message: ChatMessage) {
		messages = [...messages, message];
		scrollToBottom();
	}
	
	onMount(() => {
		// Inicializar ID de usuario
		userId = getUserId();
		console.log('ID de usuario:', userId);
		
		// Mensaje inicial del asistente
		messages = [...messages, {
			text: "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
			isUser: false,
			timestamp: new Date()
		}];
		
		// Inicializar WebSocket - Comentado temporalmente
		// try {
		// 	isConnecting = true;
		// 	wsClient.connect(handleWebSocketMessage);
		// } catch (error) {
		// 	console.error('Error al conectar WebSocket:', error);
		// } finally {
		// 	isConnecting = false;
		// }
		
		// Inicializar el detector de scroll
		if (chatContainer) {
			chatContainer.addEventListener('scroll', handleScroll);
		}
		
		// Scroll inicial
		scrollToBottom();
		
		window.addEventListener('beforeinstallprompt', (e) => {
			if (isMobile() && window.matchMedia('(display-mode: browser)').matches) {
				e.preventDefault();
				deferredPrompt = e;
				showA2HS = true;
			}
		});
	});
	
	onDestroy(() => {
		// Cerrar WebSocket al salir - Comentado temporalmente
		// wsClient.disconnect();
		
		// Liberar recursos de imágenes
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
		}
		
		// Eliminar listener de scroll
		if (chatContainer) {
			chatContainer.removeEventListener('scroll', handleScroll);
		}
	});
	
	// Manejar envío con Enter
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}
	
	function installPWA() {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then(() => {
				showA2HS = false;
				deferredPrompt = null;
			});
		}
	}
</script>

<svelte:head>
	<title>Chat con Asistente | SuperAgent MVP</title>
</svelte:head>

<div class="flex flex-col h-screen bg-gray-50">
	<!-- Header -->
	<header class="bg-white shadow-sm p-4 border-b">
		<div class="container mx-auto">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<button 
						class="flex items-center text-gray-600 hover:text-gray-900 mr-4"
						on:click={() => goto('/')}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
						</svg>
					</button>
					
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
							<img 
								src="https://randomuser.me/api/portraits/men/32.jpg" 
								alt="Diego" 
								class="w-10 h-10 rounded-full object-cover"
							/>
						</div>
						<div>
							<div class="font-medium">Diego</div>
							<div class="text-xs text-green-600">En línea</div>
						</div>
					</div>
				</div>
				
				<!-- Selector de método API/WebSocket -->
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-500">Método:</span>
					<select 
						bind:value={chatMethod} 
						class="text-sm border rounded p-1"
					>
						<option value="stream">Streaming</option>
						<option value="rest">API REST</option>
						<option value="websocket">WebSocket</option>
					</select>
				</div>
			</div>
		</div>
	</header>
	
	<!-- Chat Container -->
	<div 
		class="flex-1 overflow-auto p-4 space-y-4"
		bind:this={chatContainer}
	>
		<div class="container mx-auto max-w-2xl space-y-4">
			{#each messages as message}
				<div class={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
					<div class={`max-w-xs md:max-w-md rounded-lg p-3 ${
						message.isUser 
							? 'bg-indigo-600 text-white rounded-br-none' 
							: 'bg-white shadow rounded-bl-none'
					}`}>
						{#if message.imageUrl}
							<div class="mb-2 rounded overflow-hidden">
								<img 
									src={message.imageUrl} 
									alt="Imagen adjunta" 
									class="w-full max-h-64 object-contain"
								/>
							</div>
						{/if}
						<p class="whitespace-pre-wrap">{message.text}</p>
						{#if message.text || message.isUser}
							<div class={`text-xs mt-1 ${message.isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
								{message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
							</div>
						{:else}
							<div class="flex items-center space-x-1 mt-2">
								<div class="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
								<div class="w-2 h-2 rounded-full bg-gray-400 animate-pulse animation-delay-300"></div>
								<div class="w-2 h-2 rounded-full bg-gray-500 animate-pulse animation-delay-600"></div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
			
			{#if isTyping}
				<div class="flex justify-start">
					<div class="bg-gray-100 text-gray-700 rounded-lg p-3 max-w-xs md:max-w-md">
						<div class="flex items-center">
							<div class="text-sm">{typingName} está escribiendo</div>
							<div class="flex items-center space-x-1 ml-2">
								<div class="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
								<div class="w-1.5 h-1.5 rounded-full bg-gray-500 animate-pulse animation-delay-300"></div>
								<div class="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse animation-delay-600"></div>
							</div>
						</div>
					</div>
				</div>
			{/if}
			
			{#if isConnecting}
				<div class="flex justify-center">
					<div class="bg-gray-100 text-gray-500 px-4 py-2 rounded-full text-sm">
						Conectando...
					</div>
				</div>
			{/if}
			
			{#if userScrolledUp}
				<div class="fixed bottom-20 right-8">
					<button
						class="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700"
						on:click={() => {
							userScrolledUp = false;
							scrollToBottom();
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
						</svg>
					</button>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Input Area -->
	<div class="bg-white border-t p-4">
		<div class="container mx-auto max-w-2xl">
			{#if imagePreviewUrl}
				<div class="mb-2 relative inline-block">
					<img 
						src={imagePreviewUrl} 
						alt="Vista previa" 
						class="h-20 w-auto rounded border border-gray-300"
					/>
					<button 
						class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 line-height-0"
						on:click={removeImage}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/if}
			
			<div class="flex items-end gap-2">
				<textarea 
					bind:value={messageInput}
					on:keydown={handleKeydown}
					placeholder="Escribe un mensaje..." 
					class="flex-1 resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
					rows="1"
					disabled={isResponding}
				></textarea>
				
				<label class="cursor-pointer text-gray-500 hover:text-indigo-600">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<input 
						type="file" 
						accept="image/*" 
						on:change={handleImageSelect} 
						class="hidden"
						disabled={isResponding}
					/>
				</label>
				
				<button 
					on:click={sendMessage}
					class="bg-indigo-600 text-white p-2 rounded-full disabled:opacity-50 flex items-center justify-center"
					disabled={(!messageInput.trim() && !imageFile) || isResponding}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
					</svg>
				</button>
			</div>
		</div>
	</div>
	
	{#if showA2HS}
		<div class="fixed bottom-0 left-0 w-full bg-indigo-600 text-white flex items-center justify-between px-4 py-3 z-50 shadow-lg md:hidden">
			<span class="font-semibold">Vive la Experiencia PWA</span>
			<div class="flex gap-2">
				<button class="bg-white text-indigo-600 font-bold px-3 py-1 rounded shadow" on:click={installPWA}>Instalar</button>
				<button class="text-white text-xl px-2" on:click={() => showA2HS = false}>&times;</button>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}
	
	.animate-pulse {
		animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
	
	.animation-delay-300 {
		animation-delay: 300ms;
	}
	
	.animation-delay-600 {
		animation-delay: 600ms;
	}
</style> 