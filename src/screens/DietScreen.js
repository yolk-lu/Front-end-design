import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function DietScreen() {
  const [inputText, setInputText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* 頂部標題列 */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>護理分析助理</Text>
          <MaterialCommunityIcons 
            name="stethoscope" 
            size={24} 
            color={colors.text} 
            style={styles.headerIcon} 
          />
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 20 }}>👩‍⚕️</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 對話內容區域 */}
      <ScrollView 
        style={styles.chatContainer} 
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.messageWrapper}>
          <View style={styles.assistantAvatar}>
            <MaterialCommunityIcons name="stethoscope" size={16} color={colors.text} />
          </View>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>
              您好！我是您的飲食分析助理。請透過文字、語音或拍照記錄您的飲食，我會為您分析並預測排尿時間。
            </Text>
            <Text style={styles.timestamp}>5:20 PM</Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部工具列 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="camera-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={26} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="或手動輸入飲食..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
            />
          </View>

          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="paper-plane" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerIcon: {
    marginLeft: 8,
  },
  profileButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageBubble: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 15,
    borderTopLeftRadius: 2,
    padding: 15,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 5,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});