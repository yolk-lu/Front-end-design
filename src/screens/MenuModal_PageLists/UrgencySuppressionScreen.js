import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UrgencySuppressionScreen({ navigation }) {
  const { colors, isDarkMode } = useAppTheme();
  const styles = getStyles(colors);
  const [selectedSound, setSelectedSound] = useState('wind');
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const soundOptions = [
    { label: '大自然風聲 (Wind)', value: 'wind' },
    { label: '火車行駛聲 (Train)', value: 'train' },
    { label: '飛機引擎聲 (Airplane)', value: 'airplane' },
    { label: '嬰兒助眠聲 (Baby Sleep)', value: 'baby_sleep' },
  ];

  const getSelectedSoundLabel = () => {
    const found = soundOptions.find(opt => opt.value === selectedSound);
    return found ? found.label : '選擇白噪音';
  };

  useEffect(() => {
    const loadSavedSound = async () => {
      try {
        const saved = await AsyncStorage.getItem('selected_white_noise');
        if (saved) {
          setSelectedSound(saved);
        }
      } catch (e) {
        console.error('Failed to load saved white noise:', e);
      }
    };
    loadSavedSound();
  }, []);

  const handleSoundChange = useCallback(async (newSound) => {
    setSelectedSound(newSound);
    try {
      await AsyncStorage.setItem('selected_white_noise', newSound);
    } catch (e) {
      console.error('Failed to save white noise preference:', e);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ width: 40, alignItems: 'flex-start' }} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>急迫抑制</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>白噪音播放器</Text>
          <Text style={styles.sectionSubtitle}>舒緩急迫感，轉移注意力</Text>

          <TouchableOpacity
            style={styles.comboBox}
            onPress={() => setShowSoundPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.comboBoxText}>{getSelectedSoundLabel()}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sound Selection Modal */}
      <Modal visible={showSoundPicker} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>選擇白噪音</Text>
            {soundOptions.map(item => (
              <TouchableOpacity
                key={item.value}
                style={styles.modalOption}
                onPress={() => {
                  handleSoundChange(item.value);
                  setShowSoundPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, selectedSound === item.value && { color: colors.primary, fontWeight: 'bold' }]}>
                  {item.label}
                </Text>
                {selectedSound === item.value && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSoundPicker(false)}>
              <Text style={styles.modalCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  contentContainer: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 60,
  },
  card: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
    marginBottom: 15,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginHorizontal: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    transform: [{ translateX: -11 }],
  },
  volumeLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButtonActive: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
  },
  breathingContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  breathingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  comboBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    marginTop: 10,
  },
  comboBoxText: {
    fontSize: 16,
    color: colors.text,
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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  modalCancel: {
    marginTop: 10,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});