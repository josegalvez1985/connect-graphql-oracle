const authTypeDefs = require('./resolvers/auth.graphql.js');

const schema = `#graphql
  ${authTypeDefs}
`;

module.exports = schema;
