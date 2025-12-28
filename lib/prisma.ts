import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set. Check your .env.local file.')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

export { getPrismaClient }

// For backwards compatibility
export const prisma = {
  get user() { return getPrismaClient().user },
  get document() { return getPrismaClient().document },
  get folder() { return getPrismaClient().folder },
  get settings() { return getPrismaClient().settings },
}
