import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function TutorialScreen({ navigation }) {
  const [expandedId, setExpandedId] = useState(null);

  const tutorials = [
    {
      id: '1',
      title: '如何配戴感測器？',
      content: '1. 請先確保 ESP32 感測器已充飽電。\n2. 將感測器背面的魔鬼氈固定於您的內褲外側，對準尿濕容易發生的位置。\n3. 開啟 App 並進入「ESP32 連接代號」頁面進行配對。\n4. 確認儀表板上的「尿濕提醒」顯示連線中即可開始使用。',
      icon: 'hardware-chip-outline'
    },
    {
      id: '2',
      title: '正常排尿數據範圍是多少？',
      content: '一般健康成人的排尿狀況參考：\n• 頻率：白天約 4-8 次，夜間 0-1 次。\n• 尿量：每次約 200-400 毫升，每日總量約 1000-2000 毫升。\n若您的排尿頻率異常頻繁或有強烈急迫感，可使用本 App 記錄並匯出給醫師參考。',
      icon: 'water-outline'
    },
    {
      id: '3',
      title: '常見問題 (FAQ)',
      content: 'Q: 裝置充飽電能用多久？\nA: 在正常使用情況下，充飽電約可待機 3-5 天。\n\nQ: 手機需要一直開著藍牙嗎？\nA: 是的，為了即時接收尿濕警告，請保持手機藍牙開啟並讓 App 於背景執行。\n\nQ: 資料會不見嗎？\nA: 您的資料目前儲存於手機設備中，建議定期匯出備份。',
      icon: 'help-circle-outline'
    }
  ];

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>教學指引</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          點擊下方項目展開閱讀詳細教學與常見問題。
        </Text>

        <View style={styles.accordionContainer}>
          {tutorials.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const isLast = index === tutorials.length - 1;

            return (
              <View key={item.id} style={styles.itemWrapper}>
                <TouchableOpacity 
                  style={[styles.itemHeader, isExpanded && styles.itemHeaderExpanded, isLast && !isExpanded && { borderBottomWidth: 0 }]} 
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemTitleContainer}>
                    <Ionicons name={item.icon} size={24} color={colors.primary} style={{ marginRight: 15 }} />
                    <Text style={styles.itemTitle}>{item.title}</Text>
                  </View>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.itemContent, isLast && { borderBottomWidth: 0 }]}>
                    <Text style={styles.contentText}>{item.content}</Text>
                  </View>
                )}
              </View>
            );
          })}
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
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    marginLeft: 5,
  },
  accordionContainer: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemWrapper: {
    // 容器樣式
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemHeaderExpanded: {
    borderBottomWidth: 0,
    paddingBottom: 10,
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemContent: {
    paddingBottom: 20,
    paddingRight: 10,
    paddingLeft: 40, // 縮排對齊文字
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
