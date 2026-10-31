function doPost(e) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty('WEBHOOK_SECRET');
    const spreadsheetId = properties.getProperty('SPREADSHEET_ID');
    const data = JSON.parse(e.postData.contents);
    const roles = ['', 'Advocate', 'Barrister or solicitor', 'Law firm or chambers team', 'Paralegal or legal operations', 'Other'];
    const platforms = ['', 'Windows', 'macOS', 'Both'];

    if (!expectedSecret || !spreadsheetId || data.secret !== expectedSecret ||
        !/^[0-9a-f-]{36}$/i.test(data.id) ||
        typeof data.name !== 'string' || !data.name || data.name.length > 120 ||
        !/^[\p{L}\p{M}]/u.test(data.name) || /[\r\n\x00-\x1f]/.test(data.name) ||
        typeof data.email !== 'string' || data.email.length > 254 ||
        !/^[^\s@=+\-][^\s@]*@[^\s@.]+(?:\.[^\s@.]+)+$/.test(data.email) ||
        !roles.includes(data.role) || !platforms.includes(data.platform) ||
        !/^\d{4}-\d{2}-\d{2}T/.test(data.submittedAt) ||
        !/^\d{4}-\d{2}-\d{2}T/.test(data.consentAt) || data.source !== '/') {
      return reply(false);
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    try {
      const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Early Access');
      if (!sheet) throw new Error('Early Access tab is missing');
      sheet.appendRow([
        data.id, data.submittedAt, data.name, data.email,
        data.role, data.platform, data.consentAt, data.source,
      ]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    return reply(true);
  } catch (error) {
    console.error(error);
    return reply(false);
  }
}

function reply(success) {
  return ContentService.createTextOutput(JSON.stringify({ success: success }))
    .setMimeType(ContentService.MimeType.JSON);
}
