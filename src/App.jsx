import { lazy, Suspense } from 'react'
import {
  Navigate,
  Outlet,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const BaptismRecords = lazy(() => import('./pages/BaptismRecords'))
const ConfirmationRecords = lazy(() => import('./pages/ConfirmationRecords'))
const MarriageRecords = lazy(() => import('./pages/MarriageRecords'))
const DeathRecords = lazy(() => import('./pages/DeathRecords'))
const ConversionRecords = lazy(() => import('./pages/ConversionRecords'))
const MassIntentions = lazy(() => import('./pages/MassIntentions'))
const ManageMinisters = lazy(() => import('./pages/ManageMinisters'))
const Reports = lazy(() => import('./pages/Reports'))
const Profile = lazy(() => import('./pages/Profile'))
const Unauthorized = lazy(() => import('./pages/Unauthorized'))
const NotFound = lazy(() => import('./pages/NotFound'))

function RouteFallback() {
  return (
    <Box
      sx={{
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <CircularProgress size={28} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Loading…
        </Typography>
      </Stack>
    </Box>
  )
}

function RootLayout() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  )
}

function ProtectedShell() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'staff']}>
      <AdminLayout />
    </ProtectedRoute>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/unauthorized', element: <Unauthorized /> },
      {
        element: <ProtectedShell />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/records/baptism', element: <BaptismRecords /> },
          {
            path: '/records/confirmation',
            element: <ConfirmationRecords />,
          },
          { path: '/records/marriage', element: <MarriageRecords /> },
          { path: '/records/death', element: <DeathRecords /> },
          { path: '/records/conversion', element: <ConversionRecords /> },
          { path: '/mass-intentions', element: <MassIntentions /> },
          { path: '/ministers', element: <ManageMinisters /> },
          {
            path: '/maintenance/ministers',
            element: <Navigate to="/ministers" replace />,
          },
          { path: '/reports', element: <Reports /> },
          { path: '/profile', element: <Profile /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
