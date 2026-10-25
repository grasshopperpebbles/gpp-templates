/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL, e.g. http://localhost:8000/api/v1 (see src/lib/api.ts). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
