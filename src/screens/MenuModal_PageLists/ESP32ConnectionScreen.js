import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function ESP32ConnectionScreen({ navigation }) {
  const [deviceCode, setDeviceCode] = useState('');
  const [isConnected, setIsConnected] = useState(false); // 模擬連線狀態

  const handleConnect = () => {
    // 這裡放入真實的連線邏輯，目前用簡單的 setTimeout 模擬
    if (deviceCode.length > 0) {
      setTimeout(() => {
        setIsConnected(true);
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ESP32 連接代號</Text>
        <View style={{ width: 24 }} />
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

        {/* Input Area */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>綁定新的硬體感測器</Text>
          <TextInput
            style={styles.textInput}
            placeholder="請輸入 ESP32 裝置綁定代碼"
            value={deviceCode}
            onChangeText={setDeviceCode}
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity 
            style={[styles.primaryButton, { opacity: deviceCode.length === 0 ? 0.6 : 1 }]} 
            onPress={handleConnect}
            disabled={deviceCode.length === 0}
          >
            <Text style={styles.primaryButtonText}>開始連線 / 綁定裝置</Text>
          </TouchableOpacity>
        </View>

        {/* Tutorial Area */}
        <View style={styles.tutorialSection}>
          <View style={styles.tutorialHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.tutorialTitle}>如何找到裝置代號？</Text>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>翻開您的 ESP32 感測器底部，您會看到一張印有 QR Code 的貼紙。</Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>QR Code 下方的 6 到 8 碼英文數字混合字串，即為裝置綁定代碼。</Text>
          </View>
          <View style={styles.stepContainer}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>將代碼輸入上方欄位後點擊連線即可。</Text>
          </View>

          {/* Placeholder for an image */}
          <View style={styles.imagePlaceholder}>
            <Ionicons name="qr-code-outline" size={40} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 10 }}>感測器底部示意圖</Text>
          </View>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 5,
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
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tutorialSection: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
  },
  tutorialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingRight: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
});
