import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';

const resources = [
  {
    title: 'Expo Documentation',
    description: 'Learn the fundamentals of Expo and React Native.',
    url: 'https://docs.expo.dev/',
  },
  {
    title: 'Expo Router',
    description: 'File-based routing for React Native apps.',
    url: 'https://docs.expo.dev/router/introduction/',
  },
  {
    title: 'NativeWind',
    description: 'Use Tailwind CSS in your React Native app.',
    url: 'https://www.nativewind.dev/',
  },
  {
    title: 'React Native',
    description: 'Build native apps using React.',
    url: 'https://reactnative.dev/',
  },
];

export default function ExploreScreen() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Explore Resources
        </Text>
        <Text className="text-gray-600 mb-6">
          Helpful links to get you started with Expo development.
        </Text>

        {resources.map((resource, index) => (
          <TouchableOpacity
            key={index}
            className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
            onPress={() => Linking.openURL(resource.url)}
          >
            <Text className="text-lg font-semibold text-gray-900 mb-1">
              {resource.title}
            </Text>
            <Text className="text-gray-600">{resource.description}</Text>
            <Text className="text-blue-500 mt-2 text-sm">Learn more →</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
