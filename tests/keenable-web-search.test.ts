/**
 * Run: npx tsx --test tests/keenable-web-search.test.ts
 * Set KEENABLE_LIVE=1 to also hit the real keyless endpoint.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type IncomingMessage } from 'node:http'
import type { AddressInfo } from 'node:net'
import { KeenableWebSearchTool, getAllBaseTools } from '../src/index.js'

interface Seen { method?: string; url?: string; headers: IncomingMessage['headers']; body: any }

async function withServer(
  reply: (seen: Seen) => { status?: number; body: unknown },
  run: (seen: Seen[]) => Promise<void>,
) {
  const seen: Seen[] = []
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      const entry: Seen = { method: req.method, url: req.url, headers: req.headers, body: raw ? JSON.parse(raw) : undefined }
      seen.push(entry)
      const { status = 200, body } = reply(entry)
      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(typeof body === 'string' ? body : JSON.stringify(body))
    })
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const prev = { base: process.env.KEENABLE_API_BASE, key: process.env.KEENABLE_API_KEY }
  process.env.KEENABLE_API_BASE = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  try {
    await run(seen)
  } finally {
    server.close()
    if (prev.base === undefined) delete process.env.KEENABLE_API_BASE
    else process.env.KEENABLE_API_BASE = prev.base
    if (prev.key === undefined) delete process.env.KEENABLE_API_KEY
    else process.env.KEENABLE_API_KEY = prev.key
  }
}

const ctx = { cwd: process.cwd() } as any

test('is opt-in: not part of the default tool set', () => {
  assert.equal(getAllBaseTools().some((t) => t.name === 'KeenableWebSearch'), false)
  assert.equal(KeenableWebSearchTool.isReadOnly(), true)
})

test('keyless search posts to /v1/search/public with X-Keenable-Title', async () => {
  delete process.env.KEENABLE_API_KEY
  await withServer(() => ({
    body: { results: [
      { title: 'Tokio', url: 'https://tokio.rs/', snippet: ' async runtime ' },
      { title: '', url: 'https://example.com/b', description: 'desc b' },
      { title: 'no url' },
    ] },
  }), async (seen) => {
    const out = await KeenableWebSearchTool.call({ query: ' tokio ', num_results: 99 }, ctx)
    assert.equal(out.is_error, false)
    assert.equal(seen[0].method, 'POST')
    assert.equal(seen[0].url, '/v1/search/public')
    assert.equal(seen[0].headers['x-keenable-title'], 'open-agent-sdk-typescript')
    assert.equal(seen[0].headers['x-api-key'], undefined)
    assert.deepEqual(seen[0].body, { query: 'tokio', max_results: 20 })
    assert.equal(out.content,
      'Untrusted web search results:\n\n1. Tokio\n   https://tokio.rs/\n   async runtime\n\n2. (untitled)\n   https://example.com/b\n   desc b')
  })
})

test('KEENABLE_API_KEY switches to the keyed endpoint', async () => {
  await withServer(() => ({ body: { results: [] } }), async (seen) => {
    process.env.KEENABLE_API_KEY = 'test-key'
    const out = await KeenableWebSearchTool.call({ query: 'rust' }, ctx)
    assert.equal(seen[0].url, '/v1/search')
    assert.equal(seen[0].headers['x-api-key'], 'test-key')
    assert.equal(seen[0].headers['x-keenable-title'], undefined)
    assert.deepEqual(seen[0].body, { query: 'rust', max_results: 5 })
    assert.equal(out.content, 'No results found for "rust"')
  })
})

test('HTTP errors and empty queries are tool errors', async () => {
  delete process.env.KEENABLE_API_KEY
  await withServer(() => ({ status: 429, body: '{"error":"rate limited"}' }), async () => {
    const out = await KeenableWebSearchTool.call({ query: 'x' }, ctx)
    assert.equal(out.is_error, true)
    assert.match(String(out.content), /HTTP 429/)
  })
  const empty = await KeenableWebSearchTool.call({ query: '   ' }, ctx)
  assert.equal(empty.is_error, true)
})

test('live keyless search', { skip: !process.env.KEENABLE_LIVE }, async () => {
  delete process.env.KEENABLE_API_KEY
  delete process.env.KEENABLE_API_BASE
  const out = await KeenableWebSearchTool.call({ query: 'tokio rust async runtime', num_results: 3 }, ctx)
  assert.equal(out.is_error, false, String(out.content))
  assert.match(String(out.content), /https?:\/\//)
})
