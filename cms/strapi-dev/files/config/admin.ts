export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', env('STRAPI_ADMIN_JWT_SECRET')),
    sessions: {
      maxRefreshTokenLifespan: env('ADMIN_SESSION_MAX_REFRESH_LIFESPAN', '30d'),
      maxSessionLifespan: env('ADMIN_SESSION_MAX_LIFESPAN', '7d'),
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

