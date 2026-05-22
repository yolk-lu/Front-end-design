import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export const lightColors = {
  primary: '#000000',        // 頂級品牌黑 (作為主要視覺與按鈕)
  secondary: '#A3AAAE',      // 質感銀灰 (作為漸層或次要視覺)
  background: '#F5F5F5',
  surface: '#FFFFFF',        // 純白卡片區塊
  text: '#000000',           // 黑色主要文字
  textSecondary: '#A3AAAE',  // 銀灰次要文字與圖示
  border: '#E5E5E5',         // 淺灰邊框
  danger: '#FF3B30',         // 警告紅 (維持 iOS 系統標準紅)
  bubbleAssistant: '#FFFFFF',// 助手對話框 (白)
  bubbleUser: '#A3AAAE',     // 用戶對話框 (銀灰)
};

export const darkColors = {
  primary: '#FFFFFF',        // 純白 (對應淺色的黑，作為主要視覺與按鈕)
  secondary: '#8E8E93',      // 質感銀灰 (作為漸層或次要視覺)
  background: '#000000',     // 純黑 (OLED 友善)
  surface: '#1C1C1E',        // 質感深灰卡片區塊 (Apple 標準深色卡片)
  text: '#FFFFFF',           // 白色主要文字
  textSecondary: '#8E8E93',  // 銀灰次要文字與圖示
  border: '#38383A',         // 深灰邊框
  danger: '#FF453A',         // 警告紅 (維持 iOS 系統標準深色紅)
  bubbleAssistant: '#1C1C1E',// 助手對話框 (深灰)
  bubbleUser: '#5C636A',     // 用戶對話框 (偏暗銀灰)
};

// Fallback for static imports (will be light mode static)
export const colors = lightColors;

// Global theme setter
export const setGlobalTheme = async (mode) => {
  try {
    await AsyncStorage.setItem('userTheme_Internal', mode);
    DeviceEventEmitter.emit('themeChanged', mode);
  } catch (e) {
    console.error('Failed to set theme:', e);
  }
};

// Hook for components to dynamically respond to theme
export function useAppTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme_Internal');
        if (isMounted && savedTheme === 'dark') {
          setIsDarkMode(true);
        }
      } catch (e) { }
    };
    load();

    const subscription = DeviceEventEmitter.addListener('themeChanged', (mode) => {
      if (isMounted) setIsDarkMode(mode === 'dark');
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return {
    isDarkMode,
    colors: isDarkMode ? darkColors : lightColors
  };
}
