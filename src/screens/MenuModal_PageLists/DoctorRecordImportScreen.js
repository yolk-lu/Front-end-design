import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function DoctorRecordImportScreen({ navigation }) {
  const historyRecords = [
    { id: '1', date: '2026/05/10', status: '匯入成功', type: 'PDF' },
    { id: '2', date: '2026/04/12', status: '匯入成功', type: '照片' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>醫生診斷紀錄匯入</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>上傳新紀錄</Text>
          <Text style={styles.sectionSubtitle}>匯入醫院檢查報告，作為設定參數的參考。</Text>
          
          <TouchableOpacity style={styles.uploadBox} activeOpacity={0.7}>
            <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} style={{ marginBottom: 15 }} />
            <Text style={styles.uploadText}>點擊上傳 PDF 或 拍攝診斷書</Text>
            <Text style={styles.uploadSubtext}>支援格式: .pdf, .jpg, .png</Text>
          </TouchableOpacity>
        </View>

        {/* History Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>歷史匯入紀錄</Text>
          
          <View style={styles.historyCard}>
            {historyRecords.map((record, index) => {
              const isLast = index === historyRecords.length - 1;
              return (
                <View key={record.id} style={[styles.historyItem, isLast && { borderBottomWidth: 0 }]}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyDate}>{record.date}</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>{record.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.historyRight}>
                    <Text style={styles.historyType}>{record.type}</Text>
                    <TouchableOpacity style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>檢視</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
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
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
    marginLeft: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    marginLeft: 5,
  },
  uploadBox: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7', // light green bg
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#16a34a', // dark green text
    fontWeight: 'bold',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 15,
  },
  viewButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  }
});
