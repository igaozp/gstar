import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/utils/db/schema.ts',
  out: './server/utils/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_PATH ?? './data/gstar.db',
  },
})
