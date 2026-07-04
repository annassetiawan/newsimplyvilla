import { db } from '@/lib/db'
import { ChannexClient } from './client'

export async function getChannexClient(villaId: string): Promise<ChannexClient | null> {
  const config = await db.channexConfig.findUnique({ where: { villaId } })
  if (!config || !config.isActive) return null
  return new ChannexClient(config.apiKey, config.environment as 'staging' | 'production')
}

export async function getChannexClientRequired(villaId: string): Promise<ChannexClient> {
  const client = await getChannexClient(villaId)
  if (!client) throw new Error(`Channex not configured or inactive for villa ${villaId}`)
  return client
}
