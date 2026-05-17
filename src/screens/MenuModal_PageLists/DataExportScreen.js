import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function DataExportScreen({ navigation }) {
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-18');
  
  const [selections, setSelections] = useState({
    urine: true,
    exercise: false,
    diet: false,
  });

  const [exportFormat, setExportFormat] = useState('excel'); // 'excel' or 'pdf'

  const toggleSelection = (key) => {
    setSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>儀表板資料匯出</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Date Filter Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>匯出時間範圍</Text>
          <View style={styles.datePickerContainer}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>開始日期</Text>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateText}>{startDate}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.dateDivider}>
              <Ionicons name="remove" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>結束日期</Text>
              <TouchableOpacity style={styles.dateButton}>
                <Text style={styles.dateText}>{endDate}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Data Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>選擇匯出資料</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.checkItem} onPress={() => toggleSelection('urine')} activeOpacity={0.7}>
              <Ionicons 
                name={selections.urine ? "checkbox" : "square-outline"} 
                size={24} 
                color={selections.urine ? colors.primary : colors.textSecondary} 
              />
              <Text style={styles.checkLabel}>排尿與尿濕紀錄</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.checkItem} onPress={() => toggleSelection('exercise')} activeOpacity={0.7}>
              <Ionicons 
                name={selections.exercise ? "checkbox" : "square-outline"} 
                size={24} 
                color={selections.exercise ? colors.primary : colors.textSecondary} 
              />
              <Text style={styles.checkLabel}>運動時間紀錄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.checkItem, { borderBottomWidth: 0 }]} onPress={() => toggleSelection('diet')} activeOpacity={0.7}>
              <Ionicons 
                name={selections.diet ? "checkbox" : "square-outline"} 
                size={24} 
                color={selections.diet ? colors.primary : colors.textSecondary} 
              />
              <Text style={styles.checkLabel}>飲食紀錄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Format Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>匯出格式</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.radioItem} onPress={() => setExportFormat('excel')} activeOpacity={0.7}>
              <Ionicons 
                name={exportFormat === 'excel' ? "radio-button-on" : "radio-button-off"} 
                size={24} 
                color={exportFormat === 'excel' ? colors.primary : colors.textSecondary} 
              />
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} style={{ marginLeft: 15, marginRight: 5 }} />
              <Text style={styles.radioLabel}>Excel 試算表 (.xlsx)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.radioItem, { borderBottomWidth: 0 }]} onPress={() => setExportFormat('pdf')} activeOpacity={0.7}>
              <Ionicons 
                name={exportFormat === 'pdf' ? "radio-button-on" : "radio-button-off"} 
                size={24} 
                color={exportFormat === 'pdf' ? colors.primary : colors.textSecondary} 
              />
              <Ionicons name="document-outline" size={20} color={colors.textSecondary} style={{ marginLeft: 15, marginRight: 5 }} />
              <Text style={styles.radioLabel}>PDF 報告文件 (.pdf)</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>產生報表並匯出</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    marginLeft: 5,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  dateBlock: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 5,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 15,
  },
  dateText: {
    fontSize: 14,
    color: colors.text,
  },
  dateDivider: {
    paddingHorizontal: 10,
    paddingBottom: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 15,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.text,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
