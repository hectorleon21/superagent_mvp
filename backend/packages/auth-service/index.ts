import { Elysia, t } from 'elysia';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Configuración
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Tipos
interface JWTPayload {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
}

// Utilidades
function generateTokens(payload: JWTPayload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}

// Servicio de Auth
export const authService = new Elysia({ prefix: '/auth' })
  // Registro de nueva organización
  .post('/register', async ({ body, set }) => {
    const { email, password, name, organizationName } = body;
    
    try {
      // Verificar si el email ya existe
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        set.status = 400;
        return { error: 'Email already registered' };
      }
      
      // Crear organización y usuario en una transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear organización
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
          }
        });
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Crear usuario como OWNER
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            role: 'OWNER',
            organizationId: organization.id
          }
        });
        
        return { user, organization };
      });
      
      // Generar tokens
      const tokens = generateTokens({
        userId: result.user.id,
        organizationId: result.organization.id,
        role: result.user.role,
        email: result.user.email
      });
      
      // Crear sesión
      await prisma.session.create({
        data: {
          userId: result.user.id,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
        }
      });
      
      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          slug: result.organization.slug
        },
        tokens
      };
      
    } catch (error) {
      set.status = 500;
      return { error: 'Registration failed' };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 8 }),
      name: t.String(),
      organizationName: t.String()
    })
  })
  
  // Login
  .post('/login', async ({ body, set }) => {
    const { email, password } = body;
    
    try {
      // Buscar usuario con organización
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });
      
      if (!user || !user.isActive) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }
      
      // Verificar password
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        set.status = 401;
        return { error: 'Invalid credentials' };
      }
      
      // Generar tokens
      const tokens = generateTokens({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
        email: user.email
      });
      
      // Crear sesión
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          plan: user.organization.plan
        },
        tokens
      };
      
    } catch (error) {
      set.status = 500;
      return { error: 'Login failed' };
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String()
    })
  })
  
  // Refresh token
  .post('/refresh', async ({ body, set }) => {
    const { refreshToken } = body;
    
    try {
      // Verificar refresh token
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload;
      
      // Buscar sesión
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true }
      });
      
      if (!session || session.expiresAt < new Date()) {
        set.status = 401;
        return { error: 'Invalid refresh token' };
      }
      
      // Generar nuevos tokens
      const tokens = generateTokens({
        userId: payload.userId,
        organizationId: payload.organizationId,
        role: payload.role,
        email: payload.email
      });
      
      // Actualizar sesión
      await prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      
      return { tokens };
      
    } catch (error) {
      set.status = 401;
      return { error: 'Invalid refresh token' };
    }
  }, {
    body: t.Object({
      refreshToken: t.String()
    })
  })
  
  // Logout
  .post('/logout', async ({ headers, set }) => {
    const token = headers.authorization?.split(' ')[1];
    
    if (!token) {
      set.status = 401;
      return { error: 'No token provided' };
    }
    
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      // Eliminar todas las sesiones del usuario
      await prisma.session.deleteMany({
        where: { userId: payload.userId }
      });
      
      return { success: true };
      
    } catch (error) {
      set.status = 401;
      return { error: 'Invalid token' };
    }
  }); 