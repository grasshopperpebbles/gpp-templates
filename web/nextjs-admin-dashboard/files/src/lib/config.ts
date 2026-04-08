/**
 * Feature Flags Configuration
 *
 * Control which features are enabled in your application.
 * Features can be toggled via environment variables or hardcoded.
 *
 * Usage:
 *   import { features } from '@/lib/config';
 *   if (features.auth) { ... }
 */

export const features = {
  /**
   * API Integration - Enable API client and data fetching
   * Automatically enabled when NEXT_PUBLIC_API_BASE_URL is set
   */
  api: !!process.env.NEXT_PUBLIC_API_BASE_URL,

  /**
   * Search - Enable search functionality
   * Always available by default
   */
  search: true,

  /**
   * Export - Enable data export (CSV, PDF, etc.)
   * Always available by default
   */
  export: true,

  /**
   * Dark Mode - Enable theme switching
   * Always available by default
   */
  darkMode: true,

  /**
   * Settings Page - Enable user settings/preferences
   * Always available by default
   */
  settings: true,
} as const;

/**
 * API Configuration
 */
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  timeout: 30000,
  retries: 3,
} as const;

/**
 * App Configuration
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Web App",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "A modern web application",
  version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
} as const;
