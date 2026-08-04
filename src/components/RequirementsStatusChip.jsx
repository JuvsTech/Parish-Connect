import { Chip, Stack, Typography } from '@mui/material'

/**
 * Compact requirements ratio + status chip for sacramental list tables.
 */
export default function RequirementsStatusChip({ summary }) {
  if (!summary) return null

  const complete = summary.status === 'complete'

  return (
    <Stack spacing={0.5} sx={{ alignItems: "flex-start" }}>
      <Typography
        variant="body2"
        sx={{ fontWeight: 650, color: 'text.primary', lineHeight: 1.2 }}
      >
        {summary.ratioLabel}
      </Typography>
      <Chip
        size="small"
        label={complete ? '✔ Complete' : '⚠ Incomplete'}
        sx={{
          height: 22,
          fontSize: '0.68rem',
          fontWeight: 650,
          bgcolor: complete
            ? 'rgba(46, 125, 50, 0.1)'
            : 'rgba(237, 108, 2, 0.12)',
          color: complete ? '#2E7D32' : '#ED6C02',
        }}
      />
    </Stack>
  )
}
