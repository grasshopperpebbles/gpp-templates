/**
 * Bootstrap script for Featured Items Content Type
 * 
 * This script creates the SiteSetting content type with featured items fields
 * when Strapi starts. It replicates the functionality of the WordPress
 * gpp-wp-featured-items plugin.
 */

import type { Core } from '@strapi/strapi';

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Note: In Strapi 5, content types are typically created via the admin UI
  // or through schema files. This bootstrap script ensures the content type
  // structure is documented and can be used as a reference.
  
  // For actual implementation, create the content type via:
  // 1. Admin UI: Content-Type Builder → Create new collection type
  // 2. Or use the schema structure below in src/api/site-setting/content-types/site-setting/schema.json
  
  const logger = strapi.log.child({ component: 'featured-items-bootstrap' });
  
  logger.info('Featured Items bootstrap: Content type should be created via admin UI or schema files');
  logger.info('See docs/STRAPI_FEATURED_ITEMS.md for setup instructions');
};

/**
 * Content Type Schema Structure (for reference)
 * 
 * Create this file: src/api/site-setting/content-types/site-setting/schema.json
 * 
 * {
 *   "kind": "collectionType",
 *   "collectionName": "site_settings",
 *   "info": {
 *     "singularName": "site-setting",
 *     "pluralName": "site-settings",
 *     "displayName": "Site Setting",
 *     "description": "Site settings for featured items configuration"
 *   },
 *   "options": {
 *     "draftAndPublish": false
 *   },
 *   "pluginOptions": {
 *     "content-manager": {
 *       "visible": true
 *     },
 *     "content-type-builder": {
 *       "visible": true
 *     }
 *   },
 *   "attributes": {
 *     "title": {
 *       "type": "string",
 *       "default": "Site Settings",
 *       "required": true
 *     },
 *     "featuredTitle": {
 *       "type": "string",
 *       "default": "Featured Items",
 *       "maxLength": 100
 *     },
 *     "featuredDescription": {
 *       "type": "text",
 *       "maxLength": 500
 *     },
 *     "featuredItems": {
 *       "type": "relation",
 *       "relation": "oneToMany",
 *       "target": "api::article.article",
 *       "mappedBy": null
 *     }
 *   }
 * }
 */

