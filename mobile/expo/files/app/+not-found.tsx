import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-6 bg-white">
        <Text className="text-6xl mb-4">🔍</Text>
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Page Not Found
        </Text>
        <Text className="text-gray-600 text-center mb-6">
          The screen you're looking for doesn't exist.
        </Text>
        <Link href="/" className="bg-blue-500 px-6 py-3 rounded-lg">
          <Text className="text-white font-semibold">Go to Home</Text>
        </Link>
      </View>
    </>
  );
}
