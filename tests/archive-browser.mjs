// Run: node tests/archive-browser.mjs
// Requires local Chrome (or CHROME_PATH). No external services or production data.
import { rolldown } from 'rolldown'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const mocks = {
  'firebase/auth': 'export const onAuthStateChanged = (_, callback) => { window.archiveTest.listeners.add(callback); return () => window.archiveTest.listeners.delete(callback) }',
  config: 'export const auth = window.archiveTest.auth',
  AuthContext: 'export const useAuth = () => ({ currentUser: window.archiveTest.auth.currentUser })',
  passwordService: `export async function verifyCurrentPassword(password) {
    if (password !== 'correct-password') throw new Error('Incorrect password')
  }`,
  archiveService: `
    const state = window.archiveTest
    export function createArchiveAccess(user) {
      let valid = true
      return { isValid: () => valid && !!user && state.auth.currentUser === user, revoke: () => { valid = false } }
    }
    export async function getArchivedRecords(type, access) {
      if (!access.isValid()) throw new Error('Locked read')
      state.reads++
      const name = 'Private ' + type[0].toUpperCase() + type.slice(1)
      return state.recoveries.some(item => item.type === type) ? [] : [{ id: type, recordYear: 2026, recordNumber: 1,
        childFirstName: name, confirmandFirstName: name, groomFirstName: name, brideFirstName: 'Partner', deceasedFirstName: name, firstName: name }]
    }
    export async function recoverArchivedRecord(type, id, reason, access) {
      if (!access.isValid()) throw new Error('Locked recovery')
      if (!reason.trim()) throw new Error('Blank reason')
      state.recoveries.push({ type, id, reason })
    }
  `,
}
const bundle = await rolldown({
  input: path.join(root, 'tests/archive-browser.jsx'),
  transform: { jsx: { runtime: 'automatic' }, define: { 'process.env.NODE_ENV': JSON.stringify('production') } },
  plugins: [{
    name: 'isolated-archive-test',
    resolveId(source) {
      const key = Object.keys(mocks).find((item) => source === item || source.endsWith('/' + item))
      if (key) return '\0mock:' + key
    },
    load(id) { if (id.startsWith('\0mock:')) return mocks[id.slice(6)] },
  }],
})
const { output } = await bundle.generate({ format: 'esm' })
await bundle.close()
const code = output.find((item) => item.type === 'chunk').code
const server = createServer((request, response) => {
  if (request.url === '/test.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(code); return }
  response.setHeader('Content-Type', 'text/html')
  response.end('<div id="root"></div><pre id="result">Pending</pre><script>window.archiveTest = { auth: { currentUser: { uid: "staff", email: "staff@example.test" } }, listeners: new Set(), reads: 0, recoveries: [], results: [] }</script><script type="module" src="/test.js"></script>')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const profile = mkdtempSync(path.join(tmpdir(), 'parish-archive-browser-'))
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--disable-background-networking',
  `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
let stderr = ''
chrome.stderr.on('data', (data) => { stderr += data })
const timeout = setTimeout(() => chrome.kill(), 55000)
let socket
try {
  const started = Date.now()
  while (!stderr.includes('DevTools listening on') && Date.now() - started < 10000) await new Promise((resolve) => setTimeout(resolve, 100))
  const endpoint = stderr.match(/DevTools listening on (ws:\/\/\S+)/)?.[1]
  if (!endpoint) throw new Error(stderr)
  socket = new WebSocket(endpoint)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  let sequence = 0
  const pending = new Map()
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id) }
  }
  async function send(method, params = {}, sessionId) {
    const id = ++sequence
    const reply = new Promise((resolve) => pending.set(id, resolve))
    socket.send(JSON.stringify({ id, method, params, sessionId }))
    const result = await reply
    if (result.error) throw new Error(JSON.stringify(result.error))
    return result.result
  }
  const { targetId } = await send('Target.createTarget', { url: `http://127.0.0.1:${server.address().port}` })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  let result
  while (Date.now() - started < 45000) {
    const evaluated = await send('Runtime.evaluate', { expression: 'document.getElementById("result")?.textContent', returnByValue: true }, sessionId)
    const value = evaluated.result?.value
    if (value && value !== 'Pending') { result = JSON.parse(value); break }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  if (!result?.passed) throw new Error(JSON.stringify(result) + '\n' + stderr.slice(-1200))
  for (const line of result.results) console.log('PASS:', line)
  await send('Browser.close')
} finally {
  clearTimeout(timeout)
  socket?.close()
  chrome.kill()
  server.close()
}
