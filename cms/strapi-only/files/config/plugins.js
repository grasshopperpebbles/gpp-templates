module.exports = ({ env }) => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      landingPage: false,
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: { tracing: false },
    },
  },
  i18n: { enabled: true },
  'users-permissions': { enabled: true },
  upload: { config: {} },
});
