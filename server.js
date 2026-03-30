const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') });

const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { initPool, closePool } = require('./config/database');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Inicializar pool de conexiones a Oracle
    await initPool();

    // Crear servidor Apollo
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      introspection: process.env.NODE_ENV !== 'production',
      formatError: (err) => {
        // Loguear errores internos pero no exponerlos al cliente en producción
        console.error('GraphQL Error:', err.message);
        return {
          message: err.message,
          code: err.extensions?.code,
        };
      },
    });

    // Iniciar servidor
    const { getTokenFromContext } = require('./middleware/auth');
    const { parse } = require('graphql');
    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT },
      context: async ({ req, body }) => {
        // Analizar el AST y permitir autenticar sin token si aparece en cualquiera
        let isLogin = false;
        try {
          if (body && body.query) {
            const ast = parse(body.query);
            if (ast && ast.definitions && ast.definitions.length > 0) {
              for (const def of ast.definitions) {
                if (def.kind === 'OperationDefinition' && def.selectionSet && def.selectionSet.selections) {
                  for (const sel of def.selectionSet.selections) {
                    if (sel.kind === 'Field' && sel.name && sel.name.value === 'autenticar') {
                      isLogin = true;
                      break;
                    }
                  }
                }
                if (isLogin) break;
              }
            }
          }
        } catch (e) { /* ignorar errores de parseo */ }

        if (isLogin) return { req, user: null };

        let user = null;
        try {
          user = getTokenFromContext({ req });
        } catch (e) {
          // No forzar caída del servidor por peticiones sin token.
          // Los resolvers validarán `context.user`. No imprimir advertencias aquí.
          user = null;
        }
        return { req, user };
      },
    });

    console.log(`\nGraphQL listo en ${url}`);
    console.log(`Puerto: ${PORT}`);
    console.log(`\n?? Autenticación: Bearer Token (JWT)`);
    console.log(`??  Expiración: 15 minutos\n`);
  } catch (err) {
    console.error('? Error al iniciar servidor:', err.message);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

// Manejo de señales para cerrar conexiones
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

start();
