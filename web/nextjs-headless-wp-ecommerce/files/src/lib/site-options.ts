import { API_CONFIG } from './config'

export interface BlogOptions {
  name: string
  description: string
  postsPerPage: number
  defaultCategory: string
}

export interface SiteOptions {
  copyright: {
    name: string
    year: string
    text: string
  }
  contact: {
    email: string
    phone: string
  }
  social: {
    facebook: string
    instagram: string
    twitter: string
    youtube: string
    linkedin: string
    tiktok: string
  }
  blog: BlogOptions
  siteType: string
  homepageType: string
}

const defaultOptions: SiteOptions = {
  copyright: {
    name: '',
    year: new Date().getFullYear().toString(),
    text: `© ${new Date().getFullYear()} All rights reserved.`
  },
  contact: {
    email: '',
    phone: ''
  },
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    linkedin: '',
    tiktok: ''
  },
  blog: {
    name: '',
    description: '',
    postsPerPage: 10,
    defaultCategory: ''
  },
  siteType: 'ecommerce_cms',
  homepageType: 'products'
}

let cachedOptions: SiteOptions | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches site options from WordPress REST API
 * Results are cached for 5 minutes
 */
export async function getSiteOptions(): Promise<SiteOptions> {
  // Return cached options if still valid
  if (cachedOptions && Date.now() < cacheExpiry) {
    return cachedOptions
  }

  try {
    const baseUrl = API_CONFIG.wordpress.replace('/wp/v2', '')
    const response = await fetch(`${baseUrl}/headless/v1/site-options`, {
      next: { revalidate: 300 } // Cache for 5 minutes in Next.js
    })

    if (!response.ok) {
      console.warn('Failed to fetch site options, using defaults')
      return defaultOptions
    }

    const options = await response.json()
    cachedOptions = options
    cacheExpiry = Date.now() + CACHE_DURATION

    return options
  } catch (error) {
    console.warn('Error fetching site options:', error)
    return defaultOptions
  }
}

/**
 * Gets the copyright text for the footer
 * Falls back to a default format if API is unavailable
 */
export function getCopyrightText(options: SiteOptions, siteName: string): string {
  if (options.copyright.text) {
    return options.copyright.text
  }

  const startYear = options.copyright.year || new Date().getFullYear().toString()
  const currentYear = new Date().getFullYear().toString()
  const name = options.copyright.name || siteName

  if (startYear === currentYear) {
    return `© ${currentYear} ${name}. All rights reserved.`
  }

  return `© ${startYear}-${currentYear} ${name}. All rights reserved.`
}

/**
 * Filters social links to only include non-empty ones
 */
export function getActiveSocialLinks(options: SiteOptions): { platform: string; url: string }[] {
  const links: { platform: string; url: string }[] = []

  if (options.social.facebook) links.push({ platform: 'facebook', url: options.social.facebook })
  if (options.social.instagram) links.push({ platform: 'instagram', url: options.social.instagram })
  if (options.social.twitter) links.push({ platform: 'twitter', url: options.social.twitter })
  if (options.social.youtube) links.push({ platform: 'youtube', url: options.social.youtube })
  if (options.social.linkedin) links.push({ platform: 'linkedin', url: options.social.linkedin })
  if (options.social.tiktok) links.push({ platform: 'tiktok', url: options.social.tiktok })

  return links
}
