/**
 * =========================================================================
 * 2027 年度服事行事曆 - Google Apps Script (Web App) API 接收端
 * =========================================================================
 * 
 * 📌 部署 3 分鐘教學：
 * 
 * 1. 打開你的 Google 試算表（或建立一個新的試算表）：
 *    👉 試算表名稱可自訂，工作表建議命名為「2027事工行事曆」（或預設的「工作表1」皆可）。
 * 
 * 2. 開啟 Apps Script 編輯器：
 *    👉 在試算表上方選單點選【擴充功能】➔【Apps Script】。
 * 
 * 3. 貼上程式碼：
 *    👉 將 Apps Script 編輯器中現有的所有程式碼清空，把本檔案全部程式碼貼上。
 *    👉 點選上方磁碟機圖示【儲存 💾】。
 * 
 * 4. （強烈推薦）一鍵初始化試算表：
 *    👉 在上方工具列的函數下拉選單中，選取【setupSheet】。
 *    👉 點擊旁邊的【執行】（第一次執行時 Google 會跳出授權視窗，點選「審查權限」➔ 選擇你的帳號 ➔「進階」➔「前往專案(不安全)」➔「允許」）。
 *    👉 執行完成後回到你的 Google 試算表，會看到 15 個標準欄位標題與 53 筆 2027 全年事工已自動排版建立完畢！
 * 
 * 5. 發布為 Web App (網頁應用程式)：
 *    👉 點擊右上角藍色按鈕【部署】➔【新增部署】。
 *    👉 點選左側齒輪 ⚙️ 圖示，選擇【網頁應用程式 (Web app)】。
 *    👉 設定如下（非常重要！）：
 *       - 說明：2027 Outreach Schedule API
 *       - 執行身分：我 (你的帳號 / user's email)
 *       - 誰可以存取：所有人 (Anyone)  <--- ⚠️ 必須選「所有人」，前端網頁才能免登入直接同步！
 *    👉 點擊【部署】，複製產生的【網頁應用程式網址】（網址結尾為 /exec）。
 * 
 * 6. 連接至 2027 行事曆 App：
 *    👉 打開 2027 行事曆 App，點擊頂部【雲端同步】或 ⚙️ 齒輪。
 *    👉 將該網址貼入「Google 試算表發布網址 (CSV / Web App API)」，點擊【儲存設定並同步】。
 *    👉 即刻啟用真正的雙向即時雲端同步！
 * =========================================================================
 */

// 15 個標準欄位標題
var HEADERS = [
  "id",
  "category",
  "categoryName",
  "title",
  "date",
  "time",
  "dayOfWeek",
  "month",
  "location",
  "locationUrl",
  "topic",
  "description",
  "needs",
  "itemsToBring",
  "status"
];

/**
 * HTTP GET 處理端：從 Google 試算表讀取所有活動資料並回傳 JSON
 */
function doGet(e) {
  try {
    var sheet = getTargetSheet_();
    var data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return createJsonResponse_({
        status: "success",
        count: 0,
        events: [],
        message: "試算表目前尚無活動資料，可執行 setupSheet() 或由前端推播同步。"
      });
    }

    var headerRow = data[0].map(function(h) { return String(h).trim(); });
    var events = [];

    for (var r = 1; r < data.length; r++) {
      var row = data[r];
      // 略過全空行
      if (row.length === 0 || row.every(function(cell) { return String(cell).trim() === ""; })) {
        continue;
      }

      var item = {};
      for (var c = 0; c < headerRow.length; c++) {
        var key = headerRow[c];
        if (!key) continue;
        var val = row[c];

        if (val instanceof Date) {
          val = Utilities.formatDate(val, Session.getScriptTimeZone() || "Asia/Taipei", "yyyy-MM-dd");
        } else if (val === null || val === undefined) {
          val = "";
        } else {
          val = String(val).trim();
        }

        item[key] = val;
      }

      // 自動解析月份數字
      if (item.month) {
        var parsedMonth = parseInt(item.month, 10);
        item.month = !isNaN(parsedMonth) ? parsedMonth : 1;
      } else if (item.date && item.date.indexOf("-") > -1) {
        var parts = item.date.split("-");
        if (parts.length >= 2) {
          item.month = parseInt(parts[1], 10) || 1;
        }
      }

      // 只要有標題就列為有效活動
      if (item.title) {
        if (!item.id) item.id = "evt-" + r;
        events.push(item);
      }
    }

    return createJsonResponse_({
      status: "success",
      count: events.length,
      events: events,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse_({
      status: "error",
      message: "讀取試算表失敗: " + err.toString()
    });
  }
}

/**
 * HTTP POST 處理端：接收前端傳來的活動資料，寫入 Google 試算表
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse_({
        status: "error",
        message: "無效的 POST 請求：缺少內容資料"
      });
    }

    var payload = JSON.parse(e.postData.contents);
    var events = [];

    if (Array.isArray(payload)) {
      events = payload;
    } else if (payload.events && Array.isArray(payload.events)) {
      events = payload.events;
    } else if (payload.event) {
      events = [payload.event];
    } else {
      return createJsonResponse_({
        status: "error",
        message: "無法在請求內容中解析出 events 活動陣列"
      });
    }

    var sheet = getTargetSheet_();
    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);

    // 確保標題列
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

    // 清空舊的內容列（保留第一列標題）
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
    }

    // 寫入新資料
    if (events.length > 0) {
      var rows = events.map(function(item) {
        return HEADERS.map(function(header) {
          var val = item[header];
          if (val === undefined || val === null) return "";
          return String(val);
        });
      });

      sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
    }

    return createJsonResponse_({
      status: "success",
      message: "已成功寫入 Google 試算表！共 " + events.length + " 筆活動。",
      count: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse_({
      status: "error",
      message: "寫入試算表失敗: " + err.toString()
    });
  }
}

/**
 * 輔助函數：建立 JSON 回傳格式並設定 CORS 標頭
 */
function createJsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 輔助函數：取得目標工作表
 */
function getTargetSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("2027事工行事曆") || ss.getSheetByName("工作表1") || ss.getSheetByName("Sheet1") || ss.getActiveSheet();
  return sheet;
}

/**
 * 🛠️ 一鍵快速建置工作表與初始化範本資料（在 Apps Script 點擊執行）
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("2027事工行事曆");
  if (!sheet) {
    sheet = ss.getActiveSheet();
    sheet.setName("2027事工行事曆");
  }

  // 1. 設定標題列與美化樣式
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange.setFontWeight("bold");
  headerRange.setFontColor("#ffffff");
  headerRange.setBackground("#1e293b"); // 深藍灰色高雅專業
  headerRange.setHorizontalAlignment("center");
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);

  // 2. 自動調整欄寬
  sheet.setColumnWidth(1, 110); // id
  sheet.setColumnWidth(2, 110); // category
  sheet.setColumnWidth(3, 110); // categoryName
  sheet.setColumnWidth(4, 250); // title
  sheet.setColumnWidth(5, 120); // date
  sheet.setColumnWidth(6, 170); // time
  sheet.setColumnWidth(7, 80);  // dayOfWeek
  sheet.setColumnWidth(8, 70);  // month
  sheet.setColumnWidth(9, 140); // location
  sheet.setColumnWidth(10, 180); // locationUrl
  sheet.setColumnWidth(11, 260); // topic
  sheet.setColumnWidth(12, 320); // description
  sheet.setColumnWidth(13, 200); // needs
  sheet.setColumnWidth(14, 180); // itemsToBring
  sheet.setColumnWidth(15, 100); // status

  Logger.log("✅ 試算表格式已完成初始化設定！");
}
