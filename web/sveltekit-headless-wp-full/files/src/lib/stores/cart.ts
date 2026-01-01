import { writable } from "svelte/store";
import type { Cart } from "$lib/woocommerce";

const emptyCart: Cart = {
  contents: { nodes: [] },
  subtotal: "$0.00",
  total: "$0.00",
  isEmpty: true,
};

export const cart = writable<Cart>(emptyCart);

export function setCart(newCart: Cart) {
  cart.set(newCart);
}

export function getCartItemCount(cartData: Cart): number {
  return cartData.contents.nodes.reduce((sum, item) => sum + item.quantity, 0);
}
