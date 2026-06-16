interface ImportMetaEnv {
  readonly NODE_ENV: string;
  readonly PUBLIC_PROD_OVERRIDE: string;
  readonly FRONTEND_LOCAL_PORT: string;
  readonly WIX_API_KEY: string;
  readonly WIX_SITE_ID: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
