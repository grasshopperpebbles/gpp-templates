import { writable } from "svelte/store";
import { browser } from "$app/environment";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
}

function createAuthStore() {
  const storedUser = browser ? localStorage.getItem("user") : null;
  const initialUser = storedUser ? JSON.parse(storedUser) : null;

  const { subscribe, set, update } = writable<User | null>(initialUser);

  return {
    subscribe,
    login: (user: User) => {
      if (browser) {
        localStorage.setItem("user", JSON.stringify(user));
      }
      set(user);
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      set(null);
    },
    update: (fn: (user: User | null) => User | null) => update(fn),
  };
}

export const user = createAuthStore();
