import { Elysia } from "elysia";
// import { cors } from '@elysiajs/cors'; // Comentamos el plugin CORS
import { swagger } from '@elysiajs/swagger';

// API key para Fireworks
const FIREWORKS_API_KEY = "fw_3ZKW3XNeWFJVK8d9mqTQAK1C";
const FIREWORKS_API_URL = "https://api.fireworks.ai/inference/v1/chat/completions";

// Sistema de roles para controlar el comportamiento del modelo
const SYSTEM_ROLE_USER_AGENT = `Eres un asistente virtual profesional que ayuda a los usuarios de manera concisa pero cálida y amable.

Tus respuestas deben ser:
1. Breves pero amables (máximo 2-3 oraciones cortas por párrafo)
2. Naturales y conversacionales, con tono amigable pero profesional
3. Directas pero sin perder calidez
4. Centradas exactamente en la pregunta del usuario

Si te piden actuar con un rol específico (vendedor, analista, etc.):
- Adopta ese rol completamente y MANTENLO durante toda la conversación
- Permanece en contexto y recuerda información previa relevante
- Si mencionan ubicaciones o detalles específicos, incorpóralos a tu rol
- NO cambies de tema ni olvides tu rol asignado

Cuando el usuario mencione un objetivo (comprar casa, auto, etc.), mantén ese objetivo como foco central de toda la conversación.`;

const SYSTEM_ROLE_SUPERVISOR = `Eres un supervisor de calidad de respuestas generadas por un asistente virtual profesional.

Tu trabajo es revisar y mejorar las respuestas para que suenen claras, breves, humanas y estén alineadas con el objetivo del usuario y el canal de comunicación (WhatsApp, Web, etc.).

IMPORTANTE: DEBES DEVOLVER ÚNICAMENTE LA RESPUESTA CORREGIDA, SIN NINGÚN TIPO DE EXPLICACIÓN, ANÁLISIS O COMENTARIO PREVIO.

Corrige o mejora las respuestas si presentan alguno de los siguientes problemas:
1. Errores ortográficos, gramaticales o de puntuación
2. Frases poco naturales, robóticas o impersonales
3. Tono inadecuado (frío, técnico o rígido)
4. Respuestas excesivamente largas o redundantes
5. Falta de empatía, calidez o conexión emocional
6. Pérdida de foco respecto al objetivo principal del usuario
7. Olvido o inconsistencia en el rol asignado al asistente (vendedor, analista, etc.)
8. Incongruencia con mensajes anteriores o pérdida de contexto

Además, asegúrate de:
- Incluir expresiones naturales y marcadores discursivos como: "bueno", "mmm", "a ver", "la verdad es que", u otros similares, si encajan de forma fluida
- Permitir imperfecciones humanas leves como pequeñas autocorrecciones ("perdón, quise decir…") o dudas breves cuando hagan más natural el mensaje
- Personalizar usando el nombre del usuario si está disponible, o hacer referencia a detalles mencionados previamente
- Mantener consistencia con el rol asignado durante toda la conversación, adaptando vocabulario y perspectiva
- Mostrar cercanía emocional (por ejemplo: "¡Qué bueno saberlo!", "Vaya, entiendo cómo te sientes...") sin exagerar
- Terminar con preguntas suaves y cooperativas cuando corresponda, como: "¿Te parece bien?", "¿Te gustaría que lo revise?", "¿Qué opinas?"

Criterios de estilo:
- Brevedad: Máximo 1-3 oraciones por párrafo
- Tono: Amable pero conciso, ni demasiado formal ni excesivamente casual
- Humanidad: Fluido y conversacional, no perfecto pero siempre claro y útil
- Foco: Centrado en resolver la necesidad específica del usuario

Reglas generales:
- Si la respuesta es clara, cálida, natural y contextualizada, devuélvela sin cambios
- Si tiene errores menores, corrígelos respetando el estilo
- Si suena robótica, reescribe con expresiones más humanas
- Si es muy extensa, resume sin perder calidez ni precisión
- No expliques tus correcciones ni agregues comentarios externos

RECUERDA: DEVUELVE SÓLO LA RESPUESTA CORREGIDA, NO EXPLIQUES EL PROCESO NI DES ALTERNATIVAS.
SIMPLEMENTE ESCRIBE LA RESPUESTA FINAL COMO DEBE SER ENVIADA AL USUARIO.`;

// Memoria contextual para mantener el hilo de la conversación
class ConversationMemory {
  private conversations: Map<string, { role?: string; context: string[], lastUpdate: number }> = new Map();
  private readonly TTL = 30 * 60 * 1000; // 30 minutos en milisegundos

  // Limpiar conversaciones antiguas
  private cleanup() {
    const now = Date.now();
    for (const [userId, data] of this.conversations.entries()) {
      if (now - data.lastUpdate > this.TTL) {
        this.conversations.delete(userId);
      }
    }
  }

  // Obtener o crear contexto para un usuario
  getContext(userId: string): { role?: string; context: string[] } {
    this.cleanup();
    
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, { context: [], lastUpdate: Date.now() });
    }
    
    const conversation = this.conversations.get(userId)!;
    conversation.lastUpdate = Date.now();
    
    return {
      role: conversation.role,
      context: conversation.context
    };
  }

  // Añadir mensaje al contexto
  addMessage(userId: string, message: string, isUser: boolean) {
    const conversation = this.getContext(userId);
    conversation.context.push(`${isUser ? 'Usuario' : 'Asistente'}: ${message}`);
    
    // Limitar el número de mensajes para evitar tokens excesivos
    if (conversation.context.length > 10) {
      conversation.context = conversation.context.slice(-10);
    }
    
    // Detectar si el usuario pide un rol específico
    if (isUser) {
      const rolePatterns = [
        { regex: /\b(eres|actúa|sé|se|actua|comporta).*(vendedor|agente)\s+de\s+(casa|casas|inmueble|inmuebles|propiedad|propiedades)/i, role: 'vendedor de casas' },
        { regex: /\b(eres|actúa|sé|se|actua|comporta).*(vendedor|agente)\s+de\s+(auto|autos|coche|coches|carro|carros)/i, role: 'vendedor de autos' },
        { regex: /\b(eres|actúa|sé|se|actua|comporta).*(abogado|legal|jurídico|juridico)/i, role: 'abogado' },
        { regex: /\b(eres|actúa|sé|se|actua|comporta).*(médico|medico|doctor)/i, role: 'médico' },
        { regex: /\bvéndeme\s+una\s+(casa|propiedad|inmueble)/i, role: 'vendedor de casas' },
        { regex: /\bvéndeme\s+un\s+(auto|coche|carro)/i, role: 'vendedor de autos' },
      ];
      
      for (const pattern of rolePatterns) {
        if (pattern.regex.test(message)) {
          const conversation = this.conversations.get(userId)!;
          conversation.role = pattern.role;
          break;
        }
      }
    }
    
    this.conversations.set(userId, { 
      role: this.conversations.get(userId)!.role, 
      context: conversation.context, 
      lastUpdate: Date.now() 
    });
  }

  // Obtener el rol actual del asistente
  getRole(userId: string): string | undefined {
    return this.getContext(userId).role;
  }
}

// Instancia global de la memoria de conversación
const conversationMemory = new ConversationMemory();

// Función para convertir imagen a base64
async function imageToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error: any) {
    console.error("Error al convertir imagen a base64:", error);
    throw error;
  }
}

// Función para limpiar las respuestas (eliminar comillas al principio y final)
function cleanQuotedText(text: string): string {
  // Eliminar comillas al principio y final si existen
  let cleaned = text.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith('\'') && cleaned.endsWith('\''))) {
    cleaned = cleaned.substring(1, cleaned.length - 1);
  }
  
  // También eliminar comillas si hay saltos de línea al final
  if (cleaned.startsWith('"') && cleaned.endsWith('"\n')) {
    cleaned = cleaned.substring(1, cleaned.length - 2);
  }
  
  return cleaned;
}

// Integración con la API de Fireworks
async function callFireworks(
  userMessage: string, 
  userId: string = 'default',
  imageUrl?: string, 
  systemRole: string = SYSTEM_ROLE_USER_AGENT,
  temperature: number = 0.5  // Temperatura ajustada para balance entre creatividad y coherencia
): Promise<string> {
  try {
    // Obtener el contexto de la conversación
    const { role, context } = conversationMemory.getContext(userId);
    
    // Crear prompt con contexto y rol
    let enhancedSystemRole = systemRole;
    if (role) {
      enhancedSystemRole += `\n\nROL ACTUAL: Eres un ${role}. Mantén este rol durante toda la conversación.`;
    }
    
    // Añadir contexto previo de la conversación si existe
    let userMessageWithContext = userMessage;
    if (context.length > 0) {
      userMessageWithContext = `
CONTEXTO PREVIO:
${context.join('\n')}

PREGUNTA ACTUAL:
${userMessage}`;
    }
    
    // Guardar el mensaje del usuario en la memoria
    conversationMemory.addMessage(userId, userMessage, true);

    // Construir los mensajes
    const messages: any[] = [
      {
        role: "system",
        content: enhancedSystemRole
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userMessageWithContext
          }
        ]
      }
    ];

    // Si hay una URL de imagen, agregarla al mensaje
    if (imageUrl) {
      messages[1].content.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }

    // Realizar la llamada a la API
    const response = await fetch(FIREWORKS_API_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIREWORKS_API_KEY}`
      },
      body: JSON.stringify({
        model: "accounts/fireworks/models/llama4-maverick-instruct-basic",
        max_tokens: 1024,   // Limitar tokens para respuestas más concisas
        top_p: 1,
        top_k: 40,
        presence_penalty: 0.2,  // Penalty para evitar repeticiones
        frequency_penalty: 0.3,  // Ajustado para vocabulario natural
        temperature: temperature,
        stream: false,
        messages: messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de Fireworks: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const modelResponse = cleanQuotedText(data.choices[0].message.content);
    
    // Guardar la respuesta en la memoria
    conversationMemory.addMessage(userId, modelResponse, false);
    
    return modelResponse;
  } catch (error: any) {
    console.error("Error al llamar a Fireworks:", error);
    return `Error al procesar tu solicitud: ${error.message}`;
  }
}

// Validar y mejorar la respuesta del modelo con el supervisor
async function validateResponse(response: string, userMessage: string, userId: string = 'default'): Promise<string> {
  try {
    // Obtener el contexto y rol actual
    const { role, context } = conversationMemory.getContext(userId);
    
    // Construir prompt para el supervisor con contexto
    let supervisorPrompt = `
Mensaje del usuario: "${userMessage}"

Respuesta generada: "${response}"`;

    // Añadir información de rol si existe
    if (role) {
      supervisorPrompt += `\n\nROL ACTUAL DEL ASISTENTE: ${role}`;
    }
    
    // Añadir contexto de la conversación
    if (context.length > 0) {
      supervisorPrompt += `\n\nCONTEXTO DE LA CONVERSACIÓN:\n${context.join('\n')}`;
    }
    
    supervisorPrompt += `\n\nPor favor revisa esta respuesta según tus criterios de supervisión.`;

    // Crear un ID único para el supervisor basado en el ID del usuario
    const supervisorId = `supervisor_${userId}`;
    
    // Llamar al supervisor con ID único
    const validatedResponse = await callFireworks(
      supervisorPrompt,
      supervisorId, // ID único para el supervisor por cada usuario
      undefined,
      SYSTEM_ROLE_SUPERVISOR,
      0.3  // Temperatura más baja para el supervisor
    );
    
    // Procesar la respuesta para extraer solo la respuesta final si contiene análisis
    let cleanedResponse = validatedResponse;
    
    // Patrones comunes que indican análisis en lugar de respuesta directa
    const analysisPatterns = [
      "La respuesta generada es",
      "La respuesta es ",
      "Una versión revisada",
      "Una versión mejorada",
      "Versión corregida",
      "La respuesta corregida es",
      "Sin embargo,",
      "Esta versión"
    ];
    
    // Buscar si hay marcadores de respuesta final
    const finalResponseMarkers = [
      "La respuesta corregida es:",
      "Respuesta corregida:",
      "Respuesta final:",
      "Versión final:"
    ];
    
    // Si detectamos análisis, intentamos extraer solo la respuesta final
    const hasAnalysis = analysisPatterns.some(pattern => validatedResponse.includes(pattern));
    
    if (hasAnalysis) {
      console.log("Detectado análisis en respuesta del supervisor, intentando extraer respuesta final");
      
      // Primero, buscar marcadores explícitos de respuesta final
      for (const marker of finalResponseMarkers) {
        if (validatedResponse.includes(marker)) {
          const parts = validatedResponse.split(marker);
          if (parts.length > 1) {
            cleanedResponse = parts[1].trim();
            // Si la respuesta está entre comillas, quitarlas
            cleanedResponse = cleanQuotedText(cleanedResponse);
            break;
          }
        }
      }
      
      // Si no se encontró un marcador explícito pero hay un párrafo final que parece ser la respuesta
      if (cleanedResponse === validatedResponse && validatedResponse.includes("\n\n")) {
        const paragraphs = validatedResponse.split("\n\n");
        const lastParagraph = paragraphs[paragraphs.length - 1].trim();
        
        // Si el último párrafo parece una respuesta directa y no un análisis
        if (lastParagraph.length > 0 && 
            !analysisPatterns.some(pattern => lastParagraph.includes(pattern))) {
          cleanedResponse = lastParagraph;
          // Si la respuesta está entre comillas, quitarlas
          cleanedResponse = cleanQuotedText(cleanedResponse);
        }
      }
    } else {
      // Si no hay análisis, de todas formas limpiamos por si hay comillas
      cleanedResponse = cleanQuotedText(cleanedResponse);
    }
    
    return cleanedResponse;
  } catch (error: any) {
    console.error("Error en la validación:", error);
    // Asegurarnos de que la respuesta original también esté limpia de comillas
    return cleanQuotedText(response);
  }
}

// Crear la aplicación Elysia
const app = new Elysia({
  serve: {
    idleTimeout: 30 // 30 segundos (el límite es 255 segundos)
  }
})
// Manejo manual de CORS ajustado para Vercel
.onRequest((context) => {
  if (context.request.method === 'OPTIONS') {
    context.set.headers = {
      'Access-Control-Allow-Origin': 'https://superagent-mvp-2.vercel.app', // URL de tu frontend en Vercel
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Re-añadimos Authorization por si lo usas
      'Access-Control-Allow-Credentials': 'true', // Si necesitas cookies/sesiones cross-origin
      'Access-Control-Max-Age': '86400'
    };
    context.set.status = 200; 
    return "OPTIONS handled"; 
  }
})
.onResponse((context) => {
  context.set.headers['Access-Control-Allow-Origin'] = 'https://superagent-mvp-2.vercel.app'; // URL de tu frontend en Vercel
  context.set.headers['Access-Control-Allow-Credentials'] = 'true'; // Coherencia
})
.use(swagger()) // Podemos intentar re-activar swagger
  
  // Ruta para verificar el estado del servidor
  .get("/", () => "SuperAgent API está funcionando correctamente con Fireworks AI, memoria contextual y sistema de supervisión")
  
  // Endpoint específico para health check
  .get("/api/health", () => ({ status: "ok" }))
  
  // Documentación de la API
  .get("/status", () => ({
    status: "online",
    model: "Llama-4-Maverick (Fireworks AI)",
    features: ["Supervisor", "Streaming", "Contextual Memory", "Role Persistence"],
    timestamp: new Date()
  }))
  
  // API para chat (método HTTP) - No streaming
  .post("/api/chat", async (context: any) => {
    const body = context.body as any;
    const message = body?.message || '';
    const imageUrl = body?.imageUrl;
    const userId = body?.userId || 'default';
    
    // Obtener respuesta del modelo
    const initialResponse = await callFireworks(message, userId, imageUrl);
    
    // Validar la respuesta
    const validatedResponse = await validateResponse(initialResponse, message, userId);
    
    return {
      text: validatedResponse,
      isUser: false,
      timestamp: new Date()
    };
  })
  
  // API para chat con streaming (simulando escritura humana)
  .post("/api/chat/stream", async ({ body, set }: { body: any, set: any }) => {
    const message = (body as any)?.message || '';
    const imageUrl = (body as any)?.imageUrl;
    const userId = (body as any)?.userId || 'default';
    
    // Configurar headers para streaming
    set.headers['Content-Type'] = 'text/event-stream';
    set.headers['Cache-Control'] = 'no-cache';
    set.headers['Connection'] = 'keep-alive';
    set.headers['X-Accel-Buffering'] = 'no';
    set.headers['Keep-Alive'] = 'timeout=30'; // Aumentar timeout
    
    // Obtener el contexto de la conversación
    const { role, context } = conversationMemory.getContext(userId);
    
    // Crear prompt con contexto y rol
    let enhancedSystemRole = SYSTEM_ROLE_USER_AGENT;
    if (role) {
      enhancedSystemRole += `\n\nROL ACTUAL: Eres un ${role}. Mantén este rol durante toda la conversación.`;
    }
    
    // Añadir contexto previo de la conversación si existe
    let userMessageWithContext = message;
    if (context.length > 0) {
      userMessageWithContext = `
CONTEXTO PREVIO:
${context.join('\n')}

PREGUNTA ACTUAL:
${message}`;
    }
    
    // Guardar mensaje del usuario
    conversationMemory.addMessage(userId, message, true);
    
    // Crear los mensajes
    const messages: any[] = [
      {
        role: "system",
        content: enhancedSystemRole
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userMessageWithContext
          }
        ]
      }
    ];

    // Si hay una URL de imagen, agregarla al mensaje
    if (imageUrl) {
      messages[1].content.push({
        type: "image_url",
        image_url: {
          url: imageUrl
        }
      });
    }
    
    // Enfoque simplificado que evita problemas de contexto
    return new Response(
      new ReadableStream({
        async start(controller) {
          // Señal de inicio (muestra "está escribiendo")
          controller.enqueue(`data: {"start":true}\n\n`);
          
          try {
            // Paso 1: Obtener la respuesta inicial de Fireworks
            let fullResponse = '';
            try {
              // Modo no streaming para simplificar
              const response = await fetch(FIREWORKS_API_URL, {
                method: "POST",
                headers: {
                  "Accept": "application/json",
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${FIREWORKS_API_KEY}`
                },
                body: JSON.stringify({
                  model: "accounts/fireworks/models/llama4-maverick-instruct-basic",
                  max_tokens: 1024,
                  top_p: 1,
                  top_k: 40,
                  presence_penalty: 0.2,
                  frequency_penalty: 0.3,
                  temperature: 0.5,
                  stream: false, // Sin streaming para simplificar
                  messages: messages
                })
              });
              
              if (!response.ok) {
                throw new Error(`Error en la API de Fireworks: ${response.status}`);
              }
              
              const data = await response.json();
              fullResponse = data.choices[0].message.content;
              
              // Guardar la respuesta en la memoria
              conversationMemory.addMessage(userId, fullResponse, false);
            } catch (error: any) {
              console.error("Error al obtener respuesta:", error);
              controller.enqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
              controller.close();
              return;
            }
            
            // Paso 2: Validar la respuesta (fuera del stream)
            let validatedResponse = fullResponse;
            try {
              // Crear un ID único para el supervisor basado en el ID del usuario
              const supervisorId = `supervisor_${userId}`;
              
              // Construir prompt para el supervisor
              let supervisorPrompt = `
Mensaje del usuario: "${message}"

Respuesta generada: "${fullResponse}"`;

              if (role) {
                supervisorPrompt += `\n\nROL ACTUAL DEL ASISTENTE: ${role}`;
              }
              
              if (context.length > 0) {
                supervisorPrompt += `\n\nCONTEXTO DE LA CONVERSACIÓN:\n${context.join('\n')}`;
              }
              
              supervisorPrompt += `\n\nPor favor revisa esta respuesta según tus criterios de supervisión.`;
              
              // Llamar al supervisor directamente, sin streaming
              const supervisorResponse = await fetch(FIREWORKS_API_URL, {
                method: "POST",
                headers: {
                  "Accept": "application/json",
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${FIREWORKS_API_KEY}`
                },
                body: JSON.stringify({
                  model: "accounts/fireworks/models/llama4-maverick-instruct-basic",
                  max_tokens: 1024,
                  top_p: 1,
                  top_k: 40,
                  presence_penalty: 0.2,
                  frequency_penalty: 0.3,
                  temperature: 0.3,
                  stream: false,
                  messages: [
                    {
                      role: "system",
                      content: SYSTEM_ROLE_SUPERVISOR
                    },
                    {
                      role: "user",
                      content: supervisorPrompt
                    }
                  ]
                })
              });
              
              if (supervisorResponse.ok) {
                const supervisorData = await supervisorResponse.json();
                let supervisorOutput = supervisorData.choices[0].message.content;
                
                // Procesar la respuesta para extraer solo la respuesta final
                let cleanedResponse = supervisorOutput;
                
                // Patrones comunes que indican análisis
                const analysisPatterns = [
                  "La respuesta generada es",
                  "La respuesta es ",
                  "Una versión revisada",
                  "Una versión mejorada",
                  "Versión corregida",
                  "La respuesta corregida es",
                  "Sin embargo,",
                  "Esta versión"
                ];
                
                // Marcadores de respuesta final
                const finalResponseMarkers = [
                  "La respuesta corregida es:",
                  "Respuesta corregida:",
                  "Respuesta final:",
                  "Versión final:"
                ];
                
                // Detectar análisis y extraer solo la respuesta
                const hasAnalysis = analysisPatterns.some(pattern => supervisorOutput.includes(pattern));
                
                if (hasAnalysis) {
                  console.log("Detectado análisis en respuesta del supervisor");
                  
                  // Buscar marcadores explícitos
                  for (const marker of finalResponseMarkers) {
                    if (supervisorOutput.includes(marker)) {
                      const parts = supervisorOutput.split(marker);
                      if (parts.length > 1) {
                        cleanedResponse = parts[1].trim();
                        if (cleanedResponse.startsWith('"') && cleanedResponse.endsWith('"')) {
                          cleanedResponse = cleanedResponse.substring(1, cleanedResponse.length - 1);
                        }
                        break;
                      }
                    }
                  }
                  
                  // Buscar último párrafo si no se encontró marcador
                  if (cleanedResponse === supervisorOutput && supervisorOutput.includes("\n\n")) {
                    const paragraphs = supervisorOutput.split("\n\n");
                    const lastParagraph = paragraphs[paragraphs.length - 1].trim();
                    
                    if (lastParagraph.length > 0 && 
                        !analysisPatterns.some(pattern => lastParagraph.includes(pattern))) {
                      cleanedResponse = lastParagraph;
                      if (cleanedResponse.startsWith('"') && cleanedResponse.endsWith('"')) {
                        cleanedResponse = cleanedResponse.substring(1, cleanedResponse.length - 1);
                      }
                    }
                  }
                }
                
                validatedResponse = cleanedResponse;
                
                // Actualizar memoria solo si cambió la respuesta
                if (validatedResponse !== fullResponse) {
                  // Eliminar la última entrada (respuesta original)
                  const { context } = conversationMemory.getContext(userId);
                  if (context.length > 0) {
                    context.pop();
                    conversationMemory.addMessage(userId, validatedResponse, false);
                  }
                }
              }
            } catch (validationError) {
              console.error('Error en validación:', validationError);
              // Si hay error de validación, usamos la respuesta original (limpia de comillas)
              validatedResponse = cleanQuotedText(fullResponse);
            }
            
            // Paso 3: Simular tiempo de escritura más corto (entre 0.5 y 1.5 segundos)
            const responseLength = validatedResponse.length;
            const typingTimeMs = Math.min(Math.max(responseLength * 5, 500), 1500);
            
            setTimeout(() => {
              try {
                // Paso 4: Enviar la respuesta final
                controller.enqueue(`data: ${JSON.stringify({ chunk: cleanQuotedText(validatedResponse) })}\n\n`);
                controller.enqueue(`data: {"done":true}\n\n`);
                controller.close();
              } catch (error) {
                console.error("Error al enviar respuesta:", error);
              }
            }, typingTimeMs);
            
          } catch (error: any) {
            console.error('Error general:', error);
            try {
              controller.enqueue(`data: ${JSON.stringify({ error: error.message })}\n\n`);
              controller.close();
            } catch (finalError) {
              console.error("Error fatal:", finalError);
            }
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
  
  // Iniciar el servidor
  .listen({
    port: Number(process.env.PORT) || 3000,
    hostname: '0.0.0.0'
  });

console.log(
  `🔥 SuperAgent API está ejecutándose en ${app.server?.hostname}:${app.server?.port} (usando Fireworks AI con memoria contextual y supervisor)`
);
