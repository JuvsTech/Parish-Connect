import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase/config'

/**
 * Sign in only. Do not write users/{uid} here.
 * A setDoc(merge) for lastLogin races with AuthContext's profile read and can
 * produce a partial local snapshot (exists:true, role missing) → Unauthorized.
 * lastLogin is updated in AuthContext after the full profile document is loaded.
 */
export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function logout() {
  return signOut(auth)
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}
