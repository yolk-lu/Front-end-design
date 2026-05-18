import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Modal, PanResponder, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { Audio } from 'expo-av';

const soundFiles = {
  water: require('../../../Datasets/white_noise_Datasets/water.mp3'),
  rain: require('../../../Datasets/white_noise_Datasets/rain.mp3'),
  waves: require('../../../Datasets/white_noise_Datasets/wave.mp3'),
  Waterfall: require('../../../Datasets/white_noise_Datasets/waterfall.mp3'),
};

export default function UrgencySuppressionScreen({ navigation }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState('water');
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('吸氣');
  const [volume, setVolume] = useState(0.6); // 0.0 ~ 1.0
  const volumeRef = useRef(0.6); // Non-reactive ref for drag

  const soundOptions = [
    { label: '流水聲 (Water Stream)', value: 'water' },
    { label: '雨聲 (Rain)', value: 'rain' },
    { label: '海浪聲 (Waves)', value: 'waves' },
    { label: '瀑布聲 (Waterfall)', value: 'Waterfall' },
  ];

  const getSelectedSoundLabel = () => {
    const found = soundOptions.find(opt => opt.value === selectedSound);
    return found ? found.label : '選擇白噪音';
  };

  // Animation value for breathing circle
  const circleScale = useRef(new Animated.Value(1)).current;
  const soundRef = useRef(null);
  const isLoadingRef = useRef(false); // Prevent race conditions

  // Volume slider
  const sliderWidth = useRef(0);
  const volumeAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    startBreathingAnimation();

    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    return () => {
      // Cleanup on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => { });
        soundRef.current = null;
      }
    };
  }, []);

  // Single unified effect for play/stop/switch
  const loadAndPlay = useCallback(async (soundKey, vol) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      // Always unload previous sound first
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) {
          // Ignore errors from already-unloaded sounds
        }
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        soundFiles[soundKey],
        { shouldPlay: true, isLooping: true, volume: vol }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error("Error playing sound", error);
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  const stopCurrentSound = useCallback(async () => {
    if (isLoadingRef.current) return;
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping sound", error);
    }
  }, []);

  // Handle play/pause toggle
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      setIsPlaying(false);
      await stopCurrentSound();
    } else {
      setIsPlaying(true);
      await loadAndPlay(selectedSound, volume);
    }
  }, [isPlaying, selectedSound, volume, loadAndPlay, stopCurrentSound]);

  // Handle sound change from picker
  const handleSoundChange = useCallback(async (newSound) => {
    setSelectedSound(newSound);
    // Always auto-play when selecting a new sound
    setIsPlaying(true);
    await loadAndPlay(newSound, volume);
  }, [volume, loadAndPlay]);

  // Handle volume change (for button taps only)
  const applyVolume = useCallback(async (newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    volumeRef.current = clamped;
    setVolume(clamped);
    volumeAnim.setValue(clamped);
    if (soundRef.current) {
      try { await soundRef.current.setVolumeAsync(clamped); } catch (e) { }
    }
  }, [volumeAnim]);

  // PanResponder for volume slider — updates Animated.Value directly, no re-render
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const v = Math.max(0, Math.min(1, touchX / (sliderWidth.current || 1)));
        volumeAnim.setValue(v);
        volumeRef.current = v;
        if (soundRef.current) {
          soundRef.current.setVolumeAsync(v).catch(() => { });
        }
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const v = Math.max(0, Math.min(1, touchX / (sliderWidth.current || 1)));
        volumeAnim.setValue(v);
        volumeRef.current = v;
        if (soundRef.current) {
          soundRef.current.setVolumeAsync(v).catch(() => { });
        }
      },
      onPanResponderRelease: () => {
        // Sync React state only on release
        setVolume(volumeRef.current);
      },
    })
  ).current;

  const startBreathingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        // Inhale (4s)
        Animated.timing(circleScale, {
          toValue: 1.5,
          duration: 4000,
          useNativeDriver: true,
        }),
        // Hold (4s)
        Animated.delay(4000),
        // Exhale (8s)
        Animated.timing(circleScale, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      ])
    ).start();

    let phase = 0;
    setInterval(() => {
      phase = (phase + 1) % 3;
      if (phase === 0) setBreathingPhase('吸氣 (4秒)');
      else if (phase === 1) setBreathingPhase('憋氣 (4秒)');
      else setBreathingPhase('吐氣 (8秒)');
    }, 4000);
  };

  const volumePercent = Math.round(volume * 100);

  // Animated interpolations for slider fill width and thumb position
  const fillWidth = volumeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const thumbLeft = volumeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>急迫抑制</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* White Noise Player Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>白噪音播放器</Text>
          <Text style={styles.sectionSubtitle}>舒緩急迫感，轉移注意力</Text>

          {/* Custom Combo Box for Sound Selection */}
          <TouchableOpacity
            style={styles.comboBox}
            onPress={() => setShowSoundPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.comboBoxText}>{getSelectedSoundLabel()}</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Volume Slider */}
          <View style={styles.controlsContainer}>
            <TouchableOpacity onPress={() => applyVolume(volume - 0.1)}>
              <Ionicons name="volume-low" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View
              style={styles.sliderTrack}
              onLayout={(e) => {
                sliderWidth.current = e.nativeEvent.layout.width;
              }}
              {...panResponder.panHandlers}
            >
              <Animated.View style={[styles.sliderFill, { width: fillWidth }]} />
              <Animated.View style={[styles.sliderThumb, { left: thumbLeft }]} />
            </View>
            <TouchableOpacity onPress={() => applyVolume(volume + 0.1)}>
              <Ionicons name="volume-high" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.volumeLabel}>音量: {volumePercent}%</Text>

          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={handlePlayPause}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={48}
              color="#fff"
              style={{ marginLeft: isPlaying ? 0 : 5 }}
            />
          </TouchableOpacity>
        </View>

        {/* Breathing Guide Section */}
        <View style={[styles.card, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={[styles.sectionTitle, { alignSelf: 'flex-start' }]}>呼吸引導</Text>
          <Text style={[styles.sectionSubtitle, { alignSelf: 'flex-start', marginBottom: 40 }]}>跟隨圓圈節奏深呼吸</Text>

          <View style={styles.breathingContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                { transform: [{ scale: circleScale }] }
              ]}
            />
            <View style={styles.innerCircle}>
              <Text style={styles.breathingText}>{breathingPhase}</Text>
            </View>
          </View>
        </View>
      </View>

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
    flex: 1,
    padding: 20,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButtonActive: {
    backgroundColor: '#ef4444',
  },
  breathingContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  breathingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  comboBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});
