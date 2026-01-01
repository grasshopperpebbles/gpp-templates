<script lang="ts">
  import { onMount } from "svelte";
  import { cart, setCart } from "$lib/stores/cart";
  import { getCart, removeFromCart, updateCartQuantity } from "$lib/woocommerce";
  import { formatPrice } from "$lib/utils";

  let isLoading = $state(true);

  onMount(async () => {
    try {
      const cartData = await getCart();
      setCart(cartData);
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      isLoading = false;
    }
  });

  async function handleRemove(key: string) {
    try {
      const cartData = await removeFromCart([key]);
      setCart(cartData);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  }

  async function handleUpdateQuantity(key: string, quantity: number) {
    if (quantity < 1) return;
    try {
      const cartData = await updateCartQuantity([{ key, quantity }]);
      setCart(cartData);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  }
</script>

<svelte:head>
  <title>Cart | My Store</title>
  <meta name="description" content="Your shopping cart" />
</svelte:head>

<section class="py-16">
  <div class="container mx-auto px-4">
    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
      Shopping Cart
    </h1>

    {#if isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if $cart.isEmpty}
      <div class="text-center py-12">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
        <a
          href="/products"
          class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-4">
          {#each $cart.contents.nodes as item}
            <div class="flex gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
              <div class="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                {#if item.product.node.image?.sourceUrl}
                  <img
                    src={item.product.node.image.sourceUrl}
                    alt={item.product.node.name}
                    class="w-full h-full object-cover"
                  />
                {/if}
              </div>

              <div class="flex-1 min-w-0">
                <a
                  href="/products/{item.product.node.slug}"
                  class="font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400"
                >
                  {item.product.node.name}
                </a>
                <p class="text-gray-600 dark:text-gray-400">
                  {formatPrice(item.product.node.price)}
                </p>

                <div class="flex items-center gap-4 mt-2">
                  <div class="flex items-center border border-gray-300 dark:border-gray-700 rounded">
                    <button
                      type="button"
                      onclick={() => handleUpdateQuantity(item.key, item.quantity - 1)}
                      class="px-2 py-1 text-gray-600 dark:text-gray-400"
                    >
                      -
                    </button>
                    <span class="px-3 py-1 text-gray-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onclick={() => handleUpdateQuantity(item.key, item.quantity + 1)}
                      class="px-2 py-1 text-gray-600 dark:text-gray-400"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onclick={() => handleRemove(item.key)}
                    class="text-red-600 dark:text-red-400 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <div class="lg:col-span-1">
          <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-6 sticky top-24">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>

            <div class="space-y-3 mb-6">
              <div class="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{$cart.subtotal}</span>
              </div>
              <div class="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div class="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{$cart.total}</span>
              </div>
            </div>

            <a
              href="/checkout"
              class="block w-full text-center px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Proceed to Checkout
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>
