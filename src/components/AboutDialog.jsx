import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import parishLogo from '../assets/parish-connect-logo.png'
import { MARIAN_BLUE } from '../theme/parishTheme'

/** Shown in footer & login credits. */
export const ABOUT_DEVELOPED_BY = 'Parish Connect Team Developers'

/** Edit Special Thanks manually. */
export const ABOUT_SPECIAL_THANKS = ' Prof. John Vianney V. Manuel'

const DEVELOPERS = [
  { name: 'Renz Rafael Veloria', role: 'Project Leader' },
  { name: 'Mark Juven Neypes', role: 'Lead Full-Stack Developer' },
  { name: 'Jerome Noblado', role: 'Quality Tester' }
]

const DOCUMENTATION_TEAM = [
  { name: 'Janemell Renzae Clavero', role: 'Documentation Leader' },
  { name: 'Jan Karlo Navarrete', role: 'Data Gathering' },
  { name: 'Daren Tobias', role: 'Documentation Gathering' },
  { name: 'Nelson Valix', role: 'Documentation Team' }
]

function CreditPerson({ name, role }) {
  return (
    <Box sx={{ py: 0.35 }}>
      <Typography
        variant="body2"
        sx={{ color: 'text.primary', fontWeight: 600, lineHeight: 1.35 }}
      >
        {name}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.35 }}
      >
        {role}
      </Typography>
    </Box>
  )
}

/**
 * Shared About / credits dialog for Parish Connect.
 */
export default function AboutDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      scroll="body"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: { xs: 2.5, sm: 3 } }}>
        <Stack spacing={2.25} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            component="img"
            src={parishLogo}
            alt="Parish Connect"
            sx={{
              width: { xs: 64, sm: 72 },
              height: { xs: 64, sm: 72 },
              objectFit: 'contain',
              borderRadius: 1.5,
              display: 'block',
            }}
          />

          <Box>
            <Typography
              variant="h6"
              sx={{
                color: MARIAN_BLUE,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              Parish Connect
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.75, color: 'text.secondary', fontWeight: 600 }}
            >
              Version 1.0.0
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.35, color: 'text.secondary' }}
            >
              Church Management System
            </Typography>
          </Box>

          <Divider sx={{ width: '100%' }} />

          <Box sx={{ width: '100%' }}>
            <Typography
              variant="overline"
              sx={{
                color: MARIAN_BLUE,
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              Developed By
            </Typography>

            <Stack spacing={0.75} sx={{ mt: 1 }}>
              {DEVELOPERS.map((person) => (
                <CreditPerson key={person.name} {...person} />
              ))}
            </Stack>

            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                mb: 0.75,
                color: 'text.primary',
                fontWeight: 700,
              }}
            >
              Documentation Team
            </Typography>

            <Stack spacing={0.75}>
              {DOCUMENTATION_TEAM.map((person) => (
                <CreditPerson key={person.name} {...person} />
              ))}
            </Stack>
          </Box>

          <Box sx={{ width: '100%' }}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 600 }}
            >
              BS Information Technology
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.35, color: 'text.secondary' }}
            >
              Golden West Colleges
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.35, color: 'text.secondary' }}
            >
              Academic Year 2026–2027
            </Typography>
          </Box>

          <Divider sx={{ width: '100%' }} />

          <Box sx={{ width: '100%' }}>
            <Typography
              variant="overline"
              sx={{
                color: MARIAN_BLUE,
                fontWeight: 700,
                letterSpacing: '0.08em',
              }}
            >
              Special Thanks
            </Typography>
             
            <Typography
              variant="body2"
              sx={{ mt: 0.75, color: 'text.primary', fontWeight: 600, whiteSpace: 'pre-line' }}
            >
              {ABOUT_SPECIAL_THANKS}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.75, color: 'text.secondary', fontWeight: 600, whiteSpace: 'pre-line' }}
            >
             Research Adviser
            </Typography>
          </Box>

          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', pt: 0.5 }}
          >
            © 2026 Parish Connect. All Rights Reserved.
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
