import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function Dashboard({ role, peeRecords = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  const caregiverReminders = [
    { id: '1', title: '排尿紀錄', time: peeRecords.length > 0 ? `${peeRecords.length} 筆` : '無紀錄' },
    { id: '2', title: '翻身提醒', time: '12:00 PM', detail: '建議每兩小時協助病患翻身一次，避免褥瘡。' },
    { id: '3', title: '尿濕提醒', time: '隨時', detail: '目前感測器未偵測到尿濕。' },
  ];

  const patientReminders = [
    { id: '1', title: '排尿紀錄', time: peeRecords.length > 0 ? `${peeRecords.length} 筆` : '無紀錄' },
    { id: '2', title: '運動時間紀錄', time: '09:00 AM', detail: '今天已完成 30 分鐘伸展運動。' },
    { id: '3', title: '尿濕提醒', time: '隨時', detail: '系統將在偵測到尿濕時立即提醒您。' },
  ];

  const reminders = role === 'caregiver' ? caregiverReminders : patientReminders;
  const roleName = role === 'caregiver' ? '照護者' : '病患';

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderPeeRecordsList = () => {
    if (peeRecords.length === 0) {
      return (
        <Text style={styles.dropdownText}>尚無排尿紀錄，請點擊上方「排尿紀錄」按鈕新增。</Text>
      );
    }
    return peeRecords.map((record, index) => (
      <View key={record.fileName} style={[styles.recordItem, index === peeRecords.length - 1 && { borderBottomWidth: 0 }]}>
        <Ionicons name="time-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.recordText}>{record.timeString}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roleName}儀錶板</Text>
      <View style={styles.card}>
        {reminders.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const isLast = index === reminders.length - 1;
          const isPeeRecord = item.id === '1';
          return (
            <View key={item.id}>
              <TouchableOpacity 
                style={[styles.item, isExpanded && styles.itemExpanded, (isLast && !isExpanded) && { borderBottomWidth: 0 }]} 
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.itemHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {isPeeRecord && peeRecords.length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{peeRecords.length}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.itemRight}>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
              {isExpanded && (
                <View style={[styles.dropdownContent, isLast && { borderBottomWidth: 0 }]}>
                  {isPeeRecord ? renderPeeRecordsList() : (
                    <Text style={styles.dropdownText}>{item.detail}</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    marginLeft: 5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemExpanded: {
    borderBottomWidth: 0,
    paddingBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  itemTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownContent: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  recordText: {
    fontSize: 14,
    color: colors.text,
  },
});
