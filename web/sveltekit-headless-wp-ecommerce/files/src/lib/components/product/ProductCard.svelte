<script lang="ts">
  import type { Product } from "$lib/woocommerce";
  import { formatPrice, stripHtml, truncate } from "$lib/utils";

  interface Props {
    product: Product;
  }

  let { product }: Props = $props();
</script>

<article class="group">
  <a href="/products/{product.slug}" class="block">
    <div class="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-4 relative">
      {#if product.image?.sourceUrl}
        <img
          src={product.image.sourceUrl}
          alt={product.image.altText || product.name}
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      {:else}
        <div class="w-full h-full flex items-center justify-center">
          <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      {/if}

      {#if product.onSale}
        <span class="absolute top-2 left-2 bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded">
          Sale
        </span>
      {/if}

      {#if product.stockStatus === "OUT_OF_STOCK"}
        <span class="absolute top-2 right-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
          Sold Out
        </span>
      {/if}
    </div>

    <div class="space-y-2">
      {#if product.productCategories?.nodes?.length}
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
          {product.productCategories.nodes[0].name}
        </span>
      {/if}

      <h3 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {product.name}
      </h3>

      {#if product.shortDescription}
        <p class="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {truncate(stripHtml(product.shortDescription), 80)}
        </p>
      {/if}

      <div class="flex items-center gap-2">
        {#if product.onSale && product.regularPrice}
          <span class="text-gray-500 dark:text-gray-400 line-through text-sm">
            {formatPrice(product.regularPrice)}
          </span>
          <span class="text-brand-600 dark:text-brand-400 font-bold">
            {formatPrice(product.salePrice || product.price || "0")}
          </span>
        {:else if product.price}
          <span class="text-gray-900 dark:text-white font-bold">
            {formatPrice(product.price)}
          </span>
        {/if}
      </div>
    </div>
  </a>
</article>
