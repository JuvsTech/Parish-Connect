import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { buildUnifiedReportDocument } from '../reports/unifiedReportDocument'

async function loadLogoDataUrl(logoUrl) {
  try {
    const response = await fetch(logoUrl)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function drawPdfHeader(doc, report, logoDataUrl, marginX, pageWidth) {
  let cursorY = 36

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', marginX, cursorY, 52, 52)
    } catch {
      // Continue without logo.
    }
  }

  const textX = logoDataUrl ? marginX + 64 : marginX

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(11, 61, 145)
  doc.text(report.header.churchName, textX, cursorY + 18, {
    maxWidth: pageWidth - textX - marginX,
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(report.header.systemName, textX, cursorY + 34)

  cursorY += 68
  doc.setDrawColor(11, 61, 145)
  doc.setLineWidth(0.6)
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY)
  cursorY += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(11, 61, 145)
  doc.text(report.title, pageWidth / 2, cursorY, { align: 'center' })
  cursorY += 14

  doc.line(marginX, cursorY, pageWidth - marginX, cursorY)
  return cursorY + 16
}

function drawPdfSummary(doc, report, marginX, startY) {
  let cursorY = startY

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(11, 61, 145)
  doc.text('REPORT SUMMARY', marginX, cursorY)
  cursorY += 16

  report.summaryFields.forEach((field) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    const label = `${field.label}:`
    doc.text(label, marginX, cursorY)

    const labelWidth = doc.getTextWidth(label) + 8
    doc.setFont('helvetica', 'normal')
    doc.text(String(field.value), marginX + labelWidth, cursorY)
    cursorY += 14
  })

  return cursorY + 8
}

function drawPdfFooterBlock(doc, report, marginX, startY, pageWidth) {
  let cursorY = startY
  const pageHeight = doc.internal.pageSize.getHeight()
  const bottomLimit = pageHeight - 56

  if (cursorY > bottomLimit - 90) {
    doc.addPage()
    cursorY = 48
  }

  doc.setDrawColor(11, 61, 145)
  doc.setLineWidth(0.6)
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY)
  cursorY += 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 30, 30)
  doc.text(report.footer.endOfReport, marginX, cursorY)
  cursorY += 20

  doc.setFontSize(10)
  doc.text(report.footer.preparedByLabel, marginX, cursorY)
  cursorY += 28

  doc.setLineWidth(0.5)
  doc.setDrawColor(40, 40, 40)
  doc.line(marginX, cursorY, marginX + 220, cursorY)
  cursorY += 14

  doc.setFont('helvetica', 'normal')
  doc.text(report.footer.preparedByRole, marginX, cursorY)
  cursorY += 20

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  doc.text(report.footer.systemLine, marginX, cursorY)
}

/**
 * PDF export — same unified report template as Preview / Print.
 * Consumes the already-generated dataset (no Firestore query).
 */
export async function exportReportPdf({ summary, rows, fileName }) {
  const report = buildUnifiedReportDocument({ summary, rows })
  const wide = report.columns.length > 4
  const doc = new jsPDF({
    orientation: wide ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 40
  const logoDataUrl = await loadLogoDataUrl(report.header.logoUrl)

  let cursorY = drawPdfHeader(doc, report, logoDataUrl, marginX, pageWidth)
  cursorY = drawPdfSummary(doc, report, marginX, cursorY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(11, 61, 145)
  doc.text('RECORDS TABLE', marginX, cursorY)
  cursorY += 10

  const head = [report.columns.map((column) => column.label)]
  const body = report.rows.map((row) =>
    report.columns.map((column) => String(row[column.key] ?? '—')),
  )

  autoTable(doc, {
    startY: cursorY,
    head,
    body,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [11, 61, 145],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    margin: { left: marginX, right: marginX },
    didDrawPage(data) {
      if (data.pageNumber > 1) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(11, 61, 145)
        doc.text(report.title, pageWidth / 2, 28, { align: 'center' })
      }

      const pageCount = doc.getNumberOfPages()
      const pageSize = doc.internal.pageSize
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageSize.getWidth() / 2,
        pageSize.getHeight() - 18,
        { align: 'center' },
      )
    },
  })

  const finalY = (doc.lastAutoTable?.finalY || cursorY) + 16
  drawPdfFooterBlock(doc, report, marginX, finalY, pageWidth)

  doc.save(fileName)
}
