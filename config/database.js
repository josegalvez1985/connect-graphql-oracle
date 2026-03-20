const oracledb = require('oracledb');
const fs = require('fs');

// ??? Oracle Client (thick) detection ??????????????????????????????????????
const oracleClientPaths = [
  'C:\\app\\Middleware\\Oracle_Home\\bin',
  'C:\\app\\Middleware\\Oracle_Home',
  'C:\\instantclient_21_0',
  process.env.ORACLE_HOME,
].filter(p => p && p !== 'undefined');

let thickMode = false;
for (const dir of oracleClientPaths) {
  try {
    if (fs.existsSync(dir)) {
      oracledb.initOracleClient({ libDir: dir });
      thickMode = true;
      break;
    }
  } catch (_) { /* ignore */ }
}

// ??? Database config (credenciales desde .env) ???????????????????????????
const DB_CONFIG = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
};

let pool;

async function initPool() {
  if (!DB_CONFIG.password) {
    throw new Error('DB_PASSWORD no configurada en .env');
  }
  pool = await oracledb.createPool({ ...DB_CONFIG, poolMin: 2, poolMax: 10 });
}

async function query(sql, binds = {}, opts = {}) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...opts,
    });
    return result;
  } finally {
    await conn.close();
  }
}

async function closePool() {
  if (pool) await pool.close();
}

module.exports = {
  get DB_CONFIG() {
    return { connectString: DB_CONFIG.connectString };
  },
  initPool,
  query,
  closePool,
};
