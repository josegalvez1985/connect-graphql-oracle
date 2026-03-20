# ?? Autenticación Bearer Token JWT

## Descripción
El sistema utiliza **Bearer Token JWT (JSON Web Tokens)** para autenticación. Los tokens tienen una expiración de **15 minutos**.

---

## 1?? Obtener Token (Login)

### Mutation
```graphql
mutation {
  autenticar(
    username: "tu_usuario"
    password: "tu_contraseña"
    cod_empresa: "01"
  ) {
    success
    message
    token
  }
}
```

### Respuesta Exitosa
```json
{
  "data": {
    "autenticar": {
      "success": true,
      "message": "Autenticación exitosa",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

## 2?? Usar Token en Requests

### Formato del Header
```
Authorization: Bearer <token>
```

### Ejemplo con cURL
```bash
curl -X POST http://localhost:5000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"query":"{ health }"}'
```

### Ejemplo con Postman
1. Tab: **Headers**
2. Agregar:
   - **Key:** `Authorization`
   - **Value:** `Bearer <tu_token_aqui>`

### Ejemplo con JavaScript/Fetch
```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

fetch('http://localhost:5000/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: `{ health }`
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 3?? Proteger Resolvers

Para proteger un resolver con autenticación, usa el middleware `requireAuth`:

```javascript
// graphql/resolvers/usuarios.js
const { requireAuth } = require('../../middleware/auth');

const usuariosResolvers = {
  Query: {
    obtenerUsuarios: requireAuth(async (_, args, context) => {
      // context.user contiene { user: "username", iat: timestamp }
      const username = context.user.user;
      
      // Tu lógica aquí
      return usuariosList;
    }),
  },
};

module.exports = usuariosResolvers;
```

---

## 4?? Variables de Entorno

Asegúrate de tener en `config/.env`:

```env
JWT_SECRET=tuSecreto123!@#MúySuperSeguro
PORT=5000
NODE_ENV=development
```

?? **Importante:** `JWT_SECRET` debe ser complejo y único.

---

## 5?? Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Token no proporcionado` | Sin header Authorization | Enviar `Authorization: Bearer <token>` |
| `Token inválido` | Token malformado o corrupto | Obtener nuevo token |
| `Token expirado` | Token vencido (>15m) | Hacer login nuevamente |
| `No autorizado` | Acceso denegado | Verificar permisos |

---

## 6?? Flujo de Autenticación

```
???????????????
?   Cliente   ?
???????????????
       ?
       ? 1. autenticar(user, pass)
       ?
???????????????????????
?   GraphQL Server    ?
? (Valida credenciales)
???????????????????????
? Genera JWT Token    ?
???????????????????????
       ?
       ? 2. Devuelve { token }
       ?
???????????????
?   Cliente   ????? Almacena token
???????????????
       ?
       ? 3. Envía queries/mutations
       ?    + Header: Authorization: Bearer <token>
       ?
???????????????????????
?   GraphQL Server    ?
? (Verifica Token)    ?
???????????????????????
? Ejecuta query/mutation
???????????????????????
```

---

## 7?? Configuración en .env

```env
# Autenticación
JWT_SECRET=tu_secreto_muy_seguro_aqui

# Base de Datos Oracle
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_HOSTNAME=oracle_host
DB_PORT=1521
DB_DATABASE=tu_base_datos

# Servidor
PORT=5000
NODE_ENV=development
```

---

## ?? Notas Importantes

- ? Tokens de corta duración (15 min) por seguridad
- ? Validación en cada request protegido
- ? Tokens almacenados en memoria/localStorage del cliente
- ?? Nunca expongas `JWT_SECRET` en repositorios públicos
- ?? Siempre usa HTTPS en producción
- ?? Los tokens NO se pueden "renovar" (debes hacer login nuevamente cada 15 minutos)
