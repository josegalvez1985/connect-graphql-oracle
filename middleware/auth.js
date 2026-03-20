const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no configurada en .env');
}

/**
 * Extrae y verifica el token JWT del contexto de Apollo
 * @param {Object} context - Contexto de Apollo (contiene headers)
 * @returns {Object} Datos decodificados del token
 * @throws Error si el token es inválido o no existe
 */
function getTokenFromContext(context) {
  const authHeader = context.req?.headers?.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    throw new Error('Token no proporcionado');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Genera un token JWT
 * @param {string} username - Nombre del usuario
 * @returns {string} Token JWT firmado
 */
function generateToken(username) {
  return jwt.sign({ user: username }, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = {
  JWT_SECRET,
  getTokenFromContext,
  generateToken,
};
