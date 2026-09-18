/**
 * ============================================================
 *  ShopAdmin ↔ Google Sheets Sync (Products + Orders ONLY)
 *  Google Apps Script — bound to a Google Sheet
 * ============================================================
 *
 *  SETUP (one time)
 *  ----------------
 *  1. Create a NEW blank Google Spreadsheet
 *  2. Extensions → Apps Script → delete default code
 *  3. Paste this entire file → Save
 *  4. Select function "setupSheets" → Run (once)
 *     → Creates Products and Orders sheets with headers
 *  5. Deploy → New deployment → Type: Web app
 *       - Execute as: Me
 *       - Who has access: Anyone
 *  6. Copy the Web App URL
 *  7. In admin portal → Settings → paste URL → Save
 *
 *  Storefront (GitHub Pages) loads products via:
 *    GET ?action=get&type=products
 *  Deploy as Web app → Who has access: Anyone
 */

const SHEET_NAMES = {
  products: 'Products',
  orders: 'Orders'
};

const HEADERS = {
  products: ['id', 'name', 'sku', 'category', 'price', 'stock', 'status', 'imageUrl', 'imageUrls', 'description', 'sizes', 'badge', 'rating', 'reviews', 'sales'],
  orders:   ['id', 'customer', 'email', 'phone', 'address', 'total', 'items', 'status', 'date', 'payment']
};

function doGet(e) {
  const action = (e.parameter.action || 'ping').toLowerCase();
  try {
    ensureAllSheets_();
    if (action === 'ping') {
      return json_({ ok: true, message: 'ShopAdmin Sheets API is live', sheets: Object.values(SHEET_NAMES) });
    }
    if (action === 'get') {
      const type = e.parameter.type;
      if (!SHEET_NAMES[type]) return json_({ ok: false, error: 'Invalid type. Use products or orders' }, 400);
      return json_({ ok: true, data: readSheet_(type) });
    }
    return json_({ ok: false, error: 'Unknown action' }, 400);
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) }, 500);
  }
}

function doPost(e) {
  try {
    ensureAllSheets_();
    const body = JSON.parse(e.postData.contents);
    const action = (body.action || '').toLowerCase();
    const type = body.type;

    if (action === 'sync') {
      if (!SHEET_NAMES[type]) return json_({ ok: false, error: 'Invalid type. Use products or orders' }, 400);
      writeSheet_(type, body.data || []);
      return json_({ ok: true, message: type + ' fully synced', count: (body.data || []).length });
    }
    if (action === 'append') {
      if (!SHEET_NAMES[type]) return json_({ ok: false, error: 'Invalid type. Use products or orders' }, 400);
      appendRows_(type, body.data || []);
      return json_({ ok: true, message: 'Appended', count: (body.data || []).length });
    }
    if (action === 'update_order_status') {
      updateOrderStatus_(body.orderId, body.status);
      return json_({ ok: true, message: 'Order status updated' });
    }
    return json_({ ok: false, error: 'Unknown action' }, 400);
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) }, 500);
  }
}

function ensureAllSheets_() {
  Object.keys(SHEET_NAMES).forEach(function (type) {
    var name = SHEET_NAMES[type];
    var sheet = getSheet_(name);
    var range = sheet.getDataRange();
    var needsHeaders = false;
    if (range.getNumRows() === 0) {
      needsHeaders = true;
    } else {
      var firstRow = range.getValues()[0];
      if (!firstRow || firstRow.join('').trim() === '') needsHeaders = true;
    }
    if (needsHeaders) {
      sheet.clear();
      sheet.appendRow(HEADERS[type]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS[type].length).setFontWeight('bold');
    }
  });
}

function getSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function readSheet_(type) {
  var name = SHEET_NAMES[type];
  if (!name) throw new Error('Invalid type: ' + type);
  var sheet = getSheet_(name);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h).trim(); });
  return values.slice(1).map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function writeSheet_(type, data) {
  var name = SHEET_NAMES[type];
  if (!name) throw new Error('Invalid type: ' + type);
  var sheet = getSheet_(name);
  sheet.clear();
  var headers = HEADERS[type];
  var rows = [headers];
  (data || []).forEach(function (item) {
    rows.push(headers.map(function (h) {
      var v = item[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    }));
  });
  if (rows.length > 1) {
    sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  } else {
    sheet.appendRow(headers);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

function appendRows_(type, data) {
  var name = SHEET_NAMES[type];
  if (!name) throw new Error('Invalid type: ' + type);
  var sheet = getSheet_(name);
  var existing = sheet.getDataRange().getValues();
  var headers = HEADERS[type];
  if (existing.length === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  } else {
    headers = existing[0].map(function (h) { return String(h).trim(); });
  }
  (data || []).forEach(function (item) {
    sheet.appendRow(headers.map(function (h) {
      var v = item[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    }));
  });
}

function updateOrderStatus_(orderId, status) {
  var sheet = getSheet_(SHEET_NAMES.orders);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var idIdx = headers.indexOf('id');
  var statusIdx = headers.indexOf('status');
  if (idIdx === -1 || statusIdx === -1) throw new Error('Orders sheet missing id or status column');
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idIdx]) === String(orderId)) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(status);
      return;
    }
  }
  throw new Error('Order not found: ' + orderId);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the Apps Script editor. */
function setupSheets() {
  ensureAllSheets_();
  SpreadsheetApp.getUi().alert('Products and Orders sheets created / verified!');
}
