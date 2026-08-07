import {
  Box,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { MARIAN_BLUE } from '../theme/parishTheme'
import { buildUnifiedReportDocument } from '../reports/unifiedReportDocument'

/**
 * Official Parish Connect report template (Preview + Print).
 * PDF must mirror this exact structure.
 */
export default function ReportTemplate({ summary, rows = [] }) {
  const report = buildUnifiedReportDocument({ summary, rows })
  const { header, title, summaryFields, columns, footer } = report

  return (
    <Box
      className="parish-report-template"
      sx={{
        bgcolor: '#fff',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        '@media print': {
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
        },
      }}
    >
      <Box sx={{ p: { xs: 2.25, sm: 3 } }}>
        {/* Church Header */}
        <Stack
          direction="row"
          spacing={2}
         
          sx={{ alignItems: "center", mb: 2.5 }}
        >
          <Box
            component="img"
            src={header.logoUrl}
            alt="Church Logo"
            sx={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: MARIAN_BLUE,
                fontSize: { xs: '1.05rem', sm: '1.2rem' },
                lineHeight: 1.25,
              }}
            >
              {header.churchName}
            </Typography>
            <Typography
              sx={{
                mt: 0.35,
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: '0.92rem',
              }}
            >
              {header.systemName}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderColor: 'rgba(11, 61, 145, 0.18)', mb: 2.25 }} />

        {/* Report Title */}
        <Typography
          component="h2"
          sx={{
            textAlign: 'center',
            fontWeight: 800,
            color: MARIAN_BLUE,
            letterSpacing: '0.04em',
            fontSize: { xs: '1.05rem', sm: '1.2rem' },
            mb: 2.25,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>

        <Divider sx={{ borderColor: 'rgba(11, 61, 145, 0.18)', mb: 2 }} />

        {/* Report Summary */}
        <Typography
          sx={{
            fontWeight: 700,
            color: MARIAN_BLUE,
            fontSize: '0.95rem',
            mb: 1.25,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          Report Summary
        </Typography>

        <Box
          component="dl"
          sx={{
            m: 0,
            mb: 2.5,
            display: 'grid',
            gap: 0.85,
          }}
        >
          {summaryFields.map((field) => (
            <Box
              key={field.label}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' },
                columnGap: 1.5,
                alignItems: 'baseline',
              }}
            >
              <Typography
                component="dt"
                sx={{
                  m: 0,
                  fontWeight: 700,
                  color: 'text.primary',
                  fontSize: '0.9rem',
                }}
              >
                {field.label}:
              </Typography>
              <Typography
                component="dd"
                sx={{
                  m: 0,
                  fontWeight: 400,
                  color: 'text.primary',
                  fontSize: '0.9rem',
                }}
              >
                {field.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'rgba(11, 61, 145, 0.18)', mb: 2 }} />

        {/* Records Table */}
        <Typography
          sx={{
            fontWeight: 700,
            color: MARIAN_BLUE,
            fontSize: '0.95rem',
            mb: 1.25,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
          }}
        >
          Records Table
        </Typography>

        <TableContainer sx={{ overflowX: 'auto', mb: 2.5 }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={{
                      fontWeight: 700,
                      color: '#fff',
                      bgcolor: MARIAN_BLUE,
                      borderColor: MARIAN_BLUE,
                      py: 1.1,
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columns.length, 1)}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2, textAlign: 'center' }}
                    >
                      No records in this report.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={{
                          borderColor: 'divider',
                          fontSize: '0.875rem',
                          color: 'text.primary',
                          py: 1,
                        }}
                      >
                        {row[column.key] ?? '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ borderColor: 'rgba(11, 61, 145, 0.18)', mb: 2 }} />

        {/* Prepared By */}
        <Typography
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.95rem',
            mb: 1.5,
          }}
        >
          {footer.endOfReport}
        </Typography>

        <Typography
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            fontSize: '0.9rem',
            mb: 2.5,
          }}
        >
          {footer.preparedByLabel}

        </Typography>

        <Box
          sx={{
            width: { xs: '100%', sm: 320 },
            borderBottom: '1px solid',
            borderColor: 'text.primary',
            mb: 1,
            minHeight: 28,
          }}
        />

        <Typography
          sx={{
            fontWeight: 400,
            color: 'text.primary',
            fontSize: '0.9rem',
            mb: 2.5,
          }}
        >
          {footer.preparedByRole}
        </Typography>

        <Typography
          sx={{
            fontWeight: 500,
            color: 'text.secondary',
            fontSize: '0.82rem',
            fontStyle: 'italic',
          }}
        >
          {footer.systemLine}
        </Typography>
      </Box>
    </Box>
  )
}
