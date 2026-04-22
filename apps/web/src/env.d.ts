/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly NITRO_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
