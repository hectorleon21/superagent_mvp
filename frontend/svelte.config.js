import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: { 
		adapter: adapter(),
		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// ignorar todos los errores 404
				if (message.includes('404')) {
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
