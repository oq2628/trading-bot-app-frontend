/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Origin of the backend API, without a trailing slash.
   *
   * Empty string means "same origin as the page", which is how production is
   * deployed: the reverse proxy serves the built frontend and forwards /api/*
   * to the backend. Development sets it to the local uvicorn origin.
   */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
