export function formatSanityError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('Insufficient permissions') && message.includes('create')) {
    return 'Sanity token lacks write permission. Delete old tokens, create a new Developer API token (Editor is read-only for API on this project), update VITE_SANITY_TOKEN in .env, run npm run test:sanity, then restart the dev server.'
  }

  if (message.includes('Insufficient permissions')) {
    return 'Sanity token lacks required permissions. Use an Editor or Administrator API token in your .env file.'
  }

  return message
}
