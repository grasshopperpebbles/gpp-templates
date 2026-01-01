import { browser } from "$app/environment";

export const config = {
  apiUrl: browser
    ? import.meta.env.VITE_API_URL || "http://localhost:3001"
    : process.env.VITE_API_URL || "http://localhost:3001",
  appName: "Admin Dashboard",
};
