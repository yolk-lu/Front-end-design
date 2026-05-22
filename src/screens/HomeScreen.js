import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Dimensions,
  Animated,
  PanResponder
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Paths, File as ExpoFile, Directory } from 'expo-file-system';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { findNearbyToilets } from '../utils/locationUtils';
import { WebView } from 'react-native-webview';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.32;

import { useAppTheme, setGlobalTheme } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const [role, setRole] = useState('patient');
  const [userName, setUserName] = useState('');

  const { colors, isDarkMode } = useAppTheme();

  // Modals state
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [toiletModalVisible, setToiletModalVisible] = useState(false);
  const [peeModalVisible, setPeeModalVisible] = useState(false);
  const [plusModalVisible, setPlusModalVisible] = useState(false);

  // 儀表板各卡片展開/折疊狀態
  const [isPeeExpanded, setIsPeeExpanded] = useState(false);
  const [isExerciseExpanded, setIsExerciseExpanded] = useState(false);
  const [isWetnessExpanded, setIsWetnessExpanded] = useState(false);

  // 追蹤目前上下滑動到第幾張卡片
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const [peeDate, setPeeDate] = useState(new Date());
  const [peeRecords, setPeeRecords] = useState([]);
  const [recordType, setRecordType] = useState('pee');

  // Sensors connection state
  const [sensorsConnected, setSensorsConnected] = useState({ esp32: false, mpu6050: false });

  // Location and Toilet search state
  const [isSearchingToilets, setIsSearchingToilets] = useState(false);
  const [nearbyToilets, setNearbyToilets] = useState([]);

  // In-app OSM map state
  const [osmMapVisible, setOsmMapVisible] = useState(false);
  const [selectedToilet, setSelectedToilet] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  // Map Navigation White Noise state
  const [isWhiteNoisePlaying, setIsWhiteNoisePlaying] = useState(false);
  const soundRef = useRef(null);
  const isLoadingSoundRef = useRef(false);

  useEffect(() => {
    return () => {
      // 確保組件卸載時釋放音訊資源
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => { });
      }
    };
  }, []);

  // Map Navigation Breathing Guide state
  const [breathState, setBreathState] = useState({ phase: 'inhale', timeLeft: 4 });
  const circleScale = useRef(new Animated.Value(1)).current;

  // Draggable widget state & pan responder
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  useEffect(() => {
    let timer;
    if (osmMapVisible) {
      timer = setInterval(() => {
        setBreathState(prev => {
          if (prev.timeLeft > 1) {
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          }
          if (prev.phase === 'inhale') return { phase: 'hold', timeLeft: 4 };
          if (prev.phase === 'hold') return { phase: 'exhale', timeLeft: 8 };
          return { phase: 'inhale', timeLeft: 4 };
        });
      }, 1000);
    } else {
      setBreathState({ phase: 'inhale', timeLeft: 4 });
      circleScale.setValue(1);
      pan.setValue({ x: 0, y: 0 });
      pan.setOffset({ x: 0, y: 0 });
    }
    return () => clearInterval(timer);
  }, [osmMapVisible]);

  // Breathing animation scaling
  useEffect(() => {
    if (!osmMapVisible) {
      circleScale.stopAnimation();
      return;
    }

    if (breathState.phase === 'inhale') {
      Animated.timing(circleScale, {
        toValue: 1.3,
        duration: breathState.timeLeft * 1000,
        useNativeDriver: true,
      }).start();
    } else if (breathState.phase === 'exhale') {
      Animated.timing(circleScale, {
        toValue: 1.0,
        duration: breathState.timeLeft * 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [osmMapVisible, breathState.phase]);

  const getTodayDateString = () => {
    const today = new Date();
    return today.toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
  };

  const loadPeeRecords = () => {
    try {
      const saveDir = new Directory(Paths.document, 'PeeTime_Save');
      if (!saveDir.exists) return;

      const items = saveDir.list();
      const records = [];
      const todayStr = getTodayDateString();

      for (const item of items) {
        if (item instanceof ExpoFile && item.name.endsWith('.txt')) {
          const content = item.textSync();
          const match = content.match(/(排尿|漏尿)紀錄時間: (.+)/);
          if (match) {
            const typePrefix = match[1];
            const timeString = match[2].trim();
            if (timeString.includes(todayStr)) {
              records.push({
                fileName: item.name,
                timeString: typePrefix === '漏尿' ? `⚠️ [漏尿] ${timeString}` : timeString,
              });
            }
          }
        }
      }
      records.sort((a, b) => b.fileName.localeCompare(a.fileName));
      setPeeRecords(records);
    } catch (e) {
      console.error('無法讀取紀錄', e);
    }
  };

  const saveRecordToFile = (date, type) => {
    try {
      const saveDir = new Directory(Paths.document, 'PeeTime_Save');
      if (!saveDir.exists) {
        saveDir.create();
      }

      const prefix = type === 'leak' ? 'leak_record' : 'pee_record';
      const fileName = `${prefix}_${Date.now()}.txt`;
      const file = new ExpoFile(saveDir, fileName);

      const dateString = date.toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const title = type === 'leak' ? '漏尿紀錄時間' : '排尿紀錄時間';
      const content = `${title}: ${dateString}\n`;

      file.create();
      file.write(content);

      loadPeeRecords();
    } catch (e) {
      console.error('無法儲存紀錄 txt 檔', e);
    }
  };
  const deleteSinglePeeRecord = (fileName) => {
    Alert.alert('確認刪除', '確定要刪除這筆紀錄嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: () => {
          try {
            const saveDir = new Directory(Paths.document, 'PeeTime_Save');
            if (saveDir.exists) {
              const file = new ExpoFile(saveDir, fileName);
              if (file.exists) {
                file.delete();
              }
            }
            loadPeeRecords();
          } catch (e) {
            console.error('刪除單筆紀錄失敗', e);
            Alert.alert('錯誤', '刪除失敗');
          }
        }
      }
    ]);
  };
  // 👈 內部切換功能：點擊後在半身人內部切換並記憶
  const handleToggleThemeInternal = async () => {
    try {
      const newMode = !isDarkMode;
      await setGlobalTheme(newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('無法儲存內部主題', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRole();
      loadPeeRecords();
      checkSensorsConnection();

      const midnightChecker = setInterval(() => {
        loadPeeRecords();
      }, 60000);

      return () => clearInterval(midnightChecker);
    }, [])
  );

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

  const checkSensorsConnection = async () => {
    try {
      const isEspConnected = await AsyncStorage.getItem('esp32_connected');
      const isMpuConnected = await AsyncStorage.getItem('mpu6050_connected');

      setSensorsConnected({
        esp32: isEspConnected === 'true',
        mpu6050: isMpuConnected === 'true'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToiletNavigation = async () => {
    setToiletModalVisible(true);
    setIsSearchingToilets(true);
    setNearbyToilets([]);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('權限不足', '需要定位權限才能搜尋附近廁所');
        setIsSearchingToilets(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserCoords({ latitude, longitude });

      // 用本地 JSON 搜尋方圓 500 公尺內的廁所
      setTimeout(() => {
        const nearest = findNearbyToilets(latitude, longitude, 20);
        // 針對 500m 過濾
        const within500m = nearest.filter(t => t.distanceKm <= 0.5);
        setNearbyToilets(within500m.length > 0 ? within500m : nearest.slice(0, 5));
        setIsSearchingToilets(false);
      }, 100);

    } catch (error) {
      console.error(error);
      Alert.alert('錯誤', '無法取得定位');
      setIsSearchingToilets(false);
    }
  };

  const handleOpenOSMMap = (toilet) => {
    setToiletModalVisible(false);
    setSelectedToilet(toilet);
    // 延遲以確保第一個 Modal 完全收起，避免 iOS 重疊衝突
    setTimeout(() => {
      setOsmMapVisible(true);
    }, 300);
  };

  const handleCloseOSMMap = async () => {
    setOsmMapVisible(false);

    // 關閉地圖時自動停止播放白噪音
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        console.error(e);
      }
      soundRef.current = null;
    }
    setIsWhiteNoisePlaying(false);

    // 關閉地圖後重新開啟附近公廁清單
    setTimeout(() => {
      setToiletModalVisible(true);
    }, 300);
  };

  const toggleWhiteNoise = async () => {
    if (isWhiteNoisePlaying) {
      // 關閉白噪音
      setIsWhiteNoisePlaying(false);
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) {
          console.error(e);
        }
        soundRef.current = null;
      }
    } else {
      // 開啟白噪音
      if (isLoadingSoundRef.current) return;
      isLoadingSoundRef.current = true;
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        // 讀取存儲的白噪音類型
        const savedSound = await AsyncStorage.getItem('selected_white_noise') || 'wind';

        const soundFiles = {
          wind: require('../../Datasets/white_noise_Datasets/wind.mp3'),
          train: require('../../Datasets/white_noise_Datasets/train.mp3'),
          airplane: require('../../Datasets/white_noise_Datasets/airplane.mp3'),
          baby_sleep: require('../../Datasets/white_noise_Datasets/baby_sleep.mp3'),
        };

        const soundSource = soundFiles[savedSound] || soundFiles.wind;

        const { sound } = await Audio.Sound.createAsync(
          soundSource,
          { shouldPlay: true, isLooping: true, volume: 0.6 }
        );
        soundRef.current = sound;
        setIsWhiteNoisePlaying(true);
      } catch (error) {
        console.error("Error starting sound in map navigation", error);
        Alert.alert('提示', '無法啟動白噪音播放');
      } finally {
        isLoadingSoundRef.current = false;
      }
    }
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

  const handleOpenRecordModal = (type) => {
    setRecordType(type);
    setPeeDate(new Date());
    setPeeModalVisible(true);
  };

  const handleVerticalScroll = (event) => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(contentOffsetY / CAROUSEL_HEIGHT);
    if (index >= 0 && index <= 2) {
      setCurrentCardIndex(index);
    }
  };

  const displayedPeeRecords = isPeeExpanded ? peeRecords : peeRecords.slice(0, 2);
  const leakRecords = peeRecords.filter(r => r.timeString.includes('[漏尿]'));
  const displayedLeakRecords = isWetnessExpanded ? leakRecords : leakRecords.slice(0, 2);

  // 動態樣式生成器
  const dynamicStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    actionButton: { backgroundColor: colors.surface, padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.4 : 0.1, shadowRadius: 4, elevation: 3 },
    actionButtonText: { marginTop: 10, fontSize: 16, fontWeight: '600', color: colors.text },
    dashboardCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, height: CAROUSEL_HEIGHT, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.3 : 0.05, shadowRadius: 6, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    recordText: { fontSize: 14, color: colors.text, marginLeft: 8 },
    bottomModalContainer: { backgroundColor: colors.surface, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 24, paddingBottom: 40, alignItems: 'center' },
    bottomModalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 25 },
    gridItemText: { fontSize: 14, fontWeight: '500', color: colors.text },
    fullscreenMenuContainer: { flex: 1, backgroundColor: colors.surface },
    menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
    menuItem: { paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
    menuText: { fontSize: 16, color: colors.text },
    centerModalContainer: { width: '80%', backgroundColor: colors.surface, borderRadius: 20, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: colors.text },
    modalContent: { fontSize: 16, color: colors.textSecondary, marginBottom: 30 },
    toiletText: { fontSize: 16, color: colors.text },
    cardHeaderBorder: { borderBottomColor: isDarkMode ? '#1e293b' : '#f1f5f9' },
    expandButtonBorder: { borderTopColor: isDarkMode ? '#1e293b' : '#f1f5f9' }
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>{userName ? `${userName}，你好！` : '主畫面'}</Text>
        <View style={styles.headerIcons}>

          {/* 🌓 👈 右上角的主題切換開關，現在觸核半身人內部的切換邏輯了 */}

          {/* <TouchableOpacity style={styles.iconButton} onPress={handleToggleThemeInternal}>
            <Ionicons
              name={isDarkMode ? "sunny-outline" : "moon-outline"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity> */}

          <TouchableOpacity
            style={[styles.iconButton, { marginLeft: 5 }]}
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

      {/* 主頁面內容區塊 */}
      <View style={styles.content}>

        {/* 上方功能大按鈕組 */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={dynamicStyles.actionButton} onPress={handleToiletNavigation}>
            <FontAwesome5 name="restroom" size={24} color={colors.primary} />
            <Text style={dynamicStyles.actionButtonText}>廁所導航</Text>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.actionButton} onPress={() => handleOpenRecordModal('pee')}>
            <Ionicons name="water-outline" size={26} color={colors.primary} />
            <Text style={dynamicStyles.actionButtonText}>排尿紀錄</Text>
          </TouchableOpacity>
        </View>

        {/* 儀表板垂直輪播區 */}
        <View style={styles.verticalCarouselWrapper}>

          <ScrollView
            nestedScrollEnabled={true}
            pagingEnabled={true}
            showsVerticalScrollIndicator={false}
            onScroll={handleVerticalScroll}
            scrollEventThrottle={16}
            decelerationRate="fast"
            style={{ height: CAROUSEL_HEIGHT }}
          >

            {/* 卡片 1: 排尿與漏尿紀錄 */}
            <View style={dynamicStyles.dashboardCard}>
              <View style={[styles.cardHeader, dynamicStyles.cardHeaderBorder]}>
                <Text style={dynamicStyles.cardTitle}>今日排尿紀錄</Text>
                <Text style={[styles.recordCount, { color: colors.primary }]}>共 {peeRecords.length} 筆</Text>
              </View>

              <ScrollView nestedScrollEnabled={true} style={styles.cardInternalScroll}>
                <View style={styles.recordList}>
                  {peeRecords.length === 0 ? (
                    <Text style={styles.emptyText}>今天尚無紀錄資料</Text>
                  ) : (
                    displayedPeeRecords.map((item, index) => (
                      <View key={index} style={[styles.recordItem, { justifyContent: 'space-between' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                          <Text style={dynamicStyles.recordText}>{item.timeString}</Text>
                        </View>
                        <TouchableOpacity
                          style={{ padding: 4 }}
                          onPress={() => deleteSinglePeeRecord(item.fileName)}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  {isPeeExpanded && role === 'caregiver' && (
                    <View style={styles.expandedContent}>
                      <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                        今日負責排尿協助次數: 0 次
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.expandButton, dynamicStyles.expandButtonBorder]}
                onPress={() => setIsPeeExpanded(!isPeeExpanded)}
              >
                <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                  {isPeeExpanded ? '收起排尿詳情' : '點開查看排尿詳情'}
                </Text>
                <Ionicons name={isPeeExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* 卡片 2: 運動時間紀錄 / 翻身提醒紀錄 */}
            <View style={dynamicStyles.dashboardCard}>
              <View style={[styles.cardHeader, dynamicStyles.cardHeaderBorder]}>
                <Text style={dynamicStyles.cardTitle}>
                  {role === 'caregiver' ? '翻身提醒紀錄' : '運動時間紀錄'}
                </Text>
              </View>

              <ScrollView nestedScrollEnabled={true} style={styles.cardInternalScroll}>
                <View style={styles.recordList}>
                  <View style={styles.recordItem}>
                    <Text style={[dynamicStyles.recordText, { marginLeft: 0 }]}>
                      {role === 'caregiver' ? '今日已提醒翻身次數：0 次' : '今日累計運動時間：0 分鐘'}
                    </Text>
                  </View>
                  {isExerciseExpanded && (
                    <View style={styles.expandedContent}>
                      <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                        {role === 'caregiver' ? '上次翻身時間: 無紀錄' : '凱格爾運動: 未執行'}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.expandButton, dynamicStyles.expandButtonBorder]}
                onPress={() => setIsExerciseExpanded(!isExerciseExpanded)}
              >
                <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                  {isExerciseExpanded
                    ? (role === 'caregiver' ? '收起翻身詳情' : '收起詳細分析')
                    : (role === 'caregiver' ? '點開查看翻身詳情' : '點開查看運動分析')}
                </Text>
                <Ionicons name={isExerciseExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* 卡片 3: 尿濕感測紀錄 */}
            <View style={dynamicStyles.dashboardCard}>
              <View style={[styles.cardHeader, dynamicStyles.cardHeaderBorder]}>
                <Text style={dynamicStyles.cardTitle}>尿濕紀錄</Text>
                {sensorsConnected.esp32 && (
                  <Text style={[styles.recordCount, { color: colors.primary }]}>
                    共 {peeRecords.filter(r => r.timeString.includes('[漏尿]')).length} 筆
                  </Text>
                )}
              </View>

              <ScrollView nestedScrollEnabled={true} style={styles.cardInternalScroll}>
                <View style={styles.recordList}>
                  {!sensorsConnected.esp32 ? (
                    <View style={styles.recordItem}>
                      <Text style={[dynamicStyles.recordText, { color: colors.textSecondary, marginLeft: 0 }]}>
                        尚未連接 ESP32 尿濕感測器，無法使用此功能
                      </Text>
                    </View>
                  ) : (
                    <>
                      {leakRecords.length === 0 ? (
                        <Text style={styles.emptyText}>今天尚無尿濕發生</Text>
                      ) : (
                        displayedLeakRecords.map((item, index) => (
                          <View key={index} style={[styles.recordItem, { justifyContent: 'space-between' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="water-outline" size={16} color={colors.danger} />
                              <Text style={dynamicStyles.recordText}>{item.timeString}</Text>
                            </View>
                            <TouchableOpacity
                              style={{ padding: 4 }}
                              onPress={() => deleteSinglePeeRecord(item.fileName)}
                            >
                              <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}

                      {isWetnessExpanded && sensorsConnected.esp32 && (
                        <View style={styles.expandedContent}>
                          <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                            {role === 'caregiver' ? '須協助更換衣物/尿布: 0 次' : '尿布更換狀態: 尚無需求'}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </ScrollView>

              {sensorsConnected.esp32 && (
                <TouchableOpacity
                  style={[styles.expandButton, dynamicStyles.expandButtonBorder]}
                  onPress={() => setIsWetnessExpanded(!isWetnessExpanded)}
                >
                  <Text style={[styles.expandButtonText, { color: colors.primary }]}>
                    {isWetnessExpanded ? '收起尿濕詳情' : '點開查看尿濕詳情'}
                  </Text>
                  <Ionicons name={isWetnessExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

          </ScrollView>

          {/* 獨立置底的橫向分頁指示器 */}
          <View style={styles.horizontalIndicatorContainer}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.horizontalDot,
                  currentCardIndex === i ? [styles.horizontalDotActive, { backgroundColor: colors.primary }] : null,
                  { backgroundColor: isDarkMode ? '#334155' : '#cbd5e1' }
                ]}
              />
            ))}
          </View>
        </View>

      </View>

      {/* 右下角懸浮加號按鈕 (FAB) */}
      <TouchableOpacity
        style={[styles.fabButton, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
        onPress={() => setPlusModalVisible(true)}
      >
        <Ionicons name="add" size={32} color={isDarkMode ? '#000' : '#fff'} />
      </TouchableOpacity>

      {/* 加號點擊後的底部彈出視窗 (Modal) */}
      <Modal
        visible={plusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPlusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bottomModalOverlay}
          activeOpacity={1}
          onPress={() => setPlusModalVisible(false)}
        >
          <View style={dynamicStyles.bottomModalContainer}>
            <View style={styles.modalDragIndicator} />
            <Text style={dynamicStyles.bottomModalTitle}>快速新增紀錄</Text>

            <View style={styles.gridContainer}>
              <TouchableOpacity style={styles.gridItem} onPress={() => { setPlusModalVisible(false); handleOpenRecordModal('pee'); }}>
                <View style={[styles.gridIconCircle, { backgroundColor: isDarkMode ? '#0369a1' : '#e0f2fe' }]}>
                  <Ionicons name="water" size={24} color={colors.primary} />
                </View>
                <Text style={dynamicStyles.gridItemText}>排尿紀錄</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.gridItem} onPress={() => { setPlusModalVisible(false); handleOpenRecordModal('leak'); }}>
                <View style={[styles.gridIconCircle, { backgroundColor: isDarkMode ? '#991b1b' : '#fde8e8' }]}>
                  <Ionicons name="warning" size={24} color={isDarkMode ? '#fda4af' : '#ef4444'} />
                </View>
                <Text style={dynamicStyles.gridItemText}>漏尿紀錄</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.bottomModalCloseButton, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]} onPress={() => setPlusModalVisible(false)}>
              <Text style={styles.bottomModalCloseText}>關閉</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <SafeAreaView style={dynamicStyles.fullscreenMenuContainer}>
          <View style={dynamicStyles.menuHeader}>
            <Text style={dynamicStyles.menuTitle}>設定選單</Text>
            <TouchableOpacity onPress={() => setMenuVisible(false)}>
              <Ionicons name="close" size={32} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Account'); }}>
              <Text style={dynamicStyles.menuText}>帳戶資訊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('ESP32Connection'); }}>
              <Text style={dynamicStyles.menuText}>ESP32連接代號</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('UrgencySuppression'); }}>
              <Text style={dynamicStyles.menuText}>急迫抑制按鈕（白噪音）</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Theme'); }}>
              <Text style={dynamicStyles.menuText}>主題設定</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Tutorial'); }}>
              <Text style={dynamicStyles.menuText}>教學指引</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('DataExport'); }}>
              <Text style={dynamicStyles.menuText}>儀表板資料匯出</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('DoctorRecordImport'); }}>
              <Text style={dynamicStyles.menuText}>醫生診斷紀錄匯入</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[dynamicStyles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <Text style={[dynamicStyles.menuText, { color: colors.danger }]}>登出</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Notification Modal */}
      <Modal
        visible={notificationVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setNotificationVisible(false)}
      >
        <SafeAreaView style={dynamicStyles.fullscreenMenuContainer}>
          <View style={dynamicStyles.menuHeader}>
            <Text style={dynamicStyles.menuTitle}>通知</Text>
            <TouchableOpacity onPress={() => setNotificationVisible(false)}>
              <Ionicons name="close" size={32} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={styles.emptyNotificationContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>目前沒有新通知</Text>
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
          <View style={[dynamicStyles.centerModalContainer, { width: '90%', maxHeight: '80%' }]}>
            <Text style={dynamicStyles.modalTitle}>廁所導航 (附近廁所)</Text>

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
                      key={toilet.id || index}
                      style={[styles.toiletItem, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}
                      onPress={() => handleOpenOSMMap(toilet)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                        <Ionicons name="location" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={dynamicStyles.toiletText}>{toilet.name}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, marginLeft: 6 }}>({toilet.distanceDisplay})</Text>
                      </View>
                      {toilet.address ? <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 18 }}>{toilet.address}</Text> : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginLeft: 18 }}>
                        {toilet.wheelchair === 'yes' && <Text style={{ fontSize: 11, color: '#16a34a', marginRight: 8 }}>♿ 無障礎</Text>}
                        {toilet.fee === 'no' && <Text style={{ fontSize: 11, color: '#16a34a', marginRight: 8 }}>免費</Text>}
                        <Text style={{ color: colors.primary, fontSize: 12 }}>點擊查看地圖 →</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={[styles.closeButton, { backgroundColor: isDarkMode ? '#4B5563' : colors.primary }]} onPress={() => setToiletModalVisible(false)}>
              <Text style={[styles.closeButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>關閉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* In-App OSM Map Modal */}
      <Modal
        visible={osmMapVisible}
        animationType="slide"
        onRequestClose={handleCloseOSMMap}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {/* OSM Map Header */}
          <View style={[dynamicStyles.header, { paddingHorizontal: 15, paddingVertical: 12 }]}>
            <TouchableOpacity onPress={handleCloseOSMMap} style={{ width: 40 }}>
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <Text style={[dynamicStyles.headerTitle, { fontSize: 16 }]} numberOfLines={1}>
                {selectedToilet?.name || '地圖'}
              </Text>
              {selectedToilet?.distanceDisplay ? (
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  距離：{selectedToilet.distanceDisplay}
                </Text>
              ) : null}
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* OSM WebView */}
          {selectedToilet && (
            <View style={{ flex: 1, position: 'relative' }}>
              <WebView
                source={{
                  uri: userCoords
                    ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${userCoords.latitude}%2C${userCoords.longitude}%3B${selectedToilet.latitude}%2C${selectedToilet.longitude}`
                    : `https://www.openstreetmap.org/?mlat=${selectedToilet.latitude}&mlon=${selectedToilet.longitude}#map=18/${selectedToilet.latitude}/${selectedToilet.longitude}`
                }}
                style={{ flex: 1 }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ color: colors.textSecondary, marginTop: 10 }}>載入導航中...</Text>
                  </View>
                )}
              />

              {/* Floating Breathing Guide Widget (Top-Right) - Draggable */}
              <Animated.View
                style={[
                  styles.floatingBreathingContainer,
                  {
                    transform: pan.getTranslateTransform()
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <Animated.View
                  style={[
                    styles.floatingBreathingCircle,
                    {
                      transform: [{ scale: circleScale }],
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 122, 255, 0.25)'
                    }
                  ]}
                />
                <View style={[styles.floatingInnerCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.floatingBreathingText}>
                    {breathState.phase === 'inhale' ? '吸氣' : breathState.phase === 'hold' ? '憋氣' : '吐氣'}
                  </Text>
                  <Text style={styles.floatingBreathingTime}>
                    {breathState.timeLeft}s
                  </Text>
                </View>
              </Animated.View>
            </View>
          )}

          {/* Bottom White Noise Control Panel */}
          <View style={[styles.bottomControlPanel, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: isWhiteNoisePlaying ? '#ef4444' : '#10b981' }
              ]}
              onPress={toggleWhiteNoise}
            >
              <Ionicons
                name={isWhiteNoisePlaying ? "volume-mute" : "volume-high"}
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.controlButtonText}>
                {isWhiteNoisePlaying ? "關閉白噪音" : "開啟白噪音"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Pee / Leak Modal */}
      <Modal
        visible={peeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPeeModalVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={dynamicStyles.centerModalContainer}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 15, right: 15, zIndex: 1 }}
              onPress={() => setPeeModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={dynamicStyles.modalTitle}>{recordType === 'leak' ? '漏尿紀錄' : '排尿紀錄'}</Text>
            <Text style={dynamicStyles.modalContent}>選擇紀錄時間：</Text>

            <DateTimePicker
              value={peeDate}
              mode="time"
              display="spinner"
              textColor={isDarkMode ? '#FFFFFF' : '#000000'}
              themeVariant={isDarkMode ? 'dark' : 'light'}
              onChange={(event, selectedDate) => {
                if (selectedDate) setPeeDate(selectedDate);
              }}
              style={{ width: '100%', alignSelf: 'center', marginVertical: 10 }}
            />

            <TouchableOpacity style={[styles.closeButton, { width: '100%', alignItems: 'center', backgroundColor: colors.primary }]} onPress={() => {
              saveRecordToFile(peeDate, recordType);
              setPeeModalVisible(false);
            }}>
              <Text style={[styles.closeButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>確認並儲存</Text>
            </TouchableOpacity>


          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8 },
  content: { padding: 20, flex: 1 },
  actionButtonsContainer: { flexDirection: 'column', marginBottom: 10 },
  verticalCarouselWrapper: { width: '100%', height: CAROUSEL_HEIGHT + 30, marginTop: 5, overflow: 'hidden' },
  horizontalIndicatorContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 30, backgroundColor: 'transparent', zIndex: 999 },
  horizontalDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 5 },
  horizontalDotActive: { width: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, paddingBottom: 6 },
  recordCount: { fontSize: 13, fontWeight: '600' },
  cardInternalScroll: { flex: 1 },
  recordList: { marginVertical: 4 },
  recordItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginVertical: 12, fontSize: 14 },
  expandButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  expandButtonText: { fontSize: 14, fontWeight: '600', marginRight: 4 },
  expandedContent: { marginTop: 4, paddingLeft: 24 },
  detailsText: { fontSize: 13, paddingVertical: 3 },
  fabButton: { position: 'absolute', bottom: 20, right: 15, width: 60, height: 60, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6, zIndex: 99, justifyContent: 'center', alignItems: 'center' },
  bottomModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalDragIndicator: { width: 40, height: 5, backgroundColor: '#cbd5e1', borderRadius: 3, marginBottom: 20 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30 },
  gridItem: { alignItems: 'center', width: 100 },
  gridIconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  bottomModalCloseButton: { width: '100%', padding: 14, borderRadius: 15, alignItems: 'center' },
  bottomModalCloseText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  closeButton: { paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  toiletItem: { padding: 15, borderRadius: 10, marginBottom: 10 },
  emptyNotificationContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 20 },
  bottomControlPanel: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    width: '90%',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  floatingBreathingContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 66,
    height: 66,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  floatingBreathingCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  floatingInnerCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingBreathingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  floatingBreathingTime: {
    color: '#fff',
    fontSize: 9,
    marginTop: 1,
  }
});