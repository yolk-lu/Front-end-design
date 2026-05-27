# U-Smooth App - 智慧照護輔助系統

本專案是一個以 React Native (Expo) 開發的行動應用程式。主要是針對病患與照護者所設計的智慧照護與急迫尿意抑制輔助系統，並支援硬體數據監測（如尿濕提醒）。

---

## 頁面結構與子頁面樹狀圖 (Screen Tree)

以下為本專案的頁面路由與 Modal 視窗架構圖：

```
App (Root Stack Navigator - AppNavigator.js)
├── LoginScreen (登入頁面)
└── Main (主要導覽 - MainTabNavigator.js)
    ├── HomeScreen (首頁)
    │   ├── 彈出視窗 (Modals) 架構
    │   │   ├── MenuModal (右上角側邊設定選單) ──> 導向設定子頁面
    │   │   ├── PlusModal (首頁快捷功能選單)
    │   │   │   ├── PeeRecordModal (手動登記排尿/飲水記錄)
    │   │   │   └── ToiletModal (500m內附近廁所清單)
    │   │   │       └── OSMMapModal (內建 OpenStreetMap 廁所導航)
    │   │   │           ├── 拖曳式呼吸引導 Widget
    │   │   │           └── 背景白噪音播放控制
    │   │   └── NotificationModal (提醒詳情視窗)
    │   └── Pee Record Modal (手動排尿登記)
    ├── ExerciseScreen (運動紀錄頁面)
    ├── DietScreen (飲食紀錄頁面)
    └── DataScreen (數據統計頁面)
```

### 彈出視窗 (Modals) 詳細控制清單

本專案利用多個高度互動的浮動 Modal 提升 UX 體驗，避免頻繁頁面切換：
1. **首頁快捷選單 (PlusModal)**: 由狀態 `plusModalVisible` 控制。點擊首頁懸浮加號觸發，提供手動紀錄及廁所導航的入口。
2. **手動登記排尿/飲水 (PeeRecordModal)**: 由狀態 `peeModalVisible` 控制。內置日期、時間與排尿/飲水容量表單。
3. **附近廁所清單 (ToiletModal)**: 由狀態 `toiletModalVisible` 控制。自動搜尋周邊 500 公尺之廁所並列出距離。
4. **內建地圖導航 (OSMMapModal)**: 由狀態 `osmMapVisible` 控制。
   - 使用 `react-native-webview` 載入 OpenStreetMap 與 OSRM 步行引導。
   - **懸浮拖曳式呼吸引導**: 內置 4-4-8 秒深呼吸引導小圓圈，支援手勢拖曳，不擋地圖。
   - **背景白噪音播放**: 支援在背景持續撥放選定的白噪音以轉移尿意注意力。
5. **提醒詳情彈窗 (NotificationModal)**: 由狀態 `notificationVisible` 控制。顯示翻身、運動、尿濕或排尿提醒的具體操作與注意事項。
6. **側邊設定選單 (MenuModal)**: 由狀態 `menuVisible` 控制。點擊右上角漢堡鈕展開，提供修改密碼、硬體連接、衛教資訊、數據匯出等設定頁面入口。



###  設定與管理子頁面 (由 HomeScreen 側邊選單導航)
- **Account (個人檔案管理)**: 管理使用者姓名、性別、生日、帳號與聯絡資訊，以及刪除帳號。
- **ChangePassword (修改密碼)**: 提供密碼變更功能。
- **ESP32Connection (硬體連線設定)**: 搜尋並配對 ESP32 與 MPU6050 模組，即時讀取尿濕感測狀態與姿勢角度。
- **UrgencySuppression (急迫抑制設定)**: 白噪音種類設定（風聲、火車聲、飛機聲、嬰兒助眠聲），選取之音效將會自動保存至本機，並於地圖導航中播放。
- **Theme (主題設定)**: 支援「淺色模式」與「深色模式」一鍵切換。
- **Tutorial (教學指引)**: 提供說明。
- **DataExport (數據匯出)**: 將排尿與尿濕、運動、飲食紀錄匯出為 CSV 或 TXT 等格式。
- **DoctorRecordImport (醫生診斷紀錄匯入)**: 病患可拍照/選取照片匯入醫生診斷證明書。

---

##  各分頁核心功能與主函式說明

### 1. `HomeScreen.js` (首頁儀錶板與主控制器)
*首頁包含身分判斷、本機排尿檔案儲存、附近公廁搜尋與 OSM 內建導航聯動功能。*
* **主要函式與邏輯：**
  * `loadPeeRecords()`: 使用 `expo-file-system` 從本機目錄下讀取排尿與飲水紀錄檔案。
  * `saveRecordToFile(peeDate, recordType)`: 將新的排尿或飲水數據，以 JSON 格式個別儲存至本機檔案系統。
  * `handleOpenOSMMap(toilet)`: 觸發廁所地圖導航。獲取當前定位，並打開 OSM WebView 導航 Modal。
  * `toggleWhiteNoise()`: 地圖導航期間啟動背景白噪音播放。讀取使用者選定的白噪音音效，利用 `expo-av` 進行循環背景播放。
  * **懸浮拖曳呼吸引導機制**：
    * `breathState` / `circleScale` 處理：以吸氣 4s、憋氣 4s、吐氣 8s 驅動 Animated 縮放動畫。
    * `panResponder` 處理：採用 React Native `PanResponder` 將呼吸引導做成懸浮 Widget，支援使用者手勢拖曳至地圖任意位置。

### 2. `UrgencySuppressionScreen.js` (急迫抑制設定)
*此頁面為使用者提供白噪音的偏好設定，預設不播放任何聲音，且不顯示呼引導。*
* **主要函式與邏輯：**
  * `handleSoundChange(newSound)`: 當使用者更改白噪音選項時，將所選的選項（如 `water`、`rain`）透過 `AsyncStorage` 寫入本機硬碟持久化。
  * `loadSavedSound()`: 進入頁面時載入已儲存的白噪音，以供下拉選單（ComboBox）呈現。

### 3. `ESP32ConnectionScreen.js` (硬體連接與健康監控)
*與外部 ESP32 模組的配對狀態管理，包含尿溼警報模擬。*
* **主要函式與邏輯：**
  * `handleConnectESP32()`: 模擬連接藍牙設備，並將配對狀態寫入 `AsyncStorage`，使儀錶板即時改變「尿濕提醒」區塊的顯示。

### 4. `AccountScreen.js` & `DoctorRecordImportScreen.js` (檔案與診斷書認證)
*使用者個人基本資料維護與診斷證明圖片管理。*
* **主要函式與邏輯：**
  * `pickImage()` / `takePhoto()`: 使用 `expo-image-picker` 調用相機或相簿，將大頭貼或診斷書照片儲存至本機。
  * `AsyncStorage` 整合：保存使用者的最新個人檔案。

### 5. `DataExportScreen.js` (數據分析與匯出)
*提供匯出報表與匯入備份功能。*
* **主要函式與邏輯：**
  * `handleExportData(format)`: 讀取所有儲存的排尿紀錄檔案，包裝成 CSV 或 JSON 格式，並使用 Expo Sharing 進行檔案匯出。

---

##  技術棧與核心套件

* **核心框架**: React Native (Expo)
* **狀態管理與本地存儲**: React Hooks, `AsyncStorage`
* **檔案系統**: `expo-file-system` (用以儲存個別的尿尿與飲水 JSON 檔案紀錄)
* **地圖與導航**: `react-native-webview` (串接 OpenStreetMap 與 OSRM 步行路徑規劃)
* **音訊控制**: `expo-av` (處理白噪音音訊循環與後台播放)
* **手勢互動**: `PanResponder`, `Animated` (實現可拖曳式悬浮圓圈)
* **多媒體**: `expo-image-picker`

---

##  快速開始與運行

### 1. 安裝依賴套件
```bash
npm install
# 或使用 Expo
npx expo install
```

### 2. 啟動開發伺服器
```bash
npx expo start
```

### 3. 在手機上預覽
1. 手機上下載並安裝 **Expo Go**。
2. 掃描終端機中的 QR Code 即可開始體驗！
