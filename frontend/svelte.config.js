import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: { 
		adapter: adapter(),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// ignorar errores 404 para iconos
				if (path.startsWith('/icons/') || path.includes('icon-192x192.png')) {
					console.warn(`Ignorando error 404 para ${path}`);
					return;
				}
				// para todos los demás errores, lanzar
				throw new Error(message);
			}
		}
	}
};

export default config;
