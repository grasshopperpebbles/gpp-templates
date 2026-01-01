/* eslint-disable @typescript-eslint/no-explicit-any */
import { WC_CONSUMER_KEY, WC_CONSUMER_SECRET } from './config'

const WC_API_URL = process.env.NEXT_PUBLIC_WP_API_URL || 'http://localhost:8080/wp-json/wc/v3'

interface WooCommerceRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
}

class WooCommerceAPI {
  private baseURL: string
  private consumerKey: string
  private consumerSecret: string

  constructor(baseURL: string, consumerKey: string, consumerSecret: string) {
    this.baseURL = baseURL
    this.consumerKey = consumerKey
    this.consumerSecret = consumerSecret
  }

  private async request<T>(endpoint: string, config: WooCommerceRequestConfig = {}): Promise<T> {
    const { method = 'GET', body } = config
    
    const url = new URL(`${this.baseURL}${endpoint}`)
    url.searchParams.append('consumer_key', this.consumerKey)
    url.searchParams.append('consumer_secret', this.consumerSecret)

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WooCommerce API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  // Cart methods
  async createCart(): Promise<Cart> {
    return this.request<Cart>('/cart', { method: 'POST' })
  }

  async getCart(cartKey: string): Promise<Cart> {
    return this.request<Cart>(`/cart/${cartKey}`)
  }

  async addToCart(cartKey: string, productId: number, quantity: number = 1): Promise<CartItem> {
    return this.request<CartItem>(`/cart/${cartKey}/items`, {
      method: 'POST',
      body: {
        product_id: productId,
        quantity,
      },
    })
  }

  async updateCartItem(cartKey: string, itemKey: string, quantity: number): Promise<CartItem> {
    return this.request<CartItem>(`/cart/${cartKey}/items/${itemKey}`, {
      method: 'PUT',
      body: { quantity },
    })
  }

  async removeCartItem(cartKey: string, itemKey: string): Promise<void> {
    return this.request(`/cart/${cartKey}/items/${itemKey}`, { method: 'DELETE' })
  }

  async clearCart(cartKey: string): Promise<void> {
    return this.request(`/cart/${cartKey}/items`, { method: 'DELETE' })
  }

  // Order methods
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: orderData,
    })
  }

  async getOrder(orderId: number): Promise<Order> {
    return this.request<Order>(`/orders/${orderId}`)
  }

  // Product methods (for fallback)
  async getProducts(params: ProductQueryParams = {}): Promise<Product[]> {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.category) queryParams.append('category', params.category.toString())
    if (params.status) queryParams.append('status', params.status)

    const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<Product[]>(endpoint)
  }

  async getProduct(productId: number): Promise<Product> {
    return this.request<Product>(`/products/${productId}`)
  }
}

// Types
export interface Cart {
  cart_key: string
  cart_hash: string
  currency: {
    currency_code: string
    currency_symbol: string
    currency_minor_unit: number
    currency_decimal_separator: string
    currency_thousand_separator: string
    currency_prefix: string
    currency_suffix: string
  }
  customer: {
    billing_country: string
    shipping_country: string
  }
  items: CartItem[]
  item_count: number
  items_weight: number
  cross_sells: any[]
  needs_payment: boolean
  needs_shipping: boolean
  shipping: {
    total_packages: number
    show_package_details: boolean
    has_calculated_shipping: boolean
    packages: any[]
  }
  coupons: any[]
  fees: any[]
  taxes: any[]
  totals: {
    subtotal: string
    subtotal_tax: string
    fee_total: string
    fee_tax: string
    discount_total: string
    discount_tax: string
    shipping_total: string
    shipping_tax: string
    total: string
    total_tax: string
  }
}

export interface CartItem {
  item_key: string
  id: number
  name: string
  title: string
  price: string
  quantity: {
    value: number
    min_purchase: number
    max_purchase: number
  }
  totals: {
    subtotal: number
    subtotal_tax: number
    total: number
    tax: number
  }
  slug: string
  meta: {
    product_type: string
    sku: string
    dimensions: any
    weight: number
  }
  backorders: string
  cart_item_data: any[]
  featured_image: string
}

export interface CreateOrderData {
  payment_method: string
  payment_method_title: string
  set_paid: boolean
  billing: BillingAddress
  shipping: ShippingAddress
  line_items: LineItem[]
  shipping_lines?: ShippingLine[]
}

export interface BillingAddress {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postcode: string
  country: string
  email: string
  phone?: string
}

export interface ShippingAddress {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postcode: string
  country: string
}

export interface LineItem {
  product_id: number
  quantity: number
  variation_id?: number
}

export interface ShippingLine {
  method_id: string
  method_title: string
  total: string
}

export interface Order {
  id: number
  parent_id: number
  status: string
  currency: string
  version: string
  prices_include_tax: boolean
  date_created: string
  date_modified: string
  discount_total: string
  discount_tax: string
  shipping_total: string
  shipping_tax: string
  cart_tax: string
  total: string
  total_tax: string
  customer_id: number
  order_key: string
  billing: BillingAddress
  shipping: ShippingAddress
  payment_method: string
  payment_method_title: string
  transaction_id: string
  customer_ip_address: string
  customer_user_agent: string
  created_via: string
  customer_note: string
  date_completed: string | null
  date_paid: string | null
  cart_hash: string
  number: string
  meta_data: any[]
  line_items: OrderLineItem[]
  tax_lines: any[]
  shipping_lines: any[]
  fee_lines: any[]
  coupon_lines: any[]
  refunds: any[]
  payment_url: string
  is_editable: boolean
  needs_payment: boolean
  needs_processing: boolean
  date_created_gmt: string
  date_modified_gmt: string
  date_completed_gmt: string | null
  date_paid_gmt: string | null
  currency_symbol: string
}

export interface OrderLineItem {
  id: number
  name: string
  product_id: number
  variation_id: number
  quantity: number
  tax_class: string
  subtotal: string
  subtotal_tax: string
  total: string
  total_tax: string
  taxes: any[]
  meta_data: any[]
  sku: string
  price: number
  image: {
    id: string
    src: string
  }
  parent_name: string | null
}

export interface ProductQueryParams {
  page?: number
  per_page?: number
  search?: string
  category?: number
  status?: 'draft' | 'pending' | 'private' | 'publish'
}

export interface Product {
  id: number
  name: string
  slug: string
  permalink: string
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  type: string
  status: string
  featured: boolean
  catalog_visibility: string
  description: string
  short_description: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  date_on_sale_from: string | null
  date_on_sale_from_gmt: string | null
  date_on_sale_to: string | null
  date_on_sale_to_gmt: string | null
  on_sale: boolean
  purchasable: boolean
  total_sales: number
  virtual: boolean
  downloadable: boolean
  downloads: any[]
  download_limit: number
  download_expiry: number
  external_url: string
  button_text: string
  tax_status: string
  tax_class: string
  manage_stock: boolean
  stock_quantity: number | null
  backorders: string
  backorders_allowed: boolean
  backordered: boolean
  low_stock_amount: number | null
  sold_individually: boolean
  weight: string
  dimensions: {
    length: string
    width: string
    height: string
  }
  shipping_required: boolean
  shipping_taxable: boolean
  shipping_class: string
  shipping_class_id: number
  reviews_allowed: boolean
  average_rating: string
  rating_count: number
  upsell_ids: number[]
  cross_sell_ids: number[]
  parent_id: number
  purchase_note: string
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
  tags: any[]
  images: Array<{
    id: number
    date_created: string
    date_created_gmt: string
    date_modified: string
    date_modified_gmt: string
    src: string
    name: string
    alt: string
  }>
  attributes: any[]
  default_attributes: any[]
  variations: number[]
  grouped_products: number[]
  menu_order: number
  price_html: string
  related_ids: number[]
  meta_data: any[]
  stock_status: string
}

// Initialize the API client
export const wooCommerceAPI = new WooCommerceAPI(
  WC_API_URL,
  WC_CONSUMER_KEY,
  WC_CONSUMER_SECRET
)