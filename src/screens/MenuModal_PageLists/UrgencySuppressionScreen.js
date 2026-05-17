import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../theme/colors';

export default function UrgencySuppressionScreen({ navigation }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSound, setSelectedSound] = useState('water');
  const [breathingPhase, setBreathingPhase] = useState('吸氣'); // 吸氣, 憋氣, 吐氣

  // Animation value for breathing circle
  const circleScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startBreathingAnimation();
  }, []);

  const startBreathingAnimation = () => {
    // 4-4-4 breathing technique
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

    // Text sync logic (simplified for UI demonstration)

    let phase = 0;
    setInterval(() => {
      phase = (phase + 1) % 3;
      if (phase === 0) setBreathingPhase('吸氣 (4秒)');
      else if (phase === 1) setBreathingPhase('憋氣 (4秒)');
      else setBreathingPhase('吐氣 (8秒)');
    }, 4000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>急迫抑制按鈕</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* White Noise Player Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>白噪音播放器</Text>
          <Text style={styles.sectionSubtitle}>舒緩急迫感，轉移注意力</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSound}
              onValueChange={(itemValue) => setSelectedSound(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="流水聲 (Water Stream)" value="water" />
              <Picker.Item label="雨聲 (Rain)" value="rain" />
              <Picker.Item label="海浪聲 (Waves)" value="waves" />
              <Picker.Item label="瀑布聲 (Waterfall)" value="Waterfall" />
            </Picker>
          </View>

          <View style={styles.controlsContainer}>
            <Ionicons name="volume-low" size={24} color={colors.textSecondary} />
            <View style={styles.sliderTrack}>
              <View style={styles.sliderFill} />
              <View style={styles.sliderThumb} />
            </View>
            <Ionicons name="volume-high" size={24} color={colors.textSecondary} />
          </View>

          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden', // important for iOS picker rounding
  },
  picker: {
    height: 50,
    width: '100%',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginHorizontal: 15,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    width: '60%', // Dummy value for volume
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    left: '60%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    transform: [{ translateX: -10 }], // center the thumb
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
    backgroundColor: 'rgba(56, 189, 248, 0.2)', // Light blue tint
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
  }
});
