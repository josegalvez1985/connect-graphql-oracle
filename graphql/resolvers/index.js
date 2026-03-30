const authResolvers = require('./auth');
const userResolvers = require('./user');

// Combinar todos los resolvers

const resolvers = {
  Query: {
    ...(authResolvers.Query || {}),
    ...(userResolvers.Query || {}),
  },
  Mutation: {
    ...(authResolvers.Mutation || {}),
    ...(userResolvers.Mutation || {}),
  },
};

module.exports = resolvers;
