import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const [role, setRole] = useState('caregiver'); // 'caregiver' | 'patient'

  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem('userRole', role);
      navigation.replace('Main');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>歡迎回來</Text>
        <Text style={styles.subtitle}>請選擇您的登入身分</Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'caregiver' && styles.roleCardActive]}
            onPress={() => setRole('caregiver')}
          >
            <Text style={[styles.roleText, role === 'caregiver' && styles.roleTextActive]}>
              照護者
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleCard, role === 'patient' && styles.roleCardActive]}
            onPress={() => setRole('patient')}
          >
            <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>
              病患
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>登入</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#EBF4FF',
  },
  roleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  roleTextActive: {
    color: colors.primary,
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
