export default ({ env }) => ({
  // GraphQL Plugin - Installed but disabled by default
  // Enable with: graphql: { enabled: true }
  graphql: {
    enabled: false,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: false,
      depthLimit: 7,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
      },
    },
  },

  // Email Plugin - Installed but disabled by default
  // Enable with: email: { enabled: true }
  // Configure with your email provider (SendGrid, AWS SES, etc.)
  email: {
    enabled: false,
    config: {
      provider: env('EMAIL_PROVIDER', 'sendmail'),
      providerOptions: {},
      settings: {
        defaultFrom: env('EMAIL_FROM', 'noreply@example.com'),
        defaultReplyTo: env('EMAIL_REPLY_TO', 'noreply@example.com'),
      },
    },
  },

  // Documentation Plugin - Installed but disabled by default
  // Enable with: documentation: { enabled: true }
  // Access at: http://localhost:1337/documentation
  documentation: {
    enabled: false,
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Strapi API Documentation',
        description: 'API documentation for Strapi CMS',
        contact: {
          name: 'API Support',
          email: 'api@example.com',
        },
        license: {
          name: 'MIT',
        },
      },
      servers: [
        {
          url: env('API_URL', 'http://localhost:1337'),
          description: 'Development server',
        },
      ],
      externalDocs: {
        description: 'Find out more',
        url: 'https://docs.strapi.io',
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  },

  // Sentry Plugin - Installed but disabled by default
  // Enable with: sentry: { enabled: true }
  // Configure with your Sentry DSN
  sentry: {
    enabled: false,
    config: {
      dsn: env('SENTRY_DSN', ''),
      init: {
        environment: env('NODE_ENV', 'development'),
        tracesSampleRate: 1.0,
      },
      sendMetadata: true,
    },
  },

  // Internationalization Plugin - Enabled by default (core feature)
  // Can be disabled if not needed
  i18n: {
    enabled: true,
  },

  // Users & Permissions Plugin - Enabled by default (core feature)
  // Required for authentication
  'users-permissions': {
    enabled: true,
  },

  // SEO Plugin - Installed but disabled by default
  // Enable with: seo: { enabled: true }
  // Adds SEO fields (meta title, description, OG tags) to content types
  seo: {
    enabled: false,
  },

  // Sitemap Plugin - Installed but disabled by default
  // Enable with: sitemap: { enabled: true }
  // Generates XML sitemaps for search engines
  sitemap: {
    enabled: false,
    config: {
      hostname: env('SITE_URL', 'http://localhost:1337'),
      limit: 45000,
      xsl: true,
      excludeDrafts: true,
    },
  },

  // Navigation Plugin - Installed but disabled by default
  // Enable with: navigation: { enabled: true }
  // Manages site navigation menus (header, footer, mobile)
  navigation: {
    enabled: false,
    config: {
      contentTypes: ['api::page.page', 'api::article.article'],
      contentTypesNameFields: {
        'api::page.page': ['title'],
        'api::article.article': ['title'],
      },
      allowedLevels: 2,
      gql: {
        navigationItemRelated: ['NavigationItem'],
      },
    },
  },

  // Comments Plugin - Installed but disabled by default
  // Enable with: comments: { enabled: true }
  // Advanced content moderation system for comments
  comments: {
    enabled: false,
    config: {
      enabledCollections: ['api::article.article'],
      badWords: false,
      moderatorRoles: ['Authenticated'],
      approvalFlow: ['api::article.article'],
      entryLabel: {
        '*': ['Title', 'title', 'Name', 'name', 'Subject', 'subject'],
      },
      reportReasons: {
        BAD_LANGUAGE: 'BAD_LANGUAGE',
        DISCRIMINATION: 'DISCRIMINATION',
        SPAM: 'SPAM',
        IRRELEVANT: 'IRRELEVANT',
      },
    },
  },

  // Config Sync Plugin - Installed but disabled by default
  // Enable with: 'config-sync': { enabled: true }
  // Syncs roles, permissions, content types across environments
  'config-sync': {
    enabled: false,
    config: {
      syncDir: 'config/sync',
      minify: false,
      soft: false,
      importOnBootstrap: false,
      customTypes: [],
      excludedTypes: [],
      excludedConfig: [],
    },
  },

  // Import Export Plugin - Installed but disabled by default
  // Enable with: 'import-export-entries': { enabled: true }
  // Enterprise data management for bulk imports/exports
  'import-export-entries': {
    enabled: false,
    config: {
      // Configuration handled via Admin Panel
    },
  },

  // CKEditor 5 Plugin - Enabled by default
  // Enhanced rich text editor with advanced formatting options
  // Replaces default Strapi rich text editor
  ckeditor: {
    enabled: true,
    config: {
      editor: {
        toolbar: {
          items: [
            'heading',
            '|',
            'bold',
            'italic',
            'link',
            'bulletedList',
            'numberedList',
            '|',
            'outdent',
            'indent',
            '|',
            'blockQuote',
            'insertTable',
            'mediaEmbed',
            '|',
            'undo',
            'redo',
          ],
        },
        heading: {
          options: [
            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
            { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
            { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
            { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
            { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
          ],
        },
        mediaEmbed: {
          previewsInData: true,
        },
      },
    },
  },

  // Upload Plugin - Configure cloud storage providers
  // AWS S3: Use strapi-provider-upload-aws-s3
  // Cloudinary: Use strapi-provider-upload-cloudinary
  // See config/plugins.ts.example for configuration examples
  // By default uses local filesystem storage
  upload: {
    config: {
      // Local filesystem (default)
      // For production, configure AWS S3 or Cloudinary
      // See plugins.ts.example for cloud storage configuration
    },
  },
});

