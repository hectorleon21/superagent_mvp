# SuperAgent MVP

Una aplicación PWA para contratar asistentes virtuales IA con especialidades específicas.

## Arquitectura

El proyecto utiliza una arquitectura moderna y de alto rendimiento:

- **Frontend**: SvelteKit para una PWA rápida y receptiva
- **Backend**: Bun + Elysia para un servidor ultra rápido y eficiente
- **Comunicación en tiempo real**: API REST optimizada
- **Integración IA**: API de Fireworks AI (Llama-4-Maverick)

## Estructura del Proyecto

```
superagent_mvp/
├── frontend/           # Aplicación SvelteKit (PWA)
│   ├── src/            # Código fuente
│   │   ├── routes/     # Rutas y páginas
│   │   ├── lib/        # Utilidades y componentes reutilizables
│   │   └── ...
│   └── ...
└── backend/            # API Backend (Bun + Elysia)
    ├── app/            # Servidor Elysia
    │   ├── src/        # Código fuente
    │   └── ...
    └── ...
```

## Requisitos

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (para el backend)
- [npm](https://www.npmjs.com/) (incluido con Node.js)

## Instalación

### Backend (Bun + Elysia)

```bash
# Instalar Bun (si no está instalado)
curl -fsSL https://bun.sh/install | bash

# Navegar al directorio del backend
cd backend/app

# Instalar dependencias
bun install

# Iniciar el servidor en modo desarrollo
bun run dev
```

### Frontend (SvelteKit)

```bash
# Navegar al directorio del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm run dev
```

## Uso

1. Abre tu navegador en `http://localhost:5173` para ver la aplicación frontend
2. El backend estará disponible en `http://localhost:3000`
3. Puedes ver la documentación de la API en `http://localhost:3000/swagger`

## Características

- **PWA**: Instalable en dispositivos móviles y funcionalidad offline
- **Selección de asistentes**: Diferentes tipos de asistentes especializados
- **Chat en tiempo real**: Comunicación fluida con el asistente seleccionado
- **Multimedia**: Soporte para envío de imágenes al asistente
- **Integración IA**: Respuestas generadas por la API de Fireworks AI (multimodal)

## Integración con Fireworks AI

Esta aplicación utiliza la API de Fireworks AI con el modelo Llama-4-Maverick para:

- Procesamiento de lenguaje natural
- Análisis de imágenes (capacidad multimodal)
- Generación de respuestas contextuales

La integración está configurada para:
- Enviar texto e imágenes al modelo
- Procesar respuestas en tiempo real
- Mantener el contexto de la conversación
- Alta capacidad de procesamiento con límites elevados de concurrencia

## Escalabilidad

- Arquitectura diseñada para manejar alto tráfico (>200k RPS en condiciones óptimas)
- Componentes desacoplados para escalar independientemente
- Fácil integración con sistemas RAG externos
- Preparado para implementación en entornos de producción

## Licencia

MIT 