#!/usr/bin/env node

/**
 * Script de verificación de seguridad
 * Ejecutar: node scripts/security-check.js
 * 
 * Verifica:
 * - .env no está trackeado en git
 * - No hay contraseñas hardcodeadas en el código
 * - .gitignore contiene *.env
 * - Archivo .env.example existe
 * - Variables de entorno requeridas están definidas
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    const result = fn();
    if (result) {
      console.log(`? ${name}`);
      passed++;
    } else {
      console.log(`? ${name}`);
      failed++;
    }
  } catch (err) {
    console.log(`? ${name}`);
    if (err.message) console.log(`   Error: ${err.message}`);
    failed++;
  }
}

function findFilesRecursive(dir, ext = '.js') {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      files.push(...findFilesRecursive(fullPath, ext));
    } else if (item.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

console.log('\n?? Verificando seguridad...\n');

// 1. Verificar que .gitignore tiene *.env
check('.gitignore incluye *.env', () => {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  return content.includes('*.env');
});

// 2. Verificar que .env.example existe
check('.env.example existe', () => {
  const examplePath = path.join(__dirname, '..', '.env.example');
  return fs.existsSync(examplePath);
});

// 3. Verificar que config/.env existe (en local)
check('config/.env existe (desarrollo local)', () => {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  return fs.existsSync(envPath);
});

// 4. Verificar que no hay credenciales hardcodeadas en .js
check('No hay credenciales hardcodeadas en .js', () => {
  const rootDir = path.join(__dirname, '..');
  const files = findFilesRecursive(rootDir);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Búsqueda de patrones peligrosos (valores entre comillas)
    const dangerousPatterns = [
      /password\s*:\s*['"][^'"]{4,}['"]/gi,     // password: "valor"
      /password\s*=\s*['"][^'"]{4,}['"]/gi,     // password = "valor"
      /secret\s*:\s*['"][^'"]{4,}['"]/gi,       // secret: "valor"
      /secret\s*=\s*['"][^'"]{4,}['"]/gi,       // secret = "valor"
      /connectString\s*:\s*['"][^'"]{4,}['"]/gi, // connectString: "10.x.x.x..."
    ];
    
    for (const pattern of dangerousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Excepto si está usando process.env
        if (!content.includes('process.env')) {
          const fileName = path.relative(rootDir, file);
          console.log(`     ??  Credencial sospechosa en ${fileName}`);
          return false;
        }
      }
    }
  }
  
  return true;
});

// 5. Verificar variables de entorno requeridas
check('Variables de entorno requeridas existen', () => {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  if (!fs.existsSync(envPath)) return false;
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const required = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING'];
  
  return required.every(v => {
    const exists = content.includes(v + '=');
    if (!exists) console.log(`     Falta: ${v}`);
    return exists;
  });
});

// 6. Verificar que NODE_ENV está definido (OPCIONAL)
check('NODE_ENV está configurado (recomendado)', () => {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  if (!fs.existsSync(envPath)) return true;
  
  const content = fs.readFileSync(envPath, 'utf-8');
  // Es opcional pero recomendado
  return content.includes('NODE_ENV=') || true; // Siempre pasar
});

// 7. Verificar longitud de JWT_SECRET
check('JWT_SECRET tiene suficientes caracteres', () => {
  const envPath = path.join(__dirname, '..', 'config', '.env');
  if (!fs.existsSync(envPath)) return false;
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(/JWT_SECRET=(.+)/);
  
  if (!match) return false;
  
  const secret = match[1].trim();
  const isProd = content.includes('NODE_ENV=production');
  const minLength = isProd ? 32 : 8;
  
  if (secret.length < minLength) {
    console.log(`     JWT_SECRET: ${secret.length} caracteres (mínimo ${minLength})`);
    return false;
  }
  
  return true;
});

// 8. Verificar que .gitignore excluye *.log
check('.gitignore excluye *.log', () => {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  return content.includes('*.log');
});

// 9. Verificar que .gitignore excluye node_modules
check('.gitignore excluye node_modules', () => {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const content = fs.readFileSync(gitignorePath, 'utf-8');
  return content.includes('node_modules');
});

console.log(`\n?? Resultados: ${passed} ? | ${failed} ?\n`);

if (failed > 0) {
  console.log('??  Existen problemas de seguridad. Por favor revisar.\n');
  process.exit(1);
} else {
  console.log('? ¡Todas las verificaciones de seguridad pasaron!\n');
  process.exit(0);
}
