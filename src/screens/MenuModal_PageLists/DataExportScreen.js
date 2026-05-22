import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/colors';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Paths, File as ExpoFile, Directory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function DataExportScreen({ navigation }) {
  const { colors, isDarkMode } = useAppTheme();
  const styles = getStyles(colors, isDarkMode);
  const [startDate, setStartDate] = useState(new Date(2026, 4, 1)); // 2026-05-01
  const [endDate, setEndDate] = useState(new Date(2026, 4, 25));   // 2026-05-25

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('start');

  const [selections, setSelections] = useState({
    urine: true,
    exercise: false,
    diet: false,
  });

  const [exportFormat, setExportFormat] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);

  const toggleSelection = (key) => {
    setSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openDatePicker = (mode) => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      if (pickerMode === 'start') {
        if (selectedDate > endDate) {
          setEndDate(selectedDate);
        }
        setStartDate(selectedDate);
      } else {
        if (selectedDate < startDate) {
          setStartDate(selectedDate);
        }
        setEndDate(selectedDate);
      }
    }
  };

  const handleExportData = async () => {
    const hasSelection = Object.values(selections).some(val => val === true);
    if (!hasSelection) {
      Alert.alert('提示', '請至少選擇一項要匯出的資料內容。');
      return;
    }

    setIsExporting(true);

    try {
      const startStr = formatDateString(startDate);
      const endStr = formatDateString(endDate);
      const ext = exportFormat === 'excel' ? 'csv' : 'txt';
      const filename = `健康數據導出_${startStr}_至_${endStr}.${ext}`;

      const cacheDir = new Directory(Paths.cache);
      if (!cacheDir.exists) cacheDir.create();

      const file = new ExpoFile(cacheDir, filename);
      if (file.exists) file.delete();

      let reportContent = '';

      // --- 1. 讀取首頁真正的排尿紀錄檔案 ---
      if (selections.urine) {
        if (exportFormat === 'excel') {
          reportContent += `資料類別,排尿時間紀錄\n`;
        } else {
          reportContent += `[排尿紀錄資料]\n`;
        }

        const peeDir = new Directory(Paths.document, 'PeeTime_Save');
        let hasUrineData = false;

        if (peeDir.exists) {
          const items = peeDir.list();

          for (const item of items) {
            if (item instanceof ExpoFile && item.name.endsWith('.txt')) {
              const content = item.textSync();
              const match = content.match(/排尿紀錄時間: (.+)/);

              if (match) {
                const timeString = match[1].trim(); // 例如: "2026/5/20 上午 10:15:30"

                // 👈 核心修正：精準拆解首頁的時間文字格式，改用最安全的「斜線拆分」比對法
                const dateParts = timeString.split(' ')[0].split('/'); // 拆成 ["2026", "5", "20"]

                if (dateParts.length === 3) {
                  const year = parseInt(dateParts[0], 10);
                  const month = parseInt(dateParts[1], 10) - 1; // JS 的月份從 0 開始
                  const day = parseInt(dateParts[2], 10);

                  // 建立純日期的物件（去掉時分秒干擾，只比對天數）
                  const recordDate = new Date(year, month, day);

                  // 設定篩選日期的邊界數值
                  const compareStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                  const compareEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

                  // 檢查是否符合區間範圍
                  if (recordDate >= compareStart && recordDate <= compareEnd) {
                    hasUrineData = true;
                    if (exportFormat === 'excel') {
                      reportContent += `排尿紀錄,${timeString}\n`;
                    } else {
                      reportContent += `${timeString}\n`;
                    }
                  }
                }
              }
            }
          }
        }

        if (!hasUrineData) {
          reportContent += exportFormat === 'excel' ? `排尿紀錄,此區間無紀錄數據\n` : `此時間區間內無排尿數據\n`;
        }
        reportContent += '\n';
      }

      // --- 2. 運動紀錄空白佔位 ---
      if (selections.exercise) {
        if (exportFormat === 'excel') {
          reportContent += `資料類別,運動時間數據\n`;
          reportContent += `運動紀錄,此區間無硬體紀錄數據\n\n`;
        } else {
          reportContent += `[運動紀錄資料]\n此時間區間內無運動數據\n\n`;
        }
      }

      // --- 3. 飲食紀錄空白佔位 ---
      if (selections.diet) {
        if (exportFormat === 'excel') {
          reportContent += `資料類別,飲食數據\n`;
          reportContent += `飲食紀錄,此區間無手動紀錄數據\n\n`;
        } else {
          reportContent += `[飲食紀錄資料]\n此時間區間內無飲食數據\n\n`;
        }
      }

      reportContent = reportContent.trim();

      file.create();
      file.write(reportContent);

      const isSharingAvailable = await Sharing.isAvailableAsync();

      setTimeout(async () => {
        setIsExporting(false);

        if (isSharingAvailable) {
          await Sharing.shareAsync(file.uri, {
            mimeType: exportFormat === 'excel' ? 'text/csv' : 'text/plain',
            dialogTitle: '匯出儀表板健康數據',
          });
        } else {
          Alert.alert(
            '數據導出成功',
            `由於環境限制無法開啟分享面板。\n純紀錄檔案已覆蓋生成：\n${filename}\n\n可在實機直接分享。`
          );
        }
      }, 1200);

    } catch (error) {
      setIsExporting(false);
      console.error('數據導出錯誤:', error);
      Alert.alert('匯出失敗', '在讀取或過濾首頁歷史紀錄檔案時發生問題，請稍後再試。');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{ width: 40, alignItems: 'flex-start' }} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>儀表板資料匯出</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Date Filter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>匯出時間範圍</Text>
          <View style={styles.datePickerContainer}>

            {/* 開始日期按鈕 */}
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>開始日期</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('start')} disabled={isExporting}>
                <Text style={styles.dateText}>{formatDateString(startDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateDivider}>
              <Ionicons name="remove" size={20} color={colors.textSecondary} />
            </View>

            {/* 結束日期按鈕 */}
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>結束日期</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openDatePicker('end')} disabled={isExporting}>
                <Text style={styles.dateText}>{formatDateString(endDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showPicker && (
          <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : null}>
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.iosCloseButton} onPress={() => setShowPicker(false)}>
                <Text style={styles.iosCloseButtonText}>完成</Text>
              </TouchableOpacity>
            )}
            <DateTimePicker
              value={pickerMode === 'start' ? startDate : endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          </View>
        )}

        {/* Data Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>選擇匯出資料</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.checkItem} onPress={() => toggleSelection('urine')} disabled={isExporting} activeOpacity={0.7}>
              <Ionicons
                name={selections.urine ? "checkbox" : "square-outline"}
                size={24}
                color={selections.urine ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.checkLabel}>排尿與尿濕紀錄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.checkItem} onPress={() => toggleSelection('exercise')} disabled={isExporting} activeOpacity={0.7}>
              <Ionicons
                name={selections.exercise ? "checkbox" : "square-outline"}
                size={24}
                color={selections.exercise ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.checkLabel}>運動時間紀錄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.checkItem, { borderBottomWidth: 0 }]} onPress={() => toggleSelection('diet')} disabled={isExporting} activeOpacity={0.7}>
              <Ionicons
                name={selections.diet ? "checkbox" : "square-outline"}
                size={24}
                color={selections.diet ? colors.primary : colors.textSecondary}
              />
              <Text style={styles.checkLabel}>飲食紀錄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Format Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>匯出格式</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.radioItem} onPress={() => setExportFormat('excel')} disabled={isExporting} activeOpacity={0.7}>
              <Ionicons
                name={exportFormat === 'excel' ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={exportFormat === 'excel' ? colors.primary : colors.textSecondary}
              />
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} style={{ marginLeft: 15, marginRight: 5 }} />
              <Text style={styles.radioLabel}>Excel 試算表 (.csv)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.radioItem, { borderBottomWidth: 0 }]} onPress={() => setExportFormat('pdf')} disabled={isExporting} activeOpacity={0.7}>
              <Ionicons
                name={exportFormat === 'pdf' ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={exportFormat === 'pdf' ? colors.primary : colors.textSecondary}
              />
              <Ionicons name="document-outline" size={20} color={colors.textSecondary} style={{ marginLeft: 15, marginRight: 5 }} />
              <Text style={styles.radioLabel}>文字報告文件 (.txt)</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, isExporting && styles.primaryButtonDisabled]}
          onPress={handleExportData}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>產生報表並匯出</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    marginLeft: 5,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 5,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 15,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
  },
  dateDivider: {
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 15,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  primaryButtonText: {
    color: isDarkMode ? '#000' : '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iosPickerContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingBottom: 10,
    marginBottom: 20,
  },
  iosCloseButton: {
    alignSelf: 'flex-end',
    padding: 12,
    marginRight: 8,
  },
  iosCloseButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  }
});