/**
 * Asahi Employee Management — Google Sheets Attendance Webhook
 *
 * After editing: Deploy → Manage deployments → Edit → New version → Deploy
 */

var SHEET_NAME = 'Attendance'

var HEADERS = [
  'Synced At',
  'Event',
  'Record ID',
  'Employee ID',
  'Employee Name',
  'Email',
  'Department',
  'Job Title',
  'Date (UK)',
  'Sign In (ISO)',
  'Sign In (UK Time)',
  'Sign Out (ISO)',
  'Sign Out (UK Time)',
  'Status',
  'Sign In Latitude',
  'Sign In Longitude',
  'Sign Out Latitude',
  'Sign Out Longitude',
]

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
  }
  return sheet
}

function setupAttendanceSheet() {
  var sheet = getOrCreateSheet_()
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS)
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold')
    sheet.setFrozenRows(1)
  }
  Logger.log('Attendance sheet ready: ' + SHEET_NAME)
}

function appendAttendanceRow_(data) {
  var sheet = getOrCreateSheet_()
  if (sheet.getLastRow() === 0) {
    setupAttendanceSheet()
  }

  sheet.appendRow([
    data.syncedAt || new Date().toISOString(),
    data.event || '',
    data.recordId || '',
    data.employeeId || '',
    data.employeeName || '',
    data.email || '',
    data.department || '',
    data.jobTitle || '',
    data.date || '',
    data.signInTime || '',
    data.signInTimeUK || '',
    data.signOutTime || '',
    data.signOutTimeUK || '',
    data.status || '',
    data.signInLatitude !== undefined ? data.signInLatitude : '',
    data.signInLongitude !== undefined ? data.signInLongitude : '',
    data.signOutLatitude !== undefined ? data.signOutLatitude : '',
    data.signOutLongitude !== undefined ? data.signOutLongitude : '',
  ])

  return ContentService.createTextOutput(
    JSON.stringify({ success: true }),
  ).setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  try {
    var data = {}
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents)
    }
    return appendAttendanceRow_(data)
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.payload) {
      var data = JSON.parse(e.parameter.payload)
      return appendAttendanceRow_(data)
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        ok: true,
        message: 'Asahi attendance webhook is running.',
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}
