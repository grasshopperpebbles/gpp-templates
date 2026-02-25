# GPP Expo App

A React Native app built with Expo, featuring file-based routing with Expo Router and Tailwind CSS styling via NativeWind.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running the App

After starting the dev server, you can:

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Physical Device**: Scan the QR code with Expo Go app
- **Web**: Press `w` in the terminal

## Project Structure

```
app/
├── _layout.tsx          # Root layout with providers
├── +not-found.tsx       # 404 page
├── (tabs)/              # Tab navigation group
│   ├── _layout.tsx      # Tab bar configuration
│   ├── index.tsx        # Home tab
│   ├── explore.tsx      # Explore tab
│   └── settings.tsx     # Settings tab
components/
├── ThemedText.tsx       # Reusable text component
lib/
├── api.ts               # API client utility
```

## Features

### Expo Router (File-based Routing)

Create new screens by adding files to the `app/` directory:

```tsx
// app/profile.tsx -> accessible at /profile
export default function ProfileScreen() {
  return <View>...</View>;
}
```

### NativeWind (Tailwind CSS)

Style components using Tailwind CSS classes:

```tsx
<View className="flex-1 p-4 bg-white">
  <Text className="text-lg font-bold text-gray-900">Hello</Text>
</View>
```

### API Integration

Use the included API client to connect to your backend:

```tsx
import { api } from '@/lib/api';

// GET request
const { data, error } = await api.get<User[]>('/users');

// POST request
const { data } = await api.post<User>('/users', { name: 'John' });
```

Configure the API URL in your environment:

```bash
# .env.local
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Adding New Screens

1. Create a new file in `app/` directory
2. Export a default React component
3. The file path becomes the route

### Adding New Tabs

1. Add a new file in `app/(tabs)/`
2. Update `app/(tabs)/_layout.tsx` to include the new tab

### Styling

This template uses NativeWind for styling. You can:

- Use Tailwind classes directly: `className="text-lg font-bold"`
- Extend the theme in `tailwind.config.js`
- Use the `ThemedText` component for consistent typography

## Building for Production

```bash
# Create a production build
npx expo export

# Build for app stores (requires EAS)
npx eas build --platform ios
npx eas build --platform android
```

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind](https://www.nativewind.dev/)
- [React Native](https://reactnative.dev/)
