/**
 * Servicio para la comunicación con el backend
 */

// DEBUG: Imprimir la variable de entorno
console.log('VITE_API_BASE_URL from import.meta.env:', import.meta.env.VITE_API_BASE_URL);

// API URL - cambiar según entorno
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// DEBUG: Imprimir la API_URL final que se usará
console.log('Final API_URL being used:', API_URL);

// Interfaz para mensajes de chat
export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
  imageUrl?: string; // URL de imagen opcional
}

// Interfaz para callback de streaming
export interface StreamCallbacks {
  onStart?: () => void;
  onChunk: (chunk: string) => void;
  onCorrection?: (correctedText: string) => void; // Callback para correcciones
  onDone?: () => void;
  onError?: (error: any) => void;
}

/**
 * Cliente para la API REST
 */
export const apiClient = {
  /**
   * Envía un mensaje al chatbot y recibe una respuesta
   */
  async sendChatMessage(
    message: string, 
    imageUrl?: string,
    userId?: string
  ): Promise<ChatMessage> {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          imageUrl,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        text: data.text,
        isUser: false,
        timestamp: new Date(data.timestamp)
      };
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      return {
        text: 'Lo siento, ha ocurrido un error al procesar tu mensaje.',
        isUser: false,
        timestamp: new Date()
      };
    }
  },

  /**
   * Envía un mensaje al chatbot con streaming de respuesta
   */
  sendChatMessageStream(
    message: string,
    callbacks: StreamCallbacks,
    imageUrl?: string,
    userId?: string
  ): void {
    // Método usando fetch POST con body
    fetch(`${API_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        imageUrl,
        userId
      }),
    }).then(response => {
      if (!response.body) {
        throw new Error('ReadableStream no soportado');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      callbacks.onStart?.();
      
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              callbacks.onDone?.();
              break;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  
                  if (data.start) {
                    callbacks.onStart?.();
                    continue;
                  }
                  
                  if (data.done) {
                    callbacks.onDone?.();
                    continue;
                  }
                  
                  if (data.correction) {
                    // Este evento ya no se utiliza
                    continue;
                  }
                  
                  if (data.chunk) {
                    // Ahora recibimos la respuesta completa, no necesitamos
                    // acumular chunks
                    callbacks.onChunk(data.chunk);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        } catch (error) {
          callbacks.onError?.(error);
        }
      };
      
      processStream();
    }).catch(error => {
      callbacks.onError?.(error);
    });
  },

  /**
   * Obtiene el estado del servidor
   */
  async getStatus(): Promise<{ status: string; timestamp: Date }> {
    try {
      const response = await fetch(`${API_URL}/status`);
      const data = await response.json();
      return {
        ...data,
        timestamp: new Date(data.timestamp)
      };
    } catch (error) {
      console.error('Error al verificar estado:', error);
      return {
        status: 'offline',
        timestamp: new Date()
      };
    }
  }
};

/**
 * Cliente para WebSockets
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandler: ((message: ChatMessage) => void) | null = null;

  /**
   * Inicializa la conexión WebSocket
   */
  connect(onMessage: (message: ChatMessage) => void): void {
    this.messageHandler = onMessage;
    
    // Cerrar conexión previa si existe
    if (this.ws) {
      this.ws.close();
    }

    // Crear nueva conexión
    this.ws = new WebSocket(`ws://${API_URL.replace('http://', '')}/ws/chat`);
    
    this.ws.onopen = () => {
      console.log('Conexión WebSocket establecida');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const message: ChatMessage = {
          ...data,
          timestamp: new Date(data.timestamp)
        };
        
        if (this.messageHandler) {
          this.messageHandler(message);
        }
      } catch (error) {
        console.error('Error al procesar mensaje WebSocket:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };

    this.ws.onclose = () => {
      console.log('Conexión WebSocket cerrada');
    };
  }

  /**
   * Envía un mensaje a través del WebSocket
   */
  sendMessage(message: string, imageUrl?: string, userId?: string): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        message,
        imageUrl,
        userId
      }));
      return true;
    }
    return false;
  }

  /**
   * Cierra la conexión WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton para usar en la aplicación
export const wsClient = new WebSocketClient(); 