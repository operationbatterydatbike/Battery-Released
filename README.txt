# QR Mobile Web → Google Sheets

## 1. Upload 4 file
Upload `.htaccess`, `index.html`, `style.css`, `app.js` lên hosting Apache.

## 2. Tạo Google Apps Script
Tạo một Google Sheet với 2 cột:
- Thời gian
- Mã QR

Vào Extensions → Apps Script và dùng đoạn code sau:

```javascript
const SHEET_NAME = "Sheet1";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const qr = data.qr || "";
    const timestamp = data.timestamp || new Date().toISOString();

    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    sheet.appendRow([
      new Date(timestamp),
      qr
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: String(err)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Deploy → New deployment → Web app:
- Execute as: Me
- Who has access: Anyone

Copy URL Web App.

## 3. Cấu hình app.js
Mở `app.js` và thay:

`YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL`

bằng URL Web App vừa tạo.

## 4. Lưu ý camera
Camera trên mobile web cần HTTPS (trừ localhost). Vì vậy domain/hosting phải có SSL.

## 5. Luồng hoạt động
Điện thoại → Camera → đọc QR → JavaScript → Google Apps Script → Google Sheet.

Dữ liệu gửi gồm:
- `timestamp`: thời gian ISO của thiết bị
- `qr`: nội dung mã QR
