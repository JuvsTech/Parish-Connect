/**
 * One-off seed: create two additional admin Auth users + Firestore profiles.
 * Does not modify app auth, RBAC, or security rules.
 *
 * Usage (PowerShell):
 *   $env:EXISTING_ADMIN_EMAIL="existing@admin.com"
 *   $env:EXISTING_ADMIN_PASSWORD="..."
 *   node scripts/createAdditionalAdmins.mjs
 *
 * Requires .env with VITE_FIREBASE_* keys.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(path) {
  const env = {}
  const text = readFileSync(path, 'utf8')
  for (const line of text.split(/\r?\n/)) {
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

const fileEnv = loadEnvFile(resolve(root, '.env'))
const env = { ...fileEnv, ...process.env }

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const adminEmail = String(env.EXISTING_ADMIN_EMAIL || '').trim()
const adminPassword = String(env.EXISTING_ADMIN_PASSWORD || '')

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('Missing VITE_FIREBASE_* values in .env')
  process.exit(1)
}

if (!adminEmail || !adminPassword) {
  console.error(
    'Set EXISTING_ADMIN_EMAIL and EXISTING_ADMIN_PASSWORD to an existing administrator account.\n' +
      'That session is required to create users/{uid} documents (Firestore rules: create = admin only).\n' +
      'The existing admin account itself is not modified.',
  )
  process.exit(1)
}

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

async function createAuthUser(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(
    firebaseConfig.apiKey,
  )}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  })
  const data = await response.json()
  if (!response.ok) {
    const message = data?.error?.message || 'AUTH_CREATE_FAILED'
    if (message === 'EMAIL_EXISTS') {
      // Look up localId via sign-in
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(
        firebaseConfig.apiKey,
      )}`
      const signInRes = await fetch(signInUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      })
      const signInData = await signInRes.json()
      if (!signInRes.ok) {
        throw new Error(
          `Auth user ${email} already exists but password sign-in failed: ${
            signInData?.error?.message || 'UNKNOWN'
          }`,
        )
      }
      return { uid: signInData.localId, existed: true }
    }
    throw new Error(`Failed to create Auth user ${email}: ${message}`)
  }
  return { uid: data.localId, existed: false }
}

async function main() {
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  console.log('Signing in as existing administrator (read-only for that account)...')
  const adminCred = await signInWithEmailAndPassword(
    auth,
    adminEmail,
    adminPassword,
  )
  const adminUid = adminCred.user.uid
  const adminDoc = await getDoc(doc(db, 'users', adminUid))
  if (!adminDoc.exists()) {
    throw new Error(
      `No Firestore users/${adminUid} document for ${adminEmail}. Cannot clone schema.`,
    )
  }

  const adminData = adminDoc.data() || {}
  const role = String(adminData.role || '').toLowerCase()
  if (role !== 'admin' && role !== 'administrator') {
    throw new Error(
      `${adminEmail} is not an administrator (role=${adminData.role}). Aborting.`,
    )
  }

  console.log(`Using schema from users/${adminUid}`)

  const actorEmail = adminCred.user.email || adminEmail

  for (const user of NEW_USERS) {
    console.log(`\nProvisioning ${user.email}...`)
    const { uid, existed } = await createAuthUser(user.email, user.password)
    console.log(
      existed
        ? `  Auth user already existed (uid=${uid}); ensuring Firestore profile...`
        : `  Auth user created (uid=${uid})`,
    )

    const userRef = doc(db, 'users', uid)
    const existingProfile = await getDoc(userRef)

    // Same structure as administrator doc: start from admin keys, overlay identity fields.
    const base = { ...adminData }
    delete base.uid

    const next = {
      ...base,
      ...user.profile,
      email: user.email,
      uid,
      displayUserId: uid,
      createdAt: existingProfile.exists()
        ? existingProfile.data()?.createdAt ?? serverTimestamp()
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: actorEmail,
      lastLogin: existingProfile.exists()
        ? existingProfile.data()?.lastLogin ?? null
        : null,
      lastPasswordChange: existingProfile.exists()
        ? existingProfile.data()?.lastPasswordChange ?? null
        : null,
    }

    await setDoc(userRef, next, { merge: true })
    console.log(`  Firestore users/${uid} written (role=${next.role}, status=${next.status})`)
  }

  await signOut(auth)
  console.log('\nDone. Existing administrator account was not modified.')
}

main().catch((error) => {
  console.error('\nFailed:', error?.message || error)
  process.exit(1)
})
