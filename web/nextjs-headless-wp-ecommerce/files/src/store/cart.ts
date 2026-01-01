import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  graphqlClient,
  ADD_TO_CART,
  UPDATE_ITEM_QUANTITIES,
  REMOVE_ITEMS_FROM_CART,
  EMPTY_CART,
  GET_CART,
  APPLY_COUPON,
  REMOVE_COUPONS,
  type AddToCartResponse,
  type UpdateItemQuantitiesResponse,
  type RemoveItemsFromCartResponse,
  type EmptyCartResponse,
  type CartResponse,
  type ApplyCouponResponse,
  type RemoveCouponsResponse,
  type Cart as WooCommerceCart,
  type CartItem as WooCommerceCartItem,
  type AppliedCoupon,
} from '@/lib/graphql'

export interface CartItem {
  id: number
  name: string
  slug: string
  price: string
  quantity: number
  image?: string
  itemKey?: string // WooCommerce cart item key
}

export interface CartState {
  items: CartItem[]
  cartKey?: string
  isOpen: boolean
  isLoading: boolean
  isHydrating: boolean
  loadingProductIds: Record<number, boolean> // Track which products are being added/updated
  userHasModifiedCart: boolean // Flag to track if user has made any cart modifications
  error?: string
  isHydrated: boolean

  // Coupon state
  appliedCoupons: AppliedCoupon[]
  discountTotal: string
  discountTax: string
  isCouponLoading: boolean
  couponError?: string

  // Actions
  addItem: (item: Omit<CartItem, 'quantity' | 'itemKey'>, quantity?: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  setCartKey: (key: string) => void
  setIsOpen: (isOpen: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setIsHydrating: (isHydrating: boolean) => void
  setUserHasModifiedCart: (modified: boolean) => void
  addLoadingProduct: (id: number) => void
  removeLoadingProduct: (id: number) => void
  setError: (error?: string) => void
  setItems: (items: CartItem[]) => void
  setIsHydrated: (isHydrated: boolean) => void

  // Coupon actions
  setAppliedCoupons: (coupons: AppliedCoupon[]) => void
  setDiscountTotal: (total: string) => void
  setDiscountTax: (tax: string) => void
  setIsCouponLoading: (loading: boolean) => void
  setCouponError: (error?: string) => void

  // Computed values
  getTotalItems: () => number
  getTotalPrice: () => number
  getItemById: (id: number) => CartItem | undefined
  isProductLoading: (id: number) => boolean
}

// Helper function to convert WooCommerce cart item to local CartItem
function convertWooCartItem(wooItem: WooCommerceCartItem): CartItem {
  return {
    id: wooItem.product.node.databaseId,
    name: wooItem.product.node.name,
    slug: wooItem.product.node.slug,
    price: wooItem.product.node.price,
    quantity: wooItem.quantity,
    image: wooItem.product.node.image?.sourceUrl || undefined,
    itemKey: wooItem.key,
  }
}

// Helper type for cart with coupon data
interface CartWithCoupons {
  contents: { nodes: WooCommerceCartItem[] }
  appliedCoupons: AppliedCoupon[] | null
  discountTotal: string
  discountTax: string
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartKey: undefined,
      isOpen: false,
      isLoading: false,
      isHydrating: false,
      loadingProductIds: {},
      userHasModifiedCart: false,
      error: undefined,
      isHydrated: false,

      // Coupon initial state
      appliedCoupons: [],
      discountTotal: '0',
      discountTax: '0',
      isCouponLoading: false,
      couponError: undefined,

      addItem: (item, quantity = 1) => {
        const { items } = get()
        const existingItem = items.find(i => i.id === item.id)

        if (existingItem) {
          set({
            items: items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
            error: undefined,
            userHasModifiedCart: true,
          })
        } else {
          set({
            items: [...items, { ...item, quantity }],
            error: undefined,
            userHasModifiedCart: true,
          })
        }
      },

      removeItem: (id) => {
        set(state => ({
          items: state.items.filter(item => item.id !== id),
          error: undefined,
          userHasModifiedCart: true,
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          ),
          error: undefined,
          userHasModifiedCart: true,
        }))
      },

      clearCart: () => {
        set({
          items: [],
          cartKey: undefined,
          error: undefined,
          userHasModifiedCart: true,
        })
      },

      setCartKey: (key) => {
        set({ cartKey: key })
      },

      setIsOpen: (isOpen) => {
        set({ isOpen })
      },

      setIsLoading: (isLoading) => {
        set({ isLoading })
      },

      setIsHydrating: (isHydrating) => {
        set({ isHydrating })
      },

      setUserHasModifiedCart: (modified) => {
        set({ userHasModifiedCart: modified })
      },

      addLoadingProduct: (id) => {
        set((state) => ({
          loadingProductIds: { ...state.loadingProductIds, [id]: true }
        }))
      },

      removeLoadingProduct: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.loadingProductIds
          return { loadingProductIds: rest }
        })
      },

      setError: (error) => {
        set({ error })
      },

      setItems: (items) => {
        set({ items, error: undefined })
      },

      setIsHydrated: (isHydrated) => {
        set({ isHydrated })
      },

      // Coupon actions
      setAppliedCoupons: (coupons) => {
        set({ appliedCoupons: coupons })
      },

      setDiscountTotal: (total) => {
        set({ discountTotal: total })
      },

      setDiscountTax: (tax) => {
        set({ discountTax: tax })
      },

      setIsCouponLoading: (loading) => {
        set({ isCouponLoading: loading })
      },

      setCouponError: (error) => {
        set({ couponError: error })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = parseFloat(item.price) || 0
          return total + (price * item.quantity)
        }, 0)
      },

      getItemById: (id) => {
        return get().items.find(item => item.id === id)
      },

      isProductLoading: (id) => {
        return !!get().loadingProductIds[id]
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cartKey: state.cartKey,
        userHasModifiedCart: state.userHasModifiedCart,
      }),
    }
  )
)

// Initialize session token from localStorage on client-side
if (typeof window !== 'undefined') {
  const sessionToken = localStorage.getItem('woocommerce-session')
  if (sessionToken) {
    graphqlClient.setSessionToken(sessionToken)
  }
}

// Helper hook for cart operations with WooCommerce API integration
export const useCart = () => {
  const store = useCartStore()

  // Hydrate cart from WooCommerce backend on mount
  const hydrateCart = async () => {
    if (store.isHydrated) return

    try {
      store.setIsHydrating(true)
      store.setIsHydrated(true)

      const response = await graphqlClient.query<CartResponse>(GET_CART)

      // NEVER update cart if user has modified it
      // This prevents hydration from overwriting user actions
      if (!store.userHasModifiedCart) {
        if (response.cart && !response.cart.isEmpty) {
          const items = response.cart.contents.nodes.map(convertWooCartItem)
          store.setItems(items)
        }
      }

    } catch (error) {
      console.error('Failed to hydrate cart:', error)
    } finally {
      store.setIsHydrating(false)
    }
  }

  const addToCart = async (product: Omit<CartItem, 'quantity' | 'itemKey'>, quantity = 1) => {
    try {
      store.addLoadingProduct(product.id)
      store.setError(undefined)

      // Optimistic update - add to local store immediately
      store.addItem(product, quantity)

      // Re-enable button immediately after optimistic update (standard e-commerce UX)
      // Backend sync happens in background
      store.removeLoadingProduct(product.id)

      // Sync with WooCommerce backend in background (don't await)
      graphqlClient.query<AddToCartResponse>(
        ADD_TO_CART,
        {
          productId: product.id,
          quantity,
        }
      ).then((response) => {
        // Update local state with server response (includes itemKey) only if valid
        if (response.addToCart?.cart && response.addToCart.cart.contents.nodes.length > 0) {
          const items = response.addToCart.cart.contents.nodes.map(convertWooCartItem)
          store.setItems(items)
          // Backend sync complete - reset flag to allow future hydrations
          store.setUserHasModifiedCart(false)
        }
      }).catch((error) => {
        // Revert the optimistic update on error
        store.removeItem(product.id)
        store.setError(error instanceof Error ? error.message : 'Failed to add item to cart')
        console.error('Failed to sync cart with backend:', error)
      })

    } catch (error) {
      // Handle immediate errors
      store.removeItem(product.id)
      store.removeLoadingProduct(product.id)
      store.setError(error instanceof Error ? error.message : 'Failed to add item to cart')
      throw error
    }
  }

  const removeFromCart = async (id: number) => {
    try {
      store.setIsLoading(true)
      store.setError(undefined)

      // Get the item before removing for potential rollback
      const item = store.getItemById(id)
      if (!item) return

      // Optimistic update
      store.removeItem(id)

      // Sync with WooCommerce backend if we have the itemKey
      if (item.itemKey) {
        const response = await graphqlClient.query<RemoveItemsFromCartResponse>(
          REMOVE_ITEMS_FROM_CART,
          {
            keys: [item.itemKey],
          }
        )

        // Update local state with server response
        if (response.removeItemsFromCart?.cart) {
          const items = response.removeItemsFromCart.cart.contents.nodes.map(convertWooCartItem)
          store.setItems(items)
          // Backend sync complete - reset flag to allow future hydrations
          store.setUserHasModifiedCart(false)
        }
      }

    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to remove item from cart')
      // Re-hydrate cart to sync with backend state
      await hydrateCart()
      throw error
    } finally {
      store.setIsLoading(false)
    }
  }

  const updateCartQuantity = async (id: number, quantity: number) => {
    try {
      store.setIsLoading(true)
      store.setError(undefined)

      const item = store.getItemById(id)
      if (!item) return

      const previousQuantity = item.quantity

      // Optimistic update
      store.updateQuantity(id, quantity)

      // Sync with WooCommerce backend if we have the itemKey
      if (item.itemKey) {
        const response = await graphqlClient.query<UpdateItemQuantitiesResponse>(
          UPDATE_ITEM_QUANTITIES,
          {
            items: [
              {
                key: item.itemKey,
                quantity,
              },
            ],
          }
        )

        // Update local state with server response
        if (response.updateItemQuantities?.cart) {
          const items = response.updateItemQuantities.cart.contents.nodes.map(convertWooCartItem)
          store.setItems(items)
          // Backend sync complete - reset flag to allow future hydrations
          store.setUserHasModifiedCart(false)
        }
      }

    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to update quantity')
      // Re-hydrate cart to sync with backend state
      await hydrateCart()
      throw error
    } finally {
      store.setIsLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      store.setIsLoading(true)
      store.setError(undefined)

      // Optimistic update
      store.clearCart()

      // Sync with WooCommerce backend
      await graphqlClient.query<EmptyCartResponse>(EMPTY_CART)

      // Clear coupons as well
      store.setAppliedCoupons([])
      store.setDiscountTotal('0')
      store.setDiscountTax('0')

      // Backend sync complete - reset flag to allow future hydrations
      store.setUserHasModifiedCart(false)

    } catch (error) {
      store.setError(error instanceof Error ? error.message : 'Failed to clear cart')
      throw error
    } finally {
      store.setIsLoading(false)
    }
  }

  // Helper to update store from cart response with coupon data
  const updateCartFromResponse = (cart: CartWithCoupons) => {
    const items = cart.contents.nodes.map(convertWooCartItem)
    store.setItems(items)
    store.setAppliedCoupons(cart.appliedCoupons || [])
    store.setDiscountTotal(cart.discountTotal || '0')
    store.setDiscountTax(cart.discountTax || '0')
    store.setUserHasModifiedCart(false)
  }

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      store.setIsCouponLoading(true)
      store.setCouponError(undefined)

      const response = await graphqlClient.query<ApplyCouponResponse>(
        APPLY_COUPON,
        { code: code.toUpperCase().trim() }
      )

      if (response.applyCoupon?.cart) {
        updateCartFromResponse(response.applyCoupon.cart)
        return true
      }

      return false
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply coupon'
      store.setCouponError(message)
      return false
    } finally {
      store.setIsCouponLoading(false)
    }
  }

  const removeCoupon = async (code: string): Promise<boolean> => {
    try {
      store.setIsCouponLoading(true)
      store.setCouponError(undefined)

      const response = await graphqlClient.query<RemoveCouponsResponse>(
        REMOVE_COUPONS,
        { codes: [code] }
      )

      if (response.removeCoupons?.cart) {
        updateCartFromResponse(response.removeCoupons.cart)
        return true
      }

      return false
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove coupon'
      store.setCouponError(message)
      return false
    } finally {
      store.setIsCouponLoading(false)
    }
  }

  return {
    ...store,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    hydrateCart,
    applyCoupon,
    removeCoupon,
  }
}
