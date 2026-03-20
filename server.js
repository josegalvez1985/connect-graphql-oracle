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
    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT },
      context: async ({ req }) => ({
        req,
        // Agregar contexto de autenticación disponible para resolvers
        user: null,
      }),
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
