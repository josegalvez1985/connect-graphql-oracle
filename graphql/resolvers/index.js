const authResolvers = require('./auth');

// Combinar todos los resolvers
const resolvers = {
  Query: {
    ...(authResolvers.Query || {}),
  },
  Mutation: {
    ...(authResolvers.Mutation || {}),
  },
};

module.exports = resolvers;
