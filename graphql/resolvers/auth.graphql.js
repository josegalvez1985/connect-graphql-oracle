const typeDefs = `#graphql
  type AuthResponse {
    success: Boolean!
    message: String
    token: String
  }

  type Query {
    health: String
  }

  type Mutation {
    autenticar(username: String!, password: String!, cod_empresa: String): AuthResponse
  }
`;

module.exports = typeDefs;
