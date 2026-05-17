import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Dashboard from '../components/Dashboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';
import { Paths, File as ExpoFile, Directory } from 'expo-file-system';
import * as Location from 'expo-location';
import { ActivityIndicator, Alert, Linking } from 'react-native';
import { findNearbyToilets } from '../utils/locationUtils';

export default function HomeScreen({ navigation }) {
  const [role, setRole] = useState('patient');
  const [userName, setUserName] = useState('');

  // Modals state
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [toiletModalVisible, setToiletModalVisible] = useState(false);
  const [peeModalVisible, setPeeModalVisible] = useState(false);
  const [peeDate, setPeeDate] = useState(new Date());
  const [peeRecords, setPeeRecords] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  // Location and Toilet search state
  const [isSearchingToilets, setIsSearchingToilets] = useState(false);
  const [nearbyToilets, setNearbyToilets] = useState([]);

  // Load all pee records from PeeTime_Save directory
  const loadPeeRecords = () => {
    try {
      const saveDir = new Directory(Paths.document, 'PeeTime_Save');
      if (!saveDir.exists) return;

      const items = saveDir.list();
      const records = [];
      for (const item of items) {
        if (item instanceof ExpoFile && item.name.endsWith('.txt')) {
          const content = item.textSync();
          // Extract time string from content
          const match = content.match(/排尿紀錄時間: (.+)/);
          if (match) {
            records.push({
              fileName: item.name,
              timeString: match[1].trim(),
            });
          }
        }
      }
      // Sort by fileName (which contains timestamp) descending = newest first
      records.sort((a, b) => b.fileName.localeCompare(a.fileName));
      setPeeRecords(records);
    } catch (e) {
      console.error('無法讀取排尿紀錄', e);
    }
  };

  // Save to file system function (new expo-file-system API)
  const savePeeTimeToFile = (date) => {
    try {
      const saveDir = new Directory(Paths.document, 'PeeTime_Save');
      if (!saveDir.exists) {
        saveDir.create();
      }

      const fileName = `pee_record_${Date.now()}.txt`;
      const file = new ExpoFile(saveDir, fileName);

      const dateString = date.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
      const content = `排尿紀錄時間: ${dateString}\n`;

      file.create();
      file.write(content);
      console.log('排尿紀錄已儲存至:', file.uri);

      // Reload all records after saving
      loadPeeRecords();
    } catch (e) {
      console.error('無法儲存排尿紀錄 txt 檔', e);
    }
  };

  useEffect(() => {
    loadRole();
    loadPeeRecords();
  }, []);

  const loadRole = async () => {
    try {
      const savedRole = await AsyncStorage.getItem('userRole');
      if (savedRole) setRole(savedRole);
      const savedName = await AsyncStorage.getItem('currentUserName');
      if (savedName) setUserName(savedName);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToiletNavigation = async () => {
    setToiletModalVisible(true);
    setIsSearchingToilets(true);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限不足', '需要定位權限才能搜尋附近廁所');
        setIsSearchingToilets(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 非同步執行以避免卡住 UI 動畫
      setTimeout(() => {
        const nearest = findNearbyToilets(latitude, longitude, 5);
        setNearbyToilets(nearest);
        setIsSearchingToilets(false);
      }, 100);

    } catch (error) {
      console.error(error);
      Alert.alert('錯誤', '無法取得定位');
      setIsSearchingToilets(false);
    }
  };

  const handleOpenMap = (lat, lng, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url).catch(err => {
      console.error('An error occurred', err);
      Alert.alert('錯誤', '無法開啟地圖應用程式');
    });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userRole');
      setMenuVisible(false);
      navigation.replace('Login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{userName ? `${userName}，你好！` : '主畫面'}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setNotificationVisible(true)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 5 }]}
            onPress={() => setMenuVisible(true)}
          >
            <FontAwesome5 name="user-alt" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Buttons - 這裡已經改為上下排列 */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleToiletNavigation}
          >
            <FontAwesome5 name="restroom" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>廁所導航</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setPeeDate(new Date());
              setPeeModalVisible(true);
            }}
          >
            <Ionicons name="water-outline" size={26} color={colors.primary} />
            <Text style={styles.actionButtonText}>排尿紀錄</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard */}
        <Dashboard role={role} peeRecords={peeRecords} />
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <SafeAreaView style={styles.fullscreenMenuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>設定選單</Text>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" size={32} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Account'); }}>
              <Text style={styles.menuText}>帳戶資訊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('ESP32Connection'); }}>
              <Text style={styles.menuText}>ESP32連接代號</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('UrgencySuppression'); }}>
              <Text style={styles.menuText}>急迫抑制按鈕（白噪音/呼吸引導）</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Tutorial'); }}>
              <Text style={styles.menuText}>教學指引</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('DataExport'); }}>
              <Text style={styles.menuText}>儀表板資料匯出</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('DoctorRecordImport'); }}>
              <Text style={styles.menuText}>醫生診斷紀錄匯入</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <Text style={[styles.menuText, { color: colors.danger }]}>登出</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Notification Modal - 這裡已修改為全螢幕列表樣式 */}
      <Modal
        visible={notificationVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setNotificationVisible(false)}
      >
        <SafeAreaView style={styles.fullscreenMenuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>通知</Text>
            <TouchableOpacity onPress={() => setNotificationVisible(false)}>
              <Ionicons name="close" size={32} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {/* 目前為空狀態提示，未來如果有通知資料，可以用 map 渲染出類似 menuItem 的元件 */}
            <View style={styles.emptyNotificationContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyNotificationText}>目前沒有新通知</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Toilet Modal */}
      <Modal
        visible={toiletModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setToiletModalVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={[styles.centerModalContainer, { width: '90%', maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>廁所導航 (附近廁所)</Text>

            {isSearchingToilets ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.textSecondary }}>正在定位與搜尋附近廁所...</Text>
              </View>
            ) : (
              <ScrollView style={{ width: '100%', marginBottom: 20 }}>
                {nearbyToilets.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: colors.textSecondary }}>找不到附近廁所資料</Text>
                ) : (
                  nearbyToilets.map((toilet, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.toiletItem}
                      onPress={() => handleOpenMap(toilet.latitude, toilet.longitude, toilet.name)}
                    >
                      <Text style={styles.toiletText}>{index + 1}. {toilet.name} ({toilet.distanceDisplay})</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 5 }}>{toilet.address}</Text>
                      <Text style={{ color: colors.primary, fontSize: 12, marginTop: 5 }}>點擊開啟 Google Maps 導航</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeButton} onPress={() => setToiletModalVisible(false)}>
              <Text style={styles.closeButtonText}>關閉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pee Modal */}
      <Modal
        visible={peeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPeeModalVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalContainer}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 15, right: 15, zIndex: 1 }}
              onPress={() => setPeeModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>排尿紀錄</Text>
            <Text style={styles.modalContent}>選擇排尿時間：</Text>

            <DateTimePicker
              value={peeDate}
              mode="time"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) setPeeDate(selectedDate);
              }}
              style={{ width: '100%', alignSelf: 'center', marginVertical: 10 }}
            />

            <TouchableOpacity style={[styles.closeButton, { width: '100%', alignItems: 'center' }]} onPress={() => {
              savePeeTimeToFile(peeDate);
              setPeeModalVisible(false);
            }}>
              <Text style={styles.closeButtonText}>確認並儲存</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  fullscreenMenuContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
  },
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerModalContainer: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  modalContent: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toiletItem: {
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginBottom: 10,
  },
  toiletText: {
    fontSize: 16,
    color: colors.text,
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 20,
  },
  // 新增通知空狀態樣式
  emptyNotificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  emptyNotificationText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
