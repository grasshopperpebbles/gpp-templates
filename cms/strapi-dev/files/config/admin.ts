export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', env('STRAPI_ADMIN_JWT_SECRET')),
    sessions: {
      // Strapi 5 expects values in milliseconds
      // 30 days = 30 * 24 * 60 * 60 * 1000 = 2592000000
      maxRefreshTokenLifespan: env.int('ADMIN_SESSION_MAX_REFRESH_LIFESPAN', 30 * 24 * 60 * 60 * 1000),
      // 7 days = 7 * 24 * 60 * 60 * 1000 = 604800000
      maxSessionLifespan: env.int('ADMIN_SESSION_MAX_LIFESPAN', 7 * 24 * 60 * 60 * 1000),
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', env('STRAPI_API_TOKEN_SALT')),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', env('STRAPI_TRANSFER_TOKEN_SALT')),
    },
  },
  url: env('ADMIN_URL', '/admin'),
  serveAdminPanel: env.bool('SERVE_ADMIN', true),
});

