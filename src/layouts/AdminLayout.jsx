import { useEffect, useState } from 'react'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Chip,
  Collapse,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined'
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import VolunteerActivismOutlinedIcon from '@mui/icons-material/VolunteerActivismOutlined'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import { useAuth } from '../contexts/AuthContext'
import {
  UnsavedChangesProvider,
  useUnsavedChangesContext,
} from '../contexts/UnsavedChangesContext'
import { logout } from '../services/authService'
import { formatUserRoleLabel } from '../services/userProfileService'
import parishTheme, { MARIAN_BLUE } from '../theme/parishTheme'
import parishLogo from '../assets/parish-connect-logo.png'

const DRAWER_WIDTH = 272
const DRAWER_WIDTH_COLLAPSED = 84

const SACRAMENTAL_ITEMS = [
  {
    to: '/records/baptism',
    label: 'Baptismal Records',
    icon: WaterDropOutlinedIcon,
  },
  {
    to: '/records/confirmation',
    label: 'Confirmation Records',
    icon: VerifiedOutlinedIcon,
  },
  {
    to: '/records/marriage',
    label: 'Marriage Records',
    icon: FavoriteBorderOutlinedIcon,
  },
  {
    to: '/records/death',
    label: 'Death Records',
    icon: VolunteerActivismOutlinedIcon,
  },
  {
    to: '/records/conversion',
    label: 'Conversion Records',
    icon: HowToRegOutlinedIcon,
  },
]

const PRIMARY_ITEMS = [
  { to: '/', label: 'Dashboard', icon: DashboardOutlinedIcon, end: true },
  {
    to: '/mass-intentions',
    label: 'Mass Intentions',
    icon: AutoAwesomeOutlinedIcon,
  },
  {
    to: '/ministers',
    label: 'Manage Ministers',
    icon: Diversity3OutlinedIcon,
  },
  { to: '/reports', label: 'Reports', icon: AssessmentOutlinedIcon },
  { to: '/profile', label: 'Profile', icon: PersonOutlineOutlinedIcon },
]

function NavItem({ to, label, icon: Icon, end, collapsed, onNavigate, nested }) {
  const location = useLocation()
  const selected = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(`${to}/`)

  return (
    <Tooltip title={collapsed ? label : ''} placement="right">
      <ListItemButton
        component={RouterLink}
        to={to}
        selected={selected}
        onClick={onNavigate}
        sx={{
          minHeight: nested ? 42 : 46,
          justifyContent: collapsed ? 'center' : 'flex-start',
          px: collapsed ? 1.25 : nested ? 2 : 1.75,
          '&.Mui-selected': {
            bgcolor: 'rgba(11, 61, 145, 0.1)',
            color: MARIAN_BLUE,
            '& .MuiListItemIcon-root': { color: MARIAN_BLUE },
            '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.14)' },
          },
          '&:hover': {
            bgcolor: 'rgba(11, 61, 145, 0.06)',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 1.5,
            justifyContent: 'center',
            color: selected ? MARIAN_BLUE : 'text.secondary',
          }}
        >
          <Icon fontSize="small" />
        </ListItemIcon>
        {!collapsed && (
          <ListItemText
            primary={label}
            slotProps={{
              primary: {
                sx: {
                  fontSize: nested ? '0.88rem' : '0.92rem',
                  fontWeight: selected ? 650 : 500,
                },
              },
            }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  )
}

function SidebarContent({
  collapsed,
  sacramentalOpen,
  setSacramentalOpen,
  onNavigate,
  onLogout,
  onToggleCollapse,
  showCollapseButton,
}) {
  const location = useLocation()
  const sacramentalActive = SACRAMENTAL_ITEMS.some((item) =>
    location.pathname.startsWith(item.to),
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: collapsed ? 1.25 : 2,
          py: 2,
          minHeight: 72,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <Box
          component="img"
          src={parishLogo}
          alt="Parish Connect"
          sx={{
            width: collapsed ? 40 : 44,
            height: collapsed ? 40 : 44,
            objectFit: 'contain',
            flexShrink: 0,
            borderRadius: 1,
            display: 'block',
          }}
        />
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                color: MARIAN_BLUE,
                lineHeight: 1.15,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Parish Connect
            </Typography>
            <Typography
              noWrap
              sx={{
                mt: 0.25,
                fontSize: '11px',
                fontWeight: 500,
                color: 'text.secondary',
                lineHeight: 1.2,
              }}
            >
              Church Management System
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: 1.5, mb: 1 }} />

      <List sx={{ flex: 1, px: 0.5, py: 0.5, overflowY: 'auto' }}>
        <NavItem {...PRIMARY_ITEMS[0]} collapsed={collapsed} onNavigate={onNavigate} />

        <Tooltip title={collapsed ? 'Sacramental Records' : ''} placement="right">
          <ListItemButton
            onClick={() => setSacramentalOpen((open) => !open)}
            selected={sacramentalActive && collapsed}
            sx={{
              minHeight: 46,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1.25 : 1.75,
              '&.Mui-selected': {
                bgcolor: 'rgba(11, 61, 145, 0.1)',
                color: MARIAN_BLUE,
                '& .MuiListItemIcon-root': { color: MARIAN_BLUE },
              },
              '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.06)' },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 1.5,
                justifyContent: 'center',
                color: sacramentalActive ? MARIAN_BLUE : 'text.secondary',
              }}
            >
              <AutoStoriesOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText
                  primary="Sacramental Records"
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: '0.92rem',
                        fontWeight: sacramentalActive ? 650 : 500,
                      },
                    },
                  }}
                />
                {sacramentalOpen ? (
                  <ExpandLess fontSize="small" />
                ) : (
                  <ExpandMore fontSize="small" />
                )}
              </>
            )}
          </ListItemButton>
        </Tooltip>

        <Collapse in={!collapsed && sacramentalOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ pl: 1.25 }}>
            {SACRAMENTAL_ITEMS.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                nested
                collapsed={false}
                onNavigate={onNavigate}
              />
            ))}
          </List>
        </Collapse>

        {collapsed &&
          sacramentalOpen &&
          SACRAMENTAL_ITEMS.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              collapsed
              onNavigate={onNavigate}
            />
          ))}

        {PRIMARY_ITEMS.slice(1).map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </List>

      <Box sx={{ p: 1.25 }}>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <ListItemButton
            onClick={onLogout}
            sx={{
              minHeight: 46,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1.25 : 1.75,
              color: 'error.main',
              '&:hover': { bgcolor: 'rgba(198, 40, 40, 0.06)' },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 1.5,
                justifyContent: 'center',
                color: 'error.main',
              }}
            >
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Logout"
                slotProps={{
                  primary: {
                    sx: { fontSize: '0.92rem', fontWeight: 600 },
                  },
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>

        {showCollapseButton && (
          <ListItemButton
            onClick={onToggleCollapse}
            sx={{
              mt: 0.5,
              minHeight: 42,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1.25 : 1.75,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.06)' },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 0 : 1.5,
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <ChevronLeftIcon
                fontSize="small"
                sx={{
                  transform: collapsed ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s ease',
                }}
              />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Collapse"
                slotProps={{
                  primary: {
                    sx: { fontSize: '0.88rem', fontWeight: 500 },
                  },
                }}
              />
            )}
          </ListItemButton>
        )}
      </Box>
    </Box>
  )
}

function AdminLayoutShell() {
  const { currentUser, role, userProfile } = useAuth()
  const unsavedChanges = useUnsavedChangesContext()
  const location = useLocation()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [sacramentalOpen, setSacramentalOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const [logoutError, setLogoutError] = useState('')

  const drawerWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH
  const profileOpen = Boolean(anchorEl)
  const roleLabel = formatUserRoleLabel(role)
  const headerDisplayName =
    userProfile?.displayName || currentUser?.email || 'Parish User'
  const avatarSrc = userProfile?.photoURL || undefined
  const avatarLetter =
    userProfile?.initials ||
    (currentUser?.email?.[0] ?? 'A').toUpperCase()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (SACRAMENTAL_ITEMS.some((item) => location.pathname.startsWith(item.to))) {
      setSacramentalOpen(true)
    }
  }, [location.pathname])

  async function handleLogout() {
    setAnchorEl(null)
    setLogoutError('')

    const canLeave = unsavedChanges
      ? await unsavedChanges.confirmLeave()
      : true
    if (!canLeave) return

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      unsavedChanges?.cancelLeaving?.()
      console.error('Logout failed:', error)
      setLogoutError(
        error instanceof Error
          ? error.message
          : 'Logout failed. Please try again.',
      )
    }
  }

  const sidebarProps = {
    sacramentalOpen,
    setSacramentalOpen,
    onLogout: handleLogout,
  }

  return (
      <Box sx={{ display: 'flex', minHeight: '100svh', bgcolor: 'background.default' }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            transition: (theme) =>
              theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, px: { xs: 1.5, sm: 2.5 }, gap: 1.5 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: 'none' }, color: MARIAN_BLUE }}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  display: { xs: 'block', md: 'none' },
                  color: MARIAN_BLUE,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Parish Connect
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box
                onClick={(event) => setAnchorEl(event.currentTarget)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: { xs: 0.5, sm: 1 },
                  py: 0.5,
                  borderRadius: 999,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  '&:hover': { bgcolor: 'rgba(11, 61, 145, 0.05)' },
                }}
              >
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 600, maxWidth: 180, lineHeight: 1.2 }}
                  >
                    {headerDisplayName}
                  </Typography>
                  <Chip
                    size="small"
                    label={roleLabel}
                    sx={{
                      mt: 0.35,
                      height: 22,
                      fontSize: '0.7rem',
                      textTransform: 'capitalize',
                      bgcolor: 'rgba(11, 61, 145, 0.08)',
                      color: MARIAN_BLUE,
                      border: 'none',
                    }}
                  />
                </Box>
                <Avatar
                  src={avatarSrc}
                  slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: MARIAN_BLUE,
                    fontSize: '0.95rem',
                    fontWeight: 700,
                  }}
                >
                  {avatarLetter}
                </Avatar>
              </Box>
            </Stack>

            <Menu
              id="account-menu"
              anchorEl={anchorEl}
              open={profileOpen}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: {
                elevation: 3,
                sx: {
                  mt: 1.25,
                  minWidth: 240,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                },
              } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" noWrap>
                  {headerDisplayName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: MARIAN_BLUE, textTransform: 'capitalize', fontWeight: 700 }}
                >
                  {roleLabel}
                </Typography>
                {currentUser?.email && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: 'block', mt: 0.25 }}
                  >
                    {currentUser.email}
                  </Typography>
                )}
              </Box>
              <Divider />
              <MenuItem
                component={RouterLink}
                to="/profile"
                onClick={() => setAnchorEl(null)}
              >
                <ListItemIcon>
                  <PersonOutlineOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutOutlinedIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{ root: { keepMounted: true } }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <SidebarContent
            collapsed={false}
            onNavigate={() => setMobileOpen(false)}
            showCollapseButton={false}
            {...sidebarProps}
          />
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              overflowX: 'hidden',
              transition: (theme) =>
                theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
            },
          }}
        >
          <SidebarContent
            collapsed={collapsed}
            onNavigate={undefined}
            onToggleCollapse={() => setCollapsed((value) => !value)}
            showCollapseButton
            {...sidebarProps}
          />
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${drawerWidth}px)` },
            minWidth: 0,
            bgcolor: 'background.default',
            transition: (theme) =>
              theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 64, sm: 72 } }} />
          <Box
            component="section"
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              minHeight: 'calc(100svh - 72px)',
            }}
          >
            <Outlet />
          </Box>
        </Box>

        <Snackbar
          open={Boolean(logoutError)}
          autoHideDuration={5000}
          onClose={() => setLogoutError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setLogoutError('')}
            sx={{ width: '100%' }}
          >
            {logoutError}
          </Alert>
        </Snackbar>
      </Box>
  )
}

export default function AdminLayout() {
  return (
    <ThemeProvider theme={parishTheme}>
      <CssBaseline />
      <UnsavedChangesProvider>
        <AdminLayoutShell />
      </UnsavedChangesProvider>
    </ThemeProvider>
  )
}
