import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function PlayerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.dark.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[animeId]/[episodeId]" />
    </Stack>
  );
}
