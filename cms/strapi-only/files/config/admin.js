module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', env('STRAPI_ADMIN_JWT_SECRET')),
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
