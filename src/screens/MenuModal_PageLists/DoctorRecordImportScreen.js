import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/colors';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { WebView } from 'react-native-webview';

// 👈 在元件外部宣告一個全域變數快取。
// 這樣就算畫面被卸載（unmount）或跳出，資料依然會留在記憶體中，不會消失！
let globalHistoryRecords = [];

export default function DoctorRecordImportScreen({ navigation }) {
  const { colors, isDarkMode } = useAppTheme();
  const styles = getStyles(colors);
  const [isUploading, setIsUploading] = useState(false);

  // 初始狀態直接同步全域快取資料
  const [historyRecords, setHistoryRecords] = useState(globalHistoryRecords);

  // 控制檢視彈窗的狀態
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 每次進入畫面時，確保狀態有同步到最新的全域資料
  useEffect(() => {
    setHistoryRecords(globalHistoryRecords);
  }, []);

  // 處理點擊上傳盒子
  const handleUploadPress = () => {
    Alert.alert(
      '匯入醫生診斷紀錄',
      '請選擇您的檔案來源：',
      [
        { text: '開啟相機拍照', onPress: handleLaunchCamera },
        { text: '從相簿選取照片', onPress: handleSelectImage },
        { text: '選取 PDF 檔案', onPress: handleSelectPDF },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  const handleLaunchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('權限不足', '我們需要相機權限才能幫您拍攝診斷書。');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadFileSimulation(result.assets[0].uri, '照片');
      }
    } catch (error) {
      Alert.alert('錯誤', '開啟相機時發生問題。');
    }
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('權限不足', '我們需要相簿存取權限才能讓您選取診斷書照片。');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadFileSimulation(result.assets[0].uri, '照片');
      }
    } catch (error) {
      Alert.alert('錯誤', '讀取相簿時發生問題。');
    }
  };

  const handleSelectPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadFileSimulation(result.assets[0].uri, 'PDF');
      }
    } catch (error) {
      Alert.alert('錯誤', '選取檔案時發生問題。');
    }
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const uploadFileSimulation = (fileUri, type) => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const newRecord = {
        id: Date.now().toString(),
        date: getTodayString(),
        status: '匯入成功',
        type: type,
        uri: fileUri
      };

      // 同步更新全域變數與 React 狀態
      globalHistoryRecords = [newRecord, ...globalHistoryRecords];
      setHistoryRecords(globalHistoryRecords);

      Alert.alert('匯入成功', `已順利解析並匯入該筆 ${type} 診斷資料！`);
    }, 1500);
  };

  // 觸發檢視功能
  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setViewerVisible(true);
  };

  // 👈 新增：刪除紀錄功能
  const handleDeleteRecord = (id) => {
    Alert.alert(
      '刪除紀錄',
      '確定要刪除這筆診斷紀錄嗎？數據將無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定刪除',
          style: 'destructive',
          onPress: () => {
            // 濾除該筆 id，更新全域快取與本地狀態
            globalHistoryRecords = globalHistoryRecords.filter(record => record.id !== id);
            setHistoryRecords(globalHistoryRecords);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{ width: 40, alignItems: 'flex-start' }} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>醫生診斷紀錄匯入</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>上傳新紀錄</Text>
          <Text style={styles.sectionSubtitle}>匯入醫院檢查報告，作為設定參數的參考。</Text>

          <TouchableOpacity
            style={[styles.uploadBox, isUploading && styles.uploadBoxDisabled]}
            activeOpacity={0.7}
            onPress={handleUploadPress}
            disabled={isUploading}
          >
            {isUploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>檔案上傳解析中，請稍候...</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} style={{ marginBottom: 15 }} />
                <Text style={styles.uploadText}>點擊上傳 PDF 或 拍攝診斷書</Text>
                <Text style={styles.uploadSubtext}>支援格式: .pdf, .jpg, .png</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Dynamic History Section */}
        {historyRecords.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>歷史匯入紀錄</Text>
            <View style={styles.historyCard}>
              {historyRecords.map((record, index) => {
                const isLast = index === historyRecords.length - 1;
                return (
                  <View key={record.id} style={[styles.historyItem, isLast && { borderBottomWidth: 0 }]}>
                    <View style={styles.historyLeft}>
                      <Text style={styles.historyDate}>{record.date}</Text>
                      <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>{record.status}</Text>
                      </View>
                    </View>

                    <View style={styles.historyRight}>
                      <Text style={styles.historyType}>{record.type}</Text>

                      {/* 檢視按鈕 */}
                      <TouchableOpacity style={styles.viewButton} onPress={() => handleViewRecord(record)}>
                        <Text style={styles.viewButtonText}>檢視</Text>
                      </TouchableOpacity>

                      {/* 👈 新增：垃圾桶刪除按鈕 */}
                      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRecord(record.id)}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 萬用檔案檢視器彈窗 */}
      <Modal visible={viewerVisible} animationType="slide" onRequestClose={() => setViewerVisible(false)}>
        <SafeAreaView style={styles.viewerContainer}>
          {/* Viewer Header */}
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewerVisible(false)} style={styles.viewerCloseButton}>
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.viewerTitle}>
              {selectedRecord ? `${selectedRecord.date} 診斷紀錄 (${selectedRecord.type})` : '檔案檢視'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Viewer Content */}
          <View style={styles.viewerBody}>
            {selectedRecord && (
              selectedRecord.type === '照片' ? (
                <Image
                  source={selectedRecord.uri ? { uri: selectedRecord.uri } : { uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1000' }}
                  style={styles.imageViewer}
                  resizeMode="contain"
                />
              ) : (
                <WebView
                  source={{
                    uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
                    )}`
                  }}
                  style={{ flex: 1 }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <ActivityIndicator color={colors.primary} size="large" style={styles.viewerLoader} />
                  )}
                />
              )
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
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
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
    marginLeft: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    marginLeft: 5,
  },
  uploadBox: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  uploadBoxDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 12, // 縮減間距以容納刪除按鈕
  },
  viewButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewerCloseButton: {
    padding: 5,
    width: 40,
  },
  viewerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.text,
  },
  viewerBody: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  imageViewer: {
    width: '100%',
    height: '100%',
  },
  viewerLoader: {
    position: 'absolute',
    top: '45%',
    left: '45%',
  }
});