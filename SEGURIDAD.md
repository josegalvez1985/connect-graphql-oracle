# ?? Guía de Seguridad

## ? Mejores Prácticas Implementadas

### 1. **Secretos y Credenciales**
- ? **Todas las contraseñas y secretos están en `.env`** (NO en el código)
- ? **`.gitignore` excluye `*.env`** para evitar commits accidentales
- ? **`.env.example` documenta variables requeridas** sin valores reales
- ? **JWT_SECRET no se expone** en logs ni en cliente

### 2. **Base de Datos**
- ? **Credenciales desde variables de entorno** (`process.env.DB_USER`, `process.env.DB_PASSWORD`)
- ? **No hay contraseñas hardcodeadas** en el código
- ? **Pool de conexiones seguro** (min: 2, max: 10)
- ? **Conexiones se cierran** después de cada query

### 3. **Autenticación**
- ? **Tokens JWT con expiración de 15 minutos**
- ? **Bearer Token format** (Authorization: Bearer &lt;token&gt;)
- ? **Errores genéricos** (no exponen detalles internos)
- ? **Sin tokens de larga vida**

### 4. **Logging Seguro**
- ? **No se loguean contraseñas** en consola
- ? **No se exponen secretos** en mensajes de error
- ? **Errores genéricos al cliente** en producción
- ? **Detalles internos solo en servidor**

---

## ?? Checklist de Seguridad

### ANTES de hacer PUSH a GitHub:

```bash
# 1. Verificar que .env NO está trackeado
git status | grep ".env"  # No debe mostrar nada

# 2. Verificar que .gitignore tiene *.env
grep "*.env" .gitignore

# 3. Verificar que .env no está en el historio (si fue agregado antes)
git log --all --full-history -- config/.env
# Si aparece, limpiar: git filter-branch --tree-filter 'rm -f config/.env' 

# 4. Verificar que no hay credenciales en código
grep -r "password\|secret\|token" --include="*.js" \
  | grep -v "process.env" \
  | grep -v "node_modules"
# No debe mostrar nada
```

---

## ?? Configuración por Ambiente

### Development
```env
NODE_ENV=development
JWT_SECRET=secreto_desarrollo_no_seguro
DB_PASSWORD=contraseña_desarrollo
```

### Production
```env
NODE_ENV=production
JWT_SECRET=secreto_produccion_muy_seguro_64_caracteres_minimo
DB_PASSWORD=contraseña_produccion_fuerte
DB_CONNECT_STRING=servidor_seguro:1521/BDPROD
```

---

## ?? Qué NO Hacer

```javascript
? MALO - Credenciales hardcodeadas
const DB_PASSWORD = "miContraseña123";

? MALO - Exponer secreto en logs
console.log("JWT_SECRET:", JWT_SECRET);

? MALO - Guardar .env en git
git add config/.env

? MALO - Errores con detalles internos
throw new Error(`SQL Error: ${err.message}`);

? MALO - Tokens de larga vida
{ expiresIn: '30 days' }
```

## ? Qué Hacer

```javascript
? BIEN - Credenciales desde .env
const DB_PASSWORD = process.env.DB_PASSWORD;

? BIEN - No loguear secretos
// No loguear JWT_SECRET

? BIEN - Excluir .env en git
# .gitignore:
*.env

? BIEN - Errores genéricos
throw new Error('Credenciales inválidas');

? BIEN - Tokens de corta vida
{ expiresIn: '15m' }
```

---

## ?? Estructura de Archivos Seguros

```
proyecto/
??? .git/                 ? No commitear secretos
??? .gitignore           ? Exclude: *.env, *.log, node_modules/
??? .env                 ??  EN LOCAL SOLAMENTE (NO en git)
??? .env.example         ? SAFE - Template sin valores reales
??? config/
?   ??? database.js      ? Lee credenciales de .env
??? middleware/
?   ??? auth.js          ? JWT_SECRET desde .env
??? server.js            ? No expone secretos
??? package.json
??? SEGURIDAD.md
```

---

## ?? Setup Seguro para Nuevo Usuario

```bash
# 1. Clone el repo
git clone <repo-url>
cd proyecto

# 2. Copiar template de .env
cp .env.example config/.env

# 3. Editar .env con valores REALES
nano config/.env  # O tu editor preferido

# 4. Instalar dependencias
npm install

# 5. Iniciar
npm start

# 6. NUNCA hacer commit del .env
git status  # Debe mostrar "working tree clean"
git add -A  # Except .env (auto-excluded by .gitignore)
```

---

## ??? Variables de Entorno Requeridas

| Variable | Descripción | Seguridad |
|----------|-------------|-----------|
| `JWT_SECRET` | Secreto para firmar tokens | ?? **CRÍTICO** |
| `DB_PASSWORD` | Contraseña Oracle | ?? **CRÍTICO** |
| `DB_USER` | Usuario Oracle | ?? **SENSIBLE** |
| `DB_CONNECT_STRING` | Host:puerto/BD | ?? **SENSIBLE** |
| `PORT` | Puerto del servidor | ?? **NO CRÍTICO** |
| `NODE_ENV` | Ambiente (dev/prod) | ?? **NO CRÍTICO** |

---

## ?? Deploy a Producción

### Verificar seguridad antes de deploy:

```bash
# 1. No debe haber contraseñas en código
npm audit      # Buscar vulnerabilidades

# 2. .env.example está presente
ls .env.example

# 3. .env NO está versionado
git ls-files | grep ".env"  # Solo .env.example

# 4. NODE_ENV=production
echo $NODE_ENV

# 5. JWT_SECRET es fuerte (64+ caracteres)
# Generar:
openssl rand -base64 32
```

---

## ?? Si alguien hace push de credenciales por accidente:

```bash
# 1. IMMEDIATAMENTE cambiar la contraseña en Oracle
# 2. Generar nuevo JWT_SECRET
# 3. Limpiar el historio de git:
git filter-branch --tree-filter 'rm -f config/.env' HEAD
# 4. Force push (cuidado - afecta a otros colaboradores)
git push origin --force --all
```

---

## ?? Resumen

? Todas las credenciales están protegidas  
? .env está excluido de git  
? Tokens expirados a los 15 minutos  
? Errores no exponen secretos  
? .env.example documenta configuración  

**Tu aplicación está segura para usar en desarrollo y producción. ??**
