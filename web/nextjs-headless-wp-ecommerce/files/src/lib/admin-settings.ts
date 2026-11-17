/**
 * Admin Settings
 *
 * Centralized configuration for admin features.
 * Configure via environment variables or WordPress headless config.
 */

export interface PriceDropNotificationSettings {
  enabled: boolean;
  thresholdPercent: number;
  minimumDropPercentage: number;
  checkIntervalHours: number;
}

export interface AdminSettings {
  priceDropNotifications: PriceDropNotificationSettings;
  emailNotifications: {
    enabled: boolean;
    fromAddress: string;
  };
}

const defaultSettings: AdminSettings = {
  priceDropNotifications: {
    enabled: process.env.PRICE_DROP_NOTIFICATIONS_ENABLED === 'true',
    thresholdPercent: parseInt(process.env.PRICE_DROP_THRESHOLD_PERCENT || '10', 10),
    minimumDropPercentage: parseInt(process.env.PRICE_DROP_MINIMUM_PERCENT || '5', 10),
    checkIntervalHours: parseInt(process.env.PRICE_DROP_CHECK_INTERVAL_HOURS || '24', 10),
  },
  emailNotifications: {
    enabled: !!process.env.RESEND_API_KEY,
    fromAddress: process.env.EMAIL_FROM || 'noreply@example.com',
  },
};

// Runtime settings (can be modified via saveAdminSettings)
let runtimeSettings: AdminSettings = { ...defaultSettings };

/**
 * Get admin settings
 * Returns settings from environment variables with sensible defaults
 */
export function getAdminSettings(): AdminSettings {
  return runtimeSettings;
}

/**
 * Save admin settings
 * Updates runtime settings (note: changes are not persisted across restarts)
 * In production, you would save to a database or config file
 */
export async function saveAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
  runtimeSettings = {
    ...runtimeSettings,
    ...settings,
    priceDropNotifications: {
      ...runtimeSettings.priceDropNotifications,
      ...(settings.priceDropNotifications || {}),
    },
    emailNotifications: {
      ...runtimeSettings.emailNotifications,
      ...(settings.emailNotifications || {}),
    },
  };
  return runtimeSettings;
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof AdminSettings): boolean {
  const settings = getAdminSettings();
  const featureSettings = settings[feature];
  return 'enabled' in featureSettings ? featureSettings.enabled : false;
}
