import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import { MARIAN_BLUE, SOFT_SHADOW } from '../theme/parishTheme'
import PageHeader from '../components/PageHeader'
import GenderSelect from '../components/GenderSelect'
import { logout } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import {
  useRegisterUnsavedChanges,
  useUnsavedChangesContext,
} from '../contexts/UnsavedChangesContext'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'
import { MESSAGES } from '../constants'
import { normalizeGender } from '../constants/gender'
import { toProperCase } from '../utils/textFormatter'
import {
  formatAccountStatusLabel,
  formatProfileDate,
  formatProfileDateTime,
  formatUserRoleLabel,
  getUserProfile,
  updateUserProfile,
  validatePersonalProfile,
} from '../services/userProfileService'
import {
  changeUserPassword,
  validatePasswordChange,
} from '../services/passwordService'

const CHURCH_NAME = 'Immaculate Conception of the Virgin Mary Parish'

const EMPTY_PERSONAL = {
  firstName: '',
  middleName: '',
  lastName: '',
  phone: '',
  address: '',
  birthday: '',
  gender: '',
}

const fieldHelperSx = {
  mx: 0,
  mt: 0.25,
  mb: 0,
  minHeight: 0,
  lineHeight: 1.25,
  fontSize: '0.72rem',
}

function SectionHeading({ title, icon: Icon, description }) {
  return (
    <Stack
      direction="row"
      spacing={1}
     
      sx={{ alignItems: "flex-start", mb: 1.5 }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(11, 61, 145, 0.08)',
          color: MARIAN_BLUE,
          flexShrink: 0,
          mt: 0.1,
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            color: MARIAN_BLUE,
            fontSize: '0.92rem',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {description ? (
          <Typography
            color="text.secondary"
            sx={{ mt: 0.2, fontSize: '0.78rem', lineHeight: 1.35 }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  error = false,
  helperText,
  disabled = false,
}) {
  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      fullWidth
      size="small"
      error={error}
      helperText={helperText}
      disabled={disabled}
      slotProps={{
        formHelperText: { sx: fieldHelperSx },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={visible ? `Hide ${label}` : `Show ${label}`}
                onClick={onToggle}
                edge="end"
                size="small"
                disabled={disabled}
              >
                {visible ? (
                  <VisibilityOffOutlinedIcon fontSize="small" />
                ) : (
                  <VisibilityOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

/**
 * Profile page — Phase 1: load/save personal + account info from Firestore.
 */
export default function Profile() {
  const navigate = useNavigate()
  const { currentUser, role, patchUserProfile } = useAuth()
  const unsavedChanges = useUnsavedChangesContext()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [accountMeta, setAccountMeta] = useState(null)
  const [personalForm, setPersonalForm] = useState(EMPTY_PERSONAL)
  const [baselineForm, setBaselineForm] = useState(EMPTY_PERSONAL)
  const [fieldErrors, setFieldErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [photoURL, setPhotoURL] = useState('')
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [visibility, setVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const { isDirty: hasUnsavedChanges, captureBaseline, markSaved } =
    useUnsavedChanges(personalForm, {
      enabled: !loading && !saving,
    })

  const passwordDirty = Boolean(
    passwords.currentPassword ||
      passwords.newPassword ||
      passwords.confirmPassword,
  )
  useRegisterUnsavedChanges(passwordDirty, {
    enabled: !loading && !updatingPassword,
    id: 'profile-password',
  })

  const roleLabel = formatUserRoleLabel(accountMeta?.role || role)

  const avatarSrc = photoURL || undefined

  const displayName = useMemo(() => {
    const name = [
      personalForm.firstName,
      personalForm.middleName,
      personalForm.lastName,
    ]
      .filter(Boolean)
      .join(' ')
    return name || currentUser?.email || 'Parish User'
  }, [personalForm, currentUser])

  const accountInfo = useMemo(
    () => [
      {
        label: 'User ID',
        value: accountMeta?.displayUserId || accountMeta?.uid || '—',
      },
      { label: 'Role', value: roleLabel },
      {
        label: 'Account Status',
        value: formatAccountStatusLabel(accountMeta?.status),
      },
      {
        label: 'Member Since',
        value: formatProfileDate(
          accountMeta?.createdAt || currentUser?.metadata?.creationTime,
        ),
      },
      {
        label: 'Last Login',
        value: formatProfileDateTime(
          accountMeta?.lastLogin || currentUser?.metadata?.lastSignInTime,
        ),
      },
      {
        label: 'Last Password Change',
        value: formatProfileDateTime(accountMeta?.lastPasswordChange),
      },
    ],
    [accountMeta, roleLabel, currentUser],
  )

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      if (!currentUser?.uid) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const next = await getUserProfile(currentUser.uid, currentUser)
        if (cancelled) return
        setAccountMeta(next)
        setPhotoURL(next.photoURL || '')
        const form = {
          firstName: next.firstName,
          middleName: next.middleName,
          lastName: next.lastName,
          phone: next.phone,
          address: next.address,
          birthday: next.birthday,
          gender: normalizeGender(next.gender),
        }
        setPersonalForm(form)
        setBaselineForm(form)
        captureBaseline(form)
        setFieldErrors({})
        patchUserProfile({
          firstName: next.firstName,
          middleName: next.middleName,
          lastName: next.lastName,
          photoURL: next.photoURL || '',
        })
      } catch (error) {
        if (!cancelled) {
          showSnackbar(
            error instanceof Error ? error.message : MESSAGES.ERROR.PROFILE_LOAD,
            'error',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    initialLoad()
    return () => {
      cancelled = true
    }
  }, [currentUser, patchUserProfile, showSnackbar, captureBaseline])

  function handleProfileChange(field) {
    return (event) => {
      const value = event.target.value
      setPersonalForm((prev) => ({ ...prev, [field]: value }))
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function handleNameBlur(field) {
    return () => {
      setPersonalForm((prev) => {
        const formatted = toProperCase(prev[field])
        if (formatted === prev[field]) return prev
        return { ...prev, [field]: formatted }
      })
    }
  }

  function handlePasswordChange(field) {
    return (event) => {
      setPasswords((prev) => ({ ...prev, [field]: event.target.value }))
      setPasswordErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function handlePhoneChange(event) {
    const digitsOnly = String(event.target.value || '')
      .replace(/\D/g, '')
      .slice(0, 11)
    setPersonalForm((prev) => ({ ...prev, phone: digitsOnly }))
    setFieldErrors((prev) => ({ ...prev, phone: '' }))
  }

  function toggleVisibility(field) {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  function clearPasswordFields() {
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordErrors({})
    setVisibility({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    })
  }

  async function handleUpdatePassword() {
    if (!currentUser?.uid || updatingPassword) return

    const errors = validatePasswordChange(passwords)
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      showSnackbar(MESSAGES.ERROR.PASSWORD_VALIDATION, 'error')
      return
    }

    setUpdatingPassword(true)
    try {
      await changeUserPassword(passwords)
      clearPasswordFields()
      setAccountMeta((prev) =>
        prev
          ? {
              ...prev,
              lastPasswordChange: new Date(),
            }
          : prev,
      )
      showSnackbar(MESSAGES.SUCCESS.PASSWORD_UPDATED)
    } catch (error) {
      if (error?.fieldErrors) {
        setPasswordErrors(error.fieldErrors)
        showSnackbar(
          error.message === MESSAGES.ERROR.PASSWORD_CURRENT_INCORRECT
            ? MESSAGES.ERROR.PASSWORD_CURRENT_INCORRECT
            : MESSAGES.ERROR.PASSWORD_VALIDATION,
          'error',
        )
      } else {
        showSnackbar(
          error instanceof Error
            ? error.message
            : MESSAGES.ERROR.PASSWORD_UPDATE,
          'error',
        )
      }
    } finally {
      setUpdatingPassword(false)
    }
  }

  function handleCancelProfile() {
    setPersonalForm(baselineForm)
    setFieldErrors({})
  }

  async function handleSaveProfile() {
    if (!currentUser?.uid || saving) return

    if (!hasUnsavedChanges) {
      showSnackbar(MESSAGES.SUCCESS.PROFILE_NO_CHANGES, 'info')
      return
    }

    const errors = validatePersonalProfile(personalForm)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      showSnackbar(MESSAGES.ERROR.PROFILE_VALIDATION, 'error')
      return
    }

    setSaving(true)

    try {
      const updated = await updateUserProfile(currentUser.uid, personalForm, {
        userEmail: currentUser.email || '',
      })

      setAccountMeta(updated)
      setPhotoURL(updated.photoURL || '')
      const form = {
        firstName: updated.firstName,
        middleName: updated.middleName,
        lastName: updated.lastName,
        phone: updated.phone,
        address: updated.address,
        birthday: updated.birthday,
        gender: updated.gender,
      }
      setPersonalForm(form)
      setBaselineForm(form)
      markSaved(form)
      setFieldErrors({})
      patchUserProfile({
        firstName: updated.firstName,
        middleName: updated.middleName,
        lastName: updated.lastName,
        photoURL: updated.photoURL || '',
      })
      showSnackbar(MESSAGES.SUCCESS.PROFILE_UPDATED)
    } catch (error) {
      if (error?.fieldErrors) {
        setFieldErrors(error.fieldErrors)
        showSnackbar(MESSAGES.ERROR.PROFILE_VALIDATION, 'error')
      } else {
        showSnackbar(
          error instanceof Error
            ? error.message
            : MESSAGES.ERROR.PROFILE_UPDATE,
          'error',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    const canLeave = unsavedChanges
      ? await unsavedChanges.confirmLeave()
      : true
    if (!canLeave) return

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      unsavedChanges?.cancelLeaving?.()
      showSnackbar('Unable to log out. Please try again.', 'error')
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: 1280,
          mx: 'auto',
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.25,
        }}
      >
        <CircularProgress sx={{ color: MARIAN_BLUE }} size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading your profile...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      <PageHeader
        title="Account"
       
      />

      <Card
        sx={{
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: SOFT_SHADOW,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {/* Profile Summary */}
        <Box
          sx={{
            px: { xs: 2, sm: 2.75 },
            py: { xs: 1.75, sm: 2 },
            bgcolor: 'rgba(11, 61, 145, 0.02)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1.5, sm: 2 }}
           
            textAlign={{ xs: 'center', sm: 'left' }}
          sx={{ alignItems: { xs: 'center', sm: 'center' } }}>
            <Avatar
              src={avatarSrc}
              slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
              sx={{
                width: 64,
                height: 64,
                bgcolor: MARIAN_BLUE,
                fontSize: '1.35rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(11, 61, 145, 0.16)',
                flexShrink: 0,
              }}
            >
              {personalForm.firstName?.[0]}
              {personalForm.lastName?.[0]}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.15rem', sm: '1.25rem' },
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}
              >
                {displayName}
              </Typography>

              <Stack
                direction="row"
                spacing={1}
               
               
               
                useFlexGap
                sx={{ alignItems: "center", justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: "wrap", mt: 0.75 }}
              >
                <Chip
                  label={roleLabel}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 650,
                    fontSize: '0.7rem',
                    bgcolor: 'rgba(11, 61, 145, 0.08)',
                    color: MARIAN_BLUE,
                    borderRadius: '999px',
                  }}
                />
                {CHURCH_NAME ? (
                  <Typography
                    color="text.secondary"
                    sx={{
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      lineHeight: 1.35,
                    }}
                  >
                    {CHURCH_NAME}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Personal Information */}
        <Box sx={{ px: { xs: 2, sm: 2.75 }, py: { xs: 2, sm: 2.25 } }}>
          <SectionHeading
            title="Personal Information"
            icon={PersonOutlineOutlinedIcon}
            
          />

          <Grid container spacing={1.25}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="First Name"
                value={personalForm.firstName}
                onChange={handleProfileChange('firstName')}
                onBlur={handleNameBlur('firstName')}
                fullWidth
                size="small"
                disabled={saving}
                error={Boolean(fieldErrors.firstName)}
                helperText={fieldErrors.firstName || undefined}
                slotProps={{ formHelperText: { sx: fieldHelperSx } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Last Name"
                value={personalForm.lastName}
                onChange={handleProfileChange('lastName')}
                onBlur={handleNameBlur('lastName')}
                fullWidth
                size="small"
                disabled={saving}
                error={Boolean(fieldErrors.lastName)}
                helperText={fieldErrors.lastName || undefined}
                slotProps={{ formHelperText: { sx: fieldHelperSx } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Middle Name"
                value={personalForm.middleName}
                onChange={handleProfileChange('middleName')}
                onBlur={handleNameBlur('middleName')}
                fullWidth
                size="small"
                disabled={saving}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Phone Number"
                value={personalForm.phone}
                onChange={handlePhoneChange}
                fullWidth
                size="small"
                disabled={saving}
                error={Boolean(fieldErrors.phone)}
                helperText={
                  fieldErrors.phone || 'Enter an 11-digit mobile number.'
                }
                slotProps={{
                  formHelperText: { sx: fieldHelperSx },
                  htmlInput: {
                    inputMode: 'numeric',
                    maxLength: 11,
                    pattern: '[0-9]*',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Email"
                value={accountMeta?.email || currentUser?.email || ''}
                fullWidth
                size="small"
                disabled
                helperText="Email cannot be changed here."
                slotProps={{
                  formHelperText: { sx: fieldHelperSx },
                  input: { readOnly: true },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Address"
                value={personalForm.address}
                onChange={handleProfileChange('address')}
                fullWidth
                size="small"
                disabled={saving}
                multiline
                minRows={1}
                maxRows={2}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Birthday"
                type="date"
                value={personalForm.birthday}
                onChange={handleProfileChange('birthday')}
                fullWidth
                size="small"
                disabled={saving}
                error={Boolean(fieldErrors.birthday)}
                helperText={fieldErrors.birthday || undefined}
                slotProps={{
                  formHelperText: { sx: fieldHelperSx },
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
            <GenderSelect
              label="Gender"
              value={personalForm.gender}
              onChange={(value) => {
                setPersonalForm((prev) => ({ ...prev, gender: value }))
                setFieldErrors((prev) => {
                  if (!prev.gender) return prev
                  const next = { ...prev }
                  delete next.gender
                  return next
                })
              }}
              required
              disabled={saving}
              error={Boolean(fieldErrors.gender)}
              helperText={fieldErrors.gender || ' '}
              size={{ xs: 12, sm: 6 }}
              idPrefix="profile-gender"
              compact
            />
          </Grid>

          <Stack
            direction="row"
            spacing={1}
           
           
            useFlexGap
            sx={{ justifyContent: "flex-end", flexWrap: "wrap", mt: 1.75 }}
          >
            <Button
              variant="outlined"
              onClick={handleCancelProfile}
              disabled={saving || !hasUnsavedChanges}
              sx={{ borderRadius: '10px', minHeight: 34, px: 1.75 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveProfile}
              disabled={saving || !hasUnsavedChanges}
              startIcon={
                saving ? (
                  <CircularProgress size={14} color="inherit" />
                ) : null
              }
              sx={{ borderRadius: '10px', minHeight: 34, px: 2 }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Stack>
        </Box>

        <Divider />

        {/* Account Information | Change Password */}
        <Grid container>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              px: { xs: 2, sm: 2.75 },
              py: { xs: 2, sm: 2.25 },
              borderRight: { md: '1px solid' },
              borderBottom: { xs: '1px solid', md: 'none' },
              borderColor: 'divider',
            }}
          >
            <SectionHeading
              title="Account Information"
              icon={BadgeOutlinedIcon}
              
            />

            <Stack spacing={0}>
              {accountInfo.map((item, index) => (
                <Box
                  key={item.label}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                    py: 0.85,
                    borderTop: index === 0 ? '1px solid' : 'none',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    color="text.secondary"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      flexShrink: 0,
                      pt: 0.1,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      wordBreak: 'break-word',
                      textAlign: 'right',
                      fontSize: '0.82rem',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Grid>

          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ px: { xs: 2, sm: 2.75 }, py: { xs: 2, sm: 2.25 } }}
          >
            <SectionHeading
              title="Change Password"
              icon={LockOutlinedIcon}
              
            />

            <Stack spacing={1.15}>
              <PasswordField
                label="Current Password"
                value={passwords.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
                visible={visibility.currentPassword}
                onToggle={() => toggleVisibility('currentPassword')}
                error={Boolean(passwordErrors.currentPassword)}
                helperText={passwordErrors.currentPassword || undefined}
                disabled={updatingPassword}
              />
              <PasswordField
                label="New Password"
                value={passwords.newPassword}
                onChange={handlePasswordChange('newPassword')}
                visible={visibility.newPassword}
                onToggle={() => toggleVisibility('newPassword')}
                error={Boolean(passwordErrors.newPassword)}
                helperText={passwordErrors.newPassword || undefined}
                disabled={updatingPassword}
              />
              <PasswordField
                label="Confirm Password"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                visible={visibility.confirmPassword}
                onToggle={() => toggleVisibility('confirmPassword')}
                error={Boolean(passwordErrors.confirmPassword)}
                helperText={passwordErrors.confirmPassword || undefined}
                disabled={updatingPassword}
              />
            </Stack>

            <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 1.5 }}>
              <Button
                variant="contained"
                onClick={handleUpdatePassword}
                disabled={updatingPassword}
                startIcon={
                  updatingPassword ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : null
                }
                sx={{ borderRadius: '10px', minHeight: 34, px: 2 }}
              >
                {updatingPassword ? 'Updating…' : 'Update Password'}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider />

        {/* Quick Actions */}
        <Box sx={{ px: { xs: 2, sm: 2.75 }, py: { xs: 1.75, sm: 2 } }}>
          <SectionHeading title="Quick Actions" icon={BoltOutlinedIcon} />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            useFlexGap
           
          sx={{ flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<DashboardOutlinedIcon />}
              onClick={() => navigate('/')}
              sx={{
                borderRadius: '10px',
                minHeight: 34,
                px: 1.5,
                borderColor: 'divider',
                color: 'text.primary',
              }}
            >
              Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<AssessmentOutlinedIcon />}
              onClick={() => navigate('/reports')}
              sx={{
                borderRadius: '10px',
                minHeight: 34,
                px: 1.5,
                borderColor: MARIAN_BLUE,
                color: MARIAN_BLUE,
              }}
            >
              Reports
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutOutlinedIcon />}
              onClick={handleLogout}
              sx={{ borderRadius: '10px', minHeight: 34, px: 1.5 }}
            >
              Logout
            </Button>
          </Stack>
        </Box>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
