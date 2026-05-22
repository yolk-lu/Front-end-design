// src/screens/ThemeScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
import { Ionicons } from '@expo/vector-icons';
import { setGlobalTheme, useAppTheme } from '../../theme/colors';

export default function ThemeScreen({ navigation }) {
    const { colors, isDarkMode } = useAppTheme();

    // 點選並儲存主題，留在當前畫面，主題即時更新
    const handleSelectTheme = async (mode) => {
        try {
            await setGlobalTheme(mode);
        } catch (e) {
            console.error(e);
        }
    };

    const dynamicStyles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
        headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
        menuText: { fontSize: 16, color: colors.text },
        themeRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border }
    });

    return (
        <SafeAreaView style={dynamicStyles.container}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />

            {/* 頂部標頭列 */}
            <View style={dynamicStyles.header}>
                <TouchableOpacity style={{ width: 40, alignItems: 'flex-start' }} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text
                    style={dynamicStyles.headerTitle}
                    onLayout={(e) => {
                        const { x, width } = e.nativeEvent.layout;
                        const leftDist = x;
                        const rightDist = SCREEN_WIDTH - x - width;
                        {/* console.log(`[主題設定] 左邊距離: ${leftDist}px, 右邊距離: ${rightDist}px, 文字寬度: ${width}px, 螢幕寬度: ${SCREEN_WIDTH}px`); */ }
                    }}
                >主題設定</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* 點選清單 */}
            <View style={{ flex: 1, paddingTop: 10 }}>
                <TouchableOpacity style={dynamicStyles.themeRowItem} onPress={() => handleSelectTheme('light')}>
                    <Text style={[dynamicStyles.menuText, !isDarkMode ? { color: colors.primary, fontWeight: '700' } : null]}>淺色模式</Text>
                    {!isDarkMode && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                </TouchableOpacity>

                <TouchableOpacity style={dynamicStyles.themeRowItem} onPress={() => handleSelectTheme('dark')}>
                    <Text style={[dynamicStyles.menuText, isDarkMode ? { color: colors.primary, fontWeight: '700' } : null]}>深色模式</Text>
                    {isDarkMode && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}