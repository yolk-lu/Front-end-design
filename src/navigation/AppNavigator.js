import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import AccountScreen from '../screens/MenuModal_PageLists/AccountScreen';
import ESP32ConnectionScreen from '../screens/MenuModal_PageLists/ESP32ConnectionScreen';
import UrgencySuppressionScreen from '../screens/MenuModal_PageLists/UrgencySuppressionScreen';
import TutorialScreen from '../screens/MenuModal_PageLists/TutorialScreen';
import DataExportScreen from '../screens/MenuModal_PageLists/DataExportScreen';
import DoctorRecordImportScreen from '../screens/MenuModal_PageLists/DoctorRecordImportScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="ESP32Connection" component={ESP32ConnectionScreen} />
        <Stack.Screen name="UrgencySuppression" component={UrgencySuppressionScreen} />
        <Stack.Screen name="Tutorial" component={TutorialScreen} />
        <Stack.Screen name="DataExport" component={DataExportScreen} />
        <Stack.Screen name="DoctorRecordImport" component={DoctorRecordImportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
