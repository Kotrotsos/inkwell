import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Load environment variables synchronously before config
import { config } from 'dotenv'
config({ path: path.resolve(__dirname, '..', '.env.local') })
config({ path: path.resolve(__dirname, '..', '.env') })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment')
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),

  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { Pool } = await import('pg')
      const pool = new Pool({ connectionString: databaseUrl })
      return new PrismaPg(pool)
    },
  },

  datasource: {
    url: databaseUrl,
  },
})
