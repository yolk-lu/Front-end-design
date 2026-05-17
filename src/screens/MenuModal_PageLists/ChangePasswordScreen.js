import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState(null);
  const [emailKey, setEmailKey] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const email = await AsyncStorage.getItem('currentUserEmail');
      if (email) {
        setEmailKey(email);
        const stored = await AsyncStorage.getItem(`user_${email}`);
        if (stored) {
          setUserData(JSON.parse(stored));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }
    if (userData && oldPassword !== userData.password) {
      Alert.alert('錯誤', '舊密碼不正確');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('錯誤', '兩次輸入的新密碼不一致');
      return;
    }

    try {
      const newUserData = { ...userData, password: newPassword };
      await AsyncStorage.setItem(`user_${emailKey}`, JSON.stringify(newUserData));
      Alert.alert('成功', '密碼修改成功！', [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('錯誤', '密碼修改失敗');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>修改密碼</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>舊密碼</Text>
          <TextInput
            style={styles.input}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholder="請輸入目前密碼"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>新密碼</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="請輸入新密碼"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>確認新密碼</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="請再次輸入新密碼"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleUpdatePassword}>
          <Text style={styles.submitButtonText}>確認修改</Text>
        </TouchableOpacity>
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
