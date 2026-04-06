const oracledb = require('oracledb');
const oracledb_config = require('../../config/database');
const { generateToken } = require('../../middleware/auth');

const authResolvers = {
  Query: {
    health: () => 'OK',
  },
  Mutation: {
    autenticar: async (_, { username, password, cod_empresa }) => {
      // Usar cod_empresa '01' por defecto si no se proporciona
      const empresa = cod_empresa || '01';

      // Paso 1: Intentar conectar con credenciales del usuario (autenticacion DB)
      let conn;
      try {
        conn = await oracledb.getConnection({
          user: username,
          password,
          connectString: oracledb_config.DB_CONFIG.connectString,
        });
        await conn.close();
      } catch (err) {
        return { success: false, message: 'Credenciales invalidas', token: null };
      }

      // Paso 2: Si la conexion fue exitosa, obtener datos del usuario desde AZPATEB.USUARIOS
      try {
        const r = await oracledb_config.query(
          'SELECT COD_USUARIO FROM AZPATEB.USUARIOS WHERE UPPER(COD_USUARIO) = UPPER(:u) OR UPPER(USUARIO) = UPPER(:u)',
          { u: username }
        );
        const row = r.rows && r.rows[0] ? r.rows[0] : null;

        if (!row) {
          return { success: false, message: 'Usuario no encontrado', token: null };
        }

        // Generar token JWT
        const token = generateToken(username);
        return { success: true, message: 'Autenticacion exitosa', token };
      } catch (err) {
        return { success: false, message: 'Error en autenticacion', token: null };
      }
    },
  },
};

module.exports = authResolvers;