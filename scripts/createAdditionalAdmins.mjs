/**
 * One-time Admin SDK seed: create two additional admin Auth users + Firestore profiles.
 *
 * Does NOT modify application auth, RBAC, or security rules.
 * Does NOT modify existing Auth users or existing users/{uid} documents.
 *
 * Usage:
 *   node scripts/createAdditionalAdmins.mjs
 *
 * Prerequisites:
 *   1. npm install firebase-admin --save-dev
 *   2. Service account JSON at secrets/firebase-admin.json
 *      (or GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_SERVICE_ACCOUNT)
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

const NEW_USERS = [
  {
    email: 'admin2@parishconnect.com',
    password: 'Admin@12345',
    profile: {
      firstName: 'Maria',
      middleName: 'Santos',
      lastName: 'Reyes',
      birthday: '1985-03-15',
      gender: 'Female',
      address: 'Poblacion, Bani, Pangasinan',
      phone: '09171234567',
      role: 'admin',
      status: 'active',
    },
  },
  {
    email: 'father@parishconnect.com',
    password: 'Father@12345',
    profile: {
      firstName: 'Juan',
      middleName: 'Dela',
      lastName: 'Cruz',
      birthday: '1978-08-20',
      gender: 'Male',
      address: 'Immaculate Conception Parish Compound, Bani, Pangasinan',
      phone: '09179876543',
      role: 'admin',
      status: 'active',
    },
  },
]

function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  const env = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function printAdminSdkSetupHelp(reason) {
  console.error(`\nFirebase Admin SDK is not configured.\n`)
  console.error(`Reason: ${reason}\n`)
  console.error(`Configure it first, then re-run:\n`)
  console.error(`  node scripts/createAdditionalAdmins.mjs\n`)
  console.error(`Steps:\n`)
  console.error(`  1. Install the Admin SDK (dev dependency):`)
  console.error(`       npm install firebase-admin --save-dev\n`)
  console.error(`  2. In Firebase Console → Project settings → Service accounts:`)
  console.error(`       click "Generate new private key" and download the JSON.\n`)
  console.error(`  3. Save the JSON outside source control, for example:`)
  console.error(`       ${resolve(root, 'secrets', 'firebase-admin.json')}`)
  console.error(`     (Do NOT commit this file.)\n`)
  console.error(`  4. Point the script at that file (PowerShell):`)
  console.error(
    `       $env:GOOGLE_APPLICATION_CREDENTIALS="${resolve(root, 'secrets', 'firebase-admin.json')}"`,
  )
  console.error(`\n  Alternative file locations (auto-detected if present):`)
  console.error(`       ./secrets/firebase-admin.json`)
  console.error(`       ./serviceAccountKey.json\n`)
}

function resolveServiceAccountPath(env) {
  const candidates = [
    env.GOOGLE_APPLICATION_CREDENTIALS,
    env.FIREBASE_SERVICE_ACCOUNT,
    env.FIREBASE_ADMIN_CREDENTIALS,
    resolve(root, 'secrets', 'firebase-admin.json'),
    resolve(root, 'serviceAccountKey.json'),
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  for (const candidate of candidates) {
    const absolute = resolve(candidate)
    if (existsSync(absolute)) return absolute
  }
  return null
}

function loadAdminModules() {
  try {
    const app = require('firebase-admin/app')
    const auth = require('firebase-admin/auth')
    const firestore = require('firebase-admin/firestore')
    return { app, auth, firestore }
  } catch {
    return null
  }
}

async function findTemplateAdminDoc(db) {
  const snap = await db
    .collection('users')
    .where('role', 'in', ['admin', 'administrator'])
    .limit(5)
    .get()

  if (!snap.empty) {
    const preferred =
      snap.docs.find(
        (d) => String(d.data()?.role || '').toLowerCase() === 'admin',
      ) || snap.docs[0]
    return { id: preferred.id, data: preferred.data() || {} }
  }

  const any = await db.collection('users').limit(1).get()
  if (any.empty) return null
  return { id: any.docs[0].id, data: any.docs[0].data() || {} }
}

async function getOrCreateAuthUser(auth, email, password) {
  try {
    const existing = await auth.getUserByEmail(email)
    return { uid: existing.uid, created: false }
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error
  }

  const created = await auth.createUser({
    email,
    password,
    emailVerified: false,
    disabled: false,
  })
  return { uid: created.uid, created: true }
}

async function main() {
  const fileEnv = loadEnvFile(resolve(root, '.env'))
  const env = { ...fileEnv, ...process.env }

  const modules = loadAdminModules()
  if (!modules) {
    printAdminSdkSetupHelp('Package "firebase-admin" is not installed.')
    process.exit(1)
  }

  const { initializeApp, getApps, cert } = modules.app
  const { getAuth } = modules.auth
  const { getFirestore, FieldValue } = modules.firestore

  const credentialPath = resolveServiceAccountPath(env)
  if (!credentialPath) {
    printAdminSdkSetupHelp(
      'No service account JSON found via GOOGLE_APPLICATION_CREDENTIALS / FIREBASE_SERVICE_ACCOUNT or default paths.',
    )
    process.exit(1)
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(readFileSync(credentialPath, 'utf8'))
  } catch (error) {
    printAdminSdkSetupHelp(
      `Could not read service account JSON at ${credentialPath}: ${error.message}`,
    )
    process.exit(1)
  }

  if (
    !serviceAccount.project_id ||
    !serviceAccount.client_email ||
    !serviceAccount.private_key
  ) {
    printAdminSdkSetupHelp(
      `Service account JSON at ${credentialPath} is missing project_id / client_email / private_key.`,
    )
    process.exit(1)
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    })
  }

  const auth = getAuth()
  const db = getFirestore()

  console.log(`Using service account: ${serviceAccount.client_email}`)
  console.log(`Project: ${serviceAccount.project_id}`)

  const template = await findTemplateAdminDoc(db)
  if (!template) {
    console.error(
      '\nNo existing users/{uid} document found to clone schema from.\n' +
        'Create the primary administrator profile in Firestore first, then re-run this script.',
    )
    process.exit(1)
  }

  console.log(`Cloning document structure from users/${template.id}`)
  const templateData = { ...template.data }
  delete templateData.uid

  const now = FieldValue.serverTimestamp()

  for (const user of NEW_USERS) {
    console.log(`\nProcessing ${user.email}...`)

    const { uid, created } = await getOrCreateAuthUser(
      auth,
      user.email,
      user.password,
    )
    if (created) {
      console.log(`  Auth user created (uid=${uid})`)
    } else {
      console.log(`  Auth user already exists — skipped create (uid=${uid})`)
    }

    const userRef = db.collection('users').doc(uid)
    const existingDoc = await userRef.get()
    if (existingDoc.exists) {
      console.log(`  Firestore users/${uid} already exists — skipped write`)
      continue
    }

    const docData = {
      ...templateData,
      ...user.profile,
      email: user.email,
      uid,
      displayUserId: uid,
      role: 'admin',
      status: user.profile.status || 'active',
      createdAt: now,
      updatedAt: now,
      updatedBy: 'scripts/createAdditionalAdmins.mjs',
      lastLogin: null,
      lastPasswordChange: null,
    }

    await userRef.set(docData)
    console.log(`  Firestore users/${uid} created (role=admin)`)
  }

  console.log('\nDone. Existing administrator account was not modified.')
}

main().catch((error) => {
  console.error('\nFailed:', error?.message || error)
  process.exit(1)
})
