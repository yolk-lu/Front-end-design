// src/screens/DietScreen.js (如果沒有此檔案，請新建它)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DietScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>飲食紀錄功能（開發中）</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        color: '#666',
    },
});