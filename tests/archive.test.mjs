// Run: node --experimental-vm-modules --test tests/archive.test.mjs
// Executes production services against an in-memory Firebase substitute; no live writes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SourceTextModule, SyntheticModule } from 'node:vm'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const documents = new Map()
const auth = { currentUser: { uid: 'staff-test', email: 'staff@example.test' } }
const stamp = { testServerTimestamp: true }
let reads = 0
let writes = 0
let afterRead = null
const snapshot = (ref) => ({ id: ref.id, exists: () => documents.has(ref.key), data: () => documents.get(ref.key) })
const matching = (ref) => [...documents.entries()]
  .filter(([key, value]) => key.split('/')[0] === ref.name && (ref.constraints || []).every((constraint) =>
    constraint.kind !== 'where' || value[constraint.field] === constraint.value))
  .map(([key]) => snapshot({ key, id: key.split('/')[1] }))
const firestore = {
  collection: (_, name) => ({ name }),
  doc: (_, name, id) => ({ key: `${name}/${id}`, id }),
  query: (ref, ...constraints) => ({ ...ref, constraints }),
  where: (field, operator, value) => { assert.equal(operator, '=='); return { kind: 'where', field, value } },
  orderBy: () => ({ kind: 'order' }), limit: () => ({ kind: 'limit' }),
  serverTimestamp: () => stamp,
  getDoc: async (ref) => { reads++; return snapshot(ref) },
  getDocs: async (ref) => { reads++; return { docs: matching(ref) } },
  getCountFromServer: async (ref) => ({ data: () => ({ count: matching(ref).length }) }),
  runTransaction: async (_, callback) => {
    const updates = []
    await callback({
      get: async (ref) => { reads++; const result = snapshot(ref); afterRead?.(); return result },
      update: (ref, data) => updates.push([ref, data]),
    })
    for (const [ref, data] of updates) { writes++; documents.set(ref.key, { ...documents.get(ref.key), ...data }) }
  },
  addDoc: () => { throw new Error('Unexpected addDoc') },
  updateDoc: () => { throw new Error('Unexpected updateDoc') },
  setDoc: () => { throw new Error('Unexpected setDoc') },
  deleteDoc: () => { throw new Error('Permanent deletion is forbidden in these tests') },
}
const modules = new Map()
function synthetic(id, values) {
  const module = new SyntheticModule(Object.keys(values), function () {
    for (const [key, value] of Object.entries(values)) this.setExport(key, value)
  }, { identifier: id })
  modules.set(id, module)
}
synthetic('firebase/firestore', firestore)
synthetic('firebase/auth', {
  EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
  reauthenticateWithCredential: async (user, credential) => {
    assert.equal(user, auth.currentUser)
    assert.equal(credential.email, user.email)
    if (credential.password !== 'correct-password') throw Object.assign(new Error('Wrong password'), { code: 'auth/wrong-password' })
  },
  updatePassword: () => { throw new Error('Unexpected password update') },
})
synthetic(path.join(root, 'src/firebase/config.js'), { auth, db: {} })

function resolveFile(specifier, parent) {
  if (!specifier.startsWith('.')) return specifier
  const base = path.resolve(path.dirname(parent), specifier)
  return [base, `${base}.js`, path.join(base, 'index.js')].find((candidate) => candidate.endsWith('.js') && existsSync(candidate)) || base
}
function getModule(id) {
  if (!modules.has(id)) modules.set(id, new SourceTextModule(readFileSync(id, 'utf8'), { identifier: id }))
  return modules.get(id)
}
async function load(relative) {
  const module = getModule(path.join(root, relative))
  if (module.status === 'unlinked') await module.link(async (specifier, parent) => {
    const id = resolveFile(specifier, parent.identifier)
    if (!path.isAbsolute(id) && !modules.has(id)) synthetic(id, await import(id))
    return getModule(id)
  })
  if (module.status !== 'evaluated') await module.evaluate()
  return module.namespace
}

const archive = await load('src/services/archiveService.js')
const password = await load('src/services/passwordService.js')
const dashboard = await load('src/services/dashboardService.js')
const reports = await load('src/services/reportService.js')
const events = await load('src/services/eventService.js')
const { REPORT_TYPE_OPTIONS } = await load('src/constants/reportTypes.js')
const { EVENT_SOURCES } = await load('src/constants/index.js')

for (const kind of ['Baptism', 'Confirmation', 'Marriage', 'Death', 'Conversion']) {
  const collection = kind.toLowerCase()
  const service = await load(`src/services/${collection}Service.js`)
  test(`${kind}: reason validation, archive, legacy recovery, active list, counts, reports, calendar, certificate lookup`, async () => {
    documents.clear()
    const record = {
      recordYear: 2026, recordNumber: 1, status: 'completed',
      childFirstName: 'Test', confirmandFirstName: 'Test', groomFirstName: 'Test',
      brideFirstName: 'Partner', deceasedFirstName: 'Test', firstName: 'Test',
    }
    documents.set(`${collection}/record`, record)
    const event = { title: 'Existing event', source: EVENT_SOURCES[kind.toUpperCase()], relatedRecordId: 'record', date: '2026-09-16', startTime: '09:00', endTime: '10:00' }
    documents.set('events/event', event)
    const access = archive.createArchiveAccess(auth.currentUser)
    const getOne = service[kind === 'Baptism' ? 'getBaptismRecord' : `get${kind}RecordById`]
    const reportType = REPORT_TYPE_OPTIONS.find((option) => option.collection === collection)
    const report = () => reports.generateSacramentalReport({ reportType: reportType.value, year: 'All Years' })
    assert.equal((await service[`get${kind}Records`]()).length, 1)
    const before = writes
    for (const reason of ['', '  \n\t']) await assert.rejects(service[`archive${kind}Record`]('record', reason), /Archive Reason is required/)
    assert.equal(writes, before)
    await service[`archive${kind}Record`]('record', '  Duplicate entry  ')
    assert.deepEqual(documents.get(`${collection}/record`), { ...record, archived: true, archivedAt: stamp, archiveReason: 'Duplicate entry' })
    assert.equal((await service[`get${kind}Records`]()).length, 0)
    assert.equal(await getOne('record'), null)
    assert.equal((await dashboard.getSacramentalRecordCounts())[collection], 0)
    assert.equal((await report()).rows.length, 0)
    assert.equal((await reports.getReportYears(reportType.value)).length, 0)
    assert.equal((await events.getEvents()).length, 0)
    assert.equal((await archive.getArchivedRecords(collection, access)).length, 1)
    await assert.rejects(service[`archive${kind}Record`]('record', 'Again'), /already archived/)
    for (const reason of ['', '  \n\t']) await assert.rejects(archive.recoverArchivedRecord(collection, 'record', reason, access), /Recovery Reason is required/)
    assert.equal(documents.get(`${collection}/record`).archived, true)
    await archive.recoverArchivedRecord(collection, 'record', '  Verified original  ', access)
    assert.deepEqual(documents.get(`${collection}/record`), { ...record, archived: false, archivedAt: stamp, archiveReason: 'Duplicate entry', recoveredAt: stamp, recoveryReason: 'Verified original' })
    assert.equal((await service[`get${kind}Records`]()).length, 1)
    assert.equal((await getOne('record')).id, 'record')
    assert.equal((await dashboard.getSacramentalRecordCounts())[collection], 1)
    assert.equal((await report()).rows.length, 1)
    assert.deepEqual(await reports.getReportYears(reportType.value), ['2026'])
    assert.equal((await events.getEvents()).length, 1)
    assert.equal(documents.get('events/event'), event)
    assert.equal((await archive.getArchivedRecords(collection, access)).length, 0)
    await assert.rejects(archive.recoverArchivedRecord(collection, 'record', 'Again', access), /already been recovered/)
    documents.set(`${collection}/legacy`, { ...record, recordNumber: 2, archived: true })
    await archive.recoverArchivedRecord(collection, 'legacy', 'Legacy recovery', access)
    assert.equal(documents.get(`${collection}/legacy`).archived, false)
    assert.equal(documents.get(`${collection}/legacy`).status, 'completed')
    await assert.rejects(archive.recoverArchivedRecord(collection, 'missing', 'Reason', access), /no longer exists/)
    access.revoke()
  })
}

test('wrong/blank password rejected; correct password verifies current account', async () => {
  await assert.rejects(password.verifyCurrentPassword('wrong'), /password/i)
  await assert.rejects(password.verifyCurrentPassword('  '), /password/i)
  assert.equal(await password.verifyCurrentPassword('correct-password'), true)
})

test('locked, revoked, signed-out, and changed-account access cannot read or recover', async () => {
  const user = auth.currentUser
  const before = reads
  await assert.rejects(archive.getArchivedRecords('baptism'), /Verify/)
  const revoked = archive.createArchiveAccess(user)
  revoked.revoke()
  await assert.rejects(archive.getArchivedRecords('baptism', revoked), /Verify/)
  await assert.rejects(archive.recoverArchivedRecord('baptism', 'record', 'Reason', revoked), /Verify/)
  const changed = archive.createArchiveAccess(user)
  auth.currentUser = { uid: 'other', email: 'other@example.test' }
  await assert.rejects(archive.getArchivedRecords('baptism', changed), /Verify/)
  auth.currentUser = null
  await assert.rejects(archive.getArchivedRecords('baptism', changed), /Verify/)
  assert.equal(reads, before)
  auth.currentUser = user
  await assert.rejects(archive.getArchivedRecords('users', archive.createArchiveAccess(user)), /Invalid/)
})

test('revocation during transaction prevents recovery write', async () => {
  documents.set('baptism/pending', { archived: true, status: 'scheduled' })
  const access = archive.createArchiveAccess(auth.currentUser)
  afterRead = () => access.revoke()
  try {
    await assert.rejects(archive.recoverArchivedRecord('baptism', 'pending', 'Reason', access), /Verify/)
    assert.equal(documents.get('baptism/pending').archived, true)
  } finally { afterRead = null }
})
