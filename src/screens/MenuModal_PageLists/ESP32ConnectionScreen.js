import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/colors';

// 在元件外部定義一個全域變數來維持模擬連線狀態。
// 這樣就算畫面被卸載（unmount）再重新進入，連線狀態依然會被保留。
let globalIsConnected = false;
let globalDeviceCode = '';

export default function ESP32ConnectionScreen({ navigation }) {
  const { colors, isDarkMode } = useAppTheme();
  const styles = getStyles(colors, isDarkMode);
  const [deviceCode, setDeviceCode] = useState(globalDeviceCode);
  const [isConnected, setIsConnected] = useState(globalIsConnected);
  const [isConnecting, setIsConnecting] = useState(false); // 載入動畫狀態

  // 每次進到畫面時，同步一次全域的連線狀態
  useEffect(() => {
    setIsConnected(globalIsConnected);
    setDeviceCode(globalDeviceCode);
  }, []);

  // 處理連線邏輯
  const handleConnect = () => {
    if (deviceCode.length > 0) {
      setIsConnecting(true);

      // 這裡放入真實的硬體連線邏輯，目前用 setTimeout 模擬
      setTimeout(async () => {
        globalIsConnected = true;
        globalDeviceCode = deviceCode;
        setIsConnected(true);
        setIsConnecting(false);
        await AsyncStorage.setItem('esp32_connected', 'true');
      }, 1500); // 模擬 1.5 秒的連線配對時間
    }
  };

  // 處理中斷連線邏輯
  const handleDisconnect = async () => {
    globalIsConnected = false;
    globalDeviceCode = '';
    setIsConnected(false);
    setDeviceCode('');
    await AsyncStorage.setItem('esp32_connected', 'false');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{ width: 40, alignItems: 'flex-start' }} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ESP32 連接代號</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Connection Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>目前連線狀態</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4ade80' : '#94a3b8' }]} />
            <Text style={[styles.statusText, { color: isConnected ? '#166534' : colors.textSecondary }]}>
              {isConnected ? '已連線 (裝置正常運作中)' : '斷線中 (尚未綁定裝置)'}
            </Text>
          </View>
        </View>

        {/* Input & Control Area */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>硬體感測器綁定</Text>

          <TextInput
            style={[styles.textInput, isConnected && styles.textInputDisabled]}
            placeholder="請輸入 ESP32 裝置綁定代碼"
            value={deviceCode}
            onChangeText={setDeviceCode}
            placeholderTextColor={colors.textSecondary}
            editable={!isConnected && !isConnecting} // 連線成功或連線中時，禁止修改輸入框
          />

          {!isConnected ? (
            // 尚未連線時：顯示「開始連線」按鈕
            <TouchableOpacity
              style={[styles.primaryButton, { opacity: (deviceCode.length === 0 || isConnecting) ? 0.6 : 1 }]}
              onPress={handleConnect}
              disabled={deviceCode.length === 0 || isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>開始連線 / 綁定裝置</Text>
              )}
            </TouchableOpacity>
          ) : (
            // 已連線時：顯示「中斷連線」按鈕
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>中斷裝置連線</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputSection: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    backgroundColor: colors.background,
  },
  textInputDisabled: {
    backgroundColor: colors.background,
    color: colors.textSecondary,
    borderColor: colors.border,
  },
  primaryButton: {
    backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: isDarkMode ? '#000' : '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#ef4444', // 紅色按鈕提示中斷
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});