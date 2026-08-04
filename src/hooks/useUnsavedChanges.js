import { useCallback, useId, useRef, useState } from 'react'
import { useRegisterUnsavedChanges } from '../contexts/UnsavedChangesContext'

/**
 * Stable JSON snapshot for dirty-form comparisons.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function createFormSnapshot(value) {
  try {
    return JSON.stringify(value ?? null)
  } catch {
    return String(value)
  }
}

/**
 * Tracks whether a form differs from a captured baseline and gates close
 * actions behind an unsaved-changes confirmation flow.
 *
 * Also registers dirty state with the application-wide UnsavedChangesProvider
 * so route changes, sidebar navigation, and tab close are guarded.
 *
 * @param {unknown} currentValue — current form state to compare
 * @param {{ enabled?: boolean }} [options]
 */
export function useUnsavedChanges(currentValue, { enabled = true } = {}) {
  const sourceId = useId()
  const baselineRef = useRef(null)
  const pendingCloseRef = useRef(null)
  const currentValueRef = useRef(currentValue)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [baselineVersion, setBaselineVersion] = useState(0)

  currentValueRef.current = currentValue

  const captureBaseline = useCallback((value) => {
    const snapshotValue =
      value !== undefined ? value : currentValueRef.current
    baselineRef.current = createFormSnapshot(snapshotValue)
    setConfirmOpen(false)
    pendingCloseRef.current = null
    setBaselineVersion((version) => version + 1)
  }, [])

  const clearBaseline = useCallback(() => {
    baselineRef.current = null
    setConfirmOpen(false)
    pendingCloseRef.current = null
    setBaselineVersion((version) => version + 1)
  }, [])

  const isDirty =
    enabled &&
    baselineRef.current != null &&
    createFormSnapshot(currentValue) !== baselineRef.current

  // Ensure re-render consumers see baseline capture/clear transitions.
  void baselineVersion

  useRegisterUnsavedChanges(isDirty, { enabled, id: sourceId })

  const requestClose = useCallback(
    (onDiscard) => {
      const dirty =
        enabled &&
        baselineRef.current != null &&
        createFormSnapshot(currentValueRef.current) !== baselineRef.current

      if (!dirty) {
        onDiscard?.()
        return
      }

      pendingCloseRef.current = onDiscard
      setConfirmOpen(true)
    },
    [enabled],
  )

  const keepEditing = useCallback(() => {
    setConfirmOpen(false)
    pendingCloseRef.current = null
  }, [])

  const discardChanges = useCallback(() => {
    const onDiscard = pendingCloseRef.current
    setConfirmOpen(false)
    pendingCloseRef.current = null
    onDiscard?.()
  }, [])

  /**
   * Call after a successful save so navigation is no longer blocked.
   * Prefer this over clearBaseline when the form remains open with new values.
   */
  const markSaved = useCallback((value) => {
    captureBaseline(value !== undefined ? value : currentValueRef.current)
  }, [captureBaseline])

  return {
    isDirty,
    confirmOpen,
    captureBaseline,
    clearBaseline,
    markSaved,
    requestClose,
    keepEditing,
    discardChanges,
  }
}
