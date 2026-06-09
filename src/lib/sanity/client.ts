import { createClient, type SanityClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET ?? 'production'
const apiVersion = import.meta.env.VITE_SANITY_API_VERSION ?? '2024-01-01'
const token = import.meta.env.VITE_SANITY_TOKEN

export const isSanityConfigured = Boolean(projectId && projectId !== 'your_project_id')

let client: SanityClient | null = null

export function getSanityClient(): SanityClient {
  if (!isSanityConfigured) {
    throw new Error('Sanity is not configured. Copy .env.example to .env and add your project credentials.')
  }
  if (!client) {
    client = createClient({
      projectId: projectId!,
      dataset,
      apiVersion,
      token,
      useCdn: !token,
    })
  }
  return client
}
