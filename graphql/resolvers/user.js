const { getNombrePorCodUsuario } = require('../../models/userModel');

const userResolvers = {
  Query: {
    nombreUsuario: async (_, __, context) => {
      if (!context.user) throw new Error('No autenticado');
      return await getNombrePorCodUsuario(context.user.user);
    },
    debugUsuario: async (_, __, context) => {
      if (!context.user) throw new Error('No autenticado');
      const row = await require('../../models/userModel').getUsuarioPorCodUsuario(context.user.user);
      return row ? JSON.stringify(row) : null;
    },
  },
};

module.exports = userResolvers;
