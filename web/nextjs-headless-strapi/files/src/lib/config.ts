// Environment configuration
export const WC_CONSUMER_KEY = process.env.WC_CONSUMER_KEY || 'your_consumer_key_here'
export const WC_CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || 'your_consumer_secret_here'

export const SITE_CONFIG = {
  name: 'My Store',
  description: 'Your headless WordPress/WooCommerce store description goes here.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004',
  ogImage: '/og-image.jpg',
  links: {
    twitter: 'https://twitter.com',
    github: 'https://github.com',
  },
}

export const API_CONFIG = {
  graphql: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080/graphql',
  woocommerce: process.env.NEXT_PUBLIC_WP_API_URL || 'http://localhost:8080/wp-json/wc/v3',
  wordpress: process.env.NEXT_PUBLIC_WP_API_URL?.replace('/wc/v3', '') || 'http://localhost:8080/wp-json/wp/v2',
}

export const DEFAULT_CURRENCY = 'USD'
export const DEFAULT_CURRENCY_SYMBOL = '$'

export const PRODUCTS_PER_PAGE = 12
export const RELATED_PRODUCTS_COUNT = 4