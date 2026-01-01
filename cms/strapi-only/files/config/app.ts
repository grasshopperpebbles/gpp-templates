export default ({ env }) => ({
  name: env('APP_NAME', 'Strapi CMS'),
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', [env('STRAPI_APP_KEY', '')]),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

