import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { assetUrl, COMPANY_NAME } from './brand'
import { hoursFromRecord } from './payroll'
import type { AttendanceRecord, Employee } from './types'
import { formatUKDate, formatUKDateTime, formatUKTime } from './uk'
import { getDepartmentLabel } from './types'

const BRAND_BLUE: [number, number, number] = [26, 111, 212]
const TEXT_DARK: [number, number, number] = [30, 41, 59]
const TEXT_MUTED: [number, number, number] = [100, 116, 139]

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function formatHours(hours: number): string {
  if (hours <= 0) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function statusLabel(status: AttendanceRecord['status']): string {
  return status === 'signed_in' ? 'Signed In' : 'Signed Out'
}

interface PdfHeaderOptions {
  title: string
  subtitle?: string
  generatedBy?: string
}

async function drawHeader(doc: jsPDF, options: PdfHeaderOptions): Promise<number> {
  let y = 16

  const logo = await loadImageBase64(assetUrl('site_logo.png'))
  if (logo) {
    doc.addImage(logo, 'PNG', 14, y - 4, 28, 14)
    y += 18
  } else {
    doc.setFontSize(14)
    doc.setTextColor(...BRAND_BLUE)
    doc.setFont('helvetica', 'bold')
    doc.text(COMPANY_NAME, 14, y)
    y += 10
  }

  doc.setFontSize(16)
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(options.title, 14, y)
  y += 7

  if (options.subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(...TEXT_MUTED)
    doc.setFont('helvetica', 'normal')
    doc.text(options.subtitle, 14, y)
    y += 6
  }

  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MUTED)
  const generated = `Generated ${formatUKDateTime(new Date().toISOString())}`
  doc.text(generated, 14, y)
  if (options.generatedBy) {
    doc.text(`By ${options.generatedBy}`, 14, y + 5)
    y += 5
  }
  y += 8

  doc.setDrawColor(...BRAND_BLUE)
  doc.setLineWidth(0.5)
  doc.line(14, y, 196, y)

  return y + 8
}

function drawEmployeeBlock(doc: jsPDF, employee: Employee, y: number): number {
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(`${employee.firstName} ${employee.lastName}`, 14, y)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...TEXT_MUTED)
  const details = [
    `Staff ID: ${employee.employeeId}`,
    `Department: ${getDepartmentLabel(employee.department)}`,
    `Job Title: ${employee.jobTitle}`,
    employee.email,
  ]
  let lineY = y + 6
  for (const line of details) {
    doc.text(line, 14, lineY)
    lineY += 5
  }
  return lineY + 4
}

export async function exportEmployeeAttendancePdf(
  employee: Employee,
  records: AttendanceRecord[],
  periodStart: string,
  periodEnd: string,
  generatedBy?: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  let y = await drawHeader(doc, {
    title: 'Attendance History Report',
    subtitle: `Period: ${formatUKDate(periodStart)} – ${formatUKDate(periodEnd)}`,
    generatedBy,
  })

  y = drawEmployeeBlock(doc, employee, y)

  const totalHours = records.reduce((sum, r) => sum + hoursFromRecord(r), 0)
  const completedDays = new Set(
    records.filter((r) => r.status === 'signed_out').map((r) => r.date),
  ).size

  doc.setFontSize(9)
  doc.setTextColor(...TEXT_DARK)
  doc.text(
    `Total records: ${records.length}  ·  Completed days: ${completedDays}  ·  Total hours: ${formatHours(totalHours)}`,
    14,
    y,
  )
  y += 8

  const rows =
    records.length === 0
      ? [['—', '—', '—', '—', 'No attendance records in this period']]
      : records.map((r) => [
          formatUKDate(r.date),
          formatUKTime(r.signInTime),
          r.signOutTime ? formatUKTime(r.signOutTime) : '—',
          formatHours(hoursFromRecord(r)),
          statusLabel(r.status),
        ])

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Sign In', 'Sign Out', 'Hours', 'Status']],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: BRAND_BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MUTED)
    doc.text(
      `${COMPANY_NAME} — Confidential — Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' },
    )
  }

  const filename = `attendance-${employee.employeeId}-${periodStart}-to-${periodEnd}.pdf`
  doc.save(filename)
}

export async function exportTeamAttendancePdf(
  records: AttendanceRecord[],
  periodStart: string,
  periodEnd: string,
  generatedBy?: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  let y = await drawHeader(doc, {
    title: 'Team Attendance History Report',
    subtitle: `Period: ${formatUKDate(periodStart)} – ${formatUKDate(periodEnd)}`,
    generatedBy,
  })

  const employeeCount = new Set(records.map((r) => r.employee._id)).size
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_DARK)
  doc.text(`People: ${employeeCount}  ·  Total records: ${records.length}`, 14, y)
  y += 8

  const rows =
    records.length === 0
      ? [['—', '—', '—', '—', '—', '—', 'No records']]
      : records.map((r) => [
          r.employee.employeeId,
          `${r.employee.firstName} ${r.employee.lastName}`,
          getDepartmentLabel(r.employee.department),
          formatUKDate(r.date),
          formatUKTime(r.signInTime),
          r.signOutTime ? formatUKTime(r.signOutTime) : '—',
          formatHours(hoursFromRecord(r)),
          statusLabel(r.status),
        ])

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Name', 'Department', 'Date', 'Sign In', 'Sign Out', 'Hours', 'Status']],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: BRAND_BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_MUTED)
    doc.text(
      `${COMPANY_NAME} — Confidential — Page ${i} of ${pageCount}`,
      148,
      200,
      { align: 'center' },
    )
  }

  doc.save(`attendance-team-${periodStart}-to-${periodEnd}.pdf`)
}
