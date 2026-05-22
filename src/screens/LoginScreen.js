import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/colors';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  // 狀態管理
  const [isLoginMode, setIsLoginMode] = useState(true); // 切換登入或註冊
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('patient'); // 預設角色

  // 處理 登入/註冊 按鈕
  const handleSubmit = async () => {
    if (isLoginMode) {
      if (!email || !password) {
        Alert.alert('提示', '請輸入完整的帳號密碼');
        return;
      }
      // --- 執行登入邏輯 ---
      try {
        const storedUserData = await AsyncStorage.getItem(`user_${email}`);
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          if (user.password === password) {
            // 登入成功，儲存當前登入者角色與名字
            await AsyncStorage.setItem('userRole', user.role);
            if (user.name) await AsyncStorage.setItem('currentUserName', user.name);
            await AsyncStorage.setItem('currentUserEmail', email);
            navigation.replace('Main');
          } else {
            Alert.alert('錯誤', '密碼不正確');
          }
        } else {
          Alert.alert('錯誤', '找不到此帳號，請先註冊');
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // --- 執行註冊邏輯 ---
      if (!email || !password || !name || !phone) {
        Alert.alert('提示', '請填寫所有基本資料');
        return;
      }
      try {
        const newUser = { email, password, name, phone, role };
        await AsyncStorage.setItem(`user_${email}`, JSON.stringify(newUser));
        await AsyncStorage.setItem('userRole', role); // 設定當前角色
        await AsyncStorage.setItem('currentUserName', name); // 儲存當前使用者名稱
        await AsyncStorage.setItem('currentUserEmail', email); // 儲存當前使用者信箱
        Alert.alert('成功', '註冊並登入成功！');
        navigation.replace('Main');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 切換模式時重置狀態
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaskedView
                style={{ height: 40, width: 180 }}
                maskElement={
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={styles.logoText}>U-smoothe</Text>
                  </View>
                }
              >
                <LinearGradient
                  colors={['#4361EE', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </MaskedView>
            </View>
            {!isLoginMode && <Text style={styles.title}>建立帳號</Text>}
            <Text style={styles.subtitle}>
              {isLoginMode ? '請登入您的帳號已繼續' : '完成註冊後即可固定您的角色'}
            </Text>
          </View>

          {/* 輸入帳密與基本資料 */}
          <View style={styles.inputContainer}>
              {!isLoginMode && (
                <>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="姓名"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="電話號碼"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              )}
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="電子郵件"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="密碼"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

          {/* 註冊時才顯示的角色選擇器 */}
          {!isLoginMode && (
            <View>
              <Text style={styles.sectionTitle}>請選擇您的身份 (設定後不可更改)</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'caregiver' && styles.roleCardActive]}
                  onPress={() => setRole('caregiver')}
                >
                  <Ionicons 
                    name="heart" 
                    size={32} 
                    color={role === 'caregiver' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.roleText, role === 'caregiver' && styles.roleTextActive]}>
                    照護者
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleCard, role === 'patient' && styles.roleCardActive]}
                  onPress={() => setRole('patient')}
                >
                  <Ionicons 
                    name="person" 
                    size={32} 
                    color={role === 'patient' ? colors.primary : colors.textSecondary} 
                  />
                  <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>
                    病患
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 按鈕區域 */}
          <TouchableOpacity style={styles.mainButton} onPress={handleSubmit}>
            <Text style={styles.mainButtonText}>
              {isLoginMode ? '立即登入' : '完成註冊'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={toggleMode}>
            <Text style={styles.switchButtonText}>
              {isLoginMode ? '還沒有帳號？ 按此註冊' : '已有帳號？ 按此登入'}
            </Text>
          </TouchableOpacity>



        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 24,
    borderRadius: 16,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0F7FF', // 極淺藍色
  },
  roleText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleTextActive: {
    color: colors.primary,
  },
  mainButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchButtonText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
});