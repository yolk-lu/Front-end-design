import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Image, Modal, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountScreen({ navigation }) {
  const { colors, isDarkMode } = useAppTheme();
  const styles = getStyles(colors);
  // State for all editable fields
  const [userName, setUserName] = useState('蕭雅農');
  const [avatarUri, setAvatarUri] = useState(null);
  const [email, setEmail] = useState('example@email.com');
  const [phone, setPhone] = useState('0912-345-678');
  const [birthday, setBirthday] = useState(new Date('1990-01-01'));
  const [gender, setGender] = useState('女');

  // UI state
  const [editingField, setEditingField] = useState(null); // 'name', 'email', 'phone'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      let emailKey = await AsyncStorage.getItem('currentUserEmail');
      let userData = null;

      if (emailKey) {
        const stored = await AsyncStorage.getItem(`user_${emailKey}`);
        if (stored) userData = JSON.parse(stored);
      } else {
        const currentName = await AsyncStorage.getItem('currentUserName');
        if (currentName) {
          const keys = await AsyncStorage.getAllKeys();
          const userKeys = keys.filter(k => k.startsWith('user_') && k !== 'userRole');
          for (const key of userKeys) {
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.name === currentName) {
                userData = parsed;
                emailKey = parsed.email;
                await AsyncStorage.setItem('currentUserEmail', parsed.email);
                break;
              }
            }
          }
        }
      }

      if (userData) {
        if (userData.name) setUserName(userData.name);
        if (userData.email) setEmail(userData.email);
        if (userData.phone) setPhone(userData.phone);
        if (userData.gender) setGender(userData.gender);
        if (userData.birthday) setBirthday(new Date(userData.birthday));
        if (userData.avatarUri) setAvatarUri(userData.avatarUri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveUserData = async (updates) => {
    try {
      const emailKey = await AsyncStorage.getItem('currentUserEmail');
      if (emailKey) {
        const stored = await AsyncStorage.getItem(`user_${emailKey}`);
        if (stored) {
          const userData = JSON.parse(stored);
          const newUserData = { ...userData, ...updates };
          await AsyncStorage.setItem(`user_${emailKey}`, JSON.stringify(newUserData));
          if (updates.name) {
            await AsyncStorage.setItem('currentUserName', updates.name);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarPress = () => {
    const buttons = [
      { text: '拍照', onPress: handleTakePhoto },
      { text: '從相簿選擇', onPress: handleChooseFromLibrary }
    ];

    if (avatarUri) {
      buttons.push({ text: '刪除照片', style: 'destructive', onPress: handleDeletePhoto });
    }

    buttons.push({ text: '取消', style: 'cancel' });

    Alert.alert(
      '設定頭像',
      '請選擇您要如何設定大頭貼：',
      buttons
    );
  };

  const handleChooseFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('權限不足', '需要相簿存取權限才能選擇照片。');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      setAvatarUri(uri);
      saveUserData({ avatarUri: uri });
    }
  };

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('權限不足', '需要相機權限才能拍攝照片。');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      setAvatarUri(uri);
      saveUserData({ avatarUri: uri });
    }
  };

  const handleDeletePhoto = () => {
    setAvatarUri(null);
    saveUserData({ avatarUri: null });
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthday(selectedDate);
      saveUserData({ birthday: selectedDate.toISOString() });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '警告',
      '確定要刪除帳號嗎？此操作將清除所有資料且無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定刪除',
          style: 'destructive',
          onPress: async () => {
            try {
              const emailKey = await AsyncStorage.getItem('currentUserEmail');
              if (emailKey) {
                await AsyncStorage.removeItem(`user_${emailKey}`);
              }
              await AsyncStorage.removeItem('currentUserEmail');
              await AsyncStorage.removeItem('currentUserName');
              await AsyncStorage.removeItem('userRole');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const renderField = (field, label, value, stateSetter, keyboardType = 'default', isLast = false) => {
    const isEditing = editingField === field;

    return (
      <View style={[styles.detailItem, isLast && { borderBottomWidth: 0 }]}>
        <Text style={styles.detailLabel}>{label}</Text>

        {isEditing ? (
          <TextInput
            style={styles.detailInput}
            value={value}
            onChangeText={stateSetter}
            onBlur={() => {
              setEditingField(null);
              saveUserData({ name: userName, email: email, phone: phone });
            }}
            autoFocus
            keyboardType={keyboardType}
          />
        ) : (
          <TouchableOpacity onPress={() => setEditingField(field)} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.detailValue}>{value}</Text>
            <Ionicons name="pencil" size={14} color={colors.textSecondary} style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={{ width: 40, alignItems: 'flex-start' }} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>帳戶資訊</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color={colors.border} />
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Ionicons name="camera" size={16} color={isDarkMode ? '#000' : '#fff'} />
            </View>
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            {editingField === 'name' ? (
              <TextInput
                style={styles.nameInput}
                value={userName}
                onChangeText={setUserName}
                onBlur={() => {
                  setEditingField(null);
                  saveUserData({ name: userName, email: email, phone: phone });
                }}
                autoFocus
              />
            ) : (
              <>
                <Text style={styles.userName}>{userName}</Text>
                <TouchableOpacity onPress={() => setEditingField('name')} style={styles.editNameButton}>
                  <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 1. 第一分組：個人基本資料 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>個人基本資料</Text>
          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>性別</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.detailValue}>{gender}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
            <View style={[styles.detailItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>生日</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.detailValue}>{`${birthday.getFullYear()}/${String(birthday.getMonth() + 1).padStart(2, '0')}/${String(birthday.getDate()).padStart(2, '0')}`}</Text>
                <Ionicons name="calendar" size={14} color={colors.textSecondary} style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. 第二分組：帳號與聯絡資訊 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>帳號與聯絡資訊</Text>
          <View style={styles.detailsSection}>
            {renderField('email', '電子信箱', email, setEmail, 'email-address')}
            {renderField('phone', '手機號碼', phone, setPhone, 'phone-pad', true)}
          </View>
        </View>

        {/* 3. 第三分組：安全與帳務 */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>安全與帳務</Text>
          <View style={styles.detailsSection}>
            <TouchableOpacity style={styles.detailItem} onPress={() => navigation.navigate('ChangePassword')}>
              <Text style={styles.detailLabel}>修改密碼</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.detailItem, { borderBottomWidth: 0 }]} onPress={handleDeleteAccount}>
              <Text style={[styles.detailLabel, { color: colors.danger }]}>刪除帳號</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* DatePicker Modal */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModalContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: isDarkMode ? '#000' : colors.primary, fontSize: 16, fontWeight: 'bold' }}>完成</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={birthday}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={birthday}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )
      )}

      {/* Gender Picker Modal */}
      <Modal visible={showGenderPicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>選擇性別</Text>
            {['男', '女', '其他'].map(item => (
              <TouchableOpacity
                key={item}
                style={styles.modalOption}
                onPress={() => {
                  setGender(item);
                  saveUserData({ gender: item });
                  setShowGenderPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, gender === item && { color: colors.primary, fontWeight: 'bold' }]}>
                  {item}
                </Text>
                {gender === item && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowGenderPicker(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



      {/* Action Buttons
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>修改密碼</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>刪除帳號</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 10,
  },
  sectionContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editAvatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
  },
  editNameButton: {
    marginLeft: 10,
    padding: 5,
  },
  detailsSection: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 55,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  detailInput: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    minWidth: 150,
    textAlign: 'right',
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    paddingBottom: 25,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  modalCancel: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  pickerModalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionSection: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    alignItems: 'center',
    padding: 10,
  },
  deleteButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
