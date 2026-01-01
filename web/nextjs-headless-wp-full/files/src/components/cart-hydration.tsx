'use client'

import { useEffect } from 'react'
import { useCart } from '@/store/cart'

/**
 * CartHydration component
 *
 * Loads cart from WooCommerce backend on app mount.
 * This ensures cart state is synced with the server when the user
 * visits the site, maintaining cart persistence across devices/sessions.
 */
export function CartHydration() {
  const { hydrateCart, isHydrated } = useCart()

  useEffect(() => {
    if (!isHydrated) {
      hydrateCart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  // This component doesn't render anything
  return null
}
