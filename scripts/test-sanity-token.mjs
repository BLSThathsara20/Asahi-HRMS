import { readFileSync } from 'fs'
import { createClient } from '@sanity/client'

function loadEnv() {
  const env = readFileSync('.env', 'utf8')
  const get = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()
  return {
    projectId: get('VITE_SANITY_PROJECT_ID'),
    dataset: get('VITE_SANITY_DATASET') || 'production',
    token: get('VITE_SANITY_TOKEN'),
  }
}

const { projectId, dataset, token } = loadEnv()

if (!projectId || !token) {
  console.error('❌ Missing VITE_SANITY_PROJECT_ID or VITE_SANITY_TOKEN in .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

console.log(`Testing token for project ${projectId}, dataset ${dataset}...`)
console.log(`Token starts with: ${token.slice(0, 10)}...`)

let tokenUser
try {
  const res = await fetch(`https://${projectId}.api.sanity.io/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  tokenUser = await res.json()
  console.log(`Token identity: ${tokenUser.name}`)
  console.log(`Token role: ${tokenUser.role}`)
} catch {
  console.log('Could not inspect token identity')
}

try {
  await client.fetch('count(*[_type == "systemUser"])')
  console.log('✅ READ permission: OK')
} catch (e) {
  console.error('❌ READ permission: FAILED —', e.message)
  process.exit(1)
}

try {
  const doc = await client.create({
    _type: 'systemUser',
    email: `token-test-${Date.now()}@test.local`,
    firstName: 'Token',
    lastName: 'Test',
    role: 'super_admin',
    passwordHash: 'test',
    isActive: true,
    createdAt: new Date().toISOString(),
  })
  await client.delete(doc._id)
  console.log('✅ WRITE permission: OK — token can create documents')
  console.log('You can now run: npm run dev')
} catch (e) {
  console.error('❌ WRITE permission: FAILED')
  console.error('')
  if (tokenUser?.role === 'custom') {
    console.error('⚠️  Your token has role "custom" — it was not assigned Developer correctly.')
  }
  console.error('On this Sanity project, API tokens need the Developer role:')
  console.error('  • Editor tokens are READ-ONLY for API (despite the label)')
  console.error('  • Viewer tokens are READ-ONLY')
  console.error('  • Developer tokens can create/update/delete')
  console.error('')
  console.error('Fix steps:')
  console.error('  1. sanity.io/manage → EMP Managment → API → Tokens')
  console.error('  2. DELETE all existing tokens (Website editor, empt managment, etc.)')
  console.error('  3. Add API token → select Developer → Save')
  console.error('  4. Copy the token from the yellow box (shown only once!)')
  console.error('  5. Paste into .env as VITE_SANITY_TOKEN= (no quotes, one line)')
  console.error('  6. Run: npm run test:sanity')
  process.exit(1)
}
