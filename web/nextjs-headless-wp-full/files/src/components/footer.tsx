'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SITE_CONFIG } from '@/lib/config'
import { getSiteOptions, getCopyrightText, type SiteOptions } from '@/lib/site-options'
import { Facebook, Instagram, Twitter, Mail, CreditCard, Lock, Truck, RefreshCcw, Youtube, Linkedin } from 'lucide-react'

const footerNavigation = {
  shop: [
    { name: 'All Products', href: '/products' },
    { name: 'Categories', href: '/products/categories' },
    { name: 'New Arrivals', href: '/products/new-arrivals' },
    { name: 'Sale', href: '/products/sale' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Shipping Info', href: '/shipping' },
    { name: 'Returns', href: '/returns' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Accessibility', href: '/accessibility' },
  ],
}

export function Footer() {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [siteOptions, setSiteOptions] = useState<SiteOptions | null>(null)

  // Fetch site options on mount
  useEffect(() => {
    getSiteOptions().then(setSiteOptions).catch(console.error)
  }, [])

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubscribing(true)
    setSubscribeMessage(null)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (result.success) {
        setSubscribeMessage({ type: 'success', text: result.message })
        setEmail('')
      } else {
        setSubscribeMessage({ type: 'error', text: result.message })
      }
    } catch {
      setSubscribeMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' })
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand - Replace with your own logo */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              {/* TODO: Add your logo here */}
              {/* Example: <Image src="/logos/your-logo.svg" alt="Your Store" width={120} height={48} className="h-12 w-auto" /> */}
              <span className="text-xl font-bold">My Store</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              {SITE_CONFIG.description}
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@example.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h3 className="font-semibold">Shop</h3>
            <ul className="space-y-2">
              {footerNavigation.shop.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2">
              {footerNavigation.support.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <ul className="space-y-2">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="lg:col-span-4 mt-8">
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="max-w-md mx-auto text-center">
              <h3 className="font-semibold text-lg mb-2">Stay in the Loop</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get the latest designs and exclusive offers delivered to your inbox
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={isSubscribing}>
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
              {subscribeMessage && (
                <p
                  className={`text-sm mt-2 ${
                    subscribeMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {subscribeMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Trust Badges & Payment Icons */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>Free Shipping $50+</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4" />
              <span>30-Day Returns</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">We accept:</span>
            <div className="flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Visa</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">Mastercard</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">PayPal</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            {siteOptions ? getCopyrightText(siteOptions, SITE_CONFIG.name) : `© ${new Date().getFullYear()} ${SITE_CONFIG.name}. All rights reserved.`}
          </div>
        </div>
      </div>
    </footer>
  )
}