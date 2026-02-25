import { View, Text, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Settings</Text>

        {/* Preferences Section */}
        <Text className="text-sm font-semibold text-gray-500 uppercase mb-3">
          Preferences
        </Text>
        <View className="bg-white rounded-lg mb-6">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <View>
              <Text className="text-gray-900 font-medium">Notifications</Text>
              <Text className="text-gray-500 text-sm">Enable push notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            />
          </View>
          <View className="flex-row justify-between items-center p-4">
            <View>
              <Text className="text-gray-900 font-medium">Dark Mode</Text>
              <Text className="text-gray-500 text-sm">Use dark theme</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            />
          </View>
        </View>

        {/* App Info Section */}
        <Text className="text-sm font-semibold text-gray-500 uppercase mb-3">
          App Info
        </Text>
        <View className="bg-white rounded-lg">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <Text className="text-gray-900">Version</Text>
            <Text className="text-gray-500">
              {Constants.expoConfig?.version || '1.0.0'}
            </Text>
          </View>
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <Text className="text-gray-900">Expo SDK</Text>
            <Text className="text-gray-500">52</Text>
          </View>
          <View className="flex-row justify-between items-center p-4">
            <Text className="text-gray-900">Built with</Text>
            <Text className="text-gray-500">GPP CLI</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
