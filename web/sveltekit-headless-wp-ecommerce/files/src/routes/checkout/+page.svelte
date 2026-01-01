<script lang="ts">
  import { cart } from "$lib/stores/cart";

  let formData = $state({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
</script>

<svelte:head>
  <title>Checkout | My Store</title>
  <meta name="description" content="Complete your purchase" />
</svelte:head>

<section class="py-16">
  <div class="container mx-auto px-4">
    <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
      Checkout
    </h1>

    {#if $cart.isEmpty}
      <div class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400 mb-4">Your cart is empty</p>
        <a
          href="/products"
          class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Continue Shopping
        </a>
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Shipping Information
          </h2>

          <form class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                bind:value={formData.email}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                required
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  bind:value={formData.firstName}
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  bind:value={formData.lastName}
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                id="address"
                bind:value={formData.address}
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                required
              />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div>
                <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  bind:value={formData.city}
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label for="state" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  id="state"
                  bind:value={formData.state}
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label for="zip" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ZIP
                </label>
                <input
                  type="text"
                  id="zip"
                  bind:value={formData.zip}
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div class="pt-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Payment
              </h2>
              <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <p class="text-gray-600 dark:text-gray-400">
                  Payment integration coming soon. Connect Stripe or your preferred payment provider.
                </p>
              </div>
            </div>

            <button
              type="submit"
              class="w-full px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors mt-6"
            >
              Place Order
            </button>
          </form>
        </div>

        <div>
          <div class="border border-gray-200 dark:border-gray-800 rounded-lg p-6 sticky top-24">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>

            <div class="space-y-4 mb-6">
              {#each $cart.contents.nodes as item}
                <div class="flex gap-3">
                  <div class="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {#if item.product.node.image?.sourceUrl}
                      <img
                        src={item.product.node.image.sourceUrl}
                        alt={item.product.node.name}
                        class="w-full h-full object-cover"
                      />
                    {/if}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {item.product.node.name}
                    </p>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              {/each}
            </div>

            <div class="space-y-3 border-t border-gray-200 dark:border-gray-800 pt-4">
              <div class="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{$cart.subtotal}</span>
              </div>
              <div class="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>
              <div class="border-t border-gray-200 dark:border-gray-800 pt-3 flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{$cart.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</section>
