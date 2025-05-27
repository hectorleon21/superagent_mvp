import { Elysia } from "elysia";
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';

// API key para Groq
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Sistema de roles para controlar el comportamiento del modelo
const SYSTEM_ROLE_USER_AGENT = `Eres un agente comercial buscando ser contratado.

Si mencionan "Eduardo" o "Edu", eres Eduardo. Si mencionan "Eli", eres Eli.

Proceso (sé BREVE en cada paso):
1. Saluda y pregunta qué vende
2. Ofrece demostración 
3. Si acepta, simula vender SUS productos a un cliente
4. Tras la demo, resume TUS capacidades: "Además, puedo obtener la información de tu empresa en tu página web, redes sociales, documentos de tu negocio (catálogo, precios, etc), respondo por WhatsApp/Instagram/Facebook, manejo ventas de inicio a cierre, reporto leads potenciales y ventas realizadas, y te ofrezco ¡7 días gratis de prueba sin compromiso! (si no te agrado me despides :)"
5. Pregunta si te contrata

Máximo 3-4 líneas por respuesta. Sin rodeos.`;

// Memoria contextual simple
class ConversationMemory {
  private conversations: Map<string, { 
    context: string[], 
    lastUpdate: number
  }> = new Map();
  private readonly TTL = 30 * 60 * 1000; // 30 minutos

  private cleanup() {
    const now = Date.now();
    for (const [userId, data] of this.conversations.entries()) {
      if (now - data.lastUpdate > this.TTL) {
        this.conversations.delete(userId);
      }
    }
  }

  getContext(userId: string): { context: string[] } {
    this.cleanup();
    
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, { 
        context: [], 
        lastUpdate: Date.now()
      });
    }
    
    const conversation = this.conversations.get(userId)!;
    conversation.lastUpdate = Date.now();
    
    return { context: conversation.context };
  }

  addMessage(userId: string, message: string, isUser: boolean) {
    const { context } = this.getContext(userId);
    context.push(`${isUser ? 'Usuario' : 'Asistente'}: ${message}`);
    
    if (context.length > 10) {
      context.splice(0, context.length - 10);
    }
    
    this.conversations.set(userId, { 
      context: context, 
      lastUpdate: Date.now()
    });
  }

  resetUser(userId: string): void {
    this.conversations.delete(userId);
    console.log(`Conversación reseteada para usuario ${userId}`);
  }
}

// Instancia global de la memoria
const conversationMemory = new ConversationMemory();

// Llamada a Groq API
async function callGroq(
  userMessage: string, 
  userId: string = 'default',
  imageUrl?: string, 
  systemRole: string = SYSTEM_ROLE_USER_AGENT,
  temperature: number = 0.6
): Promise<string> {
  try {
    const { context } = conversationMemory.getContext(userId);
    
    let contextMessages = "";
    if (context.length > 0) {
      contextMessages = "\n\nHistorial de conversación:\n" + context.join('\n');
    }

    const messages: any[] = [
      {
        role: "system",
        content: systemRole + contextMessages
      },
      {
        role: "user",
        content: userMessage
      }
    ];

    if (imageUrl) {
      messages[1].content = [
        { type: "text", text: userMessage },
        { type: "image_url", image_url: { url: imageUrl } }
      ];
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 350,
        top_p: 0.9,
        temperature: temperature,
        stream: false,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de Groq: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const modelResponse = data.choices[0].message.content;
    
    conversationMemory.addMessage(userId, userMessage, true);
    conversationMemory.addMessage(userId, modelResponse, false);
    
    return modelResponse;
  } catch (error: any) {
    console.error("Error al llamar a Groq:", error);
    return `Error al procesar tu solicitud: ${error.message}`;
  }
}

// Configuración de CORS
const isDevelopment = process.env.NODE_ENV !== 'production';
const allowedOrigins = isDevelopment 
  ? ['http://localhost:5173', 'http://localhost:3000', 'https://superagent-mvp-2.vercel.app']
  : ['https://superagent-mvp-2.vercel.app', 'https://superagent-mvp.onrender.com'];

// Crear la aplicación Elysia
const app = new Elysia({ serve: { idleTimeout: 30 } })
  .use(cors({
    origin: (request) => {
      const origin = request.headers.get('origin');
      if (!origin) return false;
      if (isDevelopment) return true;
      return allowedOrigins.includes(origin);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflight: true
  }))
  .use(swagger())
  .get("/", () => "SuperAgent API está funcionando correctamente con Groq AI")
  .get("/api/health", () => ({ status: "ok" }))
  .get("/status", () => ({
    status: "online",
    model: "Llama-3.3-70b-versatile (Groq AI)",
    features: ["Contextual Memory", "Simple Prompt"],
    timestamp: new Date()
  }))
  .post("/api/chat", async (context: any) => {
    const body = context.body as any;
    const message = body?.message || '';
    const imageUrl = body?.imageUrl;
    const userId = body?.userId || 'default';
    
    const response = await callGroq(message, userId, imageUrl);
    
    return {
      text: response,
      isUser: false,
      timestamp: new Date()
    };
  })
  .post("/api/reset", async (context: any) => {
    const body = context.body as any;
    const userId = body?.userId || 'default';
    
    conversationMemory.resetUser(userId);
    
    return {
      success: true,
      message: `Conversación reseteada para usuario ${userId}`
    };
  })
  .post("/api/chat/stream", async ({ body, set }: { body: any, set: any }) => {
    const message = (body as any)?.message || '';
    const imageUrl = (body as any)?.imageUrl;
    const userId = (body as any)?.userId || 'default';
    
    set.headers['Content-Type'] = 'text/event-stream';
    set.headers['Cache-Control'] = 'no-cache';
    set.headers['Connection'] = 'keep-alive';
    set.headers['X-Accel-Buffering'] = 'no';
    
    const { context } = conversationMemory.getContext(userId);
    let contextMessages = "";
    if (context.length > 0) {
      contextMessages = "\n\nHistorial de conversación:\n" + context.join('\n');
    }
    
    conversationMemory.addMessage(userId, message, true);
    
    const messages: any[] = [
      {
        role: "system",
        content: SYSTEM_ROLE_USER_AGENT + contextMessages
      },
      {
        role: "user",
        content: message
      }
    ];

    if (imageUrl) {
      messages[1].content = [
        { type: "text", text: message },
        { type: "image_url", image_url: { url: imageUrl } }
      ];
    }
    
    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(`data: {"start":true}\n\n`);
          
          try {
            let fullResponse = '';
            
            const response = await fetch(GROQ_API_URL, {
              method: "POST",
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                max_tokens: 350,
                top_p: 0.9,
                temperature: 0.6,
                stream: false,
                messages: messages
              })
            });
            
            if (!response.ok) {
              throw new Error(`Error en la API de Groq: ${response.status}`);
            }
            
            const data = await response.json();
            fullResponse = data.choices[0].message.content;
            
            conversationMemory.addMessage(userId, fullResponse, false);
            
            const responseLength = fullResponse.length;
            const typingTimeMs = Math.min(Math.max(responseLength * 5, 500), 1500);
            
            setTimeout(() => {
              controller.enqueue(`data: ${JSON.stringify({ chunk: fullResponse })}\n\n`);
              controller.enqueue(`data: {"done":true}\n\n`);
              controller.close();
            }, typingTimeMs);
            
          } catch (error: any) {
            console.error('Error:', error);
            controller.enqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            controller.close();
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      }
    );
  })
  .listen({
    port: Number(process.env.PORT) || 3000,
    hostname: '0.0.0.0'
  });

console.log(
  `🔥 SuperAgent API está ejecutándose en ${app.server?.hostname}:${app.server?.port}`
);