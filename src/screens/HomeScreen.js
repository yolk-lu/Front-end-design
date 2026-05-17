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

export default function HomeScreen({ navigation }) {
  const [role, setRole] = useState('patient');
  const [userName, setUserName] = useState('');

  // Modals state
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [toiletModalVisible, setToiletModalVisible] = useState(false);
  const [peeModalVisible, setPeeModalVisible] = useState(false);
  const [peeDate, setPeeDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadRole();
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
            onPress={() => setToiletModalVisible(true)}
          >
            <FontAwesome5 name="restroom" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>廁所導航</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setPeeModalVisible(true)}
          >
            <Ionicons name="water-outline" size={26} color={colors.primary} />
            <Text style={styles.actionButtonText}>排尿紀錄</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard */}
        <Dashboard role={role} />
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
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
        </TouchableOpacity>
      </Modal>

      {/* Notification Modal */}
      <Modal
        visible={notificationVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNotificationVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalContainer}>
            <Text style={styles.modalTitle}>通知</Text>
            <Text style={styles.modalContent}>目前沒有新通知</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setNotificationVisible(false)}>
              <Text style={styles.closeButtonText}>關閉</Text>
            </TouchableOpacity>
          </View>
        </View>
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
            <ScrollView style={{ width: '100%', marginBottom: 20 }}>
              <View style={styles.toiletItem}><Text style={styles.toiletText}>1. 大安森林公園公廁 (200m)</Text></View>
              <View style={styles.toiletItem}><Text style={styles.toiletText}>2. 捷運大安站公廁 (400m)</Text></View>
              <View style={styles.toiletItem}><Text style={styles.toiletText}>3. 附近便利商店廁所 (500m)</Text></View>
            </ScrollView>
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
            <Text style={styles.modalTitle}>排尿紀錄</Text>
            <Text style={styles.modalContent}>選擇排尿時間：</Text>
            <Text style={styles.timeDisplay}>
              {peeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>

            {showPicker && (
              <DateTimePicker
                value={peeDate}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setPeeDate(selectedDate);
                }}
              />
            )}

            <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.secondary, marginBottom: 10, width: '100%', alignItems: 'center' }]} onPress={() => setShowPicker(true)}>
              <Text style={styles.closeButtonText}>自行選擇時間</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.closeButton, { width: '100%', alignItems: 'center' }]} onPress={() => {
              // Save record logic here
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
    // 改為垂直排列
    flexDirection: 'column',
    marginBottom: 10,
  },
  actionButton: {
    // 移除 flex: 1，並增加垂直間距
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    width: 280,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
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
});