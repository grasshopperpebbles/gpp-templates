<script lang="ts">
  import { formatPrice, stripHtml } from "$lib/utils";
  import { addToCart } from "$lib/woocommerce";
  import { setCart } from "$lib/stores/cart";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
  const { product } = data;

  let quantity = $state(1);
  let isAdding = $state(false);
  let selectedImage = $state(product.image?.sourceUrl || "");

  async function handleAddToCart() {
    isAdding = true;
    try {
      const cart = await addToCart(product.databaseId, quantity);
      setCart(cart);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      isAdding = false;
    }
  }

  const allImages = $derived([
    ...(product.image ? [product.image] : []),
    ...(product.galleryImages?.nodes || []),
  ]);
</script>

<svelte:head>
  <title>{product.name} | My Store</title>
  <meta name="description" content={stripHtml(product.shortDescription || product.description || "").slice(0, 160)} />
</svelte:head>

<section class="py-16">
  <div class="container mx-auto px-4">
    <div class="mb-8">
      <a
        href="/products"
        class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Products
      </a>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div class="space-y-4">
        <div class="aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
          {#if selectedImage}
            <img
              src={selectedImage}
              alt={product.name}
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full flex items-center justify-center">
              <svg class="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          {/if}
        </div>

        {#if allImages.length > 1}
          <div class="flex gap-2 overflow-x-auto">
            {#each allImages as image}
              <button
                type="button"
                onclick={() => selectedImage = image.sourceUrl}
                class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors {selectedImage === image.sourceUrl ? 'border-brand-600' : 'border-transparent'}"
              >
                <img
                  src={image.sourceUrl}
                  alt={image.altText || product.name}
                  class="w-full h-full object-cover"
                />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="space-y-6">
        {#if product.productCategories?.nodes?.length}
          <a
            href="/category/{product.productCategories.nodes[0].slug}"
            class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {product.productCategories.nodes[0].name}
          </a>
        {/if}

        <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
          {product.name}
        </h1>

        <div class="flex items-center gap-4">
          {#if product.onSale && product.regularPrice}
            <span class="text-gray-500 dark:text-gray-400 line-through text-xl">
              {formatPrice(product.regularPrice)}
            </span>
            <span class="text-brand-600 dark:text-brand-400 font-bold text-2xl">
              {formatPrice(product.salePrice || product.price || "0")}
            </span>
            <span class="bg-brand-600 text-white text-sm font-bold px-2 py-1 rounded">
              Sale
            </span>
          {:else if product.price}
            <span class="text-gray-900 dark:text-white font-bold text-2xl">
              {formatPrice(product.price)}
            </span>
          {/if}
        </div>

        {#if product.stockStatus}
          <div class="flex items-center gap-2">
            {#if product.stockStatus === "IN_STOCK"}
              <span class="w-2 h-2 bg-green-500 rounded-full"></span>
              <span class="text-green-600 dark:text-green-400 text-sm font-medium">In Stock</span>
            {:else}
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
              <span class="text-red-600 dark:text-red-400 text-sm font-medium">Out of Stock</span>
            {/if}
          </div>
        {/if}

        {#if product.shortDescription}
          <div class="text-gray-600 dark:text-gray-400 prose dark:prose-invert">
            {@html product.shortDescription}
          </div>
        {/if}

        <div class="flex items-center gap-4">
          <div class="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg">
            <button
              type="button"
              onclick={() => quantity = Math.max(1, quantity - 1)}
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              -
            </button>
            <span class="px-4 py-2 text-gray-900 dark:text-white font-medium">
              {quantity}
            </span>
            <button
              type="button"
              onclick={() => quantity++}
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onclick={handleAddToCart}
            disabled={isAdding || product.stockStatus === "OUT_OF_STOCK"}
            class="flex-1 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isAdding}
              Adding...
            {:else}
              Add to Cart
            {/if}
          </button>
        </div>

        {#if product.description}
          <div class="pt-6 border-t border-gray-200 dark:border-gray-800">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
            <div class="text-gray-600 dark:text-gray-400 prose dark:prose-invert max-w-none">
              {@html product.description}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>
