const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validar que JWT_SECRET existe y tiene longitud mínima
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no configurada en .env');
}

// En producción, requerir JWT_SECRET más seguro (64+ caracteres)
if (NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener mínimo 32 caracteres en producción');
}

/**
 * Extrae el token Bearer del header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token sin 'Bearer ' o null si no existe
 */
function extractBearerToken(authHeader) {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Extrae y verifica el token JWT del contexto de Apollo
 * @param {Object} context - Contexto de Apollo (contiene headers)
 * @returns {Object} Datos decodificados del token
 * @throws Error si el token es inválido o no existe
 */
function getTokenFromContext(context) {
  const authHeader = context.req?.headers?.authorization || '';
  const token = extractBearerToken(authHeader);

  if (!token) {
    const isDev = process.env.NODE_ENV !== 'production';
    const message = isDev 
      ? 'Token no proporcionado. Usa: Authorization: Bearer <token>'
      : 'Token no proporcionado';
    throw new Error(message);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    }
    
    if (isDev) {
      throw new Error(`Token inválido: ${err.message}`);
    }
    throw new Error('Token inválido');
  }
}

/**
 * Genera un token JWT con bearer format
 * @param {string} username - Nombre del usuario
 * @returns {string} Token JWT firmado
 */
function generateToken(username) {
  return jwt.sign(
    { user: username, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Middleware para proteger resolvers que requieren autenticación
 * @param {Function} resolver - Función resolver a proteger
 * @returns {Function} Resolver protegido
 */
function requireAuth(resolver) {
  return (parent, args, context, info) => {
    try {
      const user = getTokenFromContext(context);
      context.user = user;
      return resolver(parent, args, context, info);
    } catch (err) {
      throw new Error(`No autorizado: ${err.message}`);
    }
  };
}

module.exports = {
  JWT_SECRET,
  getTokenFromContext,
  generateToken,
  requireAuth,
  extractBearerToken,
};
