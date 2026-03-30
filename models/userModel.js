const oracledb = require('oracledb');
const db = require('../config/database');

async function getNombrePorCodUsuario(cod_usuario) {
  const sql = `SELECT b.nombre FROM AZPATEB.USUARIOS a, personas b WHERE a.cod_persona = b.cod_persona AND UPPER(a.cod_usuario) = UPPER(:cod_usuario)`;
  const result = await db.query(sql, { cod_usuario });
  if (result && result.rows && result.rows.length > 0) {
    const row = result.rows[0];
    return row.NOMBRE || row.nombre || null;
  }
  return null;
}

module.exports = { getNombrePorCodUsuario };

async function getUsuarioPorCodUsuario(cod_usuario) {
  const sql = `SELECT b.* FROM AZPATEB.USUARIOS a, personas b WHERE a.cod_persona = b.cod_persona AND UPPER(a.cod_usuario) = UPPER(:cod_usuario)`;
  const result = await module.exports.query ? await module.exports.query(sql, { cod_usuario }) : await require('../config/database').query(sql, { cod_usuario });
  if (result && result.rows && result.rows.length > 0) {
    return result.rows[0];
  }
  return null;
}

module.exports.getUsuarioPorCodUsuario = getUsuarioPorCodUsuario;
