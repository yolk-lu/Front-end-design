import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import DietScreen from '../screens/DietScreen'; // 確保這行路徑正確
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const DummyScreen = ({ name }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <Text style={{ fontSize: 24, color: colors.text }}>{name}</Text>
  </View>
);

export default function MainTabNavigator() {
  const [addModalVisible, setAddModalVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 65,
            paddingBottom: 10,
            paddingTop: 5,
          }
        }}
      >
        <Tab.Screen
          name="主畫面"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
          }}
        />
        <Tab.Screen
          name="運動"
          component={() => <DummyScreen name="運動頁面" />}
          options={{
            tabBarIcon: ({ color }) => <FontAwesome5 name="running" size={20} color={color} />
          }}
        />

        {/* 飲食標籤 - 這裡已經改成連結到 DietScreen */}
        <Tab.Screen
          name="飲食"
          component={DietScreen}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="restaurant" size={24} color={color} />
          }}
        />

        <Tab.Screen
          name="數據"
          component={() => <DummyScreen name="數據頁面" />}
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />
          }}
        />
      </Tab.Navigator>

      {/* Modal 保持不變 */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalContainer}>
            <Text style={styles.modalTitle}>自訂功能</Text>
            <Text style={styles.modalContent}>（加號圖案按鈕空視窗）</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setAddModalVisible(false)}>
              <Text style={styles.closeButtonText}>關閉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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