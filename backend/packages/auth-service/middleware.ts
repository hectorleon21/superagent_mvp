import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../../node_modules/@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

// Middleware para autenticación con JWT
export async function authMiddleware(context: any) {
  const { headers, set } = context;
  
  const token = headers.authorization?.split(' ')[1];
  
  if (!token) {
    set.status = 401;
    return { error: 'No token provided' };
  }
  
  try {
    // Verificar token
    const payload = jwt.verify(token, JWT_SECRET) as AuthContext;
    
    // Verificar que el usuario existe y está activo
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true, organizationId: true }
    });
    
    if (!user || !user.isActive) {
      set.status = 401;
      return { error: 'Invalid token' };
    }
    
    // Agregar contexto de auth
    context.auth = payload;
    
  } catch (error) {
    set.status = 401;
    return { error: 'Invalid token' };
  }
}

// Middleware para autenticación con API Key
export async function apiKeyMiddleware(context: any) {
  const { headers, set } = context;
  
  const apiKey = headers['x-api-key'];
  
  if (!apiKey) {
    set.status = 401;
    return { error: 'No API key provided' };
  }
  
  try {
    // Buscar API key
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { organization: true }
    });
    
    if (!key || !key.isActive) {
      set.status = 401;
      return { error: 'Invalid API key' };
    }
    
    // Verificar expiración
    if (key.expiresAt && key.expiresAt < new Date()) {
      set.status = 401;
      return { error: 'API key expired' };
    }
    
    // Actualizar último uso
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() }
    });
    
    // Agregar contexto de auth
    context.auth = {
      organizationId: key.organizationId,
      permissions: key.permissions,
      apiKeyId: key.id
    };
    
  } catch (error) {
    set.status = 401;
    return { error: 'Invalid API key' };
  }
}

// Middleware combinado (acepta JWT o API Key)
export async function authOrApiKeyMiddleware(context: any) {
  const { headers } = context;
  
  if (headers.authorization) {
    return authMiddleware(context);
  } else if (headers['x-api-key']) {
    return apiKeyMiddleware(context);
  } else {
    context.set.status = 401;
    return { error: 'Authentication required' };
  }
}

// Middleware para verificar permisos
export function requirePermission(permission: string) {
  return async (context: any) => {
    const { auth, set } = context;
    
    if (!auth) {
      set.status = 401;
      return { error: 'Not authenticated' };
    }
    
    // Si es autenticación con JWT, verificar rol
    if (auth.role) {
      const allowedRoles = {
        'OWNER': ['*'],
        'ADMIN': ['rag:*', 'chat:*', 'users:read'],
        'USER': ['rag:read', 'chat:*'],
        'AGENT': ['chat:write']
      };
      
      const userPermissions = allowedRoles[auth.role as keyof typeof allowedRoles] || [];
      
      // Verificar permisos
      const hasPermission = userPermissions.includes('*') ||
                          userPermissions.includes(permission) ||
                          userPermissions.some(p => {
                            const [resource, action] = p.split(':');
                            const [reqResource, reqAction] = permission.split(':');
                            return resource === reqResource && action === '*';
                          });
      
      if (!hasPermission) {
        set.status = 403;
        return { error: 'Insufficient permissions' };
      }
    } 
    // Si es API key, verificar permisos específicos
    else if (auth.permissions) {
      if (!auth.permissions.includes(permission)) {
        set.status = 403;
        return { error: 'API key lacks required permission' };
      }
    }
  };
} 