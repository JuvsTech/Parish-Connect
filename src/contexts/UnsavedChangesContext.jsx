import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useBlocker, useLocation } from 'react-router-dom'
import UnsavedChangesDialog from '../components/UnsavedChangesDialog'

const UnsavedChangesContext = createContext(null)

/**
 * Application-wide unsaved-changes registry + navigation guards.
 *
 * - In-app route changes (sidebar, links, back/forward, navigate): MUI dialog
 * - Refresh / close tab: native beforeunload prompt
 *
 * Forms opt in via `useUnsavedChanges` or `useRegisterUnsavedChanges`.
 */
export function UnsavedChangesProvider({ children }) {
  const location = useLocation()
  const [dirtyIds, setDirtyIds] = useState(() => new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const bypassRef = useRef(false)
  const leavingRef = useRef(false)
  const pendingLeaveRef = useRef(null)

  const isDirty = dirtyIds.size > 0

  const setSourceDirty = useCallback((id, dirty) => {
    if (!id) return

    // While the user confirmed Leave Page, ignore re-registration from still-mounted forms.
    if (leavingRef.current && dirty) return

    setDirtyIds((prev) => {
      const already = prev.has(id)
      if (dirty && already) return prev
      if (!dirty && !already) return prev

      const next = new Set(prev)
      if (dirty) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const register = useCallback(
    (id, dirty) => {
      setSourceDirty(id, Boolean(dirty))
      return () => setSourceDirty(id, false)
    },
    [setSourceDirty],
  )

  const clearAll = useCallback(() => {
    setDirtyIds((prev) => (prev.size === 0 ? prev : new Set()))
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
  }, [])

  const resolvePendingLeave = useCallback((shouldLeave) => {
    const resolve = pendingLeaveRef.current
    pendingLeaveRef.current = null
    resolve?.(shouldLeave)
  }, [])

  // Re-enable guarding after a confirmed leave completes (route changed or stayed).
  useEffect(() => {
    leavingRef.current = false
    bypassRef.current = false
  }, [location.pathname, location.search, location.hash])

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (bypassRef.current || leavingRef.current) return false
    if (!isDirty) return false

    return (
      currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search ||
      currentLocation.hash !== nextLocation.hash
    )
  })

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setDialogOpen(true)
    }
  }, [blocker.state])

  useEffect(() => {
    if (!isDirty) return undefined

    const handleBeforeUnload = (event) => {
      if (bypassRef.current || leavingRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const stayOnPage = useCallback(() => {
    closeDialog()
    leavingRef.current = false
    bypassRef.current = false
    if (blocker.state === 'blocked') {
      blocker.reset?.()
    }
    resolvePendingLeave(false)
  }, [blocker, closeDialog, resolvePendingLeave])

  const leavePage = useCallback(() => {
    closeDialog()
    leavingRef.current = true
    bypassRef.current = true

    if (blocker.state === 'blocked') {
      // Route change will unmount forms; clear the registry now.
      clearAll()
      blocker.proceed?.()
    }

    resolvePendingLeave(true)
  }, [blocker, clearAll, closeDialog, resolvePendingLeave])

  /**
   * Re-enable guarding after a cancelled imperative leave (e.g. logout failure).
   */
  const cancelLeaving = useCallback(() => {
    leavingRef.current = false
    bypassRef.current = false
  }, [])

  /**
   * Promise-based confirmation for imperative flows (e.g. logout).
   * Resolves true when navigation may proceed.
   */
  const confirmLeave = useCallback(() => {
    if (!isDirty || bypassRef.current || leavingRef.current) {
      return Promise.resolve(true)
    }

    return new Promise((resolve) => {
      pendingLeaveRef.current = resolve
      setDialogOpen(true)
    })
  }, [isDirty])

  const value = useMemo(
    () => ({
      isDirty,
      register,
      setSourceDirty,
      clearAll,
      confirmLeave,
      cancelLeaving,
    }),
    [isDirty, register, setSourceDirty, clearAll, confirmLeave, cancelLeaving],
  )

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <UnsavedChangesDialog
        open={dialogOpen}
        variant="leave"
        onKeepEditing={stayOnPage}
        onDiscard={leavePage}
      />
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChangesContext() {
  return useContext(UnsavedChangesContext)
}

/**
 * Register a boolean dirty flag with the global guard.
 * Safe to call outside the provider (no-ops).
 *
 * @param {boolean} dirty
 * @param {{ enabled?: boolean, id?: string }} [options]
 */
export function useRegisterUnsavedChanges(dirty, { enabled = true, id } = {}) {
  const context = useContext(UnsavedChangesContext)
  const generatedId = useId()
  const sourceId = id || generatedId

  useEffect(() => {
    if (!context) return undefined
    return context.register(sourceId, Boolean(enabled && dirty))
  }, [context, sourceId, dirty, enabled])
}
