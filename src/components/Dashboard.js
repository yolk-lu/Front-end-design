import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Dashboard({ role }) {
  const caregiverReminders = [
    { id: '1', title: '排尿紀錄', time: '10:30 AM' },
    { id: '2', title: '翻身提醒', time: '12:00 PM' },
    { id: '3', title: '尿濕提醒', time: '隨時' },
  ];

  const patientReminders = [
    { id: '1', title: '排尿紀錄', time: '10:30 AM' },
    { id: '2', title: '運動時間紀錄', time: '09:00 AM' },
    { id: '3', title: '尿濕提醒', time: '隨時' },
  ];

  const reminders = role === 'caregiver' ? caregiverReminders : patientReminders;
  const roleName = role === 'caregiver' ? '照護者' : '病患';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roleName}儀錶板</Text>
      <View style={styles.card}>
        {reminders.map(item => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemTime}>{item.time}</Text>
          </View>
        ))}
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
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTitle: {
    fontSize: 16,
    color: colors.text,
  },
  itemTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
