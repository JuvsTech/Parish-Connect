import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { COLLECTIONS } from '../constants'

const AuthContext = createContext(null)

/** Normalize Firestore role values to the app vocabulary. */
export function normalizeRole(role) {
  const value = String(role || '')
    .trim()
    .toLowerCase()
  if (value === 'administrator') return 'admin'
  if (value === 'admin' || value === 'staff') return value
  return value || null
}

function buildProfileSummary(user, data = {}) {
  const firstName = String(data.firstName || '').trim()
  const middleName = String(data.middleName || '').trim()
  const lastName = String(data.lastName || '').trim()
  const displayName =
    [firstName, middleName, lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Parish User'
  const initials =
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() ||
    String(user?.email?.[0] || 'U').toUpperCase()

  return {
    photoURL: String(data.photoURL || '').trim(),
    firstName,
    middleName,
    lastName,
    displayName,
    initials,
    status: String(data.status || '').trim().toLowerCase() || null,
  }
}

async function loadUserProfileDocument(user) {
  await user.getIdToken()
  return getDoc(doc(db, COLLECTIONS.USERS, user.uid))
}

/** After a full profile read only — never concurrent with the auth profile getDoc. */
function touchLastLogin(uid) {
  void updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch((error) => {
    console.error('Failed to update lastLogin:', error)
  })
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [profileError, setProfileError] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const requestIdRef = useRef(0)

  const refreshUserProfile = useCallback(async () => {
    const user = auth.currentUser
    if (!user) {
      setCurrentUser(null)
      setRole(null)
      setUserProfile(null)
      setProfileError(null)
      setAuthLoading(false)
      return null
    }

    const requestId = ++requestIdRef.current
    setAuthLoading(true)
    setProfileError(null)

    try {
      const userDoc = await loadUserProfileDocument(user)
      if (requestId !== requestIdRef.current) return null
      if (auth.currentUser?.uid !== user.uid) return null

      const data = userDoc.exists() ? userDoc.data() || {} : {}
      const nextRole = normalizeRole(data.role)
      if (!nextRole) {
        throw new Error('User profile is missing a role.')
      }

      setCurrentUser(user)
      setRole(nextRole)
      setUserProfile(buildProfileSummary(user, data))
      setProfileError(null)
      touchLastLogin(user.uid)
      return buildProfileSummary(user, data)
    } catch (error) {
      if (requestId !== requestIdRef.current) return null
      if (auth.currentUser?.uid !== user.uid) return null

      setCurrentUser(user)
      setRole(null)
      setUserProfile(buildProfileSummary(user, {}))
      setProfileError(
        error?.message || 'Failed to load user profile. Please try again.',
      )
      return null
    } finally {
      if (requestId === requestIdRef.current) {
        setAuthLoading(false)
      }
    }
  }, [])

  const patchUserProfile = useCallback((partial = {}) => {
    setUserProfile((prev) => {
      const base = prev || buildProfileSummary(auth.currentUser, {})
      const next = {
        ...base,
        ...partial,
        photoURL:
          partial.photoURL !== undefined
            ? String(partial.photoURL || '').trim()
            : base.photoURL,
        firstName:
          partial.firstName !== undefined
            ? String(partial.firstName || '').trim()
            : base.firstName,
        middleName:
          partial.middleName !== undefined
            ? String(partial.middleName || '').trim()
            : base.middleName,
        lastName:
          partial.lastName !== undefined
            ? String(partial.lastName || '').trim()
            : base.lastName,
      }
      next.displayName =
        [next.firstName, next.middleName, next.lastName]
          .filter(Boolean)
          .join(' ') ||
        auth.currentUser?.email ||
        'Parish User'
      next.initials =
        `${next.firstName?.[0] || ''}${next.lastName?.[0] || ''}`.toUpperCase() ||
        String(auth.currentUser?.email?.[0] || 'U').toUpperCase()
      return next
    })
  }, [])

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const requestId = ++requestIdRef.current
      setAuthLoading(true)
      setProfileError(null)

      if (!user) {
        if (!active || requestId !== requestIdRef.current) return
        setCurrentUser(null)
        setRole(null)
        setUserProfile(null)
        setProfileError(null)
        setAuthLoading(false)
        return
      }

      setCurrentUser(user)

      try {
        const userDoc = await loadUserProfileDocument(user)
        if (auth.currentUser?.uid !== user.uid) return

        const data = userDoc.exists() ? userDoc.data() || {} : {}
        const nextRole = normalizeRole(data.role)

        // Partial merge snapshots can be exists:true with role undefined.
        // That must not settle as authorized with role:null → /unauthorized.
        if (!nextRole) {
          if (!active || requestId !== requestIdRef.current) return
          throw new Error('User profile is missing a role.')
        }

        // Keep a valid role even if StrictMode remounted mid-request.
        setCurrentUser(user)
        setRole(nextRole)
        setUserProfile(buildProfileSummary(user, data))
        setProfileError(null)
        setAuthLoading(false)
        touchLastLogin(user.uid)
      } catch (error) {
        if (!active || requestId !== requestIdRef.current) return
        if (auth.currentUser?.uid !== user.uid) return

        setCurrentUser(user)
        setRole(null)
        setUserProfile(buildProfileSummary(user, {}))
        setProfileError(
          error?.message || 'Failed to load user profile. Please try again.',
        )
        setAuthLoading(false)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      currentUser,
      role,
      userProfile,
      profileError,
      authLoading,
      loading: authLoading,
      refreshUserProfile,
      patchUserProfile,
    }),
    [
      currentUser,
      role,
      userProfile,
      profileError,
      authLoading,
      refreshUserProfile,
      patchUserProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
