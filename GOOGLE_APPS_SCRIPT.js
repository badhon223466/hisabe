/**
 * GOOGLE APPS SCRIPT CODE
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Create 4 tabs: "Expenses", "Incomes", "Dues", "Payments".
 * 3. In "Expenses", add headers: Date, Category, Amount, Note, Timestamp
 * 4. In "Incomes", add headers: Date, Source, Amount, Note, Timestamp
 * 5. In "Dues", add headers: Person Name, Phone, Amount, Note, Timestamp
 * 6. In "Payments", add headers: Person Name, Amount, Date, Timestamp
 * 7. Go to Extensions > Apps Script.
 * 8. Paste this code and Deploy as Web App (Execute as: Me, Access: Anyone).
 * 9. Copy the Web App URL and set it as VITE_GAS_URL in your environment.
 */

/*
function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const action = e.parameter.action;
  
  if (action === 'getData') {
    const expenses = getSheetData(sheet.getSheetByName('Expenses'));
    const incomes = getSheetData(sheet.getSheetByName('Incomes'));
    const dues = getSheetData(sheet.getSheetByName('Dues'));
    const payments = getSheetData(sheet.getSheetByName('Payments'));
    
    return ContentService.createTextOutput(JSON.stringify({
      expenses, incomes, dues, payments
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  let data;
  
  try {
    // Handle both JSON and text/plain content types
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    // Fallback for different content types if needed
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = data.action;
  
  let targetSheet;
  let rowData;
  
  if (action === 'addExpense') {
    targetSheet = sheet.getSheetByName('Expenses');
    rowData = [data.date, data.category, data.amount, data.note, new Date()];
  } else if (action === 'addIncome') {
    targetSheet = sheet.getSheetByName('Incomes');
    rowData = [data.date, data.source, data.amount, data.note, new Date()];
  } else if (action === 'addDue') {
    targetSheet = sheet.getSheetByName('Dues');
    rowData = [data.personName, data.phone, data.amount, data.note, new Date()];
  } else if (action === 'receivePayment') {
    targetSheet = sheet.getSheetByName('Payments');
    rowData = [data.personName, data.amount, data.date, new Date()];
  }
  
  if (targetSheet) {
    targetSheet.appendRow(rowData);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.toLowerCase().replace(/ /g, '')] = row[i];
    });
    return obj;
  });
}
*/
