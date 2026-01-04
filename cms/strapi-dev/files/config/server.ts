export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('STRAPI_URL', 'http://localhost:1338'),
  app: {
    keys: env.array('APP_KEYS', [env('STRAPI_APP_KEY', '')]),
  },
  admin: {
    url: env('STRAPI_ADMIN_URL', '/admin'),
  },
  logger: {
    updates: {
      enabled: false, // Replaces STRAPI_DISABLE_UPDATE_NOTIFICATION
    },
  },
});

