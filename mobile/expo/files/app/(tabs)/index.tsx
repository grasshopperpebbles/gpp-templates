import { View, Text, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to GPP Expo
        </Text>
        <Text className="text-lg text-gray-600 mb-6">
          This is your Expo app with file-based routing powered by Expo Router.
        </Text>

        <View className="bg-blue-50 p-4 rounded-lg mb-4">
          <Text className="text-blue-800 font-semibold mb-2">
            Getting Started
          </Text>
          <Text className="text-blue-700">
            Edit app/(tabs)/index.tsx to customize this screen.
          </Text>
        </View>

        <View className="bg-green-50 p-4 rounded-lg mb-4">
          <Text className="text-green-800 font-semibold mb-2">
            Styling with NativeWind
          </Text>
          <Text className="text-green-700">
            Use Tailwind CSS classes directly in your components.
          </Text>
        </View>

        <View className="bg-purple-50 p-4 rounded-lg">
          <Text className="text-purple-800 font-semibold mb-2">
            File-based Routing
          </Text>
          <Text className="text-purple-700">
            Create new screens by adding files to the app/ directory.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
