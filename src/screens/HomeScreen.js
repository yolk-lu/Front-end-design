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
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const [role, setRole] = useState('patient');
  
  // Modals state
  const [menuVisible, setMenuVisible] = useState(false);
  const [toiletModalVisible, setToiletModalVisible] = useState(false);
  const [peeModalVisible, setPeeModalVisible] = useState(false);

  useEffect(() => {
    loadRole();
  }, []);

  const loadRole = async () => {
    try {
      const savedRole = await AsyncStorage.getItem('userRole');
      if (savedRole) setRole(savedRole);
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
        <Text style={styles.headerTitle}>主畫面</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
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
        {/* Buttons */}
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
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>帳號管理</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>ESP32連接代號</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>預設抑制按鈕</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>教學</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>儀錶板資料匯出</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>醫生診斷證明匯入</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, {borderBottomWidth: 0}]} onPress={handleLogout}>
              <Text style={[styles.menuText, {color: colors.danger}]}>登出</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Toilet Modal */}
      <Modal
        visible={toiletModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setToiletModalVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalContainer}>
            <Text style={styles.modalTitle}>廁所導航</Text>
            <Text style={styles.modalContent}>（空視窗內容）</Text>
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
            <Text style={styles.modalTitle}>排尿</Text>
            <Text style={styles.modalContent}>（空視窗內容）</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPeeModalVisible(false)}>
              <Text style={styles.closeButtonText}>關閉</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginHorizontal: 5,
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
    top: 60,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 10,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
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
});
