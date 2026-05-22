import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// 將資料移至元件外以提升效能
const tutorials = [
  {
    id: '1',
    title: '如何進行凱格爾運動復健？',
    content: '1. 確保手機鏡頭能拍攝到您的全身骨架。\n2. 開啟 App 並點選「復健模式」。\n3. 系統將透過影像辨識技術引導動作。\n4. 請依照語音指示進行收縮，若姿勢正確系統會記錄次數，若錯誤會立即給予修正建議。',
    icon: 'body-outline'
  },
  {
    id: '2',
    title: '如何使用飲食預測與排尿提醒？',
    content: '1. 透過語音或文字輸入您的飲食內容。\n2. 系統將利用 BERTopic 自動辨識咖啡因或酒精等刺激因子。\n3. 系統會結合歷史排尿日誌進行模型訓練。\n4. 若系統預測有尿急風險，將主動發送通知提醒您如廁。',
    icon: 'fast-food-outline'
  },
  {
    id: '3',
    title: '照護者如何進行遠端監測？',
    content: 'Q: 如何知道長輩尿濕了？\nA: 當電容式感測貼片偵測到濕度超過閾值，系統會立即推播通知至您的手機。\n\nQ: 如何預防長輩發生壓瘡？\nA: 透過 MPU6050 感測器監測體位，若偵測到長時間未翻身，App 會主動發出提醒。\n\nQ: 如何與醫師溝通病情？\nA: 使用照護者管理端的「監測儀表板」查看數據，並可匯出視覺化報表，提供客觀的排尿與翻身紀錄。',
    icon: 'people-circle-outline'
  },
  {
    id: '4',
    title: '遇到尿急該怎麼辦？',
    content: 'Q: 外出時突然感到強烈尿意怎麼辦？\nA: 系統提供「急迫感抑制引導」功能，可播放白噪音或進行呼吸引導，幫助您轉移注意力並延緩排尿。\n\nQ: 附近找不到廁所怎麼辦？\nA: 可使用 App 內的廁所導航功能，系統會自動定位並規劃前往鄰近公廁的最短路徑。',
    icon: 'map-outline'
  }
];

export default function TutorialScreen({ navigation }) {
  const { colors, isDarkMode } = useAppTheme();
  const styles = getStyles(colors);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ width: 40, alignItems: 'flex-start' }} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>教學指引</Text>
        <View style={{ width: 40 }} />
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
                  style={[styles.itemHeader, isExpanded && styles.itemHeaderExpanded]}
                  onPress={() => toggleExpand(item.id)}
                  activeOpacity={1}
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
    paddingLeft: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contentText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});