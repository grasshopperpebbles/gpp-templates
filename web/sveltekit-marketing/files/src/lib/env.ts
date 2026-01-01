import { env } from "$env/dynamic/public";

export const SITE_NAME = env.PUBLIC_SITE_NAME ?? "Your Site";
export const SITE_DESCRIPTION = env.PUBLIC_SITE_DESCRIPTION ?? "Your site description";
export const SITE_URL = env.PUBLIC_SITE_URL ?? "https://yoursite.dev";
export const API_BASE_URL = env.PUBLIC_API_BASE_URL ?? "";
